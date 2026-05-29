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

## Phase 2: write an HTML digest artifact

After publishing to Airtable (or alongside, as you go), write a single static HTML file that shows what you found at a glance. Bill opens it to scan results without bouncing into Airtable.

**Path:** `/Users/williamcolbert/Documents/swift-discoveries/discovery-{YYYY-MM-DD}-{city-slug}.html`
Create the directory if it doesn't exist. `city-slug` is lowercase, hyphenated (e.g. `las-vegas`).

**Structure:** one self-contained HTML file. Inline CSS only. No JS. No external assets. Mobile-readable is nice, not required.

**Sections:**

1. **Header** — title `SWIFT Discovery — {City} — {date}`, subtitle showing `{N qualified} of {M surveyed}`, a link to the SWIFT Prospects Airtable view (`https://airtable.com/app0cpbQjtdZh1sHT/tblDxXItwwKRu8gjA`).
2. **One card per qualified gym**, in publish order, containing:
   - Gym name (heading)
   - Website (clickable link, opens in new tab, `rel="noopener"`)
   - Address line (just city/neighborhood is fine; full street optional)
   - Location Type chip (`Single` / `Multi` / `Unknown`)
   - Signal count, prominently displayed
   - The 2–3 Key Evidence quotes, **verbatim**, each in a `<blockquote>` styled to look like a highlighted review excerpt
   - The Pitch Angle, italicized below the quotes
   - Status footer: `→ Published to Billy at {HH:MM}`

**Template you can copy and fill in** (keep CSS exactly like this for consistency across runs):

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SWIFT Discovery — {City} — {Date}</title>
<style>
  :root { color-scheme: light; }
  body { font: 16px/1.5 -apple-system, system-ui, sans-serif; max-width: 880px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
  header { border-bottom: 2px solid #1a1a1a; padding-bottom: 1rem; margin-bottom: 2rem; }
  h1 { margin: 0 0 .25rem; font-size: 1.6rem; }
  .meta { color: #666; font-size: .9rem; }
  .meta a { color: #0a58ca; }
  .card { border: 1px solid #ddd; border-radius: 8px; padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
  .card h2 { margin: 0 0 .35rem; font-size: 1.2rem; }
  .row { color: #555; font-size: .9rem; margin: .15rem 0; }
  .row a { color: #0a58ca; word-break: break-all; }
  .chip { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #eef; color: #335; font-size: .75rem; margin-right: .4rem; }
  .signals { color: #b94a00; font-weight: 600; font-size: .9rem; }
  blockquote { border-left: 3px solid #d4a017; margin: .6rem 0; padding: .55rem .9rem; background: #fff8e7; color: #3a2c00; font-style: normal; font-size: .95rem; }
  .pitch { margin: 1rem 0 .25rem; padding-top: .75rem; border-top: 1px dashed #ccc; font-style: italic; color: #333; }
  .status { font-size: .8rem; color: #888; margin-top: .5rem; }
</style>
</head>
<body>
<header>
  <h1>SWIFT Discovery — {City}</h1>
  <div class="meta">{Date} · {N qualified} of {M surveyed} gyms surveyed · all flagged <code>Billy Status = Ready</code> in <a href="https://airtable.com/app0cpbQjtdZh1sHT/tblDxXItwwKRu8gjA">SWIFT Prospects</a></div>
</header>

<!-- Repeat this card per qualified gym -->
<article class="card">
  <h2>{Gym Name}</h2>
  <div class="row"><a href="{Website}" target="_blank" rel="noopener">{Website}</a></div>
  <div class="row">{Address}</div>
  <div class="row"><span class="chip">{Location Type}</span> <span class="signals">{N} signal review(s)</span></div>
  <blockquote>"{Verbatim review excerpt 1}"</blockquote>
  <blockquote>"{Verbatim review excerpt 2}"</blockquote>
  <p class="pitch">Pitch: {Pitch Angle sentence}</p>
  <div class="status">→ Published to Billy at {HH:MM}</div>
</article>

</body>
</html>
```

When a gym has 3 strong signal reviews, include all 3 blockquotes. Two is the minimum (matches qualification rule). HTML-escape any `<`, `>`, `&`, `"` in review text.

If no gyms qualified this run, still write the file with the header and a single line `<p>No gyms qualified this scan.</p>` — so Bill sees the run happened.

---

## Reporting back

After each run, write a single message to Bill in chat:

```
Scanned **Chicago**. Surveyed 18 gyms, qualified 7, published to SWIFT Prospects.

Digest: file:///Users/williamcolbert/Documents/swift-discoveries/discovery-2026-05-28-chicago.html

Top 3:
1. {Gym Name} — {signal count} signals. Strongest: "{key evidence excerpt}"
2. {Gym Name} — …
3. {Gym Name} — …

Billy can take it from here. Existing queue is now {N total} gyms in "Ready".
```

The `file://` link makes the digest one-click openable in his browser from the chat. Use the full absolute path.

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
