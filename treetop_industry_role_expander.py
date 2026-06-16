#!/usr/bin/env python3
"""
treetop_industry_role_expander.py

Idempotent generator for the 75 ai-for-{industry}-{role} pages. Pattern:
15 industries x 5 roles = 75 pages.

Content strategy: industry profiles + role profiles combined per page produce
substantive, non-mad-libs content. Each page is unique through the combination
of industry constraints + role mandate + their intersection.

Run: python3 treetop_industry_role_expander.py
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
<div><div class="cta-text">Want a roadmap for your role and industry?</div><div class="cta-sub">The $1,500 AI Audit produces a written, function-specific operating model in 5 business days.</div></div>
<a href="/services/ai-audit" class="btn-p">Book the AI Audit →</a>
</div></div></section>"""


_TAG = re.compile(r"<[^>]+>")


def strip_tags(s):
    return html.unescape(_TAG.sub("", s)).strip()


def render(slug, title, desc, og_title, og_desc, crumb, h1, hero_sub, verdict_text,
           intersection_h, intersection_p,
           industry_h, industry_p, role_h, role_p,
           use_cases, stack, stack_outro, roi, donts_h, donts, faqs, related):
    url = f"{BASE}/{slug}"

    faq_schema = {
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": strip_tags(q),
             "acceptedAnswer": {"@type": "Answer", "text": strip_tags(a)}}
            for q, a in faqs
        ],
    }
    graph = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "Article", "headline": title, "description": strip_tags(desc),
             "url": url,
             "author": {"@type": "Person", "name": "Bill Colbert", "url": f"{BASE}/about"},
             "publisher": {"@id": f"{BASE}/#organization"},
             "datePublished": "2026-05-28", "dateModified": "2026-06-16",
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

    use_cases_html = "\n".join(
        f"<li><strong>{s}</strong> {rest}</li>" for s, rest in use_cases
    )
    stack_html = "\n".join(f"<li>{x}</li>" for x in stack)
    donts_html = "\n".join(f"<li>{x}</li>" for x in donts)
    faqs_html = "\n".join(
        f'<div class="faq-item"><div class="faq-q">{q}</div><div class="faq-a">{a}</div></div>'
        for q, a in faqs
    )
    related_html = "\n".join(
        f'<a href="/{rslug}" class="rcard"><div class="rcard-t">{rt}</div><div class="rcard-d">{rd}</div></a>'
        for rslug, rt, rd in related
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
<meta property="og:title" content="{html.escape(og_title, quote=True)}" />
<meta property="og:description" content="{html.escape(og_desc, quote=True)}" />
<meta property="og:image" content="{BASE}/og/{slug}.png" />
<meta property="og:site_name" content="Treetop Growth Strategy" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="{BASE}/og/{slug}.png" />
<meta name="twitter:title" content="{html.escape(og_title, quote=True)}" />
<meta name="twitter:description" content="{html.escape(og_desc, quote=True)}" />
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
<h1 class="hero-h">{h1}</h1>
<p class="hero-sub">{hero_sub}</p>
<div class="verdict"><div class="verdict-l">Short version</div><p class="verdict-p">{verdict_text}</p></div>
</div></div>

<section><div class="sec-inner">
<h2 class="h2">{intersection_h}</h2>
<p class="body">{intersection_p}</p>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">{industry_h}</h2>
<p class="body">{industry_p}</p>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">{role_h}</h2>
<p class="body">{role_p}</p>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">Five high-leverage use cases</h2>
<ul class="ul">
{use_cases_html}
</ul>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">Recommended starting stack</h2>
<ul class="ul">
{stack_html}
</ul>
<p class="body">{stack_outro}</p>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">The ROI math</h2>
<p class="body">{roi}</p>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">{donts_h}</h2>
<ul class="ul">
{donts_html}
</ul>
</div></section>

<section><div class="sec-inner">
<h2 class="h2">Frequently asked questions</h2>
{faqs_html}
</div></section>

<section><div class="sec-inner">
<h2 class="h2">Keep reading</h2>
<div class="rgrid">
{related_html}
</div>
</div></section>

{CTA}

<GlobalFooter />
</body></html>
"""


def main():
    from treetop_industry_role_data import INDUSTRIES, ROLES, ALL_PAGES

    n = 0
    for industry_slug, industry in INDUSTRIES.items():
        for role_slug, role in ROLES.items():
            page_slug = f"ai-for-{industry_slug}-{role_slug}"
            path = os.path.join(PAGES_DIR, f"{page_slug}.astro")
            if not os.path.exists(path):
                # Page doesn't exist (e.g. healthcare-tech-founders may not exist)
                continue

            i_name = industry["name"]
            i_short = industry["short"]
            r_name = role["name"]
            r_short = role["short"]
            r_plural = role["plural"]

            title = f"AI for {r_plural} in {i_name} (2026 Operating Model) | Treetop"
            desc = (
                f"AI for {r_plural} in {i_name}: the specific operating model that works in 2026. "
                f"Industry constraints, role mandate, use cases, tools, ROI math, and what to avoid. "
                f"Not generic AI advice."
            )
            og_title = f"AI for {r_plural} in {i_name}: 2026 Operating Model"
            og_desc = (
                f"Industry + role specifics. {role['mandate_short']} meets {industry['constraint_short']}."
            )
            crumb = f"AI for {r_plural} in {i_name}"
            h1 = f"AI for {r_plural} in {i_short}: <em>the 2026 operating model.</em>"
            hero_sub = (
                f"This is not generic AI advice. {r_plural} working in {i_short} face a specific "
                f"combination of role mandate and industry constraint, and the right AI deployment "
                f"reflects both. Here is the playbook for the intersection."
            )

            verdict_text = (
                f"For {r_plural} in {i_short}, the most reliable AI deployments are "
                f"{role['top_use_cases_summary']}. "
                f"Pair AI tools with {role['pairing']}. Budget {industry['budget_range']} per month for the stack, "
                f"with {industry['constraint_short']} constraints driving tool selection."
            )

            intersection_h = f"Why {r_plural} in {i_short} need a different playbook"
            intersection_p = (
                f"{industry['intersection_intro']} "
                f"That changes how a {r_short} should deploy AI. "
                f"{role['intersection_lens']} "
                f"The result: the generic AI-for-{r_short} playbook is wrong by 30-50 percent for {i_short}, "
                f"and the generic AI-for-{i_short} playbook is wrong by 30-50 percent for a {r_short}. "
                f"Treetop's view is that you start from the intersection."
            )

            industry_h = f"{i_short} constraints that shape AI deployment"
            industry_p = industry["industry_paragraph"]

            role_h = f"What the {r_short} role measures"
            role_p = role["role_paragraph"]

            # Use cases: 5 items, blending 3 from role + 2 from industry
            use_cases = []
            for k, v in role["use_cases"][:3]:
                # Adapt to industry context
                use_cases.append((k, v.replace("[INDUSTRY]", i_short).replace("[Industry]", i_short.title())))
            for k, v in industry["use_cases"][:2]:
                use_cases.append((k, v.replace("[ROLE]", r_short.upper()).replace("[role]", r_short)))

            # Stack: industry-aware base
            stack = role["stack"] + [industry["stack_addition"]]

            stack_outro = (
                f"Budget {industry['budget_range']} per month for the stack. "
                f"Cost varies with team size and the {industry['constraint_short']} compliance posture you require."
            )

            roi = (
                f"For a {r_short} in {i_short}, the cleanest ROI signal is {role['roi_metric']}. "
                f"{industry['roi_note']} "
                f"In a typical mid-market deployment, the stack pays back within 60-120 days when "
                f"the human-in-the-loop step matches the {industry['constraint_short']} requirement."
            )

            donts_h = f"What AI should not do for {r_plural} in {i_short}"
            donts = industry["donts"] + role["donts"]

            faqs = [
                (f"What is the best AI stack for a {r_short} in {i_short} in 2026?",
                 f"Claude Team or ChatGPT Team as the reasoning base, plus {industry['key_tool']}, plus {role['key_tool']}. "
                 f"Budget {industry['budget_range']} per month for the stack."),
                (f"How does AI deployment differ for {r_plural} in {i_short} vs. other industries?",
                 f"The {industry['constraint_short']} constraint changes the tools you can use, the data you can share, "
                 f"and the human-in-the-loop bar. Pages targeting the generic {r_short} role miss this; "
                 f"pages targeting {i_short} broadly miss the role-specific mandate."),
                (f"Will AI replace the {r_short} in {i_short}?",
                 f"No. The {r_short} role in {i_short} is about {role['mandate_short']}, "
                 f"and AI commoditizes {role['ai_takes_over']} while making the strategic role more valuable, not less."),
                (f"What is the biggest mistake {r_plural} in {i_short} make with AI?",
                 industry["biggest_mistake"]),
                (f"How fast does ROI show up?",
                 f"Process metrics ({role['process_metric']}) move within a few weeks. "
                 f"Business impact appears in 60 to 180 days depending on cycle length and the depth of deployment."),
            ]

            # Related: 2 peer-role pages in same industry + 2 same-role in other industries
            peer_roles = [r for r in ROLES.keys() if r != role_slug][:2]
            other_industries = [i for i in INDUSTRIES.keys() if i != industry_slug][:2]
            related = []
            for pr in peer_roles:
                pr_plural = ROLES[pr]["plural"]
                rs_slug = f"ai-for-{industry_slug}-{pr}"
                if rs_slug in ALL_PAGES:
                    related.append((rs_slug, f"AI for {pr_plural} in {i_short}",
                                    f"Peer role inside the same {i_short} stack."))
            for oi in other_industries:
                oi_name = INDUSTRIES[oi]["short"]
                rs_slug = f"ai-for-{oi}-{role_slug}"
                if rs_slug in ALL_PAGES:
                    related.append((rs_slug, f"AI for {r_plural} in {oi_name}",
                                    f"Same role, different industry constraints."))

            # Pad to 4 with safe hubs
            while len(related) < 4:
                hubs = [
                    (f"ai-for-{r_short}s", f"AI for {r_plural}", f"The cross-industry {r_short} playbook."),
                    ("services/ai-audit", "Treetop AI Audit", "$1,500 written roadmap in 5 business days."),
                    ("how-to-use-ai-in-your-business", "How to use AI in your business", "The owner's guide."),
                ]
                for h in hubs:
                    if all(h[0] != r[0] for r in related):
                        related.append(h)
                        break
                if len(related) >= 4:
                    break

            page = render(page_slug, title, desc, og_title, og_desc, crumb, h1, hero_sub, verdict_text,
                          intersection_h, intersection_p,
                          industry_h, industry["industry_paragraph"],
                          role_h, role["role_paragraph"],
                          use_cases, stack, stack_outro, roi, donts_h, donts, faqs, related)
            with open(path, "w", encoding="utf-8") as f:
                f.write(page)
            n += 1
            if n % 10 == 0:
                print(f"  wrote {n} pages")
    print(f"\n{n} pages written.")


if __name__ == "__main__":
    main()
