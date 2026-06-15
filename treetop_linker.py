#!/usr/bin/env python3
"""Treetop Internal Linker - inject contextual links from articles to commercial pages."""
import re, shutil
from pathlib import Path
from datetime import datetime
from collections import defaultdict

SITE = "https://treetopgrowthstrategy.com"
REPO = Path.cwd()
ASTRO = REPO / "src" / "pages"
PUB = REPO / "public"
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
BACKUP = REPO / "audit_output" / f"backup_links_{TS}"
BACKUP.mkdir(parents=True, exist_ok=True)

MAX_LINKS_PER_SOURCE = 5
MAX_LINKS_PER_TARGET = 50
MIN_ANCHOR_LEN = 12

TARGET_PATTERNS = [
    r'^/fractional-(cmo|cro|ceo|coo|cfo|cto|chro|vp-engineering)(/|$|-)',
    r'^/(crm|salesforce|hubspot)-',
    r'^/(gtm-strategy|go-to-market|marketing-budget|30-60-90|30-day|60-day|90-day)',
    r'^/services',
    r'^/hire-',
    r'^/cmo-(houston|minneapolis|new-york|seattle|chicago|atlanta|miami|denver|austin|boston|los-angeles|san-francisco)',
    r'^/ai-cmo-',
    r'^/ai-consultant-',
    r'-consulting(/|$|\.html)',
    r'-calculator($|\.html)',
    r'^/ai-for-(business|marketing|sales|cmo|cro|ceo|coo|cfo|non-technical)',
    r'^/the-ai-native-gtm-framework',
    r'^/what-is-ai-native-gtm',
    r'^/ai-readiness-scorecard',
    r'^/build-your-own-ai-cmo-with-claude',
]

def is_commercial_url(url):
    return any(re.search(p, url) for p in TARGET_PATTERNS)

def is_article_page(content):
    return bool(re.search(r'og:type["\'][^>]*content=["\']article', content, re.I)) or \
           bool(re.search(r'"@type"\s*:\s*"(Article|BlogPosting|NewsArticle)"', content))

def url_for_astro(p):
    rel = p.relative_to(ASTRO)
    parts = list(rel.parts)
    last = re.sub(r'\.(astro|md|mdx)$', '', parts[-1])
    if last == "index":
        parts = parts[:-1]
        return "/" + "/".join(parts) + ("/" if parts else "")
    parts[-1] = last
    return "/" + "/".join(parts)

def extract_title(c):
    m = re.search(r'<title[^>]*>(.*?)</title>', c, re.I|re.S)
    return re.sub(r'\s+', ' ', m.group(1)).strip() if m else ""

def extract_h1(c):
    m = re.search(r'<h1[^>]*>(.*?)</h1>', c, re.I|re.S)
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', m.group(1))).strip() if m else ""

def anchor_candidates(url, title, h1):
    candidates = []
    if h1 and MIN_ANCHOR_LEN <= len(h1) <= 80:
        candidates.append(h1)
    clean_title = re.sub(r'\s*[|\-]\s*Treetop.*$', '', title).strip()
    if clean_title and clean_title != h1 and MIN_ANCHOR_LEN <= len(clean_title) <= 80:
        candidates.append(clean_title)
    slug = url.strip('/').replace('.html', '')
    city_match = re.match(r'^(fractional-(?:cmo|cro|ceo|coo|cfo|cto|chro))-([a-z][a-z-]+)$', slug)
    if city_match:
        role = city_match.group(1).replace('fractional-', '').upper()
        city = city_match.group(2).replace('-', ' ').title()
        candidates.extend([
            f"fractional {role} in {city}",
            f"{city} fractional {role}",
            f"fractional {role.lower()} in {city}",
            f"{city} fractional {role.lower()}",
        ])
    ai_for_match = re.match(r'^ai-for-([a-z][a-z-]+)$', slug)
    if ai_for_match:
        topic = ai_for_match.group(1).replace('-', ' ')
        candidates.append(f"AI for {topic}")
    ai_cons_match = re.match(r'^ai-consultant-([a-z][a-z-]+)$', slug)
    if ai_cons_match:
        city = ai_cons_match.group(1).replace('-', ' ').title()
        candidates.append(f"AI consultant in {city}")
        candidates.append(f"{city} AI consultant")
    return candidates

def collect_pages():
    print("Scanning pages...")
    pages = []
    for p in ASTRO.rglob("*.astro"):
        try:
            c = p.read_text(encoding="utf-8", errors="ignore")
        except: continue
        if len(c) > 500000: continue
        url = url_for_astro(p)
        pages.append({'path': p, 'url': url, 'content': c, 'is_astro': True,
                      'title': extract_title(c), 'h1': extract_h1(c),
                      'is_article': is_article_page(c),
                      'is_commercial': is_commercial_url(url)})
    for p in PUB.rglob("*.html"):
        if "node_modules" in str(p) or "_astro" in str(p): continue
        try:
            c = p.read_text(encoding="utf-8", errors="ignore")
        except: continue
        if len(c) > 500000: continue
        url = "/" + str(p.relative_to(PUB))
        pages.append({'path': p, 'url': url, 'content': c, 'is_astro': False,
                      'title': extract_title(c), 'h1': extract_h1(c),
                      'is_article': is_article_page(c),
                      'is_commercial': is_commercial_url(url)})
    return pages

def build_link_map(pages):
    link_map = {}
    targets = [p for p in pages if p['is_commercial']]
    for t in targets:
        for anchor in anchor_candidates(t['url'], t['title'], t['h1']):
            key = anchor.lower()
            if key not in link_map:
                link_map[key] = (t['url'], anchor)
    return link_map

def inject_links(content, link_map, current_url, target_counts):
    sorted_anchors = sorted(link_map.keys(), key=lambda k: -len(k))
    pieces = re.split(r'(<[^>]*>)', content)
    in_script = in_style = in_link = in_nav = in_header_tag = in_select = in_button = False
    links_added = 0
    targets_used = set()
    for i, piece in enumerate(pieces):
        if not piece: continue
        if links_added >= MAX_LINKS_PER_SOURCE: break
        if piece.startswith('<'):
            t = piece.lower()
            if t.startswith('<script'): in_script = True
            elif t.startswith('</script'): in_script = False
            elif t.startswith('<style'): in_style = True
            elif t.startswith('</style'): in_style = False
            elif re.match(r'<a[\s>]', t): in_link = True
            elif t.startswith('</a'): in_link = False
            elif t.startswith('<nav'): in_nav = True
            elif t.startswith('</nav'): in_nav = False
            elif t.startswith('<header'): in_nav = True
            elif t.startswith('</header'): in_nav = False
            elif t.startswith('<footer'): in_nav = True
            elif t.startswith('</footer'): in_nav = False
            elif re.match(r'<h[1-6]', t): in_header_tag = True
            elif re.match(r'</h[1-6]', t): in_header_tag = False
            elif t.startswith('<select') or t.startswith('<option'): in_select = True
            elif t.startswith('</select') or t.startswith('</option'): in_select = False
            elif t.startswith('<button'): in_button = True
            elif t.startswith('</button'): in_button = False
            continue
        if in_script or in_style or in_link or in_nav or in_header_tag or in_select or in_button:
            continue
        if len(piece.strip()) < 40: continue
        for anchor_lower in sorted_anchors:
            if links_added >= MAX_LINKS_PER_SOURCE: break
            target_url, _ = link_map[anchor_lower]
            if target_url == current_url: continue
            if target_url in targets_used: continue
            if target_counts.get(target_url, 0) >= MAX_LINKS_PER_TARGET: continue
            pattern = r'\b' + re.escape(anchor_lower) + r'\b'
            m = re.search(pattern, piece, re.IGNORECASE)
            if not m: continue
            actual_text = piece[m.start():m.end()]
            replacement = f'<a href="{target_url}">{actual_text}</a>'
            pieces[i] = piece[:m.start()] + replacement + piece[m.end():]
            links_added += 1
            targets_used.add(target_url)
            target_counts[target_url] = target_counts.get(target_url, 0) + 1
            break
    return ''.join(pieces), links_added

def main():
    pages = collect_pages()
    articles = [p for p in pages if p['is_article']]
    commercials = [p for p in pages if p['is_commercial']]
    print(f"Total pages: {len(pages)}")
    print(f"Article sources: {len(articles)}")
    print(f"Commercial targets: {len(commercials)}")
    link_map = build_link_map(pages)
    print(f"Anchor candidates: {len(link_map)}\n")
    target_counts = defaultdict(int)
    modified = 0
    total_links = 0
    log = []
    for art in articles:
        new_content, n_links = inject_links(art['content'], link_map, art['url'], target_counts)
        if n_links == 0: continue
        rel = art['path'].relative_to(REPO)
        bk = BACKUP / rel
        bk.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(art['path'], bk)
        art['path'].write_text(new_content, encoding="utf-8")
        modified += 1
        total_links += n_links
        log.append((str(rel), n_links))
        if modified % 100 == 0:
            print(f"  {modified} articles modified, {total_links} links added")
    print(f"\n{'='*50}")
    print(f"DONE")
    print(f"{'='*50}")
    print(f"Articles modified: {modified}")
    print(f"Total links added: {total_links}")
    if modified:
        print(f"Average links per modified article: {total_links/modified:.2f}")
    sorted_targets = sorted(target_counts.items(), key=lambda x: -x[1])
    print(f"\nTop 20 link targets (incoming links):")
    for url, count in sorted_targets[:20]:
        print(f"  {count:4d}  {url}")
    print(f"\nBackup: {BACKUP}")
    log_file = REPO/"audit_output"/f"linker_log_{TS}.txt"
    with open(log_file, "w") as f:
        f.write(f"Run: {datetime.now()}\nArticles modified: {modified}\nTotal links: {total_links}\nBackup: {BACKUP}\n\n")
        f.write("ALL TARGETS BY INCOMING LINKS:\n")
        for url, count in sorted_targets:
            f.write(f"  {count:4d}  {url}\n")
        f.write(f"\nFILES MODIFIED:\n")
        for r, c in log:
            f.write(f"  {c}  {r}\n")
    print(f"Log: {log_file}")

if __name__ == "__main__":
    main()
