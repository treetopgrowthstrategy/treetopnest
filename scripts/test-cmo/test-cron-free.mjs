// Integrated live test: paid pass + free-motion drip with capped Ahrefs/OpenAI research.
process.env.AIRTABLE_API_KEY = 'test';
process.env.RESEND_API_KEY = 'test';
process.env.AIRTABLE_BASE_ID = 'app0cpbQjtdZh1sHT';
process.env.AHREFS_API_KEY = 'test';
process.env.OPENAI_API_KEY = 'test';
process.env.CMO_NURTURE_ENABLED = 'true';
process.env.CMO_MAX_FREE_RESEARCH = '1'; // cap: only first free lead gets research
process.env.CRON_SECRET = 'testsecret';

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

const PAID = [
  { id: 'P1', fields: { Email: 'p1@onboard.com', Stage: 'onboarded', StageSince: daysAgo(5), NurtureStep: 0, NurtureStage: 'onboarded' } },
];
const QUALIFIED = [
  { id: 'Q1', fields: { Email: 'q1@acme.com', Name: 'Quinn', Source: 'cmo-free', QualifiedStatus: 'qualified', WebsiteURL: 'https://acme.com', StageSince: daysAgo(0), NurtureStep: 0 } },                                  // step0 -> research + insight
  { id: 'Q2', fields: { Email: 'q2@beta.com', Source: 'cmo-free', QualifiedStatus: 'qualified', WebsiteURL: 'https://beta.io', StageSince: daysAgo(3), NurtureStep: 1, NurtureStage: 'free' } },                             // step1 -> templated, no research
  { id: 'Q3', fields: { Email: 'q3@gamma.com', Source: 'cmo-free', QualifiedStatus: 'qualified', WebsiteURL: 'https://gamma.co', StageSince: daysAgo(0), NurtureStep: 0 } },                                                 // step0 -> held (cap already spent by Q1)
];

const sends = [], patches = [];
let ahrefsCalls = 0, openaiCalls = 0;
global.fetch = async (url, opts) => {
  const u = String(url);
  if (u.includes('QualifiedStatus')) return { ok: true, json: async () => ({ records: QUALIFIED }) };
  if (u.includes('filterByFormula')) return { ok: true, json: async () => ({ records: PAID }) };
  if (u.includes('api.ahrefs.com')) {
    ahrefsCalls++;
    if (u.includes('domain-rating')) return { ok: true, json: async () => ({ domain_rating: { domain_rating: 30 } }) };
    return { ok: true, json: async () => ({ metrics: { org_traffic: 1200, org_keywords: 400 } }) };
  }
  if (u.includes('openai.com')) { openaiCalls++; return { ok: true, json: async () => ({ choices: [{ message: { content: 'INSIGHT: acme ranks for 400 terms but leaves the high-intent ones on the table.' } }] }) }; }
  if (u === 'https://api.resend.com/emails') { sends.push(JSON.parse(opts.body)); return { ok: true, json: async () => ({ id: 'x' }), text: async () => '' }; }
  if (u.includes('/tbl7PEKkdYKafCEdC/')) { patches.push({ id: u.split('/').pop(), body: JSON.parse(opts.body).fields }); return { ok: true, json: async () => ({}), text: async () => '' }; }
  return { ok: true, json: async () => ({}), text: async () => '' };
};

const handler = (await import('./.bundled/cron.mjs')).default;
let out = null;
const res = { status: (c) => ({ json: (o) => { out = { code: c, ...o }; }, end: () => {} }) };
await handler({ method: 'GET', headers: { authorization: 'Bearer testsecret' }, query: {} }, res);

const byTo = (t) => sends.find(s => s.to[0] === t);
const q1mail = byTo('q1@acme.com'), q2mail = byTo('q2@beta.com'), q3mail = byTo('q3@gamma.com');
console.log('RESULT:', JSON.stringify(out));
console.log('sends:', sends.map(s => s.to[0]));
console.log('ahrefsCalls:', ahrefsCalls, 'openaiCalls:', openaiCalls);
console.log('patched ids:', patches.map(p => p.id + '=' + (p.body.NurtureStage || Object.keys(p.body).join('+'))));

const checks = {
  'paidSent 1, freeSent 2 (Q1+Q2)': out && out.paidSent === 1 && out.freeSent === 2,
  'researched capped at 1': out && out.researched === 1,
  'ahrefs called (2 endpoints) once': ahrefsCalls === 2,
  'openai called once': openaiCalls === 1,
  'q1 (step0) got the insight': !!(q1mail && q1mail.html.includes('INSIGHT: acme')),
  'q2 (step1) templated, no insight': !!(q2mail && !q2mail.html.includes('INSIGHT:')),
  'q3 held (cap spent, not sent)': !q3mail,
  'q1 Last Report patched': patches.some(p => p.id === 'Q1' && p.body['Last Report']),
  'free leads tagged NurtureStage=free (Q1+Q2)': patches.filter(p => p.body.NurtureStage === 'free').length === 2,
  'paid lead advanced': patches.some(p => p.id === 'P1' && p.body.NurtureStage === 'onboarded'),
};
let pass = true;
for (const [k, v] of Object.entries(checks)) { console.log((v ? 'PASS ' : 'FAIL ') + k); if (!v) pass = false; }
console.log(pass ? '\nALL PASS' : '\nFAILED');
process.exit(pass ? 0 : 1);
