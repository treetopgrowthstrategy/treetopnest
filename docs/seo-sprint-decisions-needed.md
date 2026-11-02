# Decisions needed from Bill, CMO sprint

Prepared 2026-09-18. Every item below is a commercial fact that only Bill can
confirm. Nothing here was guessed, and the affected copy was left out of the
publishable changes rather than reconciled on an assumption.

---

## 1. P0 — How should the Factor_ relationship be described?

The same engagement is described three different ways on the live site.

| Page | Wording |
| --- | --- |
| `/about` | "**Before founding Treetop**, I was CMO at Factor_" |
| `/about`, further down | "Factor_ (acquired by HelloFresh), **fractional CMO** during the hyper-growth year" |
| `/case-studies` | "**Named client.** Fractional CMO engagement that scaled paid acquisition..." |

The numbers also disagree:

| Page | Claim |
| --- | --- |
| `/fractional-cmo` | "$14M to $18M run rate in **nine months**" (+29%) |
| `/case-studies` | "**+66% revenue in 6 months**" |

This matters more than a normal copy inconsistency, because `/case-studies`
carries the sentence "These are named client engagements, published with the
consent of the client. No composites, no illustrative figures, no synthesized
examples." That is a strong integrity claim, and the Factor_ entry currently
contradicts the About page underneath it.

**Needed:** Was Factor_ an employed CMO role or a Treetop fractional engagement?
Which revenue figure and timeframe is correct, and are they measuring the same
thing? Is there written permission to name them?

The brief is explicit that a past employee role must stay labeled as such and not
be presented as a client engagement. Until this is answered, no Factor_ copy was
touched anywhere.

---

## 2. P0 — E1: what is the actual minimum term?

| Page | Claim |
| --- | --- |
| `/` | "Retainers are month-to-month." and "change your mind next month" |
| `/fractional-cmo` | "priced as a flat monthly retainer with a **90-day minimum**" |

These cannot both be true of the same offer.

**Needed:** Is the fractional CMO retainer month-to-month or 90-day minimum? If
the homepage statement refers to the productized rungs and the 90-day minimum
only to the fractional engagement, say so and the copy can distinguish them
properly.

---

## 3. P0 — E1: what is the revenue floor?

| Page | Claim |
| --- | --- |
| `/` | "Revenue is $2M to $50M" |
| `/fractional-cmo` | "$5M to $50M" |
| `/ai-consultant` | "$5M to $50M" |
| `/fractional-cro` | "$5M to $50M" |

The homepage is the outlier at $2M.

**Needed:** Is the floor $2M or $5M? If $2M applies only to the lower productized
rungs, that distinction needs to be stated rather than left as two numbers.

---

## 4. P0 — E5: SaaS pricing and pre-PMF scope

Two conflicts on `/fractional-cmo-b2b-saas`:

**Pricing.** The page said "Fractional engagements from $12K-$60K/month." No
other page carries that range, and the pricing report puts fractional CMO at $8K
to $25K per month.

> **Changed in this branch.** That sentence now links to the pricing benchmark
> and to the service page instead of stating the range. A disputed number was
> removed rather than a new one asserted. **If $12K-$60K is correct, say so and
> it goes back**, ideally reconciled with the report.

**Scope.** The page sells "product-market fit acceleration," while `/` says "not
a fit if you are pre-revenue or pre-product-market fit" and `/fractional-cmo`
requires "product-market fit is proven."

**Not changed.** This is a scope question, not a formatting one.

**Needed:** Does Treetop take pre-PMF SaaS clients or not? If the SaaS offer
genuinely differs from the core offer, that difference should be stated on both
pages rather than left as a contradiction.

---

## 5. P1 — Is there a real SaaS work example?

Google sends 489 impressions of SaaS-intent queries to the general CMO page
rather than the SaaS page. The most durable fix is making the SaaS page
substantively different, and the strongest available differentiator is a real
SaaS engagement.

Hapana (B2B SaaS, fitness) and EZO.io (enterprise SaaS) are already named on
`/case-studies`.

**Needed:** Can either be cited on the SaaS page, and under what attribution?
The brief is clear that DTC experience must not be used to imply SaaS results.

---

## 6. P2 — Restore the GSC feed

The Ahrefs to GSC authorization lapsed on 2026-08-22, so the freshest data
available for this sprint is four weeks old, and there is currently no way to
measure whether the September work moved anything.

**Needed:** re-authorize Google Search Console on Ahrefs project 535552. Worth
doing before day 30, or the day-30 baseline will not exist.

---

## Not blocked, already handled

These were reproduced and either fixed or dismissed on evidence, with no input
required. See `seo-sprint-url-intent-map.md` for the reasoning.

- **E2**, city headings over non-city links: fixed on five pages
- **E3**, composite disclosure: already correct, preserved unchanged
- **E4**, cost URL: redirect kept, anchor added, links pointed at it
- **E6**, homepage metadata anomaly: does not reproduce
- **E7**, host configuration: correct, preserved
