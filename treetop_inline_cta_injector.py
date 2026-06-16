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
    {
        "match": lambda u: u.startswith("/how-much-does-a-fractional-"),
        "asset": "2026 Fractional Executive Pricing Report",
        "lead": "Want the full benchmark, all six roles, in one place?",
        "desc": "The 2026 Fractional Executive Pricing Report bundles every role into one decision-ready document. Retainer ranges, hourly rates, full-time comparisons, and what to negotiate.",
        "cta_url": "/2026-fractional-executive-pricing-report",
        "cta_label": "Read the full report",
    },
    {
        "match": lambda u: u.startswith("/how-much-does-an-ai") or u.startswith("/how-much-does-ai-marketing") or u.startswith("/how-much-does-claude") or u.startswith("/how-much-does-chatgpt"),
        "asset": "AI Investment Budget Worksheet",
        "lead": "Want this priced against your actual stack?",
        "desc": "The $1,500 Treetop AI Audit produces a written 5-business-day budget for your team, your industry, and your goals. Money-back if it does not save you 10x.",
        "cta_url": "/services/ai-audit",
        "cta_label": "Book the AI Audit",
    },
    {
        "match": lambda u: "-vs-" in u and u.count("/") == 1,
        "asset": "AI Tool Stack Auditor",
        "lead": "Picking between these for a real deployment?",
        "desc": "Treetop's free AI Tool Stack Auditor surfaces overlap, gaps, and savings in a 3-minute review. Or skip to the full $1,500 AI Audit for a written recommendation.",
        "cta_url": "/ai-tool-stack-auditor",
        "cta_label": "Run the free auditor",
    },
    {
        "match": lambda u: u.startswith("/ai-agents-for-"),
        "asset": "AI Agents Implementation Playbook",
        "lead": "Ready to deploy AI agents, not just read about them?",
        "desc": "The $1,500 AI Audit produces a written agent rollout plan in 5 business days: workflow selection, vendor choice, and the human-in-the-loop design that keeps quality high.",
        "cta_url": "/services/ai-audit",
        "cta_label": "Book the AI Audit",
    },
    {
        "match": lambda u: re.match(r"^/ai-for-[a-z-]+-(cmos|cros|cfos|vps-marketing|founders)$", u) is not None,
        "asset": "Industry × Role AI Operating Model",
        "lead": "Want this mapped to your specific situation?",
        "desc": "The $1,500 AI Audit produces a written, role-specific AI operating model for your industry in 5 business days. No two are the same.",
        "cta_url": "/services/ai-audit",
        "cta_label": "Book the AI Audit",
    },
    {
        "match": lambda u: u in ("/hire-fractional-cmo", "/fractional-cmo", "/fractional-cro", "/fractional-cfo", "/fractional-coo", "/fractional-chro", "/fractional-cto"),
        "asset": "Fractional Executive Engagement",
        "lead": "Ready to scope an engagement?",
        "desc": "Book a 30-minute call with Bill to walk through your situation and what a fractional engagement would look like. Or start with the $1,500 AI Audit for a written roadmap.",
        "cta_url": "https://calendar.app.google/GS5H5y8U3PrN8u4A8",
        "cta_label": "Book a 30-min call",
        "secondary_url": "/services/ai-audit",
        "secondary_label": "Or book the AI Audit",
    },
]


def render_cta(cfg: dict) -> str:
    secondary = ""
    if cfg.get("secondary_url"):
        secondary = (
            f'<a href="{cfg["secondary_url"]}" style="display:inline-flex;align-items:center;gap:6px;background:transparent;color:#F0FFF0;padding:0.875rem 1.5rem;font-size:0.85rem;font-weight:500;text-decoration:none;border:1px solid #1A3A1A;">{cfg["secondary_label"]} &rarr;</a>'
        )
    return (
        f"{MARK_START}\n"
        f'<section style="padding:3rem 2.5rem;border-top:1px solid #1A3A1A;background:#0A1A0A;">\n'
        f'  <div style="max-width:780px;margin:0 auto;">\n'
        f'    <span style="font-size:0.68rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#00C853;display:block;margin-bottom:0.75rem;">Next step</span>\n'
        f'    <h2 style="font-family:\'Instrument Serif\',serif;font-size:clamp(1.5rem,2.8vw,2rem);font-weight:400;line-height:1.2;color:#F0FFF0;margin-bottom:0.75rem;">{cfg["lead"]}</h2>\n'
        f'    <p style="font-size:0.98rem;color:#C0D8C0;line-height:1.7;max-width:680px;margin-bottom:1.5rem;">{cfg["desc"]}</p>\n'
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
