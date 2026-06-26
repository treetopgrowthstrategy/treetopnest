// Vercel-native serverless function for the Ecofit insurance-savings estimator.
// Placed in root api/ (not src/pages/api/) because Astro's Vercel adapter does
// not serve src/pages/api routes alongside the existing root api/ functions.
// Mirrors api/ecofit-quote-submit.ts: same CORS, Airtable-first persistence so
// an email failure can never lose the lead.

const RESEND_API_KEY   = process.env.RESEND_API_KEY;
const FROM_EMAIL       = 'Ecofit <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL       = process.env.BILL_NOTIFY_EMAIL || 'william.colbert@treetopgrowthstrategy.com';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = (process.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT').split('/')[0];
const SAVINGS_TABLE    = 'Ecofit Insurance Savings Leads';

interface SavingsPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  phone?: string;
  siteCount?: number | string;
  premiumPerSite?: number | string;
  facilityType?: string;
  coreDeployed?: boolean;
  frontDeskDeployed?: boolean;
  changingDeployed?: boolean;
  timestamp?: string;
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function fullName(data: SavingsPayload): string {
  return `${data.firstName || ''} ${data.lastName || ''}`.trim();
}

function deployedList(data: SavingsPayload): string {
  return [
    data.coreDeployed && 'Core',
    data.frontDeskDeployed && 'Front Desk',
    data.changingDeployed && 'Changing',
  ].filter(Boolean).join(', ') || 'None';
}

// ─── EMAIL ──────────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set'); return; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
}

function buildBillNotifyEmail(data: SavingsPayload): string {
  const rows: [string, string][] = [
    ['Name', fullName(data)],
    ['Email', data.email || '-'],
    ['Phone', data.phone || '-'],
    ['Company', data.company || '-'],
    ['Sites', String(num(data.siteCount))],
    ['Premium / site', '$' + num(data.premiumPerSite).toLocaleString('en-US')],
    ['Facility type', data.facilityType || '-'],
    ['Ecofit deployed', deployedList(data)],
  ];
  const tr = rows.map(([k, v]) =>
    `<tr><td style="padding:7px 0;color:#6b7280;width:150px">${k}</td><td style="padding:7px 0;font-weight:600">${v}</td></tr>`
  ).join('');
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:40px auto;padding:24px;background:#f9fafb">
<div style="background:white;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
  <div style="background:#14191f;padding:16px 24px">
    <span style="font-family:Raleway,sans-serif;font-weight:700;color:#84BC41;font-size:18px">ecofit</span>
    <span style="font-size:12px;color:rgba(242,243,248,0.5);margin-left:12px">New Insurance Savings Lead</span>
  </div>
  <div style="padding:24px">
    <table style="width:100%;font-size:14px;border-collapse:collapse"><tbody>${tr}</tbody></table>
  </div>
</div>
</body></html>`;
}

// ─── AIRTABLE ─────────────────────────────────────────────────────────────────

async function logToAirtable(data: SavingsPayload) {
  if (!AIRTABLE_API_KEY) { console.warn('AIRTABLE_API_KEY not set'); return; }
  const fields: Record<string, unknown> = {
    'Name':                fullName(data),
    'Email':               data.email || '',
    'Company':             data.company || '',
    'Phone':               data.phone || '',
    'Site Count':          num(data.siteCount),
    'Premium Per Site':    num(data.premiumPerSite),
    'Facility Type':       data.facilityType || '',
    'Core Deployed':       !!data.coreDeployed,
    'Front Desk Deployed': !!data.frontDeskDeployed,
    'Changing Deployed':   !!data.changingDeployed,
    'Submitted At':        data.timestamp || new Date().toISOString(),
  };
  // typecast lets the Facility Type singleSelect accept the label string.
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(SAVINGS_TABLE)}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!res.ok) throw new Error(`Airtable failed: ${res.status} ${await res.text()}`);
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  try {
    let data: SavingsPayload = req.body;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { data = {} as SavingsPayload; }
    }

    if (!data || !data.email) {
      return res.status(400).json({ error: 'Missing required field: email' });
    }

    // Strip angle brackets before values flow into the notification email or Airtable.
    for (const k of ['firstName', 'lastName', 'email', 'company', 'facilityType'] as const) {
      const v = (data as any)[k];
      if (typeof v === 'string') (data as any)[k] = v.replace(/[<>]/g, '').slice(0, 200);
    }

    // 1. Persist the lead to Airtable FIRST so a Resend failure can never lose it.
    let airtableError: string | null = null;
    await logToAirtable(data).catch(e => { airtableError = String(e); console.error('Airtable:', e); });

    // 2. Notify Bill (best-effort).
    let billEmailError: string | null = null;
    try {
      await sendEmail(BILL_EMAIL, `New Ecofit Insurance Savings Lead: ${fullName(data) || data.email} at ${data.company || 'unknown'}`, buildBillNotifyEmail(data));
    } catch (e) { billEmailError = String(e); console.error('Bill email failed:', e); }

    return res.status(200).json({ success: true, airtableError, billEmailError });

  } catch (err) {
    console.error('ecofit-savings-submit error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
