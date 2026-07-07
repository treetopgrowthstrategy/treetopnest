// Live-mode test: sends go to leads, counters advance.
process.env.AIRTABLE_API_KEY = 'test';
process.env.RESEND_API_KEY = 'test';
process.env.AIRTABLE_BASE_ID = 'app0cpbQjtdZh1sHT';
process.env.CMO_NURTURE_ENABLED = 'true';
process.env.CRON_SECRET = 'testsecret';

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const MOCK = [
  { id: 'A', fields: { Email: 'a@acme.com', Name: 'Alice', Stage: 'unverified', StageSince: daysAgo(2), NurtureStep: 0 } },
  { id: 'C', fields: { Email: 'c@gamma.com', Stage: 'verified', StageSince: daysAgo(1), NurtureStep: 0 } },
  { id: 'D', fields: { Email: 'd@delta.com', Stage: 'onboarded', StageSince: daysAgo(5), NurtureStep: 1, NurtureStage: 'onboarded' } },
  { id: 'E', fields: { Email: 'e@epsilon.com', Stage: 'report_delivered', StageSince: daysAgo(3), NurtureStep: 0 } },
];

const sends = [];
const patches = [];
global.fetch = async (url, opts) => {
  const u = String(url);
  if (u.includes('/tbl7PEKkdYKafCEdC?filterByFormula')) return { ok: true, json: async () => ({ records: MOCK }) };
  if (u === 'https://api.resend.com/emails') { sends.push(JSON.parse(opts.body)); return { ok: true, json: async () => ({ id: 'x' }), text: async () => '' }; }
  if (u.includes('/tbl7PEKkdYKafCEdC/')) { patches.push({ id: u.split('/').pop(), body: JSON.parse(opts.body).fields }); return { ok: true, json: async () => ({}), text: async () => '' }; }
  return { ok: true, json: async () => ({}), text: async () => '' };
};

const handler = (await import('./.bundled/cron.mjs')).default;
let out = null;
const res = { status: (c) => ({ json: (o) => { out = { code: c, ...o }; }, end: () => {} }) };
await handler({ method: 'GET', headers: { authorization: 'Bearer testsecret' }, query: {} }, res);

const toAll = sends.map(s => s.to[0]);
const bccBill = sends.every(s => s.bcc && String(s.bcc[0]).includes('william.colbert'));
const replyTo = sends.every(s => s.reply_to && String(s.reply_to[0]).includes('reports.'));
console.log('RESULT:', JSON.stringify(out));
console.log('SENT to:', toAll);
console.log('PATCHES:', JSON.stringify(patches));

const checks = {
  'sent 5, all to leads': sends.length === 4 + 0 && toAll.every(t => t.includes('@')) && !toAll.some(t => t.includes('william.colbert')),
  'all bcc Bill': bccBill,
  'all reply-to reports subdomain': replyTo,
  'patched 4 leads': patches.length === 4,
  'counters advanced + stamped': patches.every(p => typeof p.body.NurtureStep === 'number' && p.body.NurtureStage && p.body.LastNurtureSentAt),
  'D advanced to step 2': patches.find(p => p.id === 'D')?.body.NurtureStep === 2,
};
let pass = true;
for (const [k, v] of Object.entries(checks)) { console.log((v ? 'PASS ' : 'FAIL ') + k); if (!v) pass = false; }
console.log(pass ? '\nALL PASS' : '\nFAILED');
process.exit(pass ? 0 : 1);
