#!/usr/bin/env python3
"""
treetop_sitemap.py

Generate public/sitemap.xml from the page list.

Sets priority and changefreq by URL pattern:
- Homepage / pillars / services: priority 1.0, monthly
- Money pages (/fractional-X, /hire-X, /ai-for-X): priority 0.9, monthly
- Hub pages (/glossary, /content-library, /resources): priority 0.9, weekly
- Article content (most pages): priority 0.7, monthly
- City local pages: priority 0.6, monthly
- Resource/proposal/report client pages: excluded

Reads lastmod from the file's mtime.
"""
from __future__ import annotations

import datetime
import re
from pathlib import Path

REPO = Path(__file__).parent
ASTRO = REPO / "src" / "pages"
PUB = REPO / "public"
BASE = "https://treetopgrowthstrategy.com"

OUTPUT = PUB / "sitemap.xml"

# URL prefixes to exclude from sitemap (client work, drafts, admin, non-Treetop).
# Note: "/ecofit" (no trailing slash) intentionally covers /ecofit/, /ecofit-assessment,
# and /ecofit-field-guide.html. Ecofit is a separate brand; only Bill's internal
# Ecofit tools live in the repo, and none of them should be in the public sitemap.
EXCLUDE_PREFIXES = (
    "/clients/", "/proposals/", "/reports/", "/tools/ecofit/", "/mp-group/",
    "/work/", "/api/", "/og/", "/_astro/", "/ecofit",
)

EXCLUDE_FILES = (
    "/admin", "/login", "/signup", "/preview",
)


def url_for_astro(p: Path) -> str:
    rel = p.relative_to(ASTRO)
    parts = list(rel.parts)
    last = re.sub(r"\.(astro|md|mdx)$", "", parts[-1])
    if last == "index":
        parts = parts[:-1]
        return "/" + ("/".join(parts) + "/" if parts else "")
    parts[-1] = last
    return "/" + "/".join(parts)


def url_for_public(p: Path) -> str:
    return "/" + str(p.relative_to(PUB))


def priority_and_freq(url: str) -> tuple[float, str]:
    """Return (priority, changefreq) for this URL."""
    if url == "/":
        return 1.0, "weekly"
    if url in ("/about", "/services/", "/services", "/services/ai-audit", "/quiz", "/case-studies"):
        return 1.0, "monthly"
    if re.match(r"^/(fractional-(cmo|cro|cfo|coo|chro|cto)|hire-fractional-cmo|ai-for-(cmos|cros|cfos|coos|chros))$", url):
        return 0.9, "monthly"
    if url in ("/glossary", "/content-library", "/resources", "/resources/", "/blog"):
        return 0.9, "weekly"
    if url.startswith("/case-study-"):
        return 0.8, "monthly"
    if url.startswith("/resources/"):
        return 0.8, "monthly"
    # City pages
    if re.match(r"^/fractional-[a-z]+-[a-z][a-z-]+$", url) or \
       re.match(r"^/ai-consultant-[a-z][a-z-]+$", url) or \
       re.match(r"^/cmo-[a-z][a-z-]+$", url):
        return 0.6, "monthly"
    # Glossary / how-to / ai-for-niche
    if url.startswith("/what-is-") or url.startswith("/how-to-") or url.startswith("/ai-for-") \
       or url.startswith("/claude-for-") or url.startswith("/ai-cmo-for-") \
       or url.startswith("/ai-agents-for-") or url.startswith("/best-ai-"):
        return 0.7, "monthly"
    # Cost / vs
    if url.startswith("/how-much-does-") or "-vs-" in url:
        return 0.7, "monthly"
    return 0.6, "monthly"


def collect():
    pages: dict[str, datetime.datetime] = {}
    for p in ASTRO.rglob("*.astro"):
        url = url_for_astro(p)
        if any(url.startswith(x) for x in EXCLUDE_PREFIXES):
            continue
        if any(url.startswith(x) for x in EXCLUDE_FILES):
            continue
        pages[url] = datetime.datetime.fromtimestamp(p.stat().st_mtime, tz=datetime.timezone.utc)
    for p in PUB.rglob("*.html"):
        s_str = str(p)
        if any(x in s_str for x in ("node_modules", "_astro", "/dist/")):
            continue
        url = url_for_public(p)
        if any(url.startswith(x) for x in EXCLUDE_PREFIXES):
            continue
        if any(url.startswith(x) for x in EXCLUDE_FILES):
            continue
        if url not in pages:
            pages[url] = datetime.datetime.fromtimestamp(p.stat().st_mtime, tz=datetime.timezone.utc)
    return pages


def normalize_url_for_xml(url: str) -> str:
    """Ensure trailing slash policy is consistent. Repo uses trailingSlash: 'ignore'.
    Default to no trailing slash for non-index pages."""
    if url == "/":
        return BASE + "/"
    # If ends with .html, keep as-is
    if url.endswith(".html"):
        return BASE + url
    # If ends with /, this is an index page; keep one trailing slash
    if url.endswith("/"):
        return BASE + url.rstrip("/") + "/"
    return BASE + url


def main():
    pages = collect()
    print(f"Collected {len(pages)} URLs")
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url in sorted(pages.keys()):
        loc = normalize_url_for_xml(url)
        # Escape ampersands just in case
        loc = loc.replace("&", "&amp;")
        lastmod = pages[url].date().isoformat()
        priority, freq = priority_and_freq(url)
        lines.append("  <url>")
        lines.append(f"    <loc>{loc}</loc>")
        lines.append(f"    <lastmod>{lastmod}</lastmod>")
        lines.append(f"    <changefreq>{freq}</changefreq>")
        lines.append(f"    <priority>{priority:.1f}</priority>")
        lines.append("  </url>")
    lines.append("</urlset>")
    OUTPUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
