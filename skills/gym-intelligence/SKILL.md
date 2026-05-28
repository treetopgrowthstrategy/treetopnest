---
name: gym-intelligence
description: Build out the master gym intelligence database in Airtable by mining Google Maps via Claude-in-Chrome. Trigger whenever Bill asks to "scan gyms in [city]", "build out the gym database", "add gyms in [market]", "run the gym scan", "enrich gyms in Airtable", or any variation. Pulls structured data (name, address, phone, website, rating, hours) from Google Maps for each gym, optionally visits each gym's website to extract equipment brands, amenities, group classes, and pricing, then upserts everything into the Gym Intelligence Airtable table using the Maps URL as the dedup key. Distinct from SWIFT — this is the broader prospect database that SWIFT, RevAgentic, and other outreach systems all draw from.
---

# Gym Intelligence — CoWork edition

This skill builds Bill's master gym/health-club database by scraping Google Maps with the **claude-in-chrome MCP**. No paid APIs. Runs only when Bill asks for it.

Output: the **Gym Intelligence** Airtable table in the Treetop Database base.
- Base ID: `app0cpbQjtdZh1sHT`
- Table ID: `tblXv8Njd7tW9ArNX`
- Table name: `Gym Intelligence`
- Dedup key: `Google Place ID` field (stores the unique chunk of the Maps URL — see "Extracting a dedup key" below)

---

## What Bill might ask, and how to interpret it

| Phrase | Action |
|---|---|
| "scan gyms in Chicago" | Run discovery on that market — Phase 1. Default cap: 25 gyms. |
| "scan gyms in Chicago and visit their websites" | Phase 1 + Phase 2 enrichment on new gyms. |
| "add 10 more gyms in Denver" | Phase 1, target 10 new (not-already-in-Airtable) results in Denver. |
| "enrich the pending gyms" / "fill in equipment for the gyms in Airtable" | Phase 2 only — find records where `Scrape Status` is empty/Pending and visit their websites. Default cap: 10 per run. |
| "run the gym scan" with no market | Pick the next market from the rotation list below that hasn't been scanned in the last 8 weeks. |

If Bill is vague, ask one clarifying question and proceed.

**Rotation list** (for "no market specified" runs): Chicago, Dallas, Houston, Phoenix, Miami, Atlanta, Denver, Nashville, Austin, Charlotte, Seattle, Minneapolis, Tampa, Portland, Las Vegas.

To pick the next market, query Airtable for `MAX({Last Updated})` grouped by `Market` and choose the one with the oldest max (or never-scanned). One Airtable list call covers it.

---

## Phase 1 — Discover gyms via Google Maps

1. Use `mcp__Claude_in_Chrome__navigate` to open `https://www.google.com/maps/search/gyms+in+[market]` (URL-encode the market name).
2. Wait for results to load. Use `mcp__Claude_in_Chrome__read_page` (or `get_page_text`) to get the listing panel content.
3. For each gym listing visible in the left sidebar (target the cap Bill set, default 25):
   - Click into the listing to open its details panel.
   - Read the detail panel. Extract:
     - **Gym Name**
     - **Full Address**
     - **Phone Number**
     - **Website URL** (the actual gym site, not Google's redirect)
     - **Google Star Rating** (float)
     - **Total Review Count** (integer)
     - **Price Level** ($, $$, $$$, $$$$ if shown)
     - **Opening Hours** (text)
     - **Business Status** (assume OPERATIONAL unless the listing says "Temporarily closed" or "Permanently closed")
   - Capture the **current Chrome URL** as `Google Maps URL`.
   - Extract the dedup key from that URL (see below).
4. Also run the searches `health clubs in [market]`, `fitness centers in [market]`, and `athletic clubs in [market]` if you have time budget left, dedupling by Google Place ID across all four searches.
5. For each gym, **upsert into Airtable** (search for an existing record with the same `Google Place ID`; if found, update Last Updated + any changed fields; if not, create a new row with `Scrape Status` = "Pending").

### Extracting a dedup key

Google Maps listing URLs contain a stable identifier. Look for one of these patterns in the current URL:
- `!1s0x...:0x...!` (the hex pair after `!1s`)
- `ChIJ...` (a Place ID encoded into the URL — search for the substring starting with `ChIJ`)
- `cid=...` query parameter

Use whichever appears (in that priority order), prefixed with the source: `maps:0x123...` or `maps:ChIJ...`. Consistency matters more than format — pick one and stick to it for that market.

### Required Airtable fields for Phase 1

| Field | Source |
|---|---|
| Gym Name | from listing |
| Google Place ID | dedup key extracted from URL |
| Full Address | from listing |
| City, State | parse from address |
| Market | the market name you searched |
| Phone Number | from listing |
| Website URL | from listing |
| Google Star Rating | from listing |
| Total Review Count | from listing |
| Price Level | from listing if shown |
| Google Maps URL | full current URL |
| Business Status | OPERATIONAL / CLOSED_TEMPORARILY / CLOSED_PERMANENTLY |
| Opening Hours | from listing |
| Date Added | now (only on create) |
| Last Updated | now |
| Scrape Status | "Pending" (only on create — don't overwrite existing values) |

Skip CLOSED_PERMANENTLY listings entirely; don't upsert them.

---

## Phase 2 — Enrich each gym's website (only when Bill asks)

Trigger when Bill says "visit the websites", "enrich", "fill in equipment", or similar. Or as a follow-up immediately after Phase 1 if Bill said so.

For each record needing enrichment (Scrape Status = Pending or empty, has a Website URL):

1. Navigate Chrome to the website.
2. Read the homepage. If thin (< ~1000 chars of readable text), also visit `/about`, `/classes`, `/amenities`, `/equipment`, `/membership` — whichever exist.
3. From the combined text, extract structured data **without making things up**:
   - **Equipment Brands** — only brands that are literally named in the text (Life Fitness, Rogue, Technogym, Peloton, Matrix, Hammer Strength, Precor, Cybex, StairMaster, Woodway, Concept2, Assault Fitness, etc.). Comma-separated.
   - **Amenities** — sauna, steam room, pool, childcare, basketball court, racquetball, locker rooms, towel service, smoothie bar, tanning, parking, recovery lounge. Comma-separated.
   - **Group Classes Offered** — HIIT, spin/cycling, yoga, Pilates, Zumba, boxing, barre, CrossFit, boot camp, aqua aerobics, etc. Comma-separated.
   - **Membership Pricing** — any visible pricing, monthly rates, initiation fees. Verbatim if possible.
   - **Facility Type** — one of: Independent, Franchise, Studio, YMCA/Non-Profit, Corporate Chain, Unknown.
   - **Specialty/Focus** — short phrase if there's a notable focus (e.g., "CrossFit affiliate", "women-only", "boxing-focused").
   - **Social Media Links** — Instagram, Facebook, TikTok, X URLs. Comma-separated.
4. Update the Airtable record:
   - Set `Scrape Status` to **Scraped** if extraction succeeded with any data
   - Set `Scrape Status` to **Failed** with a `Scrape Notes` reason if the site was unreachable, JS-only, blocked, or returned no readable text
   - Set `Scrape Status` to **Skipped** if there was no website on the record to begin with
   - Always update `Last Updated`

**Rate limit:** wait 2–4 seconds between website visits. Don't hammer.

**Stop conditions:**
- Hit the cap Bill set (default: 10 per run for Phase 2).
- 30 minutes of wall-clock time elapsed on Phase 2 — wrap up and report.
- Encountered 5 consecutive site failures → likely Chrome/network issue, stop and report.

---

## Reporting back

After each run, write a one-paragraph summary to Bill in chat:

> Scanned **Chicago**. Found 27 listings, 18 new + 9 existing (updated). 18 set to Pending. (Or if Phase 2: 14 enriched, 3 failed, 1 skipped — Failed gyms and reasons listed below.)

If anything went wrong (Chrome session lost, Maps changed layout, Airtable error), include it plainly.

---

## Hard rules

1. **Use claude-in-chrome, never the Places API.** That's the whole point — this skill is the free version. Do not call `places.googleapis.com` from this skill under any circumstances.
2. **Dedup by `Google Place ID`** before creating any new record. Double records in this table will cause downstream pain in SWIFT and RevAgentic.
3. **Don't overwrite Date Added** on updates. Only set it on create.
4. **Don't fabricate equipment, amenities, or classes.** If the site doesn't mention it, don't add it. Bill uses this data for outreach signals.
5. **Skip permanently closed gyms** — don't even create the record.
6. **Don't enrich gyms that don't have a website** — mark Scrape Status = Skipped with note "no website on record".
7. **One market per session by default.** If Bill asks for multiple markets in one go, confirm before starting — it's a long-running chore.
8. **Respect rate limits.** 2–4s between site fetches. If Maps starts showing CAPTCHAs, stop and tell Bill.

---

## Failure modes

- **Maps shows "couldn't find any results"** — likely a typo in the market name. Confirm with Bill, retry.
- **Listing panel doesn't load fully** — scroll the sidebar to trigger lazy load; retry up to 3 times before skipping a gym.
- **Two listings look like the same gym** — same name + same phone or address → treat as a duplicate, keep the first one.
- **Chrome extension disconnects** — ask Bill to reconnect, then resume from where you left off (you already wrote what you had; Airtable upsert will skip them next pass).
- **Airtable rate limit (429)** — wait the retry-after, continue. Don't crash.
