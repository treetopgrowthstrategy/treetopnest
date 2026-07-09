# AI CMO funnel tests

Re-runnable logic tests for the AI CMO funnel, with mocked Airtable / Apollo / Resend /
OpenAI I/O. No real network calls, no secrets, no side effects. Run before merging any
change to the funnel.

```bash
bash scripts/test-cmo/run.sh
```

The runner bundles the TypeScript handlers to ESM (into a gitignored `.bundled/`), then
imports each and drives it with a mock `global.fetch`.

## What is covered

- **cron (`api/cron-cmo-nurture.ts`)**
  - `test-cron.mjs` (dry-run): correct leads selected per Stage/cadence, digest to Bill,
    zero counter writes.
  - `test-cron-live.mjs`: sends to leads (bcc Bill, reply-to the reports subdomain),
    counters advance, stage-change reset.
  - `test-cron-free.mjs`: paid + free passes coexist, research cap holds overflow leads,
    qualified leads get the Ahrefs insight, step-1 leads get templated copy.
- **endpoints (`test-endpoints.mjs`)**
  - signup: upsert create-vs-update, no Stage downgrade, website derivation, bot honeypot.
  - verify: Stage advance to verified, no-downgrade guard, bad-token redirect.
  - onboard: upsert to onboarded + Notes.
  - free-start: `cmo-free` source, pending status, no paid Stage.
  - free-qualify: Apollo classify (qualified / rejected / review), enrichment storage,
    review routing to Bill, no status leak to the user, StageSince guard for paid leads.

## Not covered (needs SDK mocking)

`cmo-subscribe`, `cmo-pay`, `cmo-payment-webhook` (Stripe SDK) and `cmo-reply-webhook`
(Resend SDK + Svix signature). Verified by code review; add SDK-mocked tests before
relying on them for high-volume flows.
