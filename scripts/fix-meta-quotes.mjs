#!/usr/bin/env node
/**
 * fix-meta-quotes.mjs
 * Fixes unescaped inner double-quotes inside description-type meta tags, which
 * silently truncate the description in search results. Converts inner " to '.
 * Scope: name="description", og:description, twitter:description meta tags only.
 * Usage: node scripts/fix-meta-quotes.mjs
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesDir = join(__dirname, '..', 'src', 'pages');
const KEYS = ['name="description"', 'property="og:description"', 'name="twitter:description"'];

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.astro$/.test(e)) acc.push(full);
  }
  return acc;
}

let files = 0, fixes = 0;
for (const file of walk(pagesDir)) {
  let src = readFileSync(file, 'utf-8');
  let changed = false;
  // Match a full meta tag up to its closing >. Value captured greedily to the
  // last quote before the tag terminator, so inner quotes are included.
  src = src.replace(/<meta\b[^>]*?content="(.*?)"\s*\/?>/g, (tag, val) => {
    if (!KEYS.some((k) => tag.includes(k))) return tag;
    if (!val.includes('"')) return tag; // no inner quotes → nothing to fix
    const fixedVal = val.replace(/"/g, "'");
    fixes++; changed = true;
    return tag.replace(`content="${val}"`, `content="${fixedVal}"`);
  });
  if (changed) { writeFileSync(file, src); files++; }
}
console.log(`Files changed: ${files} | inner-quote meta fixes: ${fixes}`);
