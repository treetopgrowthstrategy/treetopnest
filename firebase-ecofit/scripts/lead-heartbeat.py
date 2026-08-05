#!/usr/bin/env python3
"""
Lead heartbeat for the ecofit forms.

Answers one question a broken form cannot fake: has anything actually arrived
lately? Today a dead endpoint and a quiet week look identical from the outside,
which is how the 2026-08-05 outage ran unnoticed and how the quote form reached
2026-08-05 with four records in it, all of them tests.

    export AIRTABLE_API_KEY=...
    python3 scripts/lead-heartbeat.py                 # default 7-day window
    python3 scripts/lead-heartbeat.py --days 14
    python3 scripts/lead-heartbeat.py --quiet         # only print problems

Exit codes, so this can be scheduled and alert on failure:
    0  every table saw at least one real submission in the window
    1  at least one table was silent, or only received test records
    2  could not check (no key, network failure, bad table name)

Test records are identified and excluded rather than counted, because a table
full of your own smoke tests is still a table with no leads in it.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

BASE_ID = "app0cpbQjtdZh1sHT"

# Tables the ecofit forms write to. Named rather than discovered, so a table
# quietly disappearing is itself a failure the check reports.
TABLES = [
    "Ecofit Quote Requests",
    "Ecofit Assessments",
    "Ecofit Report Downloads",
]

# Tables whose endpoint is not deployed yet. Silence here is expected, so it is
# reported as information and does not fail the run. A check that is always red
# gets ignored, and an ignored check is the same as no check at all. Remove a
# table from this set the moment its endpoint goes live, otherwise the heartbeat
# will keep excusing a real outage.
NOT_YET_LIVE = {
    # ecofit-report-submit is written but unpushed, so nothing writes here yet.
    "Ecofit Report Downloads",
}

# A submission containing any of these is one of ours, not a prospect.
TEST_MARKERS = ("smoke test", "test -", "test-", "qa ", "safe to delete", "+ecofit-", "example.com")

API = "https://api.airtable.com/v0"


def looks_like_test(record: dict) -> bool:
    blob = json.dumps(record.get("fields", {})).lower()
    return any(marker in blob for marker in TEST_MARKERS)


def fetch_recent(table: str, since: datetime, key: str) -> tuple[list[dict] | None, str]:
    formula = f"IS_AFTER(CREATED_TIME(), '{since.strftime('%Y-%m-%dT%H:%M:%SZ')}')"
    url = f"{API}/{BASE_ID}/{urllib.parse.quote(table)}?" + urllib.parse.urlencode(
        {"filterByFormula": formula, "pageSize": 100}
    )
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {key}"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r).get("records", []), ""
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:200]
        return None, f"HTTP {e.code}: {detail}"
    except Exception as e:
        return None, str(e)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=7, help="window to check (default 7)")
    ap.add_argument("--quiet", action="store_true", help="only print problems")
    args = ap.parse_args()

    key = os.environ.get("AIRTABLE_API_KEY")
    if not key:
        print("heartbeat: AIRTABLE_API_KEY is not set, cannot check.", file=sys.stderr)
        return 2

    since = datetime.now(timezone.utc) - timedelta(days=args.days)
    if not args.quiet:
        print(f"heartbeat: submissions since {since:%Y-%m-%d %H:%M} UTC ({args.days}d)\n")

    silent: list[str] = []
    errors: list[str] = []

    for table in TABLES:
        records, err = fetch_recent(table, since, key)
        if records is None:
            errors.append(f"{table}: {err}")
            print(f"  [ERR ] {table}: {err}")
            continue

        tests = [r for r in records if looks_like_test(r)]
        real = [r for r in records if not looks_like_test(r)]

        if real:
            if not args.quiet:
                note = f" (+{len(tests)} test)" if tests else ""
                print(f"  [ok  ] {table}: {len(real)} real{note}")
        elif table in NOT_YET_LIVE:
            if not args.quiet:
                print(f"  [--  ] {table}: no endpoint deployed yet, silence expected")
        else:
            silent.append(table)
            note = f", {len(tests)} test-only" if tests else ""
            print(f"  [FAIL] {table}: no real submissions in {args.days}d{note}")

    if errors:
        print(f"\nheartbeat: {len(errors)} table(s) could not be checked.")
        return 2
    if silent:
        print(
            f"\nheartbeat: {len(silent)} table(s) silent for {args.days}d. "
            "Either the form is broken or demand genuinely stopped. "
            "Run scripts/preflight.py to tell those two apart."
        )
        return 1
    if not args.quiet:
        print("\nheartbeat: all tables received real submissions.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
