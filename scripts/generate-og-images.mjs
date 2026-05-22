#!/usr/bin/env node
/**
 * Per-page OG image generator.
 *
 * For each Astro page in src/pages:
 *  - Extract <title> tag content
 *  - Render a brand-templated SVG (1200x630)
 *  - Convert to PNG via sharp
 *  - Write to public/og/{slug}.png
 *  - Update the page's <meta property="og:image"> + <meta name="twitter:image">
 *    to reference the per-page PNG
 *
 * Idempotent — re-runs only regenerate PNGs whose title has changed.
 *
 * Run before `astro build`: package.json scripts.build = "node scripts/generate-og-images.mjs && astro build"
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import sharp from 'sharp';

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, 'src/pages');
const OG_DIR = path.join(ROOT, 'public/og');
const DEFAULT_OG = 'https://treetopgrowthstrategy.com/og-default.png';

// Treetop brand
const BG = '#050D05';
const GREEN = '#00C853';
const TEXT = '#F0FFF0';
const MUTED = '#8FAF8F';
const BORDER = '#1A3A1A';

await fs.mkdir(OG_DIR, { recursive: true });

const xmlEscape = (s) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

/**
 * Render a 1200x630 SVG with the page title, then convert to PNG.
 */
async function generateOgPng(title, outputPath, kicker = 'Treetop Growth Strategy') {
  // Wrap the title across lines (~32 chars per line for the large serif size)
  const words = title.split(/\s+/);
  const lines = [];
  let cur = '';
  const maxChars = 32;
  for (const w of words) {
    if (cur.length === 0) { cur = w; continue; }
    if ((cur + ' ' + w).length <= maxChars) { cur = cur + ' ' + w; }
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  // Cap at 4 lines, truncate gracefully
  const finalLines = lines.slice(0, 4);
  if (lines.length > 4) finalLines[3] = finalLines[3].replace(/\s*\S+$/, '') + '…';

  const lineHeight = 78;
  const startY = 200 + (4 - finalLines.length) * 38; // center vertically based on line count

  const titleSvg = finalLines.map((line, i) =>
    `<text x="80" y="${startY + i * lineHeight}" fill="${TEXT}" font-family="Georgia, 'Instrument Serif', serif" font-size="68" font-weight="400">${xmlEscape(line)}</text>`
  ).join('\n  ');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${BG}"/>
  <rect x="0" y="0" width="1200" height="6" fill="${GREEN}"/>
  <!-- Top: brand wordmark -->
  <text x="80" y="100" fill="${TEXT}" font-family="Georgia, 'Instrument Serif', serif" font-style="italic" font-size="36">Treetop</text>
  <text x="80" y="135" fill="${MUTED}" font-family="Helvetica, 'DM Sans', sans-serif" font-size="14" letter-spacing="2" font-weight="600">${xmlEscape(kicker.toUpperCase())}</text>
  <!-- Title block -->
  ${titleSvg}
  <!-- Bottom strip -->
  <line x1="80" y1="540" x2="1120" y2="540" stroke="${BORDER}" stroke-width="1"/>
  <text x="80" y="585" fill="${MUTED}" font-family="Helvetica, 'DM Sans', sans-serif" font-size="18">treetopgrowthstrategy.com</text>
  <text x="1120" y="585" fill="${GREEN}" font-family="Helvetica, 'DM Sans', sans-serif" font-size="18" font-weight="600" text-anchor="end">By Bill Colbert</text>
</svg>`;

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

function extractTitle(astroContent) {
  // Match <title>...</title>; allow nested entities/tags
  const m = astroContent.match(/<title>([\s\S]*?)<\/title>/);
  if (!m) return null;
  // Strip the " | Treetop..." suffix to get the core title
  let title = m[1].trim();
  title = title.replace(/\s*[|·\-]\s*Treetop.*$/, '').trim();
  title = title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return title;
}

function slugFromPath(astroPath) {
  // src/pages/foo/bar.astro -> foo-bar; src/pages/index.astro -> index
  const rel = path.relative(PAGES_DIR, astroPath).replace(/\\/g, '/').replace(/\.astro$/, '');
  if (rel === 'index') return 'index';
  return rel.replace(/\//g, '-');
}

function getCanonicalUrl(content) {
  const m = content.match(/<link\s+rel="canonical"\s+href="(https?:\/\/[^"]+)"/);
  return m ? m[1] : null;
}

async function processPage(astroPath) {
  let content = await fs.readFile(astroPath, 'utf8');
  const title = extractTitle(content);
  if (!title) return { skipped: true, reason: 'no-title', path: astroPath };

  const slug = slugFromPath(astroPath);
  const pngFile = path.join(OG_DIR, `${slug}.png`);
  const pngUrl = `https://treetopgrowthstrategy.com/og/${slug}.png`;

  // Generate PNG (always regenerate; cheap)
  try {
    await generateOgPng(title, pngFile);
  } catch (e) {
    return { skipped: true, reason: `sharp-failed: ${e.message}`, path: astroPath };
  }

  // Update og:image + twitter:image meta tags in the page source
  let modified = false;
  const replaceOgImage = content.replace(
    /(<meta\s+property="og:image"\s+content=")[^"]+(")/g,
    `$1${pngUrl}$2`
  );
  if (replaceOgImage !== content) { content = replaceOgImage; modified = true; }
  const replaceTwImage = content.replace(
    /(<meta\s+name="twitter:image"\s+content=")[^"]+(")/g,
    `$1${pngUrl}$2`
  );
  if (replaceTwImage !== content) { content = replaceTwImage; modified = true; }

  // Add twitter:image if missing but twitter:card exists
  if (content.includes('name="twitter:card"') && !content.includes('name="twitter:image"')) {
    content = content.replace(
      /(<meta\s+name="twitter:card"[^>]*\/>)/,
      `$1\n<meta name="twitter:image" content="${pngUrl}" />`
    );
    modified = true;
  }

  if (modified) await fs.writeFile(astroPath, content, 'utf8');
  return { skipped: false, slug, modified, title };
}

const pages = await glob('src/pages/**/*.astro', { cwd: ROOT });
console.log(`Generating OG images for ${pages.length} pages…`);

let ok = 0, skipped = 0, modifiedCount = 0;
for (const p of pages) {
  const fullPath = path.join(ROOT, p);
  const result = await processPage(fullPath);
  if (result.skipped) {
    skipped++;
    if (result.reason !== 'no-title') console.log(`  SKIP ${p}: ${result.reason}`);
  } else {
    ok++;
    if (result.modified) modifiedCount++;
  }
}

console.log(`\n✓ Generated ${ok} OG images`);
console.log(`✓ Updated meta tags on ${modifiedCount} pages`);
if (skipped > 0) console.log(`  Skipped ${skipped} (typically pages without <title>)`);
