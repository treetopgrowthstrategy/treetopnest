# Backlink Prospector — setup & usage

A Claude skill that surfaces legitimate backlink and brand-mention opportunities for Treetop Growth Strategy, drafts personalized outreach for the best ones, and outputs a markdown digest for Bill to review and send.

**It does not send anything.** Bill remains in the loop on every outreach.

---

## What it does each run

For each of 7 source channels (source-request platforms, journalist queries, list/roundup opportunities, unlinked mentions, broken link reclamation, competitor gaps, community discussions), the skill:

1. Searches the channel using documented patterns
2. Scores each opportunity on relevance, authority, effort, time-sensitivity
3. Surfaces the top 5-10 (cuts anything below score 5/10)
4. Drafts personalized outreach for each — referencing specifics from the target
5. Outputs a single markdown digest to `~/Documents/backlink-digests/digest-{date}.md`
6. Sends a macOS desktop notification when ready

Bill reviews in 10-20 minutes, sends what looks good, ignores what doesn't.

---

## Files in this directory

| File | Purpose |
|---|---|
| `SKILL.md` | The skill prompt — what runs each cycle |
| `config.yaml` | Treetop's positioning, Bill's bio, linkable assets, voice, competitor list |
| `sources.md` | The 7 channels to check with specific search patterns |
| `templates.md` | Outreach templates by opportunity type — starting points the skill customizes |
| `README.md` | This file |

---

## How to run it

### Option A: Manual invocation in Claude Code

Type in any Claude Code session:

```
Run the backlink prospector skill
```

Or directly:

```
Read /Users/williamcolbert/Documents/GitHub/treetopnest/skills/backlink-prospector/SKILL.md and execute it.
```

### Option B: Scheduled (recommended)

Wired via the Claude scheduled-tasks MCP. The task is named `treetop-backlink-prospector` and runs weekly on Monday mornings at 7:00 AM Central. To inspect or modify:

```
list scheduled tasks
```

To change schedule:

```
update the scheduled task treetop-backlink-prospector to run [new schedule]
```

### Option C: External cron (if not using Claude Code scheduler)

```cron
# Every Monday at 7:00 AM
0 7 * * 1 cd /Users/williamcolbert/Documents/GitHub/treetopnest && \
  claude code --prompt-file skills/backlink-prospector/SKILL.md > /tmp/backlink-run.log 2>&1
```

(Adjust path to your Claude Code CLI.)

---

## What output looks like

`~/Documents/backlink-digests/digest-2026-05-21.md`:

```markdown
# Backlink Prospecting Digest — 2026-05-21

> Generated 2026-05-21 07:35 · 7 opportunities surfaced · ~95 minutes to action all

## Tier 1 — Reply today (highest priority)

### 1. Featured.com query: "How are mid-market companies measuring AI ROI?" (Inc.com)
- **Deadline:** Tomorrow 5pm ET
- **Why it fits:** Direct match for /how-to-measure-ai-roi content
- **What to do:** Submit response via Featured.com form (link below)
- **Draft response:**
  > [200-word draft in Bill's voice with specific numbers]
- **Submission link:** https://featured.com/...
- **Estimated effort:** 12 min

### 2. ...

## Tier 2 — Reply this week (3-5 opportunities)
...

## What I didn't include
- Skipped 4 HARO queries that required paid Connectively access
- Skipped a roundup on "AI tools for solopreneurs" — doesn't fit our $5M-$50M positioning
- Skipped a Reddit thread that explicitly banned vendor self-promotion

## Sources checked this run
- [list of channels with what was searched]

## Suggestions for next run
- Add "mid-market AI consultant" to search rotation — saw it trending
- Featured.com had stronger queries this week than Qwoted
```

---

## Tuning the skill over time

After 3-4 runs, review the digests and `run-log.csv` to see what's working:

- **If outreach is landing:** keep current channels weighted as-is
- **If specific channels aren't producing:** edit `sources.md` to deprioritize them
- **If Bill's voice is off in drafts:** edit the voice section of `config.yaml`
- **If certain types of opportunities are missing:** add new search patterns to `sources.md`

The skill improves with config updates, not code changes.

---

## What the skill explicitly will not do

- Auto-send any outreach
- Submit Treetop to spam directories
- Post AI-generated content to forums under Bill's name
- Make up case studies, clients, or credentials in drafts
- Include opportunities behind paywalls it can't access (notes them in the digest instead)
- Include the same opportunity twice across runs (checks the last 14 days of digests)

---

## Honest expectations

- A weekly run produces 5-10 high-quality leads
- Realistic conversion: 20-40% of sent outreaches produce a response; 5-15% produce a real link
- Over 6 months: expect 15-40 new high-quality backlinks if Bill sends consistently
- This is not a get-rich-quick lever — it's a slow compounding effort

Backlinks alone don't grow a business. But systematically prospected, the time investment per resulting link is small relative to other marketing activities.

---

## Maintenance

- Update `config.yaml` when positioning shifts (~quarterly)
- Update `linkable_assets.flagship` when new substantial content ships
- Update `competitors` when the competitive set evolves (~quarterly)
- Update `sources.md` when channels go dead or new ones emerge

The skill itself (`SKILL.md`) rarely needs editing — it's the operating system; the configs are the data.
