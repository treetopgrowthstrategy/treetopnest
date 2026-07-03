# Rank-Readiness Gate

Publishing policy for treetopgrowthstrategy.com. Purpose: only publish pages that can
actually rank, and stop diluting the domain with pages that cannot. Grounded in the site's
real position as of 2026-07: Domain Rating 8, ~1,850 pages, ~515 sitting unindexed because
they are thin/orphaned/mismatched to the domain's authority.

## The one constraint that governs everything

**Domain Rating is 8.** At DR 8 you rank immediately only for near-zero-competition queries.
Anything a DR 30+ site is actively targeting is out of reach until DR rises. Publishing pages
aimed above that ceiling does not just fail; it adds thin pages that lower site quality signals
and waste crawl budget. More pages is not the goal. More *ranking* pages is.

## The gate: a page may be published only if it passes ALL five

1. **Difficulty fits the domain.** Target primary keyword has Ahrefs KD <= 10 (hard ceiling at
   DR 8; prefer KD <= 5). If KD is unknown, it does not pass. Check in Ahrefs Keywords Explorer.

2. **Real human demand exists.** The query has genuine search volume from people, not bots.
   Screen out LLM/agent noise (queries containing prompts, domains, "task:", email addresses,
   random tokens). If the only "demand" is scraper impressions, it does not pass.

3. **You can build the single best page on that SERP.** Open the current top 5 results. If you
   cannot credibly make the most specific, most useful, most current answer, do not publish.
   Generic beats nothing; specific beats generic.

4. **The format is a proven winner for this domain.** At DR 8 the formats that rank here are:
   named-tool **reviews**, head-to-head **comparisons** (X vs Y), and narrow **how-to / niche
   informational** pages. Templated city/industry landing pages do NOT rank at DR 8 and should
   not be mass-produced. One strong regional page beats eight thin city clones.

5. **It is internally linked on day one.** The page must be linked from a relevant hub before it
   ships (see HubLinks + GlobalFooter). Orphan pages do not get indexed. No link, no publish.

Fail any one item, do not publish. Park the idea until it passes (usually: until DR rises, or
until you can reshape it into a winning format).

## Before writing anything new: harvest what you already have

New pages rarely rank immediately at DR 8. The fastest traffic is already-ranked pages sitting
on page 2-3. Before commissioning new content, work the striking-distance list:

- Pull GSC/Ahrefs queries at **position 4-20 with impressions and near-zero clicks**.
- For each, optimize the existing page: exact-match the title and H1 to the query, rewrite the
  meta description to earn the click, add internal links, refresh the content.
- These convert impressions you already earned into clicks in days, not months.

Only after the striking-distance queue is worked should new pages be commissioned, and only
through the five-item gate above.

## What lifts the ceiling

The gate keeps you from wasting effort, but DR 8 is the real cap. The only way more of the
library becomes rankable is to **raise Domain Rating**: turn the existing research assets
(State of AI in the Fitness Industry, benchmark reports) into linkable digital-PR and earn
backlinks. Every point of DR makes more of the catalog rankable without touching a single page.

## Housekeeping standards for every page (enforced by scripts)

- No em or en dashes in titles or meta descriptions. Use colons, commas, periods.
  Enforced by `scripts/fix-serp-copy.mjs`.
- No unescaped double-quotes inside meta descriptions (they truncate the SERP snippet).
  Enforced by `scripts/fix-meta-quotes.mjs`.
- Title under ~60 characters so it does not truncate in results.
- Exactly one `| Treetop` brand suffix.
- Canonical points to the apex host (`https://treetopgrowthstrategy.com/...`).
