#!/usr/bin/env node
/**
 * gen-hub-links.mjs
 * Scans src/pages for programmatic cluster pages and emits src/data/hubLinks.json,
 * a map of cluster -> [{ href, label }] used by HubLinks.astro so every hub links
 * to ALL of its variants (kills orphan pages + concentrates topical relevance for
 * Google indexing). Re-run after adding new cluster pages:
 *     node scripts/gen-hub-links.mjs
 */
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesDir = join(__dirname, '..', 'src', 'pages');
const dataDir = join(__dirname, '..', 'src', 'data');

// prefix = slug prefix that identifies the cluster; exclude = exact slugs that are
// hub/index pages (not variants) and must not link to themselves.
const CLUSTERS = [
  { key: 'fractional-cro', prefix: 'fractional-cro-', exclude: [] },
  { key: 'fractional-cmo', prefix: 'fractional-cmo-', exclude: [] },
  { key: 'fractional-cfo', prefix: 'fractional-cfo-', exclude: [] },
  { key: 'fractional-cto', prefix: 'fractional-cto-', exclude: [] },
  { key: 'ai-consultant', prefix: 'ai-consultant-', exclude: [] },
  { key: 'claude-for', prefix: 'claude-for-', exclude: ['claude-for-business'] },
  { key: 'ai-cmo-for', prefix: 'ai-cmo-for-', exclude: [] },
  { key: 'how-to-use', prefix: 'how-to-use-', exclude: ['how-to-use-claude'] },
  { key: 'claude-prompts-for', prefix: 'claude-prompts-for-', exclude: [] },
];

// Tokens to uppercase (US state abbreviations + common acronyms) when building labels.
const UPPER = new Set([
  'tx','ca','ny','sc','nc','va','dc','fl','ga','tn','wi','mn','nv','ut','az','co',
  'ma','ct','nj','mo','al','mi','ne','ks','pa','wa','oh','la',
  'ai','hr','it','saas','cpg','gdpr','sms','seo','ceo','coo','cfo','cro','cmo','cto',
  'b2b','kpi','roi','crm','cx','ux','pm','qa',
]);

const labelFrom = (rest) =>
  rest.split('-').map((t) => {
    if (!t) return t;
    if (UPPER.has(t)) return t.toUpperCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }).join(' ');

const files = readdirSync(pagesDir)
  .filter((f) => f.endsWith('.astro'))
  .filter((f) => !/\s/.test(f)) // skip stray "copy 2"/"copy 3" duplicate files
  .map((f) => f.replace(/\.astro$/, ''));

const out = {};
for (const c of CLUSTERS) {
  const items = files
    .filter((slug) => slug.startsWith(c.prefix) && !c.exclude.includes(slug))
    .sort()
    .map((slug) => ({ href: `/${slug}`, label: labelFrom(slug.slice(c.prefix.length)) }));
  out[c.key] = items;
}

mkdirSync(dataDir, { recursive: true });
writeFileSync(join(dataDir, 'hubLinks.json'), JSON.stringify(out, null, 2) + '\n');

const summary = Object.entries(out).map(([k, v]) => `${k}: ${v.length}`).join('  |  ');
console.log('Wrote src/data/hubLinks.json');
console.log(summary);
