# -*- coding: utf-8 -*-
"""
Content data for treetop_howto_expander.py.
Each entry centers on a real, copy-paste prompt template. Keep prose free of
em/en dashes per house style (hyphens are fine inside prompts).
"""

R_MKT = ("how-to-use-claude-for-marketing", "How to use Claude for marketing", "The umbrella guide to Claude for marketing teams.")
R_PROMPTS = ("claude-prompts-for-marketing", "Claude prompts for marketing", "A library of prompts you can copy.")
R_USE = ("how-to-use-ai-in-your-business", "How to use AI in your business", "The framework for choosing what to automate.")

# Shared workflow + pitfalls (the prompt template is the unique value per page)
def _workflow(setup, draft_note):
    return [
        ("Set up a Claude Project.", f"Add your {setup} as project knowledge so you never re-paste context. Claude Projects keep brand voice, examples, and rules in one place."),
        ("Paste the prompt template.", "Fill in the bracketed fields with your specifics. The more precise the inputs, the less editing the output needs."),
        ("Generate two or three variations.", f"Ask for {draft_note}. Pick the strongest and tell Claude what you liked so the next pass sharpens it."),
        ("Iterate, do not accept the first draft.", "One follow-up instruction (tighter, warmer, shorter, more specific) usually does more than re-prompting from scratch."),
        ("Edit for voice and accuracy, then save the prompt.", "Claude gets you most of the way; you own the final 20 percent. Save the working prompt so next time is a two-minute job."),
    ]

AVOID = [
    "Vague prompts. 'Write a follow-up email' produces generic output. Specifics in, specifics out.",
    "Publishing without editing. Always do the final human pass for voice, facts, and judgment.",
    "Skipping the Project setup, which forces you to re-paste context every single time.",
    "Treating Claude as a vending machine instead of a thinking partner you iterate with.",
]

HOWTOS = {}

HOWTOS["how-to-write-follow-up-emails-with-claude"] = {
    "title": "How to Write Follow-Up Emails with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for writing sales follow-up emails with Claude, including a copy-paste prompt template, the workflow, a worked example, and pitfalls to avoid.",
    "og_title": "How to Write Follow-Up Emails with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template plus the workflow for follow-ups that move deals forward.",
    "crumb": "How to Write Follow-Up Emails with Claude",
    "howto_name": "How to Write Follow-Up Emails with Claude",
    "h1": "How to write follow-up emails with Claude: <em>step-by-step.</em>",
    "hero_sub": "Follow-ups are where deals are won or quietly lost. This playbook gives you a prompt template that drafts follow-ups in your voice in seconds, plus the workflow to make them land.",
    "verdict": "Use a structured prompt that gives Claude the deal context, the last interaction, and a clear goal for the email. Generate a few variants, pick one, and edit for voice. You get follow-ups drafted 3 to 5 times faster with your judgment intact.",
    "prompt_intro": "This template works for sales and post-meeting follow-ups. Paste it into Claude, fill in the brackets, and it returns a tight, specific email instead of a generic nudge.",
    "prompt": ("You are my sales follow-up assistant. Write a short follow-up email.\n\n"
               "Context:\n"
               "- Recipient: [name, role, company]\n"
               "- Our last interaction: [meeting / demo / email and what was discussed]\n"
               "- What they care about: [their goal or pain point]\n"
               "- Our offering: [product / service in one line]\n"
               "- Goal of this email: [book next call / get a decision / share resource]\n\n"
               "Rules:\n"
               "- Under 120 words. One clear call to action.\n"
               "- Reference something specific from our last interaction.\n"
               "- Warm and direct, no filler, no hype. Do not use em dashes.\n"
               "- Give me 2 versions: one slightly warmer, one more direct.\n\n"
               "Write the emails now."),
    "prompt_outro": "Notice the structure: role, context, rules, format. That skeleton is the core of every good prompt. For more, see our library of <a href=\"/claude-prompts-for-marketing\">Claude prompts for marketing</a>.",
    "workflow": _workflow("CRM notes, brand voice, and a few of your best past follow-ups", "two versions, one warmer and one more direct"),
    "example": "Say a prospect went quiet after a demo. Drop the demo notes and their stated goal into the brackets, and Claude returns a follow-up that references the exact feature they liked and proposes a specific next step, rather than 'just checking in.' Specificity is what gets replies.",
    "avoid": AVOID,
    "faqs": [
        ("What is the best prompt for follow-up emails?", "One that gives Claude the recipient, your last interaction, what they care about, and a single clear goal for the email, with rules on length and tone. Use the template on this page."),
        ("How do I keep follow-ups in my own voice?", "Set up a Claude Project with your brand voice and a few of your best past emails as examples. Claude matches the pattern, and you do a quick final edit."),
        ("Can Claude write a whole follow-up sequence?", "Yes. Ask for a 3 to 5 touch sequence with spacing and a different angle each time. See our guide to cold outreach sequences with Claude."),
        ("Will AI follow-ups sound generic?", "Only if your prompt is generic. The more specific the context you give it, the more specific and human the output. Always do a final human edit."),
    ],
    "related": [
        ("how-to-write-cold-outreach-sequences-with-claude", "Cold outreach sequences with Claude", "Multi-touch sequences that book meetings."),
        ("how-to-write-renewal-emails-with-claude", "Renewal emails with Claude", "Keep customers and protect revenue."),
        R_PROMPTS, R_MKT,
    ],
}

HOWTOS["how-to-write-cold-outreach-sequences-with-claude"] = {
    "title": "How to Write Cold Outreach Sequences with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for writing cold outreach sequences with Claude, including a copy-paste prompt template for a multi-touch sequence, the workflow, and pitfalls to avoid.",
    "og_title": "How to Write Cold Outreach Sequences with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template for multi-touch cold sequences that actually get replies.",
    "crumb": "How to Write Cold Outreach Sequences with Claude",
    "howto_name": "How to Write Cold Outreach Sequences with Claude",
    "h1": "How to write cold outreach sequences with Claude: <em>step-by-step.</em>",
    "hero_sub": "A good cold sequence is a series of angles, not the same ask five times. This playbook gives you a prompt template that builds a full multi-touch sequence with a distinct hook per email.",
    "verdict": "Give Claude your ideal prospect, the specific pain you solve, and proof, then ask for a 4 to 5 touch sequence with a different angle and a soft, clear call to action each time. Edit for voice and you have a sequence in minutes.",
    "prompt_intro": "This template produces a complete sequence, not one email. Each touch comes from a different angle so you are adding value, not just nagging.",
    "prompt": ("You are my cold outreach strategist. Write a 5-email cold sequence.\n\n"
               "Context:\n"
               "- Target prospect: [title, company type, industry]\n"
               "- The problem we solve for them: [specific pain]\n"
               "- Our offering: [one line]\n"
               "- Proof: [metric, customer, or result]\n"
               "- Desired action: [book a 15-min call]\n\n"
               "Rules:\n"
               "- 5 emails, each under 90 words, spaced over ~2 weeks.\n"
               "- Each email uses a DIFFERENT angle: problem, proof, insight, short nudge, breakup.\n"
               "- Subject line for each, under 6 words, no clickbait.\n"
               "- Conversational, specific, no buzzwords. Do not use em dashes.\n\n"
               "Output as: Email 1..5 with subject, body, and suggested send-day."),
    "prompt_outro": "The 'different angle each touch' rule is what separates a sequence that books meetings from one that gets marked as spam. Pair this with <a href=\"/how-to-write-follow-up-emails-with-claude\">follow-up emails with Claude</a> for replies that come in.",
    "workflow": _workflow("ideal customer profile, positioning, and proof points", "two sequence variants with different opening angles"),
    "example": "Feed Claude a target of 'VP of Ops at a 200-person logistics firm,' the pain ('manual scheduling eats 10 hours a week'), and a proof point. It returns five emails: one leading with the pain, one with the customer result, one with a contrarian insight, a one-line nudge, and a graceful breakup. You edit the voice and load it into your sequencer.",
    "avoid": AVOID,
    "faqs": [
        ("What is the best prompt for a cold email sequence?", "One that gives Claude the prospect, the specific pain, proof, and a single action, then asks for a 4 to 5 touch sequence with a different angle per email. Use the template here."),
        ("How many emails should a cold sequence have?", "Four to six over about two weeks works well. The key is a distinct angle per touch (problem, proof, insight, nudge, breakup) rather than repeating the same ask."),
        ("How do I avoid sounding like spam?", "Be specific and useful. Reference the prospect's actual situation, keep each email short, and lead with their problem, not your product. Always edit the final copy."),
        ("Can Claude personalize at scale?", "It can draft strong per-segment templates and personalize from data you provide, but a human should review tone. Combine it with research notes for the best results."),
    ],
    "related": [
        ("how-to-write-follow-up-emails-with-claude", "Follow-up emails with Claude", "Follow-ups that move deals forward."),
        ("how-to-write-linkedin-articles-with-claude", "LinkedIn articles with Claude", "Thought leadership that warms cold prospects."),
        R_PROMPTS, R_MKT,
    ],
}

HOWTOS["how-to-write-customer-success-emails-with-claude"] = {
    "title": "How to Write Customer Success Emails with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for writing customer success emails with Claude, including a copy-paste prompt template for onboarding, check-ins, and at-risk outreach, plus pitfalls to avoid.",
    "og_title": "How to Write Customer Success Emails with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template for CS emails: onboarding, check-ins, and saves.",
    "crumb": "How to Write Customer Success Emails with Claude",
    "howto_name": "How to Write Customer Success Emails with Claude",
    "h1": "How to write customer success emails with Claude: <em>step-by-step.</em>",
    "hero_sub": "CS lives on consistent, personal communication that a stretched team rarely has time for. This playbook gives you a prompt template for onboarding, check-ins, and at-risk saves.",
    "verdict": "Give Claude the customer's stage, health signals, and the goal of the email, then ask for a warm, specific message tied to their outcomes. You get consistent CS communication that protects retention, drafted in seconds.",
    "prompt_intro": "This template adapts to any CS moment: onboarding, a quarterly check-in, or reaching out to an at-risk account. Change the 'situation' line and it adjusts.",
    "prompt": ("You are my customer success email assistant. Write a customer email.\n\n"
               "Context:\n"
               "- Customer: [name, role, company, plan]\n"
               "- Lifecycle stage: [onboarding / adoption / renewal-approaching / at-risk]\n"
               "- Situation / signal: [low usage, milestone hit, support issue, etc.]\n"
               "- Their goal with us: [the outcome they bought us for]\n"
               "- Goal of this email: [drive a behavior / book a review / reassure]\n\n"
               "Rules:\n"
               "- Under 130 words, warm and human, focused on THEIR outcome not our product.\n"
               "- One clear, low-friction next step.\n"
               "- No corporate filler. Do not use em dashes.\n\n"
               "Write the email."),
    "prompt_outro": "The 'focus on their outcome' rule is the whole game in CS. For revenue-moment emails specifically, see <a href=\"/how-to-write-renewal-emails-with-claude\">renewal emails</a> and <a href=\"/how-to-write-upsell-emails-with-claude\">upsell emails with Claude</a>.",
    "workflow": _workflow("CS playbooks, lifecycle stages, and your product's value milestones", "two versions, one more proactive and one more reassuring"),
    "example": "An account's usage dropped for two weeks. Put 'at-risk' and 'usage down 40 percent' in the brackets with the outcome they bought you for, and Claude drafts a check-in that leads with their goal, names a specific feature that would help, and proposes a 15-minute review, rather than a generic 'how's it going.'",
    "avoid": AVOID,
    "faqs": [
        ("What is the best prompt for customer success emails?", "One that gives Claude the customer's lifecycle stage, the health signal, and their desired outcome, then asks for a warm message focused on that outcome. Use the template here."),
        ("Can Claude write onboarding email sequences?", "Yes. Ask for a staged onboarding sequence tied to your activation milestones, and it drafts each touch. Edit for voice and load it into your CS tool."),
        ("How do I use AI for at-risk accounts?", "Give Claude the risk signal and the customer's goal, and ask for a save email that leads with their outcome and offers a concrete next step. A human should always review at-risk outreach."),
        ("Will customers notice AI-written emails?", "Not if you keep them specific, human, and outcome-focused, and do a final edit. Generic AI output is obvious; well-prompted, edited output is not."),
    ],
    "related": [
        ("how-to-write-renewal-emails-with-claude", "Renewal emails with Claude", "Protect and grow recurring revenue."),
        ("how-to-write-upsell-emails-with-claude", "Upsell emails with Claude", "Expansion that feels like help, not a pitch."),
        R_PROMPTS, R_MKT,
    ],
}

HOWTOS["how-to-write-renewal-emails-with-claude"] = {
    "title": "How to Write Renewal Emails with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for writing renewal emails with Claude, including a copy-paste prompt template that leads with realized value, the workflow, and pitfalls to avoid.",
    "og_title": "How to Write Renewal Emails with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template for renewal emails that lead with value, not the invoice.",
    "crumb": "How to Write Renewal Emails with Claude",
    "howto_name": "How to Write Renewal Emails with Claude",
    "h1": "How to write renewal emails with Claude: <em>step-by-step.</em>",
    "hero_sub": "A renewal email should remind the customer what they got, not just that a bill is due. This playbook gives you a prompt template that leads with realized value.",
    "verdict": "Give Claude the value the customer realized, the renewal terms, and any expansion angle, then ask for an email that leads with their results. You get renewal outreach that feels earned, not transactional.",
    "prompt_intro": "This template frames the renewal around outcomes the customer already received, which is what makes renewals easy. Fill in the value they got and it does the rest.",
    "prompt": ("You are my renewals assistant. Write a renewal email.\n\n"
               "Context:\n"
               "- Customer: [name, role, company, plan]\n"
               "- Value realized this term: [metrics, wins, milestones]\n"
               "- Renewal details: [date, term, any price change]\n"
               "- Expansion opportunity (optional): [seats, tier, add-on]\n"
               "- Relationship tone: [warm long-term / newer account]\n\n"
               "Rules:\n"
               "- Lead with the value they got, THEN the renewal ask.\n"
               "- Under 140 words, confident and warm, never apologetic about price.\n"
               "- One clear next step (confirm, or book a renewal call).\n"
               "- Do not use em dashes.\n\n"
               "Write the email, plus a 1-line subject."),
    "prompt_outro": "Leading with realized value is the single biggest lever on renewal rates. For the broader retention motion, see <a href=\"/how-to-write-customer-success-emails-with-claude\">customer success emails with Claude</a>.",
    "workflow": _workflow("account value summaries, renewal terms, and your CS voice", "two versions, one value-led and one relationship-led"),
    "example": "For a renewing account, drop in 'cut onboarding time 30 percent, 2 team expansions' and the renewal date. Claude opens with those wins, states the renewal plainly, and proposes a quick call, so the customer re-signs remembering the value rather than just seeing an invoice.",
    "avoid": AVOID,
    "faqs": [
        ("What should a renewal email lead with?", "The value the customer realized this term, not the invoice. Give Claude the specific wins and metrics and it builds the email around them. Use the template here."),
        ("Can Claude handle price-increase renewals?", "Yes. Tell it the new terms and ask for confident, non-apologetic framing that ties the price to realized and future value. Review the final copy yourself."),
        ("How early should renewal emails go out?", "Typically 60 to 90 days before the date for larger accounts. Ask Claude for a short renewal sequence with the right spacing for your contract size."),
        ("Will AI renewal emails feel transactional?", "Not if you prompt them to lead with the customer's outcomes and keep them warm. Generic 'your subscription is expiring' emails feel transactional; value-led ones do not."),
    ],
    "related": [
        ("how-to-write-customer-success-emails-with-claude", "Customer success emails with Claude", "Onboarding, check-ins, and saves."),
        ("how-to-write-upsell-emails-with-claude", "Upsell emails with Claude", "Expansion that feels like help."),
        R_PROMPTS, R_MKT,
    ],
}

HOWTOS["how-to-write-upsell-emails-with-claude"] = {
    "title": "How to Write Upsell Emails with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for writing upsell and expansion emails with Claude, including a copy-paste prompt template that ties the upgrade to a customer outcome, plus pitfalls to avoid.",
    "og_title": "How to Write Upsell Emails with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template for upsell emails that feel like help, not a pitch.",
    "crumb": "How to Write Upsell Emails with Claude",
    "howto_name": "How to Write Upsell Emails with Claude",
    "h1": "How to write upsell emails with Claude: <em>step-by-step.</em>",
    "hero_sub": "The best upsells feel like the next logical step for the customer, not a sales push. This playbook gives you a prompt template that ties the upgrade to a result they want.",
    "verdict": "Give Claude the customer's current usage, the outcome the upgrade unlocks, and a trigger that makes now the right time, then ask for a helpful, specific email. You get expansion outreach that lands as a recommendation.",
    "prompt_intro": "This template anchors the upsell to a real trigger (a limit hit, a goal stated, a milestone reached), which is what makes an upgrade feel earned rather than pushy.",
    "prompt": ("You are my expansion assistant. Write an upsell email.\n\n"
               "Context:\n"
               "- Customer: [name, role, company, current plan]\n"
               "- Trigger: [hit a usage limit / stated a goal / grew the team]\n"
               "- The upgrade: [tier / seats / add-on] and what it unlocks\n"
               "- Outcome it enables for them: [specific result]\n\n"
               "Rules:\n"
               "- Frame as a recommendation tied to THEIR trigger and goal.\n"
               "- Under 130 words, helpful not salesy, one clear next step.\n"
               "- Make the value obvious before the ask. Do not use em dashes.\n\n"
               "Write the email plus a short subject line."),
    "prompt_outro": "The trigger is everything: an upsell tied to a real event converts; a random upgrade pitch does not. Pair this with <a href=\"/how-to-write-customer-success-emails-with-claude\">customer success emails with Claude</a> so expansion comes from a healthy relationship.",
    "workflow": _workflow("plan tiers, usage triggers, and customer outcome stories", "two versions, one trigger-led and one outcome-led"),
    "example": "A customer just hit their seat limit. Put that trigger and the outcome the bigger plan unlocks into the brackets, and Claude writes an email that acknowledges their growth, shows what the upgrade enables, and offers a one-click path, reading as help rather than a pitch.",
    "avoid": AVOID,
    "faqs": [
        ("What makes an upsell email work?", "A real trigger. Tie the upgrade to something the customer just did (hit a limit, grew, stated a goal) and the outcome it unlocks. Claude builds the email around that. Use the template here."),
        ("How do I keep upsells from feeling pushy?", "Lead with the customer's situation and outcome, not your tier names. Prompt Claude to frame it as a recommendation, and keep it short. Always edit the final version."),
        ("Can Claude identify upsell opportunities?", "It can draft the email once you supply the trigger and account context. Identifying the opportunity comes from your usage data; Claude turns it into outreach."),
        ("Should upsell and renewal emails be combined?", "Sometimes. For a healthy account at renewal, a value-led renewal with a light expansion angle works. Ask Claude for both versions and choose."),
    ],
    "related": [
        ("how-to-write-renewal-emails-with-claude", "Renewal emails with Claude", "Lead with value, protect revenue."),
        ("how-to-write-product-update-emails-with-claude", "Product update emails with Claude", "Turn releases into engagement."),
        R_PROMPTS, R_MKT,
    ],
}

HOWTOS["how-to-write-product-launch-emails-with-claude"] = {
    "title": "How to Write Product Launch Emails with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for writing product launch emails with Claude, including a copy-paste prompt template built around the customer problem, the workflow, and pitfalls to avoid.",
    "og_title": "How to Write Product Launch Emails with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template for launch emails that lead with the problem, not the feature.",
    "crumb": "How to Write Product Launch Emails with Claude",
    "howto_name": "How to Write Product Launch Emails with Claude",
    "h1": "How to write product launch emails with Claude: <em>step-by-step.</em>",
    "hero_sub": "Launch emails fail when they lead with the feature instead of the problem it solves. This playbook gives you a prompt template that opens with the customer's pain.",
    "verdict": "Give Claude the problem the launch solves, who it is for, and the single action you want, then ask for a benefit-led email. You get launch copy that earns clicks instead of describing a feature.",
    "prompt_intro": "This template forces the email to open on the problem and the outcome, with the feature as the answer, which is the structure that drives launch engagement.",
    "prompt": ("You are my product marketing assistant. Write a product launch email.\n\n"
               "Context:\n"
               "- What we launched: [feature / product] in one line\n"
               "- The problem it solves: [specific pain]\n"
               "- Who it is for: [segment]\n"
               "- The outcome it enables: [benefit]\n"
               "- Primary action: [try it / book demo / read more]\n\n"
               "Rules:\n"
               "- Open with the PROBLEM and outcome, not the feature name.\n"
               "- Under 150 words, energetic but not hypey, one primary CTA.\n"
               "- Include a 1-line subject and a preview-text line.\n"
               "- Do not use em dashes.\n\n"
               "Write the email."),
    "prompt_outro": "Lead with the problem, name the feature as the answer, end on one action. For ongoing release comms, see <a href=\"/how-to-write-product-update-emails-with-claude\">product update emails with Claude</a>.",
    "workflow": _workflow("positioning, launch brief, and audience segments", "two versions, one problem-led and one outcome-led"),
    "example": "Launching a new reporting dashboard? Put the pain ('teams waste hours building manual reports') in the brackets, not just the feature. Claude opens on that frustration, presents the dashboard as the fix, and ends with one CTA, which outperforms a feature-tour email every time.",
    "avoid": AVOID,
    "faqs": [
        ("What is the best structure for a launch email?", "Open with the problem and outcome, present the feature as the answer, and end on a single action. Give Claude those inputs with the template here and it follows that structure."),
        ("Can Claude write a whole launch campaign?", "Yes. Ask for a sequence: teaser, launch, and follow-up, plus social and in-app copy. It keeps the message consistent across channels. Edit each for voice."),
        ("How do I avoid feature-dump launch emails?", "Prompt Claude to lead with the problem and limit the email to one CTA. Feature lists belong on the landing page, not in the email."),
        ("Should I segment launch emails?", "Yes, when the benefit differs by audience. Run the prompt per segment with a different 'who it is for' and 'outcome,' and Claude tailors each."),
    ],
    "related": [
        ("how-to-write-product-update-emails-with-claude", "Product update emails with Claude", "Turn releases into engagement."),
        ("how-to-write-webinar-promotion-with-claude", "Webinar promotion with Claude", "Fill seats for your launch event."),
        R_PROMPTS, R_MKT,
    ],
}

HOWTOS["how-to-write-product-update-emails-with-claude"] = {
    "title": "How to Write Product Update Emails with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for writing product update and release-notes emails with Claude, including a copy-paste prompt template that ties each change to a benefit, plus pitfalls to avoid.",
    "og_title": "How to Write Product Update Emails with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template for update emails that connect every change to a benefit.",
    "crumb": "How to Write Product Update Emails with Claude",
    "howto_name": "How to Write Product Update Emails with Claude",
    "h1": "How to write product update emails with Claude: <em>step-by-step.</em>",
    "hero_sub": "Update emails get ignored when they read like a changelog. This playbook gives you a prompt template that turns each change into a reason for the user to come back.",
    "verdict": "Give Claude the list of changes and who each one helps, then ask it to translate every item into a user benefit with a clear action. You get update emails that drive re-engagement instead of getting skimmed.",
    "prompt_intro": "This template converts a raw changelog into benefit-led copy. Paste your release notes into the brackets and it does the translation.",
    "prompt": ("You are my product communications assistant. Write a product update email.\n\n"
               "Context:\n"
               "- Audience: [all users / segment]\n"
               "- Changes shipped: [paste raw changelog or bullet list]\n"
               "- The headline change: [the one that matters most]\n"
               "- Action we want: [try the new thing / read docs]\n\n"
               "Rules:\n"
               "- Lead with the single biggest change and its benefit.\n"
               "- Translate every item from 'what changed' to 'what you can now do.'\n"
               "- Under 160 words, scannable, one primary CTA, light secondary mentions.\n"
               "- 1-line subject. Do not use em dashes.\n\n"
               "Write the email."),
    "prompt_outro": "The translation from 'what changed' to 'what you can now do' is the whole trick. For bigger releases, use <a href=\"/how-to-write-product-launch-emails-with-claude\">product launch emails with Claude</a>.",
    "workflow": _workflow("changelogs, user segments, and your product voice", "two versions, one benefit-led and one concise digest"),
    "example": "Paste a five-item changelog. Claude leads with the headline improvement framed as 'you can now export in one click,' lists the rest as quick benefit lines, and ends with one CTA to try it, instead of a dry bulleted release-notes dump.",
    "avoid": AVOID,
    "faqs": [
        ("How do I make product update emails interesting?", "Translate every change into a user benefit and lead with the biggest one. Give Claude your changelog and the template here turns it into benefit-led copy."),
        ("Can Claude turn a changelog into an email?", "Yes. Paste the raw changelog into the prompt and it rewrites each item as 'what you can now do,' ordered by impact, with one clear CTA."),
        ("How often should product update emails go out?", "Monthly digests work for most teams, with standalone emails for major releases. Ask Claude for both a digest and a single-feature version."),
        ("Should update emails be segmented?", "When changes affect different users. Run the prompt per segment so each audience sees the updates relevant to them first."),
    ],
    "related": [
        ("how-to-write-product-launch-emails-with-claude", "Product launch emails with Claude", "Benefit-led launch copy."),
        ("how-to-write-internal-newsletters-with-claude", "Internal newsletters with Claude", "Keep teams aligned and informed."),
        R_PROMPTS, R_MKT,
    ],
}

HOWTOS["how-to-write-event-invitations-with-claude"] = {
    "title": "How to Write Event Invitations with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for writing event invitation emails with Claude, including a copy-paste prompt template centered on the attendee's reason to show up, plus pitfalls to avoid.",
    "og_title": "How to Write Event Invitations with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template for invitations that sell the outcome, not the agenda.",
    "crumb": "How to Write Event Invitations with Claude",
    "howto_name": "How to Write Event Invitations with Claude",
    "h1": "How to write event invitations with Claude: <em>step-by-step.</em>",
    "hero_sub": "People RSVP for what they will walk away with, not for your agenda. This playbook gives you a prompt template that sells the attendee outcome.",
    "verdict": "Give Claude the event, the audience, and the one thing attendees will leave with, then ask for an invite that leads with that takeaway. You get invitations that drive registrations, drafted in seconds.",
    "prompt_intro": "This template centers the invite on the attendee's payoff and one clear RSVP action, which is what fills seats. Logistics come last.",
    "prompt": ("You are my event marketing assistant. Write an event invitation email.\n\n"
               "Context:\n"
               "- Event: [name, format: webinar / dinner / workshop]\n"
               "- Audience: [who it is for]\n"
               "- The takeaway: [what attendees will leave with]\n"
               "- Speaker / hook (optional): [name or draw]\n"
               "- Details: [date, time, duration, location or link]\n"
               "- Action: [register / RSVP]\n\n"
               "Rules:\n"
               "- Lead with the takeaway and who it is for, not the agenda.\n"
               "- Under 140 words, one clear RSVP CTA, logistics at the end.\n"
               "- 1-line subject under 7 words. Do not use em dashes.\n\n"
               "Write the invitation."),
    "prompt_outro": "Sell the takeaway, then the logistics. For webinars specifically, pair this with <a href=\"/how-to-write-webinar-promotion-with-claude\">webinar promotion with Claude</a>.",
    "workflow": _workflow("event details, audience, and your brand voice", "two versions, one takeaway-led and one curiosity-led"),
    "example": "For a workshop, put the takeaway ('leave with a finished 90-day GTM plan') in the brackets. Claude opens with that outcome and who it is for, then states the date and RSVP link, rather than burying the value under a time-and-place announcement.",
    "avoid": AVOID,
    "faqs": [
        ("What should an event invitation lead with?", "The takeaway: what the attendee will leave with. Give Claude that plus the audience and the template here builds the invite around it, with logistics at the end."),
        ("Can Claude write a full event promotion sequence?", "Yes. Ask for an invite, a reminder, and a last-call email. It keeps the message consistent and escalates urgency appropriately."),
        ("How do I boost RSVPs with AI?", "Prompt Claude to lead with the outcome, keep one CTA, and write a short curiosity-driven subject. Test two subject lines it generates."),
        ("Does this work for in-person events?", "Yes. Change the format and details fields. For dinners or workshops, lean on exclusivity and the takeaway; the structure is the same."),
    ],
    "related": [
        ("how-to-write-webinar-promotion-with-claude", "Webinar promotion with Claude", "Fill seats for online events."),
        ("how-to-write-product-launch-emails-with-claude", "Product launch emails with Claude", "Benefit-led launch copy."),
        R_PROMPTS, R_MKT,
    ],
}

HOWTOS["how-to-write-internal-newsletters-with-claude"] = {
    "title": "How to Write Internal Newsletters with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for writing internal company newsletters with Claude, including a copy-paste prompt template that turns updates into a scannable, readable digest, plus pitfalls to avoid.",
    "og_title": "How to Write Internal Newsletters with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template for internal newsletters people actually read.",
    "crumb": "How to Write Internal Newsletters with Claude",
    "howto_name": "How to Write Internal Newsletters with Claude",
    "h1": "How to write internal newsletters with Claude: <em>step-by-step.</em>",
    "hero_sub": "Internal newsletters get ignored when they are a wall of updates. This playbook gives you a prompt template that turns raw notes into a scannable digest people open.",
    "verdict": "Dump your raw updates into Claude with the audience and the one thing you want remembered, and ask for a scannable, human digest. You get an internal newsletter drafted in minutes that people actually read.",
    "prompt_intro": "This template takes messy inputs (Slack threads, notes, wins) and structures them into a readable digest led by what matters most.",
    "prompt": ("You are my internal comms assistant. Write a company newsletter.\n\n"
               "Context:\n"
               "- Audience: [whole company / department]\n"
               "- Raw updates: [paste notes, wins, metrics, announcements]\n"
               "- The headline: [the one thing everyone should remember]\n"
               "- Tone: [our culture: candid / upbeat / plainspoken]\n\n"
               "Rules:\n"
               "- Lead with the headline, then short scannable sections with clear headers.\n"
               "- Translate jargon to plain language, cut filler.\n"
               "- Celebrate people by name where given. Keep it under 350 words.\n"
               "- Do not use em dashes.\n\n"
               "Write the newsletter with section headers."),
    "prompt_outro": "Lead with one headline, keep sections short and scannable. For release-specific comms, see <a href=\"/how-to-write-product-update-emails-with-claude\">product update emails with Claude</a>, and for leadership comms, <a href=\"/how-to-write-all-hands-decks-with-claude\">all-hands decks with Claude</a>.",
    "workflow": _workflow("company tone, recurring sections, and past newsletters", "two versions, one tighter and one with more personality"),
    "example": "Paste a jumble of department updates and three wins. Claude opens with the single headline (say, a big customer milestone), organizes the rest under clear headers, names the people behind the wins, and trims the corporate fluff, turning 20 minutes of formatting into a two-minute review.",
    "avoid": AVOID,
    "faqs": [
        ("How do I make an internal newsletter people read?", "Lead with one headline, keep sections short and scannable, and write like a human. Give Claude your raw updates and the template here structures them that way."),
        ("Can Claude turn messy notes into a newsletter?", "Yes. Paste Slack threads, metrics, and wins into the prompt and it organizes them into a clean digest led by what matters most."),
        ("How long should an internal newsletter be?", "Short enough to read in two minutes, usually under 350 words. Prompt Claude to cap the length and cut filler."),
        ("How do I keep our culture in the writing?", "Set up a Claude Project with past newsletters and a note on your tone. Claude matches the pattern, and you do a light edit."),
    ],
    "related": [
        ("how-to-write-all-hands-decks-with-claude", "All-hands decks with Claude", "Leadership updates that land."),
        ("how-to-write-product-update-emails-with-claude", "Product update emails with Claude", "Benefit-led release comms."),
        R_PROMPTS, R_USE,
    ],
}

HOWTOS["how-to-write-blog-headlines-with-claude"] = {
    "title": "How to Write Blog Headlines with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for writing blog headlines with Claude, including a copy-paste prompt template that generates and ranks headline options, the workflow, and pitfalls to avoid.",
    "og_title": "How to Write Blog Headlines with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template that generates and ranks blog headline options.",
    "crumb": "How to Write Blog Headlines with Claude",
    "howto_name": "How to Write Blog Headlines with Claude",
    "h1": "How to write blog headlines with Claude: <em>step-by-step.</em>",
    "hero_sub": "The headline decides whether the rest of the post gets read. This playbook gives you a prompt template that generates a range of angles and ranks them.",
    "verdict": "Give Claude the article's core idea, the reader, and the search intent, then ask for 10 headlines across distinct angles plus a ranking. You get a strong shortlist in seconds instead of staring at a blank title field.",
    "prompt_intro": "This template generates variety on purpose (clarity, curiosity, how-to, contrarian, number-led) so you can pick the angle that fits, then refine.",
    "prompt": ("You are my headline strategist. Generate blog headlines.\n\n"
               "Context:\n"
               "- Article core idea: [one sentence]\n"
               "- Reader: [who they are and what they want]\n"
               "- Target keyword / search intent: [keyword]\n"
               "- Tone: [practical / bold / authoritative]\n\n"
               "Rules:\n"
               "- Give 10 headlines across DIFFERENT angles: clear, curiosity, how-to,\n"
               "  contrarian, number-led, outcome-led.\n"
               "- Each under 65 characters, no clickbait you cannot back up.\n"
               "- Then rank your top 3 and say why. Do not use em dashes.\n\n"
               "Generate the headlines."),
    "prompt_outro": "Asking for distinct angles plus a ranking beats asking for 'good headlines.' For the rest of the writing process, see <a href=\"/how-to-use-claude-for-marketing\">how to use Claude for marketing</a>.",
    "workflow": _workflow("brand voice, target keywords, and high-performing past headlines", "10 options across angles, then a ranked top 3"),
    "example": "For a post on cutting CAC, Claude returns a clear version, a curiosity version, a number-led version ('7 ways...'), and a contrarian one ('Stop optimizing CAC'), then ranks the top three for your reader and intent, so you choose from strong options rather than inventing one cold.",
    "avoid": AVOID,
    "faqs": [
        ("What is the best prompt for blog headlines?", "One that gives Claude the core idea, the reader, and the search intent, then asks for 10 headlines across distinct angles plus a ranked top three. Use the template here."),
        ("How many headline options should I generate?", "Ask for 10 across different angles, then have Claude rank the top three. Variety is the point; a single 'best' headline misses better angles."),
        ("Can Claude optimize headlines for SEO?", "It can work your target keyword in naturally and keep length in range. Give it the keyword and intent, and verify search volume separately."),
        ("Should I A/B test the headlines?", "When you can, yes. Take Claude's top two and test them. Even without testing, the ranked shortlist beats a first-instinct title."),
    ],
    "related": [
        ("how-to-write-linkedin-articles-with-claude", "LinkedIn articles with Claude", "Long-form posts that build authority."),
        ("how-to-write-meta-descriptions-with-claude", "Meta descriptions with Claude", "Click-worthy snippets for search."),
        R_PROMPTS, R_MKT,
    ],
}

# ---------------------------------------------------------------------------
# BATCH B2: content, decks, research, analysis
# ---------------------------------------------------------------------------

AVOID_G = [
    "Vague prompts. 'Help me write this' produces generic output. Specifics in, specifics out.",
    "Publishing or sharing without editing. Always do the final human pass for voice, facts, and judgment.",
    "Skipping the Project setup, which forces you to re-paste context every single time.",
    "Treating Claude as a vending machine instead of a thinking partner you iterate with.",
]

HOWTOS["how-to-write-linkedin-articles-with-claude"] = {
    "title": "How to Write LinkedIn Articles with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for writing LinkedIn articles with Claude, including a copy-paste prompt template built around a single point of view, the workflow, and pitfalls to avoid.",
    "og_title": "How to Write LinkedIn Articles with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template for LinkedIn articles that build authority, not noise.",
    "crumb": "How to Write LinkedIn Articles with Claude",
    "howto_name": "How to Write LinkedIn Articles with Claude",
    "h1": "How to write LinkedIn articles with Claude: <em>step-by-step.</em>",
    "hero_sub": "A LinkedIn article earns attention with one sharp point of view, not a summary of everything. This playbook gives you a prompt template that builds the piece around your argument.",
    "verdict": "Give Claude your single point of view, the audience, and a real example or story, then ask for a structured article with a strong hook. You get a draft that sounds like you and makes one argument well, in minutes.",
    "prompt_intro": "This template forces a single thesis and a strong opening, the two things most LinkedIn articles lack. Feed it your take and supporting story.",
    "prompt": ("You are my thought-leadership writing partner. Draft a LinkedIn article.\n\n"
               "Context:\n"
               "- My point of view (one sentence): [your argument]\n"
               "- Audience: [who I want to reach]\n"
               "- Supporting story or example: [a real moment or data point]\n"
               "- What I want readers to do or think after: [takeaway]\n"
               "- My voice: [plainspoken / bold / analytical]\n\n"
               "Rules:\n"
               "- Open with a 1-2 line hook that earns the next sentence.\n"
               "- Make ONE argument; cut anything that does not serve it.\n"
               "- 600-900 words, short paragraphs, no buzzwords, no listicle filler.\n"
               "- End with a question or a clear takeaway. Do not use em dashes.\n\n"
               "Draft the article."),
    "prompt_outro": "One argument, one story, one takeaway beats a survey of the topic. For shorter formats, see <a href=\"/how-to-write-twitter-threads-with-claude\">Twitter threads with Claude</a>, and for titles, <a href=\"/how-to-write-blog-headlines-with-claude\">blog headlines with Claude</a>.",
    "workflow": _workflow("your point of view, past posts, and voice", "two versions, one bolder and one more analytical"),
    "example": "Start with a one-line take like 'most GTM dashboards measure the wrong thing' plus a story from your own work. Claude opens with a hook, builds the argument around your story, and lands a takeaway, giving you a draft that reads as your opinion rather than a generic explainer.",
    "avoid": AVOID_G,
    "faqs": [
        ("What is the best prompt for a LinkedIn article?", "One that gives Claude a single point of view, the audience, a real supporting story, and a takeaway, then asks for one tight argument with a strong hook. Use the template here."),
        ("How do I keep my voice in AI-written articles?", "Set up a Claude Project with your past posts and a note on your voice, and prompt for one argument. Then edit. The thinking and final polish stay yours."),
        ("How long should a LinkedIn article be?", "Usually 600 to 900 words with short paragraphs. Prompt Claude to cap the length and cut anything that does not serve the single argument."),
        ("Will readers know it was AI-assisted?", "Not if you bring the point of view and story and edit the result. Generic AI output is obvious; a well-prompted, edited piece built on your real take is not."),
    ],
    "related": [
        ("how-to-write-twitter-threads-with-claude", "Twitter threads with Claude", "Short-form posts that travel."),
        ("how-to-write-blog-headlines-with-claude", "Blog headlines with Claude", "Titles that earn the click."),
        R_PROMPTS, R_MKT,
    ],
}

HOWTOS["how-to-write-twitter-threads-with-claude"] = {
    "title": "How to Write Twitter/X Threads with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for writing Twitter/X threads with Claude, including a copy-paste prompt template for a hook-driven thread, the workflow, and pitfalls to avoid.",
    "og_title": "How to Write Twitter/X Threads with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template for threads with a hook that earns the next tap.",
    "crumb": "How to Write Twitter/X Threads with Claude",
    "howto_name": "How to Write Twitter and X Threads with Claude",
    "h1": "How to write Twitter/X threads with Claude: <em>step-by-step.</em>",
    "hero_sub": "A thread lives or dies on the first tweet. This playbook gives you a prompt template that nails the hook and keeps every line earning the next tap.",
    "verdict": "Give Claude the one idea, the audience, and your proof, then ask for a hook plus 6 to 9 tight tweets that each advance the point. You get a scroll-stopping thread draft you can refine in minutes.",
    "prompt_intro": "This template treats the first tweet as the whole job and structures the rest as one idea per line. Give it your single insight.",
    "prompt": ("You are my short-form social writer. Write a Twitter/X thread.\n\n"
               "Context:\n"
               "- The one idea: [single insight or lesson]\n"
               "- Audience: [who should care]\n"
               "- Proof or story: [data, example, experience]\n"
               "- Goal: [followers / clicks / replies]\n\n"
               "Rules:\n"
               "- Tweet 1 is a HOOK: specific, curiosity or stakes, no setup.\n"
               "- 6-9 tweets, one idea each, under 270 characters, plain language.\n"
               "- No threads-about-threads, no fluff, no hashtag spam.\n"
               "- Last tweet: a takeaway and one soft CTA. Do not use em dashes.\n\n"
               "Write the thread, numbered."),
    "prompt_outro": "If tweet 1 does not stop the scroll, nothing else matters. For long-form versions of the same ideas, see <a href=\"/how-to-write-linkedin-articles-with-claude\">LinkedIn articles with Claude</a>.",
    "workflow": _workflow("your niche, voice, and a few threads that worked", "three different hook options for tweet 1"),
    "example": "Give Claude one lesson ('we cut churn 30 percent by fixing onboarding, not the product') and a couple of specifics. It writes a sharp hook, then a tweet per step of the story, ending on a takeaway, so you start from a strong draft instead of a blank composer.",
    "avoid": AVOID_G,
    "faqs": [
        ("What is the best prompt for a Twitter thread?", "One that gives Claude a single idea, the audience, and proof, then demands a real hook and one idea per tweet. Ask for a few hook options. Use the template here."),
        ("How long should a thread be?", "Usually 6 to 9 tweets. Long enough to deliver the idea, short enough to finish. Prompt Claude to cut anything that does not advance the point."),
        ("How do I write a better hook?", "Ask Claude for three hook variants for tweet 1, each specific and stakes-driven with no setup, then pick the strongest. The hook is most of the result."),
        ("Can Claude repurpose a blog post into a thread?", "Yes. Paste the post and ask for a thread that pulls the single best idea, not a summary. One idea per thread travels further than a recap."),
    ],
    "related": [
        ("how-to-write-linkedin-articles-with-claude", "LinkedIn articles with Claude", "Long-form authority posts."),
        ("how-to-write-podcast-show-notes-with-claude", "Podcast show notes with Claude", "Turn audio into shareable text."),
        R_PROMPTS, R_MKT,
    ],
}

HOWTOS["how-to-write-meta-descriptions-with-claude"] = {
    "title": "How to Write Meta Descriptions with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for writing SEO meta descriptions with Claude, including a copy-paste prompt template that hits length, keyword, and click appeal, plus pitfalls to avoid.",
    "og_title": "How to Write Meta Descriptions with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template for meta descriptions that fit and earn the click.",
    "crumb": "How to Write Meta Descriptions with Claude",
    "howto_name": "How to Write Meta Descriptions with Claude",
    "h1": "How to write meta descriptions with Claude: <em>step-by-step.</em>",
    "hero_sub": "A meta description is a 155-character ad for your page. This playbook gives you a prompt template that hits the length, works the keyword in, and earns the click.",
    "verdict": "Give Claude the page topic, the target keyword, and the searcher's intent, then ask for three meta descriptions under 155 characters with a clear benefit and soft CTA. You get options that fit and convert.",
    "prompt_intro": "This template enforces the constraints search engines and searchers care about: length, keyword, benefit, and a reason to click. Run it per page.",
    "prompt": ("You are my SEO copywriter. Write meta descriptions.\n\n"
               "Context:\n"
               "- Page topic: [what the page is about]\n"
               "- Target keyword: [primary keyword]\n"
               "- Searcher intent: [what they want to find or do]\n"
               "- Brand: [name, if it should appear]\n\n"
               "Rules:\n"
               "- 3 options, each 150-155 characters MAX (count them).\n"
               "- Work the keyword in naturally, lead with the benefit.\n"
               "- Active voice, one soft call to action, no clickbait.\n"
               "- Do not use em dashes.\n\n"
               "Write 3 meta descriptions and note the character count of each."),
    "prompt_outro": "Asking Claude to count characters keeps you inside the truncation limit. Pair this with <a href=\"/how-to-write-blog-headlines-with-claude\">blog headlines with Claude</a> so the title and snippet work together.",
    "workflow": _workflow("target keywords, page topics, and brand naming rules", "three options with character counts"),
    "example": "For a page on fractional CMO cost, give Claude the keyword and intent. It returns three 155-character options that lead with the benefit ('See 2026 fractional CMO pricing...'), include the keyword, and end with a soft CTA, with counts so you can paste the one that fits.",
    "avoid": AVOID_G,
    "faqs": [
        ("How long should a meta description be?", "Aim for 150 to 155 characters so it does not truncate in search results. Ask Claude to count characters and stay under the limit, as the template here does."),
        ("Does the keyword have to be in the meta description?", "It helps, because search engines bold matching terms, which improves click-through. Prompt Claude to work the keyword in naturally rather than stuffing it."),
        ("Can Claude write meta descriptions in bulk?", "Yes. Paste a list of page topics and keywords and ask for one option each at the right length. Review them before publishing."),
        ("Do meta descriptions affect rankings?", "Not directly, but they affect click-through rate, which matters. A clear, benefit-led description earns more clicks from the same ranking."),
    ],
    "related": [
        ("how-to-write-blog-headlines-with-claude", "Blog headlines with Claude", "Titles that earn the click."),
        ("how-to-write-help-center-articles-with-claude", "Help center articles with Claude", "Clear docs that deflect tickets."),
        R_PROMPTS, R_MKT,
    ],
}

HOWTOS["how-to-write-webinar-promotion-with-claude"] = {
    "title": "How to Write Webinar Promotion with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for writing webinar promotion with Claude, including a copy-paste prompt template for a full promo sequence built on the attendee takeaway, plus pitfalls to avoid.",
    "og_title": "How to Write Webinar Promotion with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template for a webinar promo sequence that fills seats.",
    "crumb": "How to Write Webinar Promotion with Claude",
    "howto_name": "How to Write Webinar Promotion with Claude",
    "h1": "How to write webinar promotion with Claude: <em>step-by-step.</em>",
    "hero_sub": "Registrations come from the promise of a takeaway, repeated across enough touches. This playbook gives you a prompt template for a full promo sequence.",
    "verdict": "Give Claude the webinar topic, the takeaway, and the audience, then ask for a promo sequence (invite, reminders, last call) plus social copy, all built around the payoff. You get a complete promotion kit in minutes.",
    "prompt_intro": "This template produces the whole campaign, not one email, with each touch escalating urgency while keeping the takeaway front and center.",
    "prompt": ("You are my webinar marketing assistant. Write a promotion kit.\n\n"
               "Context:\n"
               "- Webinar: [title, date, time, duration]\n"
               "- Audience: [who it is for]\n"
               "- The takeaway: [what attendees will leave able to do]\n"
               "- Speaker / hook: [name or draw]\n"
               "- Register link CTA: [register]\n\n"
               "Rules:\n"
               "- Produce: 1 invite email, 2 reminder emails (3 days and 1 hour before),\n"
               "  1 last-call email, and 3 social posts.\n"
               "- Every piece leads with the takeaway, one CTA, no hype.\n"
               "- Escalate urgency across the sequence. Do not use em dashes.\n\n"
               "Write the full kit, labeled."),
    "prompt_outro": "One prompt, a full campaign. For the standalone invite, see <a href=\"/how-to-write-event-invitations-with-claude\">event invitations with Claude</a>.",
    "workflow": _workflow("webinar details, audience, and brand voice", "a full sequence plus social, then refine the invite"),
    "example": "Give Claude a webinar title, the takeaway ('build a 90-day AI adoption plan live'), and the date. It returns an invite, two reminders, a last-call email, and three social posts, each leading with the takeaway and escalating urgency, so you launch the whole campaign from one prompt.",
    "avoid": AVOID_G,
    "faqs": [
        ("How many emails should webinar promotion include?", "Typically an invite, one or two reminders, and a last-call email, plus social. Ask Claude for the full sequence with the right timing, as the template here does."),
        ("What should webinar promo emails lead with?", "The takeaway: what attendees will leave able to do. Give Claude that and it builds every touch around it, with logistics secondary."),
        ("Can Claude write the social posts too?", "Yes. The prompt here produces social copy alongside the emails so the message stays consistent across channels. Edit each for platform fit."),
        ("How do I boost webinar attendance, not just sign-ups?", "Ask Claude for the day-of and one-hour-before reminders that restate the takeaway. Show-up rate improves when the value is reinforced close to the event."),
    ],
    "related": [
        ("how-to-write-event-invitations-with-claude", "Event invitations with Claude", "Invites that sell the takeaway."),
        ("how-to-write-product-launch-emails-with-claude", "Product launch emails with Claude", "Benefit-led launch copy."),
        R_PROMPTS, R_MKT,
    ],
}

HOWTOS["how-to-write-all-hands-decks-with-claude"] = {
    "title": "How to Write All-Hands Decks with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for building all-hands and leadership decks with Claude, including a copy-paste prompt template that structures a narrative arc, plus pitfalls to avoid.",
    "og_title": "How to Write All-Hands Decks with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template for all-hands decks with a real narrative arc.",
    "crumb": "How to Write All-Hands Decks with Claude",
    "howto_name": "How to Write All-Hands Decks with Claude",
    "h1": "How to write all-hands decks with Claude: <em>step-by-step.</em>",
    "hero_sub": "An all-hands deck should tell one story, not dump every team's update. This playbook gives you a prompt template that structures a clear narrative arc.",
    "verdict": "Give Claude the meeting's one message, the updates, and the audience, then ask for a slide-by-slide outline with a narrative arc and speaker notes. You get a structured deck outline to build from, in minutes.",
    "prompt_intro": "This template turns raw updates into a story: where we are, what changed, what is next, what we need from you. Paste your inputs.",
    "prompt": ("You are my internal comms and presentation partner. Outline an all-hands deck.\n\n"
               "Context:\n"
               "- The ONE message of this all-hands: [the thing everyone should leave with]\n"
               "- Key updates: [paste metrics, wins, changes, challenges]\n"
               "- Audience: [whole company / size / context]\n"
               "- Tone: [candid / rallying / steady]\n\n"
               "Rules:\n"
               "- Structure a narrative arc: where we are, what changed, what is next, the ask.\n"
               "- One idea per slide, a clear title sentence, 2-4 bullets, and a speaker note.\n"
               "- 8-12 slides. Lead and close on the ONE message.\n"
               "- Do not use em dashes.\n\n"
               "Output a slide-by-slide outline."),
    "prompt_outro": "The arc is the point: a deck that argues one message beats a stack of team updates. For the written version, see <a href=\"/how-to-write-internal-newsletters-with-claude\">internal newsletters with Claude</a>.",
    "workflow": _workflow("company metrics, prior decks, and your leadership voice", "two outline options with different narrative framings"),
    "example": "Drop in the one message ('we are doubling down on retention this quarter') and your metrics. Claude returns a slide-by-slide outline that opens on that message, walks the arc, gives each slide a title sentence and speaker note, and closes on the ask, so you build slides instead of structuring from scratch.",
    "avoid": AVOID_G,
    "faqs": [
        ("How do I structure an all-hands deck?", "Around one message, with a narrative arc: where we are, what changed, what is next, the ask. Give Claude your updates and the template here builds that arc."),
        ("Can Claude write speaker notes?", "Yes. The prompt asks for a speaker note per slide so you have talking points, not just bullets. Edit them into your own voice."),
        ("How many slides should an all-hands have?", "Usually 8 to 12. Prompt Claude to keep one idea per slide and cut anything that does not serve the single message."),
        ("Does Claude build the actual slides?", "It builds the outline, titles, bullets, and notes. You drop that into your slide tool. The thinking and structure are the slow part, and that is what it handles."),
    ],
    "related": [
        ("how-to-write-internal-newsletters-with-claude", "Internal newsletters with Claude", "Written updates that land."),
        ("how-to-draft-investor-pitch-decks-with-claude", "Investor pitch decks with Claude", "A fundable narrative arc."),
        R_PROMPTS, R_USE,
    ],
}

HOWTOS["how-to-write-podcast-show-notes-with-claude"] = {
    "title": "How to Write Podcast Show Notes with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for writing podcast show notes with Claude, including a copy-paste prompt template that turns a transcript into summary, timestamps, and pull quotes, plus pitfalls to avoid.",
    "og_title": "How to Write Podcast Show Notes with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template that turns a transcript into complete show notes.",
    "crumb": "How to Write Podcast Show Notes with Claude",
    "howto_name": "How to Write Podcast Show Notes with Claude",
    "h1": "How to write podcast show notes with Claude: <em>step-by-step.</em>",
    "hero_sub": "Good show notes make an episode searchable and shareable. This playbook gives you a prompt template that turns a transcript into a summary, timestamps, and pull quotes.",
    "verdict": "Paste the transcript and tell Claude the show and audience, then ask for a summary, key takeaways, timestamped topics, and pull quotes. You get complete, SEO-friendly show notes from raw audio in minutes.",
    "prompt_intro": "This template does the tedious part: reading the whole transcript and extracting structure. Paste your transcript into the brackets.",
    "prompt": ("You are my podcast producer. Write show notes from this transcript.\n\n"
               "Context:\n"
               "- Show and episode: [name, guest, topic]\n"
               "- Audience: [who listens]\n"
               "- Transcript: [paste full transcript]\n\n"
               "Produce:\n"
               "- A 2-3 sentence episode summary (SEO-friendly, keyword-aware).\n"
               "- 5-7 key takeaways as short bullets.\n"
               "- Timestamped topic list (approximate from the transcript order).\n"
               "- 3 pull quotes worth sharing on social.\n"
               "- A 1-line title option.\n\n"
               "Rules: faithful to the transcript, no invented claims. Do not use em dashes."),
    "prompt_outro": "The 'no invented claims' rule matters: keep show notes faithful to what was actually said. Turn the pull quotes into <a href=\"/how-to-write-twitter-threads-with-claude\">Twitter threads with Claude</a> for distribution.",
    "workflow": _workflow("show name, audience, and a sample of past notes for format", "the full notes, then tighten the summary and quotes"),
    "example": "Paste a 45-minute interview transcript. Claude returns a tight summary, seven takeaways, a timestamped topic list, and three shareable quotes, turning an hour of manual note-writing into a five-minute review-and-edit.",
    "avoid": AVOID_G,
    "faqs": [
        ("Can Claude write show notes from a transcript?", "Yes. Paste the transcript and it produces a summary, takeaways, timestamps, and pull quotes. Keep it faithful to the transcript and review before publishing, as the template here specifies."),
        ("How do I make show notes SEO-friendly?", "Ask Claude for a keyword-aware summary and a clear title. The summary and topic list give search engines text to index from an otherwise audio-only episode."),
        ("Can Claude generate social clips from an episode?", "It can pull the most shareable quotes and turn them into posts or a thread. The audio or video clipping is separate, but the copy comes from the same transcript."),
        ("Will the timestamps be accurate?", "They approximate from transcript order. If your transcript has real timestamps, include them and Claude will use them. Otherwise spot-check before publishing."),
    ],
    "related": [
        ("how-to-write-twitter-threads-with-claude", "Twitter threads with Claude", "Turn quotes into shareable posts."),
        ("how-to-analyze-call-recordings-with-claude", "Analyze call recordings with Claude", "Extract insight from transcripts."),
        R_PROMPTS, R_MKT,
    ],
}

HOWTOS["how-to-write-help-center-articles-with-claude"] = {
    "title": "How to Write Help Center Articles with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for writing help center and support articles with Claude, including a copy-paste prompt template structured for task completion, plus pitfalls to avoid.",
    "og_title": "How to Write Help Center Articles with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template for support docs that actually deflect tickets.",
    "crumb": "How to Write Help Center Articles with Claude",
    "howto_name": "How to Write Help Center Articles with Claude",
    "h1": "How to write help center articles with Claude: <em>step-by-step.</em>",
    "hero_sub": "A good help article gets one job done fast. This playbook gives you a prompt template structured for task completion, so articles deflect tickets instead of creating them.",
    "verdict": "Give Claude the task the user is trying to complete, the steps, and common pitfalls, then ask for a scannable article with numbered steps and a troubleshooting section. You get clear support docs that reduce tickets.",
    "prompt_intro": "This template structures the article the way users read help docs: task first, numbered steps, then edge cases. Give it the workflow.",
    "prompt": ("You are my support documentation writer. Write a help center article.\n\n"
               "Context:\n"
               "- Task the user wants to complete: [the job]\n"
               "- Product / feature: [name]\n"
               "- The steps: [paste the actual steps]\n"
               "- Common mistakes or edge cases: [list]\n"
               "- Audience skill level: [new user / admin]\n\n"
               "Rules:\n"
               "- Start with a 1-line statement of what this article helps them do.\n"
               "- Numbered steps, one action each, plain language, no jargon.\n"
               "- Add a short 'Troubleshooting' section for the edge cases.\n"
               "- Scannable headers, no marketing. Do not use em dashes.\n\n"
               "Write the article."),
    "prompt_outro": "Task-first structure is what makes a help article deflect a ticket. For public-facing SEO snippets, see <a href=\"/how-to-write-meta-descriptions-with-claude\">meta descriptions with Claude</a>.",
    "workflow": _workflow("product steps, common tickets, and your docs style guide", "a draft, then a tightened version with clearer steps"),
    "example": "Paste the real steps to set up a feature plus the three most common support tickets about it. Claude writes a task-first article with numbered steps and a troubleshooting section addressing those exact tickets, turning your top support questions into self-serve docs.",
    "avoid": AVOID_G,
    "faqs": [
        ("How do I write help articles that reduce tickets?", "Structure them around the user's task: a one-line purpose, numbered steps, and a troubleshooting section for common issues. Give Claude the steps and the template here does this."),
        ("Can Claude turn support tickets into help articles?", "Yes. Paste recurring tickets and the resolution steps, and it produces a self-serve article that addresses those exact issues. Review for accuracy before publishing."),
        ("How technical should help articles be?", "Match the audience. Tell Claude whether readers are new users or admins, and it adjusts the language. Keep jargon out for end users."),
        ("Should help articles include screenshots?", "Yes, but Claude writes the text and step structure; you add the visuals. The clear, numbered structure is what makes the screenshots useful."),
    ],
    "related": [
        ("how-to-write-customer-success-emails-with-claude", "Customer success emails with Claude", "Proactive CS communication."),
        ("how-to-write-meta-descriptions-with-claude", "Meta descriptions with Claude", "Snippets that earn the click."),
        R_PROMPTS, R_USE,
    ],
}

HOWTOS["how-to-design-customer-research-studies-with-claude"] = {
    "title": "How to Design Customer Research Studies with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for designing customer research studies with Claude, including a copy-paste prompt template for objectives, methods, and unbiased questions, plus pitfalls to avoid.",
    "og_title": "How to Design Customer Research Studies with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template for research plans with unbiased questions.",
    "crumb": "How to Design Customer Research Studies with Claude",
    "howto_name": "How to Design Customer Research Studies with Claude",
    "h1": "How to design customer research studies with Claude: <em>step-by-step.</em>",
    "hero_sub": "Good research starts with the right questions, asked without bias. This playbook gives you a prompt template that turns a decision into a sound study design.",
    "verdict": "Tell Claude the decision you need to inform, who you can talk to, and your constraints, then ask for objectives, the right method, and an unbiased question guide. You get a defensible research plan, fast.",
    "prompt_intro": "This template starts from the decision (not the questions), which is what keeps research useful, then drafts a non-leading interview or survey guide.",
    "prompt": ("You are my UX and customer research partner. Design a research study.\n\n"
               "Context:\n"
               "- Decision this research will inform: [the choice you face]\n"
               "- What we think we know / assumptions: [hypotheses]\n"
               "- Who we can reach: [segment, sample size, access]\n"
               "- Constraints: [time, budget, qual vs quant]\n\n"
               "Produce:\n"
               "- 3-5 clear research objectives tied to the decision.\n"
               "- The recommended method and why (interviews, survey, usability test).\n"
               "- A question guide with NON-LEADING, open questions.\n"
               "- What a good vs misleading result would look like.\n\n"
               "Rules: flag any leading questions and rewrite them. Do not use em dashes."),
    "prompt_outro": "Designing from the decision and screening for leading questions is what separates research that informs from research that confirms your bias. For applying findings, see <a href=\"/how-to-use-ai-in-your-business\">how to use AI in your business</a>.",
    "workflow": _workflow("the decision at hand, your assumptions, and prior research", "the plan, then a pass that hunts for leading questions"),
    "example": "Say you are deciding whether to build a feature. Tell Claude the decision and your assumptions, and it returns objectives, recommends interviews over a survey, drafts open and non-leading questions, and flags any that lead the witness, giving you a study that tests your assumption rather than confirming it.",
    "avoid": AVOID_G,
    "faqs": [
        ("Can Claude design a customer research study?", "Yes. Give it the decision, your assumptions, and constraints, and it produces objectives, a recommended method, and a non-leading question guide. Use the template here."),
        ("How does AI help avoid biased research questions?", "Ask Claude to flag and rewrite leading questions. It is good at spotting questions that presume an answer, which is one of the most common research mistakes."),
        ("Should research start with questions or the decision?", "The decision. Prompt Claude to tie every objective to the choice you face, so you gather what you will actually act on, not interesting trivia."),
        ("Can Claude analyze the results too?", "Yes, once you have transcripts or survey data. Paste them and ask for themes and counter-evidence. See analyzing call recordings with Claude for the interview side."),
    ],
    "related": [
        ("how-to-analyze-call-recordings-with-claude", "Analyze call recordings with Claude", "Turn interviews into themes."),
        ("how-to-draft-investor-pitch-decks-with-claude", "Investor pitch decks with Claude", "Evidence-backed narrative."),
        R_PROMPTS, R_USE,
    ],
}

HOWTOS["how-to-draft-investor-pitch-decks-with-claude"] = {
    "title": "How to Draft Investor Pitch Decks with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for drafting investor pitch decks with Claude, including a copy-paste prompt template that structures a fundable narrative, plus pitfalls to avoid.",
    "og_title": "How to Draft Investor Pitch Decks with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template for a pitch-deck narrative investors follow.",
    "crumb": "How to Draft Investor Pitch Decks with Claude",
    "howto_name": "How to Draft Investor Pitch Decks with Claude",
    "h1": "How to draft investor pitch decks with Claude: <em>step-by-step.</em>",
    "hero_sub": "Investors fund a story with evidence, not a feature list. This playbook gives you a prompt template that structures the standard pitch arc around your specifics.",
    "verdict": "Give Claude your problem, solution, traction, and the raise, then ask for a slide-by-slide narrative following the proven pitch arc. You get a structured first-draft deck you can sharpen with real numbers.",
    "prompt_intro": "This template follows the arc investors expect (problem, solution, why now, market, traction, model, team, ask) and prompts you for the evidence each slide needs.",
    "prompt": ("You are my pitch advisor. Outline an investor pitch deck.\n\n"
               "Context:\n"
               "- Company: [one-line description]\n"
               "- Problem: [who hurts and how much]\n"
               "- Solution: [what you do, why it is different]\n"
               "- Why now: [the shift that makes this the moment]\n"
               "- Traction: [revenue, growth, customers, metrics]\n"
               "- Market: [TAM/SAM logic]\n"
               "- Business model: [how you make money]\n"
               "- Team: [why you]\n"
               "- The raise: [amount, use of funds]\n\n"
               "Rules:\n"
               "- Slide-by-slide: one message per slide, a title sentence, key points,\n"
               "  and the evidence/number each slide needs.\n"
               "- Flag any slide where my input is thin or unconvincing.\n"
               "- 10-12 slides. Do not use em dashes.\n\n"
               "Outline the deck."),
    "prompt_outro": "The most useful part is Claude flagging weak slides before an investor does. Build the verbal version with <a href=\"/how-to-write-all-hands-decks-with-claude\">all-hands decks with Claude</a> techniques, and back claims with <a href=\"/how-to-design-customer-research-studies-with-claude\">customer research</a>.",
    "workflow": _workflow("your metrics, prior decks, and the round you are raising", "the outline, then a pass flagging weak or unproven slides"),
    "example": "Fill in your traction and market logic. Claude returns a 10-slide outline following the standard arc, tells you which slides need a harder number (often 'why now' and market sizing), and drafts a title sentence per slide, so you refine evidence rather than invent structure.",
    "avoid": [
        "Letting Claude invent numbers. Give it your real metrics; never present fabricated traction.",
        "Sharing confidential figures with consumer AI tools. Use appropriate accounts and judgment.",
        "Accepting the first outline. The value is in the flagged weak slides and your revisions.",
        "Treating the deck as the pitch. The deck supports your story; it does not replace your judgment.",
    ],
    "faqs": [
        ("Can Claude write my pitch deck?", "It drafts the narrative and structure from your inputs and flags weak slides. You supply the real numbers and make the final calls. Never present figures Claude invented."),
        ("What pitch deck structure does Claude use?", "The proven arc: problem, solution, why now, market, traction, model, team, ask. The template here prompts you for the evidence each slide needs."),
        ("Is it safe to use AI for a confidential pitch?", "Use appropriate accounts and judgment with sensitive financials. Many founders draft structure and narrative with AI and keep the most confidential numbers out of consumer tools."),
        ("How does Claude improve a deck?", "Its best move is flagging slides where your input is thin or unconvincing, so you fix them before an investor pokes holes. That pre-mortem is worth more than the prose."),
    ],
    "related": [
        ("how-to-write-all-hands-decks-with-claude", "All-hands decks with Claude", "Narrative-driven decks."),
        ("how-to-design-customer-research-studies-with-claude", "Customer research with Claude", "Evidence to back your claims."),
        R_PROMPTS, R_USE,
    ],
}

HOWTOS["how-to-analyze-call-recordings-with-claude"] = {
    "title": "How to Analyze Call Recordings with Claude (2026 Playbook) | Treetop",
    "desc": "A step-by-step playbook for analyzing sales and customer call recordings with Claude, including a copy-paste prompt template that extracts objections, action items, and themes, plus pitfalls to avoid.",
    "og_title": "How to Analyze Call Recordings with Claude (2026 Playbook)",
    "og_desc": "Copy-paste prompt template that turns call transcripts into insight.",
    "crumb": "How to Analyze Call Recordings with Claude",
    "howto_name": "How to Analyze Call Recordings with Claude",
    "h1": "How to analyze call recordings with Claude: <em>step-by-step.</em>",
    "hero_sub": "Your calls are full of insight that no one has time to mine. This playbook gives you a prompt template that turns a transcript into objections, action items, and themes.",
    "verdict": "Paste a call transcript and tell Claude what you are looking for, then ask for a structured analysis: summary, objections, action items, and notable quotes. You turn a recording into usable insight in minutes, and you can analyze many calls for patterns.",
    "prompt_intro": "This template extracts the structure buried in a transcript. Use it per call, or paste several transcripts and ask for cross-call patterns.",
    "prompt": ("You are my revenue and research analyst. Analyze this call transcript.\n\n"
               "Context:\n"
               "- Call type: [sales discovery / demo / customer interview / support]\n"
               "- What I want to learn: [objections / buying signals / feature requests / churn risk]\n"
               "- Transcript: [paste transcript]\n\n"
               "Produce:\n"
               "- A 3-sentence summary.\n"
               "- Objections or concerns raised, with the exact quote.\n"
               "- Buying signals or risk signals, with quotes.\n"
               "- Action items and follow-ups.\n"
               "- 2-3 notable quotes in the customer's own words.\n\n"
               "Rules: only use what is in the transcript, no inference presented as fact. Do not use em dashes."),
    "prompt_outro": "Quote-backed analysis keeps it honest, and pasting several transcripts surfaces patterns one call cannot. Feed what you learn into <a href=\"/how-to-write-follow-up-emails-with-claude\">follow-up emails</a> and <a href=\"/how-to-design-customer-research-studies-with-claude\">research design</a>.",
    "workflow": [
        ("Get a clean transcript.", "Use your meeting recorder (Fathom, Gong, Otter) to export the transcript. Claude analyzes text, so the transcript is your input."),
        ("Paste the prompt and transcript.", "Tell Claude the call type and exactly what you want to learn. Specific questions get specific, useful answers."),
        ("Ask for quotes, not just summaries.", "Quote-backed findings keep the analysis honest and let you verify. The template requires exact quotes for each point."),
        ("Run it across many calls for patterns.", "Paste several transcripts and ask for the objections and signals that repeat. That cross-call view is where the strategic insight lives."),
        ("Turn insight into action, then save the prompt.", "Route action items to owners and patterns to product or marketing. Save the prompt so every call gets analyzed the same way."),
    ],
    "example": "Paste a discovery-call transcript and ask for objections and buying signals. Claude returns the exact objection quotes, the moments of interest, the action items, and a few customer-voice quotes, turning a 40-minute call into a one-screen brief, and across 20 calls it surfaces the objection you keep losing on.",
    "avoid": [
        "Presenting inference as fact. Require quotes so findings are grounded in what was actually said.",
        "Pasting sensitive recordings into tools without appropriate data agreements and consent.",
        "Analyzing one call and generalizing. Patterns come from many transcripts, not one.",
        "Skipping the human read. Use the analysis to focus your attention, not replace your judgment.",
    ],
    "faqs": [
        ("Can Claude analyze a sales call?", "Yes, from the transcript. Paste it and ask for objections, buying signals, action items, and quotes. The template here keeps every finding tied to an exact quote."),
        ("How do I get a transcript for Claude?", "Export it from your meeting recorder (Fathom, Gong, Otter, or similar). Claude works on the text, so a clean transcript is all you need."),
        ("Can Claude find patterns across many calls?", "Yes, and that is the highest-value use. Paste multiple transcripts and ask for the objections, requests, or risks that repeat across them."),
        ("Is it safe to analyze customer calls with AI?", "Use appropriate data agreements and ensure recording consent. Keep sensitive transcripts in tools with the right privacy terms, not random consumer apps."),
    ],
    "related": [
        ("how-to-design-customer-research-studies-with-claude", "Customer research with Claude", "Design the interviews you analyze."),
        ("how-to-write-follow-up-emails-with-claude", "Follow-up emails with Claude", "Act on what the call revealed."),
        R_PROMPTS, R_USE,
    ],
}
