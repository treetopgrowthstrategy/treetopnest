// Free-motion report generator + sender.
//
// Produces a compelling-but-limited AI CMO snapshot: two REVEALED sections
// (user's own metrics + three competitors we inferred from Ahrefs + one
// named keyword opportunity) and four LOCKED sections that tease the paid
// $99 report. Delivered via Resend within seconds of qualification, not
// tomorrow morning's cron drift.
//
// Exports:
//   generateAndSendFreeReport({ email, website?, lead? }) -> { sent, mode, reason? }
//     Called inline from cmo-free-qualify.ts after the ICP classification.
//
// Default POST handler is a manual re-run endpoint for a specific email
// (useful for retrying failed sends and for CLI-style testing).
//   POST /api/cmo-free-report { email, website? } -> { sent, mode, reason? }

import { killSwitchOn, budgetAvailable, consumeBudget, adminAuthorized, alertOps } from './cmo-guards.js';
import { reportPermalink } from './cmo-report.js';
import { fetchOwnMetrics, fetchTopKeywords, fetchCompetitors, enrichCompetitors } from './cmo-ahrefs.js';
import type { DomainMetrics, CompetitorRow, KeywordRow } from './cmo-ahrefs.js';

// Vercel: give this function up to 60s. Ahrefs (3 parallel) + OpenAI GPT-4o
// with JSON output + Resend typically finishes in 10-20s, but Ahrefs can
// occasionally spike. The default 10-15s is not enough.
export const config = { maxDuration: 60 };

const AIRTABLE_API_KEY   = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID   = (process.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT').split('/')[0];
const AIRTABLE_TABLE     = process.env.AIRTABLE_LEADS_TABLE || 'tbl7PEKkdYKafCEdC';
const OPENAI_API_KEY     = process.env.OPENAI_API_KEY || '';
const RESEND_API_KEY     = process.env.RESEND_API_KEY || '';
const FROM_EMAIL         = process.env.RESEND_FROM || 'Bill Colbert <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL         = process.env.BILL_NOTIFY_EMAIL || 'william.colbert@treetopgrowthstrategy.com';
const REPLY_TO_ADDRESS   = process.env.CMO_REPLY_TO_EMAIL || 'bill@reports.treetopgrowthstrategy.com';
const SITE               = 'https://treetopgrowthstrategy.com';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportData {
  ownDomain: string;
  own: DomainMetrics | null;
  competitors: CompetitorRow[];
  topKeywords: KeywordRow[];
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function todayISO(): string { return new Date().toISOString().slice(0, 10); }

function firstName(rec: any): string {
  const n = (rec?.fields?.Name || '').toString().trim();
  if (n && !n.includes('@')) return n.split(/[\s._-]+/)[0].replace(/^\w/, (c: string) => c.toUpperCase());
  const local = (rec?.fields?.Email || '').toString().split('@')[0].split(/[._-]+/)[0];
  return local ? local.replace(/^\w/, (c: string) => c.toUpperCase()) : 'there';
}

function pickDomain(email: string, website?: string, existingWebsite?: string): string {
  const candidates = [website, existingWebsite]
    .filter(Boolean)
    .map(w => w!.toString().trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].toLowerCase());
  if (candidates[0]) return candidates[0];
  const dom = email.split('@')[1] || '';
  const FREE = new Set(['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','aol.com','proton.me','protonmail.com','gmx.com','live.com','msn.com','me.com','ymail.com']);
  return FREE.has(dom) ? '' : dom;
}

function enc(email: string): string { return Buffer.from(email).toString('base64url'); }

// ─── Airtable ─────────────────────────────────────────────────────────────────

async function findLead(email: string): Promise<any | null> {
  if (!AIRTABLE_API_KEY) return null;
  const q = encodeURIComponent(`LOWER({Email})="${email.replace(/"/g, '')}"`);
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}?filterByFormula=${q}&maxRecords=1`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
  if (!r.ok) return null;
  const data: any = await r.json();
  return data.records?.[0] || null;
}

async function patchLead(recordId: string, fields: Record<string, any>): Promise<void> {
  if (!AIRTABLE_API_KEY || !recordId) return;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}/${recordId}`;
  const r = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!r.ok) console.error('cmo-free-report patchLead failed', r.status, await r.text());
}

// ─── OpenAI teaser copy ───────────────────────────────────────────────────────

async function writeTeasers(data: ReportData): Promise<{
  competitiveLine: string;
  keywordCallout: { keyword: string; why: string } | null;
  lockedHints: { snapshot: string; keywordGap: string; positioning: string; levers: string; roadmap: string; firstMove: string };
} | null> {
  if (!OPENAI_API_KEY) return null;

  const competitorList = data.competitors.length
    ? data.competitors.map(c => `${c.domain} (DR ${c.domainRating ?? 'n/a'}, ~${c.orgTraffic?.toLocaleString() ?? 'n/a'} monthly visits)`).join('; ')
    : '(no clear competitors identified)';
  const kwSample = data.topKeywords.slice(0, 12)
    .map(k => `"${k.keyword}" (vol ${k.volume}, pos ${k.best_position})`)
    .join(', ') || '(no keyword data)';
  const own = data.own;

  const prompt = `You are Bill Colbert, a fractional CMO who has just analyzed a prospect's organic search data. Write teaser copy for a FREE competitive snapshot email that proves you have done real analysis, not generic marketing. Every sentence should reference a specific data point, competitor name, keyword, or metric from the data below. The reader should finish each teaser thinking "this person actually looked at my business."

The visitor's own site is ${data.ownDomain}${own ? ` (DR ${own.domainRating ?? 'n/a'}, ~${own.orgTraffic?.toLocaleString() ?? 'n/a'} monthly organic visits, ${own.orgKeywords?.toLocaleString() ?? 'n/a'} ranking keywords)` : ''}.

Ahrefs found these as their top organic competitors: ${competitorList}.
Their current top-traffic keywords: ${kwSample}.

Return STRICT JSON with this shape (no markdown fences, no prose outside JSON):
{
  "competitiveLine": "one sentence, 20-35 words, that names how the competitor lineup shapes their position. Reference at least one competitor by name and a specific metric gap.",
  "keywordCallout": { "keyword": "one keyword from the list above worth chasing OR a clear adjacent one they should own", "why": "one sentence, 15-25 words, on why this is the right first move. Reference volume or position data." },
  "lockedHints": {
    "snapshot":    "1-2 sentences, 20-35 words. Reference a specific data point from the competitive analysis above (a DR gap, a traffic ratio, a competitor name) to prove you did real work.",
    "keywordGap":  "1-2 sentences, 20-35 words. Name one or two keyword themes from the data and hint at the size of the opportunity (volume, gap, or position delta).",
    "positioning": "1-2 sentences, 20-35 words. Reference a specific angle or content category from the keyword data that the brand could own.",
    "levers":      "1-2 sentences, 20-35 words. Name one concrete lever visible from the data (e.g. link authority, content depth, a specific topic cluster).",
    "roadmap":     "1-2 sentences, 20-35 words. Reference a realistic timeline milestone and what changes in month 1 vs month 3 based on the current state.",
    "firstMove":   "1-2 sentences, 20-35 words. Name the single most obvious next move visible from the data and why it is the right starting point."
  }
}

HARD RULES: no em dashes anywhere, no en dashes used as em dashes, plain prose only, no marketing platitudes.`;

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 900,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!r.ok) { console.error('OpenAI teaser call failed', r.status, await r.text()); return null; }
    const j: any = await r.json();
    const txt = j.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(txt);
    return parsed;
  } catch (err) {
    console.error('writeTeasers failed:', err);
    return null;
  }
}

// ─── Fallback copy ────────────────────────────────────────────────────────────

function fallbackTeasers(data: ReportData) {
  const namedCompetitor = data.competitors[0]?.domain || 'the current market leaders';
  const kw = data.topKeywords[0]?.keyword;
  return {
    competitiveLine: `Your top-competing domains include ${namedCompetitor}, which shapes where the search traffic actually sits and where the honest gaps are.`,
    keywordCallout: kw
      ? { keyword: kw, why: 'You are already showing up here. The next move is turning that presence into pipeline before a competitor closes the gap.' }
      : null,
    lockedHints: {
      snapshot:    `Your competitors are pulling organic traffic you could be capturing. The full breakdown shows exactly where each one outranks you and where you already have the edge.`,
      keywordGap:  `There are keyword clusters your competitors rank for that you have not touched yet. The gap analysis sizes the opportunity and ranks each one by effort to close.`,
      positioning: `Your current content covers the same ground as everyone else. This section identifies the angle that differentiates you and the content categories worth owning first.`,
      levers:      `Not all growth moves are equal. Based on your domain authority and traffic profile, three specific levers would move the needle fastest in the next 90 days.`,
      roadmap:     `Month 1 focuses on the quick wins already visible in your data. By month 3, the compounding work starts showing up in rankings. This section lays out the sequence.`,
      firstMove:   `One move stands out as the obvious starting point based on where your traffic and authority sit today. This section names it and explains why it comes first.`,
    },
  };
}

// ─── HTML email ───────────────────────────────────────────────────────────────

function renderMetricStat(label: string, value: string | number | null | undefined): string {
  const shown = (value === null || value === undefined || value === '') ? 'n/a' : (typeof value === 'number' ? value.toLocaleString() : value);
  return `
    <td style="padding:14px 16px;background:#fafafa;border-right:1px solid #eaeaea;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:4px;">${label}</div>
      <div style="font-size:18px;font-weight:600;color:#050D05;">${shown}</div>
    </td>`;
}

function renderCompetitorRow(c: CompetitorRow, i: number): string {
  return `
    <tr>
      <td style="padding:11px 14px;border-bottom:1px solid #eaeaea;font-size:14px;color:#050D05;font-weight:600;width:36px;">${i + 1}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #eaeaea;font-size:14px;color:#050D05;font-weight:500;">${c.domain}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #eaeaea;font-size:13px;color:#555;">DR ${c.domainRating ?? 'n/a'}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #eaeaea;font-size:13px;color:#555;">${c.orgTraffic ? '~' + c.orgTraffic.toLocaleString() + ' visits/mo' : 'n/a'}</td>
    </tr>`;
}

function renderLockedSection(title: string, hint: string, payUrl: string): string {
  return `
    <div style="border:1px solid #eaeaea;background:#fafafa;padding:18px 20px;margin:10px 0;border-radius:4px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
        <span style="display:inline-block;width:18px;height:18px;background:#00897B;color:#fff;text-align:center;line-height:18px;font-size:11px;border-radius:2px;">&#128274;</span>
        <span style="font-size:15px;font-weight:600;color:#050D05;">${title}</span>
      </div>
      <p style="margin:0 0 10px;font-size:13px;color:#666;line-height:1.6;">${hint}</p>
      <a href="${payUrl}" style="font-size:13px;color:#00897B;text-decoration:none;font-weight:600;">Unlock the full report for $99 &rarr;</a>
    </div>`;
}

function buildReportHtml(data: ReportData, teasers: NonNullable<Awaited<ReturnType<typeof writeTeasers>>>, email: string, fn: string): string {
  const payUrl = `${SITE}/api/cmo-pay?e=${enc(email)}`;
  const upgradeAll = `${SITE}/ai-cmo-advisor/upgrade?tier=monitor&e=${enc(email)}`;
  const permalink = reportPermalink(email);
  const own = data.own;
  const kwCallout = teasers.keywordCallout;

  const compTable = data.competitors.length
    ? `<table style="border-collapse:collapse;width:100%;margin:0 0 18px;">${data.competitors.map(renderCompetitorRow).join('')}</table>`
    : `<p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 18px;">Ahrefs did not surface direct organic competitors for ${data.ownDomain} yet. That usually means the domain is early enough that the organic footprint has not overlapped significantly with established players. The full report identifies the competitors you will be running into as you scale, and sizes the gap between where you are and where they sit.</p>`;

  return `
<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;background:#fff;color:#1a1a1a;line-height:1.65;">
  <div style="background:#050D05;padding:26px 32px;">
    <p style="margin:0;font-family:Georgia,serif;font-size:19px;font-style:italic;color:#F0FFF0;">Treetop Growth Strategy</p>
    <p style="margin:6px 0 0;font-size:12px;color:#8FAF8F;letter-spacing:0.08em;text-transform:uppercase;">Your free AI CMO snapshot</p>
  </div>
  <div style="padding:32px 32px 28px;">
    <p style="margin:0 0 8px;font-size:14px;color:#555;">Hi ${fn},</p>
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:600;color:#050D05;line-height:1.3;">Here is your free snapshot for ${data.ownDomain}.</h1>
    <p style="margin:0 0 14px;font-size:14px;color:#666;">I pulled this from Ahrefs a few minutes ago and ran it through my analysis. Three sections are open so you can see the kind of work I do. Six more are locked. Those are the ones that turn data into a plan.</p>
    <p style="margin:0 0 22px;font-size:13px;"><a href="${permalink}" style="color:#00897B;text-decoration:none;font-weight:600;">View or share this report online &rarr;</a></p>

    <!-- OPEN SECTION 1: YOUR OWN METRICS -->
    <h2 style="margin:0 0 10px;font-size:15px;font-weight:600;color:#050D05;text-transform:uppercase;letter-spacing:0.06em;">01 &middot; Where you stand</h2>
    ${(own?.domainRating != null || own?.orgTraffic != null || own?.orgKeywords != null)
      ? `<table style="border-collapse:collapse;width:100%;margin:0 0 14px;border:1px solid #eaeaea;">
      <tr>
        ${own?.domainRating != null ? renderMetricStat('Domain Rating', own.domainRating) : ''}
        ${own?.orgTraffic != null ? renderMetricStat('Monthly Organic Visits', own.orgTraffic) : ''}
        ${own?.orgKeywords != null ? `<td style="padding:14px 16px;background:#fafafa;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:4px;">Ranking Keywords</div>
          <div style="font-size:18px;font-weight:600;color:#050D05;">${own.orgKeywords.toLocaleString()}</div>
        </td>` : ''}
      </tr>
    </table>`
      : `<p style="margin:0 0 14px;font-size:14px;color:#555;line-height:1.7;">Ahrefs does not have enough indexed data for ${data.ownDomain} to show headline numbers yet. That is actually useful information: it tells us the organic foundation is early-stage, which changes which growth levers matter most. The full report covers what to do when you are starting from a low base.</p>`
    }
    <p style="margin:0 0 26px;font-size:14px;color:#555;line-height:1.7;">${teasers.competitiveLine}</p>

    <!-- OPEN SECTION 2: NAMED COMPETITORS -->
    <h2 style="margin:0 0 10px;font-size:15px;font-weight:600;color:#050D05;text-transform:uppercase;letter-spacing:0.06em;">02 &middot; Who you are actually competing with</h2>
    ${compTable}

    <!-- OPEN SECTION 3: ONE KEYWORD -->
    ${kwCallout ? `
    <h2 style="margin:22px 0 10px;font-size:15px;font-weight:600;color:#050D05;text-transform:uppercase;letter-spacing:0.06em;">03 &middot; One keyword worth chasing first</h2>
    <div style="border-left:3px solid #00897B;padding:2px 0 2px 16px;margin:0 0 8px;">
      <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#050D05;">${kwCallout.keyword}</p>
      <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">${kwCallout.why}</p>
    </div>
    ` : ''}

    <!-- LOCKED SECTIONS -->
    <div style="margin:32px 0 8px;">
      <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.1em;">I have more to show you</p>
      <p style="margin:0 0 16px;font-size:13px;color:#888;">Six sections I have already drafted from your data. Each one moves you closer to a plan you can actually execute.</p>
    </div>
    ${renderLockedSection('04 &middot; The full competitive snapshot', teasers.lockedHints.snapshot, payUrl)}
    ${renderLockedSection('05 &middot; Keyword gap (5 to 8 opportunities)', teasers.lockedHints.keywordGap, payUrl)}
    ${renderLockedSection('06 &middot; Content positioning', teasers.lockedHints.positioning, payUrl)}
    ${renderLockedSection('07 &middot; Top 3 growth levers', teasers.lockedHints.levers, payUrl)}
    ${renderLockedSection('08 &middot; 90-day roadmap', teasers.lockedHints.roadmap, payUrl)}
    ${renderLockedSection('09 &middot; What I would do first', teasers.lockedHints.firstMove, payUrl)}

    <!-- BIG CTA -->
    <div style="margin:34px 0 22px;padding:22px;background:#050D05;text-align:center;">
      <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:19px;color:#F0FFF0;">Ready for the full plan?</p>
      <p style="margin:0 0 18px;font-size:13px;color:#8FAF8F;">Delivered same day. Written by your AI CMO. Includes everything above plus the four locked sections.</p>
      <a href="${payUrl}" style="display:inline-block;background:#00C853;color:#050D05;padding:13px 28px;font-size:15px;font-weight:600;text-decoration:none;border-radius:4px;">Unlock the full report for $99 &rarr;</a>
    </div>

    <div style="border-top:1px solid #eaeaea;padding-top:20px;margin-top:24px;">
      <p style="margin:0 0 4px;font-size:14px;color:#1a1a1a;">Bill Colbert</p>
      <p style="margin:0 0 12px;font-size:13px;color:#888;">Founder, Treetop Growth Strategy &middot; <a href="${SITE}" style="color:#00897B;">treetopgrowthstrategy.com</a></p>
      <p style="margin:0 0 8px;font-size:13px;color:#888;">Questions? Just reply. Your AI CMO reads every one, and I look at the ones worth answering myself.</p>
      <p style="margin:0;font-size:12px;color:#aaa;">Want ongoing? <a href="${upgradeAll}" style="color:#00897B;">Monitor keeps this current every month for $249 &rarr;</a></p>
    </div>
  </div>
</div>`;
}

// ─── Resend ───────────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set'); return false; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html, reply_to: [REPLY_TO_ADDRESS], bcc: [BILL_EMAIL] }),
  });
  if (!r.ok) { console.error('cmo-free-report send failed', r.status, await r.text()); return false; }
  return true;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface GenerateOpts {
  email: string;
  website?: string;
  lead?: any;
  force?: boolean;
}

export interface GenerateResult {
  sent: boolean;
  mode: 'sent' | 'dry-run' | 'skipped';
  reason?: string;
  domain?: string;
  competitors?: string[];
}

/**
 * Generate a limited free report and send it via Resend.
 * Called inline from cmo-free-qualify.ts after ICP classification, and
 * also exposed as a POST endpoint for manual re-sends.
 *
 * Idempotency: if the lead's LastNurtureSentAt is today, we skip (unless
 * `force: true`), so a resubmission does not double-send.
 */
export async function generateAndSendFreeReport(opts: GenerateOpts): Promise<GenerateResult> {
  const email = opts.email.trim().toLowerCase();
  if (!email) return { sent: false, mode: 'skipped', reason: 'no email' };

  const lead = opts.lead || await findLead(email);
  const existingWebsite = lead?.fields?.WebsiteURL || '';
  const domain = pickDomain(email, opts.website, existingWebsite);
  if (!domain) return { sent: false, mode: 'skipped', reason: 'no company domain' };

  const today = todayISO();
  if (!opts.force && lead) {
    const lastSent = (lead.fields?.LastNurtureSentAt || '').toString().slice(0, 10);
    if (lastSent === today) return { sent: false, mode: 'skipped', reason: 'already sent today' };
  }

  if (!process.env.AHREFS_API_KEY || !OPENAI_API_KEY || !RESEND_API_KEY) {
    return { sent: false, mode: 'skipped', reason: 'missing env keys (ahrefs/openai/resend)' };
  }

  // Spend guards. Every path into report generation passes through here, so
  // the kill switch and the global daily budget protect the inline qualify
  // trigger and the admin re-run alike.
  if (killSwitchOn()) {
    return { sent: false, mode: 'skipped', reason: 'kill-switch-on', domain };
  }
  const budget = await budgetAvailable();
  if (!budget.ok) {
    await alertOps(
      'budget',
      'AI CMO daily budget cap hit',
      `<p style="font-family:sans-serif;">The free-report daily budget cap was reached (${budget.count}/${budget.cap}). Further free reports are paused until tomorrow. Raise CMO_DAILY_BUDGET or investigate a possible flood.</p>`,
    );
    return { sent: false, mode: 'skipped', reason: 'daily-budget-exceeded', domain };
  }
  // Consume budget BEFORE the spend so a later failure still counts against the
  // cap and cannot be retried indefinitely for free.
  await consumeBudget();

  const date = today;
  const [own, competitorDomains, topKeywords] = await Promise.all([
    fetchOwnMetrics(domain, date),
    fetchCompetitors(domain, date, 3),
    fetchTopKeywords(domain, date, 20),
  ]);
  const competitors = await enrichCompetitors(competitorDomains, date);
  const data: ReportData = { ownDomain: domain, own, competitors, topKeywords };

  const teasers = (await writeTeasers(data)) || fallbackTeasers(data);

  const fn = firstName(lead);
  const html = buildReportHtml(data, teasers, email, fn);
  const subject = `Your free AI CMO snapshot for ${domain}`;

  const ok = await sendEmail(email, subject, html);
  if (!ok) return { sent: false, mode: 'skipped', reason: 'resend failure', domain, competitors: competitorDomains };

  if (lead?.id) {
    await patchLead(lead.id, {
      NurtureStep: 1,
      NurtureStage: 'free',
      LastNurtureSentAt: today,
      'Last Report': html,
      ResearchEligible: true,
    });
  }

  return { sent: true, mode: 'sent', domain, competitors: competitorDomains };
}

// ─── HTTP handler (manual re-run / test) ─────────────────────────────────────

// Admin-only manual re-run / test path. The public free-report flow does NOT
// go through here: cmo-free-qualify imports generateAndSendFreeReport and calls
// it server-side. This HTTP handler exists only for manual re-sends, so it is
// gated behind CMO_ADMIN_KEY and does not advertise CORS to browsers. This
// closes the unauthenticated-spend and public-`force` abuse paths.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!adminAuthorized(req)) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  const email   = (body.email || '').toString().trim().toLowerCase();
  const website = (body.website || '').toString().trim();
  const force   = !!body.force; // only reachable by an authorized admin
  if (!email || !/^[^\s@"]+@[^\s@"]+\.[^\s@"]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const result = await generateAndSendFreeReport({ email, website, force });
  return res.status(200).json(result);
}
