#!/usr/bin/env python3
"""Treetop Combined Fixer - schema, canonicals, descriptions, OG tags."""
import re, json, shutil
from pathlib import Path
from datetime import datetime

SITE = "https://treetopgrowthstrategy.com"
REPO = Path.cwd()
ASTRO = REPO / "src" / "pages"
PUB = REPO / "public"
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
BACKUP = REPO / "audit_output" / f"backup_{TS}"
BACKUP.mkdir(parents=True, exist_ok=True)

COMMERCIAL_RE = re.compile(r'^/(fractional-(cmo|cro|ceo|coo|cfo|cto)|(crm|salesforce|hubspot)-(consulting|implementation|migration|optimization|setup|audit|services|alternative)|(gtm-strategy|go-to-market|marketing-budget|30-60-90|30-day|60-day|90-day)|(revenue-operations|demand-generation)-consulting|hire-|services|ai-for-(business|marketing|sales|cfo|cmo|cro|coo|ceo|non-technical))')

def url_for_astro(p):
    rel = p.relative_to(ASTRO)
    parts = list(rel.parts)
    last = re.sub(r'\.(astro|md|mdx)$', '', parts[-1])
    if last == "index":
        parts = parts[:-1]
        return "/" + "/".join(parts) + ("/" if parts else "")
    parts[-1] = last
    return "/" + "/".join(parts)

def get_types(c):
    types = set()
    for m in re.finditer(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', c, re.S|re.I):
        try:
            d = json.loads(m.group(1).strip())
            stack = [d]
            while stack:
                x = stack.pop()
                if isinstance(x, dict):
                    t = x.get("@type")
                    if isinstance(t, str): types.add(t)
                    elif isinstance(t, list):
                        for v in t:
                            if isinstance(v, str): types.add(v)
                    stack.extend(x.values())
                elif isinstance(x, list):
                    stack.extend(x)
        except: pass
    return types

def is_article(c):
    return bool(re.search(r'og:type["\'][^>]*content=["\']article', c, re.I)) or \
           bool(re.search(r'"@type"\s*:\s*"(Article|BlogPosting|NewsArticle)"', c))

def block(d):
    return '<script type="application/ld+json">' + json.dumps(d, separators=(',', ':')) + '</script>'

def fix(p, url, backup_root, rel):
    try:
        c = p.read_text(encoding="utf-8", errors="ignore")
    except: return None, []
    idx = re.search(r'</head>', c, re.I)
    if not idx: return None, ["NO_HEAD"]
    head_close = idx.start()
    cu = SITE + url
    title = ""
    m = re.search(r'<title[^>]*>(.*?)</title>', c, re.I|re.S)
    if m: title = re.sub(r'\s+', ' ', m.group(1)).strip()
    if not title:
        m = re.search(r'<h1[^>]*>(.*?)</h1>', c, re.I|re.S)
        title = re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else (
            url.strip("/").replace(".html","").replace("-"," ").title() + " | Treetop")
    desc = ""
    m = re.search(r'name=["\']description["\'][^>]+content=["\']([^"\']+)', c, re.I)
    if m: desc = m.group(1)
    if not desc:
        m = re.search(r'<p[^>]*>(.*?)</p>', c, re.I|re.S)
        if m: desc = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', m.group(1)))[:160].strip()
    if not desc:
        desc = f"Treetop Growth Strategy. AI-native fractional GTM consulting. {title}"
    types = get_types(c)
    article = is_article(c)
    has_canon = bool(re.search(r'<link[^>]+rel=["\']canonical', c, re.I))
    has_desc = bool(re.search(r'name=["\']description', c, re.I))
    has_og_img = bool(re.search(r'property=["\']og:image', c, re.I))
    has_og_title = bool(re.search(r'property=["\']og:title', c, re.I))
    additions, changes = [], []
    if not has_canon:
        additions.append(f'<link rel="canonical" href="{cu}">')
        changes.append("canonical")
    if not has_desc:
        sd = desc.replace('"', '&quot;')
        additions.append(f'<meta name="description" content="{sd}">')
        changes.append("description")
    if not has_og_img:
        additions.append(f'<meta property="og:image" content="{SITE}/og-default.png">')
        changes.append("og_image")
    if not has_og_title:
        st = title.replace('"', '&quot;')
        sd = desc.replace('"', '&quot;')
        additions.extend([
            f'<meta property="og:title" content="{st}">',
            f'<meta property="og:description" content="{sd}">',
            f'<meta property="og:url" content="{cu}">',
            f'<meta property="og:site_name" content="Treetop Growth Strategy">',
        ])
        if not article:
            additions.append('<meta property="og:type" content="website">')
        changes.append("og_meta")
    if "Organization" not in types:
        org = {"@context":"https://schema.org","@type":"Organization","@id":SITE+"/#organization",
               "name":"Treetop Growth Strategy","url":SITE,"logo":SITE+"/og-default.png",
               "founder":{"@type":"Person","name":"Bill Colbert","url":SITE+"/about"},
               "sameAs":["https://www.linkedin.com/company/treetop-growth-strategy/"]}
        additions.append(block(org))
        changes.append("Organization")
    if "WebPage" not in types:
        wp = {"@context":"https://schema.org","@type":"WebPage","url":cu,"name":title,
              "description":desc,
              "isPartOf":{"@type":"WebSite","url":SITE+"/","name":"Treetop Growth Strategy"},
              "publisher":{"@id":SITE+"/#organization"},"inLanguage":"en-US"}
        if article:
            wp["primaryImageOfPage"] = {"@type":"ImageObject","url":SITE+"/og-default.png"}
        additions.append(block(wp))
        changes.append("WebPage")
    if "BreadcrumbList" not in types:
        parts = [x for x in url.strip("/").replace(".html","").split("/") if x]
        items = [{"@type":"ListItem","position":1,"name":"Home","item":SITE+"/"}]
        accum = ""
        for i, part in enumerate(parts):
            accum += "/" + part
            items.append({"@type":"ListItem","position":i+2,
                          "name":part.replace("-"," ").title(),"item":SITE+accum})
        additions.append(block({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":items}))
        changes.append("BreadcrumbList")
    if COMMERCIAL_RE.search(url) and not article and "Service" not in types:
        svc = {"@context":"https://schema.org","@type":"Service",
               "name":re.sub(r"\s*\|\s*Treetop.*$","",title).strip(),
               "description":desc,"url":cu,
               "provider":{"@id":SITE+"/#organization"},
               "areaServed":{"@type":"Country","name":"United States"},
               "serviceType":"Fractional GTM Consulting",
               "audience":{"@type":"BusinessAudience",
                           "audienceType":"Founders, CEOs, and growth leaders at B2B and consumer companies"}}
        additions.append(block(svc))
        changes.append("Service")
    if not additions: return None, []
    bk = backup_root / rel
    bk.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(p, bk)
    new_c = c[:head_close] + "\n" + "\n".join(additions) + "\n" + c[head_close:]
    p.write_text(new_c, encoding="utf-8")
    return p, changes

def main():
    astro = list(ASTRO.rglob("*.astro")) if ASTRO.exists() else []
    html = []
    if PUB.exists():
        for p in PUB.rglob("*.html"):
            if "node_modules" in str(p) or "_astro" in str(p): continue
            html.append(p)
    print(f"Astro: {len(astro)}, Public HTML: {len(html)}")
    print(f"Backup: {BACKUP}\n")
    counts, log, skipped = {}, [], []
    print("=== public/ HTML ===")
    for i, p in enumerate(html):
        url = "/" + str(p.relative_to(PUB))
        rel = p.relative_to(PUB)
        r, ch = fix(p, url, BACKUP/"public", rel)
        if ch == ["NO_HEAD"]:
            skipped.append((str(p), "NO_HEAD")); continue
        if not ch: continue
        for c in ch: counts[c] = counts.get(c,0)+1
        log.append((str(p.relative_to(REPO)), ch))
    print(f"\n=== src/pages/ Astro ===")
    for i, p in enumerate(astro):
        url = url_for_astro(p)
        rel = p.relative_to(ASTRO)
        r, ch = fix(p, url, BACKUP/"astro", rel)
        if ch == ["NO_HEAD"]:
            skipped.append((str(p), "NO_HEAD")); continue
        if not ch: continue
        for c in ch: counts[c] = counts.get(c,0)+1
        log.append((str(p.relative_to(REPO)), ch))
        if i % 200 == 0 and i > 0: print(f"  {i}/{len(astro)}...")
    print("\n" + "="*50)
    print(f"Modified: {len(log)}, Skipped: {len(skipped)}")
    print("\nAdditions:")
    for k,v in sorted(counts.items(), key=lambda x:-x[1]):
        print(f"  {k:20s} {v:6d}")
    print(f"\nBackup: {BACKUP}")
    with open(REPO/"audit_output"/f"fix_log_{TS}.txt","w") as f:
        f.write(f"Run: {datetime.now()}\nBackup: {BACKUP}\n\nCOUNTS:\n")
        for k,v in sorted(counts.items(), key=lambda x:-x[1]):
            f.write(f"  {k}: {v}\n")
        f.write(f"\nMODIFIED:\n")
        for p, ch in log: f.write(f"{p}: {', '.join(ch)}\n")

if __name__ == "__main__":
    main()
