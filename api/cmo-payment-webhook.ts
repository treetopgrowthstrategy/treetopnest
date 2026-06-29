// Fires on checkout.session.completed for AI CMO Starter Reports.
// 1. Verifies Stripe signature  2. Fetches onboarding answers from Airtable
// 3. Calls Claude to generate 6-section report  4. Delivers via Resend

import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

const STRIPE_SECRET_KEY    = process.env.STRIPE_SECRET_KEY    || '';
const CMO_WEBHOOK_SECRET   = process.env.CMO_WEBHOOK_SECRET   || '';
const RESEND_API_KEY       = process.env.RESEND_API_KEY       || '';
const ANTHROPIC_API_KEY    = process.env.ANTHROPIC_API_KEY    || '';
const AIRTABLE_API_KEY     = process.env.AIRTABLE_API_KEY     || '';
const AIRTABLE_BASE_ID     = (process.env.AIRTABLE_BASE_ID    || 'app0cpbQjtdZh1sHT').split('/')[0];
const AIRTABLE_TABLE       = process.env.AIRTABLE_LEADS_TABLE || 'tbl7PEKkdYKafCEdC';
const FROM_EMAIL           = process.env.RESEND_FROM          || 'Bill Colbert <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL           = process.env.BILL_NOTIFY_EMAIL    || 'william.colbert@treetopgrowthstrategy.com';
const SITE                 = 'https://treetopgrowthstrategy.com';

function rawBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end',  () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function fetchOnboardingNotes(email: string): Promise<string> {
  if (!AIRTABLE_API_KEY) return '';
  const formula = encodeURIComponent(`AND({Email}="${email}",{Source}="cmo-onboarding")`);
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}?filterByFormula=${formula}&maxRecords=1&sort[0][field]=Created&sort[0][direction]=desc`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
  if (!r.ok) { console.error('Airtable lookup failed', r.status); return ''; }
  const data: any = await r.json();
  return data.records?.[0]?.fields?.Notes || '';
}

async function generateReport(email: string, notes: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) return '<p>Report generation not configured.</p>';

  const prompt = `You are Bill Colbert, founder of Treetop Growth Strategy and a fractional CMO. A client just paid $99 for an AI CMO Starter Report. Write their complete report based on the onboarding answers below.

CLIENT ONBOARDING ANSWERS:
${notes || '(Onboarding answers not available. Provide a strong, generally applicable competitive marketing analysis based on the email domain if possible, and note that a follow-up will gather specifics.)'}

OUTPUT: Clean HTML (no html/body/head tags, no markdown fences). Use <h2> for the six section headers below, <p> for body, <ul><li> for lists, <strong> for emphasis. 150-250 words per section. Tone: direct, specific, senior practitioner. Reference the client's actual answers throughout.

SECTIONS (write all six in order):

<h2>1. Competitive Snapshot</h2>
Analyze the specific competitors they named. What are each one's visible content and SEO angles? Where are they strong, and where are the gaps you see from the outside?

<h2>2. Keyword Gap</h2>
Based on their business description and named competitors, identify 5-8 high-intent keyword opportunities they are likely not winning today. Name the keywords. Explain why each one matters for their category.

<h2>3. Content Positioning</h2>
How should they position their content relative to the competition? What angle, voice, and format plays to their strengths? What should they stop doing?

<h2>4. Top 3 Growth Levers</h2>
The three highest-ROI moves available to them given their stage, budget, channels, and stated goals. Be specific. Explain the expected payoff and rough time horizon for each.

<h2>5. 90-Day Roadmap</h2>
Month 1 (foundation), Month 2 (execution), Month 3 (scale). Concrete milestones, not themes. What ships in each month?

<h2>6. What I Would Do First</h2>
Speak directly as Bill. If you were sitting across the table from this person today, what is the one thing you would tell them to do this week? Be honest, specific, and human.

HARD CONSTRAINTS:
- NO em dashes anywhere
- NO generic marketing advice that could apply to any business
- Reference the client's actual answers, competitors, and goals throughout every section`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!r.ok) {
    const err = await r.text();
    console.error('Anthropic API error:', r.status, err);
    return '<p>Report generation failed. Bill will follow up manually within 24 hours.</p>';
  }

  const result: any = await r.json();
  return result.content?.[0]?.text || '<p>Report could not be generated. Bill will follow up manually.</p>';
}

async function sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<void> {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set'); return; }
  const payload: Record<string, any> = { from: FROM_EMAIL, to: [to], subject, html };
  if (replyTo) payload.reply_to = [replyTo];
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) console.error('Resend error:', r.status, await r.text());
}

function reportEmailHtml(reportBody: string): string {
  return `
<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;background:#fff;color:#1a1a1a;line-height:1.65;">
  <div style="background:#050D05;padding:28px 32px;">
    <p style="margin:0;font-family:Georgia,serif;font-size:20px;font-style:italic;color:#F0FFF0;">Treetop Growth Strategy</p>
  </div>
  <div style="padding:36px 32px;">
    <h1 style="margin:0 0 6px;font-size:24px;font-weight:600;color:#050D05;">Your AI CMO Starter Report</h1>
    <p style="margin:0 0 32px;font-size:13px;color:#888;">Prepared by Bill Colbert</p>
    ${reportBody}
    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #eaeaea;">
      <p style="margin:0 0 4px;font-size:14px;color:#1a1a1a;">Bill Colbert</p>
      <p style="margin:0 0 16px;font-size:13px;color:#888;">Founder, Treetop Growth Strategy &bull; <a href="${SITE}" style="color:#00897B;">treetopgrowthstrategy.com</a></p>
      <p style="margin:0;font-size:13px;color:#888;">Questions? Reply to this email. Want to continue as a fractional CMO engagement? <a href="${SITE}/services/fractional-cmo" style="color:#00897B;">See how that works.</a></p>
    </div>
  </div>
</div>`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = await rawBody(req);
  const sig  = req.headers['stripe-signature'];

  if (!CMO_WEBHOOK_SECRET) {
    console.error('CMO_WEBHOOK_SECRET not configured');
    return res.status(500).end();
  }

  let event: any;
  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(body, sig, CMO_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Stripe signature verification failed:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  // Only act on payment completion
  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;

  // Only process our CMO product (skip other checkout sessions on this account)
  if (session.metadata?.product !== 'cmo-starter-report') {
    return res.status(200).json({ received: true });
  }

  const email = (session.customer_email || session.metadata?.email || '').toLowerCase().trim();
  if (!email) {
    console.error('No email on session', session.id);
    return res.status(200).json({ received: true });
  }

  console.log(`Generating CMO report for ${email} (session ${session.id})`);

  try {
    const notes       = await fetchOnboardingNotes(email);
    const reportBody  = await generateReport(email, notes);

    await sendEmail(
      email,
      'Your AI CMO Starter Report is ready',
      reportEmailHtml(reportBody),
      BILL_EMAIL,
    );

    // Bill gets a copy with the full report body
    await sendEmail(
      BILL_EMAIL,
      `CMO report delivered: ${email}`,
      `<p style="font-family:sans-serif;color:#555;">Delivered to <strong>${email}</strong> for session <code>${session.id}</code>.</p><hr/>${reportBody}`,
      email,
    );

    console.log(`CMO report delivered to ${email}`);
  } catch (err) {
    console.error('Report error:', err);
    // Always return 200 so Stripe does not retry; alert Bill manually
    await sendEmail(
      BILL_EMAIL,
      `ACTION NEEDED: CMO report failed for ${email}`,
      `<p style="font-family:sans-serif;">Report generation or delivery failed for <strong>${email}</strong> (session <code>${session.id}</code>). Please generate and send manually.</p><pre>${String(err)}</pre>`,
    ).catch(() => {});
  }

  return res.status(200).json({ received: true });
}
