# DESIGN

The real Treetop design system, extracted from the canonical repo. Any post rendered to HTML must match this so it reads as native Treetop, the same way ecofit pages match the ecofit look. Do not invent tokens. If something here is not enough to render a given component, read the source files named below rather than guessing.

## Where finished HTML goes

`PUBLIC_CONTENT_PATH = src/pages/` (root-slug Astro routes)

Rendered posts are self-contained Astro pages at `src/pages/<human-readable-slug>.astro` in the canonical tree (`~/Documents/GitHub/treetopnest/treetopnest`), the same convention every ranking Treetop essay uses. A file at `src/pages/my-post.astro` is live at `https://treetopgrowthstrategy.com/my-post` after a push to `main`, is included in the sitemap, and gets picked up by the hub linker.

Do NOT use `public/insights/`. That path is wildcard-redirected to `/resources` in `vercel.json` (`/insights/:slug*` returns a 301), so any post placed there is unreachable. The earlier draft of this doc named `public/insights/`; that was superseded once the redirect was found. Root-slug `src/pages/*.astro` is the correct, ranking-optimal home. Use human-readable file names.

## Source of truth for the design language

Extracted from:
- `tailwind.config.mjs` (brand color and font tokens)
- `src/layouts/Layout.astro` (head, font loading, body classes, schema graph)
- `src/pages/index.astro` (the full component grammar: cards, tiles, steps, method rows, comparison tables, FAQ, ladder)
- `src/pages/about.astro` (hero pattern, section rhythm, prose column)

## Color palette

Dark, near-black green base with a single bright green accent. Hex values are the source of truth.

| Token | Hex | Use |
|-------|-----|-----|
| `brand.bg` | `#050D05` | Page background, dark cards |
| `brand.bgalt` | `#0A1A0A` | Alternate / raised card background, table heads |
| `brand.green` | `#00C853` | Accent: labels, primary buttons, numerals, links |
| `brand.text` | `#F0FFF0` | Primary text, headings |
| `brand.sub` | `#8FAF8F` | Secondary / body text |
| `brand.muted` | `#4A6A4A` | Muted meta, tags, de-emphasized labels |
| `brand.border` | `#1A3A1A` | Hairline borders, section rules, grid gaps |
| `brand.card` | `#050D05` | Card fill (same as bg) |

Supporting values seen in the component CSS: `#C0D8C0` (slightly brighter body text inside emphasis blocks), `#071307` / `#071407` (hover / featured card fill), and green-alpha accents `rgba(0,200,83,0.35)` (hover border), `rgba(0,200,83,0.14)` (tag fill), `rgba(0,200,83,0.4)` (left-border accent).

## Typography

Two families, loaded from Google Fonts in `Layout.astro`:

- **Instrument Serif** (`serif`), weights ital 0 and 1. Used for headings, hero, numerals, card titles, FAQ questions. Italic is used deliberately for accent (numerals, emphasis).
- **DM Sans** (`sans`), weights 300, 400, 500, 600. Used for body, labels, buttons. Body weight is often 300 on standalone pages.

Font link (matches the live head exactly):
```
https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap
```

Hero headline pattern: `font-family: 'Instrument Serif'; font-size: clamp(2.8rem, 6vw, 4.5rem); font-weight: 400; line-height: 1.08; color: #F0FFF0`.

Section label ("eyebrow") pattern (`.lbl`): `font-size: 0.68rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #00C853`.

## Spacing and layout grammar

- Body: `bg-brand-bg text-brand-text font-sans antialiased` (from `Layout.astro`).
- Sections: `padding: 5rem 2.5rem; border-top: 1px solid #1A3A1A`. Full-width sections separated by hairline top borders is the core section rhythm.
- Prose column max-width around `540px` for lead paragraphs; wider grids for component rows.
- Fixed nav: `background: rgba(5,13,5,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid #1A3A1A`.
- Hairline-gap grids: grids use `gap: 1px; background: #1A3A1A` with each cell filled `#050D05`, which renders as thin dividing lines between cells (used for proof strips, comparison tables, cost rows, ladder rungs).

## Card and section grammar

Reusable patterns lifted from `index.astro`. Reuse these classes and values rather than reinventing.

- **Dark card** (`.card-dark`): `background: #050D05; border: 1px solid #1A3A1A; padding: 2rem`. Hover: border to `rgba(0,200,83,0.35)`.
- **Outline card** (`.card-outline`): `background: #0A1A0A; border: 1px solid #1A3A1A; padding: 1.75rem`.
- **Numbered tile** (`.tile` / `.tile-num`): Instrument Serif italic numeral in low-opacity green (`rgba(0,200,83,0.35)`) above an Instrument Serif title and `#8FAF8F` body.
- **Plan step** (`.step`): bright green Instrument Serif italic step number, serif name, `#8FAF8F` body.
- **Method row** (`.m-card`): tiny uppercase green label, serif name, muted body. This is the pattern that carries the Revenue Engine Method (Memory / Intelligence / Motion).
- **Comparison table** (`.compare`): three columns (label / left / right) on a `#1A3A1A` hairline grid, with a colored head row (`.decorated` muted, `.native` green).
- **Deliverable / memo preview** (`.memo`): a framed card with a header bar and a two-column body, used to show a sample artifact inline. Directly relevant to the "deliverable as a weapon" post.
- **FAQ** (`.faq`): hairline-separated items, Instrument Serif question, `#8FAF8F` answer, green underlined links. Pairs with FAQPage schema.

## Buttons

- **Primary** (`.btn-p`): `background: #00C853; color: #050D05; padding: 0.875rem 1.75rem; font-family: 'DM Sans'; font-weight: 600`. Hover: `opacity: 0.88; translateY(-1px)`.
- **Ghost** (`.btn-g`): transparent, `color: #F0FFF0`, `border: 1px solid #1A3A1A`. Hover: green-tinted border and faint green fill.

## Motion

Subtle fade-up on load only. `@keyframes fadeUp` moves 24px up over 0.65s ease with staggered delays (`.d1` to `.d5`). Keep motion this restrained; no heavy animation.

## Head, schema, and metadata

`Layout.astro` sets canonical URL, Open Graph, Twitter card, and a JSON-LD `@graph` (Organization, Person for Bill, WebSite, Service) on every page. Favicon is `/favicon.svg`. Default OG image `https://treetopgrowthstrategy.com/og-default.png`. A rendered post should carry a matching canonical, an `article`-type OG, and (per post 8) post-appropriate schema such as `Article`, `FAQPage`, or `HowTo` in a page-specific schema slot.

## Warning: do not copy the stale report palette

Older standalone HTML in `public/reports/` (for example the `dg-*` pages and `fractional-gtm-proposal.html`) uses an off-brand palette: `#0b0c0e` background, `#00d47e` green, and DM Mono. That is stale and does NOT match the current site. Do not use those files as the template reference. The current, correct system is the one documented above (`#050D05` / `#00C853`, Instrument Serif + DM Sans).

## Design lock reminder

Per CONTENT_STATE.md and WORKFLOW.md, the first content session prototypes and locks ONE post template built from the tokens above, and gets Bill's sign-off, before any post renders to HTML. Once locked, every post renders against that template so the set reads as one system.
