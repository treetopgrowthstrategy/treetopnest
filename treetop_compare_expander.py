#!/usr/bin/env python3
"""
treetop_compare_expander.py

Idempotent generator for thin X-vs-Y comparison pages. Each comparison has
structured data (real positioning for each tool, real differentiation, real
decision framework) so the page reads like an opinion piece, not mad-libs.

Pricing is hedged: we say "as of June 2026" and use ranges, never exact
dollars, because vendor pricing moves fast and a wrong number is worse than
no number on a comparison page.

Run: python3 treetop_compare_expander.py
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
.nav-link{font-size:0.82rem;color:rgba(240,255,240,0.5);text-decoration:none}.nav-link:hover{color:#F0FFF0}
.btn-p{display:inline-flex;align-items:center;gap:6px;background:#00C853;color:#050D05;padding:0.875rem 1.75rem;font-size:0.85rem;font-weight:600;text-decoration:none}.btn-p:hover{opacity:0.88}
.badge{display:inline-flex;align-items:center;gap:8px;font-size:0.72rem;color:#00C853;letter-spacing:0.06em;margin-bottom:1.5rem}
.badge-dot{width:7px;height:7px;border-radius:50%;background:#00C853}
section{padding:3.5rem 2.5rem;border-top:1px solid #1A3A1A}.sec-inner{max-width:860px;margin:0 auto}
.hero{display:flex;align-items:center;padding:7rem 2.5rem 3rem}.hero-inner{max-width:860px;margin:0 auto;width:100%}
.hero-h{font-family:'Instrument Serif',serif;font-size:clamp(2rem,4vw,3rem);font-weight:400;line-height:1.1;color:#F0FFF0;margin-bottom:1.25rem}
.hero-h em{font-style:italic;color:#00C853}
.hero-sub{font-size:1.05rem;color:#C0D8C0;line-height:1.7;max-width:760px}
.verdict{background:rgba(0,200,83,0.06);border-left:3px solid #00C853;padding:1.4rem 1.7rem;margin-top:2rem;max-width:760px}
.verdict-l{font-size:0.65rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#00C853;margin-bottom:0.5rem}
.verdict-p{font-size:1rem;color:#F0FFF0;line-height:1.7;margin:0}
.h2{font-family:'Instrument Serif',serif;font-size:clamp(1.5rem,2.8vw,2rem);font-weight:400;line-height:1.2;color:#F0FFF0;margin-bottom:1.1rem}
.body{font-size:1rem;color:#C0D8C0;line-height:1.85;max-width:760px;margin-bottom:1rem}.body strong{color:#F0FFF0}.body a{color:#00C853;text-decoration:none;border-bottom:1px solid rgba(0,200,83,0.3)}
.ul{color:#C0D8C0;font-size:1rem;line-height:1.8;padding-left:1.25rem;margin:0.75rem 0 1.5rem;max-width:760px}.ul li{margin-bottom:0.55rem}.ul li::marker{color:#00C853}.ul strong{color:#F0FFF0}
.cmp-table{width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:0.9rem;background:#0A1A0A;border:1px solid #1A3A1A;max-width:860px}
.cmp-table th,.cmp-table td{padding:0.95rem 1.1rem;text-align:left;border-bottom:1px solid #1A3A1A;color:#C0D8C0;vertical-align:top;line-height:1.55}
.cmp-table th{font-family:'Instrument Serif',serif;color:#F0FFF0;font-weight:400;font-size:1rem;background:rgba(240,255,240,0.02)}
.cmp-table td:first-child{color:#F0FFF0;font-weight:500;width:24%}
.cmp-table tr:last-child td{border-bottom:none}
.faq-item{border-bottom:1px solid #1A3A1A;padding:1.4rem 0;max-width:760px}.faq-item:last-child{border-bottom:none}
.faq-q{font-size:1.02rem;font-weight:600;color:#F0FFF0;margin-bottom:0.55rem}
.faq-a{font-size:0.96rem;color:#C0D8C0;line-height:1.75}.faq-a a{color:#00C853;text-decoration:none;border-bottom:1px solid rgba(0,200,83,0.3)}
.rgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1rem;margin-top:1rem;max-width:860px}
.rcard{display:block;background:#0A1A0A;border:1px solid #1A3A1A;padding:1.3rem;text-decoration:none;transition:border-color .2s,background .2s}.rcard:hover{border-color:rgba(0,200,83,0.35);background:#0f200f}
.rcard-t{font-size:0.92rem;font-weight:600;color:#F0FFF0;margin-bottom:0.3rem}.rcard-d{font-size:0.82rem;color:#8FAF8F;line-height:1.55}
.cta-box{background:#0A1A0A;border:1px solid #1A3A1A;padding:2rem;display:flex;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;max-width:860px}
.cta-text{font-family:'Instrument Serif',serif;font-size:1.2rem;color:#F0FFF0}.cta-sub{font-size:0.85rem;color:#8FAF8F;margin-top:0.4rem}
.note{font-size:0.86rem;color:#8FAF8F;font-style:italic;margin-top:0.5rem;max-width:760px}
@media(max-width:768px){section{padding:2.5rem 1.5rem}.hero{padding:6rem 1.5rem 2rem}.cmp-table{font-size:0.78rem}.cmp-table th,.cmp-table td{padding:0.5rem 0.4rem}}
</style>"""

NAV = """<nav><div class="nav-inner"><a href="/" class="nav-logo">Treetop</a>
<div style="display:flex;gap:2rem;align-items:center"><a href="/services" class="nav-link">Services</a><a href="/resources" class="nav-link">Resources</a></div>
<a href="/ai-tool-stack-auditor" class="btn-p" style="padding:0.6rem 1.25rem;font-size:0.78rem;">AI Tool Auditor →</a>
</div></nav>"""

CTA = """<section><div class="sec-inner"><div class="cta-box">
<div><div class="cta-text">Designing your AI stack?</div><div class="cta-sub">The free AI Tool Stack Auditor surfaces redundancies and gaps in 3 minutes. The $1,500 AI Audit goes deeper: a written roadmap in 5 business days.</div></div>
<div style="display:flex;gap:0.75rem;flex-wrap:wrap;"><a href="/ai-tool-stack-auditor" class="btn-p">Free auditor →</a><a href="/services/ai-audit" class="btn-p" style="background:transparent;color:#F0FFF0;border:1px solid #1A3A1A;">Book AI Audit →</a></div>
</div></div></section>"""


_TAG = re.compile(r"<[^>]+>")


def strip_tags(s):
    return html.unescape(_TAG.sub("", s)).strip()


def render_compare(slug, d):
    url = f"{BASE}/{slug}"
    title = d["title"]
    desc = d["desc"]
    crumb = d["crumb"]

    # FAQPage schema auto-built from visible FAQ
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

    a_strengths = "\n".join(f"<li>{x}</li>" for x in d["a_strengths"])
    b_strengths = "\n".join(f"<li>{x}</li>" for x in d["b_strengths"])
    when_a = "\n".join(f"<li>{x}</li>" for x in d["when_a"])
    when_b = "\n".join(f"<li>{x}</li>" for x in d["when_b"])
    when_both = "\n".join(f"<li>{x}</li>" for x in d["when_both"])

    cmp_rows = "\n".join(
        f"<tr><td>{dim}</td><td>{a_v}</td><td>{b_v}</td></tr>"
        for dim, a_v, b_v in d["cmp_rows"]
    )
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
<div class="badge"><span class="badge-dot"></span>Honest 2026 comparison</div>
<h1 class="hero-h">{d['h1']}</h1>
<p class="hero-sub">{d['hero_sub']}</p>
<div class="verdict"><div class="verdict-l">Short answer</div><p class="verdict-p">{d['verdict']}</p></div>
<p class="note">Pricing references are as of June 2026 and may change. Always verify on each vendor's site before committing.</p>
</div></div>

<section><div class="sec-inner">
<h2 class="h2">{d['a_name']}: where it wins</h2>
<p class="body">{d['a_intro']}</p>
<ul class="ul">
{a_strengths}
</ul>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">{d['b_name']}: where it wins</h2>
<p class="body">{d['b_intro']}</p>
<ul class="ul">
{b_strengths}
</ul>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">Side-by-side</h2>
<p class="body">A direct, dimension-by-dimension look. Use this as a quick scan, then read the decision framework below.</p>
<table class="cmp-table">
<thead><tr><th>Dimension</th><th>{d['a_name']}</th><th>{d['b_name']}</th></tr></thead>
<tbody>
{cmp_rows}
</tbody>
</table>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">When to choose {d['a_name']}</h2>
<ul class="ul">
{when_a}
</ul>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">When to choose {d['b_name']}</h2>
<ul class="ul">
{when_b}
</ul>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">When most teams should run both</h2>
<p class="body">{d['both_intro']}</p>
<ul class="ul">
{when_both}
</ul>
<p class="body">Combined seat cost is small relative to the productivity lift from picking the right tool for each job. The wrong move is buying one because it is cheaper and forcing it into work it is not built for.</p>
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


def render_cost(slug, d):
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

    tiers = "\n".join(
        f"<li><strong>{t}.</strong> {desc_l}</li>"
        for t, desc_l in d["tiers"]
    )
    drivers = "\n".join(f"<li>{x}</li>" for x in d["drivers"])
    fits = "\n".join(f"<li>{x}</li>" for x in d["fits"])
    cmp_rows = "\n".join(
        f"<tr><td>{name}</td><td>{tcost}</td><td>{best}</td></tr>"
        for name, tcost, best in d["cmp_rows"]
    )
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
<div class="badge"><span class="badge-dot"></span>2026 pricing reference</div>
<h1 class="hero-h">{d['h1']}</h1>
<p class="hero-sub">{d['hero_sub']}</p>
<div class="verdict"><div class="verdict-l">Short answer</div><p class="verdict-p">{d['verdict']}</p></div>
<p class="note">Pricing references are as of June 2026 and may change. Always confirm current pricing on the vendor site before committing.</p>
</div></div>

<section><div class="sec-inner">
<h2 class="h2">The pricing tiers</h2>
<p class="body">{d['tier_intro']}</p>
<ul class="ul">
{tiers}
</ul>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">What drives the number up or down</h2>
<ul class="ul">
{drivers}
</ul>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">Where it fits the cost ladder</h2>
<table class="cmp-table">
<thead><tr><th>Option</th><th>Typical cost</th><th>Best when</th></tr></thead>
<tbody>
{cmp_rows}
</tbody>
</table>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">Who should pay for it</h2>
<ul class="ul">
{fits}
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
    from treetop_compare_data import COMPARES, COSTS

    n = 0
    for slug, d in COMPARES.items():
        path = os.path.join(PAGES_DIR, f"{slug}.astro")
        with open(path, "w", encoding="utf-8") as f:
            f.write(render_compare(slug, d))
        n += 1
        print(f"wrote compare/{slug}.astro")
    for slug, d in COSTS.items():
        path = os.path.join(PAGES_DIR, f"{slug}.astro")
        with open(path, "w", encoding="utf-8") as f:
            f.write(render_cost(slug, d))
        n += 1
        print(f"wrote cost/{slug}.astro")
    print(f"\n{n} pages written.")


if __name__ == "__main__":
    main()
