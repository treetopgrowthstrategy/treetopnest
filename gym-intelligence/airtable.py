"""
Airtable REST client.

Wraps just the operations this pipeline needs: lookup-by-Place-ID, upsert,
and a couple of utility queries. Uses field NAMES (not IDs) so the spreadsheet
stays human-editable.

Airtable rate limit: 5 requests/sec per base. We sleep aggressively rather
than try to be clever — this script is not latency-sensitive.
"""
from __future__ import annotations

import logging
import time
from typing import Any, Iterator

import httpx

from config import (
    AIRTABLE_BASE_ID,
    AIRTABLE_PAT,
    AIRTABLE_TABLE_NAME,
    F,
)

log = logging.getLogger("airtable")

API_ROOT = "https://api.airtable.com/v0"
META_ROOT = "https://api.airtable.com/v0/meta/bases"

# Airtable says 5 req/s. We use a 0.25s floor between calls for headroom.
_MIN_INTERVAL = 0.25
_last_call_ts: float = 0.0


def _throttle() -> None:
    global _last_call_ts
    elapsed = time.monotonic() - _last_call_ts
    if elapsed < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - elapsed)
    _last_call_ts = time.monotonic()


def _headers() -> dict[str, str]:
    if not AIRTABLE_PAT:
        raise RuntimeError("AIRTABLE_PAT is not set — check your .env file")
    return {
        "Authorization": f"Bearer {AIRTABLE_PAT}",
        "Content-Type": "application/json",
    }


def _table_url() -> str:
    # Airtable accepts either table ID or URL-encoded table name. Using the name
    # keeps things readable when poking the API by hand.
    from urllib.parse import quote
    return f"{API_ROOT}/{AIRTABLE_BASE_ID}/{quote(AIRTABLE_TABLE_NAME)}"


def _request(method: str, url: str, *, params: dict | None = None, json: dict | None = None) -> dict:
    """Single retrying request. Honors Airtable 429 retry-after."""
    for attempt in range(5):
        _throttle()
        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.request(method, url, headers=_headers(), params=params, json=json)
        except httpx.RequestError as exc:
            wait = 2 ** attempt
            log.warning("Airtable transport error (%s); retrying in %ss", exc, wait)
            time.sleep(wait)
            continue

        if resp.status_code == 429:
            retry_after = float(resp.headers.get("Retry-After", "2"))
            log.warning("Airtable 429; sleeping %ss", retry_after)
            time.sleep(retry_after + 0.5)
            continue

        if resp.status_code >= 500:
            wait = 2 ** attempt
            log.warning("Airtable %s; retrying in %ss (body: %s)", resp.status_code, wait, resp.text[:300])
            time.sleep(wait)
            continue

        if resp.status_code >= 400:
            raise RuntimeError(
                f"Airtable {method} {url} → {resp.status_code}: {resp.text[:500]}"
            )

        return resp.json()

    raise RuntimeError(f"Airtable {method} {url} failed after retries")


# ---------------------------------------------------------------------------
# Reads
# ---------------------------------------------------------------------------

def list_tables() -> list[dict]:
    """Used at startup to verify the target table exists."""
    data = _request("GET", f"{META_ROOT}/{AIRTABLE_BASE_ID}/tables")
    return data.get("tables", [])


def find_record_by_place_id(place_id: str) -> dict | None:
    """
    Return the existing record for this Google Place ID, or None.

    Uses filterByFormula with proper string quoting; the Place ID can contain
    special characters so we escape any embedded single quotes.
    """
    if not place_id:
        return None

    escaped = place_id.replace("'", r"\'")
    formula = f"{{{F.PLACE_ID}}} = '{escaped}'"
    data = _request(
        "GET",
        _table_url(),
        params={"filterByFormula": formula, "maxRecords": 1},
    )
    records = data.get("records", [])
    return records[0] if records else None


def iter_records_for_enrichment(stale_cutoff_iso: str) -> Iterator[dict]:
    """
    Yield records that need Phase 2 enrichment:
      - Scrape Status == "Pending", OR
      - Last Updated is older than stale_cutoff_iso (ISO8601).
    """
    # IS_BEFORE on dates accepts ISO; checkbox/empty status is handled too.
    formula = (
        f"OR("
        f"{{{F.SCRAPE_STATUS}}} = 'Pending',"
        f"{{{F.SCRAPE_STATUS}}} = '',"
        f"IS_BEFORE({{{F.LAST_UPDATED}}}, '{stale_cutoff_iso}')"
        f")"
    )
    offset: str | None = None
    while True:
        params: dict[str, Any] = {
            "filterByFormula": formula,
            "pageSize": 100,
        }
        if offset:
            params["offset"] = offset
        data = _request("GET", _table_url(), params=params)
        for rec in data.get("records", []):
            yield rec
        offset = data.get("offset")
        if not offset:
            return


# ---------------------------------------------------------------------------
# Writes
# ---------------------------------------------------------------------------

def create_record(fields: dict[str, Any]) -> dict:
    payload = {"fields": _clean_fields(fields), "typecast": True}
    return _request("POST", _table_url(), json=payload)


def update_record(record_id: str, fields: dict[str, Any]) -> dict:
    url = f"{_table_url()}/{record_id}"
    payload = {"fields": _clean_fields(fields), "typecast": True}
    return _request("PATCH", url, json=payload)


def upsert_by_place_id(place_id: str, fields: dict[str, Any]) -> tuple[str, dict]:
    """
    Create-or-update on Google Place ID.

    Returns (action, record) where action is one of "created" | "updated".
    """
    existing = find_record_by_place_id(place_id)
    if existing:
        # Don't clobber Date Added on update — only set Last Updated.
        fields.pop(F.DATE_ADDED, None)
        rec = update_record(existing["id"], fields)
        return ("updated", rec)
    rec = create_record(fields)
    return ("created", rec)


def _clean_fields(fields: dict[str, Any]) -> dict[str, Any]:
    """Drop keys with None values so we don't overwrite existing data with nulls."""
    return {k: v for k, v in fields.items() if v is not None and v != ""}


# ---------------------------------------------------------------------------
# Self-check
# ---------------------------------------------------------------------------

def verify_table_access() -> None:
    """
    Confirm the configured table is reachable. Logs the field list so any
    schema drift (rename, etc.) is obvious in the run log.
    """
    tables = list_tables()
    match = next((t for t in tables if t["name"] == AIRTABLE_TABLE_NAME), None)
    if not match:
        names = [t["name"] for t in tables]
        raise RuntimeError(
            f"Table '{AIRTABLE_TABLE_NAME}' not found in base {AIRTABLE_BASE_ID}. "
            f"Found: {names}"
        )
    field_names = [f["name"] for f in match["fields"]]
    log.info("Airtable OK — '%s' has %d fields", AIRTABLE_TABLE_NAME, len(field_names))
    log.debug("Fields: %s", field_names)
