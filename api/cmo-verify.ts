import crypto from 'node:crypto';

const SITE          = 'https://treetopgrowthstrategy.com';
const TOKEN_SECRET  = process.env.CMO_TOKEN_SECRET || 'cmo-dev-secret-change-me';
const MAX_AGE_MS    = 24 * 60 * 60 * 1000;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = (process.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT').split('/')[0];
const AIRTABLE_LEADS_TABLE = process.env.AIRTABLE_LEADS_TABLE || 'tbl7PEKkdYKafCEdC';

function makeToken(email: string, ts: number): string {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(`${email}:${ts}`).digest('hex');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).end();

  const { e, t, s } = req.query as Record<string, string>;

  if (!e || !t || !s) {
    return res.redirect(302, `${SITE}/ai-cmo-advisor?err=invalid-link`);
  }

  let email: string;
  try {
    email = Buffer.from(e, 'base64url').toString('utf-8');
  } catch {
    return res.redirect(302, `${SITE}/ai-cmo-advisor?err=invalid-link`);
  }

  if (!email || !/^[^\s@"]+@[^\s@"]+\.[^\s@"]+$/.test(email)) {
    return res.redirect(302, `${SITE}/ai-cmo-advisor?err=invalid-link`);
  }

  const ts = Number(t);
  if (!ts || isNaN(ts) || Date.now() - ts > MAX_AGE_MS) {
    return res.redirect(302, `${SITE}/ai-cmo-advisor?err=link-expired`);
  }

  const expected = makeToken(email, ts);
  let valid = false;
  try {
    if (s.length === 64 && expected.length === 64) {
      valid = crypto.timingSafeEqual(Buffer.from(s, 'hex'), Buffer.from(expected, 'hex'));
    }
  } catch {
    valid = false;
  }

  if (!valid) {
    return res.redirect(302, `${SITE}/ai-cmo-advisor?err=invalid-token`);
  }

  // Advance Stage to 'verified' (never downgrade someone already further along).
  const lower = email.toLowerCase();
  try {
    if (AIRTABLE_API_KEY) {
      const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_LEADS_TABLE}`;
      const auth = { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' };
      const q = encodeURIComponent(`LOWER({Email})="${lower}"`);
      const fr = await fetch(`${base}?filterByFormula=${q}&maxRecords=1`, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
      const fd: any = fr.ok ? await fr.json() : { records: [] };
      const rec = fd.records?.[0];
      if (rec) {
        const cur = rec.fields?.Stage;
        if (!cur || cur === 'unverified') {
          await fetch(`${base}/${rec.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ fields: { Stage: 'verified', StageSince: new Date().toISOString().slice(0, 10) } }) });
        }
      } else {
        await fetch(base, { method: 'POST', headers: auth, body: JSON.stringify({ fields: { Name: lower.split('@')[0], Email: lower, Source: 'cmo-verify', Stage: 'verified', StageSince: new Date().toISOString().slice(0, 10) } }) });
      }
    }
  } catch (err) { console.error('verify stage update error:', err); }

  const encoded = Buffer.from(email).toString('base64url');
  return res.redirect(302, `${SITE}/ai-cmo-advisor/onboarding?e=${encoded}`);
}
