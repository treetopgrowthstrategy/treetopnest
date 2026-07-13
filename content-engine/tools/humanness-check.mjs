#!/usr/bin/env node
// humanness-check.mjs — deterministic "AI tell" grader for Treetop content.
//
// This is LAYER 1 of the humanness gate (see ../HUMANNESS.md): the mechanical,
// reproducible checks. Layers 2 (voice-positive coverage) and 3 (adversarial
// Claude judge) run in the content workflow on top of this. The script never
// rewrites prose; it flags and grades. Rewrites are always a human decision.
//
// Usage:
//   node humanness-check.mjs <file.astro|file.md|file.html> [more files...]
//   node humanness-check.mjs --json <file>      # machine-readable only
//   echo "some prose" | node humanness-check.mjs --stdin
//
// Exit code: 0 if every file PASSES the gate, 1 if any file FAILS.
// Gate: PASS = score >= 80 AND zero auto-fails (em/en dash, banned construction).

import { readFileSync } from 'node:fs'

// ---- Tunable constants -----------------------------------------------------
const GATE_MIN_SCORE = 80            // B or better
const BURSTINESS_FLOOR = 0.50        // coefficient of variation of sentence length
const HEDGE_PER_100_OK = 2.5         // hedges per 100 words before penalty
const TRICOLON_FREE = 3              // allowed "A, B, and C" triples before penalty

// AI filler lexicon. Deliberately EXCLUDES words that are genuinely in Bill's
// voice (e.g. "leverage", "engine", "operator"). Each distinct hit costs points.
const FILLER = [
  /\bin today's (?:fast-paced|ever-?evolving|evolving|digital|modern|complex) (?:world|landscape|era|environment)\b/gi,
  /\bunlock(?:ing|s)?\b/gi, /\bunleash(?:ing|es)?\b/gi, /\brevolutioniz\w*/gi,
  /\btransform your\b/gi, /\bdelv(?:e|ing)\b/gi, /\bnavigating the\b/gi,
  /\bin the realm of\b/gi, /\bit(?:'s| is) worth noting\b/gi, /\bboasts?\b/gi,
  /\bseamless(?:ly)?\b/gi, /\bgame[- ]?changer\b/gi, /\bat the end of the day\b/gi,
  /\bin conclusion\b/gi, /\bfurthermore\b/gi, /\bmoreover\b/gi, /\brobust\b/gi,
  /\bcutting[- ]edge\b/gi, /\belevate\b/gi, /\bempower(?:s|ing|ed)?\b/gi,
  /\btapestry\b/gi, /\btestament to\b/gi, /\bdive into\b/gi, /\bplethora\b/gi,
  /\bmyriad\b/gi, /\bparamount\b/gi, /\bpivotal\b/gi, /\bunderscore(?:s|d)?\b/gi,
  /\bspearhead\w*/gi, /\bholistic\b/gi, /\bsynergy\b/gi, /\bharness the power\b/gi,
  /\bever-?changing\b/gi, /\bworld of\b/gi, /\bwhen it comes to\b/gi,
]

// Auto-fail: banned constructions from VOICE.md (reader-shaming / death-of-category).
const BANNED = [
  { re: /the old way is dead/gi, name: 'old-way-is-dead' },
  { re: /you(?:'re| are) doing it wrong/gi, name: 'youre-doing-it-wrong' },
  { re: /\bstop doing\b/gi, name: 'stop-doing-X' },
  { re: /doing it the old way/gi, name: 'doing-it-the-old-way' },
  { re: /\bis dead\b/gi, name: 'death-of-category (is dead)' },
  { re: /\bdeath of (?:the )?\w+/gi, name: 'death-of-category' },
]

// "It's not just X, it's Y" template (a well-worn AI cadence).
const NOT_JUST = /\bit(?:'s| is) not just [^.,;]+?,?\s+it(?:'s| is)\b/gi

// Hedges.
const HEDGES = /\b(?:can help|may|might|often|typically|generally|usually|tends? to|somewhat|arguably|perhaps|to some extent)\b/gi

// ---- Text extraction -------------------------------------------------------
const ENTITIES = { '&rarr;': ' ', '&larr;': ' ', '&amp;': ' and ', '&nbsp;': ' ', '&mdash;': '—', '&ndash;': '–', '&middot;': ' ', '&hellip;': '...', '&quot;': '"', '&#39;': "'", '&rsquo;': "'", '&lsquo;': "'", '&ldquo;': '"', '&rdquo;': '"' }

function extractProse(raw) {
  let t = raw
  t = t.replace(/^---[\s\S]*?---/, '')                 // astro/md frontmatter
  t = t.replace(/<style[\s\S]*?<\/style>/gi, '')       // css
  t = t.replace(/<script[\s\S]*?<\/script>/gi, '')     // js + JSON-LD
  t = t.replace(/<[^>]+>/g, ' ')                        // tags
  for (const [k, v] of Object.entries(ENTITIES)) t = t.split(k).join(v)
  t = t.replace(/&#?\w+;/g, ' ')                        // leftover entities
  return t.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim()
}

function sentences(prose) {
  return prose.replace(/\n/g, ' ').split(/(?<=[.!?])\s+/)
    .map(s => s.trim()).filter(s => s.split(/\s+/).length >= 4)  // drop nav/label fragments
}

function std(xs) {
  const m = xs.reduce((a, b) => a + b, 0) / xs.length
  const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length
  return { mean: m, sd: Math.sqrt(v) }
}

function countMatches(text, re) {
  const m = text.match(re)
  return m ? m.length : 0
}

// ---- Grader ----------------------------------------------------------------
function grade(raw, label) {
  const prose = extractProse(raw)
  const words = prose.split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const sents = sentences(prose)
  const lens = sents.map(s => s.split(/\s+/).length)
  const { mean, sd } = lens.length ? std(lens) : { mean: 0, sd: 0 }
  const cv = mean ? sd / mean : 0

  const autoFails = []
  // dashes (both literal chars and entities already normalized to chars)
  const emCount = countMatches(prose, /—/g)
  const enCount = countMatches(prose, /–/g)
  if (emCount) autoFails.push({ type: 'em-dash', count: emCount })
  if (enCount) autoFails.push({ type: 'en-dash', count: enCount })
  for (const b of BANNED) {
    const c = countMatches(prose, b.re)
    if (c) autoFails.push({ type: `banned:${b.name}`, count: c })
  }

  const deductions = []
  let score = 100

  // filler lexicon
  const fillerHits = []
  for (const re of FILLER) {
    const m = prose.match(re)
    if (m) fillerHits.push({ pattern: re.source.slice(0, 40), samples: [...new Set(m)].slice(0, 3) })
  }
  if (fillerHits.length) {
    const pts = Math.min(fillerHits.length * 4, 24)
    score -= pts
    deductions.push({ reason: `AI filler lexicon: ${fillerHits.length} distinct term(s)`, points: -pts, detail: fillerHits.flatMap(h => h.samples) })
  }

  // sentence-length burstiness (human writing varies; robotic writing is uniform)
  if (lens.length >= 6 && cv < BURSTINESS_FLOOR) {
    const pts = Math.min(Math.round((BURSTINESS_FLOOR - cv) * 40), 15)
    score -= pts
    deductions.push({ reason: `Low sentence-length variance (CV ${cv.toFixed(2)} < ${BURSTINESS_FLOOR})`, points: -pts })
  }

  // hedging density
  const hedges = countMatches(prose, HEDGES)
  const hedgeDensity = wordCount ? (hedges / wordCount) * 100 : 0
  if (hedgeDensity > HEDGE_PER_100_OK) {
    const pts = Math.min(Math.round((hedgeDensity - HEDGE_PER_100_OK) * 4), 10)
    score -= pts
    deductions.push({ reason: `High hedging density (${hedgeDensity.toFixed(1)}/100 words)`, points: -pts })
  }

  // tricolon / rule-of-three overuse
  const tricolons = countMatches(prose, /\b\w+,\s+\w+[^.?!]*?,\s+and\s+\w+/g)
  if (tricolons > TRICOLON_FREE) {
    const pts = Math.min((tricolons - TRICOLON_FREE) * 2, 8)
    score -= pts
    deductions.push({ reason: `Rule-of-three overuse (${tricolons} triples)`, points: -pts })
  }

  // "not just X, it's Y" template
  const notJust = countMatches(prose, NOT_JUST)
  if (notJust) {
    const pts = notJust * 5
    score -= pts
    deductions.push({ reason: `"not just X, it's Y" template x${notJust}`, points: -pts })
  }

  if (autoFails.length) score = Math.min(score, 0)
  score = Math.max(0, Math.round(score))

  let g = 'F'
  if (!autoFails.length) {
    if (score >= 95) g = 'A+'
    else if (score >= 88) g = 'A'
    else if (score >= 80) g = 'B'
    else if (score >= 70) g = 'C'
    else if (score >= 60) g = 'D'
    else g = 'F'
  }
  const pass = autoFails.length === 0 && score >= GATE_MIN_SCORE

  return {
    file: label, grade: g, pass, score,
    autoFails,
    metrics: { wordCount, sentences: sents.length, meanSentenceLen: +mean.toFixed(1), burstinessCV: +cv.toFixed(2), hedgeDensityPer100: +hedgeDensity.toFixed(1), tricolons },
    deductions,
  }
}

// ---- CLI -------------------------------------------------------------------
const argv = process.argv.slice(2)
const jsonOnly = argv.includes('--json')
const useStdin = argv.includes('--stdin')
const files = argv.filter(a => !a.startsWith('--'))

function report(r) {
  if (jsonOnly) { console.log(JSON.stringify(r)); return }
  const tag = r.pass ? 'PASS' : 'FAIL'
  console.log(`\n[${tag}] ${r.file}  grade ${r.grade}  score ${r.score}`)
  if (r.autoFails.length) console.log('  AUTO-FAIL: ' + r.autoFails.map(a => `${a.type} x${a.count}`).join(', '))
  console.log(`  metrics: ${r.metrics.wordCount}w, ${r.metrics.sentences} sentences, mean ${r.metrics.meanSentenceLen}w, burstiness CV ${r.metrics.burstinessCV}, hedges/100 ${r.metrics.hedgeDensityPer100}, triples ${r.metrics.tricolons}`)
  for (const d of r.deductions) console.log(`  ${d.points}  ${d.reason}${d.detail ? ' [' + d.detail.join(', ') + ']' : ''}`)
}

let anyFail = false
const results = []
if (useStdin) {
  const raw = readFileSync(0, 'utf8')
  const r = grade(raw, '<stdin>'); results.push(r); report(r); anyFail = anyFail || !r.pass
} else {
  for (const f of files) {
    let raw
    try { raw = readFileSync(f, 'utf8') } catch (e) { console.error(`cannot read ${f}: ${e.message}`); anyFail = true; continue }
    const r = grade(raw, f); results.push(r); report(r); anyFail = anyFail || !r.pass
  }
}
if (jsonOnly && results.length > 1) console.log(JSON.stringify({ summary: { total: results.length, passed: results.filter(r => r.pass).length } }))
process.exit(anyFail ? 1 : 0)
