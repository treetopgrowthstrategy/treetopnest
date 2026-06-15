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
