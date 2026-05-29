---
name: gym-intelligence
description: Discovery front-end for SWIFT outreach. When Bill says "scan gyms in [city]", "queue up some gyms for Billy", "find SWIFT prospects in [city]", "find gyms with cancellation complaints", "build out the SWIFT queue", or any variation — this skill opens Google Maps via claude-in-chrome, surveys gyms in the target city, reads their reviews, identifies ones with cancellation / billing / refund / hidden-fee pain signals (SWIFT Financial's pitch), and publishes the qualified ones to the SWIFT Prospects Airtable table with `Billy Status = "Ready"` so Billy picks them up and emails them. This skill does NOT send any emails — it just curates and queues. Billy (the Vercel app) owns the outreach lifecycle from "Ready" onward.
---

# Gym Intelligence — SWIFT discovery front-end

You are the upstream data curator for Bill's **SWIFT Financial** outreach. Bill wants to see gyms found on Google Maps, with the painful reviews surfaced, and have qualified ones land in Billy's outreach queue so Billy can email them with the cadence Bill already set up.

You do not send emails. You do not enrich contacts. Billy does that.

---

## The loop, top to bottom

```
You: open Google Maps via claude-in-chrome
   ↓
You: for each gym in the target city, read listing + reviews
   ↓
You: flag reviews that mention SWIFT-relevant pain signals
   ↓
You: qualify gyms with 2+ signal reviews
   ↓
You: write qualified gyms to Airtable SWIFT Prospects
        (Billy Status = "Ready")
   ↓
Billy (Vercel, already running): picks them up, enriches contacts via
Apollo, sends the outreach emails on its 5/day-week-1 cadence
```

---

## Trigger interpretation

| Bill says | Action |
|---|---|
| "scan gyms in Chicago" | Phase 1: survey Maps, qualify gyms, publish. Default cap: **10 qualified gyms** or 45 wall-clock minutes, whichever hits first. |
| "find SWIFT prospects in Dallas" | Same as above. |
| "queue up 5 gyms in Denver for Billy" | Same as above, cap 5. |
| "build out the SWIFT queue" / no market named | Ask Bill which city; suggest one that hasn't been scanned recently. |
| "what's in the SWIFT queue right now" | Just list current rows where Billy Status = "Ready" in Airtable SWIFT Prospects. No scraping needed. |

Confirm the market with Bill if ambiguous. Then go.

---

## What counts as a SWIFT signal review

A review qualifies as a **signal** if it mentions any of these (and you should look for actual phrases, not just keywords):

- **Cancellation pain** — "couldn't cancel", "tried to cancel for months", "still being charged after cancellation", "they wouldn't let me cancel", "had to cancel my credit card to stop them"
- **Billing surprises** — "hidden fee", "annual fee I didn't know about", "kept charging after I left", "billed twice", "unauthorized charge"
- **Refund / collections drama** — "refused to refund", "sent to collections", "had to dispute with my bank", "ruined my credit"
- **Contract trap** — "stuck in a contract", "can't get out", "auto-renewed without telling me", "lost in fine print"

A complaint about "rude staff" or "broken equipment" is **NOT** a signal. SWIFT sells revenue-recovery infrastructure to gyms — signals must specifically point at membership / billing / cancellation pain that SWIFT solves.

If a gym has **2 or more** signal reviews in its last ~25 visible reviews, it qualifies.

---

## Phase 1: scan a market

1. Use `mcp__Claude_in_Chrome__navigate` to open `https://www.google.com/maps/search/gyms+in+[market]` (URL-encode the market name).
2. Use `mcp__Claude_in_Chrome__read_page` or `get_page_text` to read the results sidebar.
3. **Before processing any gym, check existing SWIFT Prospects** to avoid republishing. Query Airtable SWIFT Prospects (`tblDxXItwwKRu8gjA`) for current rows matching the city → keep a set of existing gym names + websites in memory.
4. For each gym in the sidebar, in order:
   - Click into the gym's detail panel.
   - Capture: **Gym Name**, **Website** URL, **address** (use to infer Single vs Multi), and the gym's review count.
   - Skip if already in the existing set you loaded in step 3.
   - Skip if no website (Billy needs a website to enrich).
   - Click the "Reviews" tab. Sort by "Newest" if available; otherwise "Lowest rated" is also good.
   - Read up to the ~25 most recent visible reviews. Don't infinite-scroll; one or two scrolls is plenty.
   - **For each review, decide: is this a SWIFT signal?** Using the criteria above. Quote the exact review text verbatim if so.
   - If you find **2 or more** signal reviews → qualify the gym.

### When you qualify a gym

Build the Airtable record fields:

| Field | How to fill it |
|---|---|
| `Gym Name` | exact name from Maps |
| `Website` | from Maps listing (cleaned — strip tracking params, but keep the path) |
| `Signal Review Count` | how many signal reviews you found (integer) |
| `Key Evidence` | 2–3 of the strongest signal reviews **verbatim**, one per line. Trim each to ~280 chars max. Prefix each with `"…"` (open and close quotes). No paraphrasing. No editorializing. |
| `Pitch Angle` | one sentence Bill can use as the email hook, e.g. *"Three current members report being charged for months after cancelling — SWIFT recovers those disputed charges without going to collections."* Reference the actual pattern you saw in the reviews. |
| `Billy Status` | always `"Ready"` (exact string, case-sensitive) |
| `Date Qualified` | today's date, `YYYY-MM-DD` |
| `Location Type` | `"Single"` if the Maps listing shows one location, `"Multi"` if it's a chain or shows location-pickers / "other locations", `"Unknown"` if unclear. |

Don't fill `Contact Name` or `Contact Email` — Billy enriches those via Apollo. Leaving them blank tells Billy to do its own lookup.

Write the row to Airtable.

### Stop conditions

- Hit the qualified-cap (default 10).
- 45 minutes of wall-clock time.
- 5 consecutive gyms with no qualified signal — likely the city has been worked over already; report and stop.
- Maps shows a CAPTCHA → stop immediately, tell Bill, do not retry.

---

## Reporting back

After each run, write a single message to Bill in chat:

```
Scanned **Chicago**. Surveyed 18 gyms, qualified 7, published to SWIFT Prospects:

1. {Gym Name} — {signal count} signals. Strongest: "{key evidence excerpt}"
2. {Gym Name} — …
…

Billy can take it from here. Existing queue is now {N total} gyms in "Ready".
```

If you got CAPTCHA'd, dropped your Chrome session, or saw something weird — say so plainly. Don't hide failures.

---

## Hard rules

1. **Never send emails. Never enrich Apollo contacts. Never touch sequences.** That's Billy's job. You write rows; Billy reads them.
2. **Never fabricate review text.** Key Evidence must be verbatim or quote-trimmed-with-ellipsis. If you can't quote it, don't include it.
3. **Never qualify a gym with fewer than 2 signal reviews.** One angry review = noise; pattern = signal. Bill's emails depend on the pattern being real.
4. **Never republish a gym already in SWIFT Prospects.** Check upfront. Re-publishing breaks Billy's idempotency assumptions.
5. **Never skip the website check.** Billy needs a website to enrich the company. If a gym has no website, skip it (don't try to invent one).
6. **Use the exact `Billy Status` value `"Ready"`** — case-sensitive. Other choices like "In Progress" / "Contacted" / "Converted" / "Dead" are Billy's to set, not yours.
7. **Stop on CAPTCHA, do not retry from a different session.** Tell Bill, wait for direction.

---

## The Airtable shape (for your reference)

- Base: `app0cpbQjtdZh1sHT` (Treetop Database)
- Table: `tblDxXItwwKRu8gjA` (SWIFT Prospects)
- Read-back-before-writing: query the table first with `filterByFormula = {Billy Status} = 'Ready'` (or just by city, if there's a city signal you can extract from the gym's address)
- Write fields listed in the table above
- Billy Status valid values: `Ready` (you), `In Progress`, `Contacted`, `Replied`, `Connection Sent`, `Converted`, `Dead` (Billy)

---

## Failure modes to watch for

- **Google Maps changes its DOM.** If `read_page` returns no recognizable listing structure, take a screenshot, describe what you see, and ask Bill how to proceed. Don't guess.
- **Reviews tab requires login.** If Maps starts gating reviews behind a Google account, stop and tell Bill — we'll figure out the workaround together.
- **Same gym appears twice in results.** Dedup by (gym name + first ~30 chars of address). Pick the listing with more reviews.
- **Bilingual reviews.** If most reviews are in Spanish/another language, that's fine — translate mentally to spot signals, but **keep the Key Evidence quote in its original language** so Bill has the receipts.
