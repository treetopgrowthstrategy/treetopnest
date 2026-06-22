#!/usr/bin/env python3
"""
treetop_linker_v2.py

Idempotent internal-link booster. Injects a "Related guides" block before
<GlobalFooter /> on every Astro/HTML page, with a topic-aware set of 6-10
contextually-relevant peer/hub/money-page links chosen by URL pattern.

Run from repo root:  python3 treetop_linker_v2.py
                     python3 treetop_linker_v2.py --dry-run   (no writes)

Design notes
------------
* Each page is classified by URL pattern into a recipe.
* The recipe returns an ordered list of candidate (slug, anchor) targets.
* We dedupe against in-body links the page already has (don't waste a slot).
* We render the block with the site's design system (dark green palette).
* Idempotency: HTML comment markers around the block. Re-running re-renders.
* Safety: never write if any anchor target file is missing.
* The block sits ABOVE <GlobalFooter /> (Astro) or before </body> (HTML).
"""

from __future__ import annotations

import re
import sys
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).parent
ASTRO = REPO / "src" / "pages"
PUB = REPO / "public"

MARK_START = "<!-- treetop-linker-related-START -->"
MARK_END = "<!-- treetop-linker-related-END -->"

# ---------------------------------------------------------------------------
# Anchor variety map: for high-volume targets, provide 3-4 anchor variants
# so the link block doesn't repeat the same anchor across thousands of pages.
# A deterministic per-source pick keeps it stable while varying across pages.
# ---------------------------------------------------------------------------
ANCHOR_VARIANTS: dict[str, list[str]] = {
    "/fractional-cmo": [
        "Fractional CMO services",
        "Treetop's fractional CMO offering",
        "Hire a fractional Chief Marketing Officer",
        "The fractional CMO playbook",
    ],
    "/fractional-cro": [
        "Fractional CRO services",
        "Treetop's fractional CRO offering",
        "Hire a fractional Chief Revenue Officer",
    ],
    "/fractional-cfo": [
        "Fractional CFO services",
        "Treetop's fractional CFO offering",
        "Hire a fractional Chief Financial Officer",
    ],
    "/fractional-coo": [
        "Fractional COO services",
        "Treetop's fractional COO offering",
        "Hire a fractional Chief Operating Officer",
    ],
    "/fractional-chro": [
        "Fractional CHRO services",
        "Treetop's fractional CHRO offering",
        "Hire a fractional Chief People Officer",
    ],
    "/fractional-cto": [
        "Fractional CTO services",
        "Treetop's fractional CTO offering",
        "Hire a fractional Chief Technology Officer",
    ],
    "/hire-fractional-cmo": [
        "Hire a fractional CMO",
        "Engage a fractional CMO",
        "Treetop fractional CMO engagement",
        "Start a fractional CMO engagement",
    ],
    "/ai-for-cmos": [
        "AI for CMOs",
        "The AI toolkit for marketing leaders",
        "AI tools every CMO should know",
    ],
    "/ai-for-cros": [
        "AI for CROs",
        "The AI toolkit for revenue leaders",
        "AI tools for chief revenue officers",
    ],
    "/ai-for-cfos": [
        "AI for CFOs",
        "The AI toolkit for finance leaders",
        "AI tools for chief financial officers",
    ],
    "/ai-for-coos": [
        "AI for COOs",
        "The AI toolkit for operations leaders",
        "AI tools for chief operating officers",
    ],
    "/ai-for-chros": [
        "AI for CHROs",
        "The AI toolkit for people leaders",
        "AI tools for chief people officers",
    ],
    "/how-to-use-ai-in-your-business": [
        "How to use AI in your business",
        "Getting started with AI in your business",
        "A practical guide to AI for your business",
        "How to roll out AI in your business",
    ],
    "/the-ai-native-gtm-framework": [
        "The AI-native GTM framework",
        "Treetop's AI-native GTM framework",
        "How AI-native GTM works",
    ],
    "/what-is-ai-native-gtm": [
        "What is AI-native GTM?",
        "AI-native GTM, defined",
        "Plain-English: AI-native GTM",
    ],
    "/glossary": [
        "AI &amp; GTM glossary",
        "Treetop's glossary",
        "Full AI and GTM glossary",
    ],
    "/resources": [
        "Treetop resources",
        "Resource library",
        "All Treetop resources",
    ],
    "/content-library": [
        "Content library",
        "Treetop content library",
        "All Treetop content",
    ],
    "/services/ai-audit": [
        "Treetop AI Audit",
        "Book the Treetop AI Audit",
        "The $1,500 AI Audit",
        "AI Audit service",
    ],
    "/quiz": [
        "AI-Native GTM Gap Assessment",
        "Take the GTM Gap Assessment",
        "Treetop's gap assessment quiz",
    ],
    "/about": [
        "About Treetop",
        "Treetop Growth Strategy: about us",
    ],
    "/fractional-executive-pricing-guide-2026": [
        "Fractional executive pricing (2026)",
        "The 2026 fractional executive pricing guide",
        "What fractional executives cost in 2026",
    ],
    "/how-to-hire-a-fractional-cmo": [
        "How to hire a fractional CMO",
        "The step-by-step guide to hiring a fractional CMO",
        "Hiring a fractional CMO: the process",
    ],
    "/case-studies": [
        "Case studies",
        "Treetop case studies",
        "Real client outcomes",
    ],
    "/blog": [
        "Treetop blog",
        "All posts",
        "Blog",
    ],
    "/claude-for-business": [
        "Claude for business",
        "Using Claude in business",
        "Claude: the practical guide for business",
    ],
    "/fractional-cmo-near-me": [
        "Fractional CMO near me",
        "Find a fractional CMO near you",
    ],
    "/ai-tool-stack-auditor": [
        "AI Tool Stack Auditor",
        "Free AI stack audit",
        "Treetop's AI Tool Stack Auditor",
    ],
    "/ai-implementation-consultant": [
        "AI implementation consultant",
        "AI implementation services",
        "Treetop's AI implementation consultant",
    ],
    "/how-to-hire-a-fractional-cmo": [
        "How to hire a fractional CMO",
        "The step-by-step guide to hiring a fractional CMO",
        "Hiring a fractional CMO: the process",
    ],
    "/what-is-a-fractional-executive": [
        "What is a fractional executive?",
        "Fractional executive, defined",
        "Plain-English: fractional executive",
    ],
    "/fractional-cmo-vs-agency": [
        "Fractional CMO vs. agency",
        "Fractional CMO vs marketing agency",
        "Comparing fractional CMO and agency",
    ],
    "/fractional-cmo-vs-full-time-cmo": [
        "Fractional vs. full-time CMO",
        "Fractional CMO vs full-time CMO compared",
        "When to choose fractional over full-time CMO",
    ],
    "/how-much-does-a-fractional-cmo-cost": [
        "Fractional CMO cost",
        "How much a fractional CMO costs",
        "2026 fractional CMO pricing",
    ],
    "/how-much-does-a-fractional-cro-cost": [
        "Fractional CRO cost",
        "How much a fractional CRO costs",
        "2026 fractional CRO pricing",
    ],
    "/how-much-does-a-fractional-cfo-cost": [
        "Fractional CFO cost",
        "How much a fractional CFO costs",
        "2026 fractional CFO pricing",
    ],
    "/how-much-does-a-fractional-coo-cost": [
        "Fractional COO cost",
        "How much a fractional COO costs",
        "2026 fractional COO pricing",
    ],
    "/how-much-does-a-fractional-cto-cost": [
        "Fractional CTO cost",
        "How much a fractional CTO costs",
        "2026 fractional CTO pricing",
    ],
    "/how-much-does-ai-marketing-cost": [
        "How much AI marketing costs",
        "AI marketing cost reference",
        "2026 AI marketing pricing",
    ],
    "/how-much-does-claude-cost": [
        "How much Claude costs",
        "Claude pricing breakdown",
        "Claude cost across tiers",
    ],
    "/how-much-does-chatgpt-cost": [
        "How much ChatGPT costs",
        "ChatGPT pricing breakdown",
        "ChatGPT cost across tiers",
    ],
    "/save-time-with-ai-small-business": [
        "How small businesses save time with AI",
        "Time savings from AI for small business",
        "Small business AI time savings",
    ],
    "/ai-workflow-automation-small-business": [
        "Small-business AI workflow guide",
        "Automating workflows with AI for small business",
        "AI workflow automation playbook",
    ],
    "/ai-for-small-business": [
        "AI for small business",
        "Where AI pays off first for small business owners",
        "Treetop's small-business AI guide",
    ],
    "/claude-for-small-business": [
        "Claude for small business",
        "Practical Claude for small business",
        "Using Claude in a small business",
    ],
    "/ai-cmo": [
        "AI CMO: the buyer's guide",
        "AI CMO products and platforms",
        "Choosing an AI CMO",
    ],
    "/ai-agents-for-business": [
        "AI agents for business",
        "The cross-functional AI agents playbook",
        "AI agents at a B2B company",
    ],
    "/ai-agents-for-sales": [
        "AI agents for sales",
        "Sales AI agents playbook",
        "AI agents in the sales function",
    ],
    "/ai-agents-for-marketing": [
        "AI agents for marketing",
        "Marketing AI agents playbook",
        "AI agents in the marketing function",
    ],
    "/state-of-b2b-gtm-report-2026": [
        "State of B2B GTM (2026 report)",
        "The 2026 B2B GTM report",
        "Treetop's B2B GTM benchmark",
    ],
    "/fractional-cmo": [
        "Fractional CMO services",
        "Treetop's fractional CMO offering",
        "Hire a fractional Chief Marketing Officer",
        "The fractional CMO playbook",
        "What a fractional CMO does",
    ],
}


def vary_anchor(url: str, base_anchor: str, source_url: str) -> str:
    """Return a deterministically-varied anchor for `url` given the source page."""
    variants = ANCHOR_VARIANTS.get(url)
    if not variants:
        return base_anchor
    # Deterministic pick by source URL hash so each source uses ONE specific variant
    h = sum(ord(c) for c in source_url)
    return variants[h % len(variants)]

DRY_RUN = "--dry-run" in sys.argv


# ---------------------------------------------------------------------------
# Discovery
# ---------------------------------------------------------------------------


def url_for_astro(p: Path) -> str:
    rel = p.relative_to(ASTRO)
    parts = list(rel.parts)
    last = re.sub(r"\.(astro|md|mdx)$", "", parts[-1])
    if last == "index":
        parts = parts[:-1]
        return "/" + ("/".join(parts) + "/" if parts else "")
    parts[-1] = last
    return "/" + "/".join(parts)


def existing_pages() -> set[str]:
    s = set()
    for p in ASTRO.rglob("*.astro"):
        s.add(url_for_astro(p))
    for p in PUB.rglob("*.html"):
        s_str = str(p)
        if any(
            x in s_str
            for x in (
                "node_modules",
                "_astro",
                "/dist/",
                "/clients/",
                "/proposals/",
                "/reports/",
                "/tools/ecofit/",
                "/mp-group/",
                "/work/",
            )
        ):
            continue
        s.add("/" + str(p.relative_to(PUB)))
    return s


# ---------------------------------------------------------------------------
# Per-page link recipe
# ---------------------------------------------------------------------------

# Money pages — every recipe ends with 1-2 of these to push internal link equity.
MONEY = [
    ("/hire-fractional-cmo", "Hire a fractional CMO"),
    ("/services/ai-audit", "Treetop AI Audit"),
    ("/quiz", "AI-Native GTM Gap Assessment"),
]


def role_money(role: str) -> tuple[str, str]:
    return (f"/fractional-{role}", f"Fractional {role.upper()}")


# Pre-baked nearby-city groups (alphabetical sweep, kept short).
# Used for fractional-{role}-{city} pages.
NEARBY_CITIES_BY_REGION: dict[str, list[str]] = {
    # Texas
    "austin": ["dallas", "houston", "san-antonio"],
    "dallas": ["austin", "houston", "san-antonio", "plano"],
    "houston": ["austin", "dallas", "san-antonio"],
    "san-antonio": ["austin", "dallas", "houston"],
    "plano": ["dallas", "irving", "arlington-tx"],
    "irving": ["dallas", "plano", "arlington-tx"],
    "arlington-tx": ["dallas", "plano", "irving"],
    "fayetteville": ["raleigh-durham", "charlotte"],
    "lubbock": ["austin", "dallas"],
    # Florida
    "miami": ["tampa", "orlando", "jacksonville"],
    "tampa": ["miami", "orlando", "jacksonville"],
    "orlando": ["miami", "tampa", "jacksonville"],
    "jacksonville": ["tampa", "orlando", "miami"],
    # California
    "los-angeles": ["san-diego", "san-francisco", "long-beach", "anaheim"],
    "san-diego": ["los-angeles", "long-beach", "anaheim"],
    "san-francisco": ["los-angeles", "oakland", "sacramento"],
    "oakland": ["san-francisco", "sacramento"],
    "sacramento": ["san-francisco", "oakland"],
    "long-beach": ["los-angeles", "san-diego", "anaheim"],
    "anaheim": ["los-angeles", "long-beach", "san-diego"],
    # NY / NJ
    "new-york": ["jersey-city", "newark", "boston"],
    "jersey-city": ["new-york", "newark"],
    "newark": ["new-york", "jersey-city"],
    "buffalo": ["new-york", "rochester"],
    # NE
    "boston": ["providence", "hartford", "worcester"],
    "providence": ["boston", "hartford", "worcester"],
    "hartford": ["boston", "providence", "worcester"],
    "worcester": ["boston", "providence", "hartford"],
    # PA / DC / MD
    "philadelphia": ["pittsburgh", "baltimore", "washington-dc"],
    "pittsburgh": ["philadelphia", "cleveland", "columbus"],
    "washington-dc": ["baltimore", "richmond", "philadelphia"],
    "baltimore": ["washington-dc", "richmond", "philadelphia"],
    "richmond": ["washington-dc", "baltimore", "virginia-beach"],
    "virginia-beach": ["richmond", "washington-dc"],
    # Midwest
    "chicago": ["milwaukee", "indianapolis", "minneapolis"],
    "minneapolis": ["chicago", "milwaukee", "madison"],
    "milwaukee": ["chicago", "minneapolis", "madison"],
    "madison": ["milwaukee", "minneapolis", "chicago"],
    "madison-al": ["birmingham", "nashville"],
    "indianapolis": ["chicago", "cincinnati", "columbus"],
    "columbus": ["cincinnati", "indianapolis", "cleveland"],
    "cincinnati": ["columbus", "indianapolis", "cleveland"],
    "cleveland": ["columbus", "cincinnati", "pittsburgh"],
    "detroit": ["grand-rapids", "cleveland", "columbus"],
    "grand-rapids": ["detroit", "chicago"],
    "st-louis": ["kansas-city", "memphis", "nashville"],
    "kansas-city": ["st-louis", "omaha", "lincoln"],
    "omaha": ["kansas-city", "lincoln", "des-moines"],
    "lincoln": ["omaha", "kansas-city", "des-moines"],
    "des-moines": ["omaha", "kansas-city", "lincoln"],
    # Southeast
    "atlanta": ["charlotte", "nashville", "birmingham"],
    "charlotte": ["raleigh-durham", "atlanta", "greensboro"],
    "raleigh-durham": ["charlotte", "greensboro", "durham"],
    "durham": ["raleigh-durham", "charlotte"],
    "greensboro": ["raleigh-durham", "charlotte", "winston-salem"],
    "winston-salem": ["greensboro", "raleigh-durham", "charlotte"],
    "nashville": ["atlanta", "memphis", "knoxville"],
    "knoxville": ["nashville", "chattanooga", "charlotte"],
    "chattanooga": ["nashville", "knoxville", "atlanta"],
    "memphis": ["nashville", "st-louis", "birmingham"],
    "birmingham": ["nashville", "atlanta", "memphis"],
    "savannah": ["atlanta", "jacksonville", "charleston"],
    "charleston": ["savannah", "atlanta", "charlotte"],
    "greenville-sc": ["charlotte", "atlanta", "knoxville"],
    "spokane": ["seattle", "portland", "boise"],
    "boise": ["seattle", "portland", "spokane"],
    # West / Mountain
    "denver": ["colorado-springs", "salt-lake-city", "boise"],
    "colorado-springs": ["denver", "salt-lake-city"],
    "salt-lake-city": ["denver", "boise", "las-vegas"],
    "phoenix": ["tucson", "mesa", "scottsdale", "chandler"],
    "mesa": ["phoenix", "scottsdale", "chandler"],
    "scottsdale": ["phoenix", "mesa", "chandler"],
    "chandler": ["phoenix", "mesa", "scottsdale"],
    "las-vegas": ["phoenix", "salt-lake-city", "los-angeles"],
    "reno": ["sacramento", "salt-lake-city", "san-francisco"],
    "seattle": ["portland", "spokane", "boise"],
    "portland": ["seattle", "spokane", "boise"],
    "eugene": ["portland", "seattle"],
    # Misc
    "honolulu": ["san-francisco", "los-angeles"],
    "ann-arbor": ["detroit", "grand-rapids"],
    "springfield-mo": ["kansas-city", "st-louis"],
    "tulsa": ["kansas-city", "st-louis"],
    "new-orleans": ["birmingham", "memphis", "houston"],
    "tucson": ["phoenix", "mesa"],
}


def nearby_cities(city: str) -> list[str]:
    """Return a list of nearby city slugs. Falls back to alpha-neighbors if unknown."""
    if city in NEARBY_CITIES_BY_REGION:
        return NEARBY_CITIES_BY_REGION[city][:4]
    # Fallback: alphabetical neighbors from the same role's city list.
    # We don't have that list inside this helper, so use a deterministic
    # rotation across the largest cities to ensure something useful gets linked.
    BIG_CITIES = [
        "austin", "boston", "chicago", "dallas", "denver", "houston",
        "los-angeles", "miami", "new-york", "phoenix", "seattle", "san-francisco",
        "atlanta", "philadelphia", "washington-dc", "san-diego",
    ]
    fallback = [c for c in BIG_CITIES if c != city]
    h = sum(ord(c) for c in city)
    n = len(fallback)
    return [fallback[(h + i * 7) % n] for i in range(3)]


def humanize_city(city: str) -> str:
    parts = city.split("-")
    # Special-case known abbreviations
    fix = {"sc": "SC", "tx": "TX", "al": "AL", "mo": "MO", "dc": "DC"}
    return " ".join(fix.get(p, p.capitalize()) for p in parts)


# ---------------------------------------------------------------------------
# Recipes: url pattern -> list of (target_slug, anchor) candidates
# Order matters — earlier candidates win when we trim to MAX.
# ---------------------------------------------------------------------------

MAX_LINKS = 8


def fractional_city_recipe(url: str) -> list[tuple[str, str]]:
    # /fractional-cmo-houston -> role=cmo, city=houston
    m = re.match(r"^/fractional-([a-z]+)-([a-z][a-z-]+)$", url)
    if not m:
        return []
    role = m.group(1)
    city = m.group(2)
    city_h = humanize_city(city)
    cands: list[tuple[str, str]] = [
        (f"/fractional-{role}", f"Fractional {role.upper()} services"),
        (f"/how-much-does-a-fractional-{role}-cost", f"Fractional {role.upper()} cost"),
        ("/how-to-hire-a-fractional-cmo", "How to hire a fractional executive"),
        ("/fractional-executive-pricing-guide-2026", "Fractional executive pricing (2026)"),
        ("/hire-fractional-cmo", "Hire a fractional CMO"),
    ]
    if role == "cmo":
        cands.append(("/fractional-cmo-vs-agency", "Fractional CMO vs. agency"))
        cands.append(("/fractional-cmo-vs-full-time-cmo", "Fractional vs. full-time CMO"))
    elif role == "cro":
        cands.append(("/fractional-cro-vs-vp-sales", "Fractional CRO vs. VP of Sales"))
    # Nearby cities
    for nc in nearby_cities(city):
        cands.append((f"/fractional-{role}-{nc}", f"Fractional {role.upper()} in {humanize_city(nc)}"))
    # If we have no nearby cities, push fractional-cmo-near-me as a hub
    cands.append(("/fractional-cmo-near-me", "Fractional CMO near me"))
    # Spread to cross-role canonical pages so non-CMO roles get inbound from city pages
    # (deterministic-per-city pick of one other role)
    other_roles = [r for r in ("cmo", "cro", "cfo", "coo", "chro", "cto") if r != role]
    pick = other_roles[sum(ord(c) for c in city) % len(other_roles)]
    cands.append((f"/fractional-{pick}", f"Fractional {pick.upper()} services"))
    cands.append(("/ai-for-cmos", "AI for CMOs"))
    return cands


def ai_for_niche_recipe(url: str, all_urls: set[str]) -> list[tuple[str, str]]:
    """For /ai-for-{niche} pages: link to peers, hub, role pages."""
    m = re.match(r"^/ai-for-([a-z][a-z-]+)$", url)
    if not m:
        return []
    # If this is a role page (cmos, cros, etc.), use a different recipe
    if m.group(1) in {"cmos", "cros", "cfos", "coos", "chros"}:
        return ai_for_role_recipe(url)
    cands: list[tuple[str, str]] = [
        ("/ai-for-small-business", "AI for small business"),
        ("/how-to-use-ai-in-your-business", "How to use AI in your business"),
        ("/ai-workflow-automation-small-business", "AI workflow automation guide"),
        ("/save-time-with-ai-small-business", "How small businesses save time with AI"),
        ("/how-much-does-ai-marketing-cost", "How much AI marketing costs"),
        ("/services/ai-audit", "Treetop AI Audit"),
    ]
    # Peer niches (pick 3-4 by simple slug similarity)
    peers = _pick_peer_niches(url, all_urls, count=4)
    for p_slug, p_anchor in peers:
        cands.append((p_slug, p_anchor))
    return cands


def _pick_peer_niches(url: str, all_urls: set[str], count: int) -> list[tuple[str, str]]:
    """Pick peer ai-for-X pages from same family by simple slug similarity."""
    if not url.startswith("/ai-for-"):
        return []
    target_slug = url[1:]
    # Hand-curated peer groups (URL slug -> peer URL slugs in same theme)
    FAMILIES = [
        # Food/beverage/events
        {"ai-for-caterers", "ai-for-food-trucks", "ai-for-wineries", "ai-for-breweries",
         "ai-for-wedding-planners", "ai-for-travel-agencies"},
        # Beauty/wellness/fitness
        {"ai-for-med-spas", "ai-for-salons", "ai-for-yoga-studios", "ai-for-dance-studios",
         "ai-for-crossfit-gyms", "ai-for-martial-arts-schools", "ai-for-pet-businesses"},
        # Healthcare practices
        {"ai-for-dermatologists", "ai-for-optometrists", "ai-for-pediatricians",
         "ai-for-veterinarians", "ai-for-chiropractors", "ai-for-dentists", "ai-for-senior-care"},
        # Trades
        {"ai-for-home-services", "ai-for-hvac-contractors", "ai-for-plumbers",
         "ai-for-electricians", "ai-for-painters", "ai-for-landscapers", "ai-for-contractors"},
        # Auto / education / multi
        {"ai-for-auto-dealers", "ai-for-auto-repair-shops", "ai-for-car-washes",
         "ai-for-tutoring-businesses", "ai-for-childcare", "ai-for-microschools",
         "ai-for-multi-location-businesses", "ai-for-franchise-businesses"},
        # Agencies and industry verticals (older content)
        {"ai-for-agencies-cmos", "ai-for-agencies-cros", "ai-for-agencies-cfos", "ai-for-agencies-vps-marketing"},
        {"ai-for-ecommerce-cmos", "ai-for-ecommerce-cros", "ai-for-ecommerce-cfos", "ai-for-ecommerce-vps-marketing"},
        {"ai-for-saas-cmos", "ai-for-saas-cros", "ai-for-saas-cfos", "ai-for-saas-vps-marketing"},
        {"ai-for-fintech-cmos", "ai-for-fintech-cros", "ai-for-fintech-cfos", "ai-for-fintech-vps-marketing"},
        {"ai-for-healthcare-tech-cmos", "ai-for-healthcare-tech-cros", "ai-for-healthcare-tech-cfos", "ai-for-healthcare-tech-vps-marketing"},
        {"ai-for-manufacturing-cmos", "ai-for-manufacturing-cros", "ai-for-manufacturing-cfos", "ai-for-manufacturing-vps-marketing"},
        {"ai-for-insurance-cmos", "ai-for-insurance-cros", "ai-for-insurance-cfos", "ai-for-insurance-vps-marketing"},
        {"ai-for-legal-cmos", "ai-for-legal-cros", "ai-for-legal-cfos", "ai-for-legal-vps-marketing"},
        {"ai-for-logistics-cmos", "ai-for-logistics-cros", "ai-for-logistics-cfos", "ai-for-logistics-vps-marketing"},
        {"ai-for-nonprofits-cmos", "ai-for-nonprofits-cros", "ai-for-nonprofits-cfos", "ai-for-nonprofits-vps-marketing"},
        {"ai-for-real-estate-cmos", "ai-for-real-estate-cros", "ai-for-real-estate-cfos", "ai-for-real-estate-vps-marketing"},
        {"ai-for-energy-cmos", "ai-for-energy-cros", "ai-for-energy-cfos", "ai-for-energy-vps-marketing"},
        {"ai-for-education-cmos", "ai-for-education-cros", "ai-for-education-cfos", "ai-for-education-vps-marketing"},
        {"ai-for-hospitality-cmos", "ai-for-hospitality-cros", "ai-for-hospitality-cfos", "ai-for-hospitality-vps-marketing"},
        {"ai-for-professional-services-cmos", "ai-for-professional-services-cros", "ai-for-professional-services-cfos", "ai-for-professional-services-vps-marketing"},
    ]
    family = None
    for fam in FAMILIES:
        if target_slug in fam:
            family = fam
            break
    if not family:
        return []
    out: list[tuple[str, str]] = []
    for peer in sorted(family - {target_slug}):
        peer_url = "/" + peer
        if peer_url in all_urls:
            anchor = "AI for " + peer.replace("ai-for-", "").replace("-", " ")
            out.append((peer_url, anchor))
        if len(out) >= count:
            break
    return out


def ai_for_role_recipe(url: str) -> list[tuple[str, str]]:
    """For /ai-for-cmos, /ai-for-cros, etc.: role pillar pages."""
    m = re.match(r"^/ai-for-([a-z]+)$", url)
    if not m:
        return []
    role = m.group(1)
    short = role[:-1] if role.endswith("s") else role  # cmos -> cmo
    cands: list[tuple[str, str]] = [
        (f"/fractional-{short}", f"Fractional {short.upper()} services"),
        (f"/how-much-does-a-fractional-{short}-cost", f"Fractional {short.upper()} cost"),
        ("/the-ai-native-gtm-framework", "The AI-native GTM framework"),
        ("/what-is-ai-native-gtm", "What is AI-native GTM?"),
        ("/ai-for-cmos", "AI for CMOs"),
        ("/ai-for-cros", "AI for CROs"),
        ("/ai-for-cfos", "AI for CFOs"),
        ("/ai-for-coos", "AI for COOs"),
        ("/ai-for-chros", "AI for CHROs"),
        ("/services/ai-audit", "Treetop AI Audit"),
    ]
    # Dedup the role itself
    cands = [(u, a) for u, a in cands if u != url]
    return cands


# ---------------------------------------------------------------------------
# Claude "getting started / fundamentals" cluster (2026).
# Surfaced into the Claude-related recipes so the cluster earns internal inbound
# links from the broader Claude content instead of sitting as an island.
# ---------------------------------------------------------------------------
CLAUDE_FUNDAMENTALS: list[tuple[str, str]] = [
    ("/claude-vs-chatgpt-for-knowledge-work", "Claude vs ChatGPT for knowledge work"),
    ("/how-to-set-up-claude-first-time", "How to set up Claude for the first time"),
    ("/claude-artifacts-skills-connectors-explained", "Artifacts, Skills &amp; Connectors explained"),
    ("/claude-for-email-overload", "Use Claude to tame email overload"),
    ("/word-reports-to-polished-output-with-claude", "Turn Word reports into polished output"),
    ("/is-claude-safe-on-your-work-computer", "Is Claude safe on your work computer?"),
    ("/should-non-developers-use-claude-code", "Should non-developers use Claude Code?"),
    ("/claude-without-recording-sensitive-meetings", "Use Claude without recording meetings"),
    ("/claude-fluency", "Claude Fluency: team training"),
]


def pick_fundamentals(source_url: str, n: int) -> list[tuple[str, str]]:
    """Deterministically rotate the fundamentals per source page so inbound
    links spread evenly across the cluster (and vary page to page)."""
    if not CLAUDE_FUNDAMENTALS:
        return []
    off = sum(ord(c) for c in source_url) % len(CLAUDE_FUNDAMENTALS)
    rotated = CLAUDE_FUNDAMENTALS[off:] + CLAUDE_FUNDAMENTALS[:off]
    return [(u, a) for u, a in rotated if u != source_url][:n]


# ---------------------------------------------------------------------------
# Custom CRM / AI-native CRM cluster (2026). Surfaced into revops/GTM/sales
# pages so the cluster earns internal inbound (and feeds the usebilly.io play).
# ---------------------------------------------------------------------------
CRM_FUNDAMENTALS: list[tuple[str, str]] = [
    ("/build-a-custom-crm", "Should you build a custom CRM?"),
    ("/what-is-an-ai-native-crm", "What is an AI-native CRM?"),
    ("/custom-crm-vs-off-the-shelf", "Custom CRM vs off-the-shelf"),
    ("/how-much-does-it-cost-to-build-a-custom-crm", "Cost to build a custom CRM"),
    ("/crm-for-small-business-without-a-sales-team", "CRM for a business with no sales team"),
    ("/salesforce-alternatives-for-small-teams", "Salesforce alternatives for small teams"),
    ("/crm-build-vs-buy-calculator", "CRM build vs buy calculator"),
    ("/building-a-crm-in-airtable-or-notion", "Building a CRM in Airtable or Notion"),
]

# Existing pages where CRM content is genuinely relevant; each gets 2 CRM links
# prepended. Non-existent source URLs simply never match, so this is safe.
CRM_SOURCE_ALLOWLIST: set[str] = {
    "/the-ai-native-gtm-framework", "/what-is-ai-native-gtm", "/how-to-clean-your-crm-with-ai",
    "/how-to-use-ai-to-research-prospects", "/ai-for-cros", "/ai-for-cmos",
    "/how-to-use-claude-for-sales", "/how-to-use-claude-for-sales-prospecting",
    "/claude-prompts-for-sales", "/how-to-use-ai-to-write-proposals",
    "/how-to-write-cold-emails-with-claude", "/how-to-prep-for-sales-calls-with-claude",
}


def pick_crm(source_url: str, n: int) -> list[tuple[str, str]]:
    """Rotate CRM targets per source page for even inbound distribution."""
    if not CRM_FUNDAMENTALS:
        return []
    off = sum(ord(c) for c in source_url) % len(CRM_FUNDAMENTALS)
    rotated = CRM_FUNDAMENTALS[off:] + CRM_FUNDAMENTALS[:off]
    return [(u, a) for u, a in rotated if u != source_url][:n]


# ---------------------------------------------------------------------------
# AI consulting "core" cluster (2026). New commercial pages that target the
# surging "ai consulting / hire an ai consultant / ai consulting rates" queries.
# Surfaced into the 85 ai-consultant-{city} pages, the AI cost pages, and the
# existing consulting pillars/decision pages so they earn internal inbound.
# ---------------------------------------------------------------------------
AI_CONSULTING_FUNDAMENTALS: list[tuple[str, str]] = [
    ("/ai-consulting-services", "What AI consulting services cover"),
    ("/how-to-hire-an-ai-consultant", "How to hire an AI consultant"),
    ("/ai-consulting-rates", "AI consulting rates and pricing"),
    ("/ai-consultant-for-small-business", "AI consultant for small business"),
    ("/fractional-ai-consultant", "What a fractional AI consultant does"),
    ("/enterprise-ai-consulting", "Enterprise AI consulting"),
    ("/ai-consulting-firm", "How to choose an AI consulting firm"),
    ("/generative-ai-consulting", "What generative AI consulting is"),
]

# Existing consulting pillars and buyer-decision pages where the new core pages
# are genuinely relevant; each gets 2 prepended. Non-existent URLs never match.
AI_CONSULTING_SOURCE_ALLOWLIST: set[str] = {
    "/what-is-ai-consulting", "/ai-strategy-consultant", "/ai-implementation-consultant",
    "/claude-implementation-consultant", "/revenue-operations-consultant",
    "/is-it-worth-hiring-an-ai-consultant", "/how-to-evaluate-an-ai-consultant",
    "/how-to-choose-an-ai-strategy-consultant", "/ai-consultant-vs-doing-it-yourself",
    "/ai-consultant-cost", "/do-i-need-an-ai-strategy", "/ai-audit-vs-ai-strategy",
}


def pick_ai_consulting(source_url: str, n: int) -> list[tuple[str, str]]:
    """Rotate AI-consulting core targets per source page for even inbound."""
    if not AI_CONSULTING_FUNDAMENTALS:
        return []
    off = sum(ord(c) for c in source_url) % len(AI_CONSULTING_FUNDAMENTALS)
    rotated = AI_CONSULTING_FUNDAMENTALS[off:] + AI_CONSULTING_FUNDAMENTALS[:off]
    return [(u, a) for u, a in rotated if u != source_url][:n]


# ---------------------------------------------------------------------------
# Click-boost pool (2026): high-IMPRESSION pages stuck on page 2 in GSC. Every
# Claude/comparison source page funnels one extra inbound link to a rotating
# member so their ranking (and thus clicks, not just impressions) climbs.
# ---------------------------------------------------------------------------
CLICK_BOOST: list[tuple[str, str]] = [
    ("/claude-vs-notion-ai", "Claude vs Notion AI, compared"),
    ("/claude-for-nonprofits", "Claude for nonprofits (use cases + pricing)"),
    ("/claude-prompts-for-sales", "Claude prompts for sales"),
    ("/claude-vs-chatgpt-for-sales-operations", "Claude vs ChatGPT for sales ops"),
    ("/claude-team-vs-claude-enterprise", "Claude Team vs Enterprise"),
    ("/b2b-ai-vendor-comparison-matrix-2026", "The B2B AI vendor comparison matrix"),
    ("/best-ai-tools-for-consultants-2026", "Best AI tools for consultants (2026)"),
    ("/claude-for-real-estate-agents", "Claude for real estate agents"),
    ("/claude-prompts-for-hr", "Claude prompts for HR"),
    ("/gong-vs-chorus", "Gong vs Chorus, compared"),
    ("/otter-vs-fathom", "Otter vs Fathom, compared"),
    ("/best-ai-meeting-assistants-2026", "Best AI meeting assistants (2026)"),
    ("/okara-ai-cmo-review", "Okara AI CMO review"),
]


def pick_boost(source_url: str, n: int) -> list[tuple[str, str]]:
    """Rotate click-boost targets per source page for even inbound distribution."""
    if not CLICK_BOOST:
        return []
    off = sum(ord(c) for c in source_url) % len(CLICK_BOOST)
    rotated = CLICK_BOOST[off:] + CLICK_BOOST[:off]
    return [(u, a) for u, a in rotated if u != source_url][:n]


def how_to_with_claude_recipe(url: str) -> list[tuple[str, str]]:
    """For /how-to-X-with-claude pages: link to peers and hubs."""
    if not (url.startswith("/how-to-") and url.endswith("-with-claude")):
        return []
    # Long pool of how-to-with-claude pages; pick deterministically by URL hash
    POOL = [
        ("/how-to-use-claude-for-marketing", "How to use Claude for marketing"),
        ("/claude-prompts-for-marketing", "Claude prompts for marketing"),
        ("/how-to-use-ai-in-your-business", "How to use AI in your business"),
        ("/claude-for-business", "Claude for business"),
        ("/how-to-write-follow-up-emails-with-claude", "Follow-up emails with Claude"),
        ("/how-to-write-cold-outreach-sequences-with-claude", "Cold outreach sequences with Claude"),
        ("/how-to-write-linkedin-articles-with-claude", "LinkedIn articles with Claude"),
        ("/how-to-write-blog-headlines-with-claude", "Blog headlines with Claude"),
        ("/how-to-write-customer-success-emails-with-claude", "Customer success emails with Claude"),
        ("/how-to-write-renewal-emails-with-claude", "Renewal emails with Claude"),
        ("/how-to-write-upsell-emails-with-claude", "Upsell emails with Claude"),
        ("/how-to-write-product-launch-emails-with-claude", "Product launch emails with Claude"),
        ("/how-to-write-product-update-emails-with-claude", "Product update emails with Claude"),
        ("/how-to-write-event-invitations-with-claude", "Event invitations with Claude"),
        ("/how-to-write-internal-newsletters-with-claude", "Internal newsletters with Claude"),
        ("/how-to-write-twitter-threads-with-claude", "Twitter threads with Claude"),
        ("/how-to-write-meta-descriptions-with-claude", "Meta descriptions with Claude"),
        ("/how-to-write-webinar-promotion-with-claude", "Webinar promotion with Claude"),
        ("/how-to-write-all-hands-decks-with-claude", "All-hands decks with Claude"),
        ("/how-to-write-podcast-show-notes-with-claude", "Podcast show notes with Claude"),
        ("/how-to-write-help-center-articles-with-claude", "Help center articles with Claude"),
        ("/how-to-design-customer-research-studies-with-claude", "Customer research with Claude"),
        ("/how-to-draft-investor-pitch-decks-with-claude", "Investor pitch decks with Claude"),
        ("/how-to-analyze-call-recordings-with-claude", "Call-recording analysis with Claude"),
        ("/how-to-build-a-content-agent-with-claude", "Build a content agent with Claude"),
        ("/how-to-build-a-sales-agent-with-claude", "Build a sales agent with Claude"),
        ("/how-to-build-a-slack-agent-with-claude", "Build a Slack agent with Claude"),
        ("/how-to-conduct-customer-interviews-with-claude", "Customer interviews with Claude"),
        ("/how-to-conduct-market-research-with-claude", "Market research with Claude"),
        ("/how-to-conduct-performance-reviews-with-claude", "Performance reviews with Claude"),
        ("/how-to-conduct-win-loss-analysis-with-claude", "Win/loss analysis with Claude"),
        ("/how-to-design-customer-onboarding-with-claude", "Customer onboarding design with Claude"),
        ("/how-to-do-competitive-research-with-claude", "Competitive research with Claude"),
        ("/how-to-analyze-competitive-positioning-with-claude", "Competitive positioning with Claude"),
        ("/services/ai-audit", "Treetop AI Audit"),
        ("/how-to-write-a-marketing-plan-with-claude", "Write a marketing plan with Claude"),
        ("/how-to-write-a-marketing-brief-with-claude", "Write a marketing brief with Claude"),
    ]
    POOL = [(u, a) for u, a in POOL if u != url]
    h = sum(ord(c) for c in url)
    n = len(POOL)
    picks = []
    seen = set()
    # Always include core hubs
    for u, a in POOL[:4]:
        picks.append((u, a))
        seen.add(u)
    # Plus deterministic-rotation picks for variety
    for i in range(20):
        u, a = POOL[(h + i * 11) % n]
        if u not in seen:
            picks.append((u, a))
            seen.add(u)
        if len(picks) >= 12:
            break
    return pick_fundamentals(url, 2) + picks


def resources_recipe(url: str) -> list[tuple[str, str]]:
    """For /resources/X pages: tie them into the main link graph."""
    if not url.startswith("/resources/"):
        return []
    cands: list[tuple[str, str]] = [
        ("/resources", "All Treetop resources"),
        ("/content-library", "Treetop content library"),
        ("/glossary", "AI &amp; GTM glossary"),
        ("/fractional-cmo", "Fractional CMO services"),
        ("/how-to-use-ai-in-your-business", "How to use AI in your business"),
        ("/ai-for-cmos", "AI for CMOs"),
        ("/services/ai-audit", "Treetop AI Audit"),
        ("/quiz", "AI-Native GTM Gap Assessment"),
        ("/blog", "Treetop blog"),
        ("/case-studies", "Case studies"),
    ]
    return [(u, a) for u, a in cands if u != url]


def glossary_recipe(url: str) -> list[tuple[str, str]]:
    """For /what-is-X pages: related glossary terms by topic."""
    if not url.startswith("/what-is-"):
        return []
    # Topic groups
    GROUPS = [
        # Retention / churn
        ["/what-is-churn-rate", "/what-is-revenue-churn", "/what-is-logo-churn",
         "/what-is-net-revenue-retention", "/what-is-customer-lifetime-value"],
        # Loyalty surveys
        ["/what-is-net-promoter-score", "/what-is-customer-satisfaction-score",
         "/what-is-customer-effort-score"],
        # Product
        ["/what-is-activation-rate", "/what-is-aha-moment", "/what-is-northstar-metric",
         "/what-is-product-led-growth", "/what-is-product-market-fit"],
        # Revenue / deals
        ["/what-is-contract-value", "/what-is-annual-contract-value",
         "/what-is-annual-recurring-revenue", "/what-is-monthly-recurring-revenue",
         "/what-is-gross-merchandise-value"],
        # Market sizing
        ["/what-is-total-addressable-market", "/what-is-serviceable-addressable-market",
         "/what-is-serviceable-obtainable-market"],
        # Data
        ["/what-is-first-party-data", "/what-is-third-party-data", "/what-is-zero-party-data",
         "/what-is-intent-data"],
        # Brand / category
        ["/what-is-brand-equity", "/what-is-share-of-voice", "/what-is-category-creation",
         "/what-is-category-king", "/what-is-vanity-metrics", "/what-is-dark-funnel"],
        # AI search / SEO
        ["/what-is-geo", "/what-is-aeo", "/what-is-zero-click-search", "/what-is-seo"],
        # GTM
        ["/what-is-gtm-strategy", "/what-is-go-to-market-fit", "/what-is-ai-native-gtm",
         "/what-is-growth-marketing", "/what-is-product-marketing",
         "/what-is-content-marketing", "/what-is-inbound-marketing",
         "/what-is-outbound-marketing", "/what-is-performance-marketing",
         "/what-is-lifecycle-marketing"],
        # Roles
        ["/what-is-a-fractional-executive", "/what-is-a-fractional-chro",
         "/what-is-a-fractional-cto", "/what-is-a-fractional-head-of-growth"],
        # AI concepts
        ["/what-is-an-ai-cmo", "/what-is-ai-native-gtm", "/what-is-an-ai-copilot",
         "/what-is-an-ai-rollup", "/what-is-an-ai-hallucination",
         "/what-is-a-system-prompt", "/what-is-a-vector-database"],
        # Marketing concepts
        ["/what-is-account-based-marketing", "/what-is-brand-positioning",
         "/what-is-attribution-modeling", "/what-is-ab-testing",
         "/what-is-content-marketing", "/what-is-growth-marketing"],
        # Sales / pipeline
        ["/what-is-marketing-qualified-lead", "/what-is-sales-qualified-lead",
         "/what-is-pipeline-velocity", "/what-is-deal-cycle",
         "/what-is-revenue-operations"],
    ]
    cands: list[tuple[str, str]] = []
    for group in GROUPS:
        if url in group:
            for peer in group:
                if peer != url:
                    label = peer.replace("/what-is-", "").replace("-", " ")
                    cands.append((peer, "What is " + label + "?"))
            break
    # Universal hubs
    cands.append(("/glossary", "Full AI &amp; GTM glossary"))
    cands.append(("/resources", "Treetop resources"))
    return cands


def claude_for_recipe(url: str) -> list[tuple[str, str]]:
    """For /claude-for-{industry} pages: link to peers and hub."""
    if not url.startswith("/claude-for-"):
        return []
    PEERS = [
        "/claude-for-business", "/claude-for-small-business",
        "/claude-for-fitness", "/claude-for-insurance", "/claude-for-education",
        "/claude-for-nonprofits", "/claude-for-wealth-management",
        "/claude-for-architecture", "/claude-for-finance", "/claude-for-construction",
        "/claude-for-contractors", "/claude-for-consultants", "/claude-for-agencies",
        "/claude-for-e-commerce", "/claude-for-professional-services",
        "/claude-for-doctors", "/claude-for-dentists", "/claude-for-engineers",
        "/claude-for-designers", "/claude-for-accountants", "/claude-for-financial-advisors",
    ]
    cands: list[tuple[str, str]] = []
    for p in PEERS:
        if p == url:
            continue
        label = p.replace("/claude-for-", "").replace("-", " ").title()
        cands.append((p, f"Claude for {label}"))
    cands.append(("/how-to-use-ai-in-your-business", "How to use AI in your business"))
    cands.append(("/services/ai-audit", "Treetop AI Audit"))
    # Surface 2 getting-started posts so the industry pages feed the cluster.
    return pick_fundamentals(url, 2) + cands


def comparison_recipe(url: str) -> list[tuple[str, str]]:
    """For X-vs-Y comparison pages: link to other comparisons + cost pages."""
    if "-vs-" not in url:
        return []
    # Other commonly-paired comparisons (deterministic list, not per-page)
    cands: list[tuple[str, str]] = [
        ("/chatgpt-vs-claude-for-business", "ChatGPT vs Claude for business"),
        ("/claude-ai-vs-chatgpt-small-business", "Claude vs ChatGPT (small business)"),
        ("/claude-vs-microsoft-copilot", "Claude vs Microsoft Copilot"),
        ("/claude-vs-cursor", "Claude vs Cursor"),
        ("/claude-vs-perplexity", "Claude vs Perplexity"),
        ("/notion-ai-vs-claude", "Notion AI vs Claude"),
        ("/jasper-vs-claude", "Jasper vs Claude"),
        ("/copy-ai-vs-claude", "Copy.ai vs Claude"),
        ("/how-much-does-claude-cost", "How much does Claude cost?"),
        ("/how-much-does-chatgpt-cost", "How much does ChatGPT cost?"),
        ("/best-ai-tools-for-cmos-2026", "Best AI tools for CMOs (2026)"),
        ("/claude-for-business", "Claude for business"),
        ("/claude-vs-chatgpt-for-knowledge-work", "Claude vs ChatGPT for knowledge work"),
    ]
    # Lead with one getting-started post so comparison readers enter the cluster.
    return pick_fundamentals(url, 1) + [(u, a) for u, a in cands if u != url]


def cost_recipe(url: str) -> list[tuple[str, str]]:
    """For /how-much-does-X-cost pages: link to siblings + role pages."""
    if not url.startswith("/how-much-does"):
        return []
    cands: list[tuple[str, str]] = [
        ("/how-much-does-a-fractional-cmo-cost", "Fractional CMO cost"),
        ("/how-much-does-a-fractional-cro-cost", "Fractional CRO cost"),
        ("/how-much-does-a-fractional-cfo-cost", "Fractional CFO cost"),
        ("/how-much-does-a-fractional-coo-cost", "Fractional COO cost"),
        ("/how-much-does-a-fractional-cto-cost", "Fractional CTO cost"),
        ("/how-much-does-a-cmo-cost", "Full-time CMO cost"),
        ("/how-much-does-ai-marketing-cost", "How much AI marketing costs"),
        ("/how-much-does-an-ai-consultant-cost", "How much an AI consultant costs"),
        ("/how-much-does-an-ai-cmo-cost", "How much an AI CMO costs"),
        ("/fractional-executive-pricing-guide-2026", "Fractional executive pricing (2026)"),
    ]
    base = [(u, a) for u, a in cands if u != url]
    # The Claude/ChatGPT cost pages are part of the Claude cluster; lead with
    # getting-started posts there (but not on the fractional cost pages).
    if "claude" in url or "chatgpt" in url:
        return pick_fundamentals(url, 2) + base
    # AI cost pages (consultant/strategy/implementation/cmo) feed the new core
    # consulting cluster, especially the rates page.
    if "-ai-" in url or url.endswith("-ai-consultant-cost"):
        return [("/ai-consulting-rates", "AI consulting rates and pricing")] + pick_ai_consulting(url, 1) + base
    return base


CLAUDE_HUB_TARGETS: dict[str, list[tuple[str, str]]] = {
    "/claude-training": [
        ("/claude-fluency", "Claude Fluency: team training"),
        ("/how-to-set-up-claude-first-time", "How to set up Claude for the first time"),
        ("/claude-artifacts-skills-connectors-explained", "Artifacts, Skills &amp; Connectors explained"),
        ("/claude-for-small-business", "Claude for small business"),
    ],
    "/what-is-claude-code": [
        ("/should-non-developers-use-claude-code", "Should non-developers use Claude Code?"),
        ("/claude-artifacts-skills-connectors-explained", "Artifacts, Skills &amp; Connectors explained"),
        ("/how-to-set-up-claude-first-time", "How to set up Claude for the first time"),
    ],
    "/what-is-claude-projects": [
        ("/how-to-set-up-claude-first-time", "How to set up Claude for the first time"),
        ("/claude-artifacts-skills-connectors-explained", "Artifacts, Skills &amp; Connectors explained"),
    ],
    "/how-to-use-claude": [
        ("/how-to-set-up-claude-first-time", "How to set up Claude for the first time"),
        ("/claude-artifacts-skills-connectors-explained", "Artifacts, Skills &amp; Connectors explained"),
        ("/claude-for-email-overload", "Use Claude to tame email overload"),
        ("/word-reports-to-polished-output-with-claude", "Turn Word reports into polished output"),
    ],
    "/is-claude-safe-for-business-data": [
        ("/is-claude-safe-on-your-work-computer", "Is Claude safe on your work computer?"),
        ("/claude-without-recording-sensitive-meetings", "Use Claude without recording meetings"),
        ("/claude-for-legal", "Claude for legal businesses"),
    ],
    "/what-is-claude-ai": [
        ("/claude-vs-chatgpt-for-knowledge-work", "Claude vs ChatGPT for knowledge work"),
        ("/how-to-set-up-claude-first-time", "How to set up Claude for the first time"),
        ("/claude-artifacts-skills-connectors-explained", "Artifacts, Skills &amp; Connectors explained"),
    ],
}


def claude_hub_recipe(url: str) -> list[tuple[str, str]]:
    """Tailored links from a few high-value Claude hub pages into the cluster."""
    items = CLAUDE_HUB_TARGETS.get(url)
    if not items:
        return []
    tail = [
        ("/claude-for-business", "Claude for business"),
        ("/claude-fluency", "Claude Fluency: team training"),
        ("/how-to-use-ai-in-your-business", "How to use AI in your business"),
    ]
    return items + pick_fundamentals(url, 2) + tail


def case_study_recipe(url: str) -> list[tuple[str, str]]:
    """For /case-study-X pages: link to other case studies + hubs."""
    if not url.startswith("/case-study-"):
        return []
    cands: list[tuple[str, str]] = [
        ("/case-studies", "All Treetop case studies"),
        ("/case-study-fractional-cmo-took-startup-from-4m-to-9m", "Fractional CMO scales startup 4M → 9M"),
        ("/case-study-marketing-agency-2x-content-output", "Agency 2x content output with AI"),
        ("/case-study-finance-firm-deployed-claude-across-four-functions", "Finance firm deploys Claude across 4 functions"),
        ("/case-study-ezo-io-enterprise-saas-revenue-systems", "EZO.io: enterprise SaaS revenue systems"),
        ("/services/implementation", "Treetop Implementation"),
        ("/services/ai-audit", "Treetop AI Audit"),
    ]
    return [(u, a) for u, a in cands if u != url]


def ai_agents_for_recipe(url: str) -> list[tuple[str, str]]:
    """For /ai-agents-for-X pages."""
    if not url.startswith("/ai-agents-for-"):
        return []
    PEERS = [
        "/ai-agents-for-business", "/ai-agents-for-sales", "/ai-agents-for-marketing",
        "/ai-agents-for-customer-service", "/ai-agents-for-ecommerce",
        "/ai-agents-for-finance-teams", "/ai-agents-for-accounting-firms",
        "/ai-agents-for-consultants", "/ai-agents-for-freelancers",
        "/ai-agents-for-healthcare", "/ai-agents-for-hr",
        "/ai-agents-for-law-firms", "/ai-agents-for-nonprofits",
        "/ai-agents-for-product-teams", "/ai-agents-for-real-estate",
        "/ai-agents-for-solo-founders", "/ai-agents-for-startups",
    ]
    cands: list[tuple[str, str]] = []
    for p in PEERS:
        if p == url:
            continue
        label = p.replace("/ai-agents-for-", "").replace("-", " ").title()
        cands.append((p, f"AI agents for {label}"))
    cands.append(("/how-to-use-ai-in-your-business", "How to use AI in your business"))
    cands.append(("/services/ai-audit", "Treetop AI Audit"))
    # One CRM link: AI-agents readers are revops-adjacent.
    return pick_crm(url, 1) + cands


def ai_cmo_for_recipe(url: str) -> list[tuple[str, str]]:
    """For /ai-cmo-for-X pages."""
    if not url.startswith("/ai-cmo-for-"):
        return []
    PEERS = [
        "/ai-cmo-for-agencies", "/ai-cmo-for-construction", "/ai-cmo-for-cpg",
        "/ai-cmo-for-ecommerce", "/ai-cmo-for-education", "/ai-cmo-for-energy",
        "/ai-cmo-for-fintech", "/ai-cmo-for-healthcare", "/ai-cmo-for-hospitality",
        "/ai-cmo-for-insurance", "/ai-cmo-for-logistics", "/ai-cmo-for-manufacturing",
        "/ai-cmo-for-media", "/ai-cmo-for-nonprofits", "/ai-cmo-for-professional-services",
        "/ai-cmo-for-real-estate", "/ai-cmo-for-saas",
    ]
    cands: list[tuple[str, str]] = []
    for p in PEERS:
        if p == url:
            continue
        label = p.replace("/ai-cmo-for-", "").replace("-", " ").title()
        cands.append((p, f"AI CMO for {label}"))
    cands.append(("/ai-cmo", "AI CMO: the buyer's guide"))
    cands.append(("/fractional-cmo", "Fractional CMO services"))
    cands.append(("/ai-for-cmos", "AI for CMOs"))
    return cands


def best_ai_recipe(url: str) -> list[tuple[str, str]]:
    """For /best-ai-X-tools-* roundup pages."""
    if not url.startswith("/best-ai-"):
        return []
    PEERS = [
        "/best-ai-tools-for-cmos-2026", "/best-ai-cmo-tools-2026",
        "/best-ai-tools-for-marketing-agencies-2026",
        "/best-ai-for-content-marketing", "/best-ai-tools-for-doctors-2026",
    ]
    cands: list[tuple[str, str]] = []
    for p in PEERS:
        if p == url:
            continue
        label = p.replace("/best-ai-", "Best AI ").replace("-", " ").rstrip(" 2026").rstrip("/")
        cands.append((p, label.title()))
    cands.append(("/how-to-use-ai-in-your-business", "How to use AI in your business"))
    cands.append(("/services/ai-audit", "Treetop AI Audit"))
    return cands


def fractional_canonical_recipe(url: str) -> list[tuple[str, str]]:
    """For /fractional-cmo, /fractional-cro etc. (canonical role pages)."""
    m = re.match(r"^/fractional-([a-z]+)$", url)
    if not m:
        return []
    role = m.group(1)
    cands: list[tuple[str, str]] = [
        ("/hire-fractional-cmo", "Hire a fractional CMO"),
        ("/fractional-executive-pricing-guide-2026", "Fractional executive pricing (2026)"),
        ("/how-to-hire-a-fractional-cmo", "How to hire a fractional CMO"),
        ("/what-is-a-fractional-executive", "What is a fractional executive?"),
        (f"/how-much-does-a-fractional-{role}-cost", f"Fractional {role.upper()} cost"),
        ("/fractional-cmo", "Fractional CMO services"),
        ("/fractional-cro", "Fractional CRO services"),
        ("/fractional-cfo", "Fractional CFO services"),
        ("/fractional-coo", "Fractional COO services"),
        ("/fractional-chro", "Fractional CHRO services"),
        ("/fractional-cto", "Fractional CTO services"),
        ("/ai-for-cmos", "AI for CMOs"),
    ]
    return [(u, a) for u, a in cands if u != url]


def ai_consultant_city_recipe(url: str) -> list[tuple[str, str]]:
    """For /ai-consultant-{city} pages (mirror of fractional-city pattern)."""
    m = re.match(r"^/ai-consultant-([a-z][a-z-]+)$", url)
    if not m:
        return []
    city = m.group(1)
    city_h = humanize_city(city)
    cands: list[tuple[str, str]] = [
        ("/ai-consulting-services", "What AI consulting services cover"),
        ("/how-to-hire-an-ai-consultant", "How to hire an AI consultant"),
        ("/ai-implementation-consultant", "AI implementation consultant services"),
        ("/how-much-does-an-ai-consultant-cost", "How much does an AI consultant cost?"),
        ("/services/ai-audit", "Treetop AI Audit"),
        ("/the-ai-native-gtm-framework", "The AI-native GTM framework"),
        ("/claude-for-business", "Claude for business"),
    ]
    # Rotate in one more new core page per city for even inbound distribution.
    cands += pick_ai_consulting(url, 1)
    # Nearby cities use the same map as fractional cities
    for nc in nearby_cities(city):
        cands.append((f"/ai-consultant-{nc}", f"AI consultant in {humanize_city(nc)}"))
    cands.append(("/fractional-cmo-near-me", "Fractional CMO near me"))
    return cands


def ai_tool_for_recipe(url: str) -> list[tuple[str, str]]:
    """For /chatgpt-for-X, /copilot-for-X, /gemini-for-X, /perplexity-for-X pages."""
    m = re.match(r"^/(chatgpt|copilot|gemini|perplexity)-for-([a-z][a-z-]+)$", url)
    if not m:
        return []
    tool = m.group(1)
    topic = m.group(2)
    # Link to siblings across the same tool family AND to Claude equivalents
    cands: list[tuple[str, str]] = []
    OTHER_TOOLS = [t for t in ("chatgpt", "copilot", "gemini", "perplexity") if t != tool]
    # Same-topic, other tools
    for other in OTHER_TOOLS:
        cands.append((f"/{other}-for-{topic}", f"{other.title()} for {topic.replace('-', ' ')}"))
    # Claude equivalent
    cands.append((f"/claude-for-{topic}", f"Claude for {topic.replace('-', ' ')}"))
    # Comparisons
    cands.append((f"/{tool}-vs-claude", f"{tool.title()} vs Claude"))
    cands.append(("/claude-for-business", "Claude for business"))
    cands.append((f"/how-much-does-{tool}-cost", f"How much does {tool.title()} cost?"))
    cands.append(("/how-to-use-ai-in-your-business", "How to use AI in your business"))
    cands.append(("/services/ai-audit", "Treetop AI Audit"))
    return cands


def how_to_general_recipe(url: str) -> list[tuple[str, str]]:
    """For /how-to-X (not ending in -with-claude). Cluster of operator how-tos."""
    if not url.startswith("/how-to-") or url.endswith("-with-claude"):
        return []
    POOL = [
        ("/how-to-use-ai-in-your-business", "How to use AI in your business"),
        ("/how-to-use-claude-for-marketing", "How to use Claude for marketing"),
        ("/how-to-build-a-gtm-strategy", "How to build a GTM strategy"),
        ("/how-to-hire-a-fractional-cmo", "How to hire a fractional CMO"),
        ("/how-to-roll-out-ai-to-a-50-person-company", "How to roll out AI to a 50-person company"),
        ("/how-to-measure-ai-roi", "How to measure AI ROI"),
        ("/how-to-choose-an-ai-strategy-consultant", "How to choose an AI strategy consultant"),
        ("/how-to-write-a-claude-system-prompt", "How to write a Claude system prompt"),
        ("/how-to-train-your-team-on-claude", "How to train your team on Claude"),
        ("/how-to-run-an-ai-pilot", "How to run an AI pilot"),
        ("/how-to-clean-your-crm-with-ai", "How to clean your CRM with AI"),
        ("/how-to-build-an-internal-prompt-library", "How to build an internal prompt library"),
        ("/how-to-audit-your-current-ai-usage", "How to audit your current AI usage"),
        ("/how-to-pitch-ai-to-your-board", "How to pitch AI to your board"),
        ("/how-to-use-claude-as-a-ceo", "How to use Claude as a CEO"),
        ("/how-to-use-claude-as-a-coo", "How to use Claude as a COO"),
        ("/how-to-use-claude-as-a-founder", "How to use Claude as a founder"),
        ("/how-to-use-ai-in-performance-reviews", "How to use AI in performance reviews"),
        ("/how-to-onboard-a-new-hire-with-ai", "How to onboard a new hire with AI"),
        ("/how-to-explain-ai-to-your-team", "How to explain AI to your team"),
        ("/how-to-evaluate-a-saas-vendor-with-claude", "How to evaluate a SaaS vendor with Claude"),
        ("/how-to-prep-for-a-board-meeting-with-claude", "How to prep for a board meeting with Claude"),
        ("/how-to-summarize-customer-calls-with-claude", "How to summarize customer calls with Claude"),
        ("/how-to-do-competitive-research-with-claude", "Competitive research with Claude"),
        ("/services/ai-audit", "Treetop AI Audit"),
        ("/fractional-cmo", "Fractional CMO services"),
        ("/claude-for-business", "Claude for business"),
    ]
    POOL = [(u, a) for u, a in POOL if u != url]
    h = sum(ord(c) for c in url)
    n = len(POOL)
    picks = []
    seen = set()
    # Always include core hubs
    for u, a in POOL[:4]:
        picks.append((u, a))
        seen.add(u)
    for i in range(20):
        u, a = POOL[(h + i * 13) % n]
        if u not in seen:
            picks.append((u, a))
            seen.add(u)
        if len(picks) >= 10:
            break
    return picks


def cmo_city_recipe(url: str) -> list[tuple[str, str]]:
    """For /cmo-{city} pages (different cluster from /fractional-cmo-{city})."""
    m = re.match(r"^/cmo-([a-z][a-z-]+)$", url)
    if not m:
        return []
    city = m.group(1)
    cands: list[tuple[str, str]] = [
        ("/fractional-cmo", "Fractional CMO services"),
        (f"/fractional-cmo-{city}", f"Fractional CMO in {humanize_city(city)}"),
        ("/hire-fractional-cmo", "Hire a fractional CMO"),
        ("/fractional-cmo-near-me", "Fractional CMO near me"),
        ("/how-much-does-a-fractional-cmo-cost", "Fractional CMO cost"),
        ("/how-to-hire-a-fractional-cmo", "How to hire a fractional CMO"),
        ("/fractional-cmo-vs-agency", "Fractional CMO vs. agency"),
        ("/services/ai-audit", "Treetop AI Audit"),
    ]
    return cands


def default_recipe(url: str) -> list[tuple[str, str]]:
    """Fallback for pages without a specific recipe — push popular hubs.
    Includes some long-tail variety to spread internal link equity."""
    # Mix in a deterministic-pseudo-random selection so different "default" pages
    # don't all point to the same 8 hubs.
    base = [
        ("/fractional-cmo", "Fractional CMO services"),
        ("/ai-for-cmos", "AI for CMOs"),
        ("/the-ai-native-gtm-framework", "The AI-native GTM framework"),
        ("/what-is-ai-native-gtm", "What is AI-native GTM?"),
        ("/how-to-use-ai-in-your-business", "How to use AI in your business"),
        ("/glossary", "AI &amp; GTM glossary"),
        ("/resources", "Treetop resources"),
        ("/services/ai-audit", "Treetop AI Audit"),
    ]
    # Long-tail rotation, picked deterministically by hashing the URL — so the
    # same page always gets the same 4 picks, but the picks vary per URL.
    tail_pool = [
        ("/blog", "Treetop blog"),
        ("/case-studies", "Case studies"),
        ("/content-library", "Content library"),
        ("/hire-fractional-cmo", "Hire a fractional CMO"),
        ("/how-to-hire-a-fractional-cmo", "How to hire a fractional CMO"),
        ("/fractional-executive-pricing-guide-2026", "Fractional executive pricing (2026)"),
        ("/ai-for-cros", "AI for CROs"),
        ("/ai-for-cfos", "AI for CFOs"),
        ("/ai-for-coos", "AI for COOs"),
        ("/ai-for-chros", "AI for CHROs"),
        ("/fractional-cro", "Fractional CRO services"),
        ("/fractional-cfo", "Fractional CFO services"),
        ("/fractional-coo", "Fractional COO services"),
        ("/fractional-chro", "Fractional CHRO services"),
        ("/fractional-cto", "Fractional CTO services"),
        ("/ai-agents-for-business", "AI agents for business"),
        ("/ai-agents-for-sales", "AI agents for sales"),
        ("/ai-agents-for-marketing", "AI agents for marketing"),
        ("/ai-cmo-for-ecommerce", "AI CMO for e-commerce"),
        ("/ai-cmo-for-saas", "AI CMO for SaaS"),
        ("/best-ai-tools-for-cmos-2026", "Best AI tools for CMOs (2026)"),
        ("/claude-for-business", "Claude for business"),
        ("/claude-for-small-business", "Claude for small business"),
        ("/how-to-build-a-gtm-strategy", "How to build a GTM strategy"),
        ("/what-is-gtm-strategy", "What is GTM strategy?"),
        ("/what-is-product-market-fit", "What is product-market fit?"),
        ("/what-is-product-led-growth", "What is product-led growth?"),
        ("/state-of-b2b-gtm-report-2026", "State of B2B GTM (2026 report)"),
        ("/state-of-ai-in-b2b-marketing-2026", "State of AI in B2B marketing (2026)"),
        ("/ai-cmo-readiness-quiz", "AI CMO readiness quiz"),
        ("/the-hidden-cost-of-fractional-cmo-turnover", "Hidden cost of fractional CMO turnover"),
        ("/signs-you-need-a-fractional-cmo", "Signs you need a fractional CMO"),
        ("/quiz", "AI-Native GTM Gap Assessment"),
    ]
    # Pick 4 tail items deterministically based on URL hash
    h = sum(ord(c) for c in url)
    n = len(tail_pool)
    picks = [tail_pool[(h + i * 7) % n] for i in range(4)]
    # Dedupe in case rotation collides
    seen = set()
    tail = []
    for u, a in picks:
        if u not in seen:
            tail.append((u, a))
            seen.add(u)
    return base + tail


# Recipe dispatcher
def recipe_for(url: str, all_urls: set[str]) -> list[tuple[str, str]]:
    base = _dispatch_recipe(url, all_urls)
    prefix: list[tuple[str, str]] = []
    # Prepend CRM links on the curated set of revops/GTM/sales pages.
    if url in CRM_SOURCE_ALLOWLIST:
        prefix += pick_crm(url, 2)
    # Prepend new AI-consulting core links on the existing consulting pillars
    # and buyer-decision pages so they funnel equity to the new pages.
    if url in AI_CONSULTING_SOURCE_ALLOWLIST:
        prefix += pick_ai_consulting(url, 2)
    # Funnel one inbound link to a high-impression "page 2" winner from every
    # Claude/comparison page, to lift those pages' ranking (impressions->clicks).
    if ("claude" in url or "-vs-" in url) and url not in [u for u, _ in CLICK_BOOST]:
        prefix += pick_boost(url, 1)
    return prefix + base


def _dispatch_recipe(url: str, all_urls: set[str]) -> list[tuple[str, str]]:
    for fn in (
        claude_hub_recipe,
        fractional_city_recipe,
        fractional_canonical_recipe,
        ai_consultant_city_recipe,
        cmo_city_recipe,
        ai_agents_for_recipe,
        ai_cmo_for_recipe,
        ai_tool_for_recipe,
        best_ai_recipe,
        how_to_with_claude_recipe,
        how_to_general_recipe,
        glossary_recipe,
        claude_for_recipe,
        comparison_recipe,
        cost_recipe,
        case_study_recipe,
        resources_recipe,
    ):
        cands = fn(url)
        if cands:
            return cands
    # ai_for_niche handled via all_urls
    if url.startswith("/ai-for-"):
        return ai_for_niche_recipe(url, all_urls)
    return default_recipe(url)


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------


def render_block(items: list[tuple[str, str]], source_url: str = "") -> str:
    """Render the Related guides block in the site's dark-green design system.
    Anchors are deterministically-varied per source page via ANCHOR_VARIANTS."""
    li_html = "\n".join(
        f'    <li><a href="{u}" style="color:#00C853;text-decoration:none;border-bottom:1px solid rgba(0,200,83,0.3);">{vary_anchor(u, a, source_url)} &rarr;</a></li>'
        for u, a in items
    )
    return (
        f"{MARK_START}\n"
        f'<section style="padding:3.5rem 2.5rem;border-top:1px solid #1A3A1A;background:#050D05;">\n'
        f'  <div style="max-width:780px;margin:0 auto;">\n'
        f'    <span style="font-size:0.68rem;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#00C853;margin-bottom:0.75rem;display:block;">Related</span>\n'
        f'    <h2 style="font-family:\'Instrument Serif\',serif;font-size:clamp(1.5rem,2.8vw,2rem);font-weight:400;line-height:1.2;color:#F0FFF0;margin-bottom:1.5rem;">Explore more from Treetop</h2>\n'
        f'    <ul style="list-style:none;padding:0;font-size:0.96rem;line-height:1.9;color:#C0D8C0;">\n'
        f"{li_html}\n"
        f"    </ul>\n"
        f"  </div>\n"
        f"</section>\n"
        f"{MARK_END}"
    )


# ---------------------------------------------------------------------------
# Read + write helpers
# ---------------------------------------------------------------------------

LINK_RE_LOCAL = re.compile(r'<a\s[^>]*href=["\']([^"\']+)["\'][^>]*>', re.IGNORECASE)


def existing_body_links(content: str) -> set[str]:
    """Return the set of internal URLs already linked from the body of this page.
    Strips nav/header/footer/script/style first so we count contextual links only."""
    body = content
    for tag in ("nav", "header", "footer", "script", "style"):
        body = re.sub(rf"<{tag}\b[^>]*>.*?</{tag}>", "", body, flags=re.IGNORECASE | re.DOTALL)
    # Also strip our own block if present so we can re-evaluate
    body = re.sub(re.escape(MARK_START) + r".*?" + re.escape(MARK_END), "", body, flags=re.DOTALL)
    urls = set()
    for m in LINK_RE_LOCAL.finditer(body):
        href = m.group(1).split("#")[0].split("?")[0]
        if href.startswith("/"):
            if href != "/" and href.endswith("/"):
                href = href.rstrip("/")
            urls.add(href)
    return urls


def insert_block(content: str, block: str) -> str:
    """Insert/replace block. Idempotent."""
    # If markers present, replace
    pattern = re.compile(
        re.escape(MARK_START) + r".*?" + re.escape(MARK_END),
        re.DOTALL,
    )
    if pattern.search(content):
        return pattern.sub(block, content)
    # Astro: insert before <GlobalFooter />
    m = re.search(r"<GlobalFooter\s*/>", content)
    if m:
        return content[: m.start()] + block + "\n\n" + content[m.start() :]
    # HTML: insert before </body>
    m = re.search(r"</body>", content, re.IGNORECASE)
    if m:
        return content[: m.start()] + block + "\n\n" + content[m.start() :]
    # Fallback: append
    return content + "\n\n" + block + "\n"


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------


def main():
    all_urls = existing_pages()
    print(f"Pages: {len(all_urls)}")

    # Collect (path, url, is_astro) tuples
    work: list[tuple[Path, str, bool]] = []
    for p in ASTRO.rglob("*.astro"):
        work.append((p, url_for_astro(p), True))
    for p in PUB.rglob("*.html"):
        s_str = str(p)
        if any(
            x in s_str
            for x in (
                "node_modules",
                "_astro",
                "/dist/",
                "/clients/",
                "/proposals/",
                "/reports/",
                "/tools/ecofit/",
                "/mp-group/",
                "/work/",
            )
        ):
            continue
        work.append((p, "/" + str(p.relative_to(PUB)), False))

    modified = 0
    untouched = 0
    skipped_missing_targets = 0
    by_target = defaultdict(int)
    skip_urls = {
        # Don't touch tiny utility/transactional/private pages.
        # The new Claude cluster posts already ship a curated "Related guides"
        # section, so skip the auto-block to avoid a second stacked block.
        "/claude-vs-chatgpt-for-knowledge-work",
        "/claude-artifacts-skills-connectors-explained",
        "/is-claude-safe-on-your-work-computer",
        "/how-to-set-up-claude-first-time",
        "/claude-for-email-overload",
        "/should-non-developers-use-claude-code",
        "/word-reports-to-polished-output-with-claude",
        "/claude-without-recording-sensitive-meetings",
        "/claude-fluency",
        "/book-a-call",
        # CRM cluster: also ships curated related sections.
        "/build-a-custom-crm",
        "/how-much-does-it-cost-to-build-a-custom-crm",
        "/custom-crm-vs-off-the-shelf",
        "/what-is-an-ai-native-crm",
        "/building-a-crm-in-airtable-or-notion",
        "/salesforce-alternatives-for-small-teams",
        "/crm-for-small-business-without-a-sales-team",
        "/crm-build-vs-buy-calculator",
        # New AI-consulting core pages: each ships a curated "Related guides"
        # section, so skip the auto-block to avoid a second stacked block.
        "/ai-consulting-services",
        "/how-to-hire-an-ai-consultant",
        "/ai-consulting-rates",
        "/ai-consultant-for-small-business",
        "/fractional-ai-consultant",
        "/enterprise-ai-consulting",
        "/ai-consulting-firm",
        "/generative-ai-consulting",
        "/best-ai-meeting-assistants-2026",
    }

    for path, url, is_astro in work:
        if url in skip_urls:
            continue
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        if len(content) > 800_000:
            continue
        # Skip files that are clearly not page templates
        if is_astro and "<html" not in content.lower() and "Layout" not in content:
            # Could be a partial component; skip
            pass

        # Get the recipe
        cands = recipe_for(url, all_urls)
        if not cands:
            untouched += 1
            continue

        # Filter to targets that exist
        cands = [(u, a) for u, a in cands if u in all_urls or (u + "/") in all_urls]
        if not cands:
            skipped_missing_targets += 1
            untouched += 1
            continue

        # Filter out targets already linked in body
        already = existing_body_links(content)
        # Always keep the strong canonical/peer links even if already linked elsewhere?
        # No — drop dups so the block stays compact.
        fresh = [(u, a) for u, a in cands if u not in already]
        # If everything's already linked, just take the top N candidates anyway
        # so the block exists as a topical hub (still beneficial for crawlers).
        if not fresh:
            fresh = cands

        # Dedup by url
        seen = set()
        deduped: list[tuple[str, str]] = []
        for u, a in fresh:
            if u in seen or u == url:
                continue
            seen.add(u)
            deduped.append((u, a))
            if len(deduped) >= MAX_LINKS:
                break

        if len(deduped) < 4:
            # Not enough to justify a block; skip
            untouched += 1
            continue

        block = render_block(deduped, source_url=url)
        new_content = insert_block(content, block)
        if new_content == content:
            untouched += 1
            continue

        if not DRY_RUN:
            path.write_text(new_content, encoding="utf-8")
        modified += 1
        for u, _ in deduped:
            by_target[u] += 1

        if modified % 200 == 0:
            print(f"  {modified} modified")

    print()
    print(f"Modified: {modified}")
    print(f"Untouched: {untouched}")
    print(f"Top 25 link targets by added inbound:")
    for u, c in sorted(by_target.items(), key=lambda x: -x[1])[:25]:
        print(f"  +{c:4d}  {u}")


if __name__ == "__main__":
    main()
