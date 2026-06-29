import crypto from 'node:crypto';

const RESEND_API_KEY   = process.env.RESEND_API_KEY;
const FROM_EMAIL       = process.env.RESEND_FROM || 'Bill Colbert <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL       = process.env.BILL_NOTIFY_EMAIL || 'william.colbert@treetopgrowthstrategy.com';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = (process.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT').split('/')[0];
const AIRTABLE_LEADS_TABLE = process.env.AIRTABLE_LEADS_TABLE || 'tbl7PEKkdYKafCEdC';
const SITE             = 'https://treetopgrowthstrategy.com';
const TOKEN_SECRET     = process.env.CMO_TOKEN_SECRET || 'cmo-dev-secret-change-me';

function makeToken(email: string, ts: number): string {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(`${email}:${ts}`).digest('hex');
}

function looksRandom(s: string): boolean {
  const t = (s || '').trim();
  if (t.length < 10 || t.includes(' ')) return false;
  return ((t.slice(1).match(/[A-Z]/g) || []).length) >= 3;
}

async function sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set'); return false; }
  const body: Record<string, any> = { from: FROM_EMAIL, to: [to], subject, html };
  if (replyTo) body.reply_to = [replyTo];
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { console.error('Resend error:', res.status, await res.text()); return false; }
  return true;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  const email = (body.email || '').toString().trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const hp       = (body.hp || '').toString().trim();
  const loadTime = Number(body._t) || 0;
  const elapsed  = loadTime ? Date.now() - loadTime : Infinity;

  if (hp.length > 0 || (loadTime > 0 && elapsed < 3000) || looksRandom(email.split('@')[0])) {
    return res.status(200).json({ success: true }); // silent bot drop
  }

  const ts       = Date.now();
  const token    = makeToken(email, ts);
  const encoded  = Buffer.from(email).toString('base64url');
  const verifyUrl = `${SITE}/api/cmo-verify?e=${encoded}&t=${ts}&s=${token}`;

  const verifyHtml = `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;padding:36px 28px;color:#1a1a1a;line-height:1.65;">
      <p style="margin:0 0 20px;font-size:15px;">Hi,</p>
      <p style="margin:0 0 20px;font-size:15px;">Thanks for signing up for the AI CMO Advisor. Click below to verify your email and continue to the onboarding questionnaire. It takes about 10 minutes and is what makes the report specific to your situation rather than generic.</p>
      <p style="margin:0 0 32px;">
        <a href="${verifyUrl}" style="display:inline-block;background:#00C853;color:#050D05;padding:14px 24px;text-decoration:none;font-weight:600;font-size:15px;border-radius:4px;">
          Verify my email and continue &rarr;
        </a>
      </p>
      <p style="margin:0 0 12px;font-size:13px;color:#888;">Direct link:<br/><a href="${verifyUrl}" style="color:#00897B;word-break:break-all;">${verifyUrl}</a></p>
      <p style="margin:20px 0 8px;font-size:13px;color:#999;border-top:1px solid #eaeaea;padding-top:18px;">This link expires in 24 hours. If you did not sign up for the AI CMO Advisor, ignore this email.</p>
      <p style="margin:20px 0 4px;font-size:14px;color:#1a1a1a;">Bill Colbert</p>
      <p style="margin:0;font-size:13px;color:#888;">Founder, Treetop Growth Strategy<br/><a href="${SITE}" style="color:#888;">treetopgrowthstrategy.com</a></p>
    </div>
  `;
  await sendEmail(email, 'Verify your email for the AI CMO Advisor', verifyHtml);

  try {
    if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_LEADS_TABLE}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            Name: email.split('@')[0],
            Email: email,
            Source: 'cmo-signup',
            Notes: 'AI CMO Advisor signup. Verification email sent.',
          },
        }),
      });
    }
  } catch (err) {
    console.error('Airtable log error:', err);
  }

  await sendEmail(
    BILL_EMAIL,
    `New AI CMO signup: ${email}`,
    `<div style="font-family:sans-serif;padding:20px;"><p>New signup from <a href="mailto:${email}">${email}</a>. Verification email sent. Waiting for them to complete onboarding.</p></div>`,
    email,
  );

  return res.status(200).json({ success: true });
}
