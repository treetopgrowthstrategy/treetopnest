#!/usr/bin/env python3
"""
treetop_claudefor_expander.py

Idempotent generator for the "Claude for {industry}" thin guide pages.
Preserves the existing claude-for template design system (.lbl/.h2/.body/.cta-box)
and adds substantive workflows, a realistic deployment section, and an on-page
FAQ whose FAQPage schema is auto-synced. No em/en dashes.

Run from repo root:  python3 treetop_claudefor_expander.py
"""
import html
import json
import os
import re

PAGES_DIR = os.path.join(os.path.dirname(__file__), "src", "pages")
BASE = "https://treetopgrowthstrategy.com"

STYLE = """<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{background:#050D05;color:#F0FFF0;font-family:'DM Sans',sans-serif;font-weight:300;-webkit-font-smoothing:antialiased}
nav{position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(5,13,5,0.95);backdrop-filter:blur(12px);border-bottom:1px solid #1A3A1A}
.nav-inner{max-width:1200px;margin:0 auto;padding:0 2.5rem;height:64px;display:flex;align-items:center;justify-content:space-between}
.nav-logo{font-family:'Instrument Serif',serif;font-size:1.3rem;font-style:italic;color:#F0FFF0;text-decoration:none}
.nav-link{font-size:0.82rem;color:rgba(240,255,240,0.5);text-decoration:none}.nav-link:hover{color:#F0FFF0}
.btn-p{display:inline-flex;align-items:center;gap:6px;background:#00C853;color:#050D05;padding:0.875rem 1.75rem;font-size:0.85rem;font-weight:600;text-decoration:none}.btn-p:hover{opacity:0.88}
.btn-g{display:inline-flex;align-items:center;gap:6px;background:transparent;color:#F0FFF0;padding:0.875rem 1.75rem;font-size:0.85rem;font-weight:600;text-decoration:none;border:1px solid #1A3A1A}
.badge{display:inline-flex;align-items:center;gap:8px;font-size:0.72rem;font-weight:500;color:#00C853;letter-spacing:0.06em;margin-bottom:1.5rem}
.badge-dot{width:7px;height:7px;border-radius:50%;background:#00C853;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
.lbl{font-size:0.68rem;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#00C853;margin-bottom:0.75rem;display:block}
section{padding:5rem 2.5rem;border-top:1px solid #1A3A1A}.sec-inner{max-width:920px;margin:0 auto}
.hero{min-height:48vh;display:flex;align-items:center;padding:7rem 2.5rem 4rem}.hero-inner{max-width:920px;margin:0 auto;width:100%}
.hero-h{font-family:'Instrument Serif',serif;font-size:clamp(2.5rem,5vw,3.75rem);font-weight:400;line-height:1.1;color:#F0FFF0;margin-bottom:1.25rem}
.hero-sub{font-size:1.05rem;color:#C0D8C0;line-height:1.75;max-width:720px}
.h2{font-family:'Instrument Serif',serif;font-size:clamp(1.8rem,3.5vw,2.4rem);font-weight:400;line-height:1.15;color:#F0FFF0;margin-bottom:1.25rem}
.body{font-size:1rem;color:#C0D8C0;line-height:1.85;max-width:760px;margin-bottom:1rem}.body em{color:#F0FFF0;font-style:italic}.body strong{color:#F0FFF0}.body a{color:#00C853;text-decoration:none;border-bottom:1px solid rgba(0,200,83,0.3)}
.faq-item{border-bottom:1px solid #1A3A1A;padding:1.4rem 0;max-width:760px}.faq-item:last-child{border-bottom:none}
.faq-q{font-size:1.05rem;font-weight:600;color:#F0FFF0;margin-bottom:0.5rem}
.faq-a{font-size:0.96rem;color:#C0D8C0;line-height:1.75}.faq-a a{color:#00C853;text-decoration:none;border-bottom:1px solid rgba(0,200,83,0.3)}
.rlist{list-style:none;padding:0;color:#C0D8C0;font-size:0.95rem;line-height:1.85}
.rlist li{padding:0.5rem 0;border-bottom:1px solid #1A3A1A}.rlist a{color:#00C853;text-decoration:none}
.cta-box{background:#0A1A0A;border:1px solid #1A3A1A;padding:3rem;display:flex;align-items:center;justify-content:space-between;gap:2rem;flex-wrap:wrap}
.cta-text{font-family:'Instrument Serif',serif;font-size:1.5rem;color:#F0FFF0}.cta-sub{font-size:0.88rem;color:#8FAF8F;margin-top:0.5rem}
@media(max-width:900px){section{padding:3.5rem 1.5rem}.hide-mob{display:none!important}}
</style>"""

NAV = """<nav><div class="nav-inner"><a href="/" class="nav-logo">Treetop</a>
<div class="hide-mob" style="display:flex;gap:2rem;align-items:center;">
<a href="/claude-for-business" class="nav-link">All Industries</a>
<a href="/services" class="nav-link">Services</a>
<a href="/resources" class="nav-link">Resources</a>
<a href="/about" class="nav-link">About</a>
</div>
<a href="/quiz" class="btn-p" style="padding:0.6rem 1.25rem;font-size:0.78rem;">Take the Gap Assessment &rarr;</a>
</div></nav>"""

CTA = """<section><div class="sec-inner"><div class="cta-box">
<div><div class="cta-text">Want this implemented for your business?</div><div class="cta-sub">Implementation: $3,500 fixed price. Includes industry-specific Project setup.</div></div>
<div style="display:flex;gap:1rem;flex-wrap:wrap;">
<a href="/services/implementation" class="btn-p">See Implementation &rarr;</a>
<a href="/services/ai-audit" class="btn-g">Book the AI Audit</a>
</div></div></div></section>"""

_TAG = re.compile(r"<[^>]+>")


def strip_tags(s):
    return html.unescape(_TAG.sub("", s)).strip()


def render(slug, d):
    url = f"{BASE}/{slug}"
    faq_schema = {
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": strip_tags(q),
             "acceptedAnswer": {"@type": "Answer", "text": strip_tags(a)}}
            for q, a in d["faqs"]],
    }
    name = d["title"].split(" | ")[0]
    graph = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "Article", "headline": name, "description": strip_tags(d["desc"]),
             "url": url, "author": {"@type": "Person", "name": "Bill Colbert", "url": f"{BASE}/about"},
             "publisher": {"@id": f"{BASE}/#organization"},
             "datePublished": "2026-05-20", "dateModified": "2026-06-15",
             "image": f"{BASE}/og-default.png"},
            {"@type": "Service", "name": name, "description": strip_tags(d["desc"]),
             "url": url, "provider": {"@id": f"{BASE}/#organization"}},
            {"@type": "Organization", "@id": f"{BASE}/#organization",
             "name": "Treetop Growth Strategy", "url": BASE},
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{BASE}/"},
                {"@type": "ListItem", "position": 2, "name": name, "item": url}]},
            faq_schema,
        ],
    }
    schema_json = json.dumps(graph, ensure_ascii=False)

    workflows = "\n".join(
        f'    <p class="body"><strong>{i}. {s}</strong> {rest}</p>'
        for i, (s, rest) in enumerate(d["workflows"], 1))
    human = "\n".join(f'    <p class="body">{x}</p>' for x in d["human"])
    deployment = "\n".join(f'    <p class="body">{x}</p>' for x in d["deployment"])
    faqs = "\n".join(
        f'<div class="faq-item"><div class="faq-q">{q}</div><div class="faq-a">{a}</div></div>'
        for q, a in d["faqs"])
    related = "\n".join(
        f'<li><a href="/{r}">{t} &rarr;</a></li>' for r, t in d["related"])

    return f"""---
import GlobalFooter from '../components/GlobalFooter.astro';
export const prerender = true;
---
<!doctype html><html lang="en"><head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>{d['title']}</title>
<meta name="description" content="{html.escape(d['desc'], quote=True)}" />
<link rel="canonical" href="{url}" />
<meta property="og:type" content="article" /><meta property="og:url" content="{url}" />
<meta property="og:title" content="{html.escape(name, quote=True)}" />
<meta property="og:description" content="{html.escape(d['og_desc'], quote=True)}" />
<meta property="og:image" content="{BASE}/og/{slug}.png" />
<meta property="og:site_name" content="Treetop Growth Strategy" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="{BASE}/og/{slug}.png" />
<meta name="twitter:title" content="{html.escape(name, quote=True)}" />
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
<div class="badge"><span class="badge-dot"></span>Industry guide</div>
<h1 class="hero-h">Claude for <em style="color:#00C853;font-style:italic;">{d['industry_em']}</em></h1>
<p class="hero-sub">{d['hero_sub']}</p>
</div></div>

<section><div class="sec-inner"><span class="lbl">The workflows</span><h2 class="h2">Where AI saves time</h2>
{workflows}
    </div></section>

<section><div class="sec-inner"><span class="lbl">What stays human</span><h2 class="h2">{d['human_heading']}</h2>
{human}
    </div></section>

<section><div class="sec-inner"><span class="lbl">Realistic deployment</span><h2 class="h2">{d['deploy_heading']}</h2>
{deployment}
    </div></section>

<section><div class="sec-inner"><span class="lbl">FAQ</span><h2 class="h2">Frequently asked questions</h2>
{faqs}
    </div></section>

<section><div class="sec-inner"><span class="lbl">Related</span><h2 class="h2">Related guides</h2>
<ul class="rlist">
{related}
<li><a href="/services/ai-audit">Treetop AI Audit &rarr;</a></li>
</ul></div></section>
{CTA}
<GlobalFooter />
</body></html>
"""


def main():
    from treetop_claudefor_data import GUIDES
    for slug, d in GUIDES.items():
        with open(os.path.join(PAGES_DIR, f"{slug}.astro"), "w", encoding="utf-8") as f:
            f.write(render(slug, d))
        print(f"wrote {slug}.astro")
    print(f"\n{len(GUIDES)} pages written.")


if __name__ == "__main__":
    main()
