// repurpose.js — turn one Treetop hub essay into gated, post-ready atomic units.
//
// Invoke via Workflow with args = { slug: 'model-a-business-before-you-risk-capital' }.
//   - slug: the essay's src/pages/<slug>.astro basename (no extension).
//
// From one rendered essay it drafts a LinkedIn post, an X/Twitter thread, a
// newsletter section, and a carousel outline, each written to VOICE.md +
// HOOKS.md, each run through the humanness gate (tools/humanness-check.mjs).
// Passing units are written post-ready; failing units are flagged, never posted.
// Nothing auto-posts. See content-engine/DISTRIBUTION.md.

export const meta = {
  name: 'repurpose',
  description: 'Repurpose one Treetop essay into gated LinkedIn / X / newsletter / carousel units',
  phases: [
    { title: 'Read', detail: 'load the essay + voice + hooks' },
    { title: 'Draft', detail: 'draft each channel unit in parallel, to voice and hooks' },
    { title: 'Gate', detail: 'run each unit through the humanness gate; revise once if it fails' },
    { title: 'Report', detail: 'what passed, where the files are, what needs a human' },
  ],
}

const REPO = '/Users/williamcolbert/Documents/GitHub/treetopnest/treetopnest'
const CE = `${REPO}/content-engine`

let argv = args
if (typeof argv === 'string') { try { argv = JSON.parse(argv) } catch { argv = {} } }
if (!argv || typeof argv !== 'object') argv = {}
const slug = typeof argv.slug === 'string' ? argv.slug.replace(/^\/+|\.astro$/g, '') : ''
if (!slug) {
  log('ERROR: pass {slug: "essay-slug"} via args')
  return { error: 'No slug provided', usage: 'Workflow({name:"repurpose", args:{slug:"model-a-business-before-you-risk-capital"}})' }
}
const essayPath = `${REPO}/src/pages/${slug}.astro`
const outDir = `${CE}/distribution/${slug}`
log(`Repurposing ${slug}`)

const CHANNELS = [
  { key: 'linkedin', file: `${outDir}/linkedin.md`, spec:
    'A LinkedIn post, 120 to 250 words. One idea from the essay, not the whole thing. Skimmable: short lines, white space, one thought per line. Open with a hook that obeys the fold discipline in HOOKS.md (line one breaks the scroll, the last line before an imagined "see more" promises a payoff). Close with a genuine call-to-conversation and a line pointing to the full essay at https://treetopgrowthstrategy.com/' + slug + '.' },
  { key: 'x-thread', file: `${outDir}/x-thread.md`, spec:
    'An X/Twitter thread, 5 to 9 posts, one beat per post, numbered. Post 1 is the hook (fold discipline). Each post is tight and can stand alone. The final post links the essay (https://treetopgrowthstrategy.com/' + slug + ') and invites a reply. Separate posts with a blank line and a leading number like "1/".' },
  { key: 'newsletter', file: `${CE}/posts/${slug}.md`, spec:
    'A newsletter / Substack section, 300 to 600 words, the essay condensed to its argument, written to be read start to finish. Give it a subject line (first line, prefixed "Subject: "), a strong open, and a single clear CTA at the end. This is the cross-post version.' },
  { key: 'carousel', file: `${outDir}/carousel.md`, spec:
    'A carousel outline, 6 to 10 slides. Slide 1 is the hook. One point per slide, a few words to one sentence each. The last slide is the CTA. Format as "Slide N: ...".' },
]

const UNIT_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    channel: { type: 'string' },
    file: { type: 'string' },
    grade: { type: 'string', enum: ['A+', 'A', 'B', 'C', 'D', 'F'] },
    pass: { type: 'boolean' },
    hookLine: { type: 'string', description: 'the first line of the unit' },
    notes: { type: 'string', description: 'if it failed the gate after one revision, what a human needs to fix' },
  },
  required: ['channel', 'file', 'grade', 'pass', 'hookLine', 'notes'],
}

// PHASE 1: READ (shared context loaded once by each drafting agent; nothing to do centrally)
phase('Read')
log(`Essay: ${essayPath}`)

// PHASE 2+3: DRAFT + GATE (per channel, in parallel; each agent drafts, writes, gates, revises once)
phase('Draft')
const units = (await parallel(CHANNELS.map(c => () =>
  agent(
    `Repurpose a Treetop essay into one channel unit, in Bill Colbert's voice.

Essay source: ${essayPath} (read it; strip the HTML to get the prose).
Voice rules: ${CE}/VOICE.md (read it). Hook rules: ${CE}/HOOKS.md (read it).

Produce this unit:
${c.spec}

HARD RULES:
- Draft strictly to VOICE.md and HOOKS.md. Reader is the hero, Bill is the guide. Throw rocks at a situation, never at the reader.
- NO em dashes or en dashes. NO banned constructions ("the old way is dead", "you're doing it wrong", "stop doing X", death-of-category). NO invented numbers.
- Use only claims and specifics that are actually in the essay.

Then WRITE the unit to exactly this path: ${c.file}
Then GATE it: run  node ${CE}/tools/humanness-check.mjs ${c.file}
If it does not PASS (grade B or better, zero auto-fails), revise the unit ONCE to fix the flagged issues, rewrite the file, and gate again.

Return the result. hookLine = the first line of the unit. If it still fails after one revision, set pass=false and explain in notes what a human must fix. Do not water down the voice to pass; flag it instead.`,
    { schema: UNIT_SCHEMA, label: `unit:${c.key}`, phase: 'Draft' }
  )
))).filter(Boolean)

// PHASE 4: REPORT
phase('Report')
const passed = units.filter(u => u.pass)
const failed = units.filter(u => !u.pass)
log(`Repurpose complete: ${passed.length}/${units.length} units passed the gate`)

return {
  slug,
  outputDir: outDir,
  passed: passed.map(u => ({ channel: u.channel, file: u.file, grade: u.grade, hook: u.hookLine })),
  needsHuman: failed.map(u => ({ channel: u.channel, file: u.file, grade: u.grade, fix: u.notes })),
  note: 'Nothing auto-posts. These are files for Bill to review and post. Stagger per DISTRIBUTION.md.',
}
