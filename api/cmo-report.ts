// Hosted report permalink. Serves a previously generated report (free snapshot
// or paid) at an unguessable, stateless URL so a lead can revisit or share it.
//
//   /r/<token>  ->  (vercel rewrite)  ->  /api/cmo-report?token=<token>
//   token = base64url(email) + "." + HMAC-SHA256("report:"+email, CMO_TOKEN_SECRET)
//
// Stateless: the token is derived from the email + the shared secret (same
// pattern as the verify links), so no per-report token needs storing. View
// tracking is best-effort and degrades silently if the tracking fields are
// absent, so it never blocks serving the report.

import crypto from 'node:crypto';

export const config = { maxDuration: 10 };

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = (process.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT').split('/')[0];
const AIRTABLE_TABLE   = process.env.AIRTABLE_LEADS_TABLE || 'tbl7PEKkdYKafCEdC';
const TOKEN_SECRET     = process.env.CMO_TOKEN_SECRET || 'cmo-dev-secret-change-me';
const SITE             = 'https://treetopgrowthstrategy.com';

function expectedSig(email: string): string {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(`report:${email}`).digest('hex').slice(0, 32);
}

// Build the public permalink for a report. Exported-by-copy in the senders too
// (kept tiny there to avoid a cross-function import).
export function reportPermalink(email: string, site = SITE): string {
  const e = email.trim().toLowerCase();
  const enc = Buffer.from(e).toString('base64url');
  return `${site}/r/${enc}.${expectedSig(e)}`;
}

function verifyToken(token: string): string | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const encEmail = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let email = '';
  try { email = Buffer.from(encEmail, 'base64url').toString('utf-8').trim().toLowerCase(); } catch { return null; }
  if (!email || !/^[^\s@"]+@[^\s@"]+\.[^\s@"]+$/.test(email)) return null;
  const exp = expectedSig(email);
  if (sig.length !== exp.length) return null;
  let ok = false;
  try { ok = crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(exp, 'hex')); } catch { return null; }
  return ok ? email : null;
}

async function findReport(email: string): Promise<{ id: string; html: string; views: number; firstViewed: string } | null> {
  if (!AIRTABLE_API_KEY) return null;
  const q = encodeURIComponent(`LOWER({Email})="${email.replace(/"/g, '')}"`);
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}?filterByFormula=${q}&maxRecords=1`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
  if (!r.ok) return null;
  const data: any = await r.json();
  const rec = data.records?.[0];
  if (!rec) return null;
  const html = (rec.fields?.['Last Report'] || '').toString();
  if (!html) return null;
  return { id: rec.id, html, views: Number(rec.fields?.ReportViews) || 0, firstViewed: (rec.fields?.ReportFirstViewedAt || '').toString() };
}

// Best-effort: increment the view counter and stamp first-view. Swallows all
// errors (e.g. the tracking fields not existing yet) so serving never breaks.
async function trackView(id: string, views: number, firstViewed: string): Promise<void> {
  if (!AIRTABLE_API_KEY || !id) return;
  const fields: Record<string, any> = { ReportViews: views + 1 };
  if (!firstViewed) fields.ReportFirstViewedAt = new Date().toISOString();
  try {
    await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
  } catch { /* tracking is best-effort */ }
}

function page(inner: string, title: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title}</title>
<style>body{margin:0;background:#f4f6f4;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1a1a1a;padding:24px 14px;}
.wrap{max-width:700px;margin:0 auto;}
.card{background:#fff;border:1px solid #e6e9e6;border-radius:8px;overflow:hidden;}
.foot{max-width:700px;margin:18px auto 0;text-align:center;font-size:12px;color:#8a978a;}
.foot a{color:#00897B;text-decoration:none;}
.empty{max-width:520px;margin:8vh auto;text-align:center;}
.empty h1{font-family:Georgia,serif;font-weight:600;font-size:22px;color:#050D05;}
.empty p{color:#555;line-height:1.6;}
.btn{display:inline-block;margin-top:14px;background:#00C853;color:#050D05;padding:11px 22px;border-radius:5px;text-decoration:none;font-weight:600;font-size:14px;}
</style></head><body>${inner}</body></html>`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.query?.token || req.query?.t || '').toString();
  const email = token ? verifyToken(token) : null;

  const notFound = () => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send(page(
      `<div class="empty"><h1>This report link is not valid</h1><p>The link may be mistyped or expired. If you were sent a report and cannot open it, just reply to that email and we will sort it out.</p><a class="btn" href="${SITE}/ai-cmo-advisor/free">Get a fresh snapshot</a></div>`,
      'Report not found',
    ));
  };

  if (!email) return notFound();

  let report: Awaited<ReturnType<typeof findReport>> = null;
  try { report = await findReport(email); } catch { report = null; }
  if (!report) return notFound();

  // Fire-and-forget view tracking; do not await failures into the response.
  trackView(report.id, report.views, report.firstViewed).catch(() => {});

  const inner = `<div class="wrap"><div class="card">${report.html}</div></div>
    <div class="foot">Prepared by Treetop Growth Strategy &middot; <a href="${SITE}">treetopgrowthstrategy.com</a></div>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).send(page(inner, 'Your competitive report'));
}
