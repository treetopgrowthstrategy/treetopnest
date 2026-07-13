// Free motion, step 2: the LinkedIn unlock + Apollo qualification gate.
// Stores the LinkedIn URL, enriches via Apollo (title, seniority, company size),
// and applies a tunable ICP rule with hybrid routing:
//   clear fit  -> QualifiedStatus 'qualified'  (enters the research drip)
//   clear junk -> QualifiedStatus 'rejected'   (no research spend)
//   ambiguous  -> QualifiedStatus 'review'     (emailed to Bill for a quick look)
// No Apollo key, or no match, defaults to 'review' so nothing is auto-approved for spend.
//
// On 'qualified' or 'review' we also trigger cmo-free-report inline, so the
// visitor's compelling-but-limited snapshot lands within a minute of signup
// instead of waiting on the next daily cron run.
//
// The response never reveals qualification status to the user (no leaking / no gaming).
// POST { email, linkedin } -> { success: true, message }

import { generateAndSendFreeReport } from './cmo-free-report';
import { clientIp, rateLimitSubmission, isDisposableEmail, emailMatchesWebsite, killSwitchOn, alertOps } from './cmo-guards';

// Vercel: give this function up to 60s so the background report generation
// (Ahrefs + OpenAI + Resend) has room to finish after the response is flushed.
export const config = { maxDuration: 60 };

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = (process.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT').split('/')[0];
const AIRTABLE_LEADS_TABLE = process.env.AIRTABLE_LEADS_TABLE || 'tbl7PEKkdYKafCEdC';
const APOLLO_API_KEY = process.env.APOLLO_API_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL     = process.env.RESEND_FROM || 'Bill Colbert <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL     = process.env.BILL_NOTIFY_EMAIL || 'william.colbert@treetopgrowthstrategy.com';

// ICP rule (tunable). Apollo seniority buckets.
const QUALIFIED_SENIORITY = new Set(['owner', 'founder', 'c_suite', 'partner', 'vp', 'head', 'director']);
const JUNK_SENIORITY      = new Set(['intern', 'entry', 'training', 'unpaid']);

interface Enrichment { title: string; seniority: string; companySize: string; companyDomain: string; matched: boolean; }

async function apolloEnrich(email: string, linkedin: string): Promise<Enrichment> {
  const empty: Enrichment = { title: '', seniority: '', companySize: '', companyDomain: '', matched: false };
  if (!APOLLO_API_KEY) return empty;
  try {
    // Apollo people/match: params go in the query string; correct path includes /api/.
    const params = new URLSearchParams({ email, linkedin_url: linkedin, reveal_personal_emails: 'false' });
    const r = await fetch(`https://api.apollo.io/api/v1/people/match?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'X-Api-Key': APOLLO_API_KEY },
    });
    if (!r.ok) { console.error('Apollo match failed', r.status); return empty; }
    const data: any = await r.json();
    const p = data.person;
    if (!p) return empty;
    const org = p.organization || {};
    return {
      title: (p.title || '').toString(),
      seniority: (p.seniority || '').toString().toLowerCase(),
      companySize: org.estimated_num_employees ? String(org.estimated_num_employees) : '',
      companyDomain: (org.primary_domain || org.website_url || '').toString().replace(/^https?:\/\//, '').replace(/\/.*$/, ''),
      matched: true,
    };
  } catch (err) {
    console.error('Apollo enrich error:', err);
    return empty;
  }
}

function classify(e: Enrichment): 'qualified' | 'rejected' | 'review' {
  if (!e.matched || !e.seniority) return 'review';
  if (QUALIFIED_SENIORITY.has(e.seniority)) return 'qualified';
  if (JUNK_SENIORITY.has(e.seniority)) return 'rejected';
  return 'review';
}

async function notifyBill(subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [BILL_EMAIL], subject, html }),
  }).catch(() => {});
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
  const linkedin = (body.linkedin || '').toString().trim();
  if (!email || !/^[^\s@"]+@[^\s@"]+\.[^\s@"]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  if (!linkedin || !/linkedin\.com/i.test(linkedin)) {
    return res.status(400).json({ error: 'Please paste your LinkedIn profile URL.' });
  }
  const linkedinUrl = /^https?:\/\//i.test(linkedin) ? linkedin : 'https://' + linkedin.replace(/^\/+/, '');

  // Neutral response used for silent drops so nothing leaks to an abuser.
  const NEUTRAL = {
    success: true,
    message: 'You are all set. Your competitive snapshot is on its way. It should land in your inbox in a couple minutes. Reply to it any time to talk to your AI CMO.',
  };

  // Abuse guards, before any paid work (Apollo enrich, then the inline report).
  const ip = clientIp(req);
  if (isDisposableEmail(email)) {
    return res.status(200).json(NEUTRAL); // disposable inbox: no capture, no spend
  }
  const rl = await rateLimitSubmission(ip, email, 'q');
  if (!rl.ok) {
    await alertOps(
      'qualify-rate',
      'AI CMO qualify rate limit tripped',
      `<p style="font-family:sans-serif;">Rate limit tripped on /api/cmo-free-qualify (${rl.reason}) for ${email} from ${ip}. Possible abuse.</p>`,
    );
    return res.status(200).json(NEUTRAL); // silent, no leak, no spend
  }

  // Kill switch pauses spend (Apollo + report) but keeps intake alive: the lead
  // is still captured below, held as 'review' with no enrichment spend.
  const paused = killSwitchOn();
  const enrichment = paused
    ? { title: '', seniority: '', companySize: '', companyDomain: '', matched: false }
    : await apolloEnrich(email, linkedinUrl);
  let status = classify(enrichment);

  // Persist to the lead record.
  try {
    if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_LEADS_TABLE}`;
      const auth = { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' };
      const q = encodeURIComponent(`LOWER({Email})="${email}"`);
      const fr = await fetch(`${base}?filterByFormula=${q}&maxRecords=1`, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
      const fd: any = fr.ok ? await fr.json() : { records: [] };
      const rec = fd.records?.[0];
      // Plausibility: an auto-qualified lead whose email domain does not match
      // the company website they submitted gets held for review, not
      // auto-approved (guards against a free-provider email claiming a big brand).
      const submittedSite = (rec?.fields?.WebsiteURL || '').toString();
      if (status === 'qualified' && submittedSite && !emailMatchesWebsite(email, submittedSite)) {
        status = 'review';
      }
      const fields: Record<string, any> = {
        LinkedInURL: linkedinUrl,
        QualifiedStatus: status,
      };
      if (enrichment.title)       fields.Title = enrichment.title;
      if (enrichment.seniority)   fields.Seniority = enrichment.seniority;
      if (enrichment.companySize) fields.CompanySize = enrichment.companySize;
      if (rec) {
        // Only anchor the free-motion drip when this lead is NOT already in the paid funnel;
        // never reset a paid lead's StageSince (it drives their recovery/ladder-climb cadence).
        if (!(rec.fields?.Stage || '').toString().trim()) fields.StageSince = new Date().toISOString().slice(0, 10);
        // Backfill a company website from Apollo when we do not have one (covers personal-email signups).
        if (enrichment.companyDomain && !rec.fields?.WebsiteURL) fields.WebsiteURL = 'https://' + enrichment.companyDomain;
        await fetch(`${base}/${rec.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ fields }) });
      } else {
        fields.StageSince = new Date().toISOString().slice(0, 10);
        fields.Name = email.split('@')[0];
        fields.Email = email;
        fields.Source = 'cmo-free';
        if (enrichment.companyDomain) fields.WebsiteURL = 'https://' + enrichment.companyDomain;
        await fetch(base, { method: 'POST', headers: auth, body: JSON.stringify({ fields }) });
      }
    }
  } catch (err) {
    console.error('cmo-free-qualify persist error:', err);
  }

  // Route ambiguous leads to Bill for a quick human look.
  if (status === 'review') {
    await notifyBill(
      `Free lead to review: ${email}`,
      `<div style="font-family:sans-serif;line-height:1.6;"><p>A free-snapshot lead needs a quick qualify decision (Apollo was inconclusive${APOLLO_API_KEY ? '' : ' or not configured'}).</p>
       <p><strong>Email:</strong> ${email}<br/><strong>LinkedIn:</strong> <a href="${linkedinUrl}">${linkedinUrl}</a><br/>
       <strong>Title:</strong> ${enrichment.title || 'n/a'}<br/><strong>Seniority:</strong> ${enrichment.seniority || 'n/a'}<br/>
       <strong>Company size:</strong> ${enrichment.companySize || 'n/a'}</p>
       <p>Set QualifiedStatus to 'qualified' in Airtable to release the free research, or leave as-is to hold.</p>
       <p>Note: the limited snapshot fires for qualified and review leads. Rejected leads get nothing.</p></div>`,
    );
  }

  // Flush the friendly success response FIRST so the user never waits on the
  // Ahrefs + OpenAI + Resend work. Vercel keeps the function alive after
  // res.json() (up to maxDuration) so the background await still completes.
  // Same message regardless of status, so nothing leaks about qualification.
  res.status(200).json({
    success: true,
    message: 'You are all set. Your competitive snapshot is on its way. It should land in your inbox in a couple minutes. Reply to it any time to talk to your AI CMO.',
  });

  // Background work. Rejected leads get no research spend; the kill switch
  // pauses it entirely. All errors are logged and swallowed since the user
  // already has their success response.
  if (!paused && status !== 'rejected') {
    try {
      const result = await generateAndSendFreeReport({ email });
      if (!result.sent) console.log('cmo-free-qualify: report not sent,', result.reason);
    } catch (err) {
      console.error('cmo-free-qualify: report trigger failed:', err);
    }
  }
}
