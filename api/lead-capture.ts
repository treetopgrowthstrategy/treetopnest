// Vercel-native serverless function for lead capture + asset delivery.
// Moved here (root api/) from src/pages/api/ because Astro's Vercel adapter
// conflicts with the existing root api/ functions and the Astro /api routes
// were not being served (they 404'd in production). Matches the pattern of
// api/quiz-submit.ts, api/calendar.js, etc.
//
// Handles three shapes:
//   - Popup/sticky bar:  { email, asset, source }      -> emails the asset
//   - Book a call:       { ...contact, source:'book-a-call' } -> emails booking link
//   - Inline form:       { first_name, last_name, email, company, message/gain, source }

const RESEND_API_KEY   = process.env.RESEND_API_KEY;
const FROM_EMAIL       = process.env.RESEND_FROM || process.env.MAILGUN_FROM || 'Bill Colbert <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL       = process.env.BILL_NOTIFY_EMAIL || 'william.colbert@treetopgrowthstrategy.com';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = (process.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT').split('/')[0];
const AIRTABLE_LEADS_TABLE = process.env.AIRTABLE_LEADS_TABLE || 'tbl7PEKkdYKafCEdC'; // "TTGS Website Leads"
const BOOKING_LINK     = process.env.BOOKING_LINK_BOOK_A_CALL || 'https://calendar.app.google/HhtvptQrmaChgyzt6';
const SITE             = 'https://treetopgrowthstrategy.com';

type AssetSpec = { subject: string; link: string; intro: string; followup?: string };

const ASSETS: Record<string, AssetSpec> = {
  '2026 Fractional Executive Pricing Report': {
    subject: 'The 2026 Fractional Executive Pricing Report',
    link: `${SITE}/2026-fractional-executive-pricing-report`,
    intro: 'Here is the full report. Side-by-side rates, retainer ranges, hourly bands, and what to negotiate for fractional CMO, CRO, CFO, COO, CHRO, and CTO. Updated June 2026.',
    followup: 'If you are scoping a fractional engagement this quarter, reply to this email and we can walk through the situation in 30 minutes.',
  },
  'AI Investment Budget Worksheet': {
    subject: 'The AI investment budget reference',
    link: `${SITE}/how-much-does-ai-marketing-cost`,
    intro: 'Here are the budget references you asked for. Tool stacks, agency costs, and the realistic total bill for B2B mid-market AI deployments in 2026.',
    followup: 'If you want this priced against your actual stack, the $1,500 AI Audit produces a written 5-business-day budget. Money-back if it does not save you 10x.',
  },
  'Claude Pricing & ROI Worksheet': {
    subject: 'Claude pricing breakdown plus the right tier for your team',
    link: `${SITE}/how-much-does-claude-cost`,
    intro: 'Full Claude pricing across Pro, Team, Enterprise, and the API, plus how to size the right plan against your team and use cases.',
    followup: 'If you want this benchmarked against the rest of your AI stack, the free AI Tool Stack Auditor takes 3 minutes: ' + SITE + '/ai-tool-stack-auditor',
  },
  'ChatGPT Pricing & ROI Worksheet': {
    subject: 'ChatGPT pricing breakdown plus the right tier for your team',
    link: `${SITE}/how-much-does-chatgpt-cost`,
    intro: 'Full ChatGPT pricing across Plus, Team, and Enterprise, plus how to decide between tiers against your use cases.',
    followup: 'If you also want this compared to Claude, ChatGPT vs Claude for business: ' + SITE + '/chatgpt-vs-claude-for-business',
  },
  'AI Marketing Budget Template': {
    subject: 'The 2026 AI marketing budget reference',
    link: `${SITE}/how-much-does-ai-marketing-cost`,
    intro: 'Realistic AI marketing budgets by company stage, with the line items most teams underspend on (and the ones most teams overspend on).',
    followup: 'For a written marketing-team operating model in 5 business days, the $1,500 AI Audit: ' + SITE + '/services/ai-audit',
  },
  'AI Tool Comparison Matrix (2026)': {
    subject: 'The 2026 AI Tool Comparison Matrix',
    link: `${SITE}/content-library#comparison-list`,
    intro: 'Here are the side-by-side comparisons we publish for AI tools in 2026. Claude, ChatGPT, Gemini, Copilot, Perplexity, plus the verticals (Notion AI, Airtable AI, Jasper, Copy.ai). Each link goes to the honest 2026 comparison.',
    followup: 'If you want a stack recommendation for your specific situation, the free AI Tool Stack Auditor takes 3 minutes: ' + SITE + '/ai-tool-stack-auditor',
  },
  'AI Agents Implementation Playbook': {
    subject: 'The AI Agents Implementation Playbook',
    link: `${SITE}/ai-agents-for-business`,
    intro: 'The cross-functional playbook starts here. We also have function-specific (sales, marketing, customer service, finance, HR, operations, product) and industry-specific (ecommerce, healthcare, legal, accounting, nonprofits, real estate) versions linked from the page.',
    followup: 'For a written agent rollout plan in 5 business days: ' + SITE + '/services/ai-audit',
  },
  'B2B SaaS AI Operating Model': {
    subject: 'The B2B SaaS AI Operating Model',
    link: `${SITE}/ai-for-saas-cmos`,
    intro: 'The role-by-role AI deployment playbook for B2B SaaS. CMO, CRO, CFO, VP of Marketing, and Founder versions are linked from the bottom of the page.',
    followup: 'If you want this mapped to your specific team and stage: ' + SITE + '/services/ai-audit',
  },
  'Fintech AI Operating Model': {
    subject: 'The Fintech AI Operating Model',
    link: `${SITE}/ai-for-fintech-cmos`,
    intro: 'AI deployment inside the fintech regulatory perimeter. BAA-grade vendor selection, audit-trail design, and the playbook for each function. CMO, CRO, CFO, VP of Marketing, and Founder versions are linked from the bottom of the page.',
    followup: 'If you want this mapped to your specific compliance posture: ' + SITE + '/services/ai-audit',
  },
  'Healthcare Tech AI Operating Model': {
    subject: 'The Healthcare Tech AI Operating Model',
    link: `${SITE}/ai-for-healthcare-tech-cmos`,
    intro: 'HIPAA-aware AI deployment for healthcare technology. Vendor selection, BAA setup, and the role-by-role playbook. CMO, CRO, CFO, VP of Marketing, and Founder versions are linked from the bottom of the page.',
    followup: 'If you want this mapped to your specific compliance posture: ' + SITE + '/services/ai-audit',
  },
  'Legal Services AI Operating Model': {
    subject: 'The Legal Services AI Operating Model',
    link: `${SITE}/ai-for-legal-cmos`,
    intro: 'UPL-aware AI deployment for legal services. Vendor selection, supervision design, and ethics-compliant workflows. CMO, CRO, CFO, VP of Marketing, and Founder versions are linked from the bottom of the page.',
    followup: 'If you want this mapped to your specific practice: ' + SITE + '/services/ai-audit',
  },
  'Insurance AI Operating Model': {
    subject: 'The Insurance AI Operating Model',
    link: `${SITE}/ai-for-insurance-cmos`,
    intro: 'Compliance-aware AI deployment for insurance. State regulatory considerations, underwriting integrity, and the role-by-role playbook.',
    followup: 'If you want this mapped to your line of business: ' + SITE + '/services/ai-audit',
  },
  'Ecommerce AI Operating Model': {
    subject: 'The Ecommerce AI Operating Model',
    link: `${SITE}/ai-for-ecommerce-cmos`,
    intro: 'AI deployment for DTC and B2B ecommerce. Catalog ops, customer-service deflection, and conversion-economics playbook.',
    followup: 'If you want this mapped to your specific stack: ' + SITE + '/services/ai-audit',
  },
  'Manufacturing AI Operating Model': {
    subject: 'The Manufacturing AI Operating Model',
    link: `${SITE}/ai-for-manufacturing-cmos`,
    intro: 'AI deployment for B2B manufacturing. Technical content, long-cycle nurture, and channel enablement playbook.',
    followup: 'If you want this mapped to your specific situation: ' + SITE + '/services/ai-audit',
  },
  'Small Business AI Stack Worksheet': {
    subject: 'The Small Business AI Stack Worksheet',
    link: `${SITE}/ai-for-small-business`,
    intro: 'Pick the right AI stack for your small business. Workflow audit, tool selector, and budget calculator.',
    followup: 'If you want a stack recommendation tailored to your situation, the free AI Tool Stack Auditor takes 3 minutes: ' + SITE + '/ai-tool-stack-auditor',
  },
  'Industry AI Operating Model': {
    subject: 'The Industry AI Operating Model',
    link: `${SITE}/content-library#ai-cmo-industries-list`,
    intro: 'Industry-specific AI operating models. The full list of 15 industries and 5 roles is linked below.',
    followup: 'If you want one mapped to your specific industry and role: ' + SITE + '/services/ai-audit',
  },
  'AI-Native GTM Glossary (PDF)': {
    subject: 'The AI-Native GTM Glossary',
    link: `${SITE}/glossary`,
    intro: 'Every term in the Treetop glossary, plain-English. 100+ definitions for AI, GTM, and fractional executive vocabulary. Citable.',
    followup: 'Reply with any term we are missing and we will add it.',
  },
  'Operator AI How-To Library': {
    subject: 'The Operator AI How-To Library',
    link: `${SITE}/content-library#how-to-list`,
    intro: 'A curated library of practical Claude and AI workflows for B2B operators. Prompt templates included on each page.',
    followup: 'If you want a written operating model for your specific situation: ' + SITE + '/services/ai-audit',
  },
  'Claude for B2B Operators Guide': {
    subject: 'Claude for B2B Operators',
    link: `${SITE}/claude-for-business`,
    intro: 'A practical Claude guide for B2B operators by industry and role. Workflows, prompts, and the operating model. Industry-specific pages are linked from the bottom.',
    followup: 'If you want a written Claude deployment plan for your team in 5 business days: ' + SITE + '/services/ai-audit',
  },
  'Fractional Executive Engagement': {
    subject: 'Scoping a fractional engagement at Treetop',
    link: `https://calendar.app.google/GS5H5y8U3PrN8u4A8`,
    intro: 'Here is the calendar link to scope an engagement. Pick a time that works and we will walk through your situation.',
    followup: 'For context before the call, the 2026 Fractional Executive Pricing Report: ' + SITE + '/2026-fractional-executive-pricing-report',
  },
  'AI Operating Model': {
    subject: 'Building your AI operating model',
    link: `${SITE}/the-ai-native-gtm-framework`,
    intro: 'The framework starts here. AI-native GTM, by function, with real examples.',
    followup: 'For a written operating model in 5 business days, the $1,500 AI Audit: ' + SITE + '/services/ai-audit',
  },
  'Role-specific AI Operating Model': {
    subject: 'Role-specific AI operating models',
    link: `${SITE}/ai-for-cmos`,
    intro: 'Role-specific AI operating models for CMOs, CROs, CFOs, COOs, and CHROs are each linked from the page above.',
    followup: 'For a written operating model for your team in 5 business days: ' + SITE + '/services/ai-audit',
  },
  'AI-Native GTM Framework': {
    subject: 'The AI-Native GTM Framework',
    link: `${SITE}/the-ai-native-gtm-framework`,
    intro: 'How AI-native B2B companies build their GTM. Positioning, channels, team shape, tooling, and the 30-60-90 day rollout.',
    followup: 'For a written framework applied to your business in 5 business days: ' + SITE + '/services/ai-audit',
  },
  'AI Implementation Roadmap': {
    subject: 'The AI Implementation Roadmap',
    link: `${SITE}/ai-implementation-consultant`,
    intro: 'How Treetop scopes and delivers AI implementation engagements. Boutique-tier pricing, 5-business-day diagnostics, and a money-back guarantee.',
    followup: 'To start with the $1,500 diagnostic: ' + SITE + '/services/ai-audit',
  },
  'AI Tool Stack Auditor': {
    subject: 'The free AI Tool Stack Auditor',
    link: `${SITE}/ai-tool-stack-auditor`,
    intro: 'The auditor walks you through your current AI stack in 3 minutes and surfaces overlap, gaps, and savings.',
    followup: 'For a written stack audit and roadmap in 5 business days, the $1,500 AI Audit: ' + SITE + '/services/ai-audit',
  },
  '30-60-90 Day Marketing Plan Template': {
    subject: 'The 30-60-90 Day Marketing Plan',
    link: `${SITE}/30-60-90-day-plan-marketing.html`,
    intro: 'The benchmark tracker, testing cadence, and 90-day report structure.',
  },
  'B2B Marketing Benchmark Tracker': {
    subject: 'The B2B Marketing Benchmark Tracker',
    link: `${SITE}/b2b-marketing-benchmarks.html`,
    intro: 'Every benchmark in the guide as a working reference.',
  },
  'Competitive Audit Matrix Template': {
    subject: 'The Competitive Audit Matrix',
    link: `${SITE}/competitive-marketing-audit-first-30-days.html`,
    intro: 'The blank competitive matrix from the guide, ready for your top competitors.',
  },
  'Fractional CMO Scope of Work Template': {
    subject: 'The Fractional CMO Scope of Work',
    link: `${SITE}/fractional-cmo-scope-of-work.html`,
    intro: 'What good fractional CMO deliverables look like: scope, KPIs, and 90-day milestones.',
  },
  'Fractional CRO Playbook': {
    subject: 'The Fractional CRO Playbook',
    link: `${SITE}/fractional-cro-deliverables.html`,
    intro: 'Revenue leadership scope, benchmarks, and what a fractional CRO should deliver in 90 days.',
  },
  'GTM Strategy Framework': {
    subject: 'The GTM Strategy Framework',
    link: `${SITE}/gtm-strategy-guide.html`,
    intro: 'The go-to-market framework used by AI-native B2B companies to pick their motion and execute.',
  },
  'Marketing Budget Template': {
    subject: 'The Marketing Budget Template',
    link: `${SITE}/marketing-budget-guide.html`,
    intro: 'B2B marketing budget breakdown by stage, channel, and headcount.',
  },
  'Demand Gen vs Lead Gen Playbook': {
    subject: 'The Demand Gen vs Lead Gen Playbook',
    link: `${SITE}/plg-vs-sales-led-growth.html`,
    intro: "The playbook for building demand gen programs that don't depend on existing search volume.",
  },
  'AI-Native GTM Playbook': {
    subject: 'The AI-Native GTM Playbook',
    link: `${SITE}/the-ai-native-gtm-framework`,
    intro: 'The Treetop framework for building AI-native GTM programs that scale without adding headcount.',
  },
};

const DEFAULT_ASSET: AssetSpec = {
  subject: 'Your Treetop download',
  link: `${SITE}/content-library`,
  intro: 'Thanks for grabbing one of our resources. Start here for everything we publish.',
  followup: 'Reply if you want a specific recommendation for your situation.',
};

async function sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email');
    return false;
  }
  const body: Record<string, any> = { from: FROM_EMAIL, to: [to], subject, html };
  if (replyTo) body.reply_to = [replyTo];
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Resend error:', res.status, text);
    return false;
  }
  return true;
}

function escape(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]!);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  let body: Record<string, string> = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== 'object') body = {};

  const email = body.email?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const hp = (body.hp as string | undefined)?.trim() ?? '';
  const loadTime = Number(body._t) || 0;
  const elapsed = loadTime ? Date.now() - loadTime : Infinity;

  function looksRandom(s: string): boolean {
    const t = (s || '').trim();
    if (t.length < 10 || t.includes(' ')) return false;
    return ((t.slice(1).match(/[A-Z]/g) || []).length) >= 3;
  }

  const isBot =
    hp.length > 0 ||
    (loadTime > 0 && elapsed < 3000) ||
    looksRandom(body.first_name || '') ||
    looksRandom(body.last_name || '') ||
    looksRandom(body.company || '') ||
    looksRandom(body.message || body.gain || '');

  if (isBot) {
    console.warn('Bot submission dropped:', email, { hp: hp.length, elapsed, first_name: body.first_name });
    return res.status(200).json({ success: true });
  }

  const isPopup = !!body.asset && !body.first_name;
  const asset = body.asset?.trim() || '';
  const source = body.source?.trim() || '';

  const first_name = body.first_name?.trim() || '';
  const last_name = body.last_name?.trim() || '';
  const company = body.company?.trim() || '';
  const team_size = body.team_size?.trim() || '';
  const message = body.message?.trim() || body.gain?.trim() || '';
  const name = [first_name, last_name].filter(Boolean).join(' ') || email.split('@')[0];

  // ─── 1. Asset email (popup case) ─────────────────────────────────────────
  if (isPopup && asset) {
    const spec = ASSETS[asset] || DEFAULT_ASSET;
    const userHtml = `
      <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:32px 24px;color:#1a1a1a;line-height:1.6;">
        <p style="margin:0 0 24px;font-size:15px;">Hi,</p>
        <p style="margin:0 0 18px;font-size:15px;">${escape(spec.intro)}</p>
        <p style="margin:0 0 28px;">
          <a href="${spec.link}" style="display:inline-block;background:#00C853;color:#050D05;padding:14px 22px;text-decoration:none;font-weight:600;font-size:15px;border-radius:4px;">
            Open ${escape(asset)} &rarr;
          </a>
        </p>
        <p style="margin:0 0 14px;font-size:14px;color:#555;">Direct link: <a href="${spec.link}" style="color:#00897B;">${spec.link}</a></p>
        ${spec.followup ? `<p style="margin:24px 0 8px;font-size:14px;color:#444;border-top:1px solid #eaeaea;padding-top:20px;">${escape(spec.followup)}</p>` : ''}
        <p style="margin:24px 0 4px;font-size:14px;color:#1a1a1a;">Bill Colbert</p>
        <p style="margin:0;font-size:13px;color:#777;">Founder, Treetop Growth Strategy<br/><a href="${SITE}" style="color:#777;">treetopgrowthstrategy.com</a></p>
      </div>
    `;
    await sendEmail(email, spec.subject, userHtml, BILL_EMAIL);
  }

  // ─── 1b. Book-a-call: email the booking link to the user ───────────────
  if (source === 'book-a-call') {
    const bookHtml = `
      <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:32px 24px;color:#1a1a1a;line-height:1.6;">
        <p style="margin:0 0 18px;font-size:15px;">Hi${first_name ? ' ' + escape(first_name) : ''},</p>
        <p style="margin:0 0 18px;font-size:15px;">Thanks for reaching out. Here is the link to grab a time that works for you. We will use the call to look at where Claude fits in your day-to-day and what to set up first.</p>
        <p style="margin:0 0 28px;">
          <a href="${BOOKING_LINK}" style="display:inline-block;background:#00C853;color:#050D05;padding:14px 22px;text-decoration:none;font-weight:600;font-size:15px;border-radius:4px;">
            Book your call &rarr;
          </a>
        </p>
        <p style="margin:0 0 14px;font-size:14px;color:#555;">Direct link: <a href="${BOOKING_LINK}" style="color:#00897B;">${BOOKING_LINK}</a></p>
        <p style="margin:24px 0 8px;font-size:14px;color:#444;border-top:1px solid #eaeaea;padding-top:20px;">If it is easier to do this async, just reply to this email with what you are trying to get out of Claude and we can point you in the right direction.</p>
        <p style="margin:24px 0 4px;font-size:14px;color:#1a1a1a;">Bill Colbert</p>
        <p style="margin:0;font-size:13px;color:#777;">Founder, Treetop Growth Strategy<br/><a href="${SITE}" style="color:#777;">treetopgrowthstrategy.com</a></p>
      </div>
    `;
    await sendEmail(email, 'Book your call with Treetop', bookHtml, BILL_EMAIL);
  }

  // ─── 1c. Inline contact form: confirm to the submitter ──────────────────
  if (!isPopup && source !== 'book-a-call') {
    const ackHtml = `
      <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:32px 24px;color:#1a1a1a;line-height:1.6;">
        <p style="margin:0 0 18px;font-size:15px;">Hi${first_name ? ' ' + escape(first_name) : ''},</p>
        <p style="margin:0 0 18px;font-size:15px;">Thanks for reaching out. Your message landed with us, and Bill will get back to you personally, usually within one business day.</p>
        <p style="margin:0 0 18px;font-size:14px;color:#444;">If it is time-sensitive, just reply to this email and it comes straight to us.</p>
        <p style="margin:24px 0 4px;font-size:14px;color:#1a1a1a;">Bill Colbert</p>
        <p style="margin:0;font-size:13px;color:#777;">Founder, Treetop Growth Strategy<br/><a href="${SITE}" style="color:#777;">treetopgrowthstrategy.com</a></p>
      </div>
    `;
    await sendEmail(email, 'Thanks for reaching out to Treetop', ackHtml, BILL_EMAIL);
  }

  // ─── 2. Notify Bill ─────────────────────────────────────────────────────
  const ctxRows: [string, string][] = isPopup
    ? [
        ['Asset requested', asset || '(none)'],
        ['Source page', source || '(unknown)'],
        ['Type', 'Lead magnet (popup/sticky)'],
      ]
    : [
        ['Name', name],
        ['Company', company || '—'],
        ['Team size', team_size || '—'],
        ['Source', source || 'website'],
        ['Type', source === 'book-a-call' ? 'Book a call' : 'Contact form'],
      ];

  const adminHtml = `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:24px;color:#1a1a1a;">
      <h2 style="margin:0 0 18px;color:#050D05;font-size:18px;">
        ${isPopup ? `New lead magnet request: ${escape(asset || 'unknown')}` : `New website inquiry from ${escape(name)}`}
      </h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:14px;">
        <tr style="background:#f9f9f9;">
          <td style="padding:9px 12px;font-weight:600;width:160px;border:1px solid #e5e5e5;">Email</td>
          <td style="padding:9px 12px;color:#444;border:1px solid #e5e5e5;"><a href="mailto:${escape(email)}" style="color:#00897B;">${escape(email)}</a></td>
        </tr>
        ${ctxRows.map(([k, v], i) => `
          <tr ${i % 2 ? 'style="background:#f9f9f9;"' : ''}>
            <td style="padding:9px 12px;font-weight:600;border:1px solid #e5e5e5;">${escape(k)}</td>
            <td style="padding:9px 12px;color:#444;border:1px solid #e5e5e5;">${escape(v)}</td>
          </tr>
        `).join('')}
      </table>
      ${(!isPopup && message) ? `
        <div style="margin:0 0 18px;">
          <div style="font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#888;margin-bottom:6px;">Message</div>
          <div style="font-size:14px;color:#222;line-height:1.6;white-space:pre-wrap;background:#f6f6f6;border:1px solid #e5e5e5;padding:14px 16px;border-radius:4px;">${escape(message)}</div>
        </div>
      ` : ''}
      ${(isPopup || source === 'book-a-call') ? `
        <p style="margin:14px 0;font-size:13px;color:#666;">
          ${source === 'book-a-call' ? 'The booking link has been automatically sent to the user.' : 'The asset email has been automatically sent to the user.'} No manual delivery needed.
        </p>
      ` : ''}
      <a href="mailto:${email}?subject=Re: Your ${isPopup ? 'download' : 'inquiry'} from Treetop"
         style="display:inline-block;background:#00C853;color:#050D05;padding:11px 20px;text-decoration:none;font-weight:600;font-size:14px;border-radius:4px;">
        Reply &rarr;
      </a>
    </div>
  `;
  const notifiedBill = await sendEmail(
    BILL_EMAIL,
    isPopup
      ? `Lead magnet: ${asset} → ${email}`
      : `${source === 'book-a-call' ? 'Call request' : 'New lead'}: ${name}${company ? ` — ${company}` : ''} (${source || 'website'})`,
    adminHtml,
    email,
  );

  // ─── 3. Log to Airtable ─────────────────────────────────────────────────
  let loggedAirtable = false;
  try {
    if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      const notes = isPopup
        ? `Lead magnet: ${asset}\nSource: ${source}`
        : [team_size && `Team size: ${team_size}`, message && `Message: ${message}`].filter(Boolean).join('\n');

      const at = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_LEADS_TABLE}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            Name: name,
            Email: email,
            Company: company || '',
            Notes: notes,
            Source: source || (isPopup ? `lead-magnet:${asset}` : 'website'),
          },
        }),
      });
      loggedAirtable = at.ok;
      if (!at.ok) console.error('Airtable error:', at.status, await at.text());
    }
  } catch (err) {
    console.error('Airtable error:', err);
  }

  const delivered = notifiedBill || loggedAirtable;
  return res.status(200).json({ success: true, delivered });
}
