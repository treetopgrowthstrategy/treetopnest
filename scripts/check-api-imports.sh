#!/usr/bin/env bash
# Guards against the ESM extensionless-import bug.
#
# package.json has "type": "module", so every root api/*.ts is compiled to an
# ESM module and run by Node's ESM loader on Vercel. ESM requires explicit file
# extensions on relative imports: `import x from './foo'` fails at function load
# with ERR_MODULE_NOT_FOUND (a 500), while `'./foo.js'` works. The local esbuild
# test harness bundles/inlines imports, so it CANNOT catch this. This lint reads
# the source directly and fails if any api relative import is missing its .js.
#
# See memory reference_treetopnest_api_esm. Runs as part of scripts/test-cmo/run.sh.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Match relative imports (./ or ../) whose specifier does not end in .js
bad=$(grep -rnE "from ['\"]\.\.?/[^'\"]+['\"]" api/*.ts 2>/dev/null | grep -vE "\.js['\"]" || true)

if [ -n "$bad" ]; then
  echo "FAIL: api/*.ts relative imports must end in .js (ESM; package.json type:module)."
  echo "These will 500 at load on Vercel:"
  echo "$bad"
  exit 1
fi
echo "OK: all api/*.ts relative imports carry .js extensions"
