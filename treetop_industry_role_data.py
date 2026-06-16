# -*- coding: utf-8 -*-
"""
Industry profiles + role profiles for treetop_industry_role_expander.py.

15 industries x 5 roles = 75 pages of substantive, non-mad-libs content.
The combination of industry constraint + role mandate creates unique content
per page even though only 20 source profiles drive it.
"""
from pathlib import Path

# All page slugs that exist (used to filter related-link candidates)
ALL_PAGES = set()
for p in (Path(__file__).parent / "src" / "pages").rglob("*.astro"):
    rel = p.relative_to(Path(__file__).parent / "src" / "pages").with_suffix("")
    ALL_PAGES.add("/".join(rel.parts))


# ---------------------------------------------------------------------------
# 5 ROLES
# ---------------------------------------------------------------------------

ROLES = {
    "cmos": {
        "name": "CMOs",
        "plural": "CMOs",
        "short": "cmo",
        "mandate_short": "positioning, brand, demand, and team",
        "top_use_cases_summary": "positioning and message production, demand orchestration, executive reporting, and team enablement",
        "pairing": "a senior marketing leader (full-time or fractional) who owns brand and strategy",
        "intersection_lens": "The CMO measures positioning clarity, message-market fit, pipeline contribution, and team productivity, not raw output volume.",
        "role_paragraph": (
            "The CMO role in 2026 is owning brand and demand outcomes, not running campaigns by hand. "
            "AI shifts the CMO further toward operating-model design: which functions on the team use which tools, "
            "what passes through a human review, how brand voice gets enforced at scale, and how leading indicators "
            "tie to pipeline. The CMOs winning in 2026 are the ones treating AI as an org design problem, not a "
            "creative tool. Team productivity gets measured in shipped messaging per quarter against positioning "
            "quality, not in vanity content metrics."
        ),
        "use_cases": [
            ("Positioning and message production.",
             "Turn customer interview synthesis, win/loss notes, and competitive intel into a working positioning "
             "doc for [INDUSTRY], plus the message variants every channel actually wants. The CMO sets direction; "
             "AI does the variant production at scale."),
            ("Demand orchestration.",
             "Coordinate paid, organic, email, and partnerships against one named ICP and one positioning. AI "
             "handles the per-channel adaptation and reporting; the CMO calls the shots on where the budget moves."),
            ("Brand voice at scale.",
             "Encode brand voice in a Project or platform; enforce it across every piece of content the team ships. "
             "Catches drift before it reaches a customer in [INDUSTRY], where voice consistency directly affects trust."),
            ("Executive reporting.",
             "Pull data from analytics, ads, and CRM; produce the weekly and board-ready briefings without the "
             "manual assembly that used to consume a marketing-ops half-week."),
            ("Team enablement.",
             "Build shared prompt libraries, Projects, and playbooks so every marketer ships at the senior-marketer "
             "quality bar, not just the people who learned AI on their own time."),
        ],
        "stack": [
            "<strong>Claude Team or ChatGPT Team ($30-$60/seat)</strong> as the reasoning and writing base.",
            "<strong>A marketing AI platform</strong> (Jasper, Copy.ai, Writer) or Claude Projects with brand voice loaded.",
            "<strong>Performance + attribution layer</strong> for the data the CMO actually reports on.",
            "<strong>Workflow automation</strong> (Zapier, Make) to wire content into the campaign engine.",
        ],
        "roi_metric": "shipped messaging per quarter (consistent on brand) tied to pipeline contribution",
        "ai_takes_over": "production and reporting work",
        "process_metric": "content velocity and approval cycle time",
        "key_tool": "a brand-voice enforcement layer",
        "donts": [
            "Publish without human approval on positioning-relevant content. Voice drift at scale is expensive to recover from.",
            "Replace the senior strategist. AI executes; the CMO sets direction.",
        ],
    },
    "cros": {
        "name": "CROs",
        "plural": "CROs",
        "short": "cro",
        "mandate_short": "pipeline, deal velocity, and revenue forecasting",
        "top_use_cases_summary": "lead qualification and routing, deal coaching, forecasting accuracy, and pipeline hygiene",
        "pairing": "a senior revenue leader (full-time or fractional) who owns the number",
        "intersection_lens": "The CRO measures qualified pipeline, deal velocity, win rate, and forecast accuracy, not raw activity volume.",
        "role_paragraph": (
            "The CRO role in 2026 is owning the number, the forecast, and the revenue operating model. "
            "AI shifts the CRO toward systems design: how leads route, what gets a fast human touch, how reps "
            "are coached, how the forecast gets built. The CROs winning in 2026 are the ones using AI to compress "
            "the time between signal and action across the funnel. Activity metrics stay roughly flat; conversion "
            "and velocity go up because the team is working the right deals with the right context."
        ),
        "use_cases": [
            ("Lead qualification and routing.",
             "Score and enrich inbound leads against the ICP, route the qualified ones to a human SDR within "
             "minutes with a personalized opener. In [INDUSTRY], where buying cycles are sensitive to first-touch "
             "speed, this is the single biggest revenue lever AI can pull."),
            ("Deal coaching and call analysis.",
             "Listen to discovery and demo calls, summarize, surface objections, and coach reps on what to do "
             "next. Frees the CRO from random call sampling and concentrates coaching where it matters."),
            ("Forecasting accuracy.",
             "Pull deal data plus call signal plus engagement data into a forecast that holds up against "
             "manager rollups. CFO trusts it, board trusts it, board pressure goes down."),
            ("Pipeline hygiene.",
             "Flag stale deals, missing next steps, and unanswered emails. Forces honest pipeline conversations "
             "on the rep's terms, not the manager's."),
            ("Sales enablement.",
             "Generate account briefs, battle cards, and competitive responses in real time. Reps walk into "
             "every meeting prepared."),
        ],
        "stack": [
            "<strong>Claude Team or ChatGPT Team ($30-$60/seat)</strong> for reasoning and writing.",
            "<strong>A call-recording + analysis tool</strong> (Gong, Chorus, Fathom).",
            "<strong>An enrichment + prospecting platform</strong> (Apollo, Clay, ZoomInfo with AI).",
            "<strong>A CRM with AI features enabled</strong> (Salesforce Einstein, HubSpot AI).",
        ],
        "roi_metric": "qualified pipeline created per rep, paired with deal velocity",
        "ai_takes_over": "lead handling, call admin, and forecast assembly",
        "process_metric": "time-to-first-touch and deal velocity",
        "key_tool": "an AI-powered call analysis platform",
        "donts": [
            "Send outbound at scale without rep review. Auto-spray destroys brand and deliverability.",
            "Replace the AE relationship. Deals still close on trust.",
        ],
    },
    "cfos": {
        "name": "CFOs",
        "plural": "CFOs",
        "short": "cfo",
        "mandate_short": "close cycle, forecasting, controls, and capital",
        "top_use_cases_summary": "close acceleration, forecast and scenario modeling, FP&A reporting, and AP and audit prep",
        "pairing": "a senior finance leader (full-time or fractional) who owns controls and capital",
        "intersection_lens": "The CFO measures days-to-close, forecast accuracy, audit readiness, and capital efficiency, not raw analyst hours saved.",
        "role_paragraph": (
            "The CFO role in 2026 is owning the close, the forecast, the controls, and the capital narrative. "
            "AI shifts the CFO toward systems design: how AP flows, how the close gets compressed, how the forecast "
            "gets built from primary data instead of analyst guesses. The CFOs winning in 2026 are the ones who "
            "trust AI assistance with assembly and reconciliation while keeping sign-off and judgment human. "
            "Audit and SOX postures get stronger, not weaker, because controls become enforced automatically."
        ),
        "use_cases": [
            ("Close acceleration.",
             "AP processing, reconciliations, and close-period analysis run with AI assistance and human "
             "approval. In [INDUSTRY], where compliance posture matters, the audit trail is the design constraint."),
            ("Forecasting and scenario modeling.",
             "Build and update forecasts; stress-test scenarios; surface variance drivers. The agent does the "
             "modeling; the CFO owns the assumptions."),
            ("FP&A reporting.",
             "Produce weekly, monthly, and board-ready financial reports with narrative explanations. "
             "Frees the FP&A function from assembly to analysis."),
            ("AP and procurement.",
             "Read invoices, match to POs, code to GL, and route for approval. The agent handles the workflow; "
             "humans approve."),
            ("Audit and SOX prep.",
             "Pull and organize evidence, tie out balances, and produce audit-ready workpapers. Cuts audit "
             "prep from weeks to days."),
        ],
        "stack": [
            "<strong>Claude Team or ChatGPT Team ($30-$60/seat)</strong> with appropriate data terms.",
            "<strong>AI-native finance tools</strong> (Ramp AI, Brex AI, Pilot, similar).",
            "<strong>Your ERP and accounting system</strong> as system of record.",
            "<strong>Workflow automation</strong> for routing and approvals.",
        ],
        "roi_metric": "days-to-close, forecast accuracy variance, and audit cycle time",
        "ai_takes_over": "assembly, reconciliation, and reporting work",
        "process_metric": "close-cycle days and FP&A turnaround",
        "key_tool": "an AI-augmented close and reconciliation tool",
        "donts": [
            "Post journal entries unsupervised. Always human approval, especially on accruals.",
            "Make tax or compliance decisions. Those stay with qualified humans.",
        ],
    },
    "vps-marketing": {
        "name": "VPs of Marketing",
        "plural": "VPs of Marketing",
        "short": "VP of Marketing",
        "mandate_short": "campaigns, channels, content production, and team execution",
        "top_use_cases_summary": "content production at scale, channel adaptation, campaign orchestration, and performance reporting",
        "pairing": "either a CMO who owns brand and strategy, or a strong head of marketing-ops",
        "intersection_lens": "The VP of Marketing measures shipped output, channel performance, and team execution against the CMO's strategy, not the strategy itself.",
        "role_paragraph": (
            "The VP of Marketing role in 2026 sits between the CMO's strategy and the team's daily execution. "
            "AI shifts this role toward orchestration: who runs which workflow, where the human approval gates "
            "live, how the team scales output without sacrificing brand. The VP of Marketing winning in 2026 is "
            "the one running an AI-augmented team that ships 3 to 5x the output at the same or higher quality "
            "bar. Team headcount stays flat; output expands; brand voice gets enforced as a design constraint."
        ),
        "use_cases": [
            ("Content production at scale.",
             "Brief, draft, edit, and adapt content across channels with consistent brand voice. The AI does "
             "production; the VP of Marketing owns approval and channel allocation."),
            ("Channel adaptation.",
             "Turn one piece of content into the formats every channel wants. Long-form to LinkedIn to email "
             "to social, all on brand. [Industry]-relevant channels get priority allocation."),
            ("Campaign orchestration.",
             "Launch a campaign across channels with AI handling scheduling, variant creation, and follow-up "
             "sequences. The VP of Marketing watches the dashboards and reallocates."),
            ("Performance analysis and reporting.",
             "Pull data from analytics, ads, and CRM; build a weekly performance brief with what worked and "
             "what to test next. Replaces hours of dashboard scraping."),
            ("Team enablement and training.",
             "Build shared prompt libraries and Projects so every marketer ships at the senior bar. New hires "
             "ramp in weeks instead of quarters."),
        ],
        "stack": [
            "<strong>Claude Team or ChatGPT Team ($30-$60/seat)</strong> for the team's daily work.",
            "<strong>A marketing AI platform or Claude Projects with brand voice loaded</strong>.",
            "<strong>A campaign orchestration tool</strong> (your marketing automation platform with AI enabled).",
            "<strong>An analytics and performance layer</strong> for the weekly briefs.",
        ],
        "roi_metric": "content velocity at quality bar plus channel conversion rates",
        "ai_takes_over": "production and channel adaptation work",
        "process_metric": "content velocity and time-to-publish",
        "key_tool": "a marketing AI platform with brand voice enforcement",
        "donts": [
            "Publish without approval on brand-relevant content. Voice drift at scale is expensive.",
            "Run autonomously across paid channels without spend caps and a human review.",
        ],
    },
    "founders": {
        "name": "Founders",
        "plural": "Founders",
        "short": "founder",
        "mandate_short": "everything that no one else owns yet",
        "top_use_cases_summary": "sales outreach and qualification, content production, customer research synthesis, and operational reporting",
        "pairing": "fractional executive leadership where the founder cannot scale themselves",
        "intersection_lens": "The founder measures runway, growth rate, and progress against the company's next big milestone, not function-by-function metrics.",
        "role_paragraph": (
            "The founder role in 2026 is wearing every C-level hat that has not been filled yet, while staying "
            "close enough to customers to know what to build next. AI lets one founder operate like a small team "
            "in the gap before each functional leader gets hired. The founders winning in 2026 are the ones using "
            "AI to extend runway, accelerate the path to product-market fit, and hire one or two senior people "
            "instead of five mid-level ones. Headcount stays flat longer; growth gets ahead of burn."
        ),
        "use_cases": [
            ("Sales outreach and qualification.",
             "Research prospects, draft personalized outreach, and qualify inbound. The bulk of the SDR work "
             "without the headcount. Founders in [INDUSTRY] specifically benefit because the early customer "
             "conversations are still founder-led."),
            ("Content production.",
             "Blog, social, email, landing pages produced consistently. The founder approves voice and direction; "
             "the AI produces."),
            ("Customer research synthesis.",
             "Pull sales calls, CS tickets, and interview notes into themes. Surfaces what is happening at "
             "scale, faster than a part-time PM could."),
            ("Operational reporting and admin.",
             "Weekly metrics, board prep, vendor management, hiring pipeline. The startup ops work that "
             "founders always have to do themselves."),
            ("Hiring support.",
             "Draft job posts, screen resumes, prep interview questions. Cuts the recruiting time tax founders "
             "hate."),
        ],
        "stack": [
            "<strong>Claude Pro or Team ($20-$30/seat)</strong> as the reasoning base.",
            "<strong>Workflow automation</strong> (Zapier, Make) to connect tools.",
            "<strong>A CRM with AI features enabled</strong>.",
            "<strong>A meeting recorder + AI summary</strong> (Fathom, Otter) for customer conversations.",
        ],
        "roi_metric": "runway extended plus growth-rate trajectory",
        "ai_takes_over": "function-by-function admin and assembly",
        "process_metric": "founder-hours reclaimed for customer work",
        "key_tool": "a CRM with AI-augmented workflows",
        "donts": [
            "Replace customer conversations with agents. The founder must stay close in early stages.",
            "Make pricing or product commitments via AI. Founder owns those.",
        ],
    },
}


# ---------------------------------------------------------------------------
# 15 INDUSTRIES
# ---------------------------------------------------------------------------

INDUSTRIES = {
    "saas": {
        "name": "B2B SaaS",
        "short": "B2B SaaS",
        "constraint_short": "fast iteration, product-led signal, and integration depth",
        "budget_range": "$500 to $5,000",
        "intersection_intro": (
            "B2B SaaS lives on iteration speed, product-led signal, and integration depth. The buyer is "
            "technical, the trial-to-paid funnel matters more than first-touch, and the data the team needs "
            "lives in the product, not just the CRM."
        ),
        "industry_paragraph": (
            "B2B SaaS has three constraints that shape AI deployment. First, iteration speed: campaigns and "
            "messages get tested in weeks, not quarters, so AI's value is in the throughput of variants you can "
            "ship, not just the quality of a single one. Second, product-led signal: usage data is the highest-"
            "value buying signal you have, and the AI stack should be wired into the product analytics layer, not "
            "just the CRM. Third, integration depth: B2B SaaS buyers compare on stack fit; the AI tools you pick "
            "need to integrate cleanly with the rest of the modern revenue stack (Hubspot, Salesforce, Segment, "
            "Snowflake) or they create more work than they save."
        ),
        "use_cases": [
            ("Product-led growth signal.",
             "Pull usage data and turn it into the alerts a [ROLE] actually needs. Free-trial-to-paid handoffs "
             "and expansion signals are the single highest-value AI use case in SaaS."),
            ("Account research for ICP-fit deals.",
             "Pull firmographic, tech-stack, and intent data into a brief the [ROLE] can act on. SaaS deals "
             "close on fit; the team that surfaces fit fastest wins."),
        ],
        "stack_addition": "<strong>Product analytics + reverse-ETL layer</strong> (Amplitude, Mixpanel, Segment) tied to AI signal.",
        "roi_note": "SaaS ROI shows up in trial-to-paid conversion and net-revenue-retention movements, both of which respond fast to better AI deployment.",
        "key_tool": "a product-analytics-aware AI signal layer",
        "biggest_mistake": (
            "Treating AI deployment as a marketing-only or revenue-only initiative. In SaaS, the highest-leverage "
            "AI is the one tied to product-usage signal, which crosses both product and revenue org charts. "
            "Pick the AI tools the whole revenue stack can use, not the ones each function buys on its own."
        ),
        "donts": [
            "Send messaging that contradicts product reality. Customers compare and notice fast in SaaS.",
            "Touch sensitive customer usage data without enterprise-tier vendor agreements.",
        ],
    },
    "fintech": {
        "name": "fintech",
        "short": "fintech",
        "constraint_short": "regulatory, compliance, and data sensitivity",
        "budget_range": "$1,000 to $10,000",
        "intersection_intro": (
            "Fintech sits inside a regulatory perimeter that horizontal AI advice ignores. The buyer is "
            "compliance-aware, the data is sensitive, and the cost of a wrong AI output is not just a bad "
            "customer experience but potentially a regulatory finding."
        ),
        "industry_paragraph": (
            "Fintech has three constraints that shape AI deployment. First, regulatory posture: SOC 2, "
            "PCI-DSS, often state money-transmitter rules and federal banking partnerships. Vendor agreements "
            "and data-handling terms are not optional design questions. Second, customer-data sensitivity: "
            "PII and financial data cannot be passed through consumer AI tools without appropriate vendor "
            "agreements (BAA-equivalent terms). Third, audit-grade communication: every customer-facing "
            "communication may end up in a regulator's hands, so AI-drafted content needs human review and "
            "documented controls."
        ),
        "use_cases": [
            ("Compliance-aware content production.",
             "Draft customer-facing communications with [ROLE] review and a documented approval workflow. "
             "Reduces the volume problem without weakening the control."),
            ("Risk-flagging and pattern detection.",
             "Surface anomalous transactions, suspicious patterns, and complaint signals at scale. The [ROLE] "
             "reviews; the AI surfaces."),
        ],
        "stack_addition": "<strong>Enterprise-tier AI vendors with appropriate data terms</strong> (Anthropic via Bedrock, Azure OpenAI with the right contracts).",
        "roi_note": "Fintech ROI shows up in reduced cycle time on regulated workflows (KYC, fraud review, compliance reporting) and lower exception rates.",
        "key_tool": "an enterprise-tier AI deployment with audit-grade data terms",
        "biggest_mistake": (
            "Using consumer AI tools on regulated workflows. The cost-savings story disappears the first time "
            "a regulator asks for an audit trail and your vendor cannot produce one. Start with enterprise-tier "
            "vendor selection, then design the workflow around it."
        ),
        "donts": [
            "Send customer communications about regulated topics without [ROLE] review. The audit trail is the design constraint.",
            "Use consumer AI tools on PII or financial data. Enterprise-tier with appropriate contracts is the only safe path.",
        ],
    },
    "healthcare-tech": {
        "name": "healthcare technology",
        "short": "healthcare tech",
        "constraint_short": "HIPAA, clinical accountability, and data sensitivity",
        "budget_range": "$1,000 to $10,000",
        "intersection_intro": (
            "Healthcare technology sits inside HIPAA and a clinical-accountability regime that does not bend "
            "for AI adoption. The buyer is compliance-aware, the data is regulated, and the lines between "
            "administrative and clinical work cannot blur."
        ),
        "industry_paragraph": (
            "Healthcare tech has three constraints that shape AI deployment. First, HIPAA: Business Associate "
            "Agreements (BAAs) with AI vendors are not optional, and consumer AI tools cannot touch PHI. "
            "Second, clinical accountability: anything that affects a clinical decision stays under licensed-"
            "clinician review and sign-off. Third, integration friction: healthcare data lives in EHRs that do "
            "not play nicely with consumer AI tools; integration paths matter more than raw model quality."
        ),
        "use_cases": [
            ("Administrative cycle compression.",
             "Prior auth, billing, scheduling: the administrative workflows where AI safely cuts cycle time "
             "without touching clinical decisions. The [ROLE] handles design; AI handles assembly."),
            ("Patient communication with clinical review.",
             "Draft non-clinical patient communications (scheduling, reminders, billing) with clear approval "
             "workflows. Clinical communications stay with clinicians."),
        ],
        "stack_addition": "<strong>HIPAA-covered AI vendors with BAA in place</strong> (Anthropic via Bedrock with BAA, Azure OpenAI Healthcare).",
        "roi_note": "Healthcare-tech ROI shows up in administrative cycle times (prior auth, billing) and clinician documentation burden, both directly tied to financials.",
        "key_tool": "a HIPAA-covered AI deployment with BAA",
        "biggest_mistake": (
            "Treating HIPAA as an afterthought. Deploying AI on PHI without appropriate BAA-covered vendors "
            "creates a compliance exposure that swamps any productivity gain. Start with the vendor and contract "
            "review; build the workflow second."
        ),
        "donts": [
            "Touch PHI with vendors who have not signed a BAA. This is not optional.",
            "Let AI make or recommend clinical decisions. Clinicians decide; AI assists administrative work.",
        ],
    },
    "insurance": {
        "name": "insurance",
        "short": "insurance",
        "constraint_short": "regulation, underwriting integrity, and customer trust",
        "budget_range": "$1,000 to $10,000",
        "intersection_intro": (
            "Insurance operates inside a regulatory regime that varies by state and product line. The buyer "
            "is risk-aware, the data is sensitive, and underwriting integrity is the brand."
        ),
        "industry_paragraph": (
            "Insurance has three constraints that shape AI deployment. First, regulation: state-by-state "
            "insurance rules vary; AI-generated content that crosses lines (rate quotes, coverage advice) "
            "creates compliance exposure. Second, underwriting integrity: AI can help draft and analyze, but "
            "the underwriting decision and the audit trail stay human. Third, customer trust: insurance "
            "customers buy on trust, and AI-drafted communications that feel generic erode it fast."
        ),
        "use_cases": [
            ("Claims processing acceleration.",
             "Read claims documents, surface relevant policy provisions, and draft initial responses. The "
             "[ROLE] keeps approval; AI cuts cycle time."),
            ("Quote and policy explanation in plain English.",
             "Turn policy language into customer-friendly summaries that comply with state requirements. "
             "Human review on anything that touches coverage."),
        ],
        "stack_addition": "<strong>Enterprise-tier AI with insurance-specific data terms</strong> and audit trail.",
        "roi_note": "Insurance ROI shows up in claims cycle time, underwriting throughput, and customer-experience scores.",
        "key_tool": "an enterprise-tier AI deployment with audit-grade controls",
        "biggest_mistake": (
            "Letting AI handle customer-facing coverage discussions without [ROLE] review. State regulations "
            "are unforgiving on what counts as advice, and AI-drafted output can cross the line quietly."
        ),
        "donts": [
            "Quote rates or give coverage advice via AI without licensed-agent review.",
            "Run on customer policy data without appropriate enterprise vendor agreements.",
        ],
    },
    "legal": {
        "name": "legal services",
        "short": "legal",
        "constraint_short": "UPL, attorney-client privilege, and ethics",
        "budget_range": "$1,000 to $10,000",
        "intersection_intro": (
            "Legal sits inside an ethics regime where AI deployment is constrained by unauthorized-practice-"
            "of-law rules, privilege protection, and bar guidance that varies by jurisdiction."
        ),
        "industry_paragraph": (
            "Legal has three constraints that shape AI deployment. First, UPL: AI cannot give legal advice "
            "to clients unsupervised; the line between drafting assistance and advice matters legally. "
            "Second, privilege: client-matter material must run through vendors with appropriate data terms "
            "or privilege is exposed. Third, ethics rules: most state bars have issued AI guidance, and the "
            "supervising attorney's competence obligation extends to AI tools."
        ),
        "use_cases": [
            ("Document review and discovery.",
             "Surface relevant material from document productions faster than paralegals can, always under "
             "attorney supervision."),
            ("Drafting support.",
             "Draft first versions of briefs, contracts, and discovery requests from templates and matter "
             "facts; attorney reviews and refines."),
        ],
        "stack_addition": "<strong>Legal-specific AI tools with appropriate data terms</strong> (Harvey, Spellbook, Casetext CoCounsel).",
        "roi_note": "Legal ROI shows up in hours billed vs. hours spent and matter throughput, both of which compound across the partnership.",
        "key_tool": "a legal-specific AI tool with attorney-supervision workflow",
        "biggest_mistake": (
            "Letting non-attorneys (paralegals or staff) run AI-generated client work without attorney "
            "review. UPL and supervision rules do not bend for productivity. The supervising attorney is "
            "responsible for whatever the AI produces."
        ),
        "donts": [
            "Give clients legal advice via AI without attorney review. UPL exposure is real.",
            "Touch privileged material with vendors that have not signed appropriate data terms.",
        ],
    },
    "professional-services": {
        "name": "professional services",
        "short": "professional services",
        "constraint_short": "client trust, billable economics, and senior judgment",
        "budget_range": "$500 to $5,000",
        "intersection_intro": (
            "Professional services firms (accounting, consulting, advisory) live on billable hours, client "
            "trust, and senior judgment. AI shifts the leverage math but does not change what clients pay for."
        ),
        "industry_paragraph": (
            "Professional services has three constraints that shape AI deployment. First, billable economics: "
            "AI cuts the hours an engagement takes, which either raises margin or forces a pricing rethink. "
            "Second, client trust: clients pay for senior judgment, and AI-drafted work that does not reflect "
            "the firm's voice erodes the brand. Third, knowledge management: the firm's institutional "
            "knowledge is its asset; AI tooling either compounds that knowledge or fragments it."
        ),
        "use_cases": [
            ("Research and synthesis at scale.",
             "Pull together secondary research and industry data faster than a junior. The [ROLE] applies "
             "judgment; AI does the assembly."),
            ("Deck and deliverable production.",
             "Generate first-draft slides and reports; the senior consultant edits for narrative and clarity. "
             "Cuts hours per deliverable substantially."),
        ],
        "stack_addition": "<strong>A knowledge-management layer</strong> for the firm's historical engagements.",
        "roi_note": "Professional-services ROI shows up in margin per engagement and clients-per-partner, both of which can move 30 to 50 percent with proper AI deployment.",
        "key_tool": "a firm-knowledge-aware AI tool tied to past engagements",
        "biggest_mistake": (
            "Letting junior staff ship AI-drafted client work without senior partner review. Generic AI "
            "output gets detected fast and damages the firm's brand. The senior review step is the value."
        ),
        "donts": [
            "Ship client deliverables without senior partner review. Generic AI output is detected fast.",
            "Touch sensitive client data without enterprise-tier vendor agreements.",
        ],
    },
    "ecommerce": {
        "name": "ecommerce",
        "short": "ecommerce",
        "constraint_short": "catalog scale, customer-service volume, and conversion economics",
        "budget_range": "$500 to $5,000",
        "intersection_intro": (
            "Ecommerce runs on catalog scale, high-volume customer service, and tight conversion economics. "
            "AI is one of the highest-ROI deployments here because the work is repetitive and volume-driven."
        ),
        "industry_paragraph": (
            "Ecommerce has three constraints that shape AI deployment. First, catalog scale: thousands of SKUs "
            "need descriptions, alt text, FAQ, and category copy; manual production does not scale. Second, "
            "customer-service volume: shipping and order questions are 80 percent of inbound; AI deflection "
            "is the highest-ROI single deployment. Third, conversion economics: small lifts in conversion rate "
            "compound across the catalog, so the AI tools you pick need to plug into the merchandising and "
            "marketing automation."
        ),
        "use_cases": [
            ("Product content production.",
             "Generate descriptions, bullets, alt text, and FAQ for thousands of SKUs from spec sheets. The "
             "merchandising team approves; AI does production."),
            ("Customer-service deflection.",
             "Answer the 80 percent of inquiries about shipping, order status, and product questions "
             "instantly. Cuts CS volume and improves response time."),
        ],
        "stack_addition": "<strong>An ecommerce-native AI layer</strong> (Octane AI, Yotpo AI, your platform's AI features).",
        "roi_note": "Ecommerce ROI shows up in conversion rate, CS deflection, and content velocity, all of which compound across the catalog.",
        "key_tool": "an ecommerce-platform-native AI layer",
        "biggest_mistake": (
            "Treating AI as a content-only initiative. The highest-ROI ecommerce AI deployments are in "
            "customer service and merchandising operations, both of which are operations problems, not "
            "marketing problems."
        ),
        "donts": [
            "Make claims about products that are not verified. Hallucinations on a product page hurt conversion and trust.",
            "Auto-approve high-value returns or refunds unsupervised. Human review on anything above a threshold.",
        ],
    },
    "agencies": {
        "name": "marketing agencies",
        "short": "agencies",
        "constraint_short": "client retention, margin per account, and creative differentiation",
        "budget_range": "$500 to $5,000",
        "intersection_intro": (
            "Agency economics live on client retention and margin per account. AI is rewriting both: better "
            "deployment lifts margin without losing the creative judgment clients pay for."
        ),
        "industry_paragraph": (
            "Marketing agencies have three constraints that shape AI deployment. First, client retention: "
            "agencies that produce generic AI output get fired; agencies that use AI to be smarter about strategy "
            "get expanded. Second, margin per account: the AI shift compresses production hours, which either "
            "expands margin or forces a pricing change. Third, creative differentiation: clients hire agencies "
            "for ideas they do not have, and AI commoditizes production but not ideas."
        ),
        "use_cases": [
            ("Production at scale across accounts.",
             "Generate the volume work (drafts, variants, channel adaptation) at a quality bar that holds, "
             "across every client. The [ROLE] approves; AI ships."),
            ("Account research and strategy support.",
             "Pull together competitive landscape, client market data, and creative inspiration. Account "
             "teams walk into reviews prepared."),
        ],
        "stack_addition": "<strong>An account-aware AI deployment</strong> (per-client Projects or workspace with brand voice loaded).",
        "roi_note": "Agency ROI shows up in margin per account and accounts per staffer, both of which can move 30 to 50 percent with proper AI deployment.",
        "key_tool": "an account-isolated AI workspace with per-client brand voice",
        "biggest_mistake": (
            "Treating AI as a cost-savings story. Clients can read AI-drafted work; the agencies that win "
            "are the ones using AI to ship more creative, not more generic. Pricing should reflect the lift, "
            "not race to the bottom."
        ),
        "donts": [
            "Ship generic AI-drafted client work. Generic output is the surest way to lose a retainer.",
            "Mix client data across workspaces. Account isolation is a contractual and ethical requirement.",
        ],
    },
    "manufacturing": {
        "name": "manufacturing",
        "short": "manufacturing",
        "constraint_short": "long sales cycles, technical buyers, and channel complexity",
        "budget_range": "$500 to $5,000",
        "intersection_intro": (
            "Manufacturing has long sales cycles, technical buyers, and complex distribution channels. AI "
            "deployment is constrained less by regulation and more by the depth of product and technical "
            "context required to be useful."
        ),
        "industry_paragraph": (
            "Manufacturing has three constraints that shape AI deployment. First, technical buyers: customers "
            "evaluate on specs, performance, and reliability; AI-drafted content that lacks technical depth "
            "fails the credibility test. Second, long sales cycles: 6 to 24 months of nurturing means AI's "
            "value is in sustained personalization at scale, not first-touch conversion. Third, channel "
            "complexity: distributors, integrators, and direct sales all need different enablement; AI helps "
            "scale that without expanding the team."
        ),
        "use_cases": [
            ("Technical content production.",
             "Application notes, product specs, installation guides. AI accelerates production; "
             "engineering verifies technical accuracy."),
            ("Long-cycle nurture personalization.",
             "Personalize communications per persona (engineer, procurement, plant manager) and project "
             "type. The [ROLE] sets the strategy; AI handles personalization."),
        ],
        "stack_addition": "<strong>A CRM with engineering-data integration</strong> tied to product information.",
        "roi_note": "Manufacturing ROI shows up in proposal turnaround time, nurture-cycle engagement, and channel partner activity.",
        "key_tool": "an engineering-data-aware AI for technical content",
        "biggest_mistake": (
            "Letting AI produce technical content without engineering verification. A wrong spec on a "
            "product page or in a proposal damages credibility with technical buyers permanently."
        ),
        "donts": [
            "Publish technical specs or performance claims without engineering review.",
            "Make safety or compliance statements without compliance verification.",
        ],
    },
    "logistics": {
        "name": "logistics and supply chain",
        "short": "logistics",
        "constraint_short": "operational complexity, regulatory compliance, and customer-service volume",
        "budget_range": "$500 to $5,000",
        "intersection_intro": (
            "Logistics runs on operational complexity, regulatory compliance, and high-volume customer "
            "service. AI deployment helps most where the work is repetitive, document-heavy, and time-sensitive."
        ),
        "industry_paragraph": (
            "Logistics has three constraints that shape AI deployment. First, operational complexity: rates, "
            "routes, modes, and exceptions vary by lane and customer; AI helps surface patterns but does not "
            "replace operator judgment. Second, regulatory compliance: trade, customs, hazmat, and DOT rules "
            "shape what AI can safely produce. Third, customer-service volume: shipment-status and exception "
            "communications are constant; AI deflection is high-leverage."
        ),
        "use_cases": [
            ("Quote and rate response acceleration.",
             "Read customer RFQs, surface relevant lane and rate data, and draft responses. The [ROLE] "
             "approves; AI cuts cycle time substantially."),
            ("Exception communication.",
             "Draft customer-facing messages on delays, exceptions, and rerouting. The operator approves; "
             "AI maintains tone."),
        ],
        "stack_addition": "<strong>A TMS or operations platform with AI integration</strong>.",
        "roi_note": "Logistics ROI shows up in quote turnaround, exception cycle times, and customer-experience scores.",
        "key_tool": "an operations-platform-integrated AI for quote and exception workflows",
        "biggest_mistake": (
            "Letting AI commit to rates or service levels in customer-facing communications without operator "
            "review. Rate exposure on a bad quote is permanent."
        ),
        "donts": [
            "Commit rates or service levels via AI without operator review.",
            "Make trade-compliance or hazmat statements without compliance verification.",
        ],
    },
    "energy": {
        "name": "energy and utilities",
        "short": "energy",
        "constraint_short": "regulation, long sales cycles, and technical buyers",
        "budget_range": "$500 to $5,000",
        "intersection_intro": (
            "Energy lives inside regulation, long sales cycles, and technical-buyer expectations. AI "
            "deployment is constrained by the regulatory perimeter and the technical depth required to be "
            "credible."
        ),
        "industry_paragraph": (
            "Energy and utilities has three constraints that shape AI deployment. First, regulation: state "
            "PUCs, FERC, and ESG reporting rules shape what content and what data can flow through AI tools. "
            "Second, long sales cycles: 12 to 36 month sales cycles mean AI's value is in sustained, "
            "technical personalization. Third, technical buyers: engineering and procurement teams evaluate "
            "on technical depth; generic AI content gets dismissed."
        ),
        "use_cases": [
            ("Regulatory-aware content production.",
             "Draft customer-facing communications with compliance review and a documented approval "
             "workflow. AI cuts cycle time; the [ROLE] approves."),
            ("Long-cycle account nurture.",
             "Personalize technical communications per persona and project phase across multi-year cycles."),
        ],
        "stack_addition": "<strong>Enterprise-tier AI with compliance-grade audit trail</strong>.",
        "roi_note": "Energy ROI shows up in regulatory cycle times, technical-proposal turnaround, and account engagement across long cycles.",
        "key_tool": "an enterprise-tier AI with compliance-grade controls",
        "biggest_mistake": (
            "Treating AI as a marketing-content tool without integrating engineering and compliance review. "
            "Energy buyers are technical and regulated; AI-drafted content that does not pass either bar "
            "fails fast."
        ),
        "donts": [
            "Publish technical or rate-relevant claims without engineering and compliance review.",
            "Use consumer AI tools on regulated customer data.",
        ],
    },
    "education": {
        "name": "education",
        "short": "education",
        "constraint_short": "student privacy, equity considerations, and pedagogical accountability",
        "budget_range": "$300 to $3,000",
        "intersection_intro": (
            "Education sits inside FERPA, equity considerations, and pedagogical accountability. AI "
            "deployment in education is shaped less by ROI math and more by the values of the institution "
            "and the trust of families."
        ),
        "industry_paragraph": (
            "Education has three constraints that shape AI deployment. First, FERPA: student data cannot "
            "flow through consumer AI tools without appropriate vendor agreements. Second, equity: AI "
            "tooling that benefits some students and not others creates institutional risk. Third, "
            "pedagogical accountability: educators own learning outcomes; AI assists but does not decide."
        ),
        "use_cases": [
            ("Administrative cycle compression.",
             "Admissions follow-up, enrollment communication, donor stewardship: where AI cuts cycle time "
             "without touching pedagogy."),
            ("Family communication.",
             "Personalized communication to families about academics, events, and operations. The [ROLE] "
             "approves; AI scales."),
        ],
        "stack_addition": "<strong>An education-aware AI deployment with FERPA-appropriate data terms</strong>.",
        "roi_note": "Education ROI shows up in administrative cycle times and family-engagement metrics, both of which tie to enrollment.",
        "key_tool": "a FERPA-compliant AI deployment with administrative-workflow integration",
        "biggest_mistake": (
            "Letting AI touch student data without FERPA-appropriate agreements. The exposure is large and "
            "the productivity gain is not worth it. Pick the vendor first, design the workflow second."
        ),
        "donts": [
            "Touch student data with vendors that have not signed FERPA-appropriate agreements.",
            "Use AI to make pedagogical or evaluation decisions about individual students.",
        ],
    },
    "hospitality": {
        "name": "hospitality",
        "short": "hospitality",
        "constraint_short": "guest experience, brand voice, and seasonality",
        "budget_range": "$300 to $3,000",
        "intersection_intro": (
            "Hospitality lives on guest experience and brand voice. AI deployment is constrained less by "
            "regulation and more by the brand-voice and personalization expectations of high-end guests."
        ),
        "industry_paragraph": (
            "Hospitality has three constraints that shape AI deployment. First, guest experience: AI-drafted "
            "communications that feel generic erode the property's brand fast. Second, brand voice: each "
            "property's voice is the brand; voice drift at scale is expensive. Third, seasonality: revenue "
            "concentrates in seasons, and the AI deployment needs to ramp output without losing voice."
        ),
        "use_cases": [
            ("Guest communication at scale.",
             "Pre-arrival, in-stay, and post-stay communications personalized to the guest. The [ROLE] "
             "approves brand voice; AI scales personalization."),
            ("Marketing content production.",
             "Email, social, and on-property collateral produced at the property's voice. Saves "
             "marketing-team hours without sacrificing brand."),
        ],
        "stack_addition": "<strong>A PMS-integrated AI layer</strong> for guest-data context.",
        "roi_note": "Hospitality ROI shows up in direct-booking conversion, guest-satisfaction scores, and email open rates.",
        "key_tool": "a PMS-integrated AI with brand voice enforcement",
        "biggest_mistake": (
            "Generic AI-drafted guest communications. Hospitality customers can read it, and one bad message "
            "to a high-value guest can affect lifetime revenue across an entire property."
        ),
        "donts": [
            "Send guest communications without brand-voice review at first. Voice drift erodes the property's brand fast.",
            "Touch guest PII (loyalty data, payment data) without appropriate vendor agreements.",
        ],
    },
    "nonprofits": {
        "name": "nonprofits",
        "short": "nonprofits",
        "constraint_short": "budget constraints, donor trust, and mission alignment",
        "budget_range": "$100 to $1,000",
        "intersection_intro": (
            "Nonprofits operate inside tight budgets, donor-trust dynamics, and mission alignment. AI "
            "deployment is constrained less by regulation and more by the alignment between AI use and the "
            "mission the donors fund."
        ),
        "industry_paragraph": (
            "Nonprofits have three constraints that shape AI deployment. First, budget: small staffs and "
            "tight budgets mean the AI deployment has to pay back in staff time freed for mission work, "
            "not be another line item. Second, donor trust: major donors notice generic AI-drafted "
            "communications fast; the relationship is the lifeblood. Third, mission alignment: AI tooling "
            "needs to be defensible to the board and to donors who fund the mission, not the technology."
        ),
        "use_cases": [
            ("Grant writing support.",
             "Draft first versions of grant applications from program data and prior submissions. The "
             "[ROLE] edits for voice and accuracy. Speeds up the grant cycle substantially."),
            ("Donor and supporter communication.",
             "Personalized stewardship at scale with appropriate human review on major donors."),
        ],
        "stack_addition": "<strong>A donor-CRM-integrated AI deployment</strong> (Salesforce Nonprofit Cloud, Bloomerang).",
        "roi_note": "Nonprofit ROI shows up in staff hours reclaimed for mission work plus grant-application throughput.",
        "key_tool": "a donor-CRM-integrated AI for stewardship communication",
        "biggest_mistake": (
            "Sending generic AI-drafted communications to major donors. The relationships are the "
            "organization's lifeblood, and AI-generated copy on the wrong message kills future giving."
        ),
        "donts": [
            "Send major-donor communications without [ROLE] review. The relationships are the lifeblood.",
            "Touch beneficiary data without appropriate vendor agreements.",
        ],
    },
    "real-estate": {
        "name": "real estate",
        "short": "real estate",
        "constraint_short": "transaction trust, listing accuracy, and local-market knowledge",
        "budget_range": "$300 to $3,000",
        "intersection_intro": (
            "Real estate runs on transaction trust, listing accuracy, and local-market knowledge. AI "
            "deployment is constrained less by regulation and more by the trust dynamics of large, "
            "infrequent transactions."
        ),
        "industry_paragraph": (
            "Real estate has three constraints that shape AI deployment. First, transaction trust: clients "
            "trust agents with their largest financial decision; AI cannot substitute for the relationship. "
            "Second, listing accuracy: a wrong listing detail creates legal exposure; AI-drafted content "
            "needs verification. Third, local-market knowledge: clients hire agents for market knowledge "
            "that AI cannot fully replicate, and the deployment needs to amplify that knowledge."
        ),
        "use_cases": [
            ("Listing content production.",
             "Generate listing descriptions, social posts, and email blasts from MLS data and photos. The "
             "[ROLE] approves accuracy; AI saves hours per listing."),
            ("Transaction coordination communication.",
             "Track deadlines, prompt for missing docs, and draft client and party communications."),
        ],
        "stack_addition": "<strong>An MLS-integrated AI layer</strong> for listing content and transaction workflow.",
        "roi_note": "Real-estate ROI shows up in lead-to-meeting conversion and transactions per agent.",
        "key_tool": "an MLS-integrated AI tool for content and lead workflow",
        "biggest_mistake": (
            "Generic AI-drafted listing content and client communication. Clients can detect it, and trust "
            "is the entire business in a relationship-driven transaction."
        ),
        "donts": [
            "Publish listing details that have not been verified against MLS data.",
            "Communicate offer terms or contract details via AI without agent oversight.",
        ],
    },
}
