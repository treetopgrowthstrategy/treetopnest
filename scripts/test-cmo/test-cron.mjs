// Logic test for cron-cmo-nurture with mocked Airtable + Resend I/O.
process.env.AIRTABLE_API_KEY = 'test';
process.env.RESEND_API_KEY = 'test';
process.env.AIRTABLE_BASE_ID = 'app0cpbQjtdZh1sHT';
delete process.env.CMO_NURTURE_ENABLED; // dry-run

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

const MOCK = [
  { id: 'A', fields: { Email: 'a@acme.com', Name: 'Alice', Stage: 'unverified', StageSince: daysAgo(2), NurtureStep: 0 } },              // queue: unverified step0
  { id: 'B', fields: { Email: 'b@beta.com', Stage: 'verified', StageSince: daysAgo(0), NurtureStep: 0 } },                                 // skip: age0 < day1
  { id: 'C', fields: { Email: 'c@gamma.com', Stage: 'verified', StageSince: daysAgo(1), NurtureStep: 0 } },                                // queue: verified step0
  { id: 'D', fields: { Email: 'd@delta.com', Stage: 'onboarded', StageSince: daysAgo(5), NurtureStep: 1, NurtureStage: 'onboarded' } },    // queue: onboarded step1 (day3)
  { id: 'E', fields: { Email: 'e@epsilon.com', Stage: 'report_delivered', StageSince: daysAgo(3), NurtureStep: 0 } },                      // queue: report_delivered step0 (day3)
  { id: 'F', fields: { Email: 'f@zeta.com', Stage: 'onboarded', StageSince: daysAgo(5), NurtureStep: 0, LastNurtureSentAt: daysAgo(0) } }, // skip: already sent today
  { id: 'G', fields: { Email: 'g@eta.com', Stage: 'verified', StageSince: daysAgo(5), NurtureStep: 2, NurtureStage: 'verified' } },        // skip: sequence complete
  { id: 'H', fields: { Email: 'h@theta.com', Stage: 'monitor' } },                                                                          // skip: not nurturable
  { id: 'I', fields: { Email: 'i@iota.com', Stage: 'onboarded', StageSince: daysAgo(2), NurtureStep: 2, NurtureStage: 'verified' } },      // queue: reset to step0 (stage changed)
];

let digest = null;
const patches = [];
global.fetch = async (url, opts) => {
  const u = String(url);
  if (u.includes('/tbl7PEKkdYKafCEdC?filterByFormula')) {
    return { ok: true, json: async () => ({ records: MOCK }) };
  }
  if (u === 'https://api.resend.com/emails') {
    digest = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ id: 'x' }), text: async () => '' };
  }
  if (u.includes('/tbl7PEKkdYKafCEdC/')) { patches.push({ url: u, body: JSON.parse(opts.body) }); return { ok: true, json: async () => ({}), text: async () => '' }; }
  return { ok: true, json: async () => ({}), text: async () => '' };
};

const mod = await import('./.bundled/cron.mjs');
const handler = mod.default;

let out = null;
const res = { status: (c) => ({ json: (o) => { out = { code: c, ...o }; }, end: () => { out = { code: c }; } }) };
await handler({ method: 'GET', headers: {}, query: {} }, res);

console.log('RESULT:', JSON.stringify(out));
console.log('DIGEST to:', digest && digest.to, '| subject:', digest && digest.subject);
console.log('PATCHES (should be 0 in dry-run):', patches.length);

const checks = {
  'queued == 5': out && out.queued === 5,
  'mode dry-run': out && out.mode === 'dry-run',
  'digest sent to Bill': !!(digest && String(digest.to[0]).includes('william.colbert')),
  'no counter writes in dry-run': patches.length === 0,
  'digest names 5': !!(digest && digest.subject.includes('5')),
};
let pass = true;
for (const [k, v] of Object.entries(checks)) { console.log((v ? 'PASS ' : 'FAIL ') + k); if (!v) pass = false; }
console.log(pass ? '\nALL PASS' : '\nFAILED');
process.exit(pass ? 0 : 1);
