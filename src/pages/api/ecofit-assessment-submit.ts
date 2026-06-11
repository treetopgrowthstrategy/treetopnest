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
  answers: Record<string, string>;
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

// ─── READABLE LABELS ──────────────────────────────────────────────────────────

const LABELS: Record<string, Record<string, string>> = {
  locations:       { '1': '1 location', '2-5': '2–5 locations', '6-15': '6–15 locations', '16-50': '16–50 locations', '51-100': '51–100 locations', '100+': '100+ locations' },
  equipment:       { 'under-30': 'Under 30 pieces', '30-75': '30–75 pieces', '76-150': '76–150 pieces', '151-300': '151–300 pieces', '300+': '300+ pieces' },
  tracking:        { 'software': 'Dedicated software / IoT', 'tickets': 'Service tickets & staff reports', 'manual': 'Periodic manual audits', 'none': 'No formal system' },
  maintenance:     { 'planned': 'Mostly planned (<25% reactive)', 'mixed': 'Roughly half and half', 'reactive': 'Mostly reactive (>50% unplanned)', 'unknown': 'Don\'t track this breakdown' },
  age:             { 'under-3': 'Under 3 years', '3-6': '3–6 years', '6-10': '6–10 years', '10+': '10+ years' },
  recovery:        { 'none': 'No dedicated area', 'small': 'Small zone (<500 sq ft)', 'medium': 'Medium zone (500–1,500 sq ft)', 'large': 'Large / premium (1,500+ sq ft)' },
  impact:          { 'rarely': 'Rarely', 'occasionally': 'Occasionally', 'frequently': 'Frequently', 'known-pain': 'Known pain point' },
  data_confidence: { 'high': 'Very confident — real-time visibility', 'medium': 'Somewhat confident — incomplete data', 'low': 'Not very confident — significant gaps', 'none': 'No equipment ROI data' },
};

function label(field: string, val: string): string {
  return LABELS[field]?.[val] ?? val;
}

// ─── RECOMMENDATIONS ──────────────────────────────────────────────────────────

function getRecommendations(data: AssessmentPayload): { title: string; detail: string }[] {
  const a = data.answers;
  const recs: { title: string; detail: string }[] = [];

  // 1. Tracking gap — most impactful rec
  if (a.tracking === 'none' || a.tracking === 'manual') {
    recs.push({
      title: 'Establish a real-time equipment intelligence baseline',
      detail: `Right now your team is operating blind — decisions about maintenance, replacement, and floor allocation are based on gut feel or lag indicators. Ecofit's connected layer gives you live visibility across every asset in ${data.networkLabel}. Operators who make this move first in their market consistently outperform on OpEx within 12 months.`
    });
  } else if (a.tracking === 'tickets') {
    recs.push({
      title: 'Upgrade from reactive tracking to predictive intelligence',
      detail: `Service tickets and staff reports tell you what already broke. Ecofit surfaces the signals before failure — utilization patterns, wear indicators, performance degradation — so your maintenance team is working a schedule, not a crisis queue. The difference typically shows up as a 30–40% reduction in unplanned service spend.`
    });
  }

  // 2. Maintenance posture
  if (a.maintenance === 'reactive' || a.maintenance === 'unknown') {
    recs.push({
      title: 'Convert reactive maintenance spend into a planned cost center',
      detail: `${a.maintenance === 'reactive' ? 'Over half your maintenance budget is unplanned' : 'Without tracking your maintenance split, you\'re likely absorbing significant reactive premium'}. Industry data shows reactive repairs cost 3–5x more than planned maintenance for the same work. Ecofit's predictive signals shift that ratio — the ROI is direct and measurable from quarter one.`
    });
  }

  // 3. Equipment age risk
  if (a.age === '6-10' || a.age === '10+') {
    recs.push({
      title: `Build a data-backed equipment replacement roadmap${a.age === '10+' ? ' — urgently' : ''}`,
      detail: `A ${a.age === '10+' ? '10+ year' : '6–10 year'} fleet without utilization data means your capex decisions are based on age and complaints, not performance. Ecofit shows you which equipment is still earning its floor space and which is quietly dragging down member experience — so you replace the right machines, at the right time, with board-level justification.`
    });
  }

  // 4. Multi-location network gap
  const multiLoc = !['1'].includes(a.locations);
  if (multiLoc && recs.length < 3) {
    recs.push({
      title: 'Unlock cross-location performance benchmarking',
      detail: `With ${data.networkLabel}, your most powerful insight isn't what's happening at any single location — it's what the outliers reveal about the whole network. Ecofit surfaces which locations are performing above or below network average on every metric, so your operations team has a live prioritization list instead of quarterly surveys.`
    });
  }

  // 5. Data confidence gap — always relevant, use as closer if needed
  if ((a.data_confidence === 'low' || a.data_confidence === 'none') && recs.length < 3) {
    recs.push({
      title: 'Close the equipment ROI visibility gap before your next capex cycle',
      detail: `Walking into a board meeting or budget review without reliable equipment ROI data means defending spend with anecdotes. Ecofit gives you the number — utilization rates, cost-per-active-hour, performance trends — so every capex decision is backed by data your CFO can interrogate. Operators consistently report this as the highest-value output in year one.`
    });
  }

  // 6. Recovery zone without visibility
  if (a.recovery !== 'none' && (a.data_confidence === 'low' || a.data_confidence === 'none') && recs.length < 3) {
    recs.push({
      title: 'Measure recovery zone ROI before your next equipment investment',
      detail: 'Recovery zones are the fastest-growing capex category in fitness — and the least measured. Before expanding your recovery footprint, Ecofit can show you dwell time, utilization rates, and member engagement patterns so every dollar of hardware investment is justified by data, not assumption.'
    });
  }

  // Always have at least 3
  if (recs.length < 3) {
    recs.push({
      title: 'Connect your equipment to a live network dashboard',
      detail: `The operators winning in this market aren't waiting for member complaints or quarterly audits to understand their floor. Ecofit gives your team a real-time view of every machine — uptime, usage, and performance — across ${data.networkLabel}, every day.`
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
  const a = data.answers;

  const recCards = recs.map((r, i) => `
    <div style="border-left:3px solid #84BC41;padding-left:24px;margin-bottom:32px;">
      <div style="font-family:'Work Sans',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#84BC41;margin-bottom:8px;">Priority ${i + 1}</div>
      <div style="font-family:'Raleway',sans-serif;font-size:20px;font-weight:700;color:#F2F3F8;margin-bottom:10px;line-height:1.3;">${r.title}</div>
      <div style="font-family:'Work Sans',sans-serif;font-size:14px;color:#9699A2;line-height:1.75;">${r.detail}</div>
    </div>`).join('');

  // Maintenance posture badge
  const maintBadge: Record<string, { text: string; color: string }> = {
    'planned':  { text: 'Proactive', color: '#84BC41' },
    'mixed':    { text: 'Mixed', color: '#f59e0b' },
    'reactive': { text: 'Reactive', color: '#ef4444' },
    'unknown':  { text: 'Unmeasured', color: '#9699A2' },
  };
  const mb = maintBadge[a.maintenance] || { text: '—', color: '#9699A2' };

  const answerRows = [
    ['Network Size',             label('locations', a.locations)],
    ['Equipment per Location',   label('equipment', a.equipment)],
    ['Performance Tracking',     label('tracking', a.tracking)],
    ['Maintenance Posture',      label('maintenance', a.maintenance)],
    ['Equipment Age',            label('age', a.age)],
    ['Recovery Zone',            label('recovery', a.recovery)],
    ['Downtime Impact',          label('impact', a.impact)],
    ['Equipment ROI Confidence', label('data_confidence', a.data_confidence)],
  ].map(([lbl, val]) => `
    <tr>
      <td style="padding:10px 16px;font-family:'Work Sans',sans-serif;font-size:13px;color:#9699A2;border-bottom:1px solid rgba(242,243,248,0.06);white-space:nowrap;">${lbl}</td>
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
  body{background:#14191f;color:#F2F3F8;font-family:'Work Sans',sans-serif;font-weight:300;-webkit-font-smoothing:antialiased;min-height:100vh}
  .container{max-width:780px;margin:0 auto;padding:0 24px 80px}
</style>
</head>
<body>

<!-- NAV -->
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
        Based on your facility profile across ${data.networkLabel}. This figure reflects equipment visibility gaps, maintenance cost premium, premature replacement risk, and untracked floor performance losses.
      </div>
    </div>

    <!-- MAINTENANCE POSTURE CALLOUT -->
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:32px">
      <div style="flex:1;min-width:180px;background:#14191f;border:1px solid rgba(132,188,65,0.1);padding:20px 24px">
        <div style="font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(242,243,248,0.3);margin-bottom:8px">Maintenance Posture</div>
        <div style="font-family:'Raleway',sans-serif;font-weight:700;font-size:1.3rem;color:${mb.color}">${mb.text}</div>
      </div>
      <div style="flex:1;min-width:180px;background:#14191f;border:1px solid rgba(132,188,65,0.1);padding:20px 24px">
        <div style="font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(242,243,248,0.3);margin-bottom:8px">ROI Data Confidence</div>
        <div style="font-family:'Raleway',sans-serif;font-weight:700;font-size:1.3rem;color:#F2F3F8">${label('data_confidence', a.data_confidence).split('—')[0].trim()}</div>
      </div>
      <div style="flex:1;min-width:180px;background:#14191f;border:1px solid rgba(132,188,65,0.1);padding:20px 24px">
        <div style="font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(242,243,248,0.3);margin-bottom:8px">Downtime Impact</div>
        <div style="font-family:'Raleway',sans-serif;font-weight:700;font-size:1.3rem;color:#F2F3F8">${label('impact', a.impact)}</div>
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
      Ecofit operators with similar facility profiles — ${data.networkLabel}, comparable equipment density — typically see these results within the first 12 months.
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

  <!-- CTA -->
  <div style="background:#14191f;border:1px solid rgba(132,188,65,0.2);border-top:3px solid #84BC41;padding:52px;text-align:center">
    <div style="width:40px;height:2px;background:#84BC41;margin:0 auto 28px"></div>
    <h2 style="font-family:'Raleway',sans-serif;font-weight:700;font-size:clamp(1.6rem,4vw,2.4rem);color:#F2F3F8;line-height:1.2;margin-bottom:14px">
      Want to see what your network is really telling you?
    </h2>
    <p style="font-family:'Work Sans',sans-serif;font-size:14px;color:#9699A2;margin-bottom:32px;line-height:1.75;max-width:480px;margin-left:auto;margin-right:auto">
      30 minutes with an Ecofit analyst. We'll review your facility profile, walk through what the intelligence layer looks like for your specific network, and show you real data from comparable operators. No commitment. No IT team required.
    </p>
    <a href="${BOOKING_LINK}" style="display:inline-flex;align-items:center;gap:8px;background:#84BC41;color:#14191f;font-family:'Work Sans',sans-serif;font-weight:600;font-size:15px;padding:16px 36px;text-decoration:none;border-radius:4px">
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
  const a = data.answers;

  // Personalised one-liner based on highest-signal answer
  let hook = '';
  if (a.tracking === 'none') hook = 'Your facility is running without any formal equipment tracking — that\'s the single largest driver of OpEx waste we see.';
  else if (a.maintenance === 'reactive') hook = 'With most of your maintenance spend going toward unplanned repairs, you\'re absorbing a 3–5x cost premium over best-in-class operators.';
  else if (a.age === '10+') hook = 'A 10+ year fleet without utilization data means your next capex cycle is driven by age and complaints, not performance.';
  else if (a.data_confidence === 'none') hook = 'Operating without equipment ROI data means every budget conversation is built on estimates — not a position you want to defend.';
  else hook = `Based on your profile across ${data.networkLabel}, there\'s a clear and closable gap between where you are and where best-in-class operators operate.`;

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

    <p style="font-size:14px;color:#9699A2;line-height:1.75;margin:0 0 24px">${hook}</p>

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

    <p style="font-size:13px;color:#9699A2;line-height:1.75;margin-bottom:28px">If you'd like to talk through what this means for ${data.company} — or see what the intelligence layer looks like for your specific network — I'm happy to do a 30-minute no-commitment demo.</p>

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
  const a = data.answers;

  // Signal strength summary for quick triage
  const signals = [];
  if (a.tracking === 'none' || a.tracking === 'manual') signals.push('❗ No / manual tracking');
  if (a.maintenance === 'reactive') signals.push('❗ Reactive maintenance');
  if (a.age === '10+' || a.age === '6-10') signals.push(`⚠️ Aging fleet (${label('age', a.age)})`);
  if (a.data_confidence === 'none' || a.data_confidence === 'low') signals.push('❗ No / low ROI data confidence');
  if (a.impact === 'known-pain' || a.impact === 'frequently') signals.push('⚠️ Frequent downtime impact');
  if (!['1'].includes(a.locations)) signals.push(`📍 ${label('locations', a.locations)}`);

  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:40px auto;padding:24px;background:#f9fafb">
<div style="background:white;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
  <div style="background:#14191f;padding:16px 24px;display:flex;align-items:center;gap:12px">
    <span style="font-family:Raleway,sans-serif;font-weight:700;color:#84BC41;font-size:18px">ecofit</span>
    <span style="font-size:12px;color:rgba(242,243,248,0.5)">New Assessment Lead</span>
  </div>
  <div style="padding:24px">

    ${signals.length > 0 ? `
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:14px 18px;margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#92400e;margin-bottom:8px">Lead Signals</div>
      ${signals.map(s => `<div style="font-size:13px;color:#78350f;margin-bottom:4px">${s}</div>`).join('')}
    </div>` : ''}

    <table style="width:100%;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:7px 0;color:#6b7280;width:150px">Name</td><td style="padding:7px 0;font-weight:600">${data.name}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280">Email</td><td style="padding:7px 0"><a href="mailto:${data.email}" style="color:#84BC41">${data.email}</a></td></tr>
      ${data.phone ? `<tr><td style="padding:7px 0;color:#6b7280">Phone</td><td style="padding:7px 0">${data.phone}</td></tr>` : ''}
      <tr><td style="padding:7px 0;color:#6b7280">Company</td><td style="padding:7px 0;font-weight:600">${data.company}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280">Title</td><td style="padding:7px 0">${data.title || '—'}</td></tr>
      <tr><td style="padding:7px 0;color:#6b7280;font-weight:700">OpEx Risk</td><td style="padding:7px 0;font-weight:700;color:#16a34a;font-size:16px">${riskRange}</td></tr>
      ${reportUrl ? `<tr><td style="padding:7px 0;color:#6b7280">Report</td><td style="padding:7px 0"><a href="${reportUrl}" style="color:#84BC41">${reportUrl}</a></td></tr>` : ''}
    </table>

    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:12px">Facility Profile</div>
      <table style="width:100%;font-size:13px;border-collapse:collapse;background:#f9fafb">
        <tr><td style="padding:6px 8px;color:#6b7280">Locations</td><td style="padding:6px 8px">${label('locations', a.locations)}</td></tr>
        <tr><td style="padding:6px 8px;color:#6b7280">Equipment</td><td style="padding:6px 8px">${label('equipment', a.equipment)}</td></tr>
        <tr><td style="padding:6px 8px;color:#6b7280">Tracking</td><td style="padding:6px 8px">${label('tracking', a.tracking)}</td></tr>
        <tr><td style="padding:6px 8px;color:#6b7280">Maintenance</td><td style="padding:6px 8px">${label('maintenance', a.maintenance)}</td></tr>
        <tr><td style="padding:6px 8px;color:#6b7280">Equipment Age</td><td style="padding:6px 8px">${label('age', a.age)}</td></tr>
        <tr><td style="padding:6px 8px;color:#6b7280">Recovery Zone</td><td style="padding:6px 8px">${label('recovery', a.recovery)}</td></tr>
        <tr><td style="padding:6px 8px;color:#6b7280">Downtime Impact</td><td style="padding:6px 8px">${label('impact', a.impact)}</td></tr>
        <tr><td style="padding:6px 8px;color:#6b7280">ROI Confidence</td><td style="padding:6px 8px">${label('data_confidence', a.data_confidence)}</td></tr>
      </table>
    </div>
  </div>
</div>
</body></html>`;
}

// ─── AIRTABLE ─────────────────────────────────────────────────────────────────

async function logToAirtable(data: AssessmentPayload, reportUrl: string | null, slug: string | null) {
  if (!AIRTABLE_API_KEY) { console.warn('AIRTABLE_API_KEY not set'); return; }
  const a = data.answers;
  const fields: Record<string, unknown> = {
    'Name':             data.name,
    'Email':            data.email,
    'Company':          data.company,
    'Title':            data.title || '',
    'Phone':            data.phone || '',
    'Locations':        label('locations', a.locations),
    'Equipment':        label('equipment', a.equipment),
    'Tracking':         label('tracking', a.tracking),
    'Maintenance':      label('maintenance', a.maintenance),
    'Equipment Age':    label('age', a.age),
    'Recovery Area':    label('recovery', a.recovery),
    'Member Impact':    label('impact', a.impact),
    'Data Confidence':  label('data_confidence', a.data_confidence),
    'Risk Low':         data.riskLow,
    'Risk High':        data.riskHigh,
    'Risk Mid':         data.riskMid,
    'Submitted At':     new Date().toISOString(),
  };
  if (reportUrl) fields['Report URL']  = reportUrl;
  if (slug)      fields['Report Slug'] = slug;

  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Ecofit%20Assessments`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) console.error('Airtable error:', await res.text());
}

// ─── ROUTE ────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: AssessmentPayload = await request.json();
    if (!data.email || !data.name || !data.company) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const slug = buildSlug(data.company, dateStr);

    // 1. Build report HTML
    const reportHtml = buildReportHTML(data);

    // 2. Push to GitHub → get live URL
    let reportUrl: string | null = null;
    try { reportUrl = await pushReportToGitHub(slug, reportHtml); } catch (e) { console.error('GitHub push failed:', e); }

    // 3. Email prospect
    await sendEmail(data.email, `Your Ecofit Facility Intelligence Report, ${data.name.split(' ')[0]}`, buildProspectEmail(data, reportUrl));

    // 4. Notify Bill
    await sendEmail(BILL_EMAIL, `🏋️ New Ecofit Assessment: ${data.name} · ${data.company} · ${fmt(data.riskLow)}–${fmt(data.riskHigh)} at risk`, buildBillNotifyEmail(data, reportUrl));

    // 5. Log to Airtable
    await logToAirtable(data, reportUrl, slug).catch(e => console.error('Airtable:', e));

    return new Response(JSON.stringify({ success: true, reportUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    console.error('ecofit-assessment-submit error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
