# CONTENT_STATE

**READ THIS FIRST. This is the single source of truth for the Treetop content engine. Before drafting anything, read VOICE.md, DESIGN.md, and WORKFLOW.md in this folder.**

This file is the backlog and the status board. It is the equivalent of the ecofit Airtable backlog and the Billy `BUILD_STATE.md`. Every content session opens this file first, picks the next post by sequence priority, and updates status here as it moves.

Status values: `Backlog`, `Drafting`, `In Review`, `Rendered`, `Live`.

Finished HTML is published to `public/insights/` (see `PUBLIC_CONTENT_PATH` in DESIGN.md). This repo deploys on push to `main`, so pushing to main means publishing. Nothing publishes without Bill's explicit in-chat approval of the final draft.

---

## Pipeline

| # | Working Title | Status | Sequence Priority | One-line Thesis | Proof Artifact | Notes |
|---|---------------|--------|-------------------|-----------------|----------------|-------|
| 1 | Search and review data as raw material for a revenue-tied intelligence artifact | Backlog | Queue | Search and review data is not the insight, it is the raw material. The AI-native marketer's job is translating raw signal into a revenue-tied artifact the buyer cannot get anywhere else. | The SWIFT/Moxie operator brief (the arc from a plain word cloud to a Revenue Leak Score, a friction-to-revenue estimator tied to member LTV, and a cohort benchmark). | Open on the mediocre first version. The struggle is the credibility. |
| 2 | A two-year learning retrospective | Backlog | **LEAD POST** | The shift is a sequence of mental unlocks, not a sequence of tools. Here is what I stopped believing, in what order. | The two-year arc itself. | No tools listicle. Lead with my own discovery, not the reader's deficit. |
| 3 | The deliverable as a competitive weapon | Backlog | Third | The artifact itself is now the advantage. A branded, interactive HTML brief you can stand up in an afternoon reads as more senior than the same content in a deck, and costs almost nothing. | The Moxie brief and the Treetop reports. | Write it around what became possible when I started handing people an interactive brief instead of a PDF. Let the reader feel the contrast. |
| 4 | Vibe product planning, paired with the living spec | Backlog | Queue | I plan loosely and generatively, but anchor to a living spec so the looseness compounds instead of drifting. | The Billy planning approach. | Pair explicitly with entry 6 so skeptics see the guardrail. |
| 5 | You do not need to write the perfect prompt | Backlog | Second | Ask for the prompt to be written, then refine it. | A live demonstration inside the post (vague ask, generated prompt, one round of refinement, result). | Most accessible top-of-funnel piece. Reading someone do it beats being told it works. |
| 6 | The living spec | Backlog | Queue | The document is the real product. The scarce skill now is writing a spec clear enough that a capable system can execute it. | `BUILD_STATE.md` as the contract between me and the build. | The guardrail companion to entry 4. |
| 7 | Building something that runs without me | Backlog | Queue | The leverage is in specifying a loop that runs on a schedule and reports back. | The scheduled intelligence pipeline. | Frame with curiosity, not instruction. Open on the first time something kept running after I closed the laptop, and what that taught me about where my hours should go. |
| 8 | Getting cited, not just ranked | Backlog | Queue | Search optimized to be found by people through Google. The new discipline is optimizing to be cited by AI answer engines, a different game with different rules. | llms.txt, FAQPage and HowTo schema, AI-crawler-friendly robots.txt. | Curiosity, not warning. A new surface I started paying attention to and what I did about it. |
| 9 | Services are how you fund products | Backlog | Queue | Fractional and consulting engagements are not the endgame, they are trust-building channels that fund and validate owned products. | The portfolio structure. | A strategist POV piece, reads as leadership. |
| 10 | One person, a portfolio | Backlog | Last | What one operator can now hold. | The multi-brand stack. | Write the honest-constraints version. What it costs, what breaks, what I gave up, where the system fails me. The roster is not the story, the tradeoffs are. Publish only after two or three tactical posts are live. |

---

## Suggested sequence

Lead with **2** (the retrospective), then **5** (perfect-prompt), then **3** (HTML deliverable), then the rest. Hold **10** until two or three tactical posts are live.

## Design lock

The first content session prototypes and locks ONE post template before any post is rendered. Nothing renders to HTML until the template is locked. See WORKFLOW.md step 4 and DESIGN.md.
