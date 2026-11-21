// Vercel-native serverless function: the Ecofit report download gate.
//
// The dedicated endpoint that public/reports pages on ecofitnetworks.com were
// waiting for (see the TEMPORARY note in the 2025 Annual Ranking Report page,
// which borrows ecofit-quote-submit). Placed in root api/ for the same reason as
// the other ecofit functions: Astro's Vercel adapter does not serve
// src/pages/api/ next to these.
//
// Order of work, mirroring ecofit-assessment-submit:
//   1. Save the lead to Airtable "Ecofit Report Downloads" FIRST, so an email
//      failure can never lose it.
//   2. Email the requester the PDF link (the delivery email).
//   3. Notify Bill.
//
// Ecofit-branded on every path. Never route an ecofit page through
// /api/lead-capture, which answers as Treetop.
//
// Call from the browser on the APEX host: https://treetopgrowthstrategy.com/api/ecofit-report-submit
// (www redirects, and browsers do not follow redirects on a CORS preflight).

const RESEND_API_KEY   = process.env.RESEND_API_KEY;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = (process.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT').split('/')[0];
const AIRTABLE_TABLE   = 'Ecofit%20Report%20Downloads';

// Sender. The delivery email is meant to come from Dave at an ecofit address.
// That needs the sending domain verified in Resend; until ECOFIT_REPORT_FROM is
// set, the existing verified Treetop sender is used, exactly as the assessment
// emails do today.
const FROM_EMAIL   = process.env.ECOFIT_REPORT_FROM || 'Ecofit <bill@treetopgrowthstrategy.com>';
const REPLY_TO     = process.env.ECOFIT_REPORT_REPLY_TO || '';
const NOTIFY_LIST  = (process.env.ECOFIT_REPORT_NOTIFY || process.env.BILL_NOTIFY_EMAIL || 'william.colbert@treetopgrowthstrategy.com')
  .split(',').map(s => s.trim()).filter(Boolean);
const BOOKING_LINK = 'https://calendar.app.google/GS5H5y8U3PrN8u4A8';
const LOGO_URL     = 'https://ecofitnetworks.com/assets/ecofit-logo-nav.png';

// Allowlist. A request can only ever trigger delivery of a report listed here.
interface ReportDef { title: string; pdfUrl: string; subject: string; preview: string; }
const REPORTS: Record<string, ReportDef> = {
  '2026-equipment-trends': {
    title:   '2026 Equipment Trends and 2027 Outlook',
    pdfUrl:  process.env.ECOFIT_TRENDS_2026_PDF_URL
             || 'https://ecofitnetworks.com/reports/files/ecofit-2026-equipment-trends-2027-outlook.pdf',
    subject: 'Your copy of the 2026 Equipment Trends and 2027 Outlook',
    preview: 'What changed on the cardio floor between 2025 and 2026, with the method on page 2.',
  },
};

interface Payload {
  report: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
  consent: boolean;
  source: string;
  hp?: string;
}

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;

function clean(v: unknown, max = 200): string {
  return typeof v === 'string' ? v.replace(/[<>]/g, '').trim().slice(0, max) : '';
}

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── EMAIL ────────────────────────────────────────────────────────────────────

async function sendEmail(opts: { to: string | string[]; subject: string; html: string; text: string; replyTo?: string }) {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set'); return; }
  const body: Record<string, unknown> = { from: FROM_EMAIL, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text };
  if (opts.replyTo) body.reply_to = opts.replyTo;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
}

function deliveryText(d: Payload, r: ReportDef): string {
  return [
    `Hi ${d.firstName},`,
    '',
    'Here is the report you asked for.',
    '',
    `Download the ${r.title}: ${r.pdfUrl}`,
    '',
    'If you only have five minutes, start with section 2, the treadmill paradox, and section 4, what one number hides. The method is on page 2 if you want to check our work first.',
    '',
    `The market moved about four percent this year. Your floor did something of its own. If you want to see your own floor's number, book a time with us: ${BOOKING_LINK}`,
    '',
    'Dave Johnson',
    'Ecofit Networks',
  ].join('\n');
}

function deliveryHtml(d: Payload, r: ReportDef): string {
  const p = 'margin:0 0 16px;font-size:15px;line-height:1.65;color:#2b3036;';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f3f5;font-family:'Work Sans',Helvetica,Arial,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(r.preview)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f3f5;padding:28px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:10px;overflow:hidden;">
  <tr><td style="background:#14191f;padding:22px 28px;"><img src="${LOGO_URL}" width="140" alt="ecofit" style="display:block;border:0;height:auto;"></td></tr>
  <tr><td style="padding:28px 28px 8px;">
    <p style="${p}">Hi ${esc(d.firstName)},</p>
    <p style="${p}">Here is the report you asked for.</p>
    <p style="margin:0 0 22px;"><a href="${r.pdfUrl}" style="display:inline-block;background:#84BC41;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 24px;border-radius:8px;">Download the ${esc(r.title)}</a></p>
    <p style="${p}">If you only have five minutes, start with section 2, the treadmill paradox, and section 4, what one number hides. The method is on page 2 if you want to check our work first.</p>
    <p style="${p}">The market moved about four percent this year. Your floor did something of its own. If you want to see your own floor's number, <a href="${BOOKING_LINK}" style="color:#5e8f25;">book a time with us</a>.</p>
    <p style="margin:24px 0 4px;font-size:15px;color:#2b3036;">Dave Johnson</p>
    <p style="margin:0 0 24px;font-size:13px;color:#6b6f7a;">Ecofit Networks</p>
  </td></tr>
  <tr><td style="padding:16px 28px;border-top:1px solid #eceef1;font-size:12px;line-height:1.5;color:#8a8e98;">You are receiving this because you requested this report at ecofitnetworks.com. Ecofit Networks Inc.</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function notifyHtml(d: Payload, r: ReportDef, airtableError: string | null, deliveryError: string | null): string {
  const row = (k: string, v: string) => `<tr><td style="padding:6px 0;color:#6b7280;width:150px">${k}</td><td style="padding:6px 0">${v}</td></tr>`;
  return `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#111">
<p style="margin:0 0 12px"><strong>New report download:</strong> ${esc(r.title)}</p>
<table style="border-collapse:collapse">
${row('Name', esc(`${d.firstName} ${d.lastName}`.trim()))}
${row('Email', esc(d.email))}
${row('Company', esc(d.company))}
${row('Role', esc(d.role || '-'))}
${row('Marketing consent', d.consent ? 'Yes' : 'No')}
${row('Source', esc(d.source || '-'))}
</table>
${airtableError ? `<p style="color:#b91c1c">Airtable save failed: ${esc(airtableError.slice(0, 300))}</p>` : ''}
${deliveryError ? `<p style="color:#b91c1c">Delivery email failed: ${esc(deliveryError.slice(0, 300))}</p>` : ''}
</div>`;
}

// ─── AIRTABLE ─────────────────────────────────────────────────────────────────

async function logToAirtable(d: Payload, r: ReportDef) {
  if (!AIRTABLE_API_KEY) throw new Error('AIRTABLE_API_KEY not set');
  const fields: Record<string, unknown> = {
    'Name':              `${d.firstName} ${d.lastName}`.trim(),
    'Email':             d.email,
    'Company':           d.company,
    'Report':            r.title,
    'Role':              d.role,
    'Marketing Consent': d.consent,
    'Source':            d.source,
    'Submitted At':      new Date().toISOString(),
  };
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    // typecast lets Airtable add this report's title as a new "Report" option.
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  try {
    let raw: any = req.body;
    if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { raw = {}; } }
    raw = raw || {};

    // Honeypot only, the same rule as the other ecofit forms (time traps were
    // dropped there for discarding real leads). Answer success so bots learn nothing.
    if (typeof raw.hp === 'string' && raw.hp.trim().length > 0) {
      console.warn('Bot submission dropped (honeypot)');
      return res.status(200).json({ success: true });
    }

    const report = REPORTS[clean(raw.report, 60)];
    if (!report) return res.status(400).json({ error: 'Unknown report' });

    const d: Payload = {
      report:    clean(raw.report, 60),
      firstName: clean(raw.firstName, 80),
      lastName:  clean(raw.lastName, 80),
      email:     clean(raw.email, 200).toLowerCase(),
      company:   clean(raw.company, 200),
      role:      clean(raw.role, 80),
      consent:   raw.consent === true,
      source:    clean(raw.source, 500),
    };
    if (!d.firstName || !d.lastName || !d.company || !EMAIL_RE.test(d.email)) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    // 1. Save the lead first.
    let airtableError: string | null = null;
    try { await logToAirtable(d, report); }
    catch (e) { airtableError = String(e); console.error('Airtable:', e); }

    // 2. Deliver the report (best effort; a bad address must not 500 the request).
    let deliveryError: string | null = null;
    try {
      await sendEmail({ to: d.email, subject: report.subject, html: deliveryHtml(d, report), text: deliveryText(d, report), replyTo: REPLY_TO || undefined });
    } catch (e) { deliveryError = String(e); console.error('Delivery email failed:', e); }

    // 3. Notify (best effort).
    try {
      await sendEmail({
        to: NOTIFY_LIST,
        subject: `Report download: ${`${d.firstName} ${d.lastName}`.trim()} at ${d.company}${airtableError || deliveryError ? ' (needs attention)' : ''}`,
        html: notifyHtml(d, report, airtableError, deliveryError),
        text: `New report download: ${report.title}\n${d.firstName} ${d.lastName}, ${d.email}, ${d.company}, ${d.role || '-'}\nConsent: ${d.consent ? 'yes' : 'no'}\nSource: ${d.source || '-'}\n${airtableError ? `Airtable failed: ${airtableError}\n` : ''}${deliveryError ? `Delivery failed: ${deliveryError}\n` : ''}`,
      });
    } catch (e) { console.error('Notify email failed:', e); }

    // Only fail the visitor when the lead was neither saved nor delivered.
    if (airtableError && deliveryError) return res.status(500).json({ error: 'Could not process request' });
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('ecofit-report-submit error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
