# -*- coding: utf-8 -*-
"""Content for treetop_claudefor_expander.py. No em/en dashes."""

GUIDES = {}

GUIDES["claude-for-fitness"] = {
    "title": "Claude for Fitness and Wellness Businesses: Practical Guide | Treetop",
    "desc": "Practical guide to using Claude in gyms, studios, and wellness businesses: programming docs, member communications, retention, and social content. The owner-operator workflow.",
    "og_desc": "Programming, member comms, retention, and social. The owner-operator workflow for fitness.",
    "industry_em": "fitness &amp; wellness.",
    "hero_sub": "Independent fitness and wellness owners wear every hat: coach, marketer, ops manager, and front desk. AI does not replace the coaching. It removes the parts of the business that pull you away from coaching. Here is the practical owner-operator workflow.",
    "workflows": [
        ("Program documentation.", "Turn your training philosophy into workout templates, nutrition guides, and member-facing program descriptions, consistently and in your voice."),
        ("Member communications.", "Draft welcome sequences, check-ins, milestone notes, and reactivation outreach so no member slips through the cracks."),
        ("Retention sequences.", "When attendance signals churn risk, AI drafts the targeted outreach that brings members back before they cancel, the single biggest lever on a studio's economics."),
        ("Social content.", "Produce a week of posts, transformation stories (with permission), and educational content in minutes, keeping the feed that drives new members alive."),
        ("Coach training and SOPs.", "Standardize the coaching and front-desk experience across staff with clear, consistent documentation."),
    ],
    "human_heading": "The coaching core",
    "human": [
        "The coaching relationship itself. AI cannot replace presence with a member.",
        "Form correction and injury recovery. Always hands-on, qualified, human work.",
        "Difficult conversations (refunds, behavior, billing disputes). The personal touch matters.",
        "Programming judgment for special populations. AI drafts; a qualified coach decides.",
    ],
    "deploy_heading": "For a small gym or studio",
    "deployment": [
        "The owner uses Claude Pro ($20/mo) for personal workflow, plus a one-time setup of a Member Communications Project (roughly $500 to $1,500 if outsourced) that holds your voice, programs, and templates.",
        "Typical time savings run 5 to 8 hours per week of owner time, redirected to higher-value coaching and member experience. For tooling that fits specific formats, see <a href=\"/ai-for-crossfit-gyms\">AI for CrossFit gyms</a> and <a href=\"/ai-for-yoga-studios\">AI for yoga studios</a>.",
    ],
    "faqs": [
        ("How can a gym use AI without losing the personal touch?", "Point AI at the administrative and content work (communications, social, documentation) and keep coaching, form correction, and member relationships human. The goal is more time for members, not less contact."),
        ("What does it cost to use Claude in a fitness business?", "An owner can start with Claude Pro at $20 per month. A one-time setup of member-communication workflows runs roughly $500 to $1,500 if outsourced. Most owners recover that quickly in time saved."),
        ("What is the highest-value AI use for a studio?", "Retention messaging. AI makes consistent check-ins and win-back outreach feasible, and keeping members is far cheaper than acquiring new ones."),
    ],
    "related": [
        ("ai-for-crossfit-gyms", "AI for CrossFit gyms"),
        ("ai-for-yoga-studios", "AI for yoga studios"),
        ("claude-for-small-business", "Claude for small business"),
        ("how-to-use-ai-in-your-business", "How to use AI in your business"),
    ],
}

GUIDES["claude-for-insurance"] = {
    "title": "Claude for Insurance Brokerages and Agencies: Practical Guide | Treetop",
    "desc": "Practical guide to using Claude in insurance brokerages and agencies: client communications, policy summaries, renewals, and marketing, with compliance cautions and the agency workflow.",
    "og_desc": "Client comms, policy summaries, renewals, and marketing. The agency workflow, with compliance notes.",
    "industry_em": "insurance brokerages &amp; agencies.",
    "hero_sub": "Insurance runs on relationships, follow-up, and a mountain of documentation. AI handles the writing and summarizing so producers spend more time advising clients and writing business. Here is the practical agency workflow, with the compliance lines that stay human.",
    "workflows": [
        ("Client communications.", "Draft renewal reminders, coverage-review invitations, and follow-ups that keep your book engaged and reduce non-renewals."),
        ("Policy and coverage summaries.", "Turn dense policy documents into plain-language summaries clients actually understand, drafted for a producer to review before sending."),
        ("Renewal and cross-sell outreach.", "Produce timely renewal sequences and cross-sell suggestions tied to life events, the work that grows a book without more headcount."),
        ("Quote follow-up.", "Draft fast, personal follow-ups on open quotes so prospects do not go cold, the difference between a bound policy and a lost one."),
        ("Marketing content.", "Generate educational content, social posts, and local marketing that builds trust and brings in referrals."),
    ],
    "human_heading": "What stays with the licensed producer",
    "human": [
        "Coverage recommendations and suitability. A licensed producer advises and decides, always.",
        "Anything binding. Quotes, terms, and coverage decisions are not AI calls.",
        "Compliance and accuracy. Client-facing policy statements must be reviewed for accuracy and regulatory compliance.",
        "Sensitive claims conversations. The relationship and the judgment stay human.",
    ],
    "deploy_heading": "For an agency or brokerage",
    "deployment": [
        "Producers use Claude Pro ($20/mo) for drafting, with a Project holding your voice, common coverages, and approved language. Keep client-identifying and sensitive data within tools and processes that meet your compliance obligations.",
        "Typical savings are several hours per producer per week on documentation and follow-up, redirected to advising and writing business. For role-specific tooling, see <a href=\"/ai-for-insurance-cmos\">AI for insurance marketing leaders</a>.",
    ],
    "faqs": [
        ("Is it compliant to use AI in an insurance agency?", "It can be, with the right guardrails. Use AI for drafting and summarizing, keep client-identifying data in compliant systems, and have a licensed producer review anything client-facing or binding for accuracy and regulatory compliance."),
        ("What can AI do for an insurance producer?", "Draft client communications, summarize policies in plain language, run renewal and cross-sell outreach, and follow up on open quotes. It removes documentation and follow-up drag so producers spend more time advising."),
        ("Does AI replace licensed producers?", "No. Coverage recommendations, suitability, binding decisions, and compliance stay with the licensed producer. AI handles the writing around the relationship, not the advice."),
    ],
    "related": [
        ("ai-for-insurance-cmos", "AI for insurance marketing leaders"),
        ("claude-for-finance", "Claude for finance"),
        ("claude-for-business", "Claude for business"),
        ("how-to-use-ai-in-your-business", "How to use AI in your business"),
    ],
}

GUIDES["claude-for-education"] = {
    "title": "Claude for Education: Practical Guide for Schools and Districts | Treetop",
    "desc": "Practical guide to using Claude in schools and districts: lesson and material drafting, family communications, administrative work, and differentiation, with student-data cautions.",
    "og_desc": "Lesson materials, family comms, admin, and differentiation. A practical school guide with FERPA notes.",
    "industry_em": "education.",
    "hero_sub": "Teachers and administrators lose hours to documentation, communication, and material prep. AI gives that time back so educators can spend it with students. Here is the practical guide for schools and districts, including the student-data lines that must stay protected.",
    "workflows": [
        ("Lesson and material drafting.", "Generate first drafts of lesson plans, worksheets, rubrics, and reading questions aligned to your standards, for the teacher to review and tailor."),
        ("Differentiation.", "Adapt the same material to multiple reading levels and learning needs in minutes, the work that is valuable but rarely has time."),
        ("Family communications.", "Draft newsletters, conference notes, and update messages in a warm, clear voice, and translate them for multilingual families."),
        ("Administrative writing.", "Produce policies, reports, grant narratives, and routine documentation that consume administrator time."),
        ("Feedback support.", "Draft constructive, consistent feedback frameworks teachers can personalize, speeding the slow part of grading."),
    ],
    "human_heading": "What stays with educators",
    "human": [
        "Teaching and the student relationship. AI supports preparation, not the classroom.",
        "Grading judgment and high-stakes assessment. The educator decides; AI assists with consistency.",
        "Student data privacy. Never put personally identifiable student information into consumer AI tools.",
        "Decisions affecting a student's path. Those require human judgment and accountability.",
    ],
    "deploy_heading": "For a school or district",
    "deployment": [
        "Teachers and administrators use Claude for preparation and communication, with clear policy that student-identifying data stays out of consumer tools and within FERPA-appropriate, district-approved systems.",
        "Typical savings are several hours per educator per week on prep and documentation, redirected to instruction and students. For adjacent models, see <a href=\"/ai-for-microschools\">AI for microschools</a> and <a href=\"/ai-for-education-cmos\">AI for education marketing leaders</a>.",
    ],
    "faqs": [
        ("Is it safe to use AI in schools with student data?", "Use AI for lesson prep, communication, and admin, but keep personally identifiable student information out of consumer tools. Anything involving student data should run through FERPA-appropriate, district-approved systems."),
        ("How can teachers use AI to save time?", "Drafting lesson materials, differentiating content to multiple levels, writing family communications, and producing consistent feedback frameworks. The teacher reviews and tailors; AI removes the blank page."),
        ("Does AI replace teachers?", "No. Teaching, the student relationship, and grading judgment stay human. AI handles preparation and documentation so educators have more time for students."),
    ],
    "related": [
        ("ai-for-microschools", "AI for microschools"),
        ("ai-for-education-cmos", "AI for education marketing leaders"),
        ("claude-for-business", "Claude for business"),
        ("how-to-use-ai-in-your-business", "How to use AI in your business"),
    ],
}

GUIDES["claude-for-nonprofits"] = {
    "title": "Claude for Nonprofits: Practical 2026 Guide | Treetop",
    "desc": "Practical guide to using Claude in nonprofits: grant writing, donor communications, program reporting, and marketing, so lean teams do more mission work with less admin.",
    "og_desc": "Grant writing, donor comms, reporting, and marketing. The lean-team nonprofit workflow.",
    "industry_em": "nonprofits.",
    "hero_sub": "Nonprofit teams are stretched thin, and too much of their time goes to grants, reports, and communications instead of the mission. AI absorbs that administrative load. Here is the practical guide for lean nonprofit teams.",
    "workflows": [
        ("Grant writing.", "Draft and tailor grant proposals and letters of inquiry to each funder's priorities, turning a multi-day task into a focused review and edit."),
        ("Donor communications.", "Produce appeal letters, thank-you notes, impact updates, and stewardship sequences that keep donors connected and giving."),
        ("Program reporting.", "Turn program data and notes into the reports funders and boards require, consistently and on time."),
        ("Marketing and storytelling.", "Draft newsletters, social content, and campaign copy that communicate impact and bring in support."),
        ("Volunteer and operations.", "Generate volunteer communications, training materials, and routine documentation that small teams have no time for."),
    ],
    "human_heading": "What stays human",
    "human": [
        "Donor and funder relationships. AI drafts; the relationship and the ask stay personal.",
        "Mission and program decisions. Those belong to your team and community.",
        "Donor data privacy. Keep personally identifiable donor information out of consumer tools.",
        "The authentic voice of those you serve. Stories are drafted with care and consent, never fabricated.",
    ],
    "deploy_heading": "For a lean nonprofit team",
    "deployment": [
        "Staff use Claude Pro ($20/mo) with a Project holding your mission, voice, programs, and past materials, so grants and communications come out on-brand. Keep donor-identifying data in your CRM and out of consumer tools.",
        "Typical savings are many hours per week on grants, reports, and communications, redirected to programs and relationships. For the funding side of marketing, see <a href=\"/ai-for-nonprofits-cmos\">AI for nonprofit marketing leaders</a>.",
    ],
    "faqs": [
        ("How can a nonprofit use AI to write grants?", "AI drafts proposals and tailors them to each funder's priorities from your program information, turning a multi-day writing task into a focused review and edit. A human always finalizes the submission."),
        ("Is it appropriate to use AI for donor communications?", "Yes, for drafting appeals, thank-you notes, and impact updates, kept in your voice and reviewed before sending. Keep donor-identifying data out of consumer tools, and keep the relationship personal."),
        ("Will AI make nonprofit communications feel impersonal?", "Not if you use it to draft and keep the relationship work human. AI removes the administrative load so staff have more time for donors and the mission, not less."),
    ],
    "related": [
        ("ai-for-nonprofits-cmos", "AI for nonprofit marketing leaders"),
        ("claude-for-business", "Claude for business"),
        ("claude-for-small-business", "Claude for small business"),
        ("how-to-use-ai-in-your-business", "How to use AI in your business"),
    ],
}

GUIDES["claude-for-wealth-management"] = {
    "title": "Claude for Wealth Management and RIAs: Practical 2026 Guide | Treetop",
    "desc": "Practical guide to using Claude in wealth management and RIAs: client communications, meeting prep and notes, content, and operations, with fiduciary and compliance cautions.",
    "og_desc": "Client comms, meeting prep, content, and ops. The advisor workflow, with compliance notes.",
    "industry_em": "wealth management &amp; RIAs.",
    "hero_sub": "Advisors win on trust and time spent with clients, yet much of the week goes to prep, notes, and communications. AI gives that time back. Here is the practical workflow for RIAs and advisors, with the fiduciary and compliance lines that always stay human.",
    "workflows": [
        ("Client communications.", "Draft review invitations, market-update notes, and check-ins in your voice, so clients feel attended to between meetings."),
        ("Meeting preparation and notes.", "Turn account context into a prep brief before a review, and meeting recordings into draft notes and follow-ups after, for the advisor to verify."),
        ("Educational content.", "Produce plain-language explainers and newsletters that build trust and keep your name in front of clients and prospects."),
        ("Operations and documentation.", "Draft routine internal documentation, process notes, and templates that consume staff time."),
        ("Prospecting follow-up.", "Draft timely, personal follow-ups with prospects and centers of influence so the pipeline keeps moving."),
    ],
    "human_heading": "What stays with the advisor",
    "human": [
        "Investment advice and recommendations. The fiduciary judgment is the advisor's, always.",
        "Suitability and planning decisions. AI does not advise clients.",
        "Compliance and accuracy. Client-facing material must be reviewed and archived per your regulatory obligations (SEC, FINRA, state).",
        "Client data privacy. Keep personally identifiable and account data within compliant, approved systems, not consumer tools.",
    ],
    "deploy_heading": "For an RIA or advisory practice",
    "deployment": [
        "Advisors use Claude for drafting and prep, with a Project holding firm voice and approved language, and a clear policy that client-identifying and account data stays within compliant systems. Client-facing communications are reviewed and archived per your compliance program.",
        "Typical savings are several hours per advisor per week on prep, notes, and communications, redirected to clients and planning. For the finance function broadly, see <a href=\"/claude-for-finance\">Claude for finance</a>.",
    ],
    "faqs": [
        ("Is it compliant for an RIA to use AI?", "It can be, with guardrails. Use AI for drafting and prep, keep client and account data in compliant systems, and review and archive client-facing material per your SEC, FINRA, and state obligations. Investment advice stays with the advisor."),
        ("How can a financial advisor use AI to save time?", "Drafting client communications, preparing for reviews, turning meeting recordings into notes and follow-ups, and producing educational content. It removes prep and documentation drag so advisors spend more time with clients."),
        ("Does AI give investment advice?", "No, and it should not. Investment recommendations, suitability, and fiduciary judgment stay with the licensed advisor. AI handles the writing and preparation around the advice."),
    ],
    "related": [
        ("claude-for-finance", "Claude for finance"),
        ("claude-for-insurance", "Claude for insurance"),
        ("claude-for-business", "Claude for business"),
        ("how-to-use-ai-in-your-business", "How to use AI in your business"),
    ],
}

GUIDES["claude-for-architecture"] = {
    "title": "Claude for Architecture Firms: Practical 2026 Guide | Treetop",
    "desc": "Practical guide to using Claude in architecture firms: proposals and fee letters, specifications and reports, client communications, and marketing, so principals spend more time designing.",
    "og_desc": "Proposals, specs, reports, client comms, and marketing. The practical workflow for architecture firms.",
    "industry_em": "architecture firms.",
    "hero_sub": "Architecture firms lose billable hours to proposals, specifications, reports, and client communication. AI handles the writing so architects spend more time designing and winning work. Here is the practical firm workflow, and the calls that stay with the licensed architect.",
    "workflows": [
        ("Proposals and fee letters.", "Turn project parameters into tailored proposals, scopes, and fee letters fast, so you respond to RFPs while the opportunity is warm."),
        ("Specifications and reports.", "Draft narrative specifications, project reports, and meeting minutes from your notes, for the architect to review and refine."),
        ("Client communications.", "Produce project updates, change-order explanations, and decision summaries in a clear, professional voice."),
        ("Marketing and project narratives.", "Write award submissions, project descriptions, and website and social content that win the next commission."),
        ("Research and code summaries.", "Summarize zoning, code, and product research into usable briefs, which the architect verifies against the source."),
    ],
    "human_heading": "What stays with the licensed architect",
    "human": [
        "Design judgment and creative direction. AI supports the practice, it does not design.",
        "Code compliance and life-safety decisions. Verified by the architect against the actual code, always.",
        "Stamped and sealed documents. Professional responsibility and liability stay human.",
        "Client relationships and the design conversation. The trust that wins work is personal.",
    ],
    "deploy_heading": "For an architecture practice",
    "deployment": [
        "Principals and staff use Claude Pro ($20/mo) with a Project holding firm voice, past proposals, and standard language, so business development and documentation move faster. Code and technical content is always verified against the source.",
        "Typical savings are several hours per week on proposals, reports, and communications, recovered as billable or business-development time. For adjacent trades, see <a href=\"/claude-for-construction\">Claude for construction</a> and <a href=\"/claude-for-contractors\">Claude for contractors</a>.",
    ],
    "faqs": [
        ("How can an architecture firm use AI?", "To draft proposals and fee letters, narrative specifications, reports, client communications, and marketing, plus to summarize code and zoning research. The architect reviews and verifies; AI removes the writing drag."),
        ("Can AI handle code compliance for architects?", "It can summarize code and research into briefs, but the licensed architect must verify everything against the actual code. Code compliance and life-safety decisions are professional responsibilities, not AI calls."),
        ("What is the highest-value AI use for an architecture firm?", "Business development. Faster, tailored proposals and stronger project narratives win more work, and the writing time saved converts directly to billable or pursuit time."),
    ],
    "related": [
        ("claude-for-construction", "Claude for construction"),
        ("claude-for-contractors", "Claude for contractors"),
        ("claude-for-business", "Claude for business"),
        ("how-to-use-ai-in-your-business", "How to use AI in your business"),
    ],
}
