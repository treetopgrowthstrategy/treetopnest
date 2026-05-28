"""
Website scraping + Claude extraction (Phase 2 enrichment).

For each gym record with a website:
  1. Honor robots.txt
  2. Fetch homepage with a rotating real-browser UA
  3. If the homepage text is thin, also try /about, /classes, /amenities, /equipment
  4. Strip HTML to readable text via BeautifulSoup
  5. Send to Claude with an extraction prompt → JSON
  6. Return an Airtable field dict (or a Failed/Skipped status with notes)

Failure modes are folded into Scrape Status + Scrape Notes — the orchestrator
in main.py doesn't need to distinguish.
"""
from __future__ import annotations

import json
import logging
import random
import re
import time
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import httpx
from anthropic import Anthropic
from bs4 import BeautifulSoup

from config import (
    ANTHROPIC_API_KEY,
    ANTHROPIC_MAX_TOKENS,
    ANTHROPIC_MODEL,
    F,
    SCRAPE_MAX_DELAY_SECONDS,
    SCRAPE_MAX_PAGE_CHARS,
    SCRAPE_MIN_DELAY_SECONDS,
    SCRAPE_REQUEST_TIMEOUT,
    SCRAPE_SUBPATHS,
)

log = logging.getLogger("scraper")

# Lazy-load fake-useragent only when actually needed (its data file fetch can fail).
_UA_FALLBACKS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
]


def _user_agent() -> str:
    try:
        from fake_useragent import UserAgent
        return UserAgent().random
    except Exception:
        return random.choice(_UA_FALLBACKS)


# ---------------------------------------------------------------------------
# Rate limiting (politeness)
# ---------------------------------------------------------------------------

_last_fetch_ts: float = 0.0


def _polite_sleep() -> None:
    global _last_fetch_ts
    elapsed = time.monotonic() - _last_fetch_ts
    delay = random.uniform(SCRAPE_MIN_DELAY_SECONDS, SCRAPE_MAX_DELAY_SECONDS)
    if elapsed < delay:
        time.sleep(delay - elapsed)
    _last_fetch_ts = time.monotonic()


# ---------------------------------------------------------------------------
# robots.txt
# ---------------------------------------------------------------------------

_robots_cache: dict[str, RobotFileParser | None] = {}


def _robots_for(url: str) -> RobotFileParser | None:
    """Return parsed robots.txt for the URL's origin, or None if unavailable."""
    parsed = urlparse(url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    if origin in _robots_cache:
        return _robots_cache[origin]
    rp = RobotFileParser()
    try:
        with httpx.Client(timeout=10.0, follow_redirects=True) as client:
            resp = client.get(f"{origin}/robots.txt", headers={"User-Agent": _user_agent()})
        if resp.status_code == 200:
            rp.parse(resp.text.splitlines())
            _robots_cache[origin] = rp
            return rp
    except Exception as exc:
        log.debug("robots.txt fetch for %s failed: %s", origin, exc)
    _robots_cache[origin] = None
    return None


def _allowed_by_robots(url: str) -> bool:
    rp = _robots_for(url)
    if rp is None:
        # Absent / unreadable robots = allowed.
        return True
    return rp.can_fetch("*", url)


# ---------------------------------------------------------------------------
# Fetch + text extraction
# ---------------------------------------------------------------------------

def _fetch_text(url: str) -> tuple[str | None, str | None]:
    """
    Fetch URL → (clean_text, error). On success, error is None.

    Strips scripts/styles, collapses whitespace.
    """
    if not _allowed_by_robots(url):
        return (None, f"blocked by robots.txt: {url}")

    _polite_sleep()
    try:
        with httpx.Client(timeout=SCRAPE_REQUEST_TIMEOUT, follow_redirects=True) as client:
            resp = client.get(url, headers={"User-Agent": _user_agent()})
    except httpx.TimeoutException:
        return (None, f"timeout: {url}")
    except httpx.RequestError as exc:
        return (None, f"transport error: {exc}")

    if resp.status_code >= 400:
        return (None, f"HTTP {resp.status_code}: {url}")

    ctype = resp.headers.get("Content-Type", "")
    if "html" not in ctype.lower() and "text" not in ctype.lower():
        return (None, f"non-HTML content type: {ctype}")

    text = _html_to_text(resp.text)
    return (text, None)


def _html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "noscript", "svg", "iframe"]):
        tag.decompose()

    # Try to keep meaningful link text + headings; BS get_text("\n") is fine.
    raw = soup.get_text("\n", strip=True)
    # Collapse blank lines and trim
    lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
    return "\n".join(lines)


def _gather_site_text(website_url: str) -> tuple[str, list[str]]:
    """
    Fetch homepage + best-effort subpages. Returns (combined_text, errors).
    Subpages are only attempted if homepage text looks thin (< 1500 chars).
    """
    errors: list[str] = []
    parts: list[str] = []

    home_text, err = _fetch_text(website_url)
    if err:
        errors.append(err)
    if home_text:
        parts.append(f"### Homepage\n{home_text}")

    home_len = len(home_text or "")
    if home_len < 1500:
        for sub in SCRAPE_SUBPATHS:
            sub_url = urljoin(website_url, sub)
            sub_text, err = _fetch_text(sub_url)
            if err:
                # Don't spam errors for every missing subpath — only log debug
                log.debug("subpath %s skipped: %s", sub_url, err)
                continue
            if sub_text:
                parts.append(f"### {sub}\n{sub_text}")
            # Stop once we've collected ~enough
            if sum(len(p) for p in parts) > SCRAPE_MAX_PAGE_CHARS:
                break

    combined = "\n\n".join(parts)
    if len(combined) > SCRAPE_MAX_PAGE_CHARS:
        combined = combined[:SCRAPE_MAX_PAGE_CHARS] + "\n[...truncated]"
    return (combined, errors)


# ---------------------------------------------------------------------------
# Claude extraction
# ---------------------------------------------------------------------------

_anthropic_client: Anthropic | None = None


def _anthropic() -> Anthropic:
    global _anthropic_client
    if _anthropic_client is None:
        if not ANTHROPIC_API_KEY:
            raise RuntimeError("ANTHROPIC_API_KEY is not set — check your .env file")
        _anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)
    return _anthropic_client


EXTRACTION_SYSTEM_PROMPT = """You are a gym intelligence analyst. You will be given the raw text content scraped from a gym or fitness club website. Extract the following structured information and return ONLY a valid JSON object with no preamble, no markdown, and no explanation.

Fields to extract:
- equipment_brands: array of strings — any fitness equipment brand names mentioned (e.g., Life Fitness, Rogue, Technogym, Peloton, Matrix, Hammer Strength, Precor, Cybex, StairMaster, Woodway, Concept2, Assault Fitness). Only include brands that are actually mentioned in the text.
- amenities: array of strings — any amenities mentioned (e.g., sauna, steam room, pool, childcare, basketball, racquetball, locker rooms, towel service, smoothie bar, tanning, parking, recovery lounge)
- group_classes: array of strings — any group fitness class types mentioned (e.g., HIIT, spin, yoga, Pilates, Zumba, boxing, barre, CrossFit, boot camp, aqua aerobics)
- membership_pricing: string — any pricing information found (monthly rates, initiation fees, tiers), or null if none
- facility_type: one of ["Independent", "Franchise", "Studio", "YMCA/Non-Profit", "Corporate Chain", "Unknown"]
- specialty: string — any notable focus or specialty (e.g., "CrossFit affiliate", "boxing-only", "women-only", "strength-focused"), or null
- social_links: array of strings — any Instagram, Facebook, TikTok, or X/Twitter URLs found

If a field cannot be determined from the text, return null or an empty array. Do not guess. Output ONLY the JSON object."""


def _extract_with_claude(site_text: str) -> tuple[dict | None, str | None]:
    """Call Claude → parsed JSON, or (None, error_message)."""
    if not site_text.strip():
        return (None, "no scrapeable text")

    try:
        resp = _anthropic().messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=ANTHROPIC_MAX_TOKENS,
            system=EXTRACTION_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": site_text}],
        )
    except Exception as exc:
        return (None, f"anthropic API error: {exc}")

    # The model is instructed to return only JSON, but be defensive about markdown fences.
    text_parts = [b.text for b in resp.content if getattr(b, "type", None) == "text"]
    raw = "".join(text_parts).strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        return (None, f"invalid JSON from Claude: {exc}: {raw[:200]}")

    if not isinstance(data, dict):
        return (None, f"extraction returned non-object: {type(data).__name__}")

    return (data, None)


# ---------------------------------------------------------------------------
# Field mapping
# ---------------------------------------------------------------------------

def _as_comma_list(value: Any) -> str | None:
    if not value:
        return None
    if isinstance(value, list):
        items = [str(v).strip() for v in value if str(v).strip()]
        return ", ".join(items) if items else None
    if isinstance(value, str):
        return value.strip() or None
    return str(value)


def _normalize_facility_type(value: Any) -> str:
    allowed = {"Independent", "Franchise", "Studio", "YMCA/Non-Profit", "Corporate Chain", "Unknown"}
    if isinstance(value, str) and value in allowed:
        return value
    return "Unknown"


def extract_field_updates(extracted: dict, scrape_errors: list[str]) -> dict[str, Any]:
    """Translate Claude's JSON into Airtable field updates."""
    notes_bits = list(scrape_errors)  # propagate any soft errors as notes
    return {
        F.EQUIPMENT_BRANDS: _as_comma_list(extracted.get("equipment_brands")),
        F.AMENITIES: _as_comma_list(extracted.get("amenities")),
        F.GROUP_CLASSES: _as_comma_list(extracted.get("group_classes")),
        F.PRICING: extracted.get("membership_pricing") or None,
        F.FACILITY_TYPE: _normalize_facility_type(extracted.get("facility_type")),
        F.SPECIALTY: extracted.get("specialty") or None,
        F.SOCIAL_LINKS: _as_comma_list(extracted.get("social_links")),
        F.SCRAPE_NOTES: "; ".join(notes_bits) if notes_bits else None,
    }


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def enrich_record(record: dict) -> dict[str, Any]:
    """
    Run Phase 2 enrichment for one Airtable record.

    Returns a dict of field updates ready for airtable.update_record(), always
    including Scrape Status + Last Updated.
    """
    fields = record.get("fields", {})
    website = fields.get(F.WEBSITE)
    now_iso = datetime.now(timezone.utc).isoformat()

    base_update: dict[str, Any] = {F.LAST_UPDATED: now_iso}

    if not website:
        return {**base_update, F.SCRAPE_STATUS: "Skipped", F.SCRAPE_NOTES: "no website on record"}

    if not _allowed_by_robots(website):
        return {**base_update, F.SCRAPE_STATUS: "Skipped", F.SCRAPE_NOTES: "blocked by robots.txt"}

    site_text, errors = _gather_site_text(website)
    if not site_text.strip():
        note = "; ".join(errors) if errors else "site returned no readable text (likely JS-only)"
        return {**base_update, F.SCRAPE_STATUS: "Failed", F.SCRAPE_NOTES: note}

    extracted, err = _extract_with_claude(site_text)
    if err:
        return {**base_update, F.SCRAPE_STATUS: "Failed", F.SCRAPE_NOTES: err}

    updates = extract_field_updates(extracted, errors)
    return {**base_update, **updates, F.SCRAPE_STATUS: "Scraped"}
