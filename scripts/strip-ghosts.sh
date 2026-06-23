#!/usr/bin/env bash
# Strip Mac OS Finder "foo 2.ext" duplicate files from the repo before build.
# Idempotent. Safe to run from cron or pre-build hook.
#
# NOTE: deliberately avoids bash process substitution `done < <(find ...)`.
# Vercel's build sandbox (as of 2026-06) no longer exposes /dev/fd, so the
# process-substitution form failed with "/dev/fd/63: No such file or directory"
# and broke every production deploy. A here-string reads in the current shell
# (no /dev/fd dependency, and the count survives), and we never abort the build
# over pre-build hygiene that finds nothing on a fresh Linux clone anyway.
set -uo pipefail
cd "$(dirname "$0")/.."

ghosts=$(find src public scripts -depth \( -name "* 2" -o -name "* 2.*" \) 2>/dev/null || true)
count=0
if [ -n "$ghosts" ]; then
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    rm -rf "$f"
    count=$((count + 1))
  done <<< "$ghosts"
fi

echo "strip-ghosts: removed $count Finder duplicates"
exit 0
