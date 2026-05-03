export const prerender = false;

import type { APIRoute } from 'astro';

const RESEND_API_KEY   = import.meta.env.RESEND_API_KEY;
const FROM_EMAIL       = 'Ecofit <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL       = import.meta.env.BILL_NOTIFY_EMAIL || 'william.colbert@treetopgrowthstrategy.com';
const AIRTABLE_API_KEY = import.meta.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT';
const GITHUB_TOKEN     = import.meta.env.GITHUB_TOKEN;
const GITHUB_REPO      = import.meta.env.GITHUB_REPO || 'treetopgrowthstrategy/treetopnest';
const SITE_URL         = 'https://treetopgrowthstrategy.com';
const BOOKING_LINK     = 'https://calendar.app.google/GS5H5y8U3PrN8u4A8';

interface AssessmentPayload {
  name: string;
  email: string;
  company: string;
  title: string;
  phone: string;
  answers: Record<string, string | string[]>;
  riskLow: number;
  riskHigh: number;
  riskMid: number;
  networkLabel: string;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return '$' + Math.round(n / 1_000) + 'K';
  return '$' + n.toLocaleString();
}

function buildSlug(company: string, date: string): string {
  return 'ecofit-' + company
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 36)
    .replace(/-$/, '') + '-' + date;
}

// ─── RECOMMENDATIONS ──────────────────────────────────────────────────────────

function getRecommendations(data: AssessmentPayload): { title: string; detail: string }[] {
  const recs: { title: string; detail: string }[] = [];
  const a = data.answers;

  // Multi-location networks
  const multiLoc = !['1'].includes(a.locations as string);
  if (multiLoc) {
    recs.push({
      title: 'Establish cross-location equipment benchmarks',
      detail: `With ${data.networkLabel}, your highest-value insight isn't what's happening at one location — it's what's happening across all of them simultaneously. Ecofit gives you a single network view so underperforming locations are immediately visible and comparable.`
    });
  }

  // Equipment-heavy facilities
  const heavyEquip = ['31-60', '61-100', '100+'].includes(a.cardio as string)
    || ['31-60', '61-100', '100+'].includes(a.strength as string);
  if (heavyEquip) {
    recs.push({
      title: 'Move from reactive to predictive maintenance',
      detail: 'At your equipment density, reactive maintenance isn\'t just expensive — it\'s a member experience problem. Ecofit surfaces utilization and wear signals before failure happens, converting unplanned downtime into scheduled service windows.'
    });
  }

  // Recovery area investment without measurement
  const hasRecovery = !['none'].includes(a.recovery as string);
  const noHardwareData = !Array.isArray(a.hardware) || a.hardware.includes('none') || a.hardware.length === 0;
  const noDwell = ['interested', 'no'].includes(a.dwell as string);
  if (hasRecovery && (noHardwareData || noDwell)) {
    recs.push({
      title: 'Measure recovery zone ROI before your next equipment investment',
      detail: 'Recovery zones are the fastest-growing capex category in fitness — and the least measured. Before adding hardware, Ecofit can show you dwell time, utilization rates, and member engagement so every dollar is justified by data.'
    });
  }

  // No dwell measurement
  if (noDwell && !hasRecovery) {
    recs.push({
      title: 'Start with a floor intelligence baseline',
      detail: 'You can\'t optimize what you can\'t see. A dwell time and zone utilization baseline gives you the data to make confident decisions about floor reconfigurations, equipment placement, and space ROI — without guesswork.'
    });
  }

  // Large sq footage
  if (['30k-50k', '50k+'].includes(a.sqft as string)) {
    recs.push({
      title: 'Run an AI space analytics audit on your floor layout',
      detail: 'Large-format facilities have significant revenue locked in dead zones, underutilized equipment rows, and congestion patterns that drive member churn. Ecofit\'s AI Space Analytics identifies exactly where your floor is working against you.'
    });
  }

  // Fill to 3 recs minimum
  if (recs.length < 3) {
    recs.push({
      title: 'Connect your equipment to a live network dashboard',
      detail: 'The operators winning in this market aren\'t waiting for member complaints or quarterly audits to understand their floor. Ecofit gives your team a real-time view of every machine — uptime, usage, and performance — across every location, every day.'
    });
  }

  return recs.slice(0, 3);
}

// ─── REPORT HTML ──────────────────────────────────────────────────────────────

function buildReportHTML(data: AssessmentPayload): string {
  const firstName = data.name.split(' ')[0];
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const recs = getRecommendations(data);
  const riskRange = `${fmt(data.riskLow)}–${fmt(data.riskHigh)}`;
  const pct = Math.min(100, Math.round((data.riskMid / 1_500_000) * 100));

  const recCards = recs.map((r, i) => `
    <div style="border-left:3px solid #84BC41;padding-left:24px;margin-bottom:32px;">
      <div style="font-family:'Work Sans',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#84BC41;margin-bottom:8px;">Priority ${i + 1}</div>
      <div style="font-family:'Raleway',sans-serif;font-size:20px;font-weight:700;color:#F2F3F8;margin-bottom:10px;line-height:1.3;">${r.title}</div>
      <div style="font-family:'Work Sans',sans-serif;font-size:14px;color:#9699A2;line-height:1.75;">${r.detail}</div>
    </div>`).join('');

  const answerRows = [
    ['Locations', data.answers.locations],
    ['Sq Ft (per location)', data.answers.sqft],
    ['Cardio Equipment', data.answers.cardio],
    ['Strength Equipment', data.answers.strength],
    ['Other Equipment', data.answers.other],
    ['Recovery Area', data.answers.recovery],
    ['Recovery Hardware', Array.isArray(data.answers.hardware) ? data.answers.hardware.filter(h => !h.startsWith('other:')).join(', ') || 'None' : 'None'],
    ['Dwell Time Measurement', data.answers.dwell],
  ].map(([label, val]) => `
    <tr>
      <td style="padding:10px 16px;font-family:'Work Sans',sans-serif;font-size:13px;color:#9699A2;border-bottom:1px solid rgba(242,243,248,0.06);white-space:nowrap;">${label}</td>
      <td style="padding:10px 16px;font-family:'Work Sans',sans-serif;font-size:13px;color:#F2F3F8;border-bottom:1px solid rgba(242,243,248,0.06);">${val || '—'}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Ecofit Facility Intelligence Report — ${data.company}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@600;700&family=Work+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{background:#14191f;color:#F2F3F8;font-family:'Work Sans',sans-serif;font-weight:300;-webkit-font-smoothing:antialiased;min-height:100vh}
  .container{max-width:780px;margin:0 auto;padding:0 24px 80px}
  @media print{body{background:white;color:#14191f}.no-print{display:none!important}}
</style>
</head>
<body>

<!-- STICKY NAV -->
<div style="background:rgba(20,25,31,0.95);border-bottom:1px solid rgba(132,188,65,0.12);position:sticky;top:0;z-index:50;backdrop-filter:blur(12px)">
  <div style="max-width:780px;margin:0 auto;padding:0 24px;height:58px;display:flex;align-items:center;justify-content:space-between">
    <img src="/assets/ecofit-logo-dark.png" alt="Ecofit" height="28" onerror="this.outerHTML='<span style=&quot;font-family:Raleway;font-weight:700;color:#84BC41;font-size:18px&quot;>ecofit</span>'">
    <span style="font-family:'Work Sans',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(242,243,248,0.35)">Facility Intelligence Report · Confidential</span>
  </div>
</div>

<div class="container">

  <!-- COVER -->
  <div style="padding:60px 0 48px;border-bottom:1px solid rgba(132,188,65,0.12)">
    <div style="font-family:'Work Sans',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#84BC41;margin-bottom:16px">Assessment Results</div>
    <h1 style="font-family:'Raleway',sans-serif;font-weight:700;font-size:clamp(2rem,6vw,3.2rem);line-height:1.1;color:#F2F3F8;margin-bottom:10px;letter-spacing:-0.015em">
      Facility Intelligence<br><span style="color:#84BC41">Report</span>
    </h1>
    <p style="font-family:'Work Sans',sans-serif;font-size:13px;color:rgba(242,243,248,0.4);margin-bottom:40px">
      ${data.company}${data.title ? ` · ${data.title}` : ''} · ${date}
    </p>

    <!-- RISK HERO -->
    <div style="background:#2F3535;border:1px solid rgba(132,188,65,0.2);border-left:4px solid #84BC41;padding:36px 40px;margin-bottom:32px">
      <div style="font-family:'Work Sans',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(242,243,248,0.45);margin-bottom:12px">Estimated Annual OpEx at Risk</div>
      <div style="font-family:'Raleway',sans-serif;font-weight:700;font-size:clamp(2.4rem,6vw,4rem);color:#84BC41;line-height:1;margin-bottom:8px">${riskRange}</div>
      <div style="font-family:'Work Sans',sans-serif;font-size:14px;color:#9699A2;line-height:1.6">
        Based on your facility profile across ${data.networkLabel}. This estimate reflects equipment visibility gaps, maintenance premium exposure, premature replacement risk, and recovery zone efficiency losses.
      </div>
    </div>

    <p style="font-family:'Work Sans',sans-serif;font-size:15px;color:#9699A2;line-height:1.75;max-width:680px">
      ${firstName}, this isn't theoretical — these are costs your network is already absorbing, invisibly. The operators who've closed this gap with Ecofit don't just reduce spend. They make faster, smarter decisions at the board level and stop defending gut-feel capex.
    </p>
  </div>

  <!-- FACILITY PROFILE -->
  <div style="background:#2F3535;border:1px solid rgba(132,188,65,0.1);padding:40px;margin-top:1px;margin-bottom:1px">
    <div style="font-family:'Work Sans',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#84BC41;margin-bottom:24px">Your Facility Profile</div>
    <table style="width:100%;border-collapse:collapse">
      <tbody>${answerRows}</tbody>
    </table>
  </div>

  <!-- BENCHMARK -->
  <div style="background:#14191f;border:1px solid rgba(132,188,65,0.1);border-top:none;padding:40px;margin-bottom:1px">
    <div style="font-family:'Work Sans',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#84BC41;margin-bottom:20px">How You Compare</div>
    <p style="font-family:'Work Sans',sans-serif;font-size:14px;color:#9699A2;line-height:1.75;margin-bottom:32px">
      Ecofit operators with similar facility profiles — ${data.networkLabel}, comparable equipment density — typically see these results within the first 12 months of connected intelligence.
    </p>
    <div style="display:flex;gap:0;flex-wrap:wrap;border:1px solid rgba(132,188,65,0.12)">
      <div style="flex:1;min-width:160px;padding:28px;border-right:1px solid rgba(132,188,65,0.12)">
        <div style="font-family:'Raleway',sans-serif;font-weight:700;font-size:2.4rem;color:#84BC41;line-height:1;margin-bottom:8px">40%</div>
        <div style="font-family:'Work Sans',sans-serif;font-size:12px;color:#9699A2;line-height:1.5">Reduction in equipment refresh costs</div>
      </div>
      <div style="flex:1;min-width:160px;padding:28px;border-right:1px solid rgba(132,188,65,0.12)">
        <div style="font-family:'Raleway',sans-serif;font-weight:700;font-size:2.4rem;color:#84BC41;line-height:1;margin-bottom:8px">3.2x</div>
        <div style="font-family:'Work Sans',sans-serif;font-size:12px;color:#9699A2;line-height:1.5">Longer equipment lifespan on average</div>
      </div>
      <div style="flex:1;min-width:160px;padding:28px">
        <div style="font-family:'Raleway',sans-serif;font-weight:700;font-size:2.4rem;color:#84BC41;line-height:1;margin-bottom:8px">200+</div>
        <div style="font-family:'Work Sans',sans-serif;font-size:12px;color:#9699A2;line-height:1.5">Assets networked per facility on average</div>
      </div>
    </div>
  </div>

  <!-- PRIORITY ACTIONS -->
  <div style="background:#2F3535;border:1px solid rgba(132,188,65,0.1);border-top:none;padding:40px;margin-bottom:1px">
    <div style="font-family:'Work Sans',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#84BC41;margin-bottom:32px">Your Priority Actions</div>
    ${recCards}
  </div>

  <!-- CTA BLOCK -->
  <div style="background:#14191f;border:1px solid rgba(132,188,65,0.2);border-top:3px solid #84BC41;padding:52px;text-align:center">
    <div style="width:40px;height:2px;background:#84BC41;margin:0 auto 28px"></div>
    <h2 style="font-family:'Raleway',sans-serif;font-weight:700;font-size:clamp(1.6rem,4vw,2.4rem);color:#F2F3F8;line-height:1.2;margin-bottom:14px">
      Want to see what your network is really telling you?
    </h2>
    <p style="font-family:'Work Sans',sans-serif;font-size:14px;color:#9699A2;margin-bottom:32px;line-height:1.75;max-width:480px;margin-left:auto;margin-right:auto">
      30 minutes with an Ecofit analyst. We'll review your facility profile, walk through what the intelligence layer looks like for your specific network, and show you real data from comparable operators. No commitment. No IT team required.
    </p>
    <a href="${BOOKING_LINK}"
       style="display:inline-flex;align-items:center;gap:8px;background:#84BC41;color:#14191f;font-family:'Work Sans',sans-serif;font-weight:600;font-size:15px;padding:16px 36px;text-decoration:none;border-radius:4px">
      Book a Demo →
    </a>
    <p style="font-family:'Work Sans',sans-serif;font-size:11px;color:rgba(242,243,248,0.25);margin-top:18px;letter-spacing:0.04em">
      Demos run 30 minutes · We come prepared with benchmarks for your facility type
    </p>
  </div>

  <!-- FOOTER -->
  <div style="margin-top:48px;padding-top:24px;border-top:1px solid rgba(132,188,65,0.1);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
    <img src="/assets/ecofit-logo-dark.png" alt="Ecofit" height="24" onerror="this.outerHTML='<span style=&quot;font-family:Raleway;font-weight:700;color:#84BC41;font-size:16px&quot;>ecofit</span>'">
    <span style="font-family:'Work Sans',sans-serif;font-size:11px;color:rgba(242,243,248,0.2)">© ${new Date().getFullYear()} Ecofit Networks Inc. · Confidential · ${date}</span>
  </div>

</div>
</body>
</html>`;
}

// ─── GITHUB PUBLISH ───────────────────────────────────────────────────────────

async function pushReportToGitHub(slug: string, html: string): Promise<string | null> {
  if (!GITHUB_TOKEN) { console.warn('GITHUB_TOKEN not set'); return null; }
  const path = `public/reports/${slug}.html`;
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  const content = btoa(unescape(encodeURIComponent(html)));

  let sha: string | undefined;
  try {
    const check = await fetch(url, { headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' } });
    if (check.ok) { const ex = await check.json(); sha = ex.sha; }
  } catch (_) {}

  const body: Record<string, string> = { message: `Add Ecofit report: ${slug}`, content, branch: 'main' };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github.v3+json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) { console.error('GitHub push failed:', await res.text()); return null; }
  return `${SITE_URL}/reports/${slug}.html`;
}

// ─── EMAIL ────────────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set'); return; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
}

function buildProspectEmail(data: AssessmentPayload, reportUrl: string | null): string {
  const firstName = data.name.split(' ')[0];
  const riskRange = `${fmt(data.riskLow)}–${fmt(data.riskHigh)}`;
  return `<!DOCTYPE html><html>
<head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@700&family=Work+Sans:wght@300;400;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#0f1410;font-family:'Work Sans',sans-serif;font-weight:300">
<div style="max-width:580px;margin:40px auto;background:#14191f;overflow:hidden;border:1px solid rgba(132,188,65,0.15)">

  <div style="background:#2F3535;padding:24px 32px;display:flex;align-items:center;justify-content:space-between">
    <span style="font-family:Raleway,sans-serif;font-weight:700;color:#84BC41;font-size:20px">ecofit</span>
    <span style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(242,243,248,0.4)">Facility Intelligence Report</span>
  </div>

  <div style="padding:40px 32px">
    <p style="font-size:14px;color:rgba(242,243,248,0.5);margin:0 0 18px">${firstName},</p>
    <h1 style="font-family:Raleway,sans-serif;font-weight:700;font-size:26px;color:#F2F3F8;line-height:1.2;margin:0 0 14px">Your Facility Intelligence Report is ready.</h1>
    <p style="font-size:14px;color:#9699A2;line-height:1.75;margin:0 0 28px">Based on your assessment responses for ${data.company}, here's what we found.</p>

    <div style="background:#2F3535;border:1px solid rgba(132,188,65,0.2);border-left:4px solid #84BC41;padding:28px;margin-bottom:28px">
      <div style="font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(242,243,248,0.4);margin-bottom:10px">Estimated Annual OpEx at Risk</div>
      <div style="font-family:Raleway,sans-serif;font-weight:700;font-size:42px;color:#84BC41;line-height:1;margin-bottom:8px">${riskRange}</div>
      <div style="font-size:13px;color:#9699A2">${data.networkLabel}</div>
    </div>

    ${reportUrl ? `
    <div style="text-align:center;margin-bottom:24px">
      <a href="${reportUrl}" style="display:inline-block;background:#84BC41;color:#14191f;font-family:'Work Sans',sans-serif;font-weight:600;font-size:15px;padding:14px 32px;text-decoration:none;border-radius:4px">View Your Full Report →</a>
    </div>
    <p style="font-size:12px;color:rgba(242,243,248,0.25);text-align:center;margin-bottom:28px">Or copy: <a href="${reportUrl}" style="color:#84BC41">${reportUrl}</a></p>
    ` : ''}

    <p style="font-size:13px;color:#9699A2;line-height:1.75;margin-bottom:28px">If you'd like to talk through what this means for ${data.company} — or see what Ecofit looks like for your specific network — I'm happy to do a 30-minute no-commitment demo. We'll come with benchmark data for your facility type.</p>

    <div style="text-align:center">
      <a href="${BOOKING_LINK}" style="display:inline-block;border:1px solid rgba(242,243,248,0.2);color:#F2F3F8;font-family:'Work Sans',sans-serif;font-weight:600;font-size:13px;padding:12px 28px;text-decoration:none;border-radius:4px">Book a 30-Minute Demo</a>
    </div>
  </div>

  <div style="background:#2F3535;border-top:1px solid rgba(132,188,65,0.1);padding:16px 32px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:11px;color:rgba(242,243,248,0.25)">© ${new Date().getFullYear()} Ecofit Networks Inc.</span>
    ${reportUrl ? `<a href="${reportUrl}" style="font-size:11px;color:#84BC41;text-decoration:none">View report online</a>` : ''}
  </div>

</div>
</body></html>`;
}

function buildBillNotifyEmail(data: AssessmentPayload, reportUrl: string | null): string {
  const riskRange = `${fmt(data.riskLow)}–${fmt(data.riskHigh)}`;
  const hw = Array.isArray(data.answers.hardware) ? data.answers.hardware.join(', ') : '—';
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:540px;margin:40px auto;padding:24px;background:#f9fafb">
<div style="background:white;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
  <div style="background:#14191f;padding:16px 24px;display:flex;align-items:center;gap:12px">
    <span style="font-family:Raleway,sans-serif;font-weight:700;color:#84BC41;font-size:18px">ecofit</span>
    <span style="font-size:12px;color:rgba(242,243,248,0.5)">New Assessment Lead</span>
  </div>
  <div style="padding:24px">
    <table style="width:100%;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:7px 0;color:#6b7280;width:140px">Name</td><td style="padding:7px 0;font-weight:600">${data.name}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280">Email</td><td style="padding:7px 0"><a href="mailto:${data.email}" style="color:#84BC41">${data.email}</a></td></tr>
      ${data.phone ? `<tr><td style="padding:7px 0;color:#6b7280">Phone</td><td style="padding:7px 0">${data.phone}</td></tr>` : ''}
      <tr><td style="padding:7px 0;color:#6b7280">Company</td><td style="padding:7px 0;font-weight:600">${data.company}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280">Title</td><td style="padding:7px 0">${data.title || '—'}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280;font-weight:600" colspan="2">Facility Profile</td></tr>
      <tr style="background:#f9fafb"><td style="padding:7px 8px;color:#6b7280">Locations</td><td style="padding:7px 8px">${data.answers.locations}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:7px 8px;color:#6b7280">Sq Ft</td><td style="padding:7px 8px">${data.answers.sqft}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:7px 8px;color:#6b7280">Cardio</td><td style="padding:7px 8px">${data.answers.cardio}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:7px 8px;color:#6b7280">Strength</td><td style="padding:7px 8px">${data.answers.strength}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:7px 8px;color:#6b7280">Other Equip</td><td style="padding:7px 8px">${data.answers.other}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:7px 8px;color:#6b7280">Recovery</td><td style="padding:7px 8px">${data.answers.recovery}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:7px 8px;color:#6b7280">Hardware</td><td style="padding:7px 8px">${hw}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:7px 8px;color:#6b7280">Dwell Time</td><td style="padding:7px 8px">${data.answers.dwell}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280;font-weight:600">OpEx Risk</td><td style="padding:7px 0;font-weight:700;color:#84BC41;font-size:16px">${riskRange}</td></tr>
      ${reportUrl ? `<tr><td style="padding:7px 0;color:#6b7280">Report</td><td style="padding:7px 0"><a href="${reportUrl}" style="color:#84BC41">${reportUrl}</a></td></tr>` : ''}
    </table>
  </div>
</div>
</body></html>`;
}

// ─── AIRTABLE ─────────────────────────────────────────────────────────────────

async function logToAirtable(data: AssessmentPayload, reportUrl: string | null, slug: string | null) {
  if (!AIRTABLE_API_KEY) { console.warn('AIRTABLE_API_KEY not set'); return; }
  const hw = Array.isArray(data.answers.hardware) ? data.answers.hardware.join(', ') : '';
  const fields: Record<string, unknown> = {
    'Name':          data.name,
    'Email':         data.email,
    'Company':       data.company,
    'Title':         data.title || '',
    'Phone':         data.phone || '',
    'Locations':     data.answers.locations,
    'Sq Ft':         data.answers.sqft,
    'Cardio':        data.answers.cardio,
    'Strength':      data.answers.strength,
    'Other Equip':   data.answers.other,
    'Recovery Area': data.answers.recovery,
    'Hardware':      hw,
    'Dwell Time':    data.answers.dwell,
    'Risk Low':      data.riskLow,
    'Risk High':     data.riskHigh,
    'Risk Mid':      data.riskMid,
    'Submitted At':  new Date().toISOString(),
  };
  if (reportUrl) fields['Report URL']  = reportUrl;
  if (slug)      fields['Report Slug'] = slug;

  await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Ecofit%20Assessments`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
}

// ─── ROUTE ────────────────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: AssessmentPayload = await request.json();
    if (!data.email || !data.name || !data.company) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const slug = buildSlug(data.company, dateStr);

    // 1. Build report HTML
    const reportHtml = buildReportHTML(data);

    // 2. Push to GitHub → get live URL
    let reportUrl: string | null = null;
    try { reportUrl = await pushReportToGitHub(slug, reportHtml); } catch (e) { console.error('GitHub push failed:', e); }

    // 3. Email prospect
    const prospectEmail = buildProspectEmail(data, reportUrl);
    await sendEmail(data.email, `Your Ecofit Facility Intelligence Report, ${data.name.split(' ')[0]}`, prospectEmail);

    // 4. Notify Bill
    const billEmail = buildBillNotifyEmail(data, reportUrl);
    await sendEmail(BILL_EMAIL, `🏋️ New Ecofit Assessment: ${data.name} · ${data.company} · ${fmt(data.riskLow)}–${fmt(data.riskHigh)} at risk`, billEmail);

    // 5. Log to Airtable
    await logToAirtable(data, reportUrl, slug).catch(e => console.error('Airtable:', e));

    return new Response(JSON.stringify({ success: true, reportUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('ecofit-assessment-submit error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
