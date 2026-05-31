#!/usr/bin/env python3
"""SEO title + CTR audit. Identifies pages with title/description issues
that hurt SERP click-through. Outputs prioritized fix list."""
import re
from pathlib import Path
from collections import defaultdict

DIST = Path('/Users/williamcolbert/Documents/GitHub/treetopnest/dist')

TITLE_RE = re.compile(r'<title>([^<]+)</title>', re.I)
DESC_RE = re.compile(r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)["\']', re.I)

# Power words that lift CTR
POWER_WORDS = {'free','complete','definitive','honest','best','guide','2026','vs','review',
               'how','what','why','playbook','framework','calculator','quiz','checklist',
               'template','step-by-step','proven'}

# Words that signal stale/generic content
WEAK_WORDS = {'introduction','intro','overview','about'}

# Pages that should be excluded from public-facing audit
EXCLUDE_PREFIXES = ['proposals/','ecofit','reports/','EQCC','pro-air-tech','mp-group','thank-you']

def should_skip(rel):
    return any(rel.startswith(p) for p in EXCLUDE_PREFIXES)

findings = defaultdict(list)
total = 0

for html in sorted(DIST.rglob('index.html')):
    rel = str(html.relative_to(DIST).parent)
    if rel == '.' or should_skip(rel):
        continue
    text = html.read_text(errors='replace')
    title_m = TITLE_RE.search(text)
    desc_m = DESC_RE.search(text)
    if not title_m:
        continue
    total += 1
    title = title_m.group(1).strip()
    desc = desc_m.group(1).strip() if desc_m else ''

    # Strip the " | Treetop" / " | Treetop Growth Strategy" suffix for analysis
    title_body = re.sub(r'\s*\|\s*Treetop.*$', '', title).strip()

    # Issue 1: Title too long for SERP (Google truncates at ~60 chars)
    if len(title) > 65:
        findings['title_too_long'].append((rel, len(title), title))

    # Issue 2: Title missing year when topical content (gives recency signal)
    is_topical = any(w in title_body.lower() for w in ['guide','playbook','review','tools','best','comparison','vs','trends','state of'])
    if is_topical and '2026' not in title and '2025' not in title:
        findings['missing_year_topical'].append((rel, title_body))

    # Issue 3: Title is too short / lacks specificity
    if len(title_body) < 25 and 'index' not in rel:
        findings['title_too_short'].append((rel, title_body))

    # Issue 4: Description missing
    if not desc:
        findings['no_description'].append((rel,))

    # Issue 5: Description too short (<100 chars)
    elif len(desc) < 100:
        findings['desc_too_short'].append((rel, len(desc), desc))

    # Issue 6: Description too long (>180 chars — Google truncates)
    elif len(desc) > 200:
        findings['desc_too_long'].append((rel, len(desc), desc[:80] + '...'))

    # Issue 7: Title lacks any power word (CTR optimization)
    title_lower = title_body.lower()
    has_power_word = any(w in title_lower for w in POWER_WORDS)
    if not has_power_word and len(title_body) > 15 and 'index' not in rel:
        findings['no_power_word'].append((rel, title_body))

    # Issue 8: Title starts with weak generic word
    first_word = title_body.split()[0].lower() if title_body else ''
    if first_word in WEAK_WORDS:
        findings['weak_opening'].append((rel, title_body))

print(f"=== SEO TITLE + DESCRIPTION AUDIT ===")
print(f"Scanned {total} public pages.\n")

def show(key, label, limit=25):
    items = findings.get(key, [])
    if not items: return
    print(f"⚠️  {label} ({len(items)}):")
    for x in items[:limit]:
        print(f"   {x}")
    if len(items) > limit:
        print(f"   ... and {len(items) - limit} more")
    print()

show('title_too_long', 'TITLES > 65 chars (SERP truncation risk)')
show('desc_too_long', 'DESCRIPTIONS > 200 chars (SERP truncation risk)')
show('no_description', 'PAGES WITH NO META DESCRIPTION (critical)', limit=15)
show('desc_too_short', 'DESCRIPTIONS < 100 chars (weak SERP appeal)', limit=15)
show('missing_year_topical', 'TOPICAL CONTENT MISSING YEAR (recency signal)', limit=20)
show('title_too_short', 'TITLES < 25 chars (lacks specificity)', limit=10)
show('no_power_word', 'TITLES WITHOUT POWER WORD (CTR optimization)', limit=15)
show('weak_opening', 'TITLES STARTING WITH WEAK GENERIC WORD', limit=10)

# Summary
total_issues = sum(len(v) for v in findings.values())
unique_pages_with_issues = len(set(item[0] if isinstance(item, tuple) else item for items in findings.values() for item in items))
print(f"=== SUMMARY ===")
print(f"Total findings: {total_issues}")
print(f"Unique pages with at least 1 issue: {unique_pages_with_issues}/{total}")
print(f"Clean pages: {total - unique_pages_with_issues}")
print()
print("Priority fix order:")
print("  1. Pages with NO meta description (loses ~30% CTR)")
print("  2. Titles >65 chars (loses SERP keyword visibility)")
print("  3. Descriptions <100 chars (weak SERP appeal)")
print("  4. Topical content missing year (recency signal)")
print("  5. Everything else")
