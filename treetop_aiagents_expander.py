#!/usr/bin/env python3
"""
treetop_aiagents_expander.py

Idempotent generator for the /ai-agents-for-X pages. Each vertical gets
genuine, industry-specific content (real workflows, real tools, real ROI).

Run: python3 treetop_aiagents_expander.py
"""
from __future__ import annotations
import html
import json
import os
import re

PAGES_DIR = os.path.join(os.path.dirname(__file__), "src", "pages")
BASE = "https://treetopgrowthstrategy.com"


STYLE = """<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{background:#050D05;color:#F0FFF0;font-family:'DM Sans',sans-serif;font-weight:300}
nav{position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(5,13,5,0.95);backdrop-filter:blur(12px);border-bottom:1px solid #1A3A1A}
.nav-inner{max-width:1200px;margin:0 auto;padding:0 2.5rem;height:64px;display:flex;align-items:center;justify-content:space-between}
.nav-logo{font-family:'Instrument Serif',serif;font-size:1.3rem;font-style:italic;color:#F0FFF0;text-decoration:none}
.nav-link{font-size:0.82rem;color:rgba(240,255,240,0.5);text-decoration:none}
.btn-p{display:inline-flex;align-items:center;gap:6px;background:#00C853;color:#050D05;padding:0.875rem 1.75rem;font-size:0.85rem;font-weight:600;text-decoration:none}
.badge{display:inline-flex;align-items:center;gap:8px;font-size:0.72rem;color:#00C853;letter-spacing:0.06em;margin-bottom:1.5rem}
.badge-dot{width:7px;height:7px;border-radius:50%;background:#00C853}
section{padding:3.5rem 2.5rem;border-top:1px solid #1A3A1A}.sec-inner{max-width:780px;margin:0 auto}
.hero{display:flex;align-items:center;padding:7rem 2.5rem 2.5rem}.hero-inner{max-width:780px;margin:0 auto;width:100%}
.hero-h{font-family:'Instrument Serif',serif;font-size:clamp(2rem,4vw,3rem);font-weight:400;line-height:1.1;color:#F0FFF0;margin-bottom:1.25rem}
.hero-h em{font-style:italic;color:#00C853}
.hero-sub{font-size:1.02rem;color:#C0D8C0;line-height:1.7;max-width:720px}
.verdict{background:rgba(0,200,83,0.06);border-left:3px solid #00C853;padding:1.4rem 1.7rem;margin-top:2rem;max-width:720px}
.verdict-l{font-size:0.65rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#00C853;margin-bottom:0.5rem}
.verdict-p{font-size:1rem;color:#F0FFF0;line-height:1.65;margin:0}
.h2{font-family:'Instrument Serif',serif;font-size:clamp(1.5rem,2.8vw,2rem);font-weight:400;line-height:1.2;color:#F0FFF0;margin-bottom:1.1rem}
.body{font-size:1rem;color:#C0D8C0;line-height:1.85;max-width:720px;margin-bottom:1rem}.body strong{color:#F0FFF0}.body a{color:#00C853;text-decoration:none;border-bottom:1px solid rgba(0,200,83,0.3)}
.ul{color:#C0D8C0;font-size:1rem;line-height:1.8;padding-left:1.25rem;margin:0.75rem 0 1.5rem;max-width:720px}.ul li{margin-bottom:0.55rem}.ul li::marker{color:#00C853}.ul strong{color:#F0FFF0}
.faq-item{border-bottom:1px solid #1A3A1A;padding:1.3rem 0;max-width:720px}.faq-item:last-child{border-bottom:none}
.faq-q{font-size:1rem;font-weight:600;color:#F0FFF0;margin-bottom:0.5rem}
.faq-a{font-size:0.95rem;color:#C0D8C0;line-height:1.7}.faq-a a{color:#00C853;text-decoration:none;border-bottom:1px solid rgba(0,200,83,0.3)}
.rgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.9rem;margin-top:1rem;max-width:720px}
.rcard{display:block;background:#0A1A0A;border:1px solid #1A3A1A;padding:1.2rem;text-decoration:none;transition:border-color .2s,background .2s}.rcard:hover{border-color:rgba(0,200,83,0.35);background:#0f200f}
.rcard-t{font-size:0.9rem;font-weight:600;color:#F0FFF0;margin-bottom:0.3rem}.rcard-d{font-size:0.8rem;color:#8FAF8F;line-height:1.5}
.cta-box{background:#0A1A0A;border:1px solid #1A3A1A;padding:2rem;display:flex;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;max-width:780px}
.cta-text{font-family:'Instrument Serif',serif;font-size:1.2rem;color:#F0FFF0}.cta-sub{font-size:0.85rem;color:#8FAF8F;margin-top:0.4rem}
@media(max-width:768px){section{padding:2.5rem 1.5rem}.hero{padding:6rem 1.5rem 2rem}}
</style>"""

NAV = """<nav><div class="nav-inner"><a href="/" class="nav-logo">Treetop</a>
<div style="display:flex;gap:2rem;align-items:center"><a href="/services" class="nav-link">Services</a><a href="/resources" class="nav-link">Resources</a></div>
<a href="/ai-tool-stack-auditor" class="btn-p" style="padding:0.6rem 1.25rem;font-size:0.78rem;">AI Tool Auditor →</a>
</div></nav>"""

CTA = """<section><div class="sec-inner"><div class="cta-box">
<div><div class="cta-text">Want help designing your agent stack?</div><div class="cta-sub">The $1,500 AI Audit produces a written roadmap in 5 business days.</div></div>
<a href="/services/ai-audit" class="btn-p">Book →</a>
</div></div></section>"""


_TAG = re.compile(r"<[^>]+>")


def strip_tags(s):
    return html.unescape(_TAG.sub("", s)).strip()


def render(slug, d):
    url = f"{BASE}/{slug}"
    title = d["title"]
    desc = d["desc"]
    crumb = d["crumb"]

    faq_schema = {
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": strip_tags(q),
             "acceptedAnswer": {"@type": "Answer", "text": strip_tags(a)}}
            for q, a in d["faqs"]
        ],
    }
    graph = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "Article", "headline": title, "description": strip_tags(desc),
             "url": url,
             "author": {"@type": "Person", "name": "Bill Colbert", "url": f"{BASE}/about"},
             "publisher": {"@id": f"{BASE}/#organization"},
             "datePublished": d.get("published", "2026-05-28"), "dateModified": "2026-06-15",
             "image": f"{BASE}/og-default.png"},
            {"@type": "Organization", "@id": f"{BASE}/#organization",
             "name": "Treetop Growth Strategy", "url": BASE},
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{BASE}/"},
                {"@type": "ListItem", "position": 2, "name": crumb, "item": url},
            ]},
            faq_schema,
        ],
    }
    schema_json = json.dumps(graph, ensure_ascii=False)

    use_cases = "\n".join(
        f"<li><strong>{s}</strong> {rest}</li>" for s, rest in d["use_cases"]
    )
    stack = "\n".join(f"<li>{x}</li>" for x in d["stack"])
    donts = "\n".join(f"<li>{x}</li>" for x in d["donts"])
    faqs = "\n".join(
        f'<div class="faq-item"><div class="faq-q">{q}</div><div class="faq-a">{a}</div></div>'
        for q, a in d["faqs"]
    )
    related = "\n".join(
        f'<a href="/{rslug}" class="rcard"><div class="rcard-t">{rt}</div><div class="rcard-d">{rd}</div></a>'
        for rslug, rt, rd in d["related"]
    )

    return f"""---
import GlobalFooter from '../components/GlobalFooter.astro';
export const prerender = true;
---
<!doctype html><html lang="en"><head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>{title}</title>
<meta name="description" content="{html.escape(desc, quote=True)}" />
<link rel="canonical" href="{url}" />
<meta property="og:type" content="article" /><meta property="og:url" content="{url}" />
<meta property="og:title" content="{html.escape(d['og_title'], quote=True)}" />
<meta property="og:description" content="{html.escape(d['og_desc'], quote=True)}" />
<meta property="og:image" content="{BASE}/og/{slug}.png" />
<meta property="og:site_name" content="Treetop Growth Strategy" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="{BASE}/og/{slug}.png" />
<meta name="twitter:title" content="{html.escape(d['og_title'], quote=True)}" />
<meta name="twitter:description" content="{html.escape(d['og_desc'], quote=True)}" />
<script type="application/ld+json">
{schema_json}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
{STYLE}
</head><body>
{NAV}
<div class="hero"><div class="hero-inner">
<div class="badge"><span class="badge-dot"></span>2026 Operating Model</div>
<h1 class="hero-h">{d['h1']}</h1>
<p class="hero-sub">{d['hero_sub']}</p>
<div class="verdict"><div class="verdict-l">Short version</div><p class="verdict-p">{d['verdict']}</p></div>
</div></div>

<section><div class="sec-inner">
<h2 class="h2">{d['uc_heading']}</h2>
<p class="body">{d['uc_intro']}</p>
<ul class="ul">
{use_cases}
</ul>
<p class="body">{d['uc_outro']}</p>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">Recommended starting stack</h2>
<ul class="ul">
{stack}
</ul>
<p class="body">{d['stack_outro']}</p>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">The ROI math</h2>
<p class="body">{d['roi']}</p>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">{d['donts_heading']}</h2>
<ul class="ul">
{donts}
</ul>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">Frequently asked questions</h2>
{faqs}
</div></section>

<section><div class="sec-inner">
<h2 class="h2">Keep reading</h2>
<div class="rgrid">
{related}
</div>
</div></section>

{CTA}

<GlobalFooter />
</body></html>
"""


def main():
    from treetop_aiagents_data import AGENTS
    for slug, d in AGENTS.items():
        path = os.path.join(PAGES_DIR, f"{slug}.astro")
        with open(path, "w", encoding="utf-8") as f:
            f.write(render(slug, d))
        print(f"wrote {slug}.astro")
    print(f"\n{len(AGENTS)} pages written.")


if __name__ == "__main__":
    main()
