// Daily nurture / ladder-climb engine for the AI CMO funnel.
// Runs once a day (Vercel cron). Stage-driven, idempotent, at most one email per lead per day.
//
// Sequences (by Stage):
//   unverified       -> resend the verify link                (day 1)
//   verified         -> finish the 7-question intake          (day 1, 3)
//   onboarded        -> abandoned-checkout recovery, pay $99   (day 1, 3, 7)
//   report_delivered -> ladder-climb to Monitor ($249)         (day 3, 10, 21)
//
// Send-gate: mirrors CMO_REPLY_AUTO_SEND. When CMO_NURTURE_ENABLED !== 'true' the cron
// runs in DRY-RUN: it emails Bill a single digest of what WOULD send (for copy sign-off)
// and does not advance any counters. Flip the flag to go live.

import crypto from 'node:crypto';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = (process.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT').split('/')[0];
const AIRTABLE_TABLE   = process.env.AIRTABLE_LEADS_TABLE || 'tbl7PEKkdYKafCEdC';
const RESEND_API_KEY   = process.env.RESEND_API_KEY || '';
const FROM_EMAIL       = process.env.RESEND_FROM || 'Bill Colbert <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL       = process.env.BILL_NOTIFY_EMAIL || 'william.colbert@treetopgrowthstrategy.com';
const REPLY_TO_ADDRESS = process.env.CMO_REPLY_TO_EMAIL || 'bill@reports.treetopgrowthstrategy.com';
const TOKEN_SECRET     = process.env.CMO_TOKEN_SECRET || 'cmo-dev-secret-change-me';
const NURTURE_ENABLED  = process.env.CMO_NURTURE_ENABLED === 'true';
const CRON_SECRET      = process.env.CRON_SECRET || '';
const SITE             = 'https://treetopgrowthstrategy.com';
const AHREFS_API_KEY   = process.env.AHREFS_API_KEY || '';
const OPENAI_API_KEY   = process.env.OPENAI_API_KEY || '';
// Hard cap on how many free leads get a fresh Ahrefs+OpenAI insight per run (cost gate).
const MAX_FREE_RESEARCH_PER_RUN = Number(process.env.CMO_MAX_FREE_RESEARCH || '25');

const NURTURABLE = ['unverified', 'verified', 'onboarded', 'report_delivered'];
// Free-motion drip fires on days since StageSince (set at qualification).
const FREE_DAYS = [0, 3, 7];

// ─── Small helpers ──────────────────────────────────────────────────────────

function makeToken(email: string, ts: number): string {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(`${email}:${ts}`).digest('hex');
}
function enc(email: string): string { return Buffer.from(email).toString('base64url'); }
function firstName(lead: any): string {
  const n = (lead.fields?.Name || '').toString().trim();
  if (n && !n.includes('@')) return n.split(/[\s._-]+/)[0].replace(/^\w/, (c: string) => c.toUpperCase());
  const local = (lead.fields?.Email || '').toString().split('@')[0].split(/[._-]+/)[0];
  return local ? local.replace(/^\w/, (c: string) => c.toUpperCase()) : 'there';
}
function competitorsLine(lead: any): string {
  const notes = (lead.fields?.Notes || '').toString();
  const m = notes.match(/Competitors?:\s*([^\n]+)/i);
  return m ? m[1].trim() : '';
}
function todayISO(): string { return new Date().toISOString().slice(0, 10); }
function daysBetween(fromISO: string, toISO: string): number {
  const a = Date.parse(fromISO + 'T00:00:00Z');
  const b = Date.parse(toISO + 'T00:00:00Z');
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.floor((b - a) / 86400000);
}

// ─── Email shell (matches the plain, personal transactional style) ────────────

function shell(inner: string): string {
  return `
<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;padding:32px 26px;color:#1a1a1a;line-height:1.65;">
  ${inner}
  <p style="margin:26px 0 4px;font-size:14px;color:#1a1a1a;border-top:1px solid #eaeaea;padding-top:18px;">Bill Colbert</p>
  <p style="margin:0;font-size:13px;color:#888;">Founder, Treetop Growth Strategy<br/><a href="${SITE}" style="color:#888;">treetopgrowthstrategy.com</a></p>
</div>`;
}
function btn(href: string, label: string): string {
  return `<p style="margin:0 0 26px;"><a href="${href}" style="display:inline-block;background:#00C853;color:#050D05;padding:13px 22px;text-decoration:none;font-weight:600;font-size:15px;border-radius:4px;">${label}</a></p>`;
}

// ─── Sequences ────────────────────────────────────────────────────────────────
// Each step: { day } = days since StageSince at which it becomes due, plus subject + body(lead).

interface Step { day: number; subject: string; body: (lead: any) => string; }

const SEQUENCES: Record<string, Step[]> = {
  unverified: [
    {
      day: 1,
      subject: 'Your AI CMO report is one click away',
      body: (lead) => {
        const ts = Date.now();
        const email = (lead.fields?.Email || '').toString().toLowerCase();
        const url = `${SITE}/api/cmo-verify?e=${enc(email)}&t=${ts}&s=${makeToken(email, ts)}`;
        return shell(`
          <p style="margin:0 0 18px;font-size:15px;">Hi ${firstName(lead)},</p>
          <p style="margin:0 0 18px;font-size:15px;">You started signing up for an AI CMO report but I have not seen you verify your email yet. One click and you are through to the 7 quick questions that make the report specific to your business.</p>
          ${btn(url, 'Verify and continue &rarr;')}
          <p style="margin:0 0 8px;font-size:14px;color:#555;">Takes about 10 minutes total. No card required until you have seen the thinking.</p>`);
      },
    },
  ],

  verified: [
    {
      day: 1,
      subject: 'Two minutes from your competitive analysis',
      body: (lead) => {
        const email = (lead.fields?.Email || '').toString().toLowerCase();
        const url = `${SITE}/ai-cmo-advisor/onboarding?e=${enc(email)}`;
        return shell(`
          <p style="margin:0 0 18px;font-size:15px;">Hi ${firstName(lead)},</p>
          <p style="margin:0 0 18px;font-size:15px;">You verified your email but did not finish the 7 questions. They are what make the report about your business instead of a generic template, who you compete with, where you are stuck, what you are trying to grow.</p>
          ${btn(url, 'Finish my intake &rarr;')}
          <p style="margin:0 0 8px;font-size:14px;color:#555;">Pick up right where you left off.</p>`);
      },
    },
    {
      day: 3,
      subject: 'Still want that competitive read?',
      body: (lead) => {
        const email = (lead.fields?.Email || '').toString().toLowerCase();
        const url = `${SITE}/ai-cmo-advisor/onboarding?e=${enc(email)}`;
        return shell(`
          <p style="margin:0 0 18px;font-size:15px;">Hi ${firstName(lead)},</p>
          <p style="margin:0 0 18px;font-size:15px;">No pressure at all. If now is not the moment, ignore this. If you do want a straight read on where you stand against your competitors and what to do about it in the next 90 days, the questions are still saved for you.</p>
          ${btn(url, 'Finish and get my report &rarr;')}`);
      },
    },
  ],

  onboarded: [
    {
      day: 1,
      subject: 'Your report is ready to generate',
      body: (lead) => {
        const email = (lead.fields?.Email || '').toString().toLowerCase();
        const url = `${SITE}/api/cmo-pay?e=${enc(email)}`;
        const comp = competitorsLine(lead);
        return shell(`
          <p style="margin:0 0 18px;font-size:15px;">Hi ${firstName(lead)},</p>
          <p style="margin:0 0 18px;font-size:15px;">Your intake is in and I have everything I need${comp ? `, including the competitors you named (${comp})` : ''}. The only thing left is the $99 so I can pull the live data and write it up. It lands in your inbox the same day.</p>
          ${btn(url, 'Pay $99 and get my report &rarr;')}
          <p style="margin:0 0 8px;font-size:14px;color:#555;">If you have a question before you pay, just reply to this email.</p>`);
      },
    },
    {
      day: 3,
      subject: 'Want me to just tell you what I would do first?',
      body: (lead) => {
        const email = (lead.fields?.Email || '').toString().toLowerCase();
        const url = `${SITE}/api/cmo-pay?e=${enc(email)}`;
        return shell(`
          <p style="margin:0 0 18px;font-size:15px;">Hi ${firstName(lead)},</p>
          <p style="margin:0 0 18px;font-size:15px;">The section most people read first in the report is the last one: the single move I would make this week if I were in your seat. It is specific to your situation, not a checklist. That plus the competitive data and the 90-day roadmap is the whole $99.</p>
          ${btn(url, 'Generate my report &rarr;')}`);
      },
    },
    {
      day: 7,
      subject: 'Closing out your intake this week',
      body: (lead) => {
        const email = (lead.fields?.Email || '').toString().toLowerCase();
        const url = `${SITE}/api/cmo-pay?e=${enc(email)}`;
        return shell(`
          <p style="margin:0 0 18px;font-size:15px;">Hi ${firstName(lead)},</p>
          <p style="margin:0 0 18px;font-size:15px;">Last note on this. I am clearing out un-generated intakes at the end of the week. Yours is still here if you want it. If the timing is off, no problem at all, just reply and tell me and I will close it out.</p>
          ${btn(url, 'Get my report before it closes &rarr;')}`);
      },
    },
  ],

  report_delivered: [
    {
      day: 3,
      subject: 'Did the report land?',
      body: (lead) => shell(`
        <p style="margin:0 0 18px;font-size:15px;">Hi ${firstName(lead)},</p>
        <p style="margin:0 0 18px;font-size:15px;">Checking in a few days after your AI CMO report. Was the competitive read useful? Did anything in it surprise you? Just reply, I read these myself.</p>
        <p style="margin:0 0 8px;font-size:14px;color:#555;">If you are already acting on something from it, I would genuinely like to know what.</p>`),
    },
    {
      day: 10,
      subject: 'The data in your report is already aging',
      body: (lead) => {
        const email = (lead.fields?.Email || '').toString().toLowerCase();
        const url = `${SITE}/ai-cmo-advisor/upgrade?tier=monitor&e=${enc(email)}`;
        return shell(`
          <p style="margin:0 0 18px;font-size:15px;">Hi ${firstName(lead)},</p>
          <p style="margin:0 0 18px;font-size:15px;">Competitive positions move every month. Some of what I pulled for your report was current the week I ran it. If you want it kept fresh, Monitor refreshes the data every month and sends a short memo on what changed and what to do about it. $249 a month, cancel any time.</p>
          ${btn(url, 'See Monitor &rarr;')}
          <p style="margin:0 0 8px;font-size:14px;color:#555;">The $99 report gave you the baseline. Monitor keeps it current.</p>`);
      },
    },
    {
      day: 21,
      subject: 'Ready to make this ongoing?',
      body: (lead) => {
        const email = (lead.fields?.Email || '').toString().toLowerCase();
        const url = `${SITE}/ai-cmo-advisor/upgrade?tier=monitor&e=${enc(email)}`;
        return shell(`
          <p style="margin:0 0 18px;font-size:15px;">Hi ${firstName(lead)},</p>
          <p style="margin:0 0 18px;font-size:15px;">It has been about three weeks since your report. If you have been executing against the roadmap, you are probably starting to see early signals. Either way, the landscape did not pause while you decided. Monitor keeps your positioning current for $249 a month, and you can climb higher any time if you want a hand doing the work.</p>
          ${btn(url, 'Start Monitor &rarr;')}
          <p style="margin:0 0 8px;font-size:14px;color:#555;">Not ready? Reply and tell me where you are stuck. Happy to answer one question first.</p>`);
      },
    },
  ],
};

// ─── Free motion (qualified leads: pre-research drip toward $99) ───────────────

function domainOf(lead: any): string {
  const w = (lead.fields?.WebsiteURL || '').toString().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
  if (w) return w;
  return (lead.fields?.Email || '').toString().split('@')[1] || '';
}

// One genuinely useful insight from live Ahrefs data, phrased by GPT-4o. Null if
// keys are missing or the domain has no data (caller falls back to templated copy).
async function buildInsight(domain: string): Promise<string | null> {
  if (!AHREFS_API_KEY || !OPENAI_API_KEY || !domain) return null;
  const date = todayISO();
  const base = 'https://api.ahrefs.com/v3/site-explorer';
  const h = { Authorization: `Bearer ${AHREFS_API_KEY}` };
  try {
    const [drRes, mRes] = await Promise.all([
      fetch(`${base}/domain-rating?target=${domain}&date=${date}&output=json`, { headers: h }),
      fetch(`${base}/metrics?target=${domain}&date=${date}&mode=subdomains&output=json`, { headers: h }),
    ]);
    const dr: any = drRes.ok ? await drRes.json() : null;
    const m: any  = mRes.ok  ? await mRes.json()  : null;
    const domainRating = dr?.domain_rating?.domain_rating ?? null;
    const orgTraffic   = m?.metrics?.org_traffic ?? null;
    const orgKeywords  = m?.metrics?.org_keywords ?? null;
    if (domainRating === null && orgTraffic === null) return null;
    const prompt = `You are Bill Colbert, a fractional CMO. For the domain ${domain}, Ahrefs shows Domain Rating ${domainRating ?? 'n/a'}, about ${orgTraffic ?? 'n/a'} monthly organic visits across ${orgKeywords ?? 'n/a'} ranking keywords. Write ONE genuinely useful, specific observation a CMO would make about their organic position, and the single biggest opportunity you would chase first. 2 to 3 sentences, direct and human, no preamble, no sign-off. HARD RULE: no em dashes.`;
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!r.ok) return null;
    const j: any = await r.json();
    const txt = (j.choices?.[0]?.message?.content || '').trim();
    return txt || null;
  } catch (err) { console.error('buildInsight error:', err); return null; }
}

const FREE_SUBJECTS = ['A quick read on where you stand', 'One more thing worth doing', 'Want the full competitive picture?'];

function freeBody(lead: any, step: number, insight: string | null): string {
  const email = (lead.fields?.Email || '').toString().toLowerCase();
  const intakeUrl = `${SITE}/ai-cmo-advisor/onboarding?e=${enc(email)}`;
  const fn = firstName(lead);
  if (step === 0) {
    const opener = insight
      ? `<p style="margin:0 0 18px;font-size:15px;">${insight}</p>`
      : `<p style="margin:0 0 18px;font-size:15px;">I started pulling the numbers on your organic footprint. There is a clear gap between where you rank today and where a business like yours could be, and it is the kind of thing that compounds fast once you point at it.</p>`;
    return shell(`
      <p style="margin:0 0 18px;font-size:15px;">Hi ${fn},</p>
      ${opener}
      <p style="margin:0 0 18px;font-size:15px;">If you want the full picture, live data on up to 3 competitors you name, the keyword gaps, and a 90-day roadmap, that is the $99 report. Same analysis, built around your specific situation.</p>
      ${btn(intakeUrl, 'Get the full report for $99 &rarr;')}
      <p style="margin:0 0 8px;font-size:14px;color:#555;">Or just reply to this email with a question. I read these myself.</p>`);
  }
  if (step === 1) {
    return shell(`
      <p style="margin:0 0 18px;font-size:15px;">Hi ${fn},</p>
      <p style="margin:0 0 18px;font-size:15px;">Following up on your snapshot. What most people want next is the ranked list of what to actually do, in order, over the next 90 days. That plus live competitor data is the whole $99 report.</p>
      ${btn(intakeUrl, 'See my 90-day roadmap &rarr;')}`);
  }
  return shell(`
    <p style="margin:0 0 18px;font-size:15px;">Hi ${fn},</p>
    <p style="margin:0 0 18px;font-size:15px;">Last nudge on this. If the snapshot was useful, the full report goes several layers deeper: your competitors' keyword footprint, where the gaps are, and the first move I would make. $99, in your inbox the same day.</p>
    ${btn(intakeUrl, 'Get the full report &rarr;')}
    <p style="margin:0 0 8px;font-size:14px;color:#555;">If now is not the time, no problem at all. Just reply and tell me.</p>`);
}

interface FreeTask { to: string; recordId: string; step: number; subject: string; domain: string; needsResearch: boolean; lead: any; templated: string; }

async function fetchQualifiedLeads(): Promise<any[]> {
  if (!AIRTABLE_API_KEY) return [];
  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`;
  const formula = encodeURIComponent(`{QualifiedStatus}="qualified"`);
  const out: any[] = [];
  let offset = '';
  for (let page = 0; page < 15; page++) {
    const url = `${base}?filterByFormula=${formula}&pageSize=100${offset ? `&offset=${offset}` : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
    if (!r.ok) { console.error('Airtable qualified list failed', r.status); break; }
    const data: any = await r.json();
    out.push(...(data.records || []));
    if (!data.offset) break;
    offset = data.offset;
    if (page === 14) console.warn('cron-cmo-nurture: lead list truncated at 1500; some leads skipped this run');
  }
  return out;
}

async function buildFreeQueue(today: string): Promise<FreeTask[]> {
  const leads = await fetchQualifiedLeads();
  const tasks: FreeTask[] = [];
  for (const lead of leads) {
    const f = lead.fields || {};
    if (!f.Email) continue;
    if ((f.Stage || '').toString().trim()) continue;   // the paid funnel owns any lead that has a Stage
    const nsRaw = Number(f.NurtureStep);
    let step = Number.isFinite(nsRaw) ? nsRaw : 0;
    if ((f.NurtureStage || '') !== 'free') step = 0;   // starting the free drip
    if (step >= FREE_DAYS.length) continue;
    if ((f.LastNurtureSentAt || '').toString().slice(0, 10) === today) continue;
    const anchor = (f.StageSince || lead.createdTime || today).toString().slice(0, 10);
    if (daysBetween(anchor, today) < FREE_DAYS[step]) continue;
    tasks.push({
      to: f.Email.toString(),
      recordId: lead.id,
      step,
      subject: FREE_SUBJECTS[step],
      domain: domainOf(lead),
      needsResearch: step === 0,
      lead,
      templated: freeBody(lead, step, null),
    });
  }
  return tasks;
}

// ─── Resend ───────────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string, opts: { replyTo?: string; bcc?: string } = {}): Promise<boolean> {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set'); return false; }
  const payload: Record<string, any> = { from: FROM_EMAIL, to: [to], subject, html };
  if (opts.replyTo) payload.reply_to = [opts.replyTo];
  if (opts.bcc)     payload.bcc = [opts.bcc];
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) { console.error('Resend error:', r.status, await r.text()); return false; }
  return true;
}

// ─── Airtable ─────────────────────────────────────────────────────────────────

async function fetchNurturableLeads(): Promise<any[]> {
  if (!AIRTABLE_API_KEY) return [];
  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`;
  const formula = encodeURIComponent(`OR(${NURTURABLE.map(s => `{Stage}="${s}"`).join(',')})`);
  const out: any[] = [];
  let offset = '';
  for (let page = 0; page < 15; page++) {
    const url = `${base}?filterByFormula=${formula}&pageSize=100${offset ? `&offset=${offset}` : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
    if (!r.ok) { console.error('Airtable list failed', r.status, await r.text()); break; }
    const data: any = await r.json();
    out.push(...(data.records || []));
    if (!data.offset) break;
    offset = data.offset;
    if (page === 14) console.warn('cron-cmo-nurture: lead list truncated at 1500; some leads skipped this run');
  }
  return out;
}

async function patchLead(recordId: string, fields: Record<string, any>): Promise<void> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}/${recordId}`;
  const r = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!r.ok) console.error('Airtable patch failed', r.status, await r.text());
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: any, res: any) {
  // Protect the endpoint. Vercel Cron sends Authorization: Bearer <CRON_SECRET> when set.
  if (CRON_SECRET) {
    const auth = (req.headers?.authorization || '').toString();
    const key  = (req.query?.key || '').toString();
    if (auth !== `Bearer ${CRON_SECRET}` && key !== CRON_SECRET) {
      return res.status(401).json({ error: 'unauthorized' });
    }
  }

  // Refuse LIVE runs without a configured secret (a live run spends money and emails real leads).
  if (NURTURE_ENABLED && !CRON_SECRET) {
    console.error('cron-cmo-nurture: refusing live run because CRON_SECRET is not set');
    return res.status(401).json({ error: 'CRON_SECRET required for live nurture sends' });
  }

  const today = todayISO();
  const leads = await fetchNurturableLeads();

  const queued: Array<{ to: string; stage: string; step: number; subject: string; html: string; recordId: string }> = [];

  for (const lead of leads) {
    const f = lead.fields || {};
    const stage = (f.Stage || '').toString();
    const seq = SEQUENCES[stage];
    if (!seq || !f.Email) continue;

    // Reset the counter when the lead has moved to a new stage since we last nurtured.
    const nsRaw = Number(f.NurtureStep);
    let step = Number.isFinite(nsRaw) ? nsRaw : 0;
    if ((f.NurtureStage || '') !== stage) step = 0;
    if (step >= seq.length) continue;

    // Do not send more than one nurture per lead per day (slice guards a dateTime field).
    if ((f.LastNurtureSentAt || '').toString().slice(0, 10) === today) continue;

    const anchor = (f.StageSince || lead.createdTime || today).toString().slice(0, 10);
    const age = daysBetween(anchor, today);
    const due = seq[step];
    if (age < due.day) continue;

    queued.push({
      to: f.Email.toString(),
      stage,
      step,
      subject: due.subject,
      html: due.body(lead),
      recordId: lead.id,
    });
  }

  // Free-motion drip for qualified leads (parallel to the Stage-driven paid sequences).
  // Dedupe against the paid pass as a safety net so no lead is ever emailed twice in one run.
  const paidIds = new Set(queued.map(q => q.recordId));
  const freeTasks = (await buildFreeQueue(today)).filter(t => !paidIds.has(t.recordId));

  const previews = [
    ...queued.map(q => ({ label: `${q.stage} step ${q.step + 1}`, to: q.to, subject: q.subject, html: q.html })),
    ...freeTasks.map(q => ({ label: `free step ${q.step + 1}`, to: q.to, subject: q.subject, html: q.templated })),
  ];

  if (!previews.length) {
    return res.status(200).json({ ok: true, mode: NURTURE_ENABLED ? 'live' : 'dry-run', queued: 0 });
  }

  if (!NURTURE_ENABLED) {
    // Dry-run: show Bill exactly what would send, spend nothing, touch no counters.
    const digest = `
      <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;color:#1a1a1a;">
        <h2 style="font-size:18px;">Nurture dry-run: ${previews.length} email(s) would send today</h2>
        <p style="font-size:13px;color:#666;">CMO_NURTURE_ENABLED is off, so nothing was sent to leads. Free-motion previews show templated copy; a live run inserts an Ahrefs insight where available. Review, then flip the flag.</p>
        ${previews.map(q => `
          <div style="border:1px solid #e5e5e5;border-radius:6px;margin:14px 0;padding:14px 16px;">
            <p style="font-size:12px;color:#00897B;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.06em;">${q.label} &middot; to ${q.to}</p>
            <p style="font-size:14px;font-weight:600;margin:0 0 10px;">Subject: ${q.subject}</p>
            <div style="border-top:1px solid #eee;padding-top:10px;">${q.html}</div>
          </div>`).join('')}
      </div>`;
    await sendEmail(BILL_EMAIL, `Nurture dry-run: ${previews.length} would send (${today})`, digest);
    return res.status(200).json({ ok: true, mode: 'dry-run', queued: previews.length, paid: queued.length, free: freeTasks.length });
  }

  // Live: paid sequences.
  let sent = 0;
  for (const q of queued) {
    const ok = await sendEmail(q.to, q.subject, q.html, { replyTo: REPLY_TO_ADDRESS, bcc: BILL_EMAIL });
    if (ok) {
      sent++;
      await patchLead(q.recordId, { NurtureStep: q.step + 1, NurtureStage: q.stage, LastNurtureSentAt: today });
    }
  }

  // Live: free-motion drip, with capped Ahrefs+OpenAI research on the first step.
  let freeSent = 0, researched = 0;
  for (const q of freeTasks) {
    // Hold research-step leads for a day with budget so they still get the real insight later.
    if (q.needsResearch && researched >= MAX_FREE_RESEARCH_PER_RUN) continue;
    let html = q.templated;
    if (q.needsResearch) {
      researched++;
      const insight = await buildInsight(q.domain);
      html = freeBody(q.lead, q.step, insight);
      if (insight) await patchLead(q.recordId, { 'Last Report': insight, ResearchEligible: true });
    }
    const ok = await sendEmail(q.to, q.subject, html, { replyTo: REPLY_TO_ADDRESS, bcc: BILL_EMAIL });
    if (ok) {
      freeSent++;
      await patchLead(q.recordId, { NurtureStep: q.step + 1, NurtureStage: 'free', LastNurtureSentAt: today });
    }
  }

  return res.status(200).json({ ok: true, mode: 'live', paidSent: sent, freeSent, researched });
}
