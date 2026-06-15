#!/usr/bin/env python3
"""
treetop_link_audit.py

Build a full internal-link graph of the site, compute SEO interlinking metrics,
and report the gap to best-in-class.

Reads every src/pages/*.astro and public/**/*.html, extracts every internal
<a href="/..."> link from the BODY (excludes nav/footer chrome), then computes:

- inbound link count per page (in-degree)
- outbound link count per page (out-degree)
- orphans (in-degree = 0)
- weak pages (in-degree < TIER_THRESHOLD)
- money pages (commercial intent) and their in-degree
- cluster cohesion (how well topic peers cross-link)
- click depth from home

Writes audit_output/link_audit.txt and audit_output/link_graph.csv.
"""
import csv
import re
from collections import defaultdict, deque
from pathlib import Path

REPO = Path(__file__).parent
ASTRO = REPO / "src" / "pages"
PUB = REPO / "public"
OUT = REPO / "audit_output"
OUT.mkdir(parents=True, exist_ok=True)

# Strip nav/header/footer/script/style/svg from body to count only contextual links.
CHROME_TAGS = ("nav", "header", "footer", "script", "style", "svg", "select", "option")

LINK_RE = re.compile(r'<a\s[^>]*href=["\']([^"\']+)["\'][^>]*>', re.IGNORECASE)


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


def strip_chrome(html: str) -> str:
    out = html
    for tag in CHROME_TAGS:
        out = re.sub(
            rf"<{tag}\b[^>]*>.*?</{tag}>",
            "",
            out,
            flags=re.IGNORECASE | re.DOTALL,
        )
    return out


def normalize_url(u: str) -> str:
    u = u.split("#")[0].split("?")[0]
    if not u.startswith("/"):
        return ""
    if u != "/" and u.endswith("/"):
        u = u.rstrip("/")
    return u


# Pages we treat as "money pages" for in-degree minimums.
MONEY_PATTERNS = [
    r"^/$",  # home
    r"^/services(/|$)",
    r"^/fractional-cmo$",
    r"^/fractional-cro$",
    r"^/fractional-cfo$",
    r"^/fractional-coo$",
    r"^/fractional-chro$",
    r"^/fractional-cto$",
    r"^/hire-fractional-cmo$",
    r"^/ai-for-cmos$",
    r"^/ai-for-cros$",
    r"^/ai-for-cfos$",
    r"^/ai-for-coos$",
    r"^/ai-for-chros$",
    r"^/quiz$",
    r"^/about$",
    r"^/case-studies(/|$)",
    r"^/resources(/|$)",
    r"^/glossary(/|$)",
    r"^/content-library(/|$)",
    r"^/blog(/|$)",
]


def is_money(url: str) -> bool:
    return any(re.search(p, url) for p in MONEY_PATTERNS)


# Cluster classifier: tag pages so we can measure cross-cluster cohesion.
def cluster_of(url: str) -> str:
    if re.search(r"^/fractional-c[a-z]+(-[a-z-]+)?$", url):
        return "fractional"
    if re.search(r"^/ai-for-[a-z-]+(c[a-z]+s)$", url):  # ai-for-cmos etc.
        return "fractional"
    if url.startswith("/ai-for-"):
        return "ai-for-niche"
    if url.startswith("/how-to-") and url.endswith("-with-claude"):
        return "how-to-claude"
    if url.startswith("/what-is-"):
        return "glossary"
    if url.startswith("/claude-for-"):
        return "claude-for"
    if url.startswith("/how-much-does"):
        return "cost"
    if re.search(r"-vs-", url):
        return "comparison"
    if url.startswith("/case-study-"):
        return "case-study"
    return "other"


def collect_pages():
    pages = {}  # url -> {path, content_body}
    for p in ASTRO.rglob("*.astro"):
        try:
            c = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        if len(c) > 500_000:
            continue
        url = url_for_astro(p)
        pages[url] = {"path": p, "body": strip_chrome(c)}
    for p in PUB.rglob("*.html"):
        s = str(p)
        if "node_modules" in s or "_astro" in s or "/dist/" in s:
            continue
        try:
            c = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        if len(c) > 500_000:
            continue
        url = url_for_public(p)
        pages[url] = {"path": p, "body": strip_chrome(c)}
    return pages


def extract_links(pages):
    """Return outbound: url -> set(target_url) where target is in our page set."""
    # Build a set of every known URL plus URL-with-trailing-slash for matching.
    known = set(pages.keys())
    norm_known = {normalize_url(u) for u in known}
    # Also recognize directory-style URLs that map to .astro index pages or to /something
    # collapsing of pages like /resources matching /resources.astro vs /resources/index.astro.

    outbound = defaultdict(set)
    for src_url, info in pages.items():
        body = info["body"]
        for m in LINK_RE.finditer(body):
            href = m.group(1)
            target = normalize_url(href)
            if not target:
                continue
            # match to known URL (with normalization)
            if target in norm_known:
                outbound[src_url].add(target)
            else:
                # try with trailing slash form
                if target + "/" in known:
                    outbound[src_url].add(target + "/")
                # try stripping .html
                if target.endswith(".html") and target[:-5] in norm_known:
                    outbound[src_url].add(target[:-5])
    return outbound


def build_inbound(outbound):
    inbound = defaultdict(set)
    for src, targets in outbound.items():
        for t in targets:
            inbound[t].add(src)
    return inbound


def click_depths(pages, outbound):
    """BFS from / to all reachable pages."""
    start = "/" if "/" in pages else next(iter(pages))
    depths = {start: 0}
    q = deque([start])
    while q:
        u = q.popleft()
        for v in outbound.get(u, ()):
            if v not in depths:
                depths[v] = depths[u] + 1
                q.append(v)
    return depths


def main():
    print("Scanning pages...")
    pages = collect_pages()
    print(f"  {len(pages)} pages")
    print("Extracting links...")
    outbound = extract_links(pages)
    inbound = build_inbound(outbound)
    print("Computing depths...")
    depths = click_depths(pages, outbound)

    # Per-page records
    rows = []
    for url in sorted(pages.keys()):
        rows.append(
            {
                "url": url,
                "cluster": cluster_of(url),
                "is_money": is_money(url),
                "inbound": len(inbound.get(url, ())),
                "outbound": len(outbound.get(url, ())),
                "depth_from_home": depths.get(url, ""),
            }
        )

    csv_path = OUT / "link_graph.csv"
    with open(csv_path, "w", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "url",
                "cluster",
                "is_money",
                "inbound",
                "outbound",
                "depth_from_home",
            ],
        )
        w.writeheader()
        w.writerows(rows)
    print(f"  wrote {csv_path}")

    # Best-in-class targets
    TARGET_MIN_INBOUND = 3
    TARGET_MIN_INBOUND_MONEY = 20
    TARGET_MIN_OUTBOUND_PROSE = 5  # ignored for chrome-only pages
    TARGET_MAX_DEPTH = 4

    n_pages = len(pages)
    orphans = [r for r in rows if r["inbound"] == 0 and r["url"] != "/"]
    weak = [
        r for r in rows if 0 < r["inbound"] < TARGET_MIN_INBOUND and r["url"] != "/"
    ]
    money_weak = [
        r
        for r in rows
        if r["is_money"] and r["inbound"] < TARGET_MIN_INBOUND_MONEY
    ]
    too_deep = [
        r
        for r in rows
        if isinstance(r["depth_from_home"], int)
        and r["depth_from_home"] > TARGET_MAX_DEPTH
    ]
    unreachable = [r for r in rows if r["depth_from_home"] == "" and r["url"] != "/"]
    thin_out = [r for r in rows if r["outbound"] < TARGET_MIN_OUTBOUND_PROSE]

    # By cluster
    by_cluster = defaultdict(list)
    for r in rows:
        by_cluster[r["cluster"]].append(r)

    # Top hubs (most-linked-to) and authorities (most-linking-out)
    top_inbound = sorted(rows, key=lambda r: -r["inbound"])[:30]
    top_outbound = sorted(rows, key=lambda r: -r["outbound"])[:30]

    # Cross-cluster cohesion: how often a cluster's pages link to peer cluster pages
    # vs how often they link out of cluster.
    cohesion = {}
    for cluster, items in by_cluster.items():
        in_cluster_links = out_cluster_links = 0
        for r in items:
            for t in outbound.get(r["url"], ()):
                if cluster_of(t) == cluster:
                    in_cluster_links += 1
                else:
                    out_cluster_links += 1
        total = in_cluster_links + out_cluster_links
        cohesion[cluster] = {
            "pages": len(items),
            "in_cluster_links": in_cluster_links,
            "out_cluster_links": out_cluster_links,
            "pct_in_cluster": (in_cluster_links / total * 100) if total else 0,
        }

    # Money-page inbound details
    money_rows = [r for r in rows if r["is_money"]]
    money_rows.sort(key=lambda r: r["inbound"])

    # Write the human-readable report
    txt = OUT / "link_audit.txt"
    with open(txt, "w") as f:
        f.write("TREETOP INTERNAL LINK AUDIT\n")
        f.write("=" * 70 + "\n\n")
        f.write(f"Total pages indexed: {n_pages}\n")
        f.write(
            f"Total internal links (body only, excl. nav/footer): "
            f"{sum(len(v) for v in outbound.values())}\n\n"
        )

        f.write("BEST-IN-CLASS TARGETS\n")
        f.write("-" * 70 + "\n")
        f.write(
            f"  Every page has at least {TARGET_MIN_INBOUND} inbound contextual links\n"
        )
        f.write(
            f"  Every money page has at least {TARGET_MIN_INBOUND_MONEY} inbound links\n"
        )
        f.write(f"  Every page has at least {TARGET_MIN_OUTBOUND_PROSE} outbound links\n")
        f.write(f"  Every page reachable within {TARGET_MAX_DEPTH} clicks of /\n")
        f.write(f"  Zero orphans (0 inbound links)\n\n")

        f.write("GAP TO TARGETS\n")
        f.write("-" * 70 + "\n")
        f.write(
            f"  Orphans (in=0):           {len(orphans):5d}  "
            f"({len(orphans)/n_pages*100:.1f}%)\n"
        )
        f.write(
            f"  Weak inbound (<{TARGET_MIN_INBOUND}):       {len(weak):5d}  "
            f"({len(weak)/n_pages*100:.1f}%)\n"
        )
        f.write(
            f"  Thin outbound (<{TARGET_MIN_OUTBOUND_PROSE}):     {len(thin_out):5d}  "
            f"({len(thin_out)/n_pages*100:.1f}%)\n"
        )
        f.write(
            f"  Unreachable from /:       {len(unreachable):5d}  "
            f"({len(unreachable)/n_pages*100:.1f}%)\n"
        )
        f.write(
            f"  Deeper than {TARGET_MAX_DEPTH} clicks:      {len(too_deep):5d}  "
            f"({len(too_deep)/n_pages*100:.1f}%)\n"
        )
        f.write(
            f"  Money pages under floor:  {len(money_weak):5d}  "
            f"of {len(money_rows)} money pages\n\n"
        )

        f.write("CLUSTER COHESION (% of outbound links that stay in cluster)\n")
        f.write("-" * 70 + "\n")
        for k, v in sorted(cohesion.items(), key=lambda x: -x[1]["pages"]):
            f.write(
                f"  {k:18s}  pages={v['pages']:4d}  in-cluster={v['in_cluster_links']:5d}  "
                f"out-cluster={v['out_cluster_links']:5d}  pct={v['pct_in_cluster']:5.1f}\n"
            )
        f.write("\n")

        f.write("MONEY PAGES WORST→BEST (inbound contextual links)\n")
        f.write("-" * 70 + "\n")
        for r in money_rows:
            f.write(
                f"  in={r['inbound']:4d}  out={r['outbound']:4d}  depth={r['depth_from_home']}  {r['url']}\n"
            )
        f.write("\n")

        f.write("TOP 30 PAGES BY INBOUND (current hubs)\n")
        f.write("-" * 70 + "\n")
        for r in top_inbound:
            f.write(
                f"  in={r['inbound']:4d}  out={r['outbound']:4d}  {r['url']}\n"
            )
        f.write("\n")

        f.write("TOP 30 PAGES BY OUTBOUND (current authorities)\n")
        f.write("-" * 70 + "\n")
        for r in top_outbound:
            f.write(
                f"  in={r['inbound']:4d}  out={r['outbound']:4d}  {r['url']}\n"
            )
        f.write("\n")

        f.write("ORPHANS (first 60)\n")
        f.write("-" * 70 + "\n")
        for r in orphans[:60]:
            f.write(f"  {r['cluster']:14s}  {r['url']}\n")
        f.write(f"\n... and {max(0, len(orphans)-60)} more\n")
    print(f"  wrote {txt}")
    print()
    print(f"Orphans: {len(orphans)}  Weak: {len(weak)}  Money under floor: {len(money_weak)}")
    print(f"Unreachable from /: {len(unreachable)}")


if __name__ == "__main__":
    main()
