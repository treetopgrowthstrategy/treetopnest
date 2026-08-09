// Vercel-native serverless function for Ecofit "Request a Quote" submissions.
// Placed in root api/ (not src/pages/api/) because Astro's Vercel adapter does
// not serve src/pages/api routes alongside the existing root api/ functions.
// Mirrors api/ecofit-assessment-submit.ts: same CORS handling, same Airtable
// pattern, lead persisted FIRST so an email failure can never lose it.

const RESEND_API_KEY   = process.env.RESEND_API_KEY;
const FROM_EMAIL       = 'Ecofit <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL       = process.env.BILL_NOTIFY_EMAIL || 'william.colbert@treetopgrowthstrategy.com';
const DAVE_EMAIL       = process.env.DAVE_NOTIFY_EMAIL || 'dave@myecofit.com';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = (process.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT').split('/')[0];
const QUOTE_TABLE      = 'Ecofit Quote Requests';

interface QuotePayload {
  name: string;
  email: string;
  company: string;
  title: string;
  phone: string;
  answers?: Record<string, string>;
  brands?: string[] | string;
  locationsLabel?: string;
  equipmentLabel?: string;
}

function brandList(data: QuotePayload): string {
  return Array.isArray(data.brands) ? data.brands.join(', ') : (data.brands || '');
}

// ─── EMAIL ──────────────────────────────────────────────────────────────────

async function sendEmail(to: string | string[], subject: string, html: string) {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set'); return; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: Array.isArray(to) ? to : [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
}

function buildBillNotifyEmail(data: QuotePayload): string {
  const rows: [string, string][] = [
    ['Name', data.name],
    ['Email', data.email],
    ['Phone', data.phone || '-'],
    ['Company', data.company],
    ['Title', data.title || '-'],
    ['Locations', data.locationsLabel || data.answers?.locations || '-'],
    ['Equipment / Location', data.equipmentLabel || data.answers?.equipment || '-'],
    ['Brands of Interest', brandList(data) || '-'],
  ];
  const tr = rows.map(([k, v]) =>
    `<tr><td style="padding:7px 0;color:#6b7280;width:170px">${k}</td><td style="padding:7px 0;font-weight:600">${v}</td></tr>`
  ).join('');
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:40px auto;padding:24px;background:#f9fafb">
<div style="background:white;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
  <div style="background:#14191f;padding:16px 24px">
    <span style="font-family:Raleway,sans-serif;font-weight:700;color:#84BC41;font-size:18px">ecofit</span>
    <span style="font-size:12px;color:rgba(242,243,248,0.5);margin-left:12px">New Quote Request</span>
  </div>
  <div style="padding:24px">
    <table style="width:100%;font-size:14px;border-collapse:collapse"><tbody>${tr}</tbody></table>
  </div>
</div>
</body></html>`;
}

// ─── AIRTABLE ─────────────────────────────────────────────────────────────────

async function logToAirtable(data: QuotePayload) {
  if (!AIRTABLE_API_KEY) { console.warn('AIRTABLE_API_KEY not set'); return; }
  const fields: Record<string, unknown> = {
    'Name':                   data.name,
    'Email':                  data.email,
    'Company':                data.company,
    'Title':                  data.title || '',
    'Phone':                  data.phone || '',
    'Locations':              data.locationsLabel || data.answers?.locations || '',
    'Equipment per Location': data.equipmentLabel || data.answers?.equipment || '',
    'Brands':                 brandList(data),
    'Submitted At':           new Date().toISOString(),
  };
  // typecast lets the singleSelect fields accept the human-readable label and
  // auto-create the option if it does not exist yet.
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(QUOTE_TABLE)}`, {
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
    let data: QuotePayload = req.body;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { data = {} as QuotePayload; }
    }

    if (!data || !data.email || !data.name || !data.company) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Bot protection: honeypot only.
    //
    // The random-string heuristic went first, for discarding real leads with
    // camel-case company names like "CrossFitNYC". The time trap goes now, for
    // the same reason: it was dropping real people, verified against production
    // on 2026-08-06.
    //
    // It compared Date.now() on the server against _t from the browser, so it
    // failed two ordinary cases. A visitor whose device clock runs fast makes
    // the difference negative, and negative is always under three seconds. And
    // browser autofill legitimately completes a short form in under three
    // seconds. Both were dropped, and because the drop returned success the
    // visitor saw a confirmation while the lead went nowhere.
    //
    // It also bought nothing. _t is supplied by the client, so any bot defeats
    // the check by sending an older timestamp. It stopped only bots that were
    // not trying, and charged real leads for the privilege. There is no spam to
    // defend against here either: the tables hold no junk across months.
    //
    // The honeypot stays. A bot has to actively avoid filling a hidden field,
    // which is real signal, and it does not misfire on ordinary humans.
    const body: any = data;
    const hp = (body.hp as string | undefined)?.trim() ?? '';
    if (hp.length > 0) {
      console.warn('Bot submission dropped (honeypot):', body.email);
      return res.status(200).json({ success: true });
    }

    // Strip angle brackets before values flow into the notification email or
    // Airtable; they never appear in real names/emails/companies.
    for (const k of ['name', 'email', 'company', 'title'] as const) {
      const v = (data as any)[k];
      if (typeof v === 'string') (data as any)[k] = v.replace(/[<>]/g, '').slice(0, 200);
    }

    // 1. Persist the lead to Airtable FIRST so a Resend failure can never lose it.
    let airtableError: string | null = null;
    await logToAirtable(data).catch(e => { airtableError = String(e); console.error('Airtable:', e); });

    // 2. Notify Bill (best-effort).
    let billEmailError: string | null = null;
    try {
      await sendEmail([BILL_EMAIL, DAVE_EMAIL], `New Ecofit Quote Request: ${data.name} at ${data.company}`, buildBillNotifyEmail(data));
    } catch (e) { billEmailError = String(e); console.error('Bill email failed:', e); }

    return res.status(200).json({ success: true, airtableError, billEmailError });

  } catch (err) {
    console.error('ecofit-quote-submit error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
