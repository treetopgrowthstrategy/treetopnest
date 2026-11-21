// Monthly delta-memo fulfillment for Monitor subscribers ($249/mo).
// Runs daily (Vercel cron). For each active Monitor subscriber whose last memo
// was 30+ days ago (or never), pulls fresh Ahrefs data, diffs against the stored
// snapshot, generates a what-changed memo via GPT-4o, and emails it.
//
// Dry-run gate: CMO_MONITOR_AUTO_SEND. When unset, compiles a digest for Bill
// and does not send to subscribers or advance counters.

import { fetchOwnMetrics, fetchTopKeywords, fetchCompetitors, enrichCompetitors } from './cmo-ahrefs.js';
import { reportPermalink } from './cmo-report.js';
import { alertOps } from './cmo-guards.js';
import type { DomainMetrics, CompetitorRow, KeywordRow } from './cmo-ahrefs.js';

export const config = { maxDuration: 300 };

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = (process.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT').split('/')[0];
const AIRTABLE_TABLE   = process.env.AIRTABLE_LEADS_TABLE || 'tbl7PEKkdYKafCEdC';
const RESEND_API_KEY   = process.env.RESEND_API_KEY || '';
const FROM_EMAIL       = process.env.RESEND_FROM || 'Bill Colbert <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL       = process.env.BILL_NOTIFY_EMAIL || 'william.colbert@treetopgrowthstrategy.com';
const REPLY_TO_ADDRESS = process.env.CMO_REPLY_TO_EMAIL || 'bill@reports.treetopgrowthstrategy.com';
const OPENAI_API_KEY   = process.env.OPENAI_API_KEY || '';
const CRON_SECRET      = process.env.CRON_SECRET || '';
const MAX_PER_RUN      = Number(process.env.CMO_MONITOR_MAX_PER_RUN || '50');
const SITE             = 'https://treetopgrowthstrategy.com';

interface Snapshot {
  domain: string;
  domainRating: number | null;
  orgTraffic: number | null;
  orgKeywords: number | null;
  topKeywords: KeywordRow[];
  competitors: CompetitorRow[];
  takenAt: string;
}

function todayISO(): string { return new Date().toISOString().slice(0, 10); }
function daysBetween(a: string, b: string): number {
  const da = Date.parse(a + 'T00:00:00Z');
  const db = Date.parse(b + 'T00:00:00Z');
  if (isNaN(da) || isNaN(db)) return 0;
  return Math.floor((db - da) / 86400000);
}

async function sendEmail(to: string, subject: string, html: string, opts: { replyTo?: string; bcc?: string } = {}): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  const payload: Record<string, any> = { from: FROM_EMAIL, to: [to], subject, html };
  if (opts.replyTo) payload.reply_to = [opts.replyTo];
  if (opts.bcc)     payload.bcc = [opts.bcc];
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) { console.error('Resend error:', r.status, await r.text()); return false; }
  return true;
}

async function fetchMonitorSubscribers(): Promise<any[]> {
  if (!AIRTABLE_API_KEY) return [];
  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`;
  const formula = encodeURIComponent(`AND({SubscriptionStatus}="active",{SubscriptionTier}="monitor")`);
  const out: any[] = [];
  let offset = '';
  for (let page = 0; page < 10; page++) {
    const url = `${base}?filterByFormula=${formula}&pageSize=100${offset ? `&offset=${offset}` : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
    if (!r.ok) { console.error('Airtable monitor list failed', r.status); break; }
    const data: any = await r.json();
    out.push(...(data.records || []));
    if (!data.offset) break;
    offset = data.offset;
  }
  return out;
}

async function patchLead(recordId: string, fields: Record<string, any>): Promise<void> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}/${recordId}`;
  const r = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!r.ok) console.error('Airtable patch failed', r.status, await r.text());
}

async function pullSnapshot(domain: string, date: string): Promise<Snapshot> {
  const [metrics, keywords, compDomains] = await Promise.all([
    fetchOwnMetrics(domain, date),
    fetchTopKeywords(domain, date, 20),
    fetchCompetitors(domain, date, 3),
  ]);
  const competitors = await enrichCompetitors(compDomains, date);
  return {
    domain,
    domainRating: metrics?.domainRating ?? null,
    orgTraffic: metrics?.orgTraffic ?? null,
    orgKeywords: metrics?.orgKeywords ?? null,
    topKeywords: keywords,
    competitors,
    takenAt: date,
  };
}

function delta(label: string, prev: number | null, curr: number | null): string {
  if (prev === null || curr === null) return '';
  const diff = curr - prev;
  if (diff === 0) return `${label}: ${curr.toLocaleString()} (unchanged)`;
  const pct = prev !== 0 ? ((diff / prev) * 100).toFixed(1) : 'n/a';
  const sign = diff > 0 ? '+' : '';
  return `${label}: ${curr.toLocaleString()} (${sign}${diff.toLocaleString()}, ${sign}${pct}%)`;
}

function buildDiffBlock(prev: Snapshot, curr: Snapshot): string {
  const lines: string[] = [];
  lines.push(delta('Domain Rating', prev.domainRating, curr.domainRating));
  lines.push(delta('Organic Traffic', prev.orgTraffic, curr.orgTraffic));
  lines.push(delta('Ranking Keywords', prev.orgKeywords, curr.orgKeywords));

  const prevKws = new Set(prev.topKeywords.map(k => k.keyword));
  const currKws = new Set(curr.topKeywords.map(k => k.keyword));
  const gained = curr.topKeywords.filter(k => !prevKws.has(k.keyword));
  const lost = prev.topKeywords.filter(k => !currKws.has(k.keyword));
  if (gained.length) lines.push(`New in top keywords: ${gained.map(k => `"${k.keyword}" (pos ${k.best_position})`).join(', ')}`);
  if (lost.length) lines.push(`Dropped from top keywords: ${lost.map(k => `"${k.keyword}"`).join(', ')}`);

  if (curr.competitors.length) {
    lines.push('');
    lines.push('Competitor snapshot:');
    for (const c of curr.competitors) {
      const pc = prev.competitors.find(p => p.domain === c.domain);
      if (pc) {
        lines.push(`  ${c.domain}: DR ${c.domainRating ?? '?'} (was ${pc.domainRating ?? '?'}), traffic ${(c.orgTraffic ?? 0).toLocaleString()} (was ${(pc.orgTraffic ?? 0).toLocaleString()})`);
      } else {
        lines.push(`  ${c.domain}: DR ${c.domainRating ?? '?'}, traffic ${(c.orgTraffic ?? 0).toLocaleString()} (new competitor)`);
      }
    }
  }

  return lines.filter(Boolean).join('\n');
}

async function generateMemo(diffBlock: string, notes: string, domain: string): Promise<string | null> {
  if (!OPENAI_API_KEY) return null;
  const prompt = `You are Bill Colbert, fractional CMO at Treetop Growth Strategy. Write a monthly Monitor delta memo for a client.

DOMAIN: ${domain}
CLIENT CONTEXT (from onboarding):
${notes || '(No onboarding notes available)'}

MONTH-OVER-MONTH DATA CHANGES:
${diffBlock}

Write an HTML email body (no html/body/head tags) with exactly these three sections:

<h2>What Changed</h2>
Summarize the data movements. Reference specific numbers. Call out anything that moved more than 10% in either direction. 100-150 words.

<h2>Competitor Watch</h2>
What the competitors are doing differently this month. If a competitor gained ground, say where and how. If one lost ground, note the opportunity. 80-120 words.

<h2>This Month's One Move</h2>
The single highest-ROI action the client should take this month based on the data. Be specific: name the keyword, the content type, or the channel. Not a checklist, one move. 60-100 words.

HARD CONSTRAINTS:
- NO em dashes anywhere
- Reference specific numbers from the data changes
- Direct, practitioner tone
- No generic advice`;

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o', max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!r.ok) { console.error('OpenAI error:', r.status, await r.text()); return null; }
  const j: any = await r.json();
  return (j.choices?.[0]?.message?.content || '').trim() || null;
}

function memoEmailHtml(memoBody: string, email: string, memoCount: number): string {
  const permalink = reportPermalink(email);
  return `
<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;background:#fff;color:#1a1a1a;line-height:1.65;">
  <div style="background:#050D05;padding:28px 32px;">
    <p style="margin:0;font-family:Georgia,serif;font-size:20px;font-style:italic;color:#F0FFF0;">Treetop Growth Strategy</p>
  </div>
  <div style="padding:36px 32px;">
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:600;color:#050D05;">Your Monthly Monitor Memo #${memoCount}</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#888;">Prepared by Bill Colbert, with live Ahrefs data</p>
    ${memoBody}
    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #eaeaea;">
      <p style="margin:0 0 4px;font-size:14px;color:#1a1a1a;">Bill Colbert</p>
      <p style="margin:0 0 16px;font-size:13px;color:#888;">Founder, Treetop Growth Strategy &bull; <a href="${SITE}" style="color:#00897B;">treetopgrowthstrategy.com</a></p>
      <p style="margin:0 0 12px;font-size:13px;color:#888;">Questions about this memo? Just reply.</p>
      <p style="margin:0;font-size:13px;"><a href="${permalink}" style="color:#00897B;text-decoration:none;">View your latest report online &rarr;</a></p>
    </div>
  </div>
</div>`;
}

function baselineEmailHtml(domain: string, email: string): string {
  return `
<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;padding:32px 26px;color:#1a1a1a;line-height:1.65;">
  <p style="margin:0 0 18px;font-size:15px;">Your Monitor subscription is active. I just pulled the baseline data for <strong>${domain}</strong> and stored it.</p>
  <p style="margin:0 0 18px;font-size:15px;">Your first delta memo will arrive in about 30 days. It will show exactly what changed: your domain rating, traffic, keyword positions, and what your competitors did. Until then, if you have a question, just reply.</p>
  <p style="margin:26px 0 4px;font-size:14px;color:#1a1a1a;border-top:1px solid #eaeaea;padding-top:18px;">Bill Colbert</p>
  <p style="margin:0;font-size:13px;color:#888;">Founder, Treetop Growth Strategy</p>
</div>`;
}

export default async function handler(req: any, res: any) {
  if (CRON_SECRET) {
    const auth = (req.headers?.authorization || '').toString();
    const key  = (req.query?.key || '').toString();
    if (auth !== `Bearer ${CRON_SECRET}` && key !== CRON_SECRET) {
      return res.status(401).json({ error: 'unauthorized' });
    }
  }

  const autoSend = process.env.CMO_MONITOR_AUTO_SEND === 'true';

  if (autoSend && !CRON_SECRET) {
    console.error('cron-cmo-monitor: refusing live run without CRON_SECRET');
    return res.status(401).json({ error: 'CRON_SECRET required for live monitor sends' });
  }

  const today = todayISO();
  const subscribers = await fetchMonitorSubscribers();

  const eligible: any[] = [];
  for (const lead of subscribers) {
    const f = lead.fields || {};
    if (!f.Email) continue;
    const lastMemo = (f.LastMemoSentAt || '').toString().slice(0, 10);
    if (lastMemo && daysBetween(lastMemo, today) < 30) continue;
    eligible.push(lead);
    if (eligible.length >= MAX_PER_RUN) break;
  }

  if (!eligible.length) {
    return res.status(200).json({ ok: true, mode: autoSend ? 'live' : 'dry-run', processed: 0 });
  }

  const results: Array<{ email: string; type: 'baseline' | 'delta' | 'error'; memo?: string }> = [];

  for (const lead of eligible) {
    const f = lead.fields || {};
    const email = f.Email.toString().toLowerCase();
    const domain = (f.WebsiteURL || '').toString().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim() || email.split('@')[1] || '';
    const notes = (f.Notes || '').toString();
    const prevJson = (f.LastSnapshotJson || '').toString();
    const memoCount = Number(f.MemoCount || 0);

    try {
      const curr = await pullSnapshot(domain, today);

      if (!prevJson) {
        if (autoSend) {
          await sendEmail(email, 'Your Monitor baseline is set', baselineEmailHtml(domain, email), { replyTo: REPLY_TO_ADDRESS, bcc: BILL_EMAIL });
          await patchLead(lead.id, {
            LastSnapshotJson: JSON.stringify(curr),
            LastSnapshotAt: today,
          });
        }
        results.push({ email, type: 'baseline' });
        continue;
      }

      let prev: Snapshot;
      try { prev = JSON.parse(prevJson); } catch { prev = { domain, domainRating: null, orgTraffic: null, orgKeywords: null, topKeywords: [], competitors: [], takenAt: '' }; }

      const diffBlock = buildDiffBlock(prev, curr);
      const memo = await generateMemo(diffBlock, notes, domain);
      if (!memo) { results.push({ email, type: 'error' }); continue; }

      if (autoSend) {
        const sent = await sendEmail(
          email,
          `Your monthly Monitor memo (#${memoCount + 1})`,
          memoEmailHtml(memo, email, memoCount + 1),
          { replyTo: REPLY_TO_ADDRESS, bcc: BILL_EMAIL },
        );
        if (sent) {
          await patchLead(lead.id, {
            LastSnapshotJson: JSON.stringify(curr),
            LastSnapshotAt: today,
            LastMemoSentAt: today,
            MemoCount: memoCount + 1,
            'Last Report': memo,
          });
        }
      }
      results.push({ email, type: 'delta', memo });
    } catch (err) {
      console.error(`Monitor memo failed for ${email}:`, err);
      results.push({ email, type: 'error' });
    }
  }

  if (!autoSend) {
    const digest = `
      <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;color:#1a1a1a;">
        <h2 style="font-size:18px;">Monitor dry-run: ${results.length} subscriber(s) eligible</h2>
        <p style="font-size:13px;color:#666;">CMO_MONITOR_AUTO_SEND is off. Nothing was sent to subscribers. Review, then flip the flag.</p>
        ${results.map(r => `
          <div style="border:1px solid #e5e5e5;border-radius:6px;margin:14px 0;padding:14px 16px;">
            <p style="font-size:12px;color:#00897B;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.06em;">${r.type} &middot; ${r.email}</p>
            ${r.memo ? `<div style="border-top:1px solid #eee;padding-top:10px;">${r.memo}</div>` : `<p style="font-size:13px;color:#888;">${r.type === 'baseline' ? 'Would store baseline snapshot' : 'Memo generation failed'}</p>`}
          </div>`).join('')}
      </div>`;
    await sendEmail(BILL_EMAIL, `Monitor dry-run: ${results.length} eligible (${today})`, digest);
  }

  const baselines = results.filter(r => r.type === 'baseline').length;
  const deltas = results.filter(r => r.type === 'delta').length;
  const errors = results.filter(r => r.type === 'error').length;

  return res.status(200).json({
    ok: true,
    mode: autoSend ? 'live' : 'dry-run',
    processed: results.length,
    baselines,
    deltas,
    errors,
  });
}
