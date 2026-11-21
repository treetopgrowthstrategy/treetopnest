// Section click tracker for locked report CTAs.
//
// GET /api/cmo-click?s=<slug>&t=<token>
//
// Verifies the HMAC token, appends {section, clickedAt} to the lead's
// ClickedSections JSON array in Airtable (best-effort), then 302 redirects
// to the payment page. Invalid/missing tokens redirect to the pricing page.

import { verifyToken } from './cmo-report.js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = (process.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT').split('/')[0];
const AIRTABLE_TABLE   = process.env.AIRTABLE_LEADS_TABLE || 'tbl7PEKkdYKafCEdC';
const SITE             = 'https://treetopgrowthstrategy.com';

const VALID_SECTIONS = new Set([
  'snapshot', 'keyword-gap', 'positioning', 'levers', 'roadmap', 'first-move',
]);

function enc(s: string): string {
  return encodeURIComponent(s);
}

async function trackClick(email: string, section: string): Promise<void> {
  if (!AIRTABLE_API_KEY) return;
  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`;
  const formula = encodeURIComponent(`LOWER({Email})="${email.replace(/"/g, '')}"`);
  const r = await fetch(`${base}?filterByFormula=${formula}&maxRecords=1`, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
  });
  if (!r.ok) return;
  const data: any = await r.json();
  const rec = data.records?.[0];
  if (!rec) return;

  let existing: Array<{ section: string; clickedAt: string }> = [];
  try { existing = JSON.parse(rec.fields?.ClickedSections || '[]'); } catch { existing = []; }
  existing.push({ section, clickedAt: new Date().toISOString() });

  await fetch(`${base}/${rec.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { ClickedSections: JSON.stringify(existing) } }),
  });
}

export default async function handler(req: any, res: any) {
  const section = (req.query?.s || '').toString();
  const token   = (req.query?.t || '').toString();

  const email = token ? verifyToken(token) : null;

  if (!email || !VALID_SECTIONS.has(section)) {
    return res.status(302).setHeader('Location', `${SITE}/ai-cmo-advisor/pricing`).end();
  }

  trackClick(email, section).catch(err => console.error('Click tracking failed:', err));

  const payUrl = `${SITE}/api/cmo-pay?e=${enc(email)}`;
  return res.status(302).setHeader('Location', payUrl).end();
}
