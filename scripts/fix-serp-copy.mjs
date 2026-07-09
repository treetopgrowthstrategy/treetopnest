#!/usr/bin/env node
/**
 * fix-serp-copy.mjs
 * One-time codemod + reusable maintenance pass over SERP-facing copy in src/pages.
 * Fixes two systemic issues found 2026-07:
 *   1. Em/en dashes used as separators in <title> and meta descriptions/titles
 *      (violates the house no-em-dash rule and reads poorly in search results).
 *   2. Duplicated "| Treetop | Treetop" brand suffixes.
 *
 * Scope is deliberately narrow and safe: only the <title> element and
 * <meta ...> tags for description / og:title / og:description /
 * twitter:title / twitter:description. Body copy and JSON-LD are left untouched.
 *
 * Dash rule: a spaced em/en dash is a separator. Replace with ": " normally,
 * but with ", " when a colon already appears earlier in the string (avoids
 * "Case Study: X: Y" double-colons). Numeric/currency ranges already use plain
 * hyphens in this codebase, so they are never matched.
 *
 * Usage: node scripts/fix-serp-copy.mjs
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesDir = join(__dirname, '..', 'src', 'pages');

function fixCopy(s) {
  let out = s;
  // 1. Collapse duplicated brand suffix.
  out = out.replace(/\|\s*Treetop\s*\|\s*Treetop\b/g, '| Treetop');
  // 2. Unspaced em/en dash between alphanumerics/currency (ranges, compounds) → hyphen.
  //    e.g. "$5M–$50M" → "$5M-$50M", "2024–2026" → "2024-2026".
  out = out.replace(/([A-Za-z0-9$%])[—–]([A-Za-z0-9$%])/g, '$1-$2');
  // 3. Spaced em/en dash separators → colon for the FIRST (unless a colon already
  //    exists), comma for every subsequent one. Avoids "X: Y: Z" double colons.
  const hasColon = out.includes(':');
  let used = false;
  out = out.replace(/\s[—–]\s/g, () => {
    if (!hasColon && !used) { used = true; return ': '; }
    used = true;
    return ', ';
  });
  return out;
}

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(astro|html)$/.test(e)) acc.push(full);
  }
  return acc;
}

const META_KEYS = ['name="description"', 'property="og:title"', 'property="og:description"', 'name="twitter:title"', 'name="twitter:description"'];

let filesChanged = 0, titleFixes = 0, metaFixes = 0;

function processFile(file) {
  let src = readFileSync(file, 'utf-8');
  let changed = false;

  // <title>...</title>
  src = src.replace(/<title>([^<]*)<\/title>/g, (m, inner) => {
    const fixed = fixCopy(inner);
    if (fixed !== inner) { changed = true; titleFixes++; return `<title>${fixed}</title>`; }
    return m;
  });

  // <meta ... content="...">  for the SERP/social keys only
  src = src.replace(/<meta\b[^>]*>/g, (tag) => {
    if (!META_KEYS.some((k) => tag.includes(k))) return tag;
    return tag.replace(/content="([^"]*)"/, (cm, val) => {
      const fixed = fixCopy(val);
      if (fixed !== val) { changed = true; metaFixes++; return `content="${fixed}"`; }
      return cm;
    });
  });

  // Layout component props: <Layout title="..." description="..."> (pages that
  // do not emit a literal <title>/<meta> but pass copy to a shared layout).
  // \btitle=" / \bdescription=" only match real attributes, not og:title/JSON-LD.
  src = src.replace(/\b(title|description)="([^"]*)"/g, (m, attr, val) => {
    const fixed = fixCopy(val);
    if (fixed !== val) { changed = true; attr === 'title' ? titleFixes++ : metaFixes++; return `${attr}="${fixed}"`; }
    return m;
  });

  if (changed) { writeFileSync(file, src); filesChanged++; }
}

// 1. All source pages.
for (const file of walk(pagesDir)) processFile(file);

// 2. Real public static content pages. Skip client/internal directories and
//    client deliverables (em-dash-exempt, robots-disallowed, sitemap-excluded).
const publicDir = join(__dirname, '..', 'public');
const relPath = (f) => f.slice(publicDir.length + 1);
const DENY_DIR = /^(reports|proposals|clients|mp-group|work|ecofit|api|tools\/ecofit)\//i;
const DENY_FILE = /(^|\/)(EQCC|pro-air-tech)/i;
try {
  for (const file of walk(publicDir)) {
    if (!/\.html$/.test(file)) continue;
    const rel = relPath(file);
    if (DENY_DIR.test(rel) || DENY_FILE.test(rel)) continue;
    processFile(file);
  }
} catch {}

console.log(`Files changed: ${filesChanged}`);
console.log(`Title fixes: ${titleFixes} | Meta fixes: ${metaFixes}`);
