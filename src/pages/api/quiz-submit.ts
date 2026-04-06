export const prerender = false;

import type { APIRoute } from 'astro';

const RESEND_API_KEY   = import.meta.env.RESEND_API_KEY || import.meta.env.MAILGUN_API_KEY;
const FROM_EMAIL       = import.meta.env.MAILGUN_FROM   || 'Bill Colbert <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL       = import.meta.env.BILL_NOTIFY_EMAIL || 'william.colbert@treetopgrowthstrategy.com';
const AIRTABLE_API_KEY = import.meta.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT';
const BOOKING_LINK     = import.meta.env.BOOKING_LINK   || 'https://calendar.app.google/GS5H5y8U3PrN8u4A8';
const GITHUB_TOKEN     = import.meta.env.GITHUB_TOKEN;
const GITHUB_REPO      = import.meta.env.GITHUB_REPO    || 'treetopgrowthstrategy/treetopnest';
const SITE_URL         = 'https://treetopgrowthstrategy.com';

interface QuizPayload {
  name: string;
  email: string;
  company: string;
  title: string;
  answers: number[];
  pillarScores: { icp: number; outbound: number; pipeline: number; team: number };
  totalScore: number;
  tier: string;
}

function getTierDetails(score: number) {
  if (score <= 6)  return { label: 'AI-Absent',    color: '#ef4444', urgency: 'Critical Gap',           summary: 'Your GTM motion has significant structural gaps vs. competitors who have already rebuilt around AI. The pipeline impact is material and compounding every quarter.',                                                                          competitive: 'Companies that made the AI-native transition 12–18 months ago are now running teams 30–40% smaller while generating more qualified pipeline. That gap widens every quarter you wait.' };
  if (score <= 12) return { label: 'AI-Adjacent',   color: '#f97316', urgency: 'Significant Gap',        summary: "You're using AI tools, but your revenue motion isn't architected around them. The gap between tool adoption and AI-native transformation is where most pipeline is lost.",                                                                   competitive: 'Your closest competitors are likely in the same position — or one step ahead. The window to lead this transformation is open, but it narrows as AI-native tools mature and competitors move.' };
  if (score <= 18) return { label: 'AI-Augmented',  color: '#3b82f6', urgency: 'Optimization Opportunity', summary: 'You have a solid foundation. Your weakest 1–2 pillars are where competitors are pulling ahead. A targeted overhaul of those areas would close the remaining gap.',                                                                          competitive: 'Companies at the AI-Native level compound their advantage through learning loops — each quarter their systems get better. Closing the remaining gap now prevents that compounding from widening.' };
  return           { label: 'AI-Native',   color: '#00C853', urgency: 'Refinement Stage',         summary: 'Strong position. Your GTM architecture is competitive with companies that have made the full AI-native transition. The next frontier is compounding — systems that get smarter over time.', competitive: "You're ahead of roughly 80% of B2B companies at your stage. The focus now is optimization: tightening the loops between data, action, and learning." };
}

function getPillarRecs(ps: QuizPayload['pillarScores']) {
  const pillars = [
    { key: 'icp',      name: 'ICP & Data Foundation',    score: ps.icp },
    { key: 'outbound', name: 'Outbound & Prospecting',   score: ps.outbound },
    { key: 'pipeline', name: 'Pipeline Intelligence',     score: ps.pipeline },
    { key: 'team',     name: 'Team & Scalability',        score: ps.team },
  ];
  const sorted = [...pillars].sort((a, b) => a.score - b.score);
  const recMap: Record<string, { title: string; detail: string }[]> = {
    icp: [
      { title: 'Build a dynamic ICP model', detail: 'Replace your static ICP document with a living model that updates from win/loss patterns, engagement signals, and real-time firmographic shifts. This is the foundation everything else sits on.' },
      { title: 'Implement AI-powered account scoring', detail: 'Layer intent data, technographic signals, and behavioral data to score accounts automatically. Your reps should only touch accounts the system has already identified as in-market.' },
    ],
    outbound: [
      { title: 'Rebuild outbound around signal triggers', detail: 'The highest-converting outbound fires when specific intent signals appear on target accounts — not on a schedule. Implement workflows that make timing automatic and contextually relevant.' },
      { title: 'Deploy AI personalization at scale', detail: 'Move beyond mail-merge. AI can research and write truly personalized outreach for hundreds of accounts simultaneously, matching what your best SDR does one at a time.' },
    ],
    pipeline: [
      { title: 'Implement AI-driven revenue attribution', detail: 'Connect every GTM activity to revenue outcomes automatically. This is how you justify your AI investments to your board and know which programs to double down on.' },
      { title: 'Build real-time pipeline health monitoring', detail: 'Deals go cold silently. AI can flag risk signals — engagement drop-off, stakeholder changes, competitor activity — before a deal is lost, giving you time to intervene.' },
    ],
    team: [
      { title: 'Redesign GTM architecture for AI-first scale', detail: 'AI-native GTM means your pipeline capacity is decoupled from headcount. A properly architected system lets your current team handle 3–4x the accounts without proportional people cost.' },
      { title: 'Build the AI GTM stack as an integrated system', detail: "Siloed tools don't produce AI-native outcomes. The goal is a connected architecture where signal, action, and learning flow automatically across the full revenue motion." },
    ],
  };
  return sorted.slice(0, 3).flatMap(p => (recMap[p.key] || []).slice(0, 1));
}

function buildSlug(company: string, date: string): string {
  return company
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
    .replace(/-$/, '') + '-' + date;
}

function buildReportHTML(data: QuizPayload, reportUrl: string): string {
  const tier = getTierDetails(data.totalScore);
  const recs = getPillarRecs(data.pillarScores);
  const firstName = data.name.split(' ')[0];
  const pct = Math.round((data.totalScore / 24) * 100);
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const pillars = [
    { name: 'ICP & Data Foundation',  score: data.pillarScores.icp,      max: 6 },
    { name: 'Outbound & Prospecting', score: data.pillarScores.outbound,  max: 6 },
    { name: 'Pipeline Intelligence',  score: data.pillarScores.pipeline,  max: 6 },
    { name: 'Team & Scalability',     score: data.pillarScores.team,      max: 6 },
  ];

  const pillarBars = pillars.map(p => {
    const pct = Math.round((p.score / p.max) * 100);
    const barColor = pct <= 33 ? '#ef4444' : pct <= 66 ? '#f97316' : '#00C853';
    const label = pct <= 33 ? 'Critical' : pct <= 66 ? 'Developing' : 'Strong';
    return `
      <div style="margin-bottom:28px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;color:#F0FFF0;">${p.name}</span>
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${barColor};">${label}</span>
            <span style="font-family:'Instrument Serif',serif;font-size:18px;font-weight:400;color:${barColor};font-style:italic;">${p.score}/${p.max}</span>
          </div>
        </div>
        <div style="height:4px;background:rgba(240,255,240,0.08);border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:2px;transition:width 0.8s ease;"></div>
        </div>
      </div>`;
  }).join('');

  const recCards = recs.map((r, i) => `
    <div style="border-left:3px solid #00C853;padding-left:20px;margin-bottom:28px;">
      <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#00C853;margin-bottom:8px;">Priority ${i + 1}</div>
      <div style="font-family:'Instrument Serif',serif;font-size:20px;font-weight:400;color:#F0FFF0;margin-bottom:8px;line-height:1.3;">${r.title}</div>
      <div style="font-family:'DM Sans',sans-serif;font-size:13px;color:#8FAF8F;line-height:1.75;">${r.detail}</div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>AI-Native GTM Gap Report — ${data.company} | Treetop Growth Strategy</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #050D05; color: #F0FFF0; font-family: 'DM Sans', sans-serif; font-weight: 300; -webkit-font-smoothing: antialiased; min-height: 100vh; }
  .container { max-width: 760px; margin: 0 auto; padding: 0 24px 80px; }

  /* SCORE RING */
  .ring-track { fill: none; stroke: rgba(240,255,240,0.06); stroke-width: 8; }
  .ring-fill  { fill: none; stroke-width: 8; stroke-linecap: round; stroke-dasharray: 283; stroke-dashoffset: ${Math.round(283 - (283 * pct / 100))}; transform: rotate(-90deg); transform-origin: 50% 50%; transition: stroke-dashoffset 1s ease; }

  @media print {
    body { background: white; color: #050D05; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>

<!-- HEADER NAV -->
<div style="background:rgba(5,13,5,0.95);border-bottom:1px solid rgba(240,255,240,0.07);position:sticky;top:0;z-index:50;backdrop-filter:blur(12px);">
  <div style="max-width:760px;margin:0 auto;padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between;">
    <a href="${SITE_URL}" style="font-family:'Instrument Serif',serif;font-size:1.1rem;font-style:italic;color:#F0FFF0;text-decoration:none;">Treetop</a>
    <span style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(240,255,240,0.35);">AI-Native GTM Gap Report · Confidential</span>
  </div>
</div>

<div class="container">

  <!-- COVER BLOCK -->
  <div style="background:linear-gradient(160deg,#0A1A0A 0%,#050D05 100%);border-bottom:1px solid rgba(240,255,240,0.07);padding:60px 0 48px;margin-bottom:0;">
    <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#00C853;margin-bottom:16px;">Assessment Results</div>
    <h1 style="font-family:'Instrument Serif',serif;font-size:clamp(2.2rem,6vw,3.5rem);font-weight:400;line-height:1.1;color:#F0FFF0;margin-bottom:10px;letter-spacing:-0.01em;">
      AI-Native GTM<br/><span style="font-style:italic;">Gap Report</span>
    </h1>
    <p style="font-family:'DM Sans',sans-serif;font-size:13px;color:rgba(240,255,240,0.4);margin-bottom:40px;">
      ${data.company}${data.title ? ` · ${data.title}` : ''} · ${date}
    </p>

    <!-- SCORE ROW -->
    <div style="display:flex;align-items:center;gap:40px;flex-wrap:wrap;">
      <!-- Ring -->
      <div style="position:relative;width:120px;height:120px;flex-shrink:0;">
        <svg viewBox="0 0 100 100" width="120" height="120">
          <circle class="ring-track" cx="50" cy="50" r="45"/>
          <circle class="ring-fill" cx="50" cy="50" r="45" stroke="${tier.color}"/>
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <span style="font-family:'Instrument Serif',serif;font-size:2.2rem;font-weight:400;font-style:italic;color:${tier.color};line-height:1;">${data.totalScore}</span>
          <span style="font-family:'DM Sans',sans-serif;font-size:10px;color:rgba(240,255,240,0.35);letter-spacing:0.06em;">/24</span>
        </div>
      </div>
      <!-- Tier info -->
      <div>
        <div style="display:inline-block;background:${tier.color}18;border:1px solid ${tier.color}40;color:${tier.color};font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:5px 14px;border-radius:20px;margin-bottom:10px;">${tier.label}</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(240,255,240,0.35);margin-bottom:6px;">${tier.urgency}</div>
        <p style="font-family:'DM Sans',sans-serif;font-size:14px;color:#8FAF8F;line-height:1.65;max-width:380px;">${tier.summary}</p>
      </div>
    </div>
  </div>

  <!-- PILLAR BREAKDOWN -->
  <div style="background:#0A1A0A;border:1px solid rgba(240,255,240,0.07);padding:40px;margin-top:1px;margin-bottom:1px;">
    <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#00C853;margin-bottom:24px;">Score by Pillar</div>
    ${pillarBars}
  </div>

  <!-- COMPETITIVE CONTEXT -->
  <div style="background:#050D05;border:1px solid rgba(240,255,240,0.07);border-top:none;padding:40px;margin-bottom:1px;">
    <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#00C853;margin-bottom:16px;">Competitive Context</div>
    <p style="font-family:'DM Sans',sans-serif;font-size:14px;color:#8FAF8F;line-height:1.75;margin-bottom:32px;">${tier.competitive}</p>

    <div style="display:flex;gap:0;flex-wrap:wrap;border:1px solid rgba(240,255,240,0.07);">
      <div style="flex:1;min-width:140px;padding:24px;border-right:1px solid rgba(240,255,240,0.07);">
        <div style="font-family:'Instrument Serif',serif;font-size:2.4rem;font-style:italic;color:#00C853;line-height:1;margin-bottom:6px;">61%</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:12px;color:#8FAF8F;line-height:1.5;">Quota attainment at AI-native companies vs. 56% traditional</div>
      </div>
      <div style="flex:1;min-width:140px;padding:24px;border-right:1px solid rgba(240,255,240,0.07);">
        <div style="font-family:'Instrument Serif',serif;font-size:2.4rem;font-style:italic;color:#00C853;line-height:1;margin-bottom:6px;">5 wks</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:12px;color:#8FAF8F;line-height:1.5;">Faster average sales cycle for AI-native GTM teams</div>
      </div>
      <div style="flex:1;min-width:140px;padding:24px;">
        <div style="font-family:'Instrument Serif',serif;font-size:2.4rem;font-style:italic;color:#00C853;line-height:1;margin-bottom:6px;">3–4x</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:12px;color:#8FAF8F;line-height:1.5;">More accounts per rep with AI-native outbound architecture</div>
      </div>
    </div>
  </div>

  <!-- PRIORITY ACTIONS -->
  <div style="background:#0A1A0A;border:1px solid rgba(240,255,240,0.07);border-top:none;padding:40px;margin-bottom:1px;">
    <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#00C853;margin-bottom:28px;">Your Priority Actions</div>
    ${recCards}
  </div>

  <!-- CTA BLOCK -->
  <div style="background:#050D05;border:1px solid rgba(0,200,83,0.2);border-top:none;padding:48px;text-align:center;">
    <div style="width:48px;height:2px;background:#00C853;margin:0 auto 28px;"></div>
    <h2 style="font-family:'Instrument Serif',serif;font-size:clamp(1.6rem,4vw,2.4rem);font-weight:400;font-style:italic;color:#F0FFF0;line-height:1.2;margin-bottom:14px;">
      Want to talk through what the transformation looks like for ${data.company}?
    </h2>
    <p style="font-family:'DM Sans',sans-serif;font-size:14px;color:#8FAF8F;margin-bottom:32px;line-height:1.75;max-width:480px;margin-left:auto;margin-right:auto;">
      30 minutes. No pitch deck. We'll look at your score, discuss where competitors are pulling ahead, and map out what an AI-native overhaul would realistically involve for your organization.
    </p>
    <a href="${BOOKING_LINK}"
       style="display:inline-flex;align-items:center;gap:8px;background:#00C853;color:#050D05;font-family:'DM Sans',sans-serif;font-weight:700;font-size:14px;letter-spacing:0.04em;padding:14px 32px;text-decoration:none;border-radius:2px;">
      Schedule a Discovery Call →
    </a>
    <p style="font-family:'DM Sans',sans-serif;font-size:11px;color:rgba(240,255,240,0.25);margin-top:16px;letter-spacing:0.04em;">
      No commitment required · treetopgrowthstrategy.com
    </p>
  </div>

  <!-- FOOTER -->
  <div style="margin-top:48px;padding-top:24px;border-top:1px solid rgba(240,255,240,0.07);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
    <span style="font-family:'Instrument Serif',serif;font-size:13px;font-style:italic;color:rgba(240,255,240,0.3);">Treetop Growth Strategy</span>
    <span style="font-family:'DM Sans',sans-serif;font-size:11px;color:rgba(240,255,240,0.2);">© ${new Date().getFullYear()} · Confidential · ${date}</span>
  </div>

</div>
</body>
</html>`;
}

async function pushReportToGitHub(slug: string, html: string): Promise<string | null> {
  if (!GITHUB_TOKEN) {
    console.warn('GITHUB_TOKEN not set — skipping GitHub report publish');
    return null;
  }

  const path = `public/reports/${slug}.html`;
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  const content = btoa(unescape(encodeURIComponent(html)));

  // Check if file already exists (for update)
  let sha: string | undefined;
  try {
    const check = await fetch(url, { headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' } });
    if (check.ok) { const existing = await check.json(); sha = existing.sha; }
  } catch (_) {}

  const body: Record<string, string> = {
    message: `Add quiz report: ${slug}`,
    content,
    branch: 'main',
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('GitHub push failed:', err);
    return null;
  }

  return `${SITE_URL}/reports/${slug}.html`;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email');
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
    throw new Error(`Resend failed: ${res.status}`);
  }
}

function buildProspectEmail(data: QuizPayload, reportUrl: string | null, tier: ReturnType<typeof getTierDetails>): string {
  const firstName = data.name.split(' ')[0];
  const hasUrl = !!reportUrl;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:'DM Sans',sans-serif;font-weight:300;">
<div style="max-width:580px;margin:40px auto;background:white;overflow:hidden;">

  <div style="background:#050D05;padding:28px 40px;">
    <div style="font-family:'Instrument Serif',serif;font-size:18px;font-style:italic;color:#F0FFF0;">Treetop Growth Strategy</div>
  </div>

  <div style="padding:40px;background:#050D05;border-top:1px solid rgba(240,255,240,0.07);">
    <p style="font-size:14px;color:rgba(240,255,240,0.5);margin:0 0 20px;">${firstName},</p>
    <h1 style="font-family:'Instrument Serif',serif;font-size:28px;font-weight:400;font-style:italic;color:#F0FFF0;line-height:1.2;margin:0 0 12px;">Your AI-Native GTM Gap Report is ready.</h1>
    <p style="font-size:14px;color:#8FAF8F;line-height:1.75;margin:0 0 28px;">Based on your responses, I've put together a personalized report for ${data.company} — including your full pillar breakdown, competitive context, and three priority actions.</p>

    <div style="background:#0A1A0A;border:1px solid rgba(240,255,240,0.08);padding:28px;text-align:center;margin-bottom:28px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(240,255,240,0.3);margin-bottom:10px;">Your Gap Score</div>
      <div style="font-family:'Instrument Serif',serif;font-size:64px;font-style:italic;font-weight:400;color:${tier.color};line-height:1;">${data.totalScore}<span style="font-size:24px;color:rgba(240,255,240,0.2);font-style:normal;">/24</span></div>
      <div style="display:inline-block;margin-top:10px;background:${tier.color}18;border:1px solid ${tier.color}40;color:${tier.color};font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:4px 14px;border-radius:20px;">${tier.label}</div>
    </div>

    ${hasUrl ? `
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${reportUrl}" style="display:inline-block;background:#00C853;color:#050D05;font-family:'DM Sans',sans-serif;font-weight:700;font-size:14px;letter-spacing:0.04em;padding:14px 32px;text-decoration:none;border-radius:2px;">View Your Full Report →</a>
    </div>
    <p style="font-size:12px;color:rgba(240,255,240,0.25);text-align:center;margin-bottom:28px;">Or copy this link: <a href="${reportUrl}" style="color:#00C853;">${reportUrl}</a></p>
    ` : `<p style="font-size:13px;color:#8FAF8F;line-height:1.7;margin-bottom:28px;">Your full report is attached with pillar-by-pillar analysis, competitive context, and your top 3 priority actions.</p>`}

    <p style="font-size:13px;color:#8FAF8F;line-height:1.7;margin-bottom:28px;">If you'd like to talk through the findings — what they mean for ${data.company} and what a transformation would realistically look like — I'm happy to spend 30 minutes on it. No pitch deck.</p>

    <div style="text-align:center;">
      <a href="${BOOKING_LINK}" style="display:inline-block;border:1px solid rgba(240,255,240,0.2);color:#F0FFF0;font-family:'DM Sans',sans-serif;font-weight:600;font-size:13px;padding:12px 28px;text-decoration:none;border-radius:2px;">Schedule a Discovery Call</a>
    </div>
  </div>

  <div style="background:#050D05;border-top:1px solid rgba(240,255,240,0.07);padding:20px 40px;display:flex;justify-content:space-between;">
    <span style="font-size:11px;color:rgba(240,255,240,0.2);">© ${new Date().getFullYear()} Treetop Growth Strategy</span>
    ${hasUrl ? `<a href="${reportUrl}" style="font-size:11px;color:#00C853;text-decoration:none;">View report online</a>` : ''}
  </div>

</div>
</body>
</html>`;
}

function buildBillNotifyEmail(data: QuizPayload, tier: ReturnType<typeof getTierDetails>, reportUrl: string | null): string {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:520px;margin:40px auto;padding:24px;background:#f9fafb;">
<div style="background:white;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
  <div style="background:#050D05;padding:16px 24px;">
    <span style="font-family:serif;font-style:italic;color:#F0FFF0;font-size:16px;">Treetop · New Quiz Lead</span>
  </div>
  <div style="padding:24px;">
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#6b7280;width:130px;">Name</td><td style="padding:6px 0;font-weight:600;">${data.name}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;"><a href="mailto:${data.email}" style="color:#00C853;">${data.email}</a></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Company</td><td style="padding:6px 0;font-weight:600;">${data.company}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Title</td><td style="padding:6px 0;">${data.title || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Score</td><td style="padding:6px 0;font-weight:700;color:${tier.color};">${data.totalScore}/24 — ${tier.label}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:6px 8px;color:#6b7280;">ICP</td><td style="padding:6px 8px;">${data.pillarScores.icp}/6</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:6px 8px;color:#6b7280;">Outbound</td><td style="padding:6px 8px;">${data.pillarScores.outbound}/6</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:6px 8px;color:#6b7280;">Pipeline</td><td style="padding:6px 8px;">${data.pillarScores.pipeline}/6</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:6px 8px;color:#6b7280;">Team</td><td style="padding:6px 8px;">${data.pillarScores.team}/6</td></tr>
      ${reportUrl ? `<tr><td style="padding:6px 0;color:#6b7280;">Report</td><td style="padding:6px 0;"><a href="${reportUrl}" style="color:#00C853;">${reportUrl}</a></td></tr>` : ''}
    </table>
  </div>
</div>
</body></html>`;
}

async function logToAirtable(data: QuizPayload, tier: ReturnType<typeof getTierDetails>, reportUrl: string | null, slug: string | null) {
  if (!AIRTABLE_API_KEY) { console.warn('AIRTABLE_API_KEY not set'); return; }
  const fields: Record<string, unknown> = {
    'Name':           data.name,
    'Email':          data.email,
    'Company':        data.company,
    'Title':          data.title,
    'Total Score':    data.totalScore,
    'Tier':           data.tier,
    'ICP Score':      data.pillarScores.icp,
    'Outbound Score': data.pillarScores.outbound,
    'Pipeline Score': data.pillarScores.pipeline,
    'Team Score':     data.pillarScores.team,
    'Submitted At':   new Date().toISOString(),
  };
  if (reportUrl) fields['Report URL']  = reportUrl;
  if (slug)      fields['Report Slug'] = slug;

  await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/GTM%20Quiz%20Submissions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: QuizPayload = await request.json();
    if (!data.email || !data.name || !data.company) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const tier = getTierDetails(data.totalScore);
    const firstName = data.name.split(' ')[0];
    const dateStr = new Date().toISOString().slice(0, 10);
    const slug = buildSlug(data.company, dateStr);

    // 1. Build the report HTML
    const reportHtml = buildReportHTML(data, '');

    // 2. Push to GitHub and get live URL
    let reportUrl: string | null = null;
    try {
      reportUrl = await pushReportToGitHub(slug, buildReportHTML(data, `${SITE_URL}/reports/${slug}.html`));
    } catch (e) {
      console.error('GitHub push failed, continuing without hosted report:', e);
    }

    // 3. Wait for Vercel deploy if we have a URL
    if (reportUrl) {
      await new Promise(r => setTimeout(r, 35000));
    }

    // 4. Send prospect email with report URL
    const prospectEmail = buildProspectEmail(data, reportUrl, tier);
    await sendEmail(data.email, `Your AI-Native GTM Gap Report, ${firstName}`, prospectEmail);

    // 5. Notify Bill
    const billEmail = buildBillNotifyEmail(data, tier, reportUrl);
    await sendEmail(BILL_EMAIL, `🎯 New GTM Quiz Lead: ${data.name} at ${data.company} (${tier.label})`, billEmail);

    // 6. Log to Airtable
    await logToAirtable(data, tier, reportUrl, slug).catch(e => console.error('Airtable log failed:', e));

    return new Response(JSON.stringify({ success: true, reportUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('quiz-submit error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
