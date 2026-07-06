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

const NURTURABLE = ['unverified', 'verified', 'onboarded', 'report_delivered'];

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

  const today = todayISO();
  const leads = await fetchNurturableLeads();

  const queued: Array<{ to: string; stage: string; step: number; subject: string; html: string; recordId: string }> = [];

  for (const lead of leads) {
    const f = lead.fields || {};
    const stage = (f.Stage || '').toString();
    const seq = SEQUENCES[stage];
    if (!seq || !f.Email) continue;

    // Reset the counter when the lead has moved to a new stage since we last nurtured.
    let step = Number(f.NurtureStep) || 0;
    if ((f.NurtureStage || '') !== stage) step = 0;
    if (step >= seq.length) continue;

    // Do not send more than one nurture per lead per day.
    if ((f.LastNurtureSentAt || '') === today) continue;

    const anchor = (f.StageSince || (lead.createdTime ? lead.createdTime.slice(0, 10) : today));
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

  if (!queued.length) {
    return res.status(200).json({ ok: true, mode: NURTURE_ENABLED ? 'live' : 'dry-run', queued: 0 });
  }

  if (!NURTURE_ENABLED) {
    // Dry-run: show Bill exactly what would send, do not touch counters.
    const digest = `
      <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;color:#1a1a1a;">
        <h2 style="font-size:18px;">Nurture dry-run: ${queued.length} email(s) would send today</h2>
        <p style="font-size:13px;color:#666;">CMO_NURTURE_ENABLED is off, so nothing was sent to leads. Review the copy below, then flip the flag to go live.</p>
        ${queued.map(q => `
          <div style="border:1px solid #e5e5e5;border-radius:6px;margin:14px 0;padding:14px 16px;">
            <p style="font-size:12px;color:#00897B;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.06em;">${q.stage} &middot; step ${q.step + 1} &middot; to ${q.to}</p>
            <p style="font-size:14px;font-weight:600;margin:0 0 10px;">Subject: ${q.subject}</p>
            <div style="border-top:1px solid #eee;padding-top:10px;">${q.html}</div>
          </div>`).join('')}
      </div>`;
    await sendEmail(BILL_EMAIL, `Nurture dry-run: ${queued.length} would send (${today})`, digest);
    return res.status(200).json({ ok: true, mode: 'dry-run', queued: queued.length });
  }

  // Live: send each email to its lead, advance counters.
  let sent = 0;
  for (const q of queued) {
    const ok = await sendEmail(q.to, q.subject, q.html, { replyTo: REPLY_TO_ADDRESS, bcc: BILL_EMAIL });
    if (ok) {
      sent++;
      await patchLead(q.recordId, {
        NurtureStep: q.step + 1,
        NurtureStage: q.stage,
        LastNurtureSentAt: today,
      });
    }
  }

  return res.status(200).json({ ok: true, mode: 'live', queued: queued.length, sent });
}
