# -*- coding: utf-8 -*-
"""
Glossary content for treetop_glossary_expander.py.
Plain-English definitions with real formulas/examples. No em/en dashes.
"""

R_GLOSS = ("glossary", "Full AI &amp; GTM glossary", "Every term, defined in plain English.")
R_GTM = ("what-is-gtm-strategy", "What is GTM strategy?", "The plan that gets your product to market.")
R_PLG = ("what-is-product-led-growth", "What is product-led growth?", "Growth driven by the product itself.")

TERMS = {}

TERMS["what-is-churn-rate"] = {
    "term": "Churn Rate", "term_q": "Churn Rate",
    "title": "What is Churn Rate? Plain-English 2026 Definition | Treetop",
    "desc": "What is churn rate? A plain-English definition with the formula, a worked example, why it matters, and how it differs from revenue churn and retention.",
    "og_title": "What is Churn Rate? Plain-English 2026 Definition",
    "og_desc": "The formula, a worked example, and why churn rate is the metric subscription businesses live by.",
    "hero_sub": "Churn rate is the metric subscription businesses live and die by. Here is the plain-English definition, the formula, a worked example, and the traps to avoid.",
    "short_def": "Churn rate is the percentage of customers (or revenue) that a business loses over a given period. It is the inverse of retention and the single clearest signal of whether a subscription business is leaking.",
    "definition": "Churn rate measures how much you are losing. Customer (or logo) churn counts the customers who left; <a href=\"/what-is-revenue-churn\">revenue churn</a> measures the dollars that left. A 5 percent monthly customer churn rate means 5 of every 100 customers you started the month with are gone by the end of it. Because losses compound, small differences in churn produce enormous differences in growth over a year.",
    "formula": "Customer Churn Rate = (Customers lost during period / Customers at start of period) x 100",
    "formula_example": "If you start the month with 400 customers and 12 cancel, your monthly churn rate is (12 / 400) x 100 = 3 percent. Annualized, roughly 30 percent of your base would turn over, which is the number that should drive your retention budget.",
    "why": "Churn is the leak in the bucket. You can pour leads in the top, but if churn is high, growth stalls and acquisition spend is wasted. It directly drives <a href=\"/what-is-net-revenue-retention\">net revenue retention</a> and customer lifetime value, and it is usually cheaper to cut churn than to add new customers. A modern team uses AI to spot at-risk accounts early; the <a href=\"/ai-for-cfos\">AI toolkit for finance leaders</a> covers the reporting side.",
    "watch": [
        "Customer churn vs revenue churn. Losing many small accounts looks bad in logo churn but may barely dent revenue, and vice versa. Track both.",
        "The denominator. Churn over a month, quarter, and year are very different numbers. Always state the period.",
        "Gross vs net. Net revenue churn can be negative (good) if expansion outweighs losses. Do not confuse it with gross churn.",
        "Cohort effects. Blended churn hides whether new cohorts churn faster or slower than old ones.",
    ],
    "faqs": [
        ("How do you calculate churn rate?", "Divide the customers lost during a period by the customers you had at the start, then multiply by 100. For revenue churn, use lost MRR over starting MRR instead."),
        ("What is a good churn rate?", "It varies by model. For B2B SaaS, monthly logo churn under about 1 to 2 percent is healthy; consumer products run higher. Lower is better, and negative net revenue churn is the gold standard."),
        ("What is the difference between churn rate and revenue churn?", "Churn rate (logo churn) counts customers lost. Revenue churn measures dollars lost. A few small cancellations can be low revenue churn but high logo churn."),
    ],
    "related": [
        ("what-is-revenue-churn", "Revenue churn", "The dollar version of churn."),
        ("what-is-logo-churn", "Logo churn", "Churn measured by customer count."),
        ("what-is-net-revenue-retention", "Net revenue retention", "Growth from your existing base."),
        R_GLOSS,
    ],
}

TERMS["what-is-revenue-churn"] = {
    "term": "Revenue Churn", "term_q": "Revenue Churn",
    "title": "What is Revenue Churn? Plain-English 2026 Definition | Treetop",
    "desc": "What is revenue churn? A plain-English definition with the formula, a worked example, gross vs net, and why it matters more than logo churn.",
    "og_title": "What is Revenue Churn? Plain-English 2026 Definition",
    "og_desc": "The formula, gross vs net, and why revenue churn is the truest measure of a leak.",
    "hero_sub": "Revenue churn tells you how many dollars you are losing, which is what actually moves the business. Here is the definition, the formula, and the gross-versus-net distinction.",
    "short_def": "Revenue churn is the percentage of recurring revenue a business loses over a period from cancellations and downgrades. It matters more than customer count because not all customers are worth the same.",
    "definition": "Revenue churn measures lost dollars, not lost logos. Gross revenue churn counts only the revenue you lost (cancellations and downgrades). Net revenue churn subtracts expansion (upgrades, cross-sell) from those losses, and can be negative when your existing customers grow faster than they leave. It is closely tied to <a href=\"/what-is-net-revenue-retention\">net revenue retention</a> and is a truer health signal than <a href=\"/what-is-logo-churn\">logo churn</a>.",
    "formula": "Gross Revenue Churn = (MRR lost during period / MRR at start of period) x 100",
    "formula_example": "Start the month with $100,000 MRR. You lose $4,000 to cancellations and $1,000 to downgrades, for $5,000 lost. Gross revenue churn is (5,000 / 100,000) x 100 = 5 percent. If you also gained $7,000 in expansion, net revenue churn is negative 2 percent, which is excellent.",
    "why": "Revenue is what funds the company, so revenue churn is the leak that counts. Losing one enterprise account can outweigh fifty small cancellations. Investors scrutinize net revenue churn because negative net churn means you grow even with zero new customers. It is the metric behind a durable <a href=\"/what-is-gtm-strategy\">GTM strategy</a>.",
    "watch": [
        "Gross vs net. Always say which you mean. Net can flatter a struggling base if a few accounts expand heavily.",
        "Downgrades count. Revenue churn includes customers who stayed but shrank, not just those who left.",
        "Concentration risk. If expansion comes from one or two accounts, net churn is fragile.",
        "Annual contracts mask timing. Churn shows up at renewal, so monthly figures can look artificially smooth.",
    ],
    "faqs": [
        ("How is revenue churn calculated?", "Divide the recurring revenue lost in a period (cancellations plus downgrades) by the recurring revenue at the start, times 100. Subtract expansion revenue to get net revenue churn."),
        ("Why is revenue churn more important than customer churn?", "Because customers are not equal in value. Losing a few large accounts can be far more damaging than losing many small ones, and only revenue churn captures that."),
        ("What is negative revenue churn?", "When expansion from existing customers exceeds the revenue lost to cancellations and downgrades. It means your base grows on its own, the strongest signal in subscription businesses."),
    ],
    "related": [
        ("what-is-churn-rate", "Churn rate", "The customer-count version of churn."),
        ("what-is-net-revenue-retention", "Net revenue retention", "Growth from your existing base."),
        ("what-is-logo-churn", "Logo churn", "Churn by customer count."),
        R_GLOSS,
    ],
}

TERMS["what-is-logo-churn"] = {
    "term": "Logo Churn", "term_q": "Logo Churn",
    "title": "What is Logo Churn? Plain-English 2026 Definition | Treetop",
    "desc": "What is logo churn? A plain-English definition with the formula, a worked example, and how it differs from revenue churn.",
    "og_title": "What is Logo Churn? Plain-English 2026 Definition",
    "og_desc": "The formula and why logo churn and revenue churn can tell opposite stories.",
    "hero_sub": "Logo churn counts customers lost, regardless of size. It is simple and useful, but only half the picture. Here is the definition and how it pairs with revenue churn.",
    "short_def": "Logo churn is the percentage of customers (logos) a business loses over a period, counted by number of accounts rather than dollars. It is the count-based companion to revenue churn.",
    "definition": "A logo is one customer account. Logo churn counts how many of them you lose, ignoring how much each was worth. It is easy to measure and good for spotting broad retention problems, but it can mislead: losing twenty small logos and keeping every large one can be high logo churn but low <a href=\"/what-is-revenue-churn\">revenue churn</a>. Read the two together.",
    "formula": "Logo Churn = (Customers lost during period / Customers at start of period) x 100",
    "formula_example": "Start with 250 customers, lose 10, and logo churn is (10 / 250) x 100 = 4 percent. If those 10 were your smallest accounts, your revenue churn might be just 1 percent, which is why you never look at logo churn alone.",
    "why": "Logo churn is the fastest read on whether customers are sticking, and it flags product or onboarding problems early because it is sensitive to small accounts that big-dollar metrics miss. Pair it with revenue churn to see both the count and the value of what you are losing. Reducing it starts with a strong <a href=\"/what-is-product-led-growth\">activation and product experience</a>.",
    "watch": [
        "It ignores account size. High logo churn with low revenue churn often just means small accounts leaving.",
        "Segment it. Logo churn among enterprise accounts is a five-alarm fire; among free-trial converts it may be normal.",
        "Pair with revenue churn always. One number without the other tells half the story.",
        "Watch the trend, not just the level. Rising logo churn is a leading indicator of revenue trouble.",
    ],
    "faqs": [
        ("What is the difference between logo churn and revenue churn?", "Logo churn counts customers lost; revenue churn measures dollars lost. They can move in opposite directions, so track both."),
        ("How do you calculate logo churn?", "Divide customers lost during the period by customers at the start, times 100. It is purely a count, with no weighting by account value."),
        ("Is logo churn or revenue churn more important?", "Revenue churn drives the business, but logo churn is an earlier warning signal because it catches small-account losses. Use them together."),
    ],
    "related": [
        ("what-is-churn-rate", "Churn rate", "The general churn metric."),
        ("what-is-revenue-churn", "Revenue churn", "Churn measured in dollars."),
        ("what-is-net-revenue-retention", "Net revenue retention", "Growth from existing customers."),
        R_GLOSS,
    ],
}

TERMS["what-is-net-promoter-score"] = {
    "term": "Net Promoter Score (NPS)", "term_q": "Net Promoter Score (NPS)",
    "title": "What is Net Promoter Score (NPS)? Plain-English 2026 Definition | Treetop",
    "desc": "What is NPS? A plain-English definition with the calculation, a worked example, what counts as a good score, and its limitations.",
    "og_title": "What is Net Promoter Score (NPS)? Plain-English Definition",
    "og_desc": "How NPS is calculated, what a good score is, and where it misleads.",
    "hero_sub": "NPS is the one-question loyalty metric nearly every company tracks. Here is how it is calculated, what counts as good, and where it can mislead you.",
    "short_def": "Net Promoter Score (NPS) measures customer loyalty from a single question: how likely are you to recommend us, on a 0 to 10 scale. It runs from negative 100 to positive 100.",
    "definition": "NPS sorts respondents into Promoters (9 to 10), Passives (7 to 8), and Detractors (0 to 6). The score is the percentage of Promoters minus the percentage of Detractors. Passives count toward the total but not the score. It is popular because it is simple and comparable across companies, and it correlates loosely with growth and retention, though it is a blunt instrument best paired with <a href=\"/what-is-customer-satisfaction-score\">CSAT</a> and <a href=\"/what-is-customer-effort-score\">CES</a>.",
    "formula": "NPS = % Promoters (9-10) - % Detractors (0-6)",
    "formula_example": "Of 200 responses, 120 are Promoters (60 percent), 40 are Passives (20 percent), and 40 are Detractors (20 percent). NPS = 60 - 20 = 40. The 20 percent Passives do not add to the score but do dilute the percentages.",
    "why": "NPS gives leadership a single, trackable loyalty number and an open-text follow-up that surfaces why customers feel as they do. The verbatim comments are often more valuable than the score itself, and AI now makes it easy to theme thousands of them quickly. It is a useful directional signal, not a precise instrument.",
    "watch": [
        "It is a blunt metric. A single number hides a lot; the open-text responses are where the insight is.",
        "Benchmarks vary wildly by industry. Compare to your sector, not a universal target.",
        "Sample bias. Happy and angry customers respond more than indifferent ones, skewing the score.",
        "Do not over-optimize the number. Gaming NPS (begging for 10s) destroys its value as a signal.",
    ],
    "faqs": [
        ("How is NPS calculated?", "Subtract the percentage of Detractors (scores 0 to 6) from the percentage of Promoters (scores 9 to 10). Passives (7 to 8) count in the base but not the score. The result ranges from negative 100 to positive 100."),
        ("What is a good NPS score?", "It depends on the industry, but broadly, above 0 is acceptable, above 30 is good, and above 50 is excellent. Always benchmark against your own sector."),
        ("What is the difference between NPS and CSAT?", "NPS measures long-term loyalty and likelihood to recommend; CSAT measures satisfaction with a specific interaction or product. They answer different questions and work well together."),
    ],
    "related": [
        ("what-is-customer-satisfaction-score", "Customer Satisfaction (CSAT)", "Satisfaction with a specific interaction."),
        ("what-is-customer-effort-score", "Customer Effort Score (CES)", "How easy you are to deal with."),
        ("what-is-churn-rate", "Churn rate", "What loyalty ultimately protects."),
        R_GLOSS,
    ],
}

TERMS["what-is-customer-satisfaction-score"] = {
    "term": "Customer Satisfaction Score (CSAT)", "term_q": "Customer Satisfaction Score (CSAT)",
    "title": "What is Customer Satisfaction Score (CSAT)? Plain-English Definition | Treetop",
    "desc": "What is CSAT? A plain-English definition with the formula, a worked example, and how it differs from NPS and CES.",
    "og_title": "What is Customer Satisfaction Score (CSAT)? Definition",
    "og_desc": "How CSAT is calculated, when to use it, and how it differs from NPS.",
    "hero_sub": "CSAT is the quick pulse check on a specific interaction or product. Here is how it is calculated, when to use it, and how it differs from NPS.",
    "short_def": "Customer Satisfaction Score (CSAT) measures how satisfied customers are with a specific interaction, product, or service, usually on a 1 to 5 scale, expressed as the percentage who responded favorably.",
    "definition": "CSAT asks a direct question right after an experience: how satisfied were you. You take the share of respondents who chose the top one or two ratings (for example, 4 and 5 on a 5-point scale) as your CSAT percentage. Unlike <a href=\"/what-is-net-promoter-score\">NPS</a>, which gauges long-term loyalty, CSAT is transactional and best for measuring a specific touchpoint such as a support ticket or onboarding step.",
    "formula": "CSAT = (Number of satisfied responses (top 1-2 ratings) / Total responses) x 100",
    "formula_example": "After 300 support tickets, you survey and get 180 responses, of which 153 rate 4 or 5. CSAT = (153 / 180) x 100 = 85 percent. That tells you support is doing well; it does not tell you whether those customers will renew.",
    "why": "CSAT pinpoints where a specific experience is strong or weak, which makes it actionable for operations: a low CSAT on onboarding tells you exactly where to fix the journey. Measured at the right touchpoints, it catches problems before they show up in <a href=\"/what-is-churn-rate\">churn</a>. AI makes it easy to theme the open-text feedback behind the scores.",
    "watch": [
        "It is moment-specific. High CSAT on one interaction does not mean a loyal customer overall.",
        "Scale and threshold choices change the number. Define what counts as satisfied and stay consistent.",
        "Timing matters. Ask right after the experience, while it is fresh.",
        "Response bias. Very happy and very unhappy customers answer more often.",
    ],
    "faqs": [
        ("How is CSAT calculated?", "Divide the number of satisfied responses (typically the top one or two ratings) by total responses, times 100. The result is the percentage of customers who were satisfied with that experience."),
        ("What is a good CSAT score?", "Broadly, 75 to 85 percent is solid and above 90 percent is excellent, but it varies by industry and touchpoint. Track your own trend over time."),
        ("When should I use CSAT instead of NPS?", "Use CSAT to measure a specific interaction (support, onboarding, a purchase) and NPS to gauge overall loyalty. They answer different questions."),
    ],
    "related": [
        ("what-is-net-promoter-score", "Net Promoter Score (NPS)", "Long-term loyalty in one question."),
        ("what-is-customer-effort-score", "Customer Effort Score (CES)", "How easy you are to deal with."),
        ("what-is-churn-rate", "Churn rate", "What satisfaction protects."),
        R_GLOSS,
    ],
}

TERMS["what-is-customer-effort-score"] = {
    "term": "Customer Effort Score (CES)", "term_q": "Customer Effort Score (CES)",
    "title": "What is Customer Effort Score (CES)? Plain-English Definition | Treetop",
    "desc": "What is CES? A plain-English definition with how it is measured, a worked example, and why effort predicts loyalty better than delight.",
    "og_title": "What is Customer Effort Score (CES)? Definition",
    "og_desc": "How CES is measured and why low effort predicts loyalty.",
    "hero_sub": "CES measures how hard customers had to work to get what they needed, and low effort predicts loyalty better than delight. Here is how it works.",
    "short_def": "Customer Effort Score (CES) measures how much effort a customer had to expend to get an issue resolved or a task done, usually on a 1 to 7 agreement scale. Lower effort predicts higher loyalty.",
    "definition": "CES asks customers to rate a statement like 'the company made it easy to handle my issue,' typically from 1 (strongly disagree) to 7 (strongly agree). You report the average score or the percentage who agree. The research behind CES found that reducing effort is a stronger driver of loyalty than trying to delight customers, which is why support and product teams track it alongside <a href=\"/what-is-customer-satisfaction-score\">CSAT</a> and <a href=\"/what-is-net-promoter-score\">NPS</a>.",
    "formula": "CES = Average of all effort ratings (1-7 scale), or % of respondents who agree it was easy",
    "formula_example": "After resolving 100 tickets, the average response to 'it was easy to get this resolved' is 5.8 out of 7. That is a strong CES. If it were 3.5, you would have an effort problem driving customers toward the exit.",
    "why": "Effort is friction, and friction is what makes customers leave even when they like your product. A high-effort experience (repeating yourself, bouncing between channels, slow resolution) erodes loyalty quietly. Because CES is tied to a specific interaction, it points directly at what to fix. AI-assisted support is increasingly used to lower effort by resolving issues faster.",
    "watch": [
        "Scale consistency. CES uses several scale formats; pick one and stick to it for comparability.",
        "It is interaction-level. Like CSAT, it measures a moment, not the whole relationship.",
        "Effort can be invisible to you. Customers often do not complain about effort, they just churn.",
        "Pair with outcome data. Low effort with unresolved issues is still a failure.",
    ],
    "faqs": [
        ("How is CES measured?", "Ask customers to rate how easy it was to accomplish something, usually on a 1 to 7 scale, then report the average or the percentage who agreed it was easy."),
        ("Why does customer effort matter more than delight?", "Research shows reducing effort retains customers more reliably than exceeding expectations. Customers rarely become loyal because of delight, but high effort frequently drives them away."),
        ("How is CES different from CSAT?", "CSAT measures satisfaction with an experience; CES measures how hard the customer had to work. Low effort and high satisfaction usually go together, but CES is the better loyalty predictor."),
    ],
    "related": [
        ("what-is-customer-satisfaction-score", "Customer Satisfaction (CSAT)", "Satisfaction with an interaction."),
        ("what-is-net-promoter-score", "Net Promoter Score (NPS)", "Long-term loyalty."),
        ("what-is-churn-rate", "Churn rate", "What effort quietly drives."),
        R_GLOSS,
    ],
}

TERMS["what-is-activation-rate"] = {
    "term": "Activation Rate", "term_q": "Activation Rate",
    "title": "What is Activation Rate? Plain-English 2026 Definition | Treetop",
    "desc": "What is activation rate? A plain-English definition with the formula, a worked example, and why it is the most important early metric in product-led growth.",
    "og_title": "What is Activation Rate? Plain-English 2026 Definition",
    "og_desc": "The formula, the aha moment, and why activation predicts retention.",
    "hero_sub": "Activation rate is the share of new users who reach first value, and it predicts retention better than almost anything. Here is how to define and measure it.",
    "short_def": "Activation rate is the percentage of new users who complete the key action that delivers first value, the moment they understand why your product is worth using.",
    "definition": "Activation is the bridge between signing up and sticking around. You define an activation event tied to your product's <a href=\"/what-is-aha-moment\">aha moment</a> (for example, sending a first message, inviting a teammate, importing data), then measure what share of new users reach it. It is central to <a href=\"/what-is-product-led-growth\">product-led growth</a> because users who never activate almost never retain.",
    "formula": "Activation Rate = (Users who reach the activation milestone / Total new signups) x 100",
    "formula_example": "Of 1,000 signups this month, 380 complete the action you have defined as first value. Activation rate is (380 / 1,000) x 100 = 38 percent. The other 62 percent are the biggest, cheapest growth opportunity you have.",
    "why": "Activation is the highest-leverage point in the funnel. Fixing it lifts every downstream metric: retention, expansion, and revenue. It is also cheaper than acquisition, because you already paid to get those users in the door. Defining the right activation event (the one that actually predicts retention) is the hard part, and where analytics and AI-driven cohort analysis earn their keep.",
    "watch": [
        "Pick the right event. A vanity activation event that does not predict retention is worse than none.",
        "Time-box it. Activation within the first session or first week tells a different story than activation ever.",
        "Segment by source. Users from different channels activate at very different rates.",
        "Do not confuse signup with activation. Signing up is not value; reaching first value is.",
    ],
    "faqs": [
        ("How do you calculate activation rate?", "Divide the number of new users who reach your defined activation milestone by total new signups, times 100. The milestone should be the action that delivers first real value."),
        ("What is a good activation rate?", "It varies widely by product and by how you define activation. The more useful question is whether your rate is improving and whether activated users retain far better than non-activated ones."),
        ("What is the difference between activation and the aha moment?", "The aha moment is when a user first feels the value; the activation event is the measurable action you use as a proxy for it. You design activation around the aha moment."),
    ],
    "related": [
        ("what-is-aha-moment", "Aha moment", "When users first feel the value."),
        ("what-is-northstar-metric", "North Star metric", "The one metric of value delivered."),
        R_PLG, R_GLOSS,
    ],
}

TERMS["what-is-aha-moment"] = {
    "term": "Aha Moment", "term_q": "the Aha Moment",
    "title": "What is the Aha Moment? Plain-English 2026 Definition | Treetop",
    "desc": "What is the aha moment? A plain-English definition with examples, how to find yours, and why it drives activation and retention.",
    "og_title": "What is the Aha Moment? Plain-English Definition",
    "og_desc": "How to find your product's aha moment and why it drives retention.",
    "hero_sub": "The aha moment is when a new user first gets it, the instant your product proves its worth. Find it, and you know what to drive every new user toward.",
    "short_def": "The aha moment is the point at which a new user first experiences the core value of a product, the moment they understand why it is worth using.",
    "definition": "Every sticky product has a moment where it clicks: the first organized board, the first message sent, the first report generated. That is the aha moment. It is qualitative, but you operationalize it by finding the action that activated users take and retained users share, then building your <a href=\"/what-is-activation-rate\">activation rate</a> and onboarding around reaching it fast. Famous examples include reaching a threshold of connections or actions early in a user's life.",
    "why": "If you know your aha moment, you know what onboarding should do: get users there as quickly and reliably as possible. It aligns product, growth, and marketing around a single behavior that predicts retention, which is the heart of <a href=\"/what-is-product-led-growth\">product-led growth</a>. Without it, onboarding becomes a tour of features instead of a path to value.",
    "watch_heading": "How to find yours",
    "watch": [
        "Compare retained vs churned users. The behavior retained users do early and churned users skip is your candidate aha moment.",
        "Look for a threshold. Often it is 'did action X, N times, within the first week.'",
        "Validate it predicts retention, not just correlates with engaged users.",
        "Then design onboarding to drive every new user to it as fast as possible.",
    ],
    "faqs": [
        ("What is an example of an aha moment?", "A classic example is a social product where users who reach a certain number of connections in their first week retain far better. The connection threshold is the aha moment the product drives toward."),
        ("How do I find my product's aha moment?", "Compare the early behavior of users who retained against those who churned. The action retained users took quickly, and churned users did not, is your likely aha moment. Validate that it predicts retention."),
        ("How is the aha moment related to activation?", "The aha moment is the experience of first value; activation is the measurable event you use to track it. You build your activation metric and onboarding around the aha moment."),
    ],
    "related": [
        ("what-is-activation-rate", "Activation rate", "The metric built on the aha moment."),
        ("what-is-northstar-metric", "North Star metric", "The metric of value delivered."),
        R_PLG, R_GLOSS,
    ],
}

TERMS["what-is-northstar-metric"] = {
    "term": "North Star Metric", "term_q": "a North Star Metric",
    "title": "What is a North Star Metric? Plain-English 2026 Definition | Treetop",
    "desc": "What is a north star metric? A plain-English definition with examples, how to choose one, and why it aligns a whole company.",
    "og_title": "What is a North Star Metric? Plain-English Definition",
    "og_desc": "How to choose a north star metric that captures value delivered.",
    "hero_sub": "A north star metric is the single number that best captures the value your product delivers, and the one a whole company can rally around. Here is how to choose one.",
    "short_def": "A north star metric is the single metric that best captures the core value your product delivers to customers, used to align an entire company's efforts.",
    "definition": "The north star is not revenue and not a vanity number. It is the measure of value customers actually receive, chosen so that moving it means customers are winning and, in turn, the business grows. Good examples capture usage of the core value (nights booked, messages sent, meaningful actions completed). It sits above your <a href=\"/what-is-activation-rate\">activation</a> and retention inputs and keeps teams from optimizing local metrics that do not add up to value.",
    "why": "Without a north star, teams optimize their own metrics and pull in different directions. With one, every team can ask whether their work moves the number that represents customer value. It is the antidote to <a href=\"/what-is-vanity-metrics\">vanity metrics</a>, and it makes prioritization clearer because you can trace inputs (activation, engagement, retention) up to the one outcome that matters.",
    "watch_heading": "How to choose one",
    "watch": [
        "It must represent customer value, not just company revenue. Revenue is the result, not the star.",
        "It should be a leading indicator you can influence, not a lagging one you only report.",
        "Avoid vanity. Page views or signups are not value delivered.",
        "One star, with a few input metrics beneath it. Multiple north stars defeats the purpose.",
    ],
    "faqs": [
        ("What is a good example of a north star metric?", "Metrics that capture core value delivered, such as nights booked for a lodging marketplace or messages sent for a communication tool. The test is whether moving it means customers are getting more value."),
        ("Is revenue a north star metric?", "Usually no. Revenue is the outcome of delivering value, not the measure of it. A good north star is a leading indicator of value that, when it grows, pulls revenue up with it."),
        ("How many north star metrics should a company have?", "One, supported by a handful of input metrics. The whole point is alignment, which multiple north stars would undermine."),
    ],
    "related": [
        ("what-is-activation-rate", "Activation rate", "A key input to the north star."),
        ("what-is-vanity-metrics", "Vanity metrics", "What a north star avoids."),
        ("what-is-aha-moment", "Aha moment", "Where value first lands."),
        R_GLOSS,
    ],
}

TERMS["what-is-contract-value"] = {
    "term": "Contract Value", "term_q": "Contract Value",
    "title": "What is Contract Value? Plain-English 2026 Definition | Treetop",
    "desc": "What is contract value? A plain-English definition of TCV and ACV, the formulas, a worked example, and why both matter.",
    "og_title": "What is Contract Value? Plain-English Definition",
    "og_desc": "TCV vs ACV, the formulas, and a worked example.",
    "hero_sub": "Contract value is how much a deal is worth, measured as either the whole contract or per year. Here is the difference between TCV and ACV and why both matter.",
    "short_def": "Contract value is the total revenue a customer contract represents. Total contract value (TCV) is the whole amount over the term; annual contract value (ACV) is the value per year.",
    "definition": "Two versions matter. TCV is everything the customer will pay over the full contract, including one-time fees. <a href=\"/what-is-annual-contract-value\">ACV</a> normalizes that to a yearly figure, which makes deals of different lengths comparable. A three-year, $300,000 contract has a TCV of $300,000 and an ACV of $100,000. Sales teams use both to size deals, set quotas, and forecast.",
    "formula": "TCV = Total of all payments over the contract term (recurring + one-time)\nACV = Recurring contract value / number of years in the term",
    "formula_example": "A customer signs a 2-year deal at $5,000 per month plus a $10,000 setup fee. TCV = (5,000 x 24) + 10,000 = $130,000. ACV (recurring only) = (5,000 x 12) = $60,000 per year. Reporting one without the other can make a deal look bigger or smaller than it is.",
    "why": "Contract value is how revenue teams measure deal size and health. ACV makes deals comparable and feeds forecasting and quota; TCV captures the full commitment and is useful for cash and renewal planning. Confusing the two is a common reporting error that distorts pipeline math and is worth getting right in any <a href=\"/what-is-gtm-strategy\">GTM strategy</a>.",
    "watch": [
        "TCV vs ACV. Always state which you mean; a long contract inflates TCV relative to ACV.",
        "One-time fees. Decide consistently whether setup and services count toward ACV (usually not).",
        "Discounts and ramps. Ramped deals have different ACV in year one versus year two.",
        "Do not compare a TCV to an ACV. It overstates one deal against another.",
    ],
    "faqs": [
        ("What is the difference between TCV and ACV?", "TCV is the total value over the entire contract term, including one-time fees. ACV is the recurring value per year. A three-year deal has a TCV three times its annual recurring value."),
        ("How do you calculate annual contract value?", "Divide the recurring contract value by the number of years in the term, usually excluding one-time fees. It normalizes deals of different lengths to a comparable yearly figure."),
        ("Why does contract value matter?", "It is how sales sizes deals, sets quotas, and forecasts revenue. Using TCV and ACV consistently keeps pipeline and revenue math accurate."),
    ],
    "related": [
        ("what-is-annual-contract-value", "Annual contract value (ACV)", "Contract value per year."),
        ("what-is-annual-recurring-revenue", "Annual recurring revenue (ARR)", "The recurring revenue base."),
        R_GTM, R_GLOSS,
    ],
}

TERMS["what-is-annual-contract-value"] = {
    "term": "Annual Contract Value (ACV)", "term_q": "Annual Contract Value (ACV)",
    "title": "What is Annual Contract Value (ACV)? Plain-English Definition | Treetop",
    "desc": "What is ACV? A plain-English definition with the formula, a worked example, and how it differs from ARR and TCV.",
    "og_title": "What is Annual Contract Value (ACV)? Definition",
    "og_desc": "The ACV formula and how it differs from ARR and TCV.",
    "hero_sub": "ACV normalizes every deal to a yearly number so you can compare and forecast. Here is the formula and how it differs from ARR and TCV.",
    "short_def": "Annual contract value (ACV) is the average recurring revenue a customer contract generates per year, used to compare deals of different lengths on equal footing.",
    "definition": "ACV takes the recurring value of a contract and expresses it per year. It makes a one-year and a three-year deal comparable, which is essential for quota, forecasting, and benchmarking sales performance. It differs from <a href=\"/what-is-contract-value\">total contract value</a> (the whole term) and from <a href=\"/what-is-annual-recurring-revenue\">ARR</a> (the recurring revenue across all customers, not a single contract).",
    "formula": "ACV = Total recurring contract value / number of years in the term",
    "formula_example": "A customer signs a 3-year contract worth $180,000 in recurring fees. ACV = 180,000 / 3 = $60,000 per year. If a colleague closes a 1-year, $70,000 deal, their ACV is higher even though your TCV is larger, which is exactly why ACV exists.",
    "why": "ACV is the currency of sales planning. It lets you compare reps and deals fairly, set realistic quotas, and forecast without long contracts distorting the picture. Combined with deal count it shows whether you are growing through more deals or bigger ones, a key input to any <a href=\"/what-is-gtm-strategy\">GTM strategy</a>.",
    "watch": [
        "Exclude one-time fees, usually. ACV is about recurring value; setup and services typically sit outside it.",
        "Mind ramped deals. Year-one ACV can differ from later years; state your convention.",
        "ACV is per contract; ARR is the whole base. Do not use them interchangeably.",
        "Blended ACV hides mix. A few large deals can pull the average up.",
    ],
    "faqs": [
        ("How is ACV calculated?", "Divide the total recurring value of a contract by the number of years in its term, typically excluding one-time fees. The result is the average yearly recurring value of that deal."),
        ("What is the difference between ACV and ARR?", "ACV is the annual value of a single contract. ARR is the total annual recurring revenue across all customers. ACV describes a deal; ARR describes the business."),
        ("Why use ACV instead of total contract value?", "Because TCV makes long contracts look larger regardless of yearly value. ACV normalizes to a year so deals of different lengths can be compared and forecast fairly."),
    ],
    "related": [
        ("what-is-contract-value", "Contract value (TCV)", "The whole-term deal value."),
        ("what-is-annual-recurring-revenue", "Annual recurring revenue (ARR)", "Recurring revenue across all customers."),
        R_GTM, R_GLOSS,
    ],
}

TERMS["what-is-gross-merchandise-value"] = {
    "term": "Gross Merchandise Value (GMV)", "term_q": "Gross Merchandise Value (GMV)",
    "title": "What is Gross Merchandise Value (GMV)? Plain-English Definition | Treetop",
    "desc": "What is GMV? A plain-English definition with the formula, a worked example, and why GMV is not revenue.",
    "og_title": "What is Gross Merchandise Value (GMV)? Definition",
    "og_desc": "The GMV formula and the crucial difference between GMV and revenue.",
    "hero_sub": "GMV is the total value of everything sold through a marketplace, and it is routinely confused with revenue. Here is what it actually measures.",
    "short_def": "Gross merchandise value (GMV) is the total monetary value of goods or services sold through a marketplace or platform over a period, before fees and costs. It is not the platform's revenue.",
    "definition": "GMV measures the volume flowing through a platform, not what the platform keeps. A marketplace that processes $10M in transactions has $10M GMV, but its revenue is only the take rate it charges (say, 15 percent, or $1.5M). GMV is a useful scale and growth metric for marketplaces and e-commerce, but presenting it as revenue is one of the most common and misleading moves in startup reporting.",
    "formula": "GMV = Total sales value of all transactions on the platform (before fees, refunds, and costs)",
    "formula_example": "A marketplace processes 50,000 orders averaging $40 each in a quarter. GMV = 50,000 x 40 = $2,000,000. If the platform's take rate is 12 percent, its actual revenue is $240,000, a very different number from the headline GMV.",
    "why": "GMV shows the size and growth of the economic activity a platform enables, which matters for marketplaces where the business scales with transaction volume. But because GMV dwarfs revenue, it is frequently used to make a business look bigger than it is. Sophisticated readers always ask for the take rate and net revenue behind a GMV figure.",
    "watch": [
        "GMV is not revenue. Always pair it with take rate and actual revenue.",
        "It ignores refunds and cancellations unless you net them out. State whether it is gross or net GMV.",
        "It can be inflated by low-margin, high-volume categories that contribute little profit.",
        "Beware GMV-only storytelling. A big GMV with a tiny take rate may be a weak business.",
    ],
    "faqs": [
        ("Is GMV the same as revenue?", "No. GMV is the total value of goods sold through a platform; revenue is only the portion the platform keeps, usually a take-rate percentage of GMV. Confusing the two overstates the business."),
        ("How is GMV calculated?", "Sum the total sales value of all transactions on the platform over a period, before fees and costs. Net GMV subtracts refunds and cancellations."),
        ("Why do companies report GMV?", "Because it shows the scale and growth of activity a marketplace enables. It is a legitimate metric, but it should be presented alongside take rate and revenue, not instead of them."),
    ],
    "related": [
        ("what-is-annual-recurring-revenue", "Annual recurring revenue (ARR)", "Recurring revenue, defined."),
        ("what-is-vanity-metrics", "Vanity metrics", "Numbers that look big but mislead."),
        ("what-is-contract-value", "Contract value", "Deal value, TCV and ACV."),
        R_GLOSS,
    ],
}
