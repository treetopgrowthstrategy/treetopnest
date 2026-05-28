# Gym Intelligence Pipeline

Scheduled scraper that builds a master database of US gyms / health clubs in
Airtable. Data comes from two sources:

1. **Google Places API v1** — name, address, phone, website, rating, hours, location
2. **Each gym's own website** — equipment brands, amenities, group classes, pricing, facility type (extracted by Claude Sonnet 4.6)

Output table: **Gym Intelligence** in the Treetop Database Airtable base
(`app0cpbQjtdZh1sHT` / table `tblXv8Njd7tW9ArNX`). Deduplication key is the
Google Place ID, so re-running for the same market refreshes existing records
rather than duplicating them.

This project is intentionally separate from the SWIFT outreach pipeline in
[use-billy](../use-billy). SWIFT, RevAgentic, and any other downstream
outreach can cross-reference records here by `Google Place ID`.

---

## Quick start

```bash
git clone <this-repo>
cd gym-intelligence
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # then fill in keys — see SETUP.md
python main.py --market "Chicago" --max-per-market 5  # smoke test
```

See [SETUP.md](SETUP.md) for the full first-time setup, including how to get
each API key.

---

## How it runs

**Production:** GitHub Actions runs `python main.py` every Sunday at 07:00 UTC
(2am EST / 3am EDT). Each run processes the *next* market in rotation, then
commits the updated `state.json` back to the repo so the next run picks up
where this one left off. With 15 markets, every market gets refreshed every
~4 months.

**Manual:** anything in the CLI section below.

**Local daemon (optional):** `python main.py --daemon` starts APScheduler in
the foreground. Useful if you'd rather run on a Mac that's always on instead
of GitHub Actions.

---

## CLI

| Flag | Effect |
|---|---|
| *(no flags)* | Run the **next market** in rotation (Phase 1 + Phase 2), advance state, exit. |
| `--market "Chicago"` | Run a specific market on demand. Also advances rotation state. |
| `--all-markets` | Run every market in `MARKETS` sequentially. Heavy — burns API quota. |
| `--enrich-only` | Skip Phase 1; only enrich Pending or stale records already in Airtable. |
| `--no-enrich` | Run Phase 1 discovery only; don't scrape websites this run. |
| `--max-per-market 25` | Cap how many new gyms get upserted per market. |
| `--enrich-limit 50` | Cap how many enrichments to run this invocation. |
| `--daemon` | Stay running with APScheduler. Fires on the configured weekly cron. |

Most-used commands once the database has a few hundred records:

```bash
# Refresh enrichment data without touching Places quota
python main.py --enrich-only

# Smoke test on a single market with caps
python main.py --market "Denver" --max-per-market 5 --enrich-limit 5

# Catch up on stale data across the board (use with care — heavy)
python main.py --all-markets --enrich-limit 200
```

---

## Project layout

```
gym-intelligence/
├── main.py                      CLI + scheduler + orchestration
├── config.py                    Markets, schedule, field names, tunables
├── places.py                    Google Places API v1 client
├── scraper.py                   Website fetch + robots check + Claude extraction
├── airtable.py                  Airtable REST client (upsert by Place ID)
├── state.json                   Rotation state (committed to track progress)
├── gym_scraper.log              Rotating log (gitignored)
├── requirements.txt
├── .env                         API keys (gitignored — copy .env.example)
├── .env.example
└── .github/workflows/
    └── weekly-scan.yml          GitHub Actions cron
```

---

## Airtable schema

The pipeline writes to a single table — **Gym Intelligence**. The 27 fields
are listed in `config.py`'s `class F:` block. Field names there must match
what's in Airtable; rename in both places if you ever change one.

`Google Place ID` is the unique key. The same field exists on **SWIFT Gyms**
and **Gym & MedSpa Prospects** so those tables can reference the master.

---

## Cost notes

- **Places API**: Text Search is in the "Pro" SKU tier. With the configured
  field mask (which crosses into "Enterprise" because of `regularOpeningHours`
  + `addressComponents`), expect ~$0.005–0.017 per result. One market with
  4 search terms × ~60 results ≈ 240 calls ≈ $1–4. The free monthly credit
  ($200) is plenty for the default rotation.
- **Anthropic API**: One Claude Sonnet 4.6 call per gym site, ~5–10K input
  tokens after truncation, ~500 output tokens. Roughly $0.02 per gym.
- **Airtable**: free tier writes are fine; the script throttles itself.

If quota gets tight, lower `PLACES_MAX_PAGES_PER_TERM` in `config.py` or
trim the `SEARCH_TERMS` list.

---

## Troubleshooting

**"AIRTABLE_PAT is not set"** — copy `.env.example` to `.env` and fill in the
three keys. For GitHub Actions, add them as repo secrets (see SETUP.md).

**"Table 'Gym Intelligence' not found"** — verify your PAT has access to the
Treetop Database base (`app0cpbQjtdZh1sHT`).

**Claude returns invalid JSON** — logged as `Scrape Notes` with the raw output
prefix. Almost always means the site had so little extractable text that the
model had nothing to anchor on. Check the gym's actual website.

**Site is JS-only / blocks scrapers** — recorded as `Scrape Status = Failed`
with a note. We don't run a headless browser by design (too slow + flakey for
a cron). Bigger chains (Equinox, LA Fitness) often need manual data anyway.
