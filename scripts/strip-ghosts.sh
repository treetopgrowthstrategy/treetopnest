#!/usr/bin/env bash
# Strip Mac OS Finder "foo 2.ext" duplicate files from the repo before build.
# Idempotent. Safe to run from cron or pre-build hook.
set -euo pipefail
cd "$(dirname "$0")/.."

count=0
while IFS= read -r -d '' f; do
  rm -rf "$f"
  count=$((count + 1))
done < <(find src public scripts -depth \( -name "* 2" -o -name "* 2.*" \) -print0 2>/dev/null)

echo "strip-ghosts: removed $count Finder duplicates"
