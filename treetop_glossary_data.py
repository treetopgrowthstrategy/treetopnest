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

# ---- G2: market sizing + product-market fit + data types ----

TERMS["what-is-product-market-fit"] = {
    "term": "Product-Market Fit", "term_q": "Product-Market Fit",
    "title": "What is Product-Market Fit? Plain-English 2026 Definition | Treetop",
    "desc": "What is product-market fit? A plain-English definition, the signals you have it, how to measure it, and how it differs from go-to-market fit.",
    "og_title": "What is Product-Market Fit? Plain-English Definition",
    "og_desc": "The signals of product-market fit and how it differs from go-to-market fit.",
    "hero_sub": "Product-market fit is the milestone every startup chases and few can define. Here is a plain-English answer, the signals you have it, and how it differs from go-to-market fit.",
    "short_def": "Product-market fit (PMF) is the point at which a product satisfies a strong market demand, where customers want it, use it, keep using it, and tell others.",
    "definition": "PMF is when the market pulls the product out of your hands. It shows up as strong retention, organic word of mouth, and customers who would be genuinely disappointed if the product disappeared. It is the prerequisite for scaling: without it, growth spend just accelerates churn. PMF is about the product wanting; <a href=\"/what-is-go-to-market-fit\">go-to-market fit</a> is the separate question of whether you can reach and win those customers repeatably.",
    "why": "PMF is the dividing line between searching and scaling. Before it, the job is to find the product the market wants. After it, the job is to build the engine to sell it, which is where a <a href=\"/what-is-gtm-strategy\">GTM strategy</a> and a repeatable motion come in. Trying to scale before PMF is the most common and expensive startup mistake.",
    "watch_heading": "How to tell if you have it",
    "watch": [
        "Retention curves that flatten, meaning a cohort keeps using the product rather than decaying to zero.",
        "The Sean Ellis test: at least ~40 percent of users would be very disappointed without your product.",
        "Organic pull: word of mouth, inbound demand, and usage growing without proportional spend.",
        "Do not confuse early excitement for PMF. Trials and signups are not retention.",
    ],
    "faqs": [
        ("How do you measure product-market fit?", "Common signals include flattening retention curves, strong word of mouth, and the Sean Ellis survey, where 40 percent or more of users say they would be very disappointed without the product."),
        ("What is the difference between product-market fit and go-to-market fit?", "Product-market fit means people want the product. Go-to-market fit means you can reach and win them repeatably and profitably. You need PMF first, then GTM fit to scale."),
        ("Why is product-market fit so important?", "It is the prerequisite for scaling. Before PMF, growth spending accelerates churn. After it, the same spending compounds. It is the line between searching and scaling."),
    ],
    "related": [
        ("what-is-go-to-market-fit", "Go-to-market fit", "Reaching and winning customers repeatably."),
        ("what-is-activation-rate", "Activation rate", "Getting users to first value."),
        ("what-is-churn-rate", "Churn rate", "The retention side of PMF."),
        R_GLOSS,
    ],
}

TERMS["what-is-total-addressable-market"] = {
    "term": "Total Addressable Market (TAM)", "term_q": "Total Addressable Market (TAM)",
    "title": "What is Total Addressable Market (TAM)? Plain-English Definition | Treetop",
    "desc": "What is TAM? A plain-English definition with how to calculate it (top-down and bottom-up), a worked example, and how it relates to SAM and SOM.",
    "og_title": "What is Total Addressable Market (TAM)? Definition",
    "og_desc": "How to size TAM bottom-up, and how it relates to SAM and SOM.",
    "hero_sub": "TAM is the total revenue opportunity if you captured your entire market. Here is how to size it credibly, and how it relates to SAM and SOM.",
    "short_def": "Total addressable market (TAM) is the total revenue opportunity available if a product achieved 100 percent market share. It is the largest of the three market-sizing figures, above SAM and SOM.",
    "definition": "TAM answers how big the whole opportunity is. The credible way to size it is bottom-up: number of potential customers multiplied by what each would pay per year. The lazy way is top-down (citing a giant industry report), which investors distrust. TAM sits above <a href=\"/what-is-serviceable-addressable-market\">SAM</a> (the part you can actually serve) and <a href=\"/what-is-serviceable-obtainable-market\">SOM</a> (the part you can realistically win).",
    "formula": "Bottom-up TAM = Number of potential customers x Annual revenue per customer",
    "formula_example": "If there are 50,000 businesses that fit your buyer and each would pay $12,000 per year, bottom-up TAM = 50,000 x 12,000 = $600,000,000. That is far more credible than citing a $50B 'industry' number from a market report.",
    "why": "TAM frames the size of the prize and tells you whether an opportunity is venture-scale. But it is routinely abused: a huge top-down TAM means little if you cannot serve or reach most of it. Smart founders lead with a bottom-up TAM and then show the SAM and SOM that make it actionable, which is core to a credible <a href=\"/what-is-gtm-strategy\">GTM strategy</a>.",
    "watch": [
        "Bottom-up beats top-down. Multiplying customers by price is more defensible than a report's headline number.",
        "TAM is not your forecast. SOM is what you can realistically capture near term.",
        "Define the market honestly. A TAM that includes buyers you cannot serve is fiction.",
        "Revisit it. TAM changes as your product and pricing evolve.",
    ],
    "faqs": [
        ("How do you calculate TAM?", "The credible method is bottom-up: multiply the number of potential customers by the annual revenue each would generate. Top-down (citing an industry report) is weaker and investors discount it."),
        ("What is the difference between TAM, SAM, and SOM?", "TAM is the whole opportunity, SAM is the portion you can actually serve given your model and geography, and SOM is the portion you can realistically win in the near term."),
        ("Why does TAM matter to investors?", "It signals whether an opportunity is large enough to build a big company. But investors weigh a credible bottom-up TAM and a realistic SOM far more than a giant top-down number."),
    ],
    "related": [
        ("what-is-serviceable-addressable-market", "Serviceable addressable market (SAM)", "The market you can serve."),
        ("what-is-serviceable-obtainable-market", "Serviceable obtainable market (SOM)", "The market you can win."),
        ("what-is-gtm-strategy", "GTM strategy", "Turning market size into a plan."),
        R_GLOSS,
    ],
}

TERMS["what-is-serviceable-addressable-market"] = {
    "term": "Serviceable Addressable Market (SAM)", "term_q": "Serviceable Addressable Market (SAM)",
    "title": "What is Serviceable Addressable Market (SAM)? Definition | Treetop",
    "desc": "What is SAM? A plain-English definition with a worked example and how it sits between TAM and SOM.",
    "og_title": "What is Serviceable Addressable Market (SAM)? Definition",
    "og_desc": "The portion of TAM you can actually serve, with a worked example.",
    "hero_sub": "SAM is the slice of the total market you can actually serve given your product, model, and geography. Here is how to size it and where it fits.",
    "short_def": "Serviceable addressable market (SAM) is the portion of the total addressable market that your product can actually serve, given your business model, segment focus, and geography.",
    "definition": "TAM is everyone in theory; SAM is everyone you can realistically sell to today. It narrows TAM by the constraints that actually apply: who your product fits, where you can operate, and which segment you target. SAM sits between <a href=\"/what-is-total-addressable-market\">TAM</a> and <a href=\"/what-is-serviceable-obtainable-market\">SOM</a>, the portion you can win near term.",
    "formula": "SAM = TAM filtered to the segment, model, and geography you can actually serve",
    "formula_example": "If your TAM is 50,000 businesses worth $600M, but your product only fits mid-market companies in North America, that might be 12,000 businesses worth roughly $144M. That $144M SAM is a far more useful planning number than the headline TAM.",
    "why": "SAM is where strategy gets real. It forces you to define who you actually serve, which sharpens positioning, sales targeting, and channel choices. A clear SAM keeps you from chasing buyers your product does not fit, and it is the basis for the realistic <a href=\"/what-is-serviceable-obtainable-market\">SOM</a> you will actually forecast against.",
    "watch": [
        "Be honest about fit. SAM should exclude buyers your product genuinely cannot serve.",
        "Geography and compliance count. If you cannot legally or operationally serve a region, it is not in SAM.",
        "SAM evolves. New features or markets expand it; pruning a segment shrinks it.",
        "It is still not a forecast. SOM is the near-term target.",
    ],
    "faqs": [
        ("How is SAM different from TAM?", "TAM is the entire market opportunity; SAM is the portion you can actually serve given your product fit, business model, and geography. SAM is always smaller and more useful for planning."),
        ("How do you calculate SAM?", "Start with TAM and filter it down to the customers you can realistically serve: the right segment, the right geography, and a genuine product fit. Bottom-up sizing keeps it credible."),
        ("Why does SAM matter?", "It defines who you actually serve, which sharpens positioning, targeting, and channel strategy, and it is the basis for a realistic obtainable market (SOM)."),
    ],
    "related": [
        ("what-is-total-addressable-market", "Total addressable market (TAM)", "The whole opportunity."),
        ("what-is-serviceable-obtainable-market", "Serviceable obtainable market (SOM)", "What you can win near term."),
        ("what-is-gtm-strategy", "GTM strategy", "Turning market size into a plan."),
        R_GLOSS,
    ],
}

TERMS["what-is-serviceable-obtainable-market"] = {
    "term": "Serviceable Obtainable Market (SOM)", "term_q": "Serviceable Obtainable Market (SOM)",
    "title": "What is Serviceable Obtainable Market (SOM)? Definition | Treetop",
    "desc": "What is SOM? A plain-English definition with a worked example and why it is the market-sizing number that should drive your forecast.",
    "og_title": "What is Serviceable Obtainable Market (SOM)? Definition",
    "og_desc": "The realistic slice you can win, and why SOM should drive your forecast.",
    "hero_sub": "SOM is the share of the market you can realistically capture in the near term, and the number your forecast should actually be built on. Here is how to size it.",
    "short_def": "Serviceable obtainable market (SOM) is the portion of your serviceable market that you can realistically capture in the near term, given competition, resources, and reach.",
    "definition": "SOM is the grounded number. It takes your <a href=\"/what-is-serviceable-addressable-market\">SAM</a> and asks what share you can actually win in the next year or few, accounting for competitors, your sales capacity, and your go-to-market reach. It is the smallest of the three figures and the one a sober forecast is built on, sitting below <a href=\"/what-is-total-addressable-market\">TAM</a> and SAM.",
    "formula": "SOM = SAM x the realistic market share you can capture near term",
    "formula_example": "If your SAM is $144M and you can credibly win 3 percent of it in the next two years given your team and competition, SOM = 144,000,000 x 0.03 = $4.3M. That is the number to plan headcount and pipeline against, not the TAM.",
    "why": "SOM is where ambition meets reality. It is the number that should drive hiring, targets, and investor forecasts, because it reflects what you can actually capture, not what exists in theory. Founders who plan against TAM overspend; founders who plan against SOM build a model that holds up. It flows directly from your <a href=\"/what-is-gtm-strategy\">GTM strategy</a> and capacity.",
    "watch": [
        "Be realistic about share. Early-stage SOM is a small slice of SAM, not half of it.",
        "Account for competition. SOM should reflect who else is winning those customers.",
        "Tie it to capacity. Your sales and marketing reach caps what you can obtain.",
        "Use SOM, not TAM, for forecasts and hiring plans.",
    ],
    "faqs": [
        ("How do you calculate SOM?", "Multiply your serviceable market (SAM) by the share you can realistically capture in the near term, given competition, sales capacity, and reach. It is the smallest and most grounded of the three figures."),
        ("What is the difference between SAM and SOM?", "SAM is everyone you could serve; SOM is the realistic portion you can actually win near term given competition and resources. SOM should drive your forecast."),
        ("Which market size should I use for forecasting?", "SOM. TAM and SAM frame the opportunity, but SOM reflects what you can realistically capture, so it is the right basis for targets, hiring, and forecasts."),
    ],
    "related": [
        ("what-is-serviceable-addressable-market", "Serviceable addressable market (SAM)", "The market you can serve."),
        ("what-is-total-addressable-market", "Total addressable market (TAM)", "The whole opportunity."),
        ("what-is-gtm-strategy", "GTM strategy", "Turning market size into a plan."),
        R_GLOSS,
    ],
}

TERMS["what-is-first-party-data"] = {
    "term": "First-Party Data", "term_q": "First-Party Data",
    "title": "What is First-Party Data? Plain-English 2026 Definition | Treetop",
    "desc": "What is first-party data? A plain-English definition, examples, why it matters more in 2026, and how it differs from zero-party and third-party data.",
    "og_title": "What is First-Party Data? Plain-English Definition",
    "og_desc": "Why first-party data is the most valuable data you own in 2026.",
    "hero_sub": "First-party data is the information you collect directly from your own customers, and in 2026 it is the most valuable data you own. Here is why.",
    "short_def": "First-party data is information a company collects directly from its own audience through its own channels, such as website behavior, purchase history, and account activity.",
    "definition": "First-party data comes straight from your relationship with the customer: what they bought, how they use your product, what they clicked on your site. It is accurate, consent-based, and uniquely yours, which makes it more reliable than data bought from outside. It differs from <a href=\"/what-is-zero-party-data\">zero-party data</a> (which customers proactively give you) and <a href=\"/what-is-third-party-data\">third-party data</a> (bought from outside aggregators).",
    "why": "As third-party cookies disappear and privacy rules tighten, first-party data has become the foundation of modern marketing. It powers personalization, segmentation, and measurement that you actually own and that respects consent. Companies that invest in collecting and activating first-party data have a durable advantage; those that relied on third-party data are scrambling. AI makes first-party data far more usable by surfacing patterns at scale.",
    "watch": [
        "Collection requires value exchange. Customers share data when they get something for it.",
        "Consent and governance matter. First-party data must still be collected and used transparently.",
        "It is only as good as your tracking. Clean, well-structured data beats more data.",
        "Activate it. Data sitting in a warehouse does nothing; the value is in using it.",
    ],
    "faqs": [
        ("What is an example of first-party data?", "Purchase history, website and product usage, email engagement, survey responses, and account activity. Anything you collect directly from your own customers through your own channels."),
        ("Why is first-party data more important in 2026?", "Because third-party cookies are going away and privacy rules are tightening. First-party data is consent-based, accurate, and owned by you, making it the durable foundation for personalization and measurement."),
        ("What is the difference between first-party and third-party data?", "First-party data you collect directly from your own audience. Third-party data is purchased from outside aggregators who collected it elsewhere. First-party is more accurate and privacy-safe."),
    ],
    "related": [
        ("what-is-zero-party-data", "Zero-party data", "Data customers proactively give you."),
        ("what-is-third-party-data", "Third-party data", "Data bought from outside sources."),
        ("what-is-intent-data", "Intent data", "Signals of buying intent."),
        R_GLOSS,
    ],
}

TERMS["what-is-third-party-data"] = {
    "term": "Third-Party Data", "term_q": "Third-Party Data",
    "title": "What is Third-Party Data? Plain-English 2026 Definition | Treetop",
    "desc": "What is third-party data? A plain-English definition, examples, why it is declining, and how it differs from first-party and zero-party data.",
    "og_title": "What is Third-Party Data? Plain-English Definition",
    "og_desc": "What third-party data is and why it is in decline in 2026.",
    "hero_sub": "Third-party data is information bought from outside aggregators, and in 2026 it is in steep decline. Here is what it is and why its era is ending.",
    "short_def": "Third-party data is information collected by an outside party that did not have a direct relationship with the consumer, then aggregated and sold to other companies for targeting.",
    "definition": "Third-party data is bought, not earned. Aggregators collect it across many sites and sources, then sell it for ad targeting and enrichment. It once powered much of digital advertising, but it is less accurate than first-party data and increasingly restricted by privacy laws and the death of third-party cookies. It contrasts with <a href=\"/what-is-first-party-data\">first-party data</a> (collected directly) and <a href=\"/what-is-zero-party-data\">zero-party data</a> (volunteered by the customer).",
    "why": "Understanding third-party data matters mostly because of its decline. Browser changes and privacy regulation have gutted its reliability, pushing marketers toward first-party and zero-party data. There are still legitimate uses (B2B firmographic enrichment, for instance), but building a strategy on third-party data is now building on sand. The shift is one of the defining changes in 2026 marketing.",
    "watch": [
        "Accuracy is lower. It was collected without a direct relationship, so it is often stale or inferred.",
        "Privacy risk. Regulations increasingly restrict how it can be collected and used.",
        "The cookie is dying. Much third-party data depended on tracking that is disappearing.",
        "Shift the strategy. Invest in first-party and zero-party data for durability.",
    ],
    "faqs": [
        ("What is an example of third-party data?", "Audience segments and consumer profiles bought from data brokers and ad platforms, assembled from activity across many sites the buyer has no direct relationship with."),
        ("Why is third-party data declining?", "Browsers are phasing out third-party cookies and privacy laws are tightening, which undercuts how this data is collected. It is becoming less available, less accurate, and riskier to use."),
        ("Should I still use third-party data?", "Selectively. Some uses like B2B firmographic enrichment remain valid, but it should not be the foundation of your strategy. Invest in first-party and zero-party data instead."),
    ],
    "related": [
        ("what-is-first-party-data", "First-party data", "Data you collect directly."),
        ("what-is-zero-party-data", "Zero-party data", "Data customers volunteer."),
        ("what-is-intent-data", "Intent data", "Signals of buying intent."),
        R_GLOSS,
    ],
}

TERMS["what-is-zero-party-data"] = {
    "term": "Zero-Party Data", "term_q": "Zero-Party Data",
    "title": "What is Zero-Party Data? Plain-English 2026 Definition | Treetop",
    "desc": "What is zero-party data? A plain-English definition, examples, why it is so valuable, and how it differs from first-party data.",
    "og_title": "What is Zero-Party Data? Plain-English Definition",
    "og_desc": "Data customers proactively give you, and why it is gold in 2026.",
    "hero_sub": "Zero-party data is information customers proactively and willingly give you, which makes it the cleanest, most consented data of all. Here is what it is.",
    "short_def": "Zero-party data is information that a customer intentionally and proactively shares with a brand, such as preferences, intentions, and stated needs, usually through surveys, quizzes, or preference centers.",
    "definition": "Where first-party data is observed (you watch what customers do), zero-party data is declared (customers tell you directly). It comes from preference centers, quizzes, polls, and onboarding questions. Because the customer volunteers it knowingly, it is accurate, fully consented, and ideal for personalization. It is a subset distinct from <a href=\"/what-is-first-party-data\">first-party data</a>, which you collect through behavior rather than direct declaration.",
    "why": "Zero-party data is the cleanest fuel for personalization in a privacy-first world. Because customers chose to share it, there is no consent ambiguity and no accuracy guesswork, they told you what they want. It powers tailored recommendations, segmentation, and messaging that feel relevant rather than creepy. The challenge is the value exchange: customers share when they get something useful (a better recommendation, a tailored experience) in return.",
    "watch": [
        "It requires a value exchange. Customers volunteer data when they get a clear benefit.",
        "Keep it current. Stated preferences change; refresh them periodically.",
        "Use what you collect. Asking for preferences then ignoring them erodes trust.",
        "Do not over-ask. Long forms kill the value exchange; collect progressively.",
    ],
    "faqs": [
        ("What is the difference between zero-party and first-party data?", "Zero-party data is declared: the customer proactively tells you (preferences, intentions). First-party data is observed: you collect it from their behavior. Zero-party is the most explicit and consented."),
        ("What is an example of zero-party data?", "A style quiz, a preference center selection, a survey response, or onboarding questions where the customer directly states what they want or need."),
        ("Why is zero-party data valuable?", "Because the customer shared it knowingly, it is accurate and fully consented, making it ideal for personalization in a privacy-first world without the guesswork or consent risk of other data."),
    ],
    "related": [
        ("what-is-first-party-data", "First-party data", "Data you collect from behavior."),
        ("what-is-third-party-data", "Third-party data", "Data bought from outside."),
        ("what-is-intent-data", "Intent data", "Signals of buying intent."),
        R_GLOSS,
    ],
}

# ---- G3: brand / category / positioning + AI-era search ----

TERMS["what-is-intent-data"] = {
    "term": "Intent Data", "term_q": "Intent Data",
    "title": "What is Intent Data? Plain-English 2026 Definition | Treetop",
    "desc": "What is intent data? A plain-English definition, the types, examples, and how B2B teams use it to reach buyers who are actively researching.",
    "og_title": "What is Intent Data? Plain-English Definition",
    "og_desc": "First-party vs third-party intent data, and how B2B teams use it.",
    "hero_sub": "Intent data tells you which accounts are actively researching what you sell, so you reach them while they are in-market. Here is how it works.",
    "short_def": "Intent data is information that signals a buyer is actively researching a product or category, used to identify and prioritize accounts that are likely in a buying cycle.",
    "definition": "Intent data captures buying signals: content consumed, searches run, pages visited, topics surged on. First-party intent comes from your own properties (someone reading your pricing page repeatedly); third-party intent is aggregated across the web by providers who detect topic surges at the account level. Used well, it points sales and marketing at accounts that are in-market now, complementing your <a href=\"/what-is-first-party-data\">first-party data</a>.",
    "why": "Most of a buyer's research happens before they ever talk to sales. Intent data lets you reach those accounts during that window rather than after a competitor has. For B2B teams running account-based motions, it is the difference between guessing who to prioritize and knowing. It pairs naturally with the kind of signal-based outreach that AI now makes practical at scale.",
    "watch": [
        "Signal is noisy. Intent data shows interest, not a guaranteed buyer. Treat it as a prioritization input.",
        "First-party intent is strongest. Activity on your own site beats inferred third-party surges.",
        "Act fast. Intent decays; a surge is only useful while it is hot.",
        "Combine with fit. High intent on a poor-fit account is still a poor-fit account.",
    ],
    "faqs": [
        ("What is an example of intent data?", "Repeated visits to your pricing page (first-party), or a third-party provider detecting that an account is surging on searches and content about your category across the web."),
        ("What is the difference between first-party and third-party intent data?", "First-party intent comes from activity on your own properties and is the strongest signal. Third-party intent is aggregated across the web and detects category research you cannot see directly."),
        ("How do B2B teams use intent data?", "To prioritize accounts that are actively researching, so sales and marketing can reach them during the buying window. It works best combined with fit data and fast follow-up."),
    ],
    "related": [
        ("what-is-first-party-data", "First-party data", "Data you collect directly."),
        ("what-is-dark-funnel", "Dark funnel", "The research you cannot track."),
        ("what-is-gtm-strategy", "GTM strategy", "Turning signals into a motion."),
        R_GLOSS,
    ],
}

TERMS["what-is-brand-equity"] = {
    "term": "Brand Equity", "term_q": "Brand Equity",
    "title": "What is Brand Equity? Plain-English 2026 Definition | Treetop",
    "desc": "What is brand equity? A plain-English definition, what drives it, how it shows up in pricing and demand, and how to build it.",
    "og_title": "What is Brand Equity? Plain-English Definition",
    "og_desc": "What brand equity is, what drives it, and why it shows up in pricing power.",
    "hero_sub": "Brand equity is the commercial value of how customers feel about your brand, and it shows up in pricing power and demand. Here is what drives it.",
    "short_def": "Brand equity is the commercial value a brand holds in customers' minds, the premium in awareness, trust, and preference that lets a brand command higher prices and win demand more easily.",
    "definition": "Brand equity is the difference between a generic product and yours in the customer's eyes. It is built from awareness, perceived quality, associations, and loyalty. Strong brand equity shows up concretely: customers pay more, choose you by default, and forgive the occasional misstep. It is the asset behind durable pricing power and lower acquisition costs, and it compounds with category leadership like becoming a <a href=\"/what-is-category-king\">category king</a>.",
    "why": "Brand equity is what makes marketing cheaper and pricing stronger over time. A brand customers trust converts better, retains longer, and needs less paid acquisition to grow, because demand comes to it. It is hard to measure precisely, which is why some teams neglect it in favor of short-term metrics, but it is one of the most durable competitive advantages a company can build.",
    "watch": [
        "It is built slowly and lost quickly. Consistency over years builds it; a betrayal of trust erodes it fast.",
        "Hard to measure does not mean unimportant. Use brand-tracking, share of voice, and pricing power as proxies.",
        "It is not just a logo. Equity lives in experience, quality, and associations, not visual identity alone.",
        "Do not trade it for short-term wins. Discounting and off-brand stunts can quietly drain equity.",
    ],
    "faqs": [
        ("What drives brand equity?", "Awareness, perceived quality, strong and positive associations, and customer loyalty. Together they create preference and trust that customers will pay a premium for."),
        ("How do you measure brand equity?", "There is no single number, but proxies include brand-tracking surveys, share of voice, pricing power, unaided awareness, and the share of demand that is direct or organic rather than paid."),
        ("Why does brand equity matter?", "It lowers acquisition cost, supports higher prices, and improves retention, because customers choose and trust the brand by default. It is one of the most durable competitive advantages."),
    ],
    "related": [
        ("what-is-category-king", "Category king", "The dominant brand in a category."),
        ("what-is-share-of-voice", "Share of voice", "Your slice of market attention."),
        ("what-is-category-creation", "Category creation", "Building a new market."),
        R_GLOSS,
    ],
}

TERMS["what-is-share-of-voice"] = {
    "term": "Share of Voice (SOV)", "term_q": "Share of Voice",
    "title": "What is Share of Voice? Plain-English 2026 Definition | Treetop",
    "desc": "What is share of voice? A plain-English definition with the formula, a worked example, and why SOV predicts market share growth.",
    "og_title": "What is Share of Voice? Plain-English Definition",
    "og_desc": "The SOV formula and why it predicts market-share growth.",
    "hero_sub": "Share of voice is your brand's slice of the total attention in your market, and it tends to predict where market share is heading. Here is how to measure it.",
    "short_def": "Share of voice (SOV) is the percentage of total market presence (advertising, mentions, search visibility, or conversation) that your brand owns relative to competitors.",
    "definition": "SOV measures how much of the market's attention you command. It can be calculated across channels: ad spend, organic search visibility, social mentions, or press coverage. The classic principle is that when your share of voice exceeds your market share, you tend to gain share over time, and when it lags, you tend to lose it. It is closely tied to <a href=\"/what-is-brand-equity\">brand equity</a> and category leadership.",
    "formula": "Share of Voice = (Your brand's presence / Total market presence across all competitors) x 100",
    "formula_example": "If your brand accounts for 8,000 of 50,000 total category mentions this quarter, SOV = (8,000 / 50,000) x 100 = 16 percent. If your market share is only 10 percent, that excess share of voice suggests you are positioned to gain share.",
    "why": "Share of voice is a leading indicator of market share. Brands that consistently out-shout their share of market tend to grow into that voice, while brands that go quiet tend to shrink. It turns the abstract goal of 'building the brand' into a measurable target you can track against competitors, channel by channel.",
    "watch": [
        "Pick the right channel. SOV in paid, organic, social, and PR are different numbers; define which you mean.",
        "Quality matters, not just volume. Negative mentions are still voice but not the kind you want.",
        "Compare to market share. Excess SOV is the signal worth acting on.",
        "Track the trend. A declining SOV is an early warning even if the level looks fine.",
    ],
    "faqs": [
        ("How do you calculate share of voice?", "Divide your brand's presence (mentions, ad spend, search visibility) by the total across all competitors, times 100. The channel you measure should match your goal."),
        ("Why does share of voice matter?", "It is a leading indicator of market share. Brands whose share of voice exceeds their market share tend to gain share over time; those that go quiet tend to lose it."),
        ("What is excess share of voice?", "The amount by which your share of voice exceeds your market share. A positive gap signals you are positioned to grow; a negative gap signals risk of decline."),
    ],
    "related": [
        ("what-is-brand-equity", "Brand equity", "The value of how customers see you."),
        ("what-is-category-king", "Category king", "The dominant brand in a category."),
        ("what-is-vanity-metrics", "Vanity metrics", "Attention that does not convert."),
        R_GLOSS,
    ],
}

TERMS["what-is-vanity-metrics"] = {
    "term": "Vanity Metrics", "term_q": "Vanity Metrics",
    "title": "What is a Vanity Metric? Plain-English 2026 Definition | Treetop",
    "desc": "What are vanity metrics? A plain-English definition, examples, how they differ from actionable metrics, and how to avoid being fooled by them.",
    "og_title": "What is a Vanity Metric? Plain-English Definition",
    "og_desc": "What vanity metrics are and how to replace them with actionable ones.",
    "hero_sub": "Vanity metrics look impressive and tell you nothing useful. Here is how to spot them and replace them with metrics that actually inform decisions.",
    "short_def": "Vanity metrics are numbers that look impressive but do not inform decisions or correlate with real business outcomes, such as raw page views, registered users, or social followers.",
    "definition": "A vanity metric goes up and feels good but does not change what you do next. Total signups, impressions, and follower counts are classic examples: big numbers that hide whether anyone activated, retained, or paid. The test is simple: if a metric cannot fail and cannot change a decision, it is vanity. The cure is to track actionable metrics tied to value, anchored by a <a href=\"/what-is-northstar-metric\">north star metric</a>.",
    "why": "Vanity metrics are dangerous because they create the feeling of progress without the substance. Teams optimize the impressive number while the business that matters stalls. Replacing them with actionable metrics (activation, retention, revenue, conversion) forces honesty and better decisions. It is one of the most common traps in startup and marketing reporting.",
    "watch_heading": "How to spot one",
    "watch": [
        "Ask if it can change a decision. If not, it is vanity.",
        "Ask if it can go down. Cumulative totals that only ever rise are usually vanity.",
        "Prefer rates and cohorts over raw totals. Conversion and retention beat impressions and signups.",
        "Anchor on a north star and its real input metrics, not the metrics that flatter.",
    ],
    "faqs": [
        ("What are examples of vanity metrics?", "Total page views, registered users, app downloads, social followers, and impressions. They look big but do not reveal whether people activated, retained, or paid."),
        ("How are vanity metrics different from actionable metrics?", "Actionable metrics inform a decision and can fail, like activation rate, retention, and conversion. Vanity metrics only rise and rarely change what you do next."),
        ("How do I avoid vanity metrics?", "Anchor reporting on a north star metric and its real inputs, prefer rates and cohorts over raw totals, and ask of every metric whether it could change a decision."),
    ],
    "related": [
        ("what-is-northstar-metric", "North Star metric", "The metric that captures value."),
        ("what-is-activation-rate", "Activation rate", "An actionable early metric."),
        ("what-is-share-of-voice", "Share of voice", "Attention measured meaningfully."),
        R_GLOSS,
    ],
}

TERMS["what-is-dark-funnel"] = {
    "term": "Dark Funnel", "term_q": "the Dark Funnel",
    "title": "What is the Dark Funnel? Plain-English 2026 Definition | Treetop",
    "desc": "What is the dark funnel? A plain-English definition, examples of untrackable touchpoints, why it matters in B2B, and how to work with it.",
    "og_title": "What is the Dark Funnel? Plain-English Definition",
    "og_desc": "The untrackable touchpoints that shape B2B buying, and how to work with them.",
    "hero_sub": "The dark funnel is all the buyer research and influence you cannot track, and in B2B it is where most decisions actually form. Here is what it is.",
    "short_def": "The dark funnel is the collection of untrackable touchpoints (private communities, peer conversations, podcasts, word of mouth) that influence buyers before they ever appear in your analytics.",
    "definition": "Most attribution tools see only the trackable last clicks. The dark funnel is everything before and around that: Slack communities, peer recommendations, podcasts, social feeds, and direct conversations that shape a buyer's shortlist invisibly. By the time a buyer fills out a form, the real decision was often already influenced in the dark. It is closely related to <a href=\"/what-is-intent-data\">intent data</a> and explains why attribution alone misleads.",
    "why": "The dark funnel matters because attribution models systematically undercredit it, leading teams to over-invest in the trackable channels and under-invest in brand, community, and word of mouth, which is where much B2B buying actually starts. Accepting that you cannot track everything, and measuring with surveys (how did you hear about us) and overall pipeline lift, leads to better decisions than chasing perfect attribution.",
    "watch": [
        "Attribution understates it. Self-reported sourcing often reveals channels your tools never saw.",
        "Do not kill what you cannot track. Brand, community, and word of mouth work even when invisible.",
        "Use surveys. A simple 'how did you hear about us' recovers signal the dark funnel hides.",
        "Measure lift, not just clicks. Watch overall pipeline against brand and community investment.",
    ],
    "faqs": [
        ("What is an example of the dark funnel?", "A buyer hears your brand on a podcast, sees it discussed in a private Slack community, and gets a peer recommendation, then later searches your name directly. The influence is real but invisible to attribution tools."),
        ("Why does the dark funnel matter?", "Because attribution undercredits it, teams over-invest in trackable channels and under-invest in brand and community, where much B2B buying actually begins. Recognizing it leads to better budget decisions."),
        ("How do you measure the dark funnel?", "You cannot track it precisely, but self-reported attribution surveys ('how did you hear about us') and overall pipeline lift against brand investment recover much of the signal."),
    ],
    "related": [
        ("what-is-intent-data", "Intent data", "Signals of in-market research."),
        ("what-is-share-of-voice", "Share of voice", "Brand presence that shapes demand."),
        ("what-is-brand-equity", "Brand equity", "Why buyers arrive pre-sold."),
        R_GLOSS,
    ],
}

TERMS["what-is-category-creation"] = {
    "term": "Category Creation", "term_q": "Category Creation",
    "title": "What is Category Creation? Plain-English 2026 Definition | Treetop",
    "desc": "What is category creation? A plain-English definition, examples, why it is powerful and risky, and how it relates to becoming a category king.",
    "og_title": "What is Category Creation? Plain-English Definition",
    "og_desc": "What category creation is, why it is powerful, and why it is risky.",
    "hero_sub": "Category creation is defining a new market and teaching the world it exists. Done right it is the most durable advantage in business; done wrong it is an expensive way to fail.",
    "short_def": "Category creation is the strategy of defining and naming a new market category, then establishing your company as the leader of it, rather than competing in an existing one.",
    "definition": "Instead of fighting for share in a crowded market, category creation invents a new one: a new way of framing a problem and the solution to it. The creator educates the market on the problem, names the category, and positions itself as the obvious leader. Done well, the creator usually becomes the <a href=\"/what-is-category-king\">category king</a> and captures the majority of the category's value. Done poorly, it is a costly exercise in educating a market that never forms.",
    "why": "Category creation is powerful because the company that defines a category often dominates it, setting the terms competitors must play by and capturing a disproportionate share of profits and <a href=\"/what-is-brand-equity\">brand equity</a>. It is risky because it requires educating the market, which is slow and expensive, and because not every problem deserves a new category. It is a strategy for genuinely novel solutions, not a marketing relabel.",
    "watch": [
        "It requires market education, which is slow and costly. Budget for it.",
        "Not everything is a category. Relabeling an existing market fools no one.",
        "You must own the problem, not just the product name. Frame the problem first.",
        "Winner takes most, so commit fully or do not start. Half-hearted category creation just funds competitors.",
    ],
    "faqs": [
        ("What is an example of category creation?", "Companies that named and defined a new market (such as marketing automation or customer data platforms) and then led it. They taught buyers the problem framing, then owned the resulting category."),
        ("Why is category creation risky?", "It requires educating the market on a problem and solution that did not have a name, which is slow and expensive. If the category never forms, the spend is wasted, and you may educate buyers who choose a competitor."),
        ("How does category creation relate to being a category king?", "The company that successfully creates a category usually becomes its king, the dominant leader that captures most of the category's value and defines the terms others compete on."),
    ],
    "related": [
        ("what-is-category-king", "Category king", "The dominant brand in a category."),
        ("what-is-brand-equity", "Brand equity", "The asset category leaders build."),
        ("what-is-gtm-strategy", "GTM strategy", "Taking a category to market."),
        R_GLOSS,
    ],
}

TERMS["what-is-category-king"] = {
    "term": "Category King", "term_q": "a Category King",
    "title": "What is a Category King? Plain-English 2026 Definition | Treetop",
    "desc": "What is a category king? A plain-English definition, examples, why category kings capture most of the value, and how a company becomes one.",
    "og_title": "What is a Category King? Plain-English Definition",
    "og_desc": "Why category kings capture most of a market's value.",
    "hero_sub": "A category king is the company that dominates its market category and captures most of its value. Here is what makes one and why the position is so powerful.",
    "short_def": "A category king is the company that dominates a market category, capturing the majority of its economics, mindshare, and growth, often the company that created or defined the category.",
    "definition": "In most categories, the leader does not just win a bit more; it wins most. Research on category dynamics finds that the category king frequently captures a large majority of the total profit pool. Kings earn the position through a combination of a strong product, a defining point of view on the category, and relentless presence, usually after <a href=\"/what-is-category-creation\">creating the category</a>. The result is durable <a href=\"/what-is-brand-equity\">brand equity</a> and pricing power.",
    "why": "Being a category king matters because category economics are winner-take-most. The king sets the agenda, attracts the best talent and partners, and enjoys lower acquisition costs because buyers think of it first. For founders, this is why defining and leading a category can be worth more than building a slightly better product in a crowded one, the position itself is the moat.",
    "watch": [
        "Kingship follows category leadership, not just product quality. The framing matters as much as the features.",
        "It is defensible but not permanent. Kings that stop innovating get unseated.",
        "Mindshare compounds. Being top-of-mind lowers acquisition cost over time.",
        "You usually have to create or redefine the category to become its king.",
    ],
    "faqs": [
        ("What makes a company a category king?", "Dominating a market category in mindshare and economics, usually by creating or defining the category, holding a strong point of view, and maintaining relentless presence, which compounds into durable advantage."),
        ("Why do category kings capture most of the value?", "Category economics are winner-take-most. The leader becomes the default choice, attracts the best partners and talent, and enjoys lower acquisition costs, capturing a disproportionate share of the profit pool."),
        ("How does a company become a category king?", "Most often by creating or redefining a category and then leading the market education, combining a strong product with a defining point of view and consistent presence until it becomes the default."),
    ],
    "related": [
        ("what-is-category-creation", "Category creation", "Defining a new market."),
        ("what-is-brand-equity", "Brand equity", "The asset kings accumulate."),
        ("what-is-share-of-voice", "Share of voice", "The presence kings dominate."),
        R_GLOSS,
    ],
}

TERMS["what-is-geo"] = {
    "term": "Generative Engine Optimization (GEO)", "term_q": "Generative Engine Optimization (GEO)",
    "title": "What is Generative Engine Optimization (GEO)? Definition | Treetop",
    "desc": "What is GEO? A plain-English definition of generative engine optimization, how it differs from SEO and AEO, and how to get cited by AI answer engines.",
    "og_title": "What is Generative Engine Optimization (GEO)? Definition",
    "og_desc": "How to get your content cited by AI answer engines in 2026.",
    "hero_sub": "GEO is optimizing your content to be cited by AI answer engines like ChatGPT, Claude, and Google's AI overviews. Here is what it means and how it differs from SEO.",
    "short_def": "Generative engine optimization (GEO) is the practice of optimizing content so that AI generative engines (ChatGPT, Claude, Perplexity, Google AI overviews) cite and surface it in their answers.",
    "definition": "As people increasingly get answers from AI assistants instead of clicking blue links, GEO is the discipline of being the source those assistants quote. It overlaps with SEO but optimizes for being synthesized and cited rather than ranked: clear structure, factual accuracy, quotable statements, and strong topical authority. It is closely related to <a href=\"/what-is-aeo\">answer engine optimization (AEO)</a> and is a response to the rise of <a href=\"/what-is-zero-click-search\">zero-click search</a>.",
    "why": "GEO matters because a growing share of research never reaches a website; the answer is generated and the source is cited, or not. Brands that structure content to be quotable and authoritative get represented in AI answers; those that do not become invisible in the channel that is rapidly growing. It is the SEO of the AI era, and treating it as optional is the same mistake as ignoring search was twenty years ago.",
    "watch": [
        "Clarity and structure win. AI engines favor content that is well-organized and quotable.",
        "Accuracy and authority matter more than keyword tricks. Engines cite trustworthy sources.",
        "Track AI visibility, not just rankings. Being cited in answers is the new goal.",
        "It complements SEO, it does not replace it. Do both.",
    ],
    "faqs": [
        ("What is the difference between GEO and SEO?", "SEO optimizes to rank in traditional search results. GEO optimizes to be cited and synthesized by AI generative engines. They overlap, but GEO emphasizes quotable, structured, authoritative content over ranking signals."),
        ("How do you optimize for AI answer engines?", "Structure content clearly, state facts and conclusions plainly so they are quotable, build genuine topical authority, and keep information accurate and current. AI engines cite sources they can trust and easily extract."),
        ("Is GEO the same as AEO?", "They are closely related. GEO focuses on generative engines that synthesize answers, while AEO (answer engine optimization) is the broader practice of being the answer. In practice the tactics overlap heavily."),
    ],
    "related": [
        ("what-is-aeo", "Answer engine optimization (AEO)", "Being the answer, not a link."),
        ("what-is-zero-click-search", "Zero-click search", "Searches that never leave the page."),
        ("what-is-share-of-voice", "Share of voice", "Presence in the new channels."),
        R_GLOSS,
    ],
}

TERMS["what-is-aeo"] = {
    "term": "Answer Engine Optimization (AEO)", "term_q": "Answer Engine Optimization (AEO)",
    "title": "What is Answer Engine Optimization (AEO)? Definition | Treetop",
    "desc": "What is AEO? A plain-English definition of answer engine optimization, how it differs from SEO and GEO, and how to be the answer instead of a link.",
    "og_title": "What is Answer Engine Optimization (AEO)? Definition",
    "og_desc": "How to be the answer, not just a link, in the AI search era.",
    "hero_sub": "AEO is optimizing to be the direct answer that search and AI engines surface, not just a link in a list. Here is what it means and how to do it.",
    "short_def": "Answer engine optimization (AEO) is the practice of structuring content so search and AI answer engines return it directly as the answer to a question, in featured snippets, voice results, and AI summaries.",
    "definition": "AEO optimizes for the moment a user asks a question and gets a direct answer rather than a list of links. That means writing clear question-and-answer content, using structured data, and stating answers concisely enough to be extracted. It powers featured snippets, voice assistants, and AI summaries. It overlaps heavily with <a href=\"/what-is-geo\">generative engine optimization (GEO)</a> and is a direct response to <a href=\"/what-is-zero-click-search\">zero-click search</a>.",
    "why": "AEO matters because being the answer is the new page-one. As featured snippets, voice search, and AI overviews intercept more queries, the content that is structured to be the answer wins the visibility, and the content that is not disappears. For most businesses, the practical move is to write genuinely useful question-and-answer content (like the FAQ sections on these pages) with clean structure and schema.",
    "watch": [
        "Answer the question directly and early. Engines extract concise, clear answers.",
        "Use structured data and FAQ markup so engines can parse your answers.",
        "Match real questions. Write to how people actually ask, not to keywords alone.",
        "It complements SEO and GEO. Treat them as one content discipline.",
    ],
    "faqs": [
        ("What is the difference between AEO and SEO?", "SEO aims to rank a page in results; AEO aims to be the direct answer, in featured snippets, voice results, and AI summaries. AEO emphasizes concise, structured, question-and-answer content."),
        ("How do you optimize for answer engines?", "Answer questions directly and early, use FAQ and structured-data markup, write to how people actually ask, and keep answers concise and accurate so engines can extract them."),
        ("Is AEO the same as GEO?", "They overlap heavily. AEO is about being the answer across search and AI engines; GEO focuses specifically on being cited by generative AI engines. The tactics are largely shared."),
    ],
    "related": [
        ("what-is-geo", "Generative engine optimization (GEO)", "Being cited by AI engines."),
        ("what-is-zero-click-search", "Zero-click search", "Searches resolved on the page."),
        ("what-is-share-of-voice", "Share of voice", "Presence across channels."),
        R_GLOSS,
    ],
}

TERMS["what-is-zero-click-search"] = {
    "term": "Zero-Click Search", "term_q": "Zero-Click Search",
    "title": "What is Zero-Click Search? Plain-English 2026 Definition | Treetop",
    "desc": "What is zero-click search? A plain-English definition, why it is growing, what it means for traffic, and how to stay visible.",
    "og_title": "What is Zero-Click Search? Plain-English Definition",
    "og_desc": "Why zero-click search is growing and how to stay visible.",
    "hero_sub": "A zero-click search is one where the user gets their answer without clicking any result. It is a growing share of all search, and it changes how visibility works.",
    "short_def": "A zero-click search is a search where the user finds the answer directly on the results page (in a featured snippet, knowledge panel, or AI overview) without clicking through to any website.",
    "definition": "More and more searches end on the results page itself. Featured snippets, knowledge panels, and AI overviews answer the query in place, so the user never clicks. For some informational queries, the majority of searches are now zero-click. This reshapes SEO: ranking first matters less if no one clicks, which pushes brands toward <a href=\"/what-is-aeo\">answer engine optimization</a> and <a href=\"/what-is-geo\">generative engine optimization</a> to stay present even when the click never happens.",
    "why": "Zero-click search matters because it breaks the old SEO bargain of rank-then-click-then-convert. If the answer is given on the page, visibility no longer guarantees traffic. The response is to optimize for presence in the answer itself (being the cited source or featured snippet), to focus on queries that still drive clicks (commercial, comparison, and deep how-to intent), and to build brand so people seek you directly.",
    "watch": [
        "Traffic and rankings diverge. You can rank and still lose the click.",
        "Aim to be the answer, not just a link, for informational queries.",
        "Prioritize click-worthy intent. Commercial and deep how-to queries still convert.",
        "Build brand and direct demand so you are less dependent on the click.",
    ],
    "faqs": [
        ("What is an example of a zero-click search?", "Searching a definition, a conversion, or a quick fact and getting the answer in a featured snippet or AI overview at the top of the page, without clicking any website."),
        ("Why is zero-click search growing?", "Search engines and AI increasingly answer queries directly on the results page through snippets, knowledge panels, and AI overviews, so users get what they need without clicking through."),
        ("How do you stay visible with zero-click search?", "Optimize to be the cited answer (AEO and GEO), focus on commercial and deep how-to queries that still earn clicks, and build brand so users seek you directly rather than via a generic search."),
    ],
    "related": [
        ("what-is-aeo", "Answer engine optimization (AEO)", "Being the answer on the page."),
        ("what-is-geo", "Generative engine optimization (GEO)", "Being cited by AI engines."),
        ("what-is-share-of-voice", "Share of voice", "Presence beyond the click."),
        R_GLOSS,
    ],
}

