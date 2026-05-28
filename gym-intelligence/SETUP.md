# First-time setup

You only do this once. After this, the cron runs itself.

## 1. Get the three API keys

### Google Places API key

You already have one — it's the `GOOGLE_PLACES_API_KEY` env var set in
Vercel for `use-billy`. Reuse it.

If you ever need to make a new one from scratch:

1. Go to <https://console.cloud.google.com/>
2. Create (or reuse) a project — e.g., "Treetop Pipelines"
3. **APIs & Services → Library** → search **Places API (New)** → enable it
4. **APIs & Services → Credentials** → "+ Create Credentials" → API Key
5. Click the new key → **Application restrictions: None** (or IP-restrict to
   GitHub Actions runner IPs if you're paranoid)
6. **API restrictions: Restrict key → Places API (New)**
7. Copy the key
8. Make sure billing is enabled on the project (Billing in the left nav). The
   API won't return results without it.

### Anthropic API key

1. <https://console.anthropic.com/settings/keys> → Create Key
2. Name it `gym-intelligence`
3. Copy the `sk-ant-…` value

### Airtable Personal Access Token (PAT)

1. <https://airtable.com/create/tokens> → Create new token
2. Name: `gym-intelligence`
3. **Scopes:** `data.records:read`, `data.records:write`, `schema.bases:read`
4. **Access:** add the **Treetop Database** base only
5. Copy the `pat…` value

## 2. Local setup

```bash
cd ~/Downloads/gym-intelligence
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Open .env and paste the three keys
```

Smoke test — runs Chicago with a 5-gym cap so you can sanity check Airtable
without burning quota:

```bash
python main.py --market "Chicago" --max-per-market 5 --enrich-limit 5
```

You should see ~5 new rows in the **Gym Intelligence** Airtable view, each
with Scrape Status = `Scraped` (or `Failed`/`Skipped` with a note explaining
why).

## 3. GitHub Actions secrets

This project lives inside the existing `treetopgrowthstrategy/treetopnest`
repo as a subdirectory. The cron is `.github/workflows/gym-weekly-scan.yml`
at the repo root. To activate it you only need to add three secrets (one-time):

```bash
gh secret set GOOGLE_PLACES_API_KEY --repo treetopgrowthstrategy/treetopnest --body "<paste>"
gh secret set ANTHROPIC_API_KEY     --repo treetopgrowthstrategy/treetopnest --body "<paste>"
gh secret set AIRTABLE_PAT          --repo treetopgrowthstrategy/treetopnest --body "<paste>"
```

Then enable write permissions for workflows so the script can commit
`state.json` back after each run (one-time per repo):

```bash
gh api -X PUT repos/treetopgrowthstrategy/treetopnest/actions/permissions/workflow \
  -f default_workflow_permissions=write
```

After that the workflow fires automatically every Sunday at 07:00 UTC. To
run it manually:

```bash
gh workflow run gym-weekly-scan.yml --repo treetopgrowthstrategy/treetopnest
gh run watch --repo treetopgrowthstrategy/treetopnest
```

## 4. Adding or changing markets

Edit `MARKETS` in `config.py`. Order matters — the rotation steps through the
list in order, wrapping at the end.

## 5. If something looks wrong

- Open `gym_scraper.log` (local runs) or the Actions run page → download the
  `gym_scraper-log-…` artifact (cloud runs).
- The summary line in the log shows `discovered / created / updated /
  scraped / failed / skipped / errors` for the run.
- Per-gym failures are recorded as `Scrape Notes` in the Airtable record itself.
