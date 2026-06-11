export const prerender = false;

import type { APIRoute } from 'astro';

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
const FROM_EMAIL     = 'Ecofit <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL     = import.meta.env.BILL_NOTIFY_EMAIL || 'william.colbert@treetopgrowthstrategy.com';
const AIRTABLE_API_KEY = import.meta.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT';
const BOOKING_LINK   = 'https://calendar.app.google/GS5H5y8U3PrN8u4A8';

interface DemoPayload {
  name: string;
  email: string;
  company: string;
  locations: string;
  phone?: string;
}

async function sendConfirmationEmail(data: DemoPayload) {
  if (!RESEND_API_KEY) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: data.email,
      subject: `Your Ecofit Demo — Let's Pick a Time`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:580px;margin:0 auto;background:#14191f;color:#e8eaf0;border-radius:12px;overflow:hidden;">
          <div style="background:#14191f;padding:40px 40px 0;border-bottom:1px solid rgba(132,188,65,0.15);">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#84BC41;margin-bottom:16px;">Ecofit Networks</div>
            <h1 style="font-size:28px;font-weight:700;margin:0 0 16px;line-height:1.2;">Thanks, ${data.name.split(' ')[0]}. Let's find a time.</h1>
            <p style="color:#9699A2;font-size:16px;line-height:1.6;margin:0 0 32px;">We've got your request and will be in touch within one business day. In the meantime, feel free to grab a time directly on our calendar.</p>
          </div>
          <div style="padding:32px 40px;">
            <a href="${BOOKING_LINK}" style="display:inline-block;background:#84BC41;color:#0d1117;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">Book a Demo →</a>
            <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="color:#6b6f7a;font-size:13px;margin:0;">Your info: ${data.company} · ${data.locations} location${data.locations === '1' ? '' : 's'} · ${data.email}</p>
            </div>
          </div>
        </div>
      `
    })
  });
}

async function sendBillNotification(data: DemoPayload) {
  if (!RESEND_API_KEY) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: BILL_EMAIL,
      subject: `🎯 New Demo Request — ${data.name} @ ${data.company}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;">
          <h2 style="margin:0 0 24px;">New Demo Request</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#666;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;">${data.name}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#666;">Company</td><td style="padding:8px 0;font-weight:600;">${data.company}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Locations</td><td style="padding:8px 0;">${data.locations}</td></tr>
            ${data.phone ? `<tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;">${data.phone}</td></tr>` : ''}
          </table>
          <a href="${BOOKING_LINK}" style="display:inline-block;margin-top:24px;background:#84BC41;color:#000;font-weight:700;padding:12px 24px;border-radius:6px;text-decoration:none;">Open Booking Link</a>
        </div>
      `
    })
  });
}

async function logToAirtable(data: DemoPayload) {
  if (!AIRTABLE_API_KEY) return;
  await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Ecofit%20Assessments`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        Name: data.name,
        Email: data.email,
        Company: data.company,
        Locations: data.locations,
        Phone: data.phone || '',
        Title: 'Demo Request',
        'Submitted At': new Date().toISOString(),
      }
    })
  });
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: DemoPayload = await request.json();
    if (!data.name || !data.email || !data.company) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    await Promise.allSettled([
      sendConfirmationEmail(data),
      sendBillNotification(data),
      logToAirtable(data),
    ]);

    return new Response(JSON.stringify({ ok: true, bookingLink: BOOKING_LINK }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    console.error('Demo request error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
