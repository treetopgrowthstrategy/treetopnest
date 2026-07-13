# HUMANNESS

The gate that keeps Treetop content sounding like Bill, not like AI. Every post is graded before it can render to HTML or publish. This is a hard gate: a draft that does not clear it does not ship. It is the writing-quality companion to the SEO `quality_gate.py` (which gates on CTR data, not prose).

Grading has three layers. Layer 1 is deterministic and runs as a script. Layers 2 and 3 are Claude passes that run in the content workflow. The final grade is the lower of the mechanical grade and the judge grade.

The gate never rewrites prose. It flags, grades, and routes flagged passages to a human (that is me, in conversation with Bill). Rewrites are always a judgment call, never automatic. This mirrors the `page-qa-loop.js` guardrail: mechanical fixes only, content stays `needsHuman`.

## The grade

Uses the same `A+ / A / B / C / D / F` rubric as `page-qa-loop.js`.

- **Pass = grade B or better AND zero mechanical auto-fails.**
- Anything below B, or any auto-fail, blocks the render/publish step.
- The grade is recorded next to the post's Status in `CONTENT_STATE.md`.

## Layer 1: mechanical tells (deterministic)

Runs via `tools/humanness-check.mjs` (self-contained Node, no dependencies):

```
node content-engine/tools/humanness-check.mjs src/pages/<slug>.astro
```

It strips HTML, script, style, and frontmatter to visible prose, then scores. Exit code 0 = pass, 1 = fail. `--json` for machine output, `--stdin` to pipe raw text.

**Auto-fail (forces F), no exceptions:**
- Any em dash (—) or en dash (–) in visible copy. Bill's permanent rule.
- Any banned construction from VOICE.md: "the old way is dead," "you're doing it wrong," any "stop doing X" imperative, "doing it the old way," or death-of-category framing ("X is dead," "the death of X").

**Weighted deductions (lower the grade):**
- AI filler lexicon: "unlock," "delve," "in today's evolving landscape," "seamless," "robust," "elevate," "empower," "testament to," "navigating the," "it is worth noting," "in conclusion," "furthermore / moreover" overuse, "plethora," "myriad," "pivotal," "holistic," and similar. The list deliberately excludes words that are genuinely in Bill's voice (for example "leverage," "engine," "operator") so the gate does not punish his real register.
- Low sentence-length variance (burstiness). Human writing varies sentence length; AI writing is uniform. Measured as the coefficient of variation of sentence word counts; below 0.50 is penalized.
- High hedging density ("can help," "may," "often," "typically").
- Rule-of-three overuse (repeated "A, B, and C" triples).
- The "it is not just X, it is Y" template.

Thresholds and weights are tunable constants at the top of the script. Calibration target: the three launch posts pass (A+, A, A+); a deliberately AI-flavored control paragraph fails F. Both confirmed.

## Layer 2: voice-positive coverage (Claude, from VOICE.md)

Layer 1 catches what is wrong. Layer 2 confirms what should be present. The judge checks the draft for the positive signals in VOICE.md and treats their absence as a downgrade, because a post can be free of tells and still read as generic:
- A first-person discovery lead (write from what opened up for me, not the reader's deficit).
- A shown "bad first draft" or an honest admission. The struggle is the credibility.
- Concrete specifics and real numbers, not adjectives.
- At least one two-part contrast line, or the "that is not an X problem, it is a Y problem" reframe.
- Genuine sentence-length burstiness (confirms Layer 1's metric by reading, not just counting).
- Reader-as-hero framing, guide not guru.

## Layer 3: adversarial Claude judge

Reuses the `page-qa-loop.js` verify pattern (an independent skeptical pass) and the `VERDICT_SCHEMA` shape. Three moves on the same draft:

1. **Prosecute.** "Argue this was written by an AI. Cite the exact passages that give it away: generic phrasing, uniform rhythm, hedging, tells the script may have missed."
2. **Defend.** "Argue this was written by Bill. Cite the passages that prove it: specific lived detail, his cadence, the reframe move, a line only he would write."
3. **Verdict.** A humanness grade (A+..F) plus line-level flags, each with a suggested human rewrite direction (not an applied rewrite). Use the `aeo-editor.md` Strong / Needs-Work / Gap labels per flagged passage.

The judge grade and the Layer 1 grade are combined by taking the lower. This is deliberate: a post must satisfy both the machine and the reader.

## How it plugs into the workflow

`WORKFLOW.md` step 3.5 (Grade) runs this gate between refining the draft and rendering it. On fail, the output is a report card (grade, auto-fails, deductions, judge verdict, line-level flags). I revise the flagged passages and re-grade, looping a small number of times, then only proceed to render once the draft clears.

For already-published pages, `page-qa-loop.js` carries a `humanness` dimension so any live URL can be re-audited on the same axis alongside the other checks.

## Honest limits

This gate targets Bill's actual voice (VOICE.md), not a third-party AI detector. Detectors like GPTZero and Originality.ai were considered and declined: they false-positive on genuinely human writing, and optimizing to beat them rewards gaming a flawed tool over sounding like Bill. If a detector score is ever wanted, treat it as one directional signal, never the target. The target is always the voice.
