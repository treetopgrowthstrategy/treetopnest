# AI CMO Phase 0 + Pricing Page: Build Summary
2026-07-11. Everything is staged on branches for your review. Nothing was deployed to prod.

## Heads up on the overnight stall

The overnight autonomous run did NOT build anything. The classifier that vets shell
commands in auto mode was down for hours, so every test/commit step stalled and the loop
waited on it instead of surfacing the outage. When it came back, I built the whole thing in
one working session. So this is fresh work from today, tested, not an 8-hour crawl.

## What got built (2 branches, both pushed, neither merged)

### Branch `phase0-hardening` (security, staged for your review)
Closes the BLOCKER cost-abuse holes from the overnight review. Four commits:

- **Slice 0:** `AICMO_BUILD_STATE.md` at repo root. Source-of-truth doc for the product.
- **Slice 1:** `api/_cmo-guards.ts` (underscore = not a public route) + wiring.
  - Kill switch, per-IP + per-email daily rate limits, global daily budget cap, disposable
    email blocklist, email-vs-website plausibility gate, admin-key gate, throttled ops alert.
  - Counters run on Upstash Redis REST (no new npm dep). They **degrade to no-op when
    `UPSTASH_*` is unset**, so nothing breaks before you provision it.
  - Public `force` removed from `cmo-free-report`; its manual HTTP handler now requires
    `CMO_ADMIN_KEY`; wildcard CORS dropped. Guards wired into free-start, free-qualify, free-report.
- **Slice 2:** `cmo-payment-webhook` idempotency (Upstash marker + `LastPaidSessionId` Airtable
  fallback), 3x retry with backoff, and never-silence (customer holding note + your dead-letter
  alert + `ReportStatus=failed` marker on permanent failure).
- Tests: `test-guards.mjs` + `test-webhook.mjs` added. **Full suite green (6 suites).**

PR: https://github.com/treetopgrowthstrategy/treetopnest/pull/new/phase0-hardening

### Branch `ai-cmo-pricing-page` (marketing, staged for your review)
- New page at `/ai-cmo-advisor/pricing` implementing the pricing deck on the site's dark palette.
- Guided anchor uses your corrected line: "A fractional CMO typically starts around $10,000 a
  month. Guided gives you the judgment layer for a tenth of it." No "$5,000 to $10,000" anywhere.
  Bridge section carries no dollar figure.
- Renders 200, no console errors, on-brand. Verified in the dev preview.

PR: https://github.com/treetopgrowthstrategy/treetopnest/pull/new/ai-cmo-pricing-page

## Before you MERGE phase0-hardening (go-live dependencies)

The code is safe to merge as-is (guards no-op without the store), but the protections are only
armed once you do these:

1. Provision Upstash Redis (or Vercel KV) and set `UPSTASH_REDIS_REST_URL` +
   `UPSTASH_REDIS_REST_TOKEN` in Vercel. Until then: kill switch, disposable, plausibility, admin
   gate, and Airtable-field idempotency all work, but rate limits and the budget cap do not enforce.
2. Set `CMO_ADMIN_KEY` (any strong secret) so the manual `cmo-free-report` re-run path works.
3. Add two Airtable fields to `tbl7PEKkdYKafCEdC`: `LastPaidSessionId` (single line text),
   `ReportStatus` (single line text or single select).
4. Optional cap tuning: `CMO_RATE_PER_IP_DAY` (3), `CMO_RATE_PER_EMAIL_DAY` (2),
   `CMO_DAILY_BUDGET` (100). These are the open decision from the plan; confirm the values.
5. `CMO_KILL_SWITCH` stays unset (off). Flip to `true` to pause all spend in an incident.

## Held on the pricing page (per the deck's own checklist)

- **Annual Monitor line ($2,490/yr)** omitted. Needs the annual price in Stripe (plan Slice 21).
- **"$99 credited toward Monitor" language** omitted. Needs the Stripe credit mechanic (plan
  Slice 12). Add both back once those exist.
- Placement default was `/ai-cmo-advisor/pricing` (its own page, doesn't collide with the
  company-wide `/pricing` ladder). If your strategy convo lands somewhere else, it is a 2-minute move.
- Embedded CTA points to the booking calendar ("Talk to us"); Monitor/Guided are self-serve checkout.

## Three code-vs-doc corrections I found while building (built against reality)

1. The Stripe webhook was **already** doing cryptographic signature verification
   (`stripe.webhooks.constructEvent`). So Slice 2 was idempotency + retry, not "add crypto."
2. Slice 3's "existing static report hosting pattern" does **not** exist yet. Reports live only
   as HTML in Airtable + inline email. That slice is more net-new than the plan implies.
3. `LastPaidSessionId` / `ReportStatus` are new Airtable fields the webhook now writes (item 3 above).

## Suggested merge order

1. Merge `phase0-hardening` first (protect spend), after doing the 5 go-live items. It is the
   plan's mandated first step and the guards are inert until you arm them, so merging early is safe.
2. Merge `ai-cmo-pricing-page` whenever the placement is settled.
