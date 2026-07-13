# WORKFLOW

The per-post loop. This mirrors how Bill works for ecofit: prototype the look, lock it, then build against the lock. The order matters. Drafting and refining happen in markdown first. Nothing renders to HTML until the template is locked and the draft is approved.

## Before you start

Open `CONTENT_STATE.md` first. Then read `VOICE.md` and `DESIGN.md`. Do not skip these. The engine only stays consistent because every session reads the same standing context.

## The loop

1. **Pick the next post.** Open `CONTENT_STATE.md`, choose the next post by Sequence Priority, and set its Status to `Drafting`.

2. **Draft in markdown.** Write the draft in `content-engine/drafts/` using a human-readable file name (for example `two-year-retrospective.md`). Draft to `VOICE.md`: reader as hero, lead with your own discovery, show the bad first version, no banned constructions, no em dashes.

3. **Refine through conversation.** This is where the real work happens, not the first pass. Iterate with Bill until the piece earns its place. Keep the working draft in `drafts/`.

4. **Render only after the template is locked.** The first content session prototypes and locks ONE post template built against `DESIGN.md`, with Bill's sign-off. Once (and only once) that template is locked, render the approved draft to branded HTML against `DESIGN.md` and output it to the confirmed `PUBLIC_CONTENT_PATH` (`public/insights/`). Every later post renders against the same locked template. Set Status to `Rendered`.

5. **Produce the Substack-ready version.** Write a plain version of the same piece to `content-engine/posts/` (markdown or plain text), so cross-posting to Substack needs no rework. Keep it in sync with the rendered HTML.

6. **Update status.** Update the post's Status in `CONTENT_STATE.md`. Never push to `main` or publish without Bill's explicit in-chat approval of the final draft. Publishing here means pushing to `main`, which triggers the Vercel deploy.

## Guardrails on publishing

- No push to `main` and no deploy without Bill's explicit in-chat go-ahead on the final draft.
- Run the pre-commit checks (em dashes, banned constructions) against anything new in `content-engine/` before committing, the same way they were run at setup. The banned-construction grep will match exactly one intentional line: the guardrail definition in `VOICE.md` that names the banned phrases. That single match is expected. Any other match is a real hit and must be fixed.
- Human-readable file names throughout, in `drafts/`, `posts/`, and `public/insights/`.

## Folder map

- `content-engine/CONTENT_STATE.md` : source of truth, start here.
- `content-engine/VOICE.md` : how it sounds, plus the guardrails.
- `content-engine/DESIGN.md` : the locked design tokens and where HTML goes.
- `content-engine/WORKFLOW.md` : this file.
- `content-engine/drafts/` : markdown drafts in progress.
- `content-engine/posts/` : Substack-ready plain versions of shipped pieces.
