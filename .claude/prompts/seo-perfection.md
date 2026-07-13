# SEO Perfection: Treetop Site Fix Briefing

You are working on treetopgrowthstrategy.com, an Astro static site on Vercel.
Canonical clone: `~/Documents/GitHub/treetopnest/treetopnest` (the INNER dir deploys).
Current branch: `seo-perfection` (branched from `ai-cmo-pricing-page`).

## The problem

Ahrefs baseline (July 2026): DR 3.7, 4 organic keywords (all positions 6-9), 4 visits/month.
A comprehensive audit found three categories of issues killing indexation and rankings.

## Hard constraints

- **NEVER use em dashes (---) or en dashes (--) in any customer-facing copy.** Use periods, commas, colons, semicolons instead.
- **NEVER `git add .` or `git add api/`** in this repo. Hundreds of numbered junk duplicates exist as untracked files. Always stage specific file paths.
- Only 10 pages use `src/layouts/Layout.astro`. The other ~1,843 pages have inline `<head>` tags.
- Design tokens: bg `#050D05`, accent `#00C853`, headings `#F0FFF0`, body `#C0D8C0`, borders `#1A3A1A`.

---

## FIXES TO MAKE (in priority order)

### 1. Delete static sitemap shadowing Astro endpoint (DONE on seo-perfection branch)

`public/sitemap.xml` (288KB, Python-generated) was served by Vercel before the Astro route at `src/pages/sitemap.xml.ts`. The static file was missing `/services`, `/methodology`, `/resources`, `/glossary`, `/press`, `/how-to-use-claude`. Already deleted on the `seo-perfection` branch along with `treetop_sitemap.py`. Verify this is still deleted.

### 2. Eliminate 307 temporary redirects (DONE on seo-perfection branch)

`astro.config.mjs` had `trailingSlash: 'ignore'` but `vercel.json` has `"trailingSlash": false`. Astro generated `page/index.html` directories; Vercel stripped trailing slashes with 307 (temporary) redirects. Ahrefs confirmed most URLs return 307 instead of 200.

**Already changed** on `seo-perfection`: `trailingSlash: 'never'` in `astro.config.mjs`. Verify this is still set.

### 3. Fix LinkedIn URL in footer (DONE on seo-perfection branch)

Footer had `linkedin.com/in/williamcolbert`, correct handle is `/billcolbert` (matches schema in Layout.astro). Already changed in `src/components/GlobalFooter.astro`. Verify.

### 4. Fix footer dead links (DONE on seo-perfection branch)

- `/blog` link changed to `/content-library`
- `/results` link changed to `/case-studies`
Both already done on `seo-perfection`. Verify.

### 5. Create custom 404 page

**No `src/pages/404.astro` exists.** Vercel shows its raw default "404: NOT_FOUND". Create one with:
- `noindex` meta tag
- Import and use `GlobalNav` and `GlobalFooter` components (from `../components/`)
- H1: "Page not found"
- Links to `/`, `/fractional-cmo`, `/resources`, `/about`
- Match site design: dark bg `#050D05`, green accent `#00C853`, headings `#F0FFF0`
- Use the inline `<head>` pattern (not Layout component), matching the majority of pages
- Include `export const prerender = true` in frontmatter

### 6. Trim meta descriptions over 160 chars

Each file has a `<meta name="description" content="...">` (some as Layout props, most inline). Trim to under 155 chars while preserving keyword intent. NO em dashes in the rewrite.

| Page | Current length | File |
|------|---------------|------|
| /resources | 233 chars | `src/pages/resources/index.astro` |
| /pricing | 198 chars | `src/pages/pricing.astro` (Layout prop) |
| /press | 196 chars | `src/pages/press.astro` |
| /how-to-use-claude | 193 chars | `src/pages/how-to-use-claude.astro` |
| /case-studies | 187 chars | `src/pages/case-studies.astro` |
| /fractional-cro | 189 chars | `src/pages/fractional-cro.astro` |
| /methodology | 180 chars | `src/pages/methodology.astro` (Layout prop) |
| /glossary | 171 chars | `src/pages/glossary.astro` |
| /ai-consultant | 169 chars | `src/pages/ai-consultant.astro` |
| /cost-to-start-a-gym | 165 chars | `src/pages/cost-to-start-a-gym.astro` |

### 7. Fix title tags (too long or too generic)

Update `<title>`, `og:title`, and `twitter:title` to match. Under 60 chars, primary keyword front-loaded.

| Page | Current | Suggested |
|------|---------|-----------|
| / (homepage) | 82 chars | "Fractional CMO + AI Revenue Engine \| Treetop" (46) |
| /services | 18 chars "Services \| Treetop" | "AI Audit, Implementation & Retainer \| Treetop" (47) |
| /about | 15 chars "About \| Treetop" | "About Bill Colbert \| Treetop Growth Strategy" (45) |
| /cost-to-start-a-gym | 90 chars | "How Much Does It Cost to Start a Gym? (2026)" (45) |
| /what-is-ai-native-gtm | 79 chars | "What Is AI-Native GTM? \| Treetop" (33) |

### 8. Fix /methodology schema type

In `src/pages/methodology.astro`, change `"@type": "Article"` to `"@type": "HowTo"`. Rename `"headline"` to `"name"`. Add `"step"` array with the three phases (Memory, Intelligence, Motion) as HowToStep items.

### 9. Fix /ai-cmo-advisor/free multiple H1s

`src/pages/ai-cmo-advisor/free.astro` has 3 `<h1>` tags (one per form step). Keep only the first as `<h1>`, change the other two to `<h2>`. Page is noindexed but this is good hygiene.

### 10. Em dash sweep (1,500+ pages, biggest item)

**1,522 pages** contain em dashes in visible text. 400+ are in H1 tags across geo pages (71 CMO + 83 CRO + 82 CFO + 83 CTO + 81 AI consultant city pages). 402 appear in meta descriptions or schema markup.

**Geo page H1s (400 pages, scriptable):**

The broken pattern (71+ CMO pages, ~83 each for CRO/CFO/CTO/AI-consultant):
```html
<h1 class="hero-h">Fractional CMO {City} <em style="color:#00C853;font-style:italic;">— senior marketing leadership for operators here.</em></h1>
```

The clean pattern (only 7 pages use it, e.g. Dallas, Chicago):
```html
<h1 class="hero-h">Fractional CMO in <em style="font-family:'Instrument Serif',serif;font-style:italic;color:#00C853;">{City}.</em></h1>
```

Write a batch script to:
1. Find all `fractional-cmo-*.astro`, `fractional-cro-*.astro`, `fractional-cfo-*.astro`, `fractional-cto-*.astro`, `ai-consultant-*.astro` files
2. Extract the city name from the H1
3. Rewrite to the clean "in City." pattern
4. Also replace any em dashes in the same files' meta descriptions, schema, and body text

**Body text + meta descriptions (1,100+ additional pages):**

Scan ALL `.astro` files in `src/pages/` for the literal em dash character (Unicode U+2014) and en dash (U+2013) in non-frontmatter context (Astro frontmatter uses `---` as delimiters, that's fine). Replace with commas, periods, colons, or restructured sentences.

**Verification:** `grep -rP '\x{2014}|\x{2013}' src/pages/` excluding Astro frontmatter `---` delimiters should return zero customer-facing hits.

### 11. Fix sitemap lastmod

`src/pages/sitemap.xml.ts` line 133 uses `new Date()` for every URL (meaningless to crawlers). Replace with `statSync(f).mtime.toISOString().split('T')[0]` for per-file modification dates.

### 12. Image optimization

- Add `loading="lazy"` to `<img>` tags in `src/pages/about.astro` and `src/pages/press.astro` (they're missing it).
- Convert `public/img/bill-colbert.jpg` to WebP with a JPEG fallback.

### 13. Add theme-color meta

Add `<meta name="theme-color" content="#050D05">` to:
- `src/layouts/Layout.astro` (covers 10 pages)
- For the ~1,843 inline-head pages, add via batch script after the viewport meta line

---

## Verification checklist

After all changes:
1. `astro build` completes with no errors
2. Preview dev server, spot-check homepage, /services, /fractional-cmo, /about, one geo page
3. `curl -sI localhost:4321/services` returns 200 (not 307)
4. Sitemap at `/sitemap.xml` contains `/services`, `/methodology`, `/resources`
5. Hit a nonexistent URL path, confirm branded 404 page
6. Footer LinkedIn link goes to `/billcolbert`
7. Footer "Content Library" link goes to `/content-library` (not `/blog`)
8. `grep -rP '\x{2014}|\x{2013}' src/pages/ | grep -v '^\-\-\-' | grep -v 'node_modules'` returns zero hits
9. No title tag over 60 chars on the 5 fixed pages
10. No meta description over 155 chars on the 10 fixed pages

## Commit guidance

Stage specific files only. Reasonable commit grouping:
- Commit 1: Sitemap + trailingSlash + LinkedIn + footer links (crawlability)
- Commit 2: 404 page
- Commit 3: Meta descriptions + title tags + schema fixes
- Commit 4: Em dash sweep
- Commit 5: Sitemap lastmod + image optimization + theme-color
