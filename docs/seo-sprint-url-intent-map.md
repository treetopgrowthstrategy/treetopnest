# URL and intent map, CMO sprint

Prepared 2026-09-18. Ticket 1 deliverable.

**Nothing in this sprint is deployed.** Branch `seo-sprint-cmo`, open as a PR for review.

## Data sources and their limits

| Source | Window | Limitation |
| --- | --- | --- |
| Google Search Console, via the Ahrefs connector | 2026-05-01 to 2026-08-22 | **The feed stopped on 2026-08-22.** The Ahrefs to GSC authorization lapsed, so there is no data for the last four weeks. Everything below predates the September changes. |
| Live HTTP checks | 2026-09-18 | Current |
| Repository source | `origin/main` at `ae86c10f` | PR #27 is open and not included |

No keyword volume or difficulty figures appear here. None were available from a
source that measures this site, and inventing them was out of scope.

## The finding that should drive the sprint

`/fractional-cmo` is the largest nonbrand impression earner on the site and
converts none of it.

| Page | Keywords | Impressions | Clicks | Avg position |
| --- | ---: | ---: | ---: | ---: |
| /fractional-cmo | 84 | **1,247** | **0** | 38.6 |
| /ai-consultant-cost | 91 | 420 | 0 | 10.7 |
| /fractional-cmo-for-manufacturing | 12 | 187 | 0 | 31.8 |
| /fractional-cmo-vs-marketing-director | 13 | 174 | 0 | 23.7 |
| /fractional-cmo-b2b-saas | not in top 30 | | | |

Position 38.6 is page four. The page is indexed and matching, and it is too far
down to be clicked. That is a ranking problem, not a title or description
problem, and no metadata change in this sprint should be expected to fix it.

## SaaS intent is landing on the wrong page

This is query-to-page data, not an inference from similar wording.

| Query | Impressions | Page Google chose | Position |
| --- | ---: | --- | ---: |
| saas fractional cmo | 230 | **/fractional-cmo** | 16.1 |
| fractional cmo for saas | 84 | **/fractional-cmo** | 39.8 |
| fractional cmo for b2b saas | 64 | **/fractional-cmo** | 40.4 |
| fractional cmo for saas startups | 56 | **/fractional-cmo** | 81.9 |
| fractional cmo saas | 55 | **/fractional-cmo** | 16.5 |
| b2b fractional cmo for saas companies | 50 | /fractional-cmo-b2b-saas | 37.8 |
| b2b saas fractional cmo | 14 | /fractional-cmo-b2b-saas | 17.9 |

**489 impressions of SaaS-intent queries resolve to the general page; 64 resolve
to the SaaS page.** Google prefers the general page for SaaS queries. The single
largest nonbrand query on the site, `b2b fractional cmo` at 255 impressions and
position 38.6, also lands there.

This does not call for a merge. Both pages should exist, but the SaaS page has to
become substantively different from the general page rather than a restatement of
it, and the internal linking has to tell Google which is which. This sprint fixed
the anchors; the content work depends on the blocked commercial facts below.

## Intent map

| Intent | Destination | Status | Rationale |
| --- | --- | --- | --- |
| Brand and offer overview | `/` | keep | Title already 52 chars and leads with the service. Brief's proposal was a starting point; the live one is at least as good. |
| Hire a fractional CMO | `/fractional-cmo` | keep | Owns 1,247 impressions. Never change this URL. |
| SaaS-specific CMO help | `/fractional-cmo-b2b-saas` | keep | Title and description already match the brief's proposal. Needs differentiation, not a new URL. |
| Evaluate CMO cost | `/2026-fractional-executive-pricing-report` | **keep the redirect** | See below. |
| Choose a leadership model | `/fractional-cmo-vs-agency-vs-hire-calculator` | keep | Covers agency vs fractional vs hire exactly. |
| CMO vs marketing director | `/fractional-cmo-vs-marketing-director` | keep, unchanged | Position 9.2 on "fractional cmo vs full time marketing director" is the best nonbrand position on the site. Do not touch it. |
| Fractional vs consulting firm | `/resources/fractional-cmo-vs-consulting-firm` | keep, unchanged | Distinct intent, per the brief. |

### E4, the cost URL decision

`/how-much-does-a-fractional-cmo-cost` 308s to
`/2026-fractional-executive-pricing-report`, which returns 200.

**Recommendation: keep the redirect.** Neither URL shows any fractional-CMO-cost
visibility. No cost query appears anywhere in the top 40 `fractional cmo` queries
for the measured window. There is no performance to protect on either side, so
separating them would be changing a URL to put a keyword in a slug, which the
brief rules out.

What was done instead: the report's per-role section now carries
`id="fractional-cmo-pricing"`, and the service and SaaS pages link directly to
that anchor. If CMO cost visibility later appears on the report, revisit.

### E7, host configuration: not a defect

| Check | Result |
| --- | --- |
| `www` root | 308 to apex |
| apex root | 200 |
| `www/fractional-cmo-b2b-saas` | 308 to apex |
| All 153 sitemap URLs | apex |
| Homepage canonical | apex |

Consistent and correct. The brief said to preserve a correctly configured
preferred host, so nothing was changed. The mixed hosts in the earlier tool
output were the tool following redirects, not a duplicate-indexing problem.

Note for the record: GSC shows two submitted sitemaps, one at `www` (submitted
Sep 17) and one at apex (submitted Jul 7). The www entry redirects. Harmless,
since Google follows it, but the apex entry is the canonical one.

### E6, homepage metadata: does not reproduce

Live homepage title is `Fractional CMO + AI Revenue Engine for B2B | Treetop`
with an apex canonical. No Claude video-script title anywhere in the source or
the response. Treated as a stale search-result extract, not a site defect. No
change made.
