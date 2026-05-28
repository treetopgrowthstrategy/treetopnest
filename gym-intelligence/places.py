"""
Google Places API v1 client (places.googleapis.com).

Matches the endpoint already used by use-billy's find-prospects.ts so behavior
and quota usage are consistent across both pipelines.

Exposes:
  discover_in_market(market: str) -> list[dict]
      Runs all configured SEARCH_TERMS against the market, dedupes by Place ID,
      and returns one normalized dict per gym ready for Airtable.
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Any

import httpx

from config import (
    F,
    GOOGLE_PLACES_API_KEY,
    PLACES_MAX_PAGES_PER_TERM,
    PLACES_REQUEST_TIMEOUT,
    SEARCH_TERMS,
)

log = logging.getLogger("places")

SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"

# Field mask — comma-separated paths into the response. Costs more for richer
# data tiers ("Advanced" / "Preferred") so keep this lean if quota matters.
FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.addressComponents",
    "places.nationalPhoneNumber",
    "places.websiteUri",
    "places.rating",
    "places.userRatingCount",
    "places.priceLevel",
    "places.googleMapsUri",
    "places.businessStatus",
    "places.location",
    "places.regularOpeningHours",
    "nextPageToken",
])

# Map Places API v1 enum → display string used by our Airtable single-select
PRICE_LEVEL_MAP = {
    "PRICE_LEVEL_FREE": "$",
    "PRICE_LEVEL_INEXPENSIVE": "$",
    "PRICE_LEVEL_MODERATE": "$$",
    "PRICE_LEVEL_EXPENSIVE": "$$$",
    "PRICE_LEVEL_VERY_EXPENSIVE": "$$$$",
}


def _headers() -> dict[str, str]:
    if not GOOGLE_PLACES_API_KEY:
        raise RuntimeError("GOOGLE_PLACES_API_KEY is not set — check your .env file")
    return {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
    }


def _text_search(query: str, page_token: str | None = None) -> dict:
    body: dict[str, Any] = {"textQuery": query, "maxResultCount": 20}
    if page_token:
        body["pageToken"] = page_token
    with httpx.Client(timeout=PLACES_REQUEST_TIMEOUT) as client:
        resp = client.post(SEARCH_URL, headers=_headers(), json=body)
    if resp.status_code != 200:
        raise RuntimeError(f"Places {resp.status_code}: {resp.text[:500]}")
    return resp.json()


def _search_all_pages(query: str) -> list[dict]:
    """Paginate up to PLACES_MAX_PAGES_PER_TERM pages for one text query."""
    results: list[dict] = []
    token: str | None = None
    for page in range(PLACES_MAX_PAGES_PER_TERM):
        try:
            data = _text_search(query, page_token=token)
        except Exception as exc:
            log.warning('Places search "%s" page %d failed: %s', query, page, exc)
            break
        page_results = data.get("places", []) or []
        results.extend(page_results)
        token = data.get("nextPageToken")
        if not token:
            break
        # Places API requires a brief delay before the next pageToken is valid.
        time.sleep(2.0)
    log.info('Places search "%s" → %d results across %d page(s)', query, len(results), page + 1)
    return results


# ---------------------------------------------------------------------------
# Normalization — convert raw API shape → Airtable field dict
# ---------------------------------------------------------------------------

def _parse_city_state(address_components: list[dict] | None) -> tuple[str | None, str | None]:
    if not address_components:
        return (None, None)
    city: str | None = None
    state: str | None = None
    for comp in address_components:
        types = set(comp.get("types") or [])
        if not city and ("locality" in types or "postal_town" in types):
            city = comp.get("longText") or comp.get("shortText")
        if not state and "administrative_area_level_1" in types:
            state = comp.get("shortText") or comp.get("longText")
    return (city, state)


def _format_hours(regular_opening_hours: dict | None) -> str | None:
    if not regular_opening_hours:
        return None
    weekday = regular_opening_hours.get("weekdayDescriptions") or []
    return "\n".join(weekday) if weekday else None


def _build_maps_url(place_id: str, raw_url: str | None) -> str | None:
    if raw_url:
        return raw_url
    if place_id:
        return f"https://www.google.com/maps/place/?q=place_id:{place_id}"
    return None


def normalize_place(place: dict, market: str) -> dict[str, Any] | None:
    """Convert a Places API v1 'place' object to an Airtable-ready field dict.

    Returns None for unusable results (no Place ID).
    """
    place_id = place.get("id")
    if not place_id:
        return None

    display = place.get("displayName") or {}
    name = display.get("text") or ""
    if not name:
        return None

    city, state = _parse_city_state(place.get("addressComponents"))
    location = place.get("location") or {}
    now_iso = datetime.now(timezone.utc).isoformat()

    price_raw = place.get("priceLevel")
    price_display = PRICE_LEVEL_MAP.get(price_raw) if price_raw else None

    fields: dict[str, Any] = {
        F.GYM_NAME: name,
        F.PLACE_ID: place_id,
        F.FULL_ADDRESS: place.get("formattedAddress"),
        F.CITY: city,
        F.STATE: state,
        F.MARKET: market,
        F.PHONE: place.get("nationalPhoneNumber"),
        F.WEBSITE: place.get("websiteUri"),
        F.RATING: place.get("rating"),
        F.REVIEW_COUNT: place.get("userRatingCount"),
        F.PRICE_LEVEL: price_display,
        F.MAPS_URL: _build_maps_url(place_id, place.get("googleMapsUri")),
        F.BUSINESS_STATUS: place.get("businessStatus"),
        F.LATITUDE: location.get("latitude"),
        F.LONGITUDE: location.get("longitude"),
        F.OPENING_HOURS: _format_hours(place.get("regularOpeningHours")),
        F.DATE_ADDED: now_iso,
        F.LAST_UPDATED: now_iso,
        F.SCRAPE_STATUS: "Pending",
    }
    return fields


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def discover_in_market(market: str) -> list[dict[str, Any]]:
    """
    Run all configured search terms against this market, dedupe by Place ID,
    and return normalized records.
    """
    seen_ids: set[str] = set()
    normalized: list[dict[str, Any]] = []

    for term in SEARCH_TERMS:
        query = f"{term} in {market}"
        raw = _search_all_pages(query)
        for place in raw:
            # Skip permanently closed
            if place.get("businessStatus") == "CLOSED_PERMANENTLY":
                continue
            place_id = place.get("id")
            if not place_id or place_id in seen_ids:
                continue
            seen_ids.add(place_id)
            record = normalize_place(place, market)
            if record:
                normalized.append(record)

    log.info("Market '%s' → %d unique gyms after dedup", market, len(normalized))
    return normalized
