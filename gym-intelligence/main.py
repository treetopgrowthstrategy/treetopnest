"""
Entry point for the Gym Intelligence pipeline.

Default behavior (no flags): run the *next* market in rotation, advance state,
exit. Designed to be invoked by GitHub Actions / cron once per week.

CLI flags:
  --market "Chicago"   Run Phase 1+2 for one specific market.
  --all-markets        Run Phase 1+2 for every market in MARKETS (heavy).
  --enrich-only        Skip Phase 1 discovery; only run Phase 2 on Pending
                       or stale records already in Airtable.
  --no-enrich          Run Phase 1 only; don't enrich after discovery.
  --max-per-market N   Cap how many new gyms get upserted per market this run.
  --daemon             Stay running with APScheduler; fire on the configured
                       weekly schedule. Useful for local always-on machines.
"""
from __future__ import annotations

import argparse
import json
import logging
import logging.handlers
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

import airtable
import places
import scraper
from config import (
    F,
    LOG_FILE,
    MARKETS,
    SCHEDULE_DAY_OF_WEEK,
    SCHEDULE_HOUR,
    SCHEDULE_TIMEZONE,
    SCRAPE_RETRY_AFTER_DAYS,
    STATE_FILE,
)

log = logging.getLogger("main")


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def setup_logging() -> None:
    root = logging.getLogger()
    root.setLevel(logging.INFO)

    fmt = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-7s | %(name)-9s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Rotating file
    fh = logging.handlers.RotatingFileHandler(
        LOG_FILE, maxBytes=5_000_000, backupCount=5, encoding="utf-8"
    )
    fh.setFormatter(fmt)
    root.addHandler(fh)

    # Stderr
    sh = logging.StreamHandler(sys.stderr)
    sh.setFormatter(fmt)
    root.addHandler(sh)


# ---------------------------------------------------------------------------
# State (which market was processed last)
# ---------------------------------------------------------------------------

def _load_state() -> dict:
    if not STATE_FILE.exists():
        return {"last_market_index": -1, "last_run_timestamp": None, "last_market": None, "runs": []}
    try:
        return json.loads(STATE_FILE.read_text())
    except Exception as exc:
        log.warning("Could not read state.json (%s); starting fresh", exc)
        return {"last_market_index": -1, "last_run_timestamp": None, "last_market": None, "runs": []}


def _save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2) + "\n")


def _next_market_from_state(state: dict) -> str:
    idx = state.get("last_market_index", -1)
    next_idx = (idx + 1) % len(MARKETS)
    return MARKETS[next_idx]


def _advance_state(state: dict, market: str, summary: "RunSummary") -> None:
    next_idx = (MARKETS.index(market)) if market in MARKETS else state.get("last_market_index", -1)
    state["last_market_index"] = next_idx
    state["last_market"] = market
    state["last_run_timestamp"] = datetime.now(timezone.utc).isoformat()
    runs = state.setdefault("runs", [])
    runs.append({"market": market, "ts": state["last_run_timestamp"], **summary.as_dict()})
    # Keep tail bounded so state.json doesn't grow unbounded
    state["runs"] = runs[-50:]
    _save_state(state)


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

@dataclass
class RunSummary:
    market: str = ""
    discovered: int = 0
    created: int = 0
    updated: int = 0
    enrich_attempted: int = 0
    enrich_scraped: int = 0
    enrich_failed: int = 0
    enrich_skipped: int = 0
    errors: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "discovered": self.discovered,
            "created": self.created,
            "updated": self.updated,
            "enrich_attempted": self.enrich_attempted,
            "enrich_scraped": self.enrich_scraped,
            "enrich_failed": self.enrich_failed,
            "enrich_skipped": self.enrich_skipped,
            "errors": self.errors[-10:],  # tail
        }

    def log(self) -> None:
        log.info(
            "SUMMARY [%s]: discovered=%d, created=%d, updated=%d, "
            "enriched=%d (scraped=%d, failed=%d, skipped=%d), errors=%d",
            self.market,
            self.discovered,
            self.created,
            self.updated,
            self.enrich_attempted,
            self.enrich_scraped,
            self.enrich_failed,
            self.enrich_skipped,
            len(self.errors),
        )


# ---------------------------------------------------------------------------
# Phase 1 — Discovery for a market
# ---------------------------------------------------------------------------

def discover_market(market: str, max_per_market: int | None, summary: RunSummary) -> list[str]:
    """
    Discover gyms in `market` via Places API, upsert each into Airtable.
    Returns the list of Place IDs that were created or updated this run.
    """
    log.info("Phase 1: discovering gyms in %s", market)
    try:
        records = places.discover_in_market(market)
    except Exception as exc:
        log.exception("Places discovery for %s failed", market)
        summary.errors.append(f"places.discover_in_market({market}): {exc}")
        return []

    if max_per_market is not None:
        records = records[:max_per_market]
    summary.discovered = len(records)

    touched_ids: list[str] = []
    for fields in records:
        place_id = fields.get(F.PLACE_ID, "")
        gym_name = fields.get(F.GYM_NAME, "<unknown>")
        try:
            action, _ = airtable.upsert_by_place_id(place_id, fields)
            if action == "created":
                summary.created += 1
                log.info("created: %s (%s)", gym_name, place_id)
            else:
                summary.updated += 1
                log.info("updated: %s (%s)", gym_name, place_id)
            touched_ids.append(place_id)
        except Exception as exc:
            log.exception("Airtable upsert failed for %s", gym_name)
            summary.errors.append(f"upsert {gym_name}: {exc}")

    return touched_ids


# ---------------------------------------------------------------------------
# Phase 2 — Enrichment
# ---------------------------------------------------------------------------

def enrich_pending(summary: RunSummary, limit: int | None = None) -> None:
    """
    Iterate over all records that are Pending or stale (Last Updated older
    than SCRAPE_RETRY_AFTER_DAYS) and run the website scraper on each.
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(days=SCRAPE_RETRY_AFTER_DAYS)).isoformat()
    log.info("Phase 2: enriching Pending + stale (before %s)", cutoff)

    processed = 0
    for rec in airtable.iter_records_for_enrichment(cutoff):
        if limit is not None and processed >= limit:
            log.info("Hit enrichment limit (%d); stopping", limit)
            break
        summary.enrich_attempted += 1
        gym_name = rec.get("fields", {}).get(F.GYM_NAME, "<unknown>")
        try:
            updates = scraper.enrich_record(rec)
            airtable.update_record(rec["id"], updates)
            status = updates.get(F.SCRAPE_STATUS)
            if status == "Scraped":
                summary.enrich_scraped += 1
            elif status == "Failed":
                summary.enrich_failed += 1
            else:
                summary.enrich_skipped += 1
            log.info("enriched %s → %s", gym_name, status)
        except Exception as exc:
            log.exception("Enrichment failed for %s", gym_name)
            summary.errors.append(f"enrich {gym_name}: {exc}")
        processed += 1
        # Polite delay is enforced inside scraper._polite_sleep — no need here.


# ---------------------------------------------------------------------------
# Top-level run modes
# ---------------------------------------------------------------------------

def run_for_market(
    market: str,
    *,
    do_discover: bool = True,
    do_enrich: bool = True,
    max_per_market: int | None = None,
    enrich_limit: int | None = None,
) -> RunSummary:
    summary = RunSummary(market=market)

    if do_discover:
        discover_market(market, max_per_market, summary)

    if do_enrich:
        enrich_pending(summary, limit=enrich_limit)

    summary.log()
    return summary


def run_next_market(**kwargs) -> RunSummary:
    state = _load_state()
    market = _next_market_from_state(state)
    log.info("Rotating market — next up: %s", market)
    summary = run_for_market(market, **kwargs)
    _advance_state(state, market, summary)
    return summary


def run_all_markets(**kwargs) -> list[RunSummary]:
    state = _load_state()
    summaries: list[RunSummary] = []
    for market in MARKETS:
        summary = run_for_market(market, **kwargs)
        summaries.append(summary)
        _advance_state(state, market, summary)
    return summaries


def run_enrich_only(enrich_limit: int | None = None) -> RunSummary:
    summary = RunSummary(market="<enrich-only>")
    enrich_pending(summary, limit=enrich_limit)
    summary.log()
    return summary


# ---------------------------------------------------------------------------
# Daemon mode
# ---------------------------------------------------------------------------

def run_daemon() -> None:
    from apscheduler.schedulers.blocking import BlockingScheduler
    from apscheduler.triggers.cron import CronTrigger

    sched = BlockingScheduler(timezone=SCHEDULE_TIMEZONE)
    sched.add_job(
        lambda: run_next_market(),
        CronTrigger(day_of_week=SCHEDULE_DAY_OF_WEEK, hour=SCHEDULE_HOUR, minute=0),
        id="weekly-gym-scan",
        replace_existing=True,
    )
    log.info(
        "Daemon started — will run every %s at %02d:00 %s",
        SCHEDULE_DAY_OF_WEEK,
        SCHEDULE_HOUR,
        SCHEDULE_TIMEZONE,
    )
    try:
        sched.start()
    except (KeyboardInterrupt, SystemExit):
        log.info("Daemon stopped")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Gym Intelligence pipeline")
    g = p.add_mutually_exclusive_group()
    g.add_argument("--market", help="Process this specific market and exit")
    g.add_argument("--all-markets", action="store_true", help="Process every market in MARKETS")
    g.add_argument("--enrich-only", action="store_true", help="Skip Phase 1; run Phase 2 only")
    g.add_argument("--daemon", action="store_true", help="Run the APScheduler daemon")
    p.add_argument("--no-enrich", action="store_true", help="Skip Phase 2 after discovery")
    p.add_argument("--max-per-market", type=int, default=None, help="Cap new gyms per market")
    p.add_argument("--enrich-limit", type=int, default=None, help="Cap enrichments per run")
    return p.parse_args()


def main() -> int:
    setup_logging()
    args = parse_args()
    do_enrich = not args.no_enrich

    start = time.monotonic()
    log.info("=== Gym Intelligence run started ===")
    try:
        # Validate Airtable up front — better to fail fast than after Places quota is burned
        airtable.verify_table_access()

        if args.daemon:
            run_daemon()
        elif args.enrich_only:
            run_enrich_only(enrich_limit=args.enrich_limit)
        elif args.all_markets:
            run_all_markets(
                do_discover=True,
                do_enrich=do_enrich,
                max_per_market=args.max_per_market,
                enrich_limit=args.enrich_limit,
            )
        elif args.market:
            summary = run_for_market(
                args.market,
                do_discover=True,
                do_enrich=do_enrich,
                max_per_market=args.max_per_market,
                enrich_limit=args.enrich_limit,
            )
            # Manual single-market run also advances state so the rotation
            # picks up where the human left off.
            state = _load_state()
            _advance_state(state, args.market, summary)
        else:
            run_next_market(
                do_discover=True,
                do_enrich=do_enrich,
                max_per_market=args.max_per_market,
                enrich_limit=args.enrich_limit,
            )
    except Exception as exc:
        log.exception("Run aborted: %s", exc)
        return 1

    elapsed = time.monotonic() - start
    log.info("=== Run finished in %.1fs ===", elapsed)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
