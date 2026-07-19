#!/usr/bin/env bash
# Smoke-test a DEPLOYED treetopnest build (preview or prod) before trusting it.
#
# Usage: bash scripts/smoke-preview.sh https://treetopnest-xxxx.vercel.app
#
# Why: the local test harness bundles imports and so cannot catch runtime module
# resolution failures (e.g. the ESM extensionless-import bug). A 500 from an api
# function here means it failed to LOAD. Run this against the Vercel PREVIEW URL
# for any branch that touches api/* before merging to main.
set -euo pipefail
BASE="${1:?usage: smoke-preview.sh <base-url>}"
BASE="${BASE%/}"
fail=0

# A function that LOADS returns its own status (400 validation, 403 admin gate,
# etc.). A 500 (or unreachable 000) means a load/module failure -> do not merge.
post_loads() {
  local path="$1" label="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE$path" -H 'content-type: application/json' -d '{}' 2>/dev/null || echo 000)
  if [ "$code" = 500 ] || [ "$code" = 000 ]; then
    echo "FAIL $label ($path) -> $code (function did not load)"; fail=1
  else
    echo "ok   $label ($path) -> $code"
  fi
}
get_ok() {
  local path="$1" label="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path" 2>/dev/null || echo 000)
  if [ "$code" = 200 ]; then
    echo "ok   $label ($path) -> $code"
  else
    echo "FAIL $label ($path) -> $code (expected 200)"; fail=1
  fi
}

echo "Smoke testing $BASE"
post_loads /api/cmo-free-start     "free-start loads"
post_loads /api/cmo-free-qualify   "free-qualify loads"
post_loads /api/cmo-free-report    "free-report loads"
get_ok     /                       "homepage"
get_ok     /ai-cmo-advisor/pricing "pricing page"

echo ""
if [ "$fail" -ne 0 ]; then
  echo "SMOKE FAILED — do not merge/trust this deploy"
  exit 1
fi
echo "SMOKE PASSED — api functions load, pages serve"
