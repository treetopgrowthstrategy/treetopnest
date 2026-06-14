#!/usr/bin/env python3
"""
Treetop Growth Strategy - Full Site Audit
Scans src/pages/ (Astro) and public/ (flat HTML) and produces:
  1. schema_audit.csv       - per-page schema status
  2. content_audit.csv      - per-page content/SEO metrics
  3. linking_opportunities.csv - blog -> commercial linking suggestions
  4. audit_summary.txt      - human-readable summary with priority actions

Run from repo root: ~/Documents/GitHub/treetopnest/treetopnest/
"""

import os
import re
import json
import csv
from pathlib import Path
from collections import defaultdict, Counter

REPO_ROOT = Path.cwd()
ASTRO_DIR = REPO_ROOT / "src" / "pages"
PUBLIC_DIR = REPO_ROOT / "public"
OUT_DIR = REPO_ROOT / "audit_output"
OUT_DIR.mkdir(exist_ok=True)

# Schema types we want to see on a best-in-class site
DESIRED_SCHEMA_TYPES = {
    "Organization", "WebSite", "WebPage", "BreadcrumbList",
    "Service", "FAQPage", "Article", "BlogPosting", "Person",
    "HowTo", "DefinedTerm", "Dataset", "WebApplication"
}

# Commercial pages (high-value, link-targets for internal linking)
COMMERCIAL_KEYWORDS = [
    "fractional-cmo", "fractional-cro", "fractional-ceo", "fractional-coo",
    "fractional-cfo", "crm", "salesforce", "hubspot", "go-to-market",
    "gtm-strategy", "marketing-budget", "30-60-90", "revenue-operations",
    "demand-generation", "saas", "ai-for"
]

def find_files():
    """Collect all page files."""
    files = []
    if ASTRO_DIR.exists():
        for p in ASTRO_DIR.rglob("*.astro"):
            files.append(("astro", p))
        for p in ASTRO_DIR.rglob("*.md"):
            files.append(("astro_md", p))
        for p in ASTRO_DIR.rglob("*.mdx"):
            files.append(("astro_mdx", p))
    if PUBLIC_DIR.exists():
        for p in PUBLIC_DIR.rglob("*.html"):
            # Skip node_modules, build outputs
            if "node_modules" in str(p) or "_astro" in str(p):
                continue
            files.append(("html", p))
    return files

def extract_jsonld(content):
    """Pull all JSON-LD blocks from page content."""
    pattern = re.compile(
        r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        re.DOTALL | re.IGNORECASE
    )
    blocks = []
    for match in pattern.finditer(content):
        raw = match.group(1).strip()
        try:
            parsed = json.loads(raw)
            blocks.append(("valid", parsed, raw))
        except json.JSONDecodeError as e:
            blocks.append(("invalid", str(e), raw[:200]))
    return blocks

def get_schema_types(blocks):
    """Flatten all @type values from parsed schema blocks."""
    types = set()
    for status, parsed, _ in blocks:
        if status != "valid":
            continue
        def walk(obj):
            if isinstance(obj, dict):
                t = obj.get("@type")
                if isinstance(t, str):
                    types.add(t)
                elif isinstance(t, list):
                    for x in t:
                        if isinstance(x, str):
                            types.add(x)
                for v in obj.values():
                    walk(v)
            elif isinstance(obj, list):
                for item in obj:
                    walk(item)
        walk(parsed)
    return types

def extract_meta(content):
    """Pull title, description, canonical, OG tags."""
    def find(pattern, flags=re.IGNORECASE | re.DOTALL):
        m = re.search(pattern, content, flags)
        return m.group(1).strip() if m else ""

    title = find(r'<title[^>]*>(.*?)</title>')
    description = find(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']')
    if not description:
        description = find(r'<meta[^>]+content=["\'](.*?)["\'][^>]+name=["\']description["\']')
    canonical = find(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\'](.*?)["\']')
    og_title = find(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\'](.*?)["\']')
    og_image = find(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\'](.*?)["\']')

    return {
        "title": title,
        "title_len": len(title),
        "description": description,
        "description_len": len(description),
        "canonical": canonical,
        "has_og_title": bool(og_title),
        "has_og_image": bool(og_image),
    }

def content_metrics(content):
    """Word count, heading counts, link counts."""
    # Strip script/style
    clean = re.sub(r'<script.*?</script>', '', content, flags=re.DOTALL | re.IGNORECASE)
    clean = re.sub(r'<style.*?</style>', '', clean, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<[^>]+>', ' ', clean)
    text = re.sub(r'\s+', ' ', text).strip()
    words = len(text.split())

    h1 = len(re.findall(r'<h1[^>]*>', content, re.IGNORECASE))
    h2 = len(re.findall(r'<h2[^>]*>', content, re.IGNORECASE))
    h3 = len(re.findall(r'<h3[^>]*>', content, re.IGNORECASE))

    all_links = re.findall(r'<a[^>]+href=["\']([^"\']+)["\']', content)
    internal = [l for l in all_links if l.startswith('/') or 'treetopgrowthstrategy.com' in l]
    external = [l for l in all_links if l.startswith('http') and 'treetopgrowthstrategy.com' not in l]

    return {
        "word_count": words,
        "h1_count": h1,
        "h2_count": h2,
        "h3_count": h3,
        "internal_links": len(internal),
        "external_links": len(external),
        "text_sample": text[:500],
    }

def url_path_from_file(file_type, path):
    """Reconstruct the public URL for a file."""
    rel = path.relative_to(REPO_ROOT)
    parts = list(rel.parts)
    if file_type.startswith("astro"):
        # src/pages/foo/bar.astro -> /foo/bar
        # src/pages/foo/index.astro -> /foo/
        parts = parts[2:]  # drop src/pages
        last = parts[-1]
        last = re.sub(r'\.(astro|md|mdx)$', '', last)
        if last == "index":
            parts = parts[:-1]
            url = "/" + "/".join(parts) + "/" if parts else "/"
        else:
            parts[-1] = last
            url = "/" + "/".join(parts)
    else:
        # public/foo.html -> /foo.html (Vercel serves as-is)
        parts = parts[1:]  # drop public
        url = "/" + "/".join(parts)
    return url

def classify_page(url, content_text):
    """Tag the page: blog, commercial, location, hub, etc."""
    u = url.lower()
    if "/blog/" in u or "/article/" in u or "/insights/" in u:
        return "blog"
    if any(kw in u for kw in COMMERCIAL_KEYWORDS):
        return "commercial"
    if re.search(r'/[a-z-]+-(consulting|services|agency)', u):
        return "commercial"
    if re.search(r'/(chicago|denver|austin|raleigh|durham|nashville|atlanta|miami|new-york|boston|seattle)', u):
        return "location"
    if u in ("/", "/about", "/about/", "/contact", "/contact/"):
        return "core"
    return "other"

def audit_file(file_type, path):
    """Run all checks on a single file."""
    try:
        content = path.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        return None

    url = url_path_from_file(file_type, path)
    meta = extract_meta(content)
    schema_blocks = extract_jsonld(content)
    schema_types = get_schema_types(schema_blocks)
    metrics = content_metrics(content)
    page_class = classify_page(url, metrics["text_sample"])

    invalid_schema = [b for b in schema_blocks if b[0] == "invalid"]

    return {
        "file": str(path.relative_to(REPO_ROOT)),
        "url": url,
        "type": file_type,
        "class": page_class,
        **meta,
        "schema_block_count": len(schema_blocks),
        "schema_invalid_count": len(invalid_schema),
        "schema_types": sorted(schema_types),
        "schema_missing": sorted(DESIRED_SCHEMA_TYPES - schema_types),
        **metrics,
    }

def main():
    files = find_files()
    print(f"Scanning {len(files)} files...")

    results = []
    for i, (ft, p) in enumerate(files):
        if i % 100 == 0:
            print(f"  {i}/{len(files)}...")
        r = audit_file(ft, p)
        if r:
            results.append(r)

    print(f"Scanned {len(results)} files. Writing reports...")

    # 1. Schema audit CSV
    with open(OUT_DIR / "schema_audit.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow([
            "url", "class", "file", "schema_block_count", "schema_invalid_count",
            "schema_types_present", "critical_schema_missing", "has_organization",
            "has_webpage", "has_breadcrumb", "has_faqpage", "has_service",
            "has_article", "has_person"
        ])
        for r in results:
            types = set(r["schema_types"])
            critical_missing = []
            if r["class"] in ("commercial", "core", "location") and "Organization" not in types:
                critical_missing.append("Organization")
            if "WebPage" not in types and "WebSite" not in types:
                critical_missing.append("WebPage")
            if r["class"] == "blog" and not (types & {"Article", "BlogPosting"}):
                critical_missing.append("Article/BlogPosting")
            if r["class"] == "commercial" and "Service" not in types:
                critical_missing.append("Service")
            w.writerow([
                r["url"], r["class"], r["file"], r["schema_block_count"],
                r["schema_invalid_count"], "|".join(r["schema_types"]),
                "|".join(critical_missing),
                "Organization" in types, "WebPage" in types,
                "BreadcrumbList" in types, "FAQPage" in types,
                "Service" in types, bool(types & {"Article", "BlogPosting"}),
                "Person" in types,
            ])

    # 2. Content audit CSV
    with open(OUT_DIR / "content_audit.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow([
            "url", "class", "title", "title_len", "description_len",
            "word_count", "h1_count", "h2_count", "internal_links",
            "external_links", "canonical", "has_og_title", "has_og_image",
            "issues"
        ])
        for r in results:
            issues = []
            if not r["title"]:
                issues.append("NO_TITLE")
            elif r["title_len"] < 30 or r["title_len"] > 65:
                issues.append(f"TITLE_LEN_{r['title_len']}")
            if not r["description"]:
                issues.append("NO_DESCRIPTION")
            elif r["description_len"] < 120 or r["description_len"] > 165:
                issues.append(f"DESC_LEN_{r['description_len']}")
            if not r["canonical"]:
                issues.append("NO_CANONICAL")
            if r["h1_count"] == 0:
                issues.append("NO_H1")
            elif r["h1_count"] > 1:
                issues.append(f"MULTIPLE_H1_{r['h1_count']}")
            if r["word_count"] < 300 and r["class"] != "core":
                issues.append(f"THIN_CONTENT_{r['word_count']}w")
            if r["internal_links"] < 3 and r["class"] != "core":
                issues.append(f"FEW_INTERNAL_LINKS_{r['internal_links']}")
            if not r["has_og_image"]:
                issues.append("NO_OG_IMAGE")
            w.writerow([
                r["url"], r["class"], r["title"], r["title_len"],
                r["description_len"], r["word_count"], r["h1_count"],
                r["h2_count"], r["internal_links"], r["external_links"],
                r["canonical"], r["has_og_title"], r["has_og_image"],
                "|".join(issues)
            ])

    # 3. Internal linking opportunities
    # For each blog post, find commercial pages whose keywords appear in it
    blogs = [r for r in results if r["class"] == "blog"]
    commercials = [r for r in results if r["class"] == "commercial"]

    opportunities = []
    for blog in blogs:
        blog_text = blog["text_sample"].lower()
        # Read fuller content for matching
        try:
            full_blog_content = (REPO_ROOT / blog["file"]).read_text(
                encoding="utf-8", errors="ignore"
            ).lower()
            # Strip HTML
            full_text = re.sub(r'<[^>]+>', ' ', full_blog_content)
        except:
            full_text = blog_text

        for comm in commercials:
            # Build keyword set from commercial page title and URL
            keywords = set()
            comm_title = comm["title"].lower()
            comm_url = comm["url"].lower()
            # Extract meaningful 2-3 word phrases
            url_words = re.sub(r'[/.-]', ' ', comm_url).split()
            url_words = [w for w in url_words if len(w) > 3 and w not in {"html", "index"}]
            if len(url_words) >= 2:
                keywords.add(" ".join(url_words[:3]))
                keywords.add(" ".join(url_words[:2]))

            for kw in keywords:
                if kw and kw in full_text:
                    # Check blog isn't already linking to this commercial page
                    if comm["url"] not in full_blog_content:
                        opportunities.append({
                            "blog_url": blog["url"],
                            "blog_file": blog["file"],
                            "target_url": comm["url"],
                            "target_title": comm["title"],
                            "matched_phrase": kw,
                        })
                        break  # one opportunity per blog->target pair

    with open(OUT_DIR / "linking_opportunities.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["blog_url", "target_url", "target_title", "matched_phrase", "blog_file"])
        for o in opportunities:
            w.writerow([
                o["blog_url"], o["target_url"], o["target_title"],
                o["matched_phrase"], o["blog_file"]
            ])

    # 4. Summary report
    by_class = Counter(r["class"] for r in results)
    no_schema = [r for r in results if r["schema_block_count"] == 0]
    invalid_schema_pages = [r for r in results if r["schema_invalid_count"] > 0]
    no_title = [r for r in results if not r["title"]]
    no_desc = [r for r in results if not r["description"]]
    no_h1 = [r for r in results if r["h1_count"] == 0]
    thin = [r for r in results if r["word_count"] < 300 and r["class"] != "core"]
    no_canonical = [r for r in results if not r["canonical"]]

    all_schema_types = Counter()
    for r in results:
        for t in r["schema_types"]:
            all_schema_types[t] += 1

    with open(OUT_DIR / "audit_summary.txt", "w", encoding="utf-8") as f:
        f.write("TREETOP GROWTH STRATEGY - FULL SITE AUDIT\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Total pages scanned: {len(results)}\n\n")
        f.write("PAGES BY CLASS:\n")
        for cls, n in by_class.most_common():
            f.write(f"  {cls:15s} {n:5d}\n")
        f.write("\n")
        f.write("SCHEMA COVERAGE:\n")
        for t, n in all_schema_types.most_common():
            pct = 100 * n / len(results)
            f.write(f"  {t:25s} {n:5d}  ({pct:5.1f}%)\n")
        f.write("\n")
        f.write("CRITICAL ISSUES:\n")
        f.write(f"  Pages with no schema:        {len(no_schema)}\n")
        f.write(f"  Pages with invalid schema:   {len(invalid_schema_pages)}\n")
        f.write(f"  Pages with no <title>:       {len(no_title)}\n")
        f.write(f"  Pages with no description:   {len(no_desc)}\n")
        f.write(f"  Pages with no H1:            {len(no_h1)}\n")
        f.write(f"  Pages with no canonical:     {len(no_canonical)}\n")
        f.write(f"  Thin content (<300 words):   {len(thin)}\n")
        f.write("\n")
        f.write(f"INTERNAL LINKING OPPORTUNITIES: {len(opportunities)}\n")
        f.write("\n")
        if invalid_schema_pages[:10]:
            f.write("FIRST 10 PAGES WITH BROKEN SCHEMA:\n")
            for r in invalid_schema_pages[:10]:
                f.write(f"  {r['url']}  ({r['file']})\n")
            f.write("\n")
        if no_schema[:10]:
            f.write("FIRST 10 PAGES WITH NO SCHEMA AT ALL:\n")
            for r in no_schema[:10]:
                f.write(f"  {r['url']}  ({r['class']})\n")

    print("\nDONE. Reports written to:")
    print(f"  {OUT_DIR}/schema_audit.csv")
    print(f"  {OUT_DIR}/content_audit.csv")
    print(f"  {OUT_DIR}/linking_opportunities.csv")
    print(f"  {OUT_DIR}/audit_summary.txt")
    print()
    print("Print summary now:")
    print()
    with open(OUT_DIR / "audit_summary.txt") as f:
        print(f.read())

if __name__ == "__main__":
    main()
