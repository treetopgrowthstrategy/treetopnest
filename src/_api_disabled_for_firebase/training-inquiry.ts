export const prerender = false;
import type { APIRoute } from 'astro';

const RESEND_API_KEY   = import.meta.env.RESEND_API_KEY || import.meta.env.MAILGUN_API_KEY;
const FROM_EMAIL       = import.meta.env.MAILGUN_FROM   || 'Bill Colbert <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL       = import.meta.env.BILL_NOTIFY_EMAIL || 'william.colbert@treetopgrowthstrategy.com';
const AIRTABLE_API_KEY = import.meta.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT';

// Leads table ID + field IDs
const LEADS_TABLE      = 'tblrduFQ0e60Gdflw';
const FLD_LEAD_NAME    = 'fldY8rLsYE8i7WeiJ'; // Lead Name (primary)
const FLD_SOURCE       = 'fldBWOdbFUf5pbN02'; // Source
const FLD_STATUS       = 'fldcC3XB6GYwbtVes'; // Status
const FLD_NOTES        = 'fldcEo16Eykm9sD61'; // Notes
const FLD_TRAINING     = 'fldyLDwiA3q95fvEX'; // Claude Training (custom field we just created)

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set'); return; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) console.error('Resend error:', await res.text());
}

async function logToAirtable(data: any) {
  if (!AIRTABLE_API_KEY) { console.warn('AIRTABLE_API_KEY not set'); return; }

  const notes = [
    `Email: ${data.email}`,
    `Title: ${data.title || '—'}`,
    `Team Size: ${data.size || '—'}`,
    `Requested Format: ${data.format || '—'}`,
  ].join('\n');

  const trainingDetail = [
    `Format: ${data.format || 'Not specified'}`,
    `Team Size: ${data.size || 'Not specified'}`,
    `Context: ${data.context || '—'}`,
    `Submitted: ${new Date().toISOString()}`,
  ].join('\n');

  const fields: Record<string, string> = {
    [FLD_LEAD_NAME]: `${data.name} — ${data.company}`,
    [FLD_SOURCE]:    'Claude Training Page',
    [FLD_STATUS]:    'Prospect',
    [FLD_NOTES]:     notes,
    [FLD_TRAINING]:  trainingDetail,
  };

  await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${LEADS_TABLE}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    if (!data.email || !data.name || !data.company) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // 1. Confirmation email to prospect
    const confirmHtml = `<!DOCTYPE html>
<html><head>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:'DM Sans',sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#050D05;overflow:hidden;">
  <div style="padding:24px 32px;border-bottom:1px solid rgba(240,255,240,0.07);">
    <span style="font-family:'Instrument Serif',serif;font-size:18px;font-style:italic;color:#F0FFF0;">Treetop Growth Strategy</span>
  </div>
  <div style="padding:40px 32px;">
    <p style="font-size:14px;color:rgba(240,255,240,0.5);margin:0 0 16px;">${data.name.split(' ')[0]},</p>
    <h1 style="font-family:'Instrument Serif',serif;font-size:26px;font-weight:400;font-style:italic;color:#F0FFF0;line-height:1.2;margin:0 0 16px;">Your training inquiry is in.</h1>
    <p style="font-size:14px;color:#8FAF8F;line-height:1.75;margin:0 0 28px;">I'll follow up within one business day to discuss what would work best for ${data.company}${data.format ? ` — looks like you're interested in the <strong style="color:#F0FFF0;">${data.format}</strong>` : ''}. No commitment, just a conversation.</p>
    ${data.context ? `<div style="background:#0A1A0A;border-left:3px solid rgba(0,200,83,0.3);padding:16px 20px;margin-bottom:28px;"><p style="font-size:12px;color:#4A6A4A;margin:0 0 6px;letter-spacing:0.08em;text-transform:uppercase;">What you shared</p><p style="font-size:13px;color:#8FAF8F;line-height:1.65;margin:0;">${data.context}</p></div>` : ''}
    <p style="font-size:13px;color:#8FAF8F;line-height:1.7;margin:0;">— Bill<br/><span style="color:#4A6A4A;">bill@treetopgrowthstrategy.com</span></p>
  </div>
  <div style="padding:16px 32px;border-top:1px solid rgba(240,255,240,0.07);">
    <span style="font-size:11px;color:rgba(240,255,240,0.2);">© 2026 Treetop Growth Strategy · treetopgrowthstrategy.com</span>
  </div>
</div>
</body></html>`;

    await sendEmail(data.email, `Training inquiry received — ${data.company}`, confirmHtml);

    // 2. Bill notification
    const billHtml = `<!DOCTYPE html>
<html><body style="font-family:sans-serif;max-width:520px;margin:40px auto;padding:24px;background:#f9fafb;">
<div style="background:white;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
  <div style="background:#050D05;padding:16px 24px;">
    <span style="font-family:serif;font-style:italic;color:#F0FFF0;font-size:16px;">Treetop · New Training Inquiry</span>
  </div>
  <div style="padding:24px;">
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#6b7280;width:130px;">Name</td><td style="font-weight:600;">${data.name}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td><a href="mailto:${data.email}" style="color:#00C853;">${data.email}</a></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Company</td><td style="font-weight:600;">${data.company}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Title</td><td>${data.title || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Team Size</td><td>${data.size || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Format</td><td style="font-weight:600;color:#00C853;">${data.format || 'Not specified'}</td></tr>
      ${data.context ? `<tr><td style="padding:6px 0;color:#6b7280;vertical-align:top;">Context</td><td style="line-height:1.6;">${data.context}</td></tr>` : ''}
    </table>
  </div>
</div>
</body></html>`;

    await sendEmail(BILL_EMAIL, `🎓 New Training Inquiry: ${data.name} at ${data.company}`, billHtml);

    // 3. Log to Airtable
    await logToAirtable(data).catch(e => console.error('Airtable log failed:', e));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('training-inquiry error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
