# distribution

Post-ready atomic units generated from hub essays, one folder per essay slug (`distribution/<slug>/`). Each folder holds `linkedin.md`, `x-thread.md`, and `carousel.md`. The newsletter version lives in `../posts/<slug>.md`.

Generate with the repurpose harness:

```
Workflow({ name: 'repurpose', args: { slug: 'model-a-business-before-you-risk-capital' } })
```

It drafts each unit to `../VOICE.md` + `../HOOKS.md` and gates each with `../tools/humanness-check.mjs`. Passing units land here; failing units are flagged for a human. See `../DISTRIBUTION.md` for the channel map, staggering, and cadence.

Nothing here auto-posts. These are drafts for Bill to review and post on his own schedule.
