// Free motion, step 1: capture email + website (no verification email, no paid Stage).
// The lead is captured immediately so we can lightly nurture even if they never
// complete step 2 (the LinkedIn unlock). No research spend happens here.
// POST { email, website, hp, _t } -> { success: true }

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = (process.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT').split('/')[0];
const AIRTABLE_LEADS_TABLE = process.env.AIRTABLE_LEADS_TABLE || 'tbl7PEKkdYKafCEdC';

const FREE_PROVIDERS = new Set([
  'gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','aol.com',
  'proton.me','protonmail.com','gmx.com','live.com','msn.com','me.com','ymail.com',
]);

function looksRandom(s: string): boolean {
  const t = (s || '').trim();
  if (t.length < 10 || t.includes(' ')) return false;
  return ((t.slice(1).match(/[A-Z]/g) || []).length) >= 3;
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
  if (!email || !/^[^\s@"]+@[^\s@"]+\.[^\s@"]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  // Bot filters (silent 200 so bots do not retry).
  const hp       = (body.hp || '').toString().trim();
  const loadTime = Number(body._t) || 0;
  const elapsed  = loadTime ? Date.now() - loadTime : Infinity;
  if (hp.length > 0 || (loadTime > 0 && elapsed < 3000) || looksRandom(email.split('@')[0])) {
    return res.status(200).json({ success: true });
  }

  const website     = (body.website || '').toString().trim();
  const emailDomain = email.split('@')[1] || '';
  let websiteUrl = '';
  if (website) {
    websiteUrl = /^https?:\/\//i.test(website) ? website : 'https://' + website.replace(/^\/+/, '');
  } else if (emailDomain && !FREE_PROVIDERS.has(emailDomain)) {
    websiteUrl = 'https://' + emailDomain;
  }

  try {
    if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_LEADS_TABLE}`;
      const auth = { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' };
      const q = encodeURIComponent(`LOWER({Email})="${email}"`);
      const findRes = await fetch(`${base}?filterByFormula=${q}&maxRecords=1`, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
      const found: any = findRes.ok ? await findRes.json() : { records: [] };
      const rec = found.records?.[0];
      if (rec) {
        const patch: Record<string, any> = {};
        if (websiteUrl && !rec.fields?.WebsiteURL) patch.WebsiteURL = websiteUrl;
        // Do not overwrite a paid/onboarded lead's Source; only tag genuinely new free leads.
        if (!rec.fields?.Source) patch.Source = 'cmo-free';
        if (Object.keys(patch).length) {
          await fetch(`${base}/${rec.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ fields: patch }) });
        }
      } else {
        await fetch(base, {
          method: 'POST',
          headers: auth,
          body: JSON.stringify({ fields: {
            Name: email.split('@')[0],
            Email: email,
            Source: 'cmo-free',
            QualifiedStatus: 'pending',
            ...(websiteUrl ? { WebsiteURL: websiteUrl } : {}),
            Notes: 'Free competitive snapshot signup. Awaiting LinkedIn to qualify.',
          } }),
        });
      }
    }
  } catch (err) {
    console.error('cmo-free-start upsert error:', err);
  }

  return res.status(200).json({ success: true });
}
