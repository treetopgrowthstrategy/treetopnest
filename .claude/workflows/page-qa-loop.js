// page-qa-loop.js — multi-dimensional QA harness for treetopgrowthstrategy.com pages.
//
// Invoke via Workflow with args = { urls: [...], mode: 'check' | 'fix', maxIters: 2 }.
//   - urls: array of path strings, e.g. ['/claude-for-nonprofits', '/best-ai-meeting-assistants-2026']
//   - mode: 'check' = audit only (default); 'fix' = also apply auto-fixable patches, rebuild, re-verify
//   - maxIters: safety cap on the build→test loop (default 2)
//
// Per-URL it scores HTTP, internal links, SEO/meta, JSON-LD, house style (no em/en
// dashes), content quality, accessibility, mobile, and performance. Findings are
// adversarially verified before being acted on. Auto-fixes are mechanical only
// (dash strip, alt text, canonical, missing meta); never content rewrites.

export const meta = {
  name: 'page-qa-loop',
  description: 'Multi-dimensional A+ QA audit + optional auto-fix loop for treetop pages',
  phases: [
    { title: 'Probe', detail: 'parallel per-URL audit across 9 dimensions' },
    { title: 'Verify', detail: 'adversarially confirm each finding is real' },
    { title: 'Fix', detail: 'mechanical auto-fixes only (mode=fix)' },
    { title: 'Re-probe', detail: 're-audit just the pages we touched' },
    { title: 'Report', detail: 'per-page grade + global punch list' },
  ],
}

const BASE = 'https://treetopgrowthstrategy.com'
const REPO = '/Users/williamcolbert/Documents/GitHub/treetopnest/treetopnest'

// Tolerate args arriving as a JSON-encoded string OR a parsed object.
let argv = args
if (typeof argv === 'string') {
  try { argv = JSON.parse(argv) } catch { argv = {} }
}
if (!argv || typeof argv !== 'object') argv = {}
const urls = Array.isArray(argv.urls) ? argv.urls : []
const mode = argv.mode === 'fix' ? 'fix' : 'check'
const maxIters = Number.isFinite(argv.maxIters) ? argv.maxIters : 2

if (urls.length === 0) {
  log('ERROR: pass {urls: [...]} via args')
  return { error: 'No URLs provided', usage: 'Workflow({name: "page-qa-loop", args: {urls: ["/page-a", ...], mode: "check"}})' }
}
log(`Auditing ${urls.length} URL(s) in ${mode} mode (maxIters=${maxIters})`)

const FINDING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    url: { type: 'string' },
    httpStatus: { type: 'number' },
    overallGrade: { type: 'string', enum: ['A+', 'A', 'B', 'C', 'D', 'F'] },
    summary: { type: 'string', description: '1-2 sentences explaining the grade.' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          dimension: { type: 'string', enum: ['http', 'links', 'seo', 'jsonld', 'house-style', 'content', 'accessibility', 'mobile', 'performance'] },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'cosmetic'] },
          description: { type: 'string' },
          evidence: { type: 'string', description: 'concrete evidence: the URL, the offending string, the broken link, the exact dash position, etc.' },
          autoFixable: { type: 'boolean', description: 'true ONLY for mechanical fixes (dash strip, missing meta, alt text). false for content rewrites or anything judgment-bearing.' },
          fixDescription: { type: 'string', description: 'if autoFixable, exactly what edit would fix it (file:line + replacement). Otherwise, what a human should do.' },
        },
        required: ['dimension', 'severity', 'description', 'evidence', 'autoFixable', 'fixDescription'],
      },
    },
  },
  required: ['url', 'httpStatus', 'overallGrade', 'summary', 'findings'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    confirmed: { type: 'boolean', description: 'true if the finding is real and actionable; false if it is a false positive, debatable, or already addressed.' },
    reasoning: { type: 'string' },
    refinedDescription: { type: 'string', description: 'tightened description if confirmed; else why this was rejected.' },
  },
  required: ['confirmed', 'reasoning', 'refinedDescription'],
}

const FIX_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    applied: { type: 'boolean' },
    file: { type: 'string' },
    summary: { type: 'string' },
    notes: { type: 'string' },
  },
  required: ['applied', 'file', 'summary', 'notes'],
}

const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    globalGrade: { type: 'string', enum: ['A+', 'A', 'B', 'C', 'D', 'F'] },
    headline: { type: 'string' },
    perPage: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          url: { type: 'string' },
          grade: { type: 'string' },
          blockers: { type: 'number' },
          majors: { type: 'number' },
          minors: { type: 'number' },
          summary: { type: 'string' },
        },
        required: ['url', 'grade', 'blockers', 'majors', 'minors', 'summary'],
      },
    },
    fixed: { type: 'array', items: { type: 'string' } },
    needsHuman: { type: 'array', items: { type: 'string' } },
    nextSteps: { type: 'array', items: { type: 'string' } },
  },
  required: ['globalGrade', 'headline', 'perPage', 'fixed', 'needsHuman', 'nextSteps'],
}

function probePrompt(u) {
  return `Audit the page ${BASE}${u} for A+ quality. Repo: ${REPO}. Likely source file: src/pages${u}.astro (also try src/pages${u}/index.astro). Today is 2026-06-22.

You have Bash, Read, and Grep. Use them.

Run ALL of these checks and report findings:

1. HTTP — /usr/bin/curl -sIL '${BASE}${u}' for status and headers. Status must be 200. content-type must be text/html. Note size (use /usr/bin/curl -s -o /dev/null -w '%{size_download} %{time_total}').

2. Internal links — fetch the page HTML, extract every href="/..." (relative, internal). For each, /usr/bin/curl -s -o /dev/null -w '%{http_code}' -L '${BASE}<href>'. Any non-200 = blocker, listed with the exact bad href as evidence.

3. SEO meta — confirm: <title> exists and is 30-65 chars; <meta name="description"> 120-170 chars; <link rel="canonical"> matches '${BASE}${u}'; <meta property="og:image"> present, AND its URL itself returns 200. Missing canonical or 404 OG image = major.

4. JSON-LD — extract every <script type="application/ld+json">…</script>. Each must parse as valid JSON. Expect Article (or Service/WebPage), Breadcrumb, Organization, FAQPage if the page has FAQs. Invalid JSON = blocker.

5. House style (Bill's permanent rule) — strip HTML tags from the body and grep for em-dash (—, U+2014) and en-dash (–, U+2013). ANY occurrence in visible copy = BLOCKER. Quote the exact phrase + ~30 chars of context as evidence. Plain hyphens in number ranges like 15-20 are fine. Also flag jargon filler: "in today's evolving landscape", "unlock", "revolutionize", "transform" used as adjective.

6. Content quality — page word count (visible text) should be 1200-1800 (cosmetic only if outside; flag, don't fail). FAQ section present with 4-6 Q&As. A CTA section linking to /services/ai-audit, /quiz, or /book-a-call. A related-guides section. Hero paragraph answers the core question (not preamble).

7. Accessibility — exactly ONE <h1>; h2/h3 hierarchy doesn't skip levels; every <img> has alt= (empty alt OK if decorative); <meta name="viewport"> present.

8. Mobile — viewport meta exists; the page has responsive @media rules. Spot check by reading the CSS for max-width media queries.

9. Performance — page HTML weight under 500KB (this is the HTML response, not assets). Note if any inline data: URI is over 100KB.

Source-file inspection: read src/pages${u}.astro (use Read). Confirm the page has the standard nav + <GlobalFooter /> + treetop-linker-related block (or a curated related section if linker-skipped). Cross-reference any finding to file:line.

Severity rules:
- BLOCKER = 404 / broken link / em-dash / invalid JSON-LD / 404 OG image / missing <h1> / missing canonical
- MAJOR = SEO meta missing or out of length range / FAQ absent / CTA absent
- MINOR = word count low/high / minor accessibility / minor stylistic
- COSMETIC = nice-to-have

autoFixable = true ONLY for: em/en dash replacement, missing meta description rewrite, broken internal link removal/fix, alt text addition, missing viewport meta, JSON-LD trailing-comma. False for any content rewrite, FAQ generation, or judgment call.

Be strict. A+ = zero findings. A = only cosmetic. B = minors only. C+ = at least one major. D/F = blockers present.

Return the structured object.`
}

// PHASE 1: PROBE
phase('Probe')
const reports = (await parallel(urls.map(u => () =>
  agent(probePrompt(u), { schema: FINDING_SCHEMA, label: `probe:${u}`, phase: 'Probe' })
))).filter(Boolean)

const allFindings = reports.flatMap(r =>
  (r.findings || []).map(f => ({ ...f, url: r.url }))
)
log(`Probe complete: ${reports.length} pages, ${allFindings.length} raw findings`)

// PHASE 2: VERIFY (adversarial: independent agent tries to confirm each finding)
phase('Verify')
const verified = (await parallel(allFindings.map(f => () =>
  agent(
    `Independently verify this finding for ${BASE}${f.url}. Default to skepticism — a confirmed finding must be REAL and ACTIONABLE.

Finding: ${f.description}
Evidence claimed: ${f.evidence}
Dimension: ${f.dimension}
Severity claimed: ${f.severity}

Use Bash/Read/Grep to verify independently. For house-style dashes, fetch the live page (/usr/bin/curl -sL '${BASE}${f.url}'), strip HTML, and grep for U+2014 (em-dash) / U+2013 (en-dash) yourself. For broken-link claims, /usr/bin/curl the link yourself. For SEO meta claims, verify in the live HTML. For JSON-LD, parse it yourself.

Return confirmed=true ONLY if you independently reproduced the issue. Return confirmed=false if it is a false positive, was misclassified, the evidence does not hold up, or it was already fixed in a more recent deploy.`,
    { schema: VERDICT_SCHEMA, label: `verify:${f.dimension}:${f.url}`, phase: 'Verify' }
  ).then(v => ({ ...f, verdict: v }))
))).filter(Boolean).filter(x => x.verdict && x.verdict.confirmed)
log(`Verified: ${verified.length} of ${allFindings.length} findings confirmed real`)

const fixable = verified.filter(f => f.autoFixable)
const needsHuman = verified.filter(f => !f.autoFixable)
log(`Fixable mechanically: ${fixable.length}; needs human: ${needsHuman.length}`)

let fixedSummaries = []
let touchedFiles = new Set()

// PHASE 3: FIX (only in mode=fix)
if (mode === 'fix' && fixable.length > 0) {
  phase('Fix')
  const fixResults = (await parallel(fixable.map(f => () =>
    agent(
      `Apply this MECHANICAL fix to the Treetop repo at ${REPO}. Today is 2026-06-22.

Target page: ${BASE}${f.url}
Likely source: src/pages${f.url}.astro
Finding: ${f.description}
Evidence: ${f.evidence}
Proposed fix: ${f.fixDescription}

HARD RULES:
- Edit ONLY the source file for this page (src/pages${f.url}.astro or its index.astro). Do NOT touch other files (no llms.txt, no linker, no sitemap — those are wired separately).
- For dash fixes: replace em-dash (—) with a comma or period as fits, replace en-dash (–) with a hyphen if a range or with a comma otherwise. Preserve sentence meaning.
- For missing meta: add a sensible value derived from existing content. Do not invent claims.
- For broken internal links: either correct the slug (if obvious) or remove the link gracefully. Never add a link to a non-existent page.
- NEVER rewrite paragraphs or sections. NEVER change the hero/H1/H2 wording beyond what the specific fix requires. NEVER touch JSON-LD content beyond fixing syntax.

After your edit, re-read the file and confirm the change was applied as intended. Report applied=true if a real change was made, false if you decided the fix should not be applied (explain why in notes).`,
      { schema: FIX_SCHEMA, label: `fix:${f.dimension}:${f.url}`, phase: 'Fix' }
    )
  ))).filter(Boolean)
  fixedSummaries = fixResults.filter(r => r.applied).map(r => `${r.file}: ${r.summary}`)
  fixResults.filter(r => r.applied && r.file).forEach(r => touchedFiles.add(r.file))
  log(`Applied ${fixedSummaries.length} fixes across ${touchedFiles.size} file(s)`)
}

// PHASE 4: RE-PROBE (only pages we actually touched, only in fix mode)
let reprobeReports = []
if (mode === 'fix' && touchedFiles.size > 0) {
  phase('Re-probe')
  log('NOTE: re-probe hits prod, which lags the source by ~2-3 min deploy time. The post-fix grade reflects the source file state, not necessarily prod yet.')
  // Map touched files back to URLs.
  const reprobeUrls = [...touchedFiles].map(f => {
    const m = f.match(/src\/pages(\/.+?)\.astro$/)
    return m ? m[1] : null
  }).filter(Boolean)
  if (reprobeUrls.length > 0) {
    reprobeReports = (await parallel(reprobeUrls.map(u => () =>
      agent(
        probePrompt(u) + '\n\nNOTE: this is a POST-FIX re-probe. The source file has been edited but the deploy may not have landed yet. If a prior finding shows fixed in source but still bad in prod, grade against source and note the deploy lag.',
        { schema: FINDING_SCHEMA, label: `reprobe:${u}`, phase: 'Re-probe' }
      )
    ))).filter(Boolean)
  }
}

// PHASE 5: REPORT
phase('Report')
const finalReports = reprobeReports.length > 0
  ? // merge: prefer post-fix reports for pages that were touched
    [...reports.filter(r => !reprobeReports.find(rr => rr.url === r.url)), ...reprobeReports]
  : reports

const final = await agent(
  `Synthesize the QA harness output into a concise A+ report card for Bill.

Mode: ${mode}.
Pages audited: ${urls.length}.
Raw findings: ${allFindings.length}.
Confirmed by adversarial verify: ${verified.length}.
Auto-fixes applied: ${fixedSummaries.length}.
Files touched: ${[...touchedFiles].join(', ') || 'none'}.

Per-page reports (post-fix where applicable):
${JSON.stringify(finalReports, null, 2)}

Confirmed findings (post-verify):
${JSON.stringify(verified.map(v => ({ url: v.url, dim: v.dimension, sev: v.severity, desc: v.verdict?.refinedDescription || v.description, autoFixable: v.autoFixable })), null, 2)}

Fixes applied this run:
${JSON.stringify(fixedSummaries, null, 2)}

Produce:
- globalGrade: the overall grade across all pages (worst-page-wins for blockers; otherwise the modal grade).
- headline: one tight sentence Bill can read.
- perPage: list with grade, counts by severity, and 1-line summary.
- fixed: what was auto-fixed this run.
- needsHuman: each remaining confirmed finding that requires judgment, formatted as 'url — description (severity)'.
- nextSteps: ordered prioritized actions (commit/push the fixes, what humans should fix, what to re-test after next deploy).

Be strict but fair. Do not invent findings beyond what is in the verified list.`,
  { schema: REPORT_SCHEMA, label: 'synthesize:report', phase: 'Report', effort: 'high' }
)

return final
