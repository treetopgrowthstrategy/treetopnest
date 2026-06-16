#!/usr/bin/env python3
"""
treetop_library_index.py

Inject (or update) a "Full content index" section into src/pages/content-library.astro
that lists every content page on the site grouped by cluster. Pairs with the
glossary A-Z + linker + sitemap so every page is reachable within 2 clicks of /.

Run: python3 treetop_library_index.py
"""
from __future__ import annotations
import json
import re
from pathlib import Path

REPO = Path(__file__).parent
ASTRO = REPO / "src" / "pages"
TARGET = ASTRO / "content-library.astro"
BASE = "https://treetopgrowthstrategy.com"

MARK_START = "<!-- treetop-library-index-START -->"
MARK_END = "<!-- treetop-library-index-END -->"

# Acronyms to preserve correctly in titles
ACRONYMS = {
    "cmo": "CMO", "cro": "CRO", "cfo": "CFO", "coo": "COO",
    "chro": "CHRO", "cto": "CTO", "ceo": "CEO",
    "gtm": "GTM", "saas": "SaaS", "b2b": "B2B", "b2c": "B2C",
    "llm": "LLM", "mcp": "MCP", "rag": "RAG",
    "ai": "AI", "api": "API", "crm": "CRM", "kpi": "KPI",
    "roi": "ROI", "seo": "SEO", "aeo": "AEO", "geo": "GEO",
    "nps": "NPS", "csat": "CSAT", "tam": "TAM", "sam": "SAM",
    "som": "SOM", "ux": "UX",
    "ab": "A/B", "abm": "ABM", "plg": "PLG", "ltv": "LTV", "cac": "CAC",
    "hvac": "HVAC", "hr": "HR", "ar": "AR", "ap": "AP",
}


def humanize_slug(slug: str, prefix_to_strip: str = "") -> str:
    """Turn slug into a readable title."""
    s = slug
    if prefix_to_strip and s.startswith(prefix_to_strip):
        s = s[len(prefix_to_strip):]
    parts = s.split("-")
    fixed = []
    for p in parts:
        if p.lower() in ACRONYMS:
            fixed.append(ACRONYMS[p.lower()])
        else:
            fixed.append(p.capitalize())
    return " ".join(fixed)


def collect_by_pattern(pattern_fn) -> list[tuple[str, str]]:
    out = []
    for p in sorted(ASTRO.rglob("*.astro")):
        slug = "/".join(p.relative_to(ASTRO).with_suffix("").parts)
        if slug == "index":
            continue
        result = pattern_fn(slug)
        if result is not None:
            out.append(result)
    return out


def render_section(title: str, intro: str, items: list[tuple[str, str]], section_id: str) -> str:
    if not items:
        return ""
    cards = "\n".join(
        f'  <a class="card" href="/{slug}"><div class="card-h">{name}</div></a>'
        for slug, name in items
    )
    return f"""<section id="{section_id}"><div class="sec-inner">
<span class="lbl">{title}</span>
<h2 class="sec-h">{title}</h2>
<p style="color:#8FAF8F;font-size:0.92rem;line-height:1.7;max-width:780px;margin-bottom:1.5rem;">{intro}</p>
<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">
{cards}
</div>
</div></section>"""


def make_item_list_schema(all_sections: list[tuple[str, list[tuple[str, str]]]]) -> str:
    """Build ItemList schemas, one per section."""
    schemas = []
    for label, items in all_sections:
        if not items:
            continue
        il = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": f"Treetop content library — {label}",
            "url": f"{BASE}/content-library",
            "numberOfItems": len(items),
            "itemListOrder": "https://schema.org/ItemListOrderAscending",
            "itemListElement": [
                {"@type": "ListItem", "position": i + 1,
                 "url": f"{BASE}/{slug}", "name": name}
                for i, (slug, name) in enumerate(items)
            ],
        }
        schemas.append(json.dumps(il, ensure_ascii=False))
    return "\n".join(
        f'<script type="application/ld+json">\n{j}\n</script>'
        for j in schemas
    )


def main():
    # Niche AI-for industry pages (small businesses)
    def ai_for_niche(slug):
        if "/" in slug:
            return None
        m = re.match(r"^ai-for-([a-z][a-z-]+)$", slug)
        if not m:
            return None
        rest = m.group(1)
        # Skip role pages and -cmos/-cros etc.
        if rest in ("cmos", "cros", "cfos", "coos", "chros", "small-business",
                    "vp-marketing", "vp-customer-success"):
            return None
        # Skip industry-by-role pages (handled separately)
        if any(rest.endswith(f"-{r}") for r in ("cmos", "cros", "cfos", "vps-marketing", "founders")):
            return None
        return slug, "AI for " + humanize_slug(rest)

    niche_items = sorted(collect_by_pattern(ai_for_niche), key=lambda x: x[1])

    # AI agents for X
    def ai_agents(slug):
        if "/" in slug:
            return None
        m = re.match(r"^ai-agents-for-([a-z][a-z-]+)$", slug)
        if not m:
            return None
        return slug, "AI agents for " + humanize_slug(m.group(1))

    agents_items = sorted(collect_by_pattern(ai_agents), key=lambda x: x[1])

    # AI CMO for X (industries)
    def ai_cmo_industry(slug):
        if "/" in slug:
            return None
        m = re.match(r"^ai-cmo-for-([a-z][a-z-]+)$", slug)
        if not m:
            return None
        return slug, "AI CMO for " + humanize_slug(m.group(1))

    ai_cmo_items = sorted(collect_by_pattern(ai_cmo_industry), key=lambda x: x[1])

    # Claude for X (industries)
    def claude_for(slug):
        if "/" in slug:
            return None
        m = re.match(r"^claude-for-([a-z][a-z-]+)$", slug)
        if not m:
            return None
        # Skip variants with spaces
        if "for-business " in slug or "for-business-" in slug:
            return None
        rest = m.group(1)
        # Skip duplicate variants (claude-for-business-3 etc.)
        if rest.endswith(" 3") or rest.endswith(" 4"):
            return None
        return slug, "Claude for " + humanize_slug(rest)

    claude_items = sorted(collect_by_pattern(claude_for), key=lambda x: x[1])

    # How-to-X-with-claude
    def how_to_claude(slug):
        if "/" in slug:
            return None
        if not slug.startswith("how-to-") or not slug.endswith("-with-claude"):
            return None
        # Strip "how-to-" prefix and "-with-claude" suffix for clean naming
        rest = slug[7:-12]
        # Title case
        name = humanize_slug(rest) + " with Claude"
        return slug, name

    howto_claude_items = sorted(collect_by_pattern(how_to_claude), key=lambda x: x[1])

    # General how-to (not -with-claude)
    def how_to_general(slug):
        if "/" in slug:
            return None
        if not slug.startswith("how-to-") or slug.endswith("-with-claude"):
            return None
        rest = slug[7:]
        return slug, "How to " + humanize_slug(rest).lower().replace(" ", " ")

    howto_items = sorted(collect_by_pattern(how_to_general), key=lambda x: x[1])

    # Cost pages
    def cost_pages(slug):
        if "/" in slug:
            return None
        if not slug.startswith("how-much-does"):
            return None
        return slug, "How much does " + humanize_slug(slug[14:]).lower() + "?"

    cost_items = sorted(collect_by_pattern(cost_pages), key=lambda x: x[1])

    # Comparison X-vs-Y
    def comparison(slug):
        if "/" in slug:
            return None
        if "-vs-" not in slug:
            return None
        # Skip resources/* and other subdirs already handled
        if slug.startswith("fractional-cmo-vs-") or slug.startswith("ai-cmo-vs-"):
            pass  # keep these
        # Build name
        parts = slug.split("-vs-")
        if len(parts) != 2:
            return None
        left = humanize_slug(parts[0])
        right = humanize_slug(parts[1])
        return slug, f"{left} vs {right}"

    compare_items = sorted(collect_by_pattern(comparison), key=lambda x: x[1])

    # Case studies
    def case_studies(slug):
        if "/" in slug:
            return None
        if not slug.startswith("case-study-"):
            return None
        return slug, humanize_slug(slug[11:])

    case_items = sorted(collect_by_pattern(case_studies), key=lambda x: x[1])

    # Best-AI-X roundups
    def best_ai(slug):
        if "/" in slug:
            return None
        if not slug.startswith("best-ai-"):
            return None
        return slug, "Best " + humanize_slug(slug[5:])

    best_items = sorted(collect_by_pattern(best_ai), key=lambda x: x[1])

    sections_html = []
    sections_for_schema = []

    section_specs = [
        ("ai-for-industry-list", "AI for industries (small business and vertical)",
         f"{len(niche_items)} guides covering AI use cases, tools, and ROI for specific industries.", niche_items),
        ("ai-agents-list", "AI agents by function and industry",
         f"{len(agents_items)} guides covering AI agent deployment by team and vertical.", agents_items),
        ("ai-cmo-industries-list", "AI CMO by industry",
         f"{len(ai_cmo_items)} guides on the AI CMO operating model in specific industries.", ai_cmo_items),
        ("claude-for-list", "Claude for industries and roles",
         f"{len(claude_items)} practical Claude guides per industry and role.", claude_items),
        ("how-to-claude-list", "How to do X with Claude",
         f"{len(howto_claude_items)} prompt-template playbooks for specific writing and analysis tasks.", howto_claude_items),
        ("how-to-list", "How to do X (general operator how-tos)",
         f"{len(howto_items)} operator how-tos on rolling out AI, hiring, and running modern GTM.", howto_items),
        ("cost-list", "Cost references",
         f"{len(cost_items)} 2026 cost references for AI tools, consultants, fractional executives, and implementations.", cost_items),
        ("comparison-list", "Side-by-side comparisons",
         f"{len(compare_items)} honest comparisons of AI tools, fractional models, and SaaS alternatives.", compare_items),
        ("case-studies-list", "Case studies",
         f"{len(case_items)} client outcomes and operator stories.", case_items),
        ("roundups-list", "Best-of roundups",
         f"{len(best_items)} curated tool roundups for specific roles and industries.", best_items),
    ]

    for sid, title, intro, items in section_specs:
        sections_html.append(render_section(title, intro, items, sid))
        sections_for_schema.append((title, items))

    item_list_schemas = make_item_list_schema(sections_for_schema)

    block = (
        f"{MARK_START}\n"
        f"{item_list_schemas}\n"
        + "\n".join(sections_html)
        + f"\n{MARK_END}"
    )

    content = TARGET.read_text(encoding="utf-8")
    pat = re.compile(re.escape(MARK_START) + r".*?" + re.escape(MARK_END), re.DOTALL)
    if pat.search(content):
        new = pat.sub(block, content)
        print("Replaced existing library-index section")
    else:
        # Insert before existing linker block or GlobalFooter
        anchor = "<!-- treetop-linker-related-START -->"
        i = content.find(anchor)
        if i == -1:
            anchor = "<GlobalFooter />"
            i = content.find(anchor)
        if i == -1:
            new = content + "\n\n" + block + "\n"
        else:
            new = content[:i] + block + "\n\n" + content[i:]
        print("Inserted new library-index section")
    TARGET.write_text(new, encoding="utf-8")

    total_items = sum(len(items) for _, items in sections_for_schema)
    print(f"\nIndexed {total_items} items across {sum(1 for _, items in sections_for_schema if items)} sections:")
    for title, items in sections_for_schema:
        if items:
            print(f"  {len(items):4d}  {title}")
    print(f"\nWrote {TARGET} ({TARGET.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
