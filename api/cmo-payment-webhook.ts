// Fires on checkout.session.completed for AI CMO Starter Reports.
// 1. Verifies Stripe signature  2. Fetches onboarding answers from Airtable
// 3. Pulls live Ahrefs data for user + competitors  4. Calls OpenAI to generate 6-section report
// 5. Delivers via Resend

import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

const STRIPE_SECRET_KEY    = process.env.STRIPE_SECRET_KEY    || '';
const CMO_WEBHOOK_SECRET   = process.env.CMO_WEBHOOK_SECRET   || '';
const RESEND_API_KEY       = process.env.RESEND_API_KEY       || '';
const OPENAI_API_KEY       = process.env.OPENAI_API_KEY       || '';
const AIRTABLE_API_KEY     = process.env.AIRTABLE_API_KEY     || '';
const AIRTABLE_BASE_ID     = (process.env.AIRTABLE_BASE_ID    || 'app0cpbQjtdZh1sHT').split('/')[0];
const AIRTABLE_TABLE       = process.env.AIRTABLE_LEADS_TABLE || 'tbl7PEKkdYKafCEdC';
const AHREFS_API_KEY       = process.env.AHREFS_API_KEY       || '';
const FROM_EMAIL           = process.env.RESEND_FROM          || 'Bill Colbert <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL           = process.env.BILL_NOTIFY_EMAIL    || 'william.colbert@treetopgrowthstrategy.com';
const REPLY_TO_ADDRESS     = process.env.CMO_REPLY_TO_EMAIL   || 'bill@reports.treetopgrowthstrategy.com';
const SITE                 = 'https://treetopgrowthstrategy.com';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AhrefsData {
  domain: string;
  domainRating: number | null;
  ahrefsRank: number | null;
  orgKeywords: number | null;
  orgTraffic: number | null;
  topKeywords: Array<{ keyword: string; volume: number; best_position: number; sum_traffic: number }>;
}

// ─── Raw body ─────────────────────────────────────────────────────────────────

function rawBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end',  () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ─── Airtable ─────────────────────────────────────────────────────────────────

async function fetchOnboardingRecord(email: string): Promise<{ recordId: string; notes: string } | null> {
  if (!AIRTABLE_API_KEY) return null;
  const formula = encodeURIComponent(`LOWER({Email})="${email.replace(/"/g, '')}"`);
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}?filterByFormula=${formula}&maxRecords=1`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
  if (!r.ok) { console.error('Airtable lookup failed', r.status); return null; }
  const data: any = await r.json();
  const record = data.records?.[0];
  if (!record) return null;
  return { recordId: record.id, notes: record.fields?.Notes || '' };
}

async function saveLastReport(recordId: string, reportHtml: string): Promise<void> {
  if (!AIRTABLE_API_KEY || !recordId) return;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}/${recordId}`;
  const r = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { 'Last Report': reportHtml, 'Stage': 'report_delivered', 'StageSince': new Date().toISOString().slice(0, 10) } }),
  });
  if (!r.ok) console.error('Failed to save Last Report to Airtable:', r.status, await r.text());
}

// Advance a lead's Stage by email (used for subscription tier purchases). Upserts.
async function setLeadStage(email: string, stage: string): Promise<void> {
  if (!AIRTABLE_API_KEY) return;
  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`;
  const auth = { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' };
  try {
    const formula = encodeURIComponent(`LOWER({Email})="${email.replace(/"/g, '')}"`);
    const r = await fetch(`${base}?filterByFormula=${formula}&maxRecords=1`, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
    const data: any = r.ok ? await r.json() : { records: [] };
    const rec = data.records?.[0];
    if (rec) {
      await fetch(`${base}/${rec.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ fields: { Stage: stage, StageSince: new Date().toISOString().slice(0, 10) } }) });
    } else {
      await fetch(base, { method: 'POST', headers: auth, body: JSON.stringify({ fields: { Email: email, Source: 'cmo-subscribe', Stage: stage, StageSince: new Date().toISOString().slice(0, 10) } }) });
    }
  } catch (err) { console.error('setLeadStage error:', err); }
}

// ─── Ahrefs ───────────────────────────────────────────────────────────────────

async function fetchAhrefsData(domain: string, todayDate: string): Promise<AhrefsData | null> {
  if (!AHREFS_API_KEY) return null;
  const base = 'https://api.ahrefs.com/v3/site-explorer';
  const h = { Authorization: `Bearer ${AHREFS_API_KEY}` };

  try {
    const [drRes, metricsRes, kwRes] = await Promise.all([
      fetch(`${base}/domain-rating?target=${domain}&date=${todayDate}&output=json`, { headers: h }),
      fetch(`${base}/metrics?target=${domain}&date=${todayDate}&mode=subdomains&output=json`, { headers: h }),
      fetch(`${base}/organic-keywords?target=${domain}&date=${todayDate}&mode=subdomains&select=keyword,volume,best_position,sum_traffic&order_by=sum_traffic:desc&limit=10&output=json`, { headers: h }),
    ]);

    const dr: any      = drRes.ok      ? await drRes.json()      : null;
    const metrics: any = metricsRes.ok ? await metricsRes.json() : null;
    const kw: any      = kwRes.ok      ? await kwRes.json()      : null;

    return {
      domain,
      domainRating:  dr?.domain_rating?.domain_rating  ?? null,
      ahrefsRank:    dr?.domain_rating?.ahrefs_rank     ?? null,
      orgKeywords:   metrics?.metrics?.org_keywords     ?? null,
      orgTraffic:    metrics?.metrics?.org_traffic      ?? null,
      topKeywords:   kw?.keywords                       ?? [],
    };
  } catch (err) {
    console.error(`Ahrefs fetch failed for ${domain}:`, err);
    return null;
  }
}

function parseCompetitorDomains(notes: string): string[] {
  const match = notes.match(/Competitors?:\s*([^\n]+)/i);
  if (!match) return [];
  const raw = match[1].trim();
  const domains: string[] = [];

  // Extract from URLs first
  const urlMatches = raw.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/g) || [];
  for (const url of urlMatches) {
    const d = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
    if (d && !domains.includes(d)) domains.push(d);
  }

  // Fallback: comma/semicolon-separated names — guess .com
  if (!domains.length) {
    const parts = raw.split(/[,;\/]/).map(s => s.trim()).filter(Boolean);
    for (const part of parts.slice(0, 3)) {
      const word = part.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
      if (word && word.length > 2 && !word.includes(' ')) {
        domains.push(word.includes('.') ? word : word + '.com');
      }
    }
  }

  return domains.slice(0, 3);
}

function formatAhrefsBlock(items: (AhrefsData | null)[]): string {
  const valid = items.filter(Boolean) as AhrefsData[];
  if (!valid.length) return '';

  let block = '\n\nLIVE AHREFS COMPETITIVE DATA (ground your analysis in these numbers, cite specifics):\n';
  for (const d of valid) {
    block += `\n${d.domain}:\n`;
    if (d.domainRating !== null) block += `  Domain Rating: ${d.domainRating}\n`;
    if (d.orgKeywords  !== null) block += `  Ranking Keywords: ${d.orgKeywords.toLocaleString()}\n`;
    if (d.orgTraffic   !== null) block += `  Est. Monthly Organic Traffic: ${d.orgTraffic.toLocaleString()}\n`;
    if (d.topKeywords.length) {
      block += `  Top 10 Traffic Keywords:\n`;
      for (const kw of d.topKeywords) {
        block += `    - "${kw.keyword}" (vol: ${kw.volume.toLocaleString()}, pos: ${kw.best_position}, traffic: ${kw.sum_traffic.toLocaleString()})\n`;
      }
    }
  }
  return block;
}

// ─── Report generation ────────────────────────────────────────────────────────

async function generateReport(email: string, notes: string, ahrefsBlock: string): Promise<string> {
  if (!OPENAI_API_KEY) return '<p>Report generation not configured.</p>';

  const prompt = `You are Bill Colbert, founder of Treetop Growth Strategy and a fractional CMO. A client just paid $99 for an AI CMO Starter Report. Write their complete report based on the onboarding answers and live competitive data below.

CLIENT ONBOARDING ANSWERS:
${notes || '(Onboarding answers not available. Provide a strong, generally applicable competitive marketing analysis based on the email domain if possible, and note that a follow-up will gather specifics.)'}
${ahrefsBlock}

OUTPUT: Clean HTML (no html/body/head tags, no markdown fences). Use <h2> for the six section headers below, <p> for body, <ul><li> for lists, <strong> for emphasis. 150-250 words per section. Tone: direct, specific, senior practitioner. Reference the client's actual answers and the Ahrefs data throughout.

SECTIONS (write all six in order):

<h2>1. Competitive Snapshot</h2>
Analyze the specific competitors they named. Use the Ahrefs data to compare domain authority, traffic scale, and keyword footprint. What are each competitor's visible content and SEO angles? Where are they strong, and where are the gaps?

<h2>2. Keyword Gap</h2>
Based on their business description, named competitors, and the live Ahrefs keyword data, identify 5-8 high-intent keyword opportunities they are likely not winning today. Name the keywords. Explain why each one matters. Reference competitor keyword data to show the opportunity.

<h2>3. Content Positioning</h2>
How should they position their content relative to the competition? What angle, voice, and format plays to their strengths? What should they stop doing? Use the traffic and keyword data to justify your recommendations.

<h2>4. Top 3 Growth Levers</h2>
The three highest-ROI moves available to them given their stage, budget, channels, and stated goals. Be specific. Explain the expected payoff and rough time horizon for each.

<h2>5. 90-Day Roadmap</h2>
Month 1 (foundation), Month 2 (execution), Month 3 (scale). Concrete milestones, not themes. What ships in each month?

<h2>6. What I Would Do First</h2>
Speak directly as Bill. If you were sitting across the table from this person today, what is the one thing you would tell them to do this week? Be honest, specific, and human.

HARD CONSTRAINTS:
- NO em dashes anywhere
- NO generic marketing advice that could apply to any business
- Reference the client's actual answers, competitors, and Ahrefs numbers throughout every section
- When Ahrefs data is present, cite specific numbers (traffic, DR, keyword counts) to make the analysis credible`;

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!r.ok) {
    const err = await r.text();
    console.error('OpenAI API error:', r.status, err);
    return '<p>Report generation failed. Bill will follow up manually within 24 hours.</p>';
  }

  const result: any = await r.json();
  return result.choices?.[0]?.message?.content || '<p>Report could not be generated. Bill will follow up manually.</p>';
}

// ─── Email helpers ────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string, replyTo?: string, scheduledAt?: string): Promise<void> {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set'); return; }
  const payload: Record<string, any> = { from: FROM_EMAIL, to: [to], subject, html };
  if (replyTo)     payload.reply_to    = [replyTo];
  if (scheduledAt) payload.scheduled_at = scheduledAt;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) console.error('Resend error:', r.status, await r.text());
}

function reportEmailHtml(reportBody: string, customerEmail: string): string {
  const upgradeUrl = `${SITE}/ai-cmo-advisor/upgrade?tier=monitor&e=${Buffer.from(customerEmail).toString('base64url')}`;
  return `
<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;background:#fff;color:#1a1a1a;line-height:1.65;">
  <div style="background:#050D05;padding:28px 32px;">
    <p style="margin:0;font-family:Georgia,serif;font-size:20px;font-style:italic;color:#F0FFF0;">Treetop Growth Strategy</p>
  </div>
  <div style="padding:36px 32px;">
    <h1 style="margin:0 0 6px;font-size:24px;font-weight:600;color:#050D05;">Your AI CMO Starter Report</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#888;">Prepared by Bill Colbert, with live Ahrefs data</p>
    <p style="margin:0 0 28px;font-size:15px;color:#333;line-height:1.65;">Here is your report. I pulled the live data on the competitors you named and wrote up what I would actually do about it. The section most people read first is the last one, "What I would do first." If anything here raises a question, just reply to this email. It comes straight to me.</p>
    ${reportBody}
    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #eaeaea;">
      <p style="margin:0 0 4px;font-size:14px;color:#1a1a1a;">Bill Colbert</p>
      <p style="margin:0 0 16px;font-size:13px;color:#888;">Founder, Treetop Growth Strategy &bull; <a href="${SITE}" style="color:#00897B;">treetopgrowthstrategy.com</a></p>
      <p style="margin:0 0 12px;font-size:13px;color:#888;">Questions? Reply to this email.</p>
      <p style="margin:0;font-size:13px;color:#555;">Want this kept current every month, with a what-changed memo and your questions answered? <a href="${upgradeUrl}" style="color:#00897B;font-weight:600;">Continue with Monitor ($249/mo) &rarr;</a></p>
    </div>
  </div>
</div>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

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

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;

  // Subscription tier purchases: advance the lead's Stage to that tier. No report to generate.
  const prod = session.metadata?.product || '';
  if (prod === 'cmo-monitor' || prod === 'cmo-guided' || prod === 'cmo-embedded') {
    const subEmail = (session.customer_email || session.metadata?.email || '').toLowerCase().trim();
    const tier = (session.metadata?.tier || prod.replace('cmo-', '')).toString();
    if (subEmail) { await setLeadStage(subEmail, tier).catch(() => {}); }
    return res.status(200).json({ received: true });
  }

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
    // Today's date for Ahrefs API calls (YYYY-MM-DD)
    const todayDate = new Date().toISOString().slice(0, 10);

    // Fetch onboarding answers first — needed to extract competitor domains
    const onboarding = await fetchOnboardingRecord(email);
    const notes = onboarding?.notes || '';

    // Resolve domains: user's own + up to 3 competitors from onboarding
    const competitorDomains = parseCompetitorDomains(notes);
    const userDomain = email.split('@')[1];
    const allDomains = [userDomain, ...competitorDomains].filter(Boolean);

    // Fetch Ahrefs data for all domains in parallel (gracefully fails if key missing)
    const ahrefsResults = await Promise.all(
      allDomains.map(d => fetchAhrefsData(d, todayDate))
    );
    const ahrefsBlock = formatAhrefsBlock(ahrefsResults);

    if (ahrefsBlock) {
      console.log(`Ahrefs data fetched for: ${allDomains.join(', ')}`);
    } else {
      console.log('No Ahrefs data (key missing or all calls failed); generating report from onboarding answers only');
    }

    const reportBody = await generateReport(email, notes, ahrefsBlock);

    // Persist the report so a reply to it can be answered with real context
    if (onboarding?.recordId) {
      await saveLastReport(onboarding.recordId, reportBody);
    }

    // Schedule delivery 15 minutes out so the report doesn't arrive instantly
    const deliverAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await sendEmail(
      email,
      'Your AI CMO Starter Report is ready',
      reportEmailHtml(reportBody, email),
      REPLY_TO_ADDRESS,
      deliverAt,
    );

    // Bill gets a copy with full context
    await sendEmail(
      BILL_EMAIL,
      `CMO report delivered: ${email}`,
      `<p style="font-family:sans-serif;color:#555;">Delivered to <strong>${email}</strong> for session <code>${session.id}</code>.</p><p style="font-family:sans-serif;color:#555;">Ahrefs domains: ${allDomains.join(', ') || 'none'}</p><hr/>${reportBody}`,
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
