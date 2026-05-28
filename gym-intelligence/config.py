"""
Configuration for the Gym Intelligence pipeline.

Everything tunable lives here. API keys are read from environment via .env.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# API credentials (read from .env or environment)
# ---------------------------------------------------------------------------
GOOGLE_PLACES_API_KEY: str = os.environ.get("GOOGLE_PLACES_API_KEY", "")
ANTHROPIC_API_KEY: str = os.environ.get("ANTHROPIC_API_KEY", "")
AIRTABLE_PAT: str = os.environ.get("AIRTABLE_PAT", "")

# ---------------------------------------------------------------------------
# Airtable target
# ---------------------------------------------------------------------------
AIRTABLE_BASE_ID = "app0cpbQjtdZh1sHT"        # Treetop Database
AIRTABLE_TABLE_ID = "tblXv8Njd7tW9ArNX"       # Gym Intelligence
AIRTABLE_TABLE_NAME = "Gym Intelligence"

# Field names — kept in one place so a rename in Airtable only touches this file
class F:
    GYM_NAME = "Gym Name"
    PLACE_ID = "Google Place ID"
    FULL_ADDRESS = "Full Address"
    CITY = "City"
    STATE = "State"
    MARKET = "Market"
    PHONE = "Phone Number"
    WEBSITE = "Website URL"
    RATING = "Google Star Rating"
    REVIEW_COUNT = "Total Review Count"
    PRICE_LEVEL = "Price Level"
    MAPS_URL = "Google Maps URL"
    BUSINESS_STATUS = "Business Status"
    LATITUDE = "Latitude"
    LONGITUDE = "Longitude"
    OPENING_HOURS = "Opening Hours"
    DATE_ADDED = "Date Added"
    LAST_UPDATED = "Last Updated"
    SCRAPE_STATUS = "Scrape Status"
    EQUIPMENT_BRANDS = "Equipment Brands"
    AMENITIES = "Amenities"
    GROUP_CLASSES = "Group Classes Offered"
    PRICING = "Membership Pricing"
    FACILITY_TYPE = "Facility Type"
    SPECIALTY = "Specialty/Focus"
    SOCIAL_LINKS = "Social Media Links"
    SCRAPE_NOTES = "Scrape Notes"

# ---------------------------------------------------------------------------
# Target markets (cycled through one per scheduled run by default)
# ---------------------------------------------------------------------------
MARKETS: list[str] = [
    "Chicago",
    "Dallas",
    "Houston",
    "Phoenix",
    "Miami",
    "Atlanta",
    "Denver",
    "Nashville",
    "Austin",
    "Charlotte",
    "Seattle",
    "Minneapolis",
    "Tampa",
    "Portland",
    "Las Vegas",
]

# Each market is searched with these terms (Places Text Search)
SEARCH_TERMS: list[str] = [
    "gym",
    "health club",
    "fitness center",
    "athletic club",
]

# ---------------------------------------------------------------------------
# Phase 1 — Places API tuning
# ---------------------------------------------------------------------------
# Hard cap on results per (market, search term) to keep API costs predictable.
# Places API v1 returns up to 20 results per page; we paginate up to this many pages.
PLACES_MAX_PAGES_PER_TERM: int = 3   # 3 * 20 = up to 60 results per (market, term)
PLACES_REQUEST_TIMEOUT: float = 30.0

# ---------------------------------------------------------------------------
# Phase 2 — website scraping tuning
# ---------------------------------------------------------------------------
SCRAPE_REQUEST_TIMEOUT: float = 20.0
SCRAPE_MIN_DELAY_SECONDS: float = 2.0
SCRAPE_MAX_DELAY_SECONDS: float = 4.0      # jitter range
SCRAPE_MAX_PAGE_CHARS: int = 60_000        # truncate before sending to Claude
SCRAPE_RETRY_AFTER_DAYS: int = 30          # re-enrich records older than this

# Subpaths to try after the homepage if its content is thin
SCRAPE_SUBPATHS: list[str] = [
    "/about",
    "/about-us",
    "/classes",
    "/group-fitness",
    "/amenities",
    "/equipment",
    "/membership",
]

# Anthropic model used for extraction
ANTHROPIC_MODEL: str = "claude-sonnet-4-6"
ANTHROPIC_MAX_TOKENS: int = 1500

# ---------------------------------------------------------------------------
# Local paths
# ---------------------------------------------------------------------------
PROJECT_ROOT: Path = Path(__file__).parent
STATE_FILE: Path = PROJECT_ROOT / "state.json"
LOG_FILE: Path = PROJECT_ROOT / "gym_scraper.log"

# ---------------------------------------------------------------------------
# Scheduler defaults (used by APScheduler when running as a daemon)
# ---------------------------------------------------------------------------
SCHEDULE_DAY_OF_WEEK: str = "sun"   # APScheduler cron syntax
SCHEDULE_HOUR: int = 2               # 02:00
SCHEDULE_TIMEZONE: str = "America/New_York"
