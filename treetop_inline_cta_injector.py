#!/usr/bin/env python3
"""
treetop_inline_cta_injector.py

Inject an inline lead-capture CTA into the highest-traffic content clusters.
Each cluster gets a tailored CTA (matching the offer in treetop-lead-capture.js)
inserted ABOVE the Related guides linker block.

Why inline + not just the popup: the popup waits for exit-intent or 30s on mobile.
A visible inline CTA earlier in the page captures buyer-intent visitors before
they bounce.

Idempotent. Re-run to update content; replaces any existing inline CTA.

Run:  python3 treetop_inline_cta_injector.py
      python3 treetop_inline_cta_injector.py --dry-run
"""
from __future__ import annotations
import re
import sys
from pathlib import Path

REPO = Path(__file__).parent
ASTRO = REPO / "src" / "pages"

MARK_START = "<!-- treetop-inline-cta-START -->"
MARK_END = "<!-- treetop-inline-cta-END -->"

DRY_RUN = "--dry-run" in sys.argv


# ---------------------------------------------------------------------------
# Per-cluster CTA content (mirrors treetop-lead-capture.js offer map)
# ---------------------------------------------------------------------------

CTAS = [
    # Order matters: more specific patterns first

    # ─── Cost / pricing pages ────────────────────────────────────────────
    {
        "match": lambda u: u.startswith("/how-much-does-a-fractional-"),
        "asset": "2026 Fractional Executive Pricing Report",
        "lead": "Want the full benchmark, all six roles, in one place?",
        "desc": "The 2026 Fractional Executive Pricing Report bundles every role into one decision-ready document. Retainer ranges, hourly rates, full-time comparisons, and what to negotiate.",
        "cta_url": "/2026-fractional-executive-pricing-report",
        "cta_label": "Read the full report",
        "proof": ("case-study-fractional-cmo-took-startup-from-4m-to-9m",
                  "How a fractional CMO took a startup from $4M to $9M"),
    },
    {
        "match": lambda u: u.startswith("/how-much-does-an-ai") or u.startswith("/how-much-does-ai-marketing") or u.startswith("/how-much-does-claude") or u.startswith("/how-much-does-chatgpt"),
        "asset": "AI Investment Budget Worksheet",
        "lead": "Want this priced against your actual stack?",
        "desc": "The $1,500 Treetop AI Audit produces a written 5-business-day budget for your team, your industry, and your goals.",
        "cta_url": "/services/ai-audit",
        "cta_label": "Book the AI Audit",
        "proof": ("case-study-finance-firm-deployed-claude-across-four-functions",
                  "How a finance firm deployed Claude across 4 functions"),
    },

    # ─── Comparison X-vs-Y pages ─────────────────────────────────────────
    {
        "match": lambda u: "-vs-" in u and u.count("/") == 1,
        "asset": "AI Tool Stack Auditor",
        "lead": "Picking between these for a real deployment?",
        "desc": "Treetop's free AI Tool Stack Auditor surfaces overlap, gaps, and savings in a 3-minute review. Or skip to the full $1,500 AI Audit for a written recommendation.",
        "cta_url": "/ai-tool-stack-auditor",
        "cta_label": "Run the free auditor",
        "secondary_url": "/services/ai-audit",
        "secondary_label": "Or book the AI Audit",
        "proof": ("case-study-marketing-agency-2x-content-output",
                  "How a marketing agency 2x'd content output with the right AI stack"),
    },

    # ─── AI agents cluster ───────────────────────────────────────────────
    {
        "match": lambda u: u.startswith("/ai-agents-for-"),
        "asset": "AI Agents Implementation Playbook",
        "lead": "Ready to deploy AI agents, not just read about them?",
        "desc": "The $1,500 AI Audit produces a written agent rollout plan in 5 business days: workflow selection, vendor choice, and the human-in-the-loop design that keeps quality high.",
        "cta_url": "/services/ai-audit",
        "cta_label": "Book the AI Audit",
        "proof": ("case-study-ezo-io-enterprise-saas-revenue-systems",
                  "How EZO.io rebuilt revenue systems with AI agents"),
    },

    # ─── Industry × Role pages ───────────────────────────────────────────
    {
        "match": lambda u: re.match(r"^/ai-for-[a-z-]+-(cmos|cros|cfos|vps-marketing|founders)$", u) is not None,
        "asset": "Industry × Role AI Operating Model",
        "lead": "Want this mapped to your specific situation?",
        "desc": "The $1,500 AI Audit produces a written, role-specific AI operating model for your industry in 5 business days. No two are the same.",
        "cta_url": "/services/ai-audit",
        "cta_label": "Book the AI Audit",
        "proof": ("case-study-fractional-cmo-took-startup-from-4m-to-9m",
                  "How a fractional CMO scaled a B2B startup from $4M to $9M"),
    },

    # ─── Fractional canonical + hire pages ───────────────────────────────
    {
        "match": lambda u: u in ("/hire-fractional-cmo", "/fractional-cmo", "/fractional-cro", "/fractional-cfo", "/fractional-coo", "/fractional-chro", "/fractional-cto"),
        "asset": "Fractional Executive Engagement",
        "lead": "Ready to scope an engagement?",
        "desc": "Book a 30-minute call with Bill to walk through your situation and what a fractional engagement would look like. Or start with the $1,500 AI Audit for a written roadmap.",
        "cta_url": "https://calendar.app.google/GS5H5y8U3PrN8u4A8",
        "cta_label": "Book a 30-min call",
        "secondary_url": "/services/ai-audit",
        "secondary_label": "Or book the AI Audit",
        "proof": ("case-study-fractional-cmo-took-startup-from-4m-to-9m",
                  "How a fractional CMO scaled this startup from $4M to $9M"),
    },

    # ─── Fractional hire-process + pricing-guide pages (high-traffic) ────
    {
        "match": lambda u: u in (
            "/how-to-hire-a-fractional-cmo",
            "/fractional-cmo-near-me",
            "/fractional-executive-pricing-guide-2026",
            "/fractional-cmo-vs-agency",
            "/fractional-cmo-vs-full-time-cmo",
        ),
        "asset": "Fractional Executive Engagement",
        "lead": "Hiring this quarter? Skip the search.",
        "desc": "Treetop's vetted network places fractional CMOs, CROs, CFOs, and COOs in 1 to 2 weeks vs the typical 3 to 6 month direct search. Start with a 30-minute scoping call.",
        "cta_url": "https://calendar.app.google/GS5H5y8U3PrN8u4A8",
        "cta_label": "Book a 30-min scoping call",
        "secondary_url": "/2026-fractional-executive-pricing-report",
        "secondary_label": "Or read the pricing report first",
        "proof": ("case-study-fractional-cmo-took-startup-from-4m-to-9m",
                  "How a fractional CMO scaled this startup from $4M to $9M"),
    },

    # ─── Top-trafficked how-to-use AI cluster (752 inbound on -ai-in-) ───
    {
        "match": lambda u: u in (
            "/how-to-use-ai-in-your-business",
            "/how-to-build-a-gtm-strategy",
            "/save-time-with-ai-small-business",
            "/ai-for-small-business",
            "/ai-workflow-automation-small-business",
        ),
        "asset": "AI Operating Model",
        "lead": "Reading this means you are ready to act. Want a roadmap?",
        "desc": "The $1,500 Treetop AI Audit turns the playbook on this page into a 5-business-day written operating model: which workflows to deploy first, which tools to pick, and how to measure ROI.",
        "cta_url": "/services/ai-audit",
        "cta_label": "Book the AI Audit",
        "secondary_url": "/ai-tool-stack-auditor",
        "secondary_label": "Or try the free stack auditor",
        "proof": ("case-study-medical-practice-recovered-12-hours-weekly",
                  "How a medical practice reclaimed 12 hours per week"),
    },

    # ─── AI-native framework / concept pages ─────────────────────────────
    {
        "match": lambda u: u in (
            "/the-ai-native-gtm-framework",
            "/what-is-ai-native-gtm",
            "/state-of-b2b-gtm-report-2026",
            "/state-of-ai-in-b2b-marketing-2026",
        ),
        "asset": "AI-Native GTM Framework",
        "lead": "Ready to apply this to your business?",
        "desc": "The $1,500 AI Audit produces a written AI-native GTM operating model in 5 business days: positioning, channels, team, tooling, and the 30-60-90 day rollout plan.",
        "cta_url": "/services/ai-audit",
        "cta_label": "Book the AI Audit",
        "secondary_url": "/quiz",
        "secondary_label": "Or take the free Gap Assessment",
        "proof": ("case-study-ezo-io-enterprise-saas-revenue-systems",
                  "How EZO.io rebuilt its revenue system AI-natively"),
    },

    # ─── Claude-for and Claude-prompts pages ─────────────────────────────
    {
        "match": lambda u: u in (
            "/claude-for-business",
            "/claude-for-small-business",
            "/how-to-use-claude-for-marketing",
            "/claude-prompts-for-marketing",
            "/claude-prompts-for-sales",
            "/claude-prompts-for-customer-service",
            "/claude-prompts-for-hr",
            "/claude-prompts-for-operations",
        ),
        "asset": "Claude for B2B Operators",
        "lead": "Want this configured for your business?",
        "desc": "The $1,500 AI Audit produces a written Claude deployment plan for your team in 5 business days. Project setup, system prompts, brand voice, and the workflows to ship first.",
        "cta_url": "/services/ai-audit",
        "cta_label": "Book the AI Audit",
        "proof": ("case-study-finance-firm-deployed-claude-across-four-functions",
                  "How a finance firm deployed Claude across 4 functions"),
    },

    # ─── AI consultant + implementation pages ────────────────────────────
    {
        "match": lambda u: u in (
            "/ai-implementation-consultant",
            "/ai-implementation-strategy",
            "/how-to-evaluate-an-ai-consultant",
        ),
        "asset": "AI Implementation Roadmap",
        "lead": "Comparing AI consultants? Start with the diagnostic.",
        "desc": "Most B2B mid-market companies overpay for AI strategy. The $1,500 Treetop AI Audit gives you a written roadmap in 5 business days; if it does not surface 10x its cost in savings or revenue, you get a refund.",
        "cta_url": "/services/ai-audit",
        "cta_label": "Book the AI Audit",
        "secondary_url": "/case-studies",
        "secondary_label": "Read recent client outcomes",
        "proof": ("case-study-ezo-io-enterprise-saas-revenue-systems",
                  "Real client outcome: EZO.io enterprise SaaS revenue systems"),
    },

    # ─── AI-for-cmos / cros / cfos / coos / chros pillar pages ────────────
    {
        "match": lambda u: u in (
            "/ai-for-cmos", "/ai-for-cros", "/ai-for-cfos",
            "/ai-for-coos", "/ai-for-chros",
        ),
        "asset": "Role-specific AI Operating Model",
        "lead": "Want this built for your team specifically?",
        "desc": "The $1,500 AI Audit turns this role playbook into a 5-business-day written rollout plan for your team. Tool selection, workflow prioritization, and a 30-60-90 day deployment.",
        "cta_url": "/services/ai-audit",
        "cta_label": "Book the AI Audit",
        "secondary_url": "/quiz",
        "secondary_label": "Or take the Gap Assessment",
        "proof": ("case-study-fractional-cmo-took-startup-from-4m-to-9m",
                  "How a CMO scaled a B2B startup from $4M to $9M"),
    },
]


def render_cta(cfg: dict) -> str:
    secondary = ""
    if cfg.get("secondary_url"):
        secondary = (
            f'<a href="{cfg["secondary_url"]}" style="display:inline-flex;align-items:center;gap:6px;background:transparent;color:#F0FFF0;padding:0.875rem 1.5rem;font-size:0.85rem;font-weight:500;text-decoration:none;border:1px solid #1A3A1A;">{cfg["secondary_label"]} &rarr;</a>'
        )
    # Proof line: a real case study link + the AI Audit guarantee
    proof_html = ""
    if cfg.get("proof"):
        proof_slug, proof_label = cfg["proof"]
        proof_html = (
            f'    <div style="display:flex;align-items:center;gap:0.75rem;font-size:0.82rem;color:#8FAF8F;border:1px solid #1A3A1A;padding:0.85rem 1rem;margin-bottom:1.25rem;max-width:680px;background:#050D05;">\n'
            f'      <span style="color:#00C853;font-size:0.95rem;">✓</span>\n'
            f'      <span><strong style="color:#F0FFF0;font-weight:600;">Money-back guarantee.</strong> If the AI Audit does not surface 10x its $1,500 cost in savings or revenue, you get a refund. Real outcome: <a href="/{proof_slug}" style="color:#00C853;text-decoration:none;border-bottom:1px solid rgba(0,200,83,0.3);">{proof_label} &rarr;</a></span>\n'
            f'    </div>\n'
        )
    return (
        f"{MARK_START}\n"
        f'<section style="padding:3rem 2.5rem;border-top:1px solid #1A3A1A;background:#0A1A0A;">\n'
        f'  <div style="max-width:780px;margin:0 auto;">\n'
        f'    <span style="font-size:0.68rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#00C853;display:block;margin-bottom:0.75rem;">Next step</span>\n'
        f'    <h2 style="font-family:\'Instrument Serif\',serif;font-size:clamp(1.5rem,2.8vw,2rem);font-weight:400;line-height:1.2;color:#F0FFF0;margin-bottom:0.75rem;">{cfg["lead"]}</h2>\n'
        f'    <p style="font-size:0.98rem;color:#C0D8C0;line-height:1.7;max-width:680px;margin-bottom:1.5rem;">{cfg["desc"]}</p>\n'
        f"{proof_html}"
        f'    <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">\n'
        f'      <a href="{cfg["cta_url"]}" style="display:inline-flex;align-items:center;gap:6px;background:#00C853;color:#050D05;padding:0.875rem 1.75rem;font-size:0.85rem;font-weight:600;text-decoration:none;">{cfg["cta_label"]} &rarr;</a>\n'
        f"      {secondary}\n"
        f"    </div>\n"
        f"  </div>\n"
        f"</section>\n"
        f"{MARK_END}"
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


def pick_cta(url: str) -> dict | None:
    for cfg in CTAS:
        if cfg["match"](url):
            return cfg
    return None


def insert_block(content: str, block: str) -> str:
    """Insert/replace inline CTA block. Idempotent."""
    pattern = re.compile(
        re.escape(MARK_START) + r".*?" + re.escape(MARK_END),
        re.DOTALL,
    )
    if pattern.search(content):
        return pattern.sub(block, content)
    # Insert ABOVE the linker Related block if present
    linker_marker = "<!-- treetop-linker-related-START -->"
    i = content.find(linker_marker)
    if i != -1:
        return content[:i] + block + "\n\n" + content[i:]
    # Otherwise, before <GlobalFooter />
    m = re.search(r"<GlobalFooter\s*/>", content)
    if m:
        return content[: m.start()] + block + "\n\n" + content[m.start() :]
    # Last resort: before </body>
    m = re.search(r"</body>", content, re.IGNORECASE)
    if m:
        return content[: m.start()] + block + "\n\n" + content[m.start() :]
    return content + "\n\n" + block + "\n"


def main():
    matched = 0
    written = 0
    cluster_counts: dict[str, int] = {}
    for p in ASTRO.rglob("*.astro"):
        url = url_for_astro(p)
        cfg = pick_cta(url)
        if not cfg:
            continue
        matched += 1
        try:
            content = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        block = render_cta(cfg)
        new = insert_block(content, block)
        if new == content:
            continue
        if not DRY_RUN:
            p.write_text(new, encoding="utf-8")
        written += 1
        cluster_counts[cfg["asset"]] = cluster_counts.get(cfg["asset"], 0) + 1

    print(f"Matched pages: {matched}")
    print(f"Pages updated: {written}{' (dry-run)' if DRY_RUN else ''}")
    print()
    print("By cluster:")
    for asset, n in sorted(cluster_counts.items(), key=lambda x: -x[1]):
        print(f"  {n:4d}  {asset}")


if __name__ == "__main__":
    main()
