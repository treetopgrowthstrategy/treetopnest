# DISTRIBUTION

How one essay becomes many touches. This is the layer that turns the Treetop content engine from a publishing pipeline into a compounding flywheel, adapted from Justin Welsh's one-person content system. Read VOICE.md, HOOKS.md, and HUMANNESS.md first. Every unit this produces is drafted to VOICE, hooked per HOOKS, and must clear the humanness gate before it is post-ready.

## The model: one hub, many spokes

Welsh's insight is that the scarce act is not posting, it is producing one strong idea and then refusing to use it only once. He writes one newsletter and mines it into 6 to 8 atomic units across channels, staggered over weeks, and recycles the winners a year later because the audience has turned over.

**The Treetop adaptation, and why it is stronger.** Welsh's hub is a newsletter, which is ephemeral. Our hub is the SEO essay at `src/pages/<slug>.astro`: owned, ranked, and cited by AI answer engines. So we get Welsh's repurposing reach on social plus durable search and AEO value he leaves on the table. Social earns the immediate audience. The essay compounds in search. Each feeds the other.

```
        idea capture (twice weekly)
                  |
                  v
        CONTENT_STATE backlog
                  |
                  v
   draft -> humanness gate -> HUB ESSAY (src/pages, owned + ranks + cited)
                  |
                  v
        repurpose (this doc)
        |       |        |         |
   LinkedIn   X thread  newsletter  carousel      <- each hooked + gated
        |       |        |         |
   stagger across 4 to 6 weeks, recycle winners at ~12 months
                  |
                  v
        engage -> measure -> feed winners back into idea capture
```

## The channel map

From one rendered essay, produce these units. Each is derived from the essay's actual argument, never invented.

| Unit | Length | Shape | Hook | Close |
|------|--------|-------|------|-------|
| LinkedIn post | 120 to 250 words | one idea from the essay, skimmable, short lines, white space | fold discipline (HOOKS.md) | call-to-conversation + link to the essay |
| X / Twitter thread | 5 to 9 posts | the essay's spine, one beat per post | first post is the hook | last post links the essay, invites reply |
| Newsletter / Substack section | 300 to 600 words | the essay condensed to its argument, written to be read start to finish | a subject line + a strong open | a single CTA |
| Carousel outline | 6 to 10 slides | slide-by-slide: hook slide, one point per slide, payoff slide | slide 1 is the hook | last slide is the CTA |

The newsletter unit writes to `content-engine/posts/` (already the Substack-ready home). The rest write to `content-engine/distribution/<slug>/`.

## Staggering and recycling

Do not fire all units on publish day. Spread them so one essay works for weeks.

- **Week of publish:** the essay goes live. Post the LinkedIn post. Send the newsletter section.
- **Week +1:** post the X thread.
- **Week +2 to +3:** post the carousel, and a second-angle LinkedIn post that takes a different point from the same essay.
- **Month +12:** if a unit was a winner, recycle it almost verbatim. The audience has grown and mostly never saw the original.

Winners get reused with updated specifics. Content is an appreciating asset, not a disposable.

## Idea capture (the front end, so the pipe never runs dry)

Twice a week, 30 minutes, produce 5 to 7 candidate ideas into the CONTENT_STATE backlog. Sources, in priority order:

1. Real search demand (GSC and Ahrefs queries where Treetop is close but not winning).
2. Questions real prospects and readers ask.
3. The 17-topic portfolio (in the plan file) and the theses behind it.
4. Gaps in what competitors publish.
5. What performed in the last cycle (feed winners back).

An idea is worth keeping only if Bill has a concrete, lived, or numeric point to make. If it is generic, drop it.

## The tool

`tools/repurpose.js` (a Workflow harness, same primitives as `page-qa-loop.js`) automates the channel map: given an essay slug it reads the essay, drafts each unit in parallel to VOICE + HOOKS, runs each through `tools/humanness-check.mjs`, and writes the post-ready files to `distribution/<slug>/`. Units that fail the gate are flagged for a rewrite, never auto-posted. See the folder's README for invocation.

## Guardrails

- **Nothing auto-posts.** Every unit is a file for Bill to review and post himself. Posting to his live socials is his call, per session, never automated here.
- **Every unit passes the humanness gate.** No em dashes, no banned constructions, grade B or better.
- **Hooks obey the situation-as-enemy rule.** Never blame the reader.
- **No invented numbers.** Same rule as the essays.
