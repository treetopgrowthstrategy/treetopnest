#!/usr/bin/env bash
# Re-runnable test suite for the AI CMO funnel (cron engine + lead-lifecycle endpoints).
# Bundles the TypeScript handlers to ESM, then drives each with mocked Airtable/Apollo/
# Resend/OpenAI I/O. No real network, no secrets, no side effects.
#
# Usage:  bash scripts/test-cmo/run.sh      (from the repo root)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
DIR="scripts/test-cmo/.bundled"
rm -rf "$DIR"
mkdir -p "$DIR/ep"

echo "Bundling handlers..."
npx esbuild api/cron-cmo-nurture.ts --bundle --platform=node --format=esm --outfile="$DIR/cron.mjs" >/dev/null 2>&1
npx esbuild api/_cmo-guards.ts --bundle --platform=node --format=esm --outfile="$DIR/guards.mjs" >/dev/null 2>&1
npx esbuild api/cmo-payment-webhook.ts --bundle --platform=node --format=esm --outfile="$DIR/webhook.mjs" >/dev/null 2>&1
for f in cmo-signup cmo-verify cmo-onboard cmo-free-start cmo-free-qualify; do
  npx esbuild "api/$f.ts" --bundle --platform=node --format=esm --outfile="$DIR/ep/$f.mjs" >/dev/null 2>&1
done

fail=0
run() { echo ""; echo "== $1 =="; node "scripts/test-cmo/$2" || fail=1; }

run "guards: spend/abuse"  test-guards.mjs
run "cron: dry-run"        test-cron.mjs
run "cron: live paid"      test-cron-live.mjs
run "cron: free + paid"    test-cron-free.mjs
run "endpoints: lifecycle" test-endpoints.mjs
run "webhook: idempotency+retry" test-webhook.mjs

echo ""
if [ "$fail" -eq 0 ]; then echo "ALL CMO TESTS PASSED"; else echo "SOME CMO TESTS FAILED"; exit 1; fi
