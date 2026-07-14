# VOICE

How Treetop thought-leadership sounds. Read this before drafting. This file has two parts: the non-negotiable guardrails, and the observed voice patterns pulled from live Treetop copy.

---

## Part one: the non-negotiable guardrails

These are the rules the engine exists to protect. They are what keep this content out of the clickbait genre it is deliberately avoiding.

- **The reader is the hero, I am the guide.** A guide never tells the hero they are behind. A guide says "I got stuck in this same spot, here is the path I found."
- **Write from what opened up for me, not from what the reader is missing.** Let the reader arrive at the conclusion instead of announcing it at them.
- **Show the bad first version, not just the polished result.** The struggle is the credibility.
- **Lead with my own discovery, not the reader's deficit.**
- **Banned constructions.** Do not use "the old way is dead," "you're doing it wrong," any "stop doing X" imperative aimed at the reader, "still doing it the old way," or any death-of-category framing. These are the tell of the exact clickbait genre I am avoiding. This bullet is the single allowlisted place those strings may appear (it is the rule that names them). A banned-construction grep of `content-engine/` should expect exactly one match, here. Any match in `drafts/`, `posts/`, `public/insights/`, or elsewhere in this folder is a real hit and must be removed.
- **No em dashes.** Use periods, commas, colons, or parentheses. En dashes used as em dashes are also banned. This applies to every file the engine produces.

A quick test before publishing any paragraph: does it make the reader feel behind, or does it invite them forward? If it points a finger, rewrite it as something I discovered.

---

## Part two: observed voice patterns

Extracted from live Treetop copy. Source pages read for this profile: the homepage (`src/pages/index.astro`) and the About page (`src/pages/about.astro`), both from the production-synced canonical tree (`treetopnest/treetopnest`, in sync with `origin/main`, so source equals what ships). Examples below are Bill's actual published phrasing, not fabricated.

### Sentence rhythm

Short declaratives, often in a run of two or three, building to a plain conclusion. Fragments are used on purpose for weight.

- "Not another agency, not another slide deck."
- "A leader in the room. A system underneath. Growth you can predict."
- "Spend goes out. Results are murky."

### The two-part contrast headline

A crisp opposition, stated as fact, no hedging. Sets up "here is the difference" without insulting anyone.

- "AI-native is a build order. AI-decorated is a coat of paint."
- "Every agency now claims AI. Here is the difference between building the engine that way and bolting a chatbot onto the old one."

### The reframe move ("that is not an X problem")

Diagnoses the real issue by naming what it is not, then what it is. Calm, not accusatory.

- "That is not a budget problem. It is a leadership problem, and it compounds."
- "When no one truly leads marketing, growth becomes a gamble."

### Reader-as-hero, spoken to plainly

Second person, concrete, respectful. The reader is competent and busy, not clueless.

- "You walk in prepared, not defensive."
- "You have a freelancer, a few tools, maybe an agency on retainer, and a stack of dashboards nobody trusts."
- "no Calendly friction, no intake form maze."

### Anti-hype, concrete over abstract

Names real numbers, real ramp times, real tradeoffs. Prefers the specific ("6 months to real output") to the grand claim.

- "A proven CMO on your terms. Not a $300K hire you have to figure out how to manage."
- "Ramp: 60 to 90 days to see a plan."

### Plain, human register

Comfortable being casual and honest, including about its own failures ("Sorry for the hiccup"). This is the same register the retrospective and honest-constraints posts should live in.

---

## Known frameworks to reference naturally

These are Bill's own frameworks. Posts can lean on them without over-explaining, the way the live site does.

- **StoryBrand.** The reader is the hero, Treetop (Bill) is the guide. This is the spine of the guardrails above, not a decoration.
- **The Revenue Engine Method: Memory, then Intelligence, then Motion.** Used on the homepage as the shape of what compounds. "Built on the Revenue Engine Method: Memory, then Intelligence, then Motion. Each month makes the next month easier." Reference it in the same order.

---

## Hooks (for repurposed social units)

Short-form units (LinkedIn, X) live or die on the first line. The hook library is in `HOOKS.md`. The one rule that must never break, because it is the same guardrail as above: a hook throws rocks at a situation, a status quo, or a market condition, never at the reader. "Most SMBs pay enterprise prices for software they half-use" is allowed. "You're overpaying because you never read your contract" is not. First-person confession ("I aimed AI at the wrong problem for two years") is allowed and powerful. See `HOOKS.md`.

---

## Note on sourcing

Voice above was extracted from the canonical repo source, which is in sync with `origin/main` and therefore identical to the live site. If a future session wants to refresh this profile against newly published pages, re-read the current homepage and one recent long-form page and add observed patterns here. Do not invent phrases Bill has not used.
