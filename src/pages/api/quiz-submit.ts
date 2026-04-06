export const prerender = false;

import type { APIRoute } from 'astro';

const MAILGUN_API_KEY = import.meta.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = import.meta.env.MAILGUN_DOMAIN || 'treetopgrowthstrategy.com';
const MAILGUN_FROM = import.meta.env.MAILGUN_FROM || 'Bill Colbert <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL = import.meta.env.BILL_NOTIFY_EMAIL || 'william.colbert@treetopgrowthstrategy.com';
const AIRTABLE_API_KEY = import.meta.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT';
const BOOKING_LINK = import.meta.env.BOOKING_LINK || 'https://calendar.app.google/GS5H5y8U3PrN8u4A8';

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
  if (score <= 6) return {
    label: 'AI-Absent',
    color: '#dc2626',
    colorLight: '#fca5a5',
    urgency: 'Critical Gap',
    summary: 'Your GTM motion has significant structural gaps vs. competitors who have already rebuilt around AI. The pipeline impact is material and compounding every quarter.',
    competitive: 'Companies that made the AI-native transition 12–18 months ago are now running teams that are 30–40% smaller while generating more qualified pipeline. That gap widens every quarter you wait.'
  };
  if (score <= 12) return {
    label: 'AI-Adjacent',
    color: '#d97706',
    colorLight: '#fcd34d',
    urgency: 'Significant Gap',
    summary: 'You\'re using AI tools, but your revenue motion isn\'t architected around them. The gap between tool adoption and AI-native transformation is where most pipeline is lost.',
    competitive: 'Your closest competitors are likely in the same position — or one step ahead. The window to lead this transformation in your organization is open, but it narrows as AI-native tools mature.'
  };
  if (score <= 18) return {
    label: 'AI-Augmented',
    color: '#2563eb',
    colorLight: '#93c5fd',
    urgency: 'Optimization Opportunity',
    summary: 'You have a solid foundation. Your weakest 1–2 pillars are where competitors are likely pulling ahead. A targeted overhaul of those areas would close the remaining gap.',
    competitive: 'Companies at the AI-Native level are compounding their advantage through learning loops — each quarter, their systems get better. Closing the remaining gap now prevents that compounding from widening.'
  };
  return {
    label: 'AI-Native',
    color: '#16a34a',
    colorLight: '#86efac',
    urgency: 'Refinement Stage',
    summary: 'Strong position. Your GTM architecture is competitive with companies that have made the full AI-native transition. The next frontier is compounding — systems that get smarter over time.',
    competitive: 'You\'re ahead of roughly 80% of B2B companies at your stage. The focus now is optimization: tightening the loops between data, action, and learning.'
  };
}

function getPillarRecs(pillarScores: QuizPayload['pillarScores']) {
  const pillars = [
    { key: 'icp', name: 'ICP & Data Foundation', score: pillarScores.icp },
    { key: 'outbound', name: 'Outbound & Prospecting', score: pillarScores.outbound },
    { key: 'pipeline', name: 'Pipeline Intelligence', score: pillarScores.pipeline },
    { key: 'team', name: 'Team & Scalability', score: pillarScores.team },
  ];

  const sorted = [...pillars].sort((a, b) => a.score - b.score);

  const recMap: Record<string, { title: string; detail: string }[]> = {
    icp: [
      { title: 'Build a dynamic ICP model', detail: 'Replace your static ICP document with a living model that updates from win/loss patterns, engagement signals, and real-time firmographic shifts. This is the foundation everything else sits on.' },
      { title: 'Implement AI-powered account scoring', detail: 'Layer intent data, technographic signals, and behavioral data to score accounts automatically. Your reps should only touch accounts the system has already identified as in-market.' },
    ],
    outbound: [
      { title: 'Rebuild outbound around signal triggers', detail: 'The highest-converting outbound isn\'t scheduled — it\'s triggered. Implement workflows that fire personalized outreach when specific intent signals fire on target accounts.' },
      { title: 'Deploy AI personalization at scale', detail: 'Move beyond mail-merge personalization. AI can research and write truly personalized outreach for hundreds of accounts simultaneously, matching what your best SDR does one at a time.' },
    ],
    pipeline: [
      { title: 'Implement AI-driven revenue attribution', detail: 'Connect every GTM activity to revenue outcomes automatically. This is how you justify your AI investments to your board — and how you know which programs to double down on.' },
      { title: 'Build real-time pipeline health monitoring', detail: 'Deals go cold silently. AI can flag risk signals — engagement drop-off, stakeholder changes, competitor activity — before a deal is lost, giving you time to intervene.' },
    ],
    team: [
      { title: 'Redesign GTM architecture for AI-first scale', detail: 'AI-native GTM means your pipeline capacity is decoupled from headcount. A properly architected system lets your current team handle 3–4x the accounts without proportional people cost.' },
      { title: 'Build the AI GTM stack as an integrated system', detail: 'Siloed tools don\'t produce AI-native outcomes. The goal is a connected architecture where signal, action, and learning flow automatically across the full revenue motion.' },
    ],
  };

  return sorted.slice(0, 3).flatMap(p => (recMap[p.key] || []).slice(0, 1));
}

function buildReport(data: QuizPayload): string {
  const tier = getTierDetails(data.totalScore);
  const recs = getPillarRecs(data.pillarScores);
  const firstName = data.name.split(' ')[0];
  const pct = Math.round((data.totalScore / 24) * 100);
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const pillarRows = [
    { name: 'ICP & Data Foundation', score: data.pillarScores.icp, max: 6 },
    { name: 'Outbound & Prospecting', score: data.pillarScores.outbound, max: 6 },
    { name: 'Pipeline Intelligence', score: data.pillarScores.pipeline, max: 6 },
    { name: 'Team & Scalability', score: data.pillarScores.team, max: 6 },
  ].map(p => {
    const pct = Math.round((p.score / p.max) * 100);
    const barColor = pct <= 33 ? '#dc2626' : pct <= 66 ? '#d97706' : '#16a34a';
    return `
      <div style="margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
          <span style="font-size:13px;color:#1a1208;font-weight:400;">${p.name}</span>
          <span style="font-size:13px;font-weight:700;color:${barColor};">${p.score}/${p.max}</span>
        </div>
        <div style="height:6px;background:#e8e0d0;border-radius:3px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:3px;"></div>
        </div>
      </div>
    `;
  }).join('');

  const recRows = recs.map((r, i) => `
    <div style="border-left:3px solid #2D5A27;padding-left:16px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8B6914;margin-bottom:6px;">Priority ${i + 1}</div>
      <div style="font-size:15px;font-weight:700;color:#1a1208;margin-bottom:8px;">${r.title}</div>
      <div style="font-size:13px;color:#5a4a3a;line-height:1.7;">${r.detail}</div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI-Native GTM Gap Report — ${data.company} | Treetop Growth Strategy</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Lato',sans-serif;font-weight:300;-webkit-font-smoothing:antialiased;">

<div style="max-width:620px;margin:0 auto;padding:0 0 60px;">

  <!-- HEADER -->
  <div style="background:#0f1a0c;padding:32px 40px;margin-bottom:0;">
    <div style="font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:#F5F0E8;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:4px;">Treetop Growth Strategy</div>
    <div style="font-size:11px;color:rgba(245,240,232,0.4);letter-spacing:0.08em;text-transform:uppercase;">AI-Native GTM Gap Report · Confidential</div>
  </div>

  <!-- COVER BLOCK -->
  <div style="background:#172212;padding:40px;margin-bottom:0;">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#3d7a35;margin-bottom:16px;">Assessment Results</div>
    <div style="font-family:'Playfair Display',serif;font-size:36px;font-weight:900;color:#F5F0E8;line-height:1.1;margin-bottom:8px;">AI-Native GTM<br>Gap Report</div>
    <div style="font-size:13px;color:rgba(245,240,232,0.5);margin-bottom:24px;">${data.company}${data.title ? ` · ${data.title}` : ''} · ${date}</div>
    <div style="display:flex;align-items:flex-end;gap:20px;flex-wrap:wrap;">
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(245,240,232,0.4);margin-bottom:6px;">Your Gap Score</div>
        <div style="font-family:'Playfair Display',serif;font-size:72px;font-weight:900;color:${tier.color};line-height:1;">${data.totalScore}<span style="font-size:28px;color:rgba(245,240,232,0.3);font-weight:400;">/24</span></div>
      </div>
      <div style="padding-bottom:12px;">
        <div style="display:inline-block;background:${tier.color}22;border:1px solid ${tier.color}66;color:${tier.colorLight};font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:6px 14px;border-radius:20px;margin-bottom:10px;">${tier.label}</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(245,240,232,0.35);">${tier.urgency}</div>
      </div>
    </div>
  </div>

  <!-- MAIN CONTENT -->
  <div style="background:#ffffff;padding:40px;border-bottom:1px solid #e8e0d0;">

    <p style="font-size:14px;color:#5a4a3a;line-height:1.8;margin-bottom:24px;">Hi ${firstName},</p>
    <p style="font-size:14px;color:#5a4a3a;line-height:1.8;margin-bottom:32px;">
      Based on your assessment answers, here's where your GTM motion stands relative to companies that have already made the AI-native transition — and where the gaps are costing you pipeline.
    </p>

    <!-- ASSESSMENT SUMMARY -->
    <div style="border-left:3px solid ${tier.color};padding-left:20px;margin-bottom:36px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8B6914;margin-bottom:8px;">Assessment Summary</div>
      <p style="font-size:14px;color:#1a1208;line-height:1.75;margin:0;">${tier.summary}</p>
    </div>

    <!-- PILLAR BREAKDOWN -->
    <div style="margin-bottom:36px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8B6914;margin-bottom:20px;">Score by Pillar</div>
      ${pillarRows}
    </div>

    <!-- COMPETITIVE CONTEXT -->
    <div style="background:#f7f3ec;border:1px solid #e8e0d0;padding:24px;margin-bottom:36px;border-radius:2px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8B6914;margin-bottom:12px;">Competitive Context</div>
      <p style="font-size:14px;color:#1a1208;line-height:1.75;margin:0 0 16px;">${tier.competitive}</p>
      <div style="display:flex;gap:24px;flex-wrap:wrap;">
        <div>
          <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#2D5A27;line-height:1;">61%</div>
          <div style="font-size:11px;color:#5a4a3a;margin-top:4px;max-width:140px;line-height:1.4;">Quota attainment at AI-native companies vs. 56% traditional</div>
        </div>
        <div>
          <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#2D5A27;line-height:1;">5 wks</div>
          <div style="font-size:11px;color:#5a4a3a;margin-top:4px;max-width:140px;line-height:1.4;">Faster average sales cycle for AI-native GTM teams</div>
        </div>
        <div>
          <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#2D5A27;line-height:1;">3–4x</div>
          <div style="font-size:11px;color:#5a4a3a;margin-top:4px;max-width:140px;line-height:1.4;">More accounts per rep with AI-native outbound architecture</div>
        </div>
      </div>
    </div>

    <!-- PRIORITY ACTIONS -->
    <div style="margin-bottom:36px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8B6914;margin-bottom:20px;">Your Priority Actions</div>
      ${recRows}
    </div>

    <!-- CTA -->
    <div style="background:#0f1a0c;padding:32px;text-align:center;border-radius:2px;">
      <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#F5F0E8;margin-bottom:12px;line-height:1.25;">
        Want to talk through what the transformation looks like for ${data.company}?
      </div>
      <p style="font-size:13px;color:rgba(245,240,232,0.55);margin-bottom:24px;line-height:1.7;">
        30 minutes. No pitch deck. We'll look at your score, discuss where competitors are pulling ahead, and map out what an AI-native overhaul would realistically involve for your organization.
      </p>
      <a href="${BOOKING_LINK}"
         style="display:inline-block;background:#2D5A27;color:#F5F0E8;font-family:'Lato',sans-serif;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;padding:14px 32px;text-decoration:none;border-radius:2px;">
        Schedule a Conversation →
      </a>
    </div>

  </div>

  <!-- FOOTER -->
  <div style="padding:24px 40px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e8e0d0;background:#F5F0E8;">
    <div style="font-size:11px;color:#8B6914;font-weight:700;letter-spacing:0.08em;">TREETOP GROWTH STRATEGY</div>
    <div style="font-size:11px;color:#a09080;">treetopgrowthstrategy.com · Confidential</div>
  </div>

</div>
</body>
</html>`;
}

async function sendMailgun(to: string, subject: string, html: string) {
  if (!MAILGUN_API_KEY) {
    console.warn('MAILGUN_API_KEY not set — skipping email send');
    return;
  }
  const form = new URLSearchParams();
  form.append('from', MAILGUN_FROM);
  form.append('to', to);
  form.append('subject', subject);
  form.append('html', html);

  const credentials = btoa(`api:${MAILGUN_API_KEY}`);
  const res = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Mailgun error:', err);
    throw new Error(`Mailgun failed: ${res.status}`);
  }
}

async function logToAirtable(data: QuizPayload, tier: ReturnType<typeof getTierDetails>) {
  if (!AIRTABLE_API_KEY) {
    console.warn('AIRTABLE_API_KEY not set — skipping Airtable log');
    return;
  }
  await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/GTM%20Quiz%20Submissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        'Name': data.name,
        'Email': data.email,
        'Company': data.company,
        'Title': data.title,
        'Total Score': data.totalScore,
        'Tier': data.tier,
        'ICP Score': data.pillarScores.icp,
        'Outbound Score': data.pillarScores.outbound,
        'Pipeline Score': data.pillarScores.pipeline,
        'Team Score': data.pillarScores.team,
        'Submitted At': new Date().toISOString(),
      }
    }),
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: QuizPayload = await request.json();

    if (!data.email || !data.name || !data.company) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const tier = getTierDetails(data.totalScore);
    const reportHtml = buildReport(data);
    const firstName = data.name.split(' ')[0];

    // 1. Send report to prospect
    await sendMailgun(
      data.email,
      `Your AI-Native GTM Gap Report, ${firstName}`,
      reportHtml
    );

    // 2. Notify Bill
    const notifyHtml = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="font-size:18px;margin-bottom:16px;">New GTM Quiz Lead</h2>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#666;width:120px;">Name</td><td style="padding:6px 0;font-weight:bold;">${data.name}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
          <tr><td style="padding:6px 0;color:#666;">Company</td><td style="padding:6px 0;font-weight:bold;">${data.company}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Title</td><td style="padding:6px 0;">${data.title || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Score</td><td style="padding:6px 0;font-weight:bold;color:${tier.color};">${data.totalScore}/24 — ${tier.label}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">ICP</td><td style="padding:6px 0;">${data.pillarScores.icp}/6</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Outbound</td><td style="padding:6px 0;">${data.pillarScores.outbound}/6</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Pipeline</td><td style="padding:6px 0;">${data.pillarScores.pipeline}/6</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Team</td><td style="padding:6px 0;">${data.pillarScores.team}/6</td></tr>
        </table>
      </div>
    `;
    await sendMailgun(BILL_EMAIL, `🎯 New GTM Quiz Lead: ${data.name} at ${data.company} (${tier.label})`, notifyHtml);

    // 3. Log to Airtable
    await logToAirtable(data, tier).catch(err => console.error('Airtable log failed:', err));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('quiz-submit error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
