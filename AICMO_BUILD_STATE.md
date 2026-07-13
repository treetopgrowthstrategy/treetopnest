# AI CMO Build State
Source of truth for the AI CMO Advisor product. Update this after every completed slice.
Last updated: 2026-07-11 (Slice 0). Owner: Bill Colbert.

> This is an internal engineering/ops document Bill reads himself. Plain internal prose.
> It is NOT outbound copy. (Outbound copy still follows the no-em-dash rule.)

## What this product is

Two funnels that both end in a competitive SEO/marketing report, plus a subscription ladder on top.

- **Free funnel:** homepage "Try the AI CMO free" -> `/ai-cmo-advisor/free` -> a limited "snapshot" email (3 open sections + 6 locked $99 CTAs), generated live from Ahrefs + GPT-4o and delivered by Resend within a minute.
- **Paid funnel:** `/ai-cmo-advisor` -> email signup -> verify -> 7-question onboarding -> $99 Stripe Checkout -> webhook generates a full 6-section report and delivers it 15 min later.
- **Subscription ladder:** Monitor $249/mo, Guided $999/mo, Embedded $2,500/mo (Stripe subscriptions). Checkout + Airtable stage advance are wired; automated fulfillment is not built yet (manual today).

## Architecture

- Astro static site on Vercel (project `treetopnest`, prod host `treetopgrowthstrategy.com`).
- Serverless API routes in `api/*.ts` (Vercel Node functions).
- Airtable is the lead database (base `app0cpbQjtdZh1sHT`, table `tbl7PEKkdYKafCEdC` "TTGS Website Leads").
- External services: Ahrefs v3 (site-explorer), OpenAI (gpt-4o), Apollo (people/match enrichment), Resend (transactional email), Stripe (Checkout + webhooks).
- Test harness: `scripts/test-cmo/run.sh` bundles handlers with esbuild and drives them with a mocked `global.fetch`. No real network. Run it before every commit.

## API endpoints

| File | Method | Purpose | Spends money? | Public? |
|---|---|---|---|---|
| `api/cmo-free-start.ts` | POST | Free step 1: capture email+website, upsert lead, bot filters | No | Yes |
| `api/cmo-free-qualify.ts` | POST | Free step 2: Apollo enrich + ICP classify, then fire free report inline | Yes (Apollo + triggers report) | Yes |
| `api/cmo-free-report.ts` | POST + exported fn | Generate + send the limited free snapshot (Ahrefs + GPT-4o + Resend) | Yes (heavy) | Yes (HTTP handler) |
| `api/cmo-signup.ts` | POST | Paid step 1: verification email, create `unverified` lead | No | Yes |
| `api/cmo-verify.ts` | GET | Paid step 2: HMAC verify, advance to `verified`, redirect to onboarding | No | Yes |
| `api/cmo-onboard.ts` | POST | Paid step 3: store 7 answers, advance to `onboarded` | No | Yes |
| `api/cmo-checkout.ts` | POST | Create $99 one-time Stripe Checkout | No | Yes |
| `api/cmo-pay.ts` | GET | Convenience redirect to $99 Checkout (from email links) | No | Yes |
| `api/cmo-subscribe.ts` | POST | Create subscription Checkout (monitor/guided/embedded) | No | Yes |
| `api/cmo-payment-webhook.ts` | POST | Stripe webhook: generate full report on paid, advance stage on subscription | Yes (heavy, post-payment) | Stripe only (signed) |
| `api/cmo-reply-webhook.ts` | POST | Resend inbound: draft/send AI reply to report replies | Yes (OpenAI) | Resend only (signed) |
| `api/cron-cmo-nurture.ts` | GET (cron) | Daily nurture: stage sequences + free drip, dry-run gated | Yes (capped) | CRON_SECRET |

## Env switches and their state

| Env var | Purpose | Default / state | Notes |
|---|---|---|---|
| `CMO_NURTURE_ENABLED` | Live nurture sends vs dry-run digest | unset = dry-run | Flip to `true` only after reviewing a dry-run digest |
| `CMO_REPLY_AUTO_SEND` | Auto-reply vs draft-to-Bill | unset = draft | Flip last, after 20 clean drafts |
| `APOLLO_API_KEY` | ICP auto-qualification | check prod | Without it, every free lead routes to Bill as "review" |
| `CMO_WEBHOOK_SECRET` | Stripe webhook signature secret | required | Webhook 500s without it; verification IS cryptographic (`stripe.webhooks.constructEvent`) |
| `CRON_SECRET` | Cron auth | check prod | Cron refuses to run live if enabled but secret missing |
| `CMO_TOKEN_SECRET` | HMAC for verify links | defaults to insecure dev value | Set a real secret in prod |
| `STRIPE_SECRET_KEY` | Stripe API | required | Live mode |
| `AHREFS_API_KEY` / `OPENAI_API_KEY` / `RESEND_API_KEY` / `AIRTABLE_API_KEY` | Core services | required | |
| `CMO_PRICE_MONITOR/GUIDED/EMBEDDED` | Subscription price IDs | set this session | Self-serve subscribe 503s without them |
| `CMO_REPLY_TO_EMAIL` | Reply-to on reports | `bill@reports.treetopgrowthstrategy.com` | |
| `CMO_MAX_FREE_RESEARCH` | Cron free-research cap per run | 25 | Cost knob for the cron path only |

### New in Phase 0 (this build)

| Env var | Purpose | Default | State |
|---|---|---|---|
| `CMO_KILL_SWITCH` | Pause all spend-incurring generation + outbound sends; intake stays alive | off | Armed by Slice 1 |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | KV store for atomic rate limits + global budget counter | unset | Provision to arm limits (Slice 1 go-live dependency) |
| `CMO_RATE_PER_IP_DAY` | Per-IP submissions/day on public spend endpoints | 3 | Tunable (Slice 1) |
| `CMO_RATE_PER_EMAIL_DAY` | Per-email submissions/day | 2 | Tunable (Slice 1) |
| `CMO_DAILY_BUDGET` | Global free reports/day hard ceiling | 100 | Tunable (Slice 1) |
| `CMO_ADMIN_KEY` | Gates the manual re-run HTTP handler on `cmo-free-report` | unset | Public `force` removed; admin path requires this header (Slice 1) |

## Airtable field map (table `tbl7PEKkdYKafCEdC`)

| Field | Written by | Meaning |
|---|---|---|
| `Email` | all create endpoints | Primary key (LOWER match) |
| `Name` | create endpoints | Derived from email local part |
| `Source` | each entry point | `cmo-free` / `cmo-signup` / `cmo-verify` / `cmo-onboarding` / `cmo-subscribe` |
| `Stage` | paid funnel | `unverified` -> `verified` -> `onboarded` -> `report_delivered` (or tier name for subs) |
| `StageSince` | stage advances | ISO date; drives nurture "days since" |
| `QualifiedStatus` | free funnel | `pending` -> `qualified` / `rejected` / `review` |
| `WebsiteURL` | free-start, qualify, signup | Company site for Ahrefs |
| `LinkedInURL` / `Title` / `Seniority` / `CompanySize` | qualify (Apollo) | Enrichment |
| `Notes` | onboard | 7 answers; competitor domains parsed from here |
| `NurtureStep` / `NurtureStage` | cron, free-report | Sequence position |
| `LastNurtureSentAt` | cron, free-report | ISO date; one send per lead per day |
| `Last Report` | free-report, webhook | Full HTML of last report (context for reply webhook) |
| `ResearchEligible` | free-report, cron | Writeback marker |

## Webhook inventory

- **Stripe -> `cmo-payment-webhook`**: `checkout.session.completed`. Signature verified cryptographically. Needs `CMO_WEBHOOK_SECRET`. GAP (Slice 2): no idempotency on event replay; no retry on generation failure (customer can get silence).
- **Resend inbound -> `cmo-reply-webhook`**: verified with `RESEND_REPLY_WEBHOOK_SECRET`.

## Open decisions

- Rate limit values + daily budget dollar/count cap (Slice 1). Defaults chosen: 3/IP/day, 2/email/day, 100 reports/day. Confirm.
- Where the AI CMO pricing copy deck lands: `/ai-cmo-advisor`, new `/ai-cmo-advisor/pricing`, or replace `/pricing`. Building on `/ai-cmo-advisor/pricing` as the default this session.
- Fractional price anchor wording: resolved to "A fractional CMO typically starts around $10,000 a month."
- Sending subdomain for product email (Slice 8).

## Slice log

- **Slice 0 (2026-07-11):** This document created. Branch `phase0-hardening` off main.
- **Slice 1 (2026-07-11):** `api/_cmo-guards.ts` shared module (kill switch, per-IP/per-email rate limits, global daily budget, disposable blocklist, email-vs-website plausibility, admin-key gate, throttled ops alert; Upstash-backed, no-op without `UPSTASH_*`). Wired into `cmo-free-start`, `cmo-free-qualify`, `cmo-free-report`. Public `force` removed; manual report HTTP handler now requires `CMO_ADMIN_KEY`; wildcard CORS dropped.
- **Slice 2 (2026-07-11):** `cmo-payment-webhook` idempotency (Upstash marker + `LastPaidSessionId` Airtable fallback), 3x retry with configurable backoff, never-silence (customer holding note + Bill dead-letter + `ReportStatus=failed` marker). Signature verification was already cryptographic; left as-is. Test harness extended: `test-guards.mjs` + `test-webhook.mjs`; full suite green.

### Phase 0 go-live dependencies (Bill, before merge/deploy)

- Provision Upstash Redis (or Vercel KV) and set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. Until then, rate limits and the budget cap are no-ops (kill switch, disposable, plausibility, admin gate, and idempotency-via-Airtable-field still work).
- Set `CMO_ADMIN_KEY` (any strong secret) so the manual `cmo-free-report` re-run path is usable.
- Add two Airtable fields to `tbl7PEKkdYKafCEdC`: `LastPaidSessionId` (single line text), `ReportStatus` (single line text or single select).
- Tune caps if desired: `CMO_RATE_PER_IP_DAY` (3), `CMO_RATE_PER_EMAIL_DAY` (2), `CMO_DAILY_BUDGET` (100).
- `CMO_KILL_SWITCH` left unset (off). Set to `true` to pause all spend in an incident.
