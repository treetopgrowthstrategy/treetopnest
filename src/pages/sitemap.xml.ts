import type { APIRoute } from 'astro';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative, sep, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const prerender = true;

const BASE = 'https://treetopgrowthstrategy.com';
// Resolve to the actual src/pages directory at build time
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Try multiple candidate locations
const CANDIDATES = [
  __dirname,                                          // when running from src/pages directly
  resolve(__dirname, '../../../src/pages'),           // when bundled into dist
  resolve(process.cwd(), 'src/pages'),                // fallback to cwd
];
function findPagesDir(): string {
  for (const c of CANDIDATES) {
    try {
      const files = readdirSync(c);
      if (files.some(f => f === 'index.astro' || f === 'about.astro')) return c;
    } catch {}
  }
  return CANDIDATES[CANDIDATES.length - 1];
}
const PAGES_DIR = findPagesDir();

// Patterns we never include in the public sitemap
const EXCLUDE_PATTERNS = [
  /^api\//,                            // function rewrites
  /^proposals\//,                       // client proposals
  /^ecofit($|\/)/,                      // client microsite
  /^mp-group($|\/)/,                    // client docs
  /^reports($|\/)/,                     // private reports
  /^EQCC/i,                             // client doc
  /^pro-air-tech/i,                     // client doc
  /thank-you$/,                         // purchase confirmation pages (noindex)
  /\/index$/,                           // index suffix (handled separately)
];

const EXCLUDE_EXACT = new Set([
  'sitemap.xml',
  '404',
]);

function walk(dir: string, acc: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, acc);
    } else if (entry.endsWith('.astro') || entry.endsWith('.html') || entry.endsWith('.md')) {
      acc.push(full);
    }
  }
  return acc;
}

function fileToUrl(filepath: string): string {
  const rel = relative(PAGES_DIR, filepath).replaceAll(sep, '/');
  // strip extension
  let url = rel.replace(/\.(astro|html|md)$/, '');
  // index.astro at root → '/'
  if (url === 'index') return '/';
  // foo/index → foo
  if (url.endsWith('/index')) url = url.slice(0, -6);
  return '/' + url;
}

// Priority heuristic by URL pattern (default 0.7)
function priorityFor(url: string): string {
  if (url === '/') return '1.0';
  if (url === '/about' || url === '/services' || url === '/fractional-cmo' || url === '/case-studies' || url === '/content-library' || url === '/resources' || url === '/glossary') return '0.9';
  if (url.startsWith('/case-study-')) return '0.85';
  if (url.startsWith('/fractional-cmo-')) return '0.85';
  if (url.startsWith('/cost-to-') || url.startsWith('/how-to-open-a-gym') || url.startsWith('/how-to-finance-a-gym') || url.startsWith('/gym-')) return '0.85';
  if (url.startsWith('/ai-for-') || url.startsWith('/claude-for-') || url.startsWith('/how-to-use-claude') || url.startsWith('/how-to-use-ai')) return '0.8';
  if (url.startsWith('/what-is-')) return '0.78';
  if (url.startsWith('/best-')) return '0.8';
  return '0.75';
}

function changefreqFor(url: string): string {
  if (url === '/' || url === '/blog' || url === '/content-library' || url === '/case-studies') return 'weekly';
  return 'monthly';
}

function shouldExclude(url: string): boolean {
  const slug = url.replace(/^\//, '');
  if (EXCLUDE_EXACT.has(slug)) return true;
  for (const pat of EXCLUDE_PATTERNS) {
    if (pat.test(slug)) return true;
  }
  // Skip noindex pages by checking source content
  return false;
}

// Read .astro source and check for <meta name="robots" content="noindex">
function isNoindex(filepath: string): boolean {
  try {
    const src = readFileSync(filepath, 'utf-8');
    return /name=["']robots["']\s+content=["'][^"']*noindex/.test(src);
  } catch {
    return false;
  }
}

export const GET: APIRoute = () => {
  const files = walk(PAGES_DIR);
  const pages: { url: string; priority: string; changefreq: string }[] = [];
  const seen = new Set<string>();

  for (const f of files) {
    // Skip the sitemap source itself
    if (f.endsWith('sitemap.xml.ts')) continue;
    const url = fileToUrl(f);
    if (shouldExclude(url)) continue;
    if (isNoindex(f)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    pages.push({ url, priority: priorityFor(url), changefreq: changefreqFor(url) });
  }

  pages.sort((a, b) => a.url.localeCompare(b.url));

  const today = new Date().toISOString().split('T')[0];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
