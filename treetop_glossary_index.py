#!/usr/bin/env python3
"""
treetop_glossary_index.py

Inject (or update) a "Full A-Z index" section into src/pages/glossary.astro
that lists every /what-is-X page on the site. Idempotent: re-running replaces
the section. Pairs with the linker/sitemap so /glossary becomes a true
comprehensive hub.

Run: python3 treetop_glossary_index.py
"""
from __future__ import annotations

import re
from pathlib import Path

REPO = Path(__file__).parent
ASTRO = REPO / "src" / "pages"
TARGET = ASTRO / "glossary.astro"

MARK_START = "<!-- treetop-glossary-az-START -->"
MARK_END = "<!-- treetop-glossary-az-END -->"

ACRONYM_FIXES = {
    " acv": " ACV", " arr": " ARR", " mrr": " MRR", " nrr": " NRR",
    " gmv": " GMV", " ltv": " LTV", " cac": " CAC",
    " nps": " NPS", " csat": " CSAT", " ces": " CES",
    " tam": " TAM", " sam": " SAM", " som": " SOM",
    " seo": " SEO", " aeo": " AEO", " geo": " GEO",
    " ai ": " AI ", " ai?": " AI?", " ai-": " AI-",
    " ab ": " A/B ",
    " kpi": " KPI", " roi": " ROI",
    " crm": " CRM", " api": " API", " sdk": " SDK",
    " saas": " SaaS",
    " llm": " LLM", " mcp": " MCP", " rag": " RAG",
    " cmo": " CMO", " cro": " CRO", " cfo": " CFO",
    " coo": " COO", " chro": " CHRO", " cto": " CTO",
    " gtm": " GTM",
    " b2b": " B2B", " b2c": " B2C",
    " abm ": " ABM ", " abm?": " ABM?",
    " plg": " PLG",
}


def humanize(slug: str) -> str:
    """Turn 'what-is-net-promoter-score' into 'Net Promoter Score'."""
    name = slug.replace("what-is-", "").replace("-", " ")
    # Special slugs
    full = "what is " + name + "?"
    # Apply acronym fixes
    for k, v in ACRONYM_FIXES.items():
        full = full.replace(k, v)
    # Title-case the first letter
    full = full[0].upper() + full[1:]
    # Capitalize "What"
    return full


def collect_terms() -> list[tuple[str, str]]:
    terms = []
    for p in sorted(ASTRO.glob("what-is-*.astro")):
        slug = p.stem
        url = "/" + slug
        terms.append((url, humanize(slug)))
    return terms


def render_section(terms: list[tuple[str, str]]) -> str:
    import json
    grid = "\n".join(
        f'  <a class="card" href="{u}"><div class="card-h">{name}</div></a>'
        for u, name in terms
    )
    # ItemList schema so Google knows this is a comprehensive index
    BASE = "https://treetopgrowthstrategy.com"
    item_list = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Treetop AI & GTM Glossary — full A-Z index",
        "url": f"{BASE}/glossary#all-terms",
        "numberOfItems": len(terms),
        "itemListOrder": "https://schema.org/ItemListOrderAscending",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": i + 1,
                "url": f"{BASE}{u}",
                "name": name,
            }
            for i, (u, name) in enumerate(terms)
        ],
    }
    schema_json = json.dumps(item_list, ensure_ascii=False)
    return (
        f"{MARK_START}\n"
        f'<script type="application/ld+json">\n{schema_json}\n</script>\n'
        f'<section id="all-terms"><div class="sec-inner">\n'
        f'<span class="lbl">Full A-Z index</span>\n'
        f'<h2 class="sec-h">Every term, A to Z</h2>\n'
        f'<p style="color:#8FAF8F;font-size:0.92rem;line-height:1.7;max-width:780px;margin-bottom:1.5rem;">'
        f"Every glossary term Treetop publishes, listed alphabetically. "
        f"Each one links to a plain-English definition with the practical implications for buyers and operators."
        f"</p>\n"
        f'<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">\n'
        f"{grid}\n"
        f"</div>\n"
        f"</div></section>\n"
        f"{MARK_END}"
    )


def main():
    terms = collect_terms()
    print(f"Found {len(terms)} terms")
    section = render_section(terms)
    content = TARGET.read_text(encoding="utf-8")
    pat = re.compile(re.escape(MARK_START) + r".*?" + re.escape(MARK_END), re.DOTALL)
    if pat.search(content):
        new = pat.sub(section, content)
        print("Replaced existing A-Z section")
    else:
        # Insert before the linker block if present, else before GlobalFooter
        anchor = "<!-- treetop-linker-related-START -->"
        i = content.find(anchor)
        if i == -1:
            anchor = "<GlobalFooter />"
            i = content.find(anchor)
        if i == -1:
            # Append at end
            new = content + "\n\n" + section + "\n"
        else:
            new = content[:i] + section + "\n\n" + content[i:]
        print("Inserted new A-Z section")
    TARGET.write_text(new, encoding="utf-8")
    print(f"Wrote {TARGET} ({len(new)} bytes)")


if __name__ == "__main__":
    main()
