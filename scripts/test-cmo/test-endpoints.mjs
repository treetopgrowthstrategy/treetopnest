// Endpoint logic tests with mocked Airtable/Apollo/Resend I/O. No real network.
import crypto from 'node:crypto';

process.env.AIRTABLE_API_KEY = 'test';
process.env.RESEND_API_KEY = 'test';
process.env.APOLLO_API_KEY = 'test';
process.env.AIRTABLE_BASE_ID = 'app0cpbQjtdZh1sHT';
process.env.CMO_TOKEN_SECRET = 'sekret';

// ── Mock fetch (routes by URL, records every call) ──
let scenario = {};
let calls = [];
global.fetch = async (url, opts = {}) => {
  const u = String(url);
  calls.push({ u, method: opts.method || 'GET', body: opts.body ? JSON.parse(opts.body) : null });
  if (u.includes('/people/match')) return { ok: scenario.apolloOk !== false, json: async () => ({ person: scenario.apolloPerson ?? null }) };
  if (u.includes('api.resend.com')) return { ok: true, json: async () => ({ id: 'x' }), text: async () => '' };
  if (u.includes('openai.com')) return { ok: true, json: async () => ({ choices: [{ message: { content: 'x' } }] }) };
  if (u.includes('api.airtable.com')) {
    if (u.includes('filterByFormula')) return { ok: true, json: async () => ({ records: scenario.record ? [scenario.record] : [] }) };
    return { ok: true, json: async () => ({ id: 'newrec' }), text: async () => '' }; // create/patch
  }
  return { ok: true, json: async () => ({}), text: async () => '' };
};

const signup = (await import('./.bundled/ep/cmo-signup.mjs')).default;
const verify = (await import('./.bundled/ep/cmo-verify.mjs')).default;
const onboard = (await import('./.bundled/ep/cmo-onboard.mjs')).default;
const freeStart = (await import('./.bundled/ep/cmo-free-start.mjs')).default;
const freeQualify = (await import('./.bundled/ep/cmo-free-qualify.mjs')).default;

function mkRes() {
  const o = { code: 0 };
  const r = {
    setHeader() {},
    status(c) { o.code = c; return { json(j) { o.json = j; return o; }, end() { return o; }, send(s) { o.sent = s; return o; } }; },
    redirect(c, url) { o.code = c; o.redirect = url; return o; },
  };
  r._o = o;
  return r;
}
function reset(sc = {}) { scenario = sc; calls = []; }
// Airtable writes only (exclude the find GET and non-airtable POSTs)
const airtableWrites = () => calls.filter(c => c.u.includes('api.airtable.com') && (c.method === 'POST' || c.method === 'PATCH'));
const createFields = () => { const w = airtableWrites().find(c => c.method === 'POST' && !/\/rec|\/newrec/.test(c.u.replace(/.*\/tbl[^/]+/, ''))); return w?.body?.fields || null; };
const patchFields  = () => { const w = airtableWrites().find(c => c.method === 'PATCH'); return w?.body?.fields || null; };
const resendCalls  = () => calls.filter(c => c.u.includes('api.resend.com'));

let pass = true; const log = [];
function check(name, cond) { log.push((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) pass = false; }

// ── SIGNUP ──
reset({ record: null });
await signup({ method: 'POST', body: { email: 'ceo@acme.com', website: 'acme.com', _t: Date.now() - 5000 } }, mkRes());
let cf = createFields();
check('signup new: creates record', !!cf);
check('signup new: Stage=unverified', cf?.Stage === 'unverified');
check('signup new: Source=cmo-signup', cf?.Source === 'cmo-signup');
check('signup new: WebsiteURL normalized', cf?.WebsiteURL === 'https://acme.com');
check('signup new: StageSince stamped', /^\d{4}-\d{2}-\d{2}$/.test(cf?.StageSince || ''));

reset({ record: { id: 'rec1', fields: { Email: 'ceo@acme.com', Stage: 'onboarded' } } });
await signup({ method: 'POST', body: { email: 'ceo@acme.com', website: 'acme.com', _t: Date.now() - 5000 } }, mkRes());
check('signup existing: does NOT create', !airtableWrites().some(c => c.method === 'POST'));
check('signup existing: only patches WebsiteURL (no Stage downgrade)', patchFields() && !('Stage' in patchFields()) && patchFields().WebsiteURL === 'https://acme.com');

reset({ record: null });
const botRes = mkRes();
await signup({ method: 'POST', body: { email: 'ceo@acme.com', hp: 'iamabot', _t: Date.now() - 5000 } }, botRes);
check('signup bot honeypot: 200 success', botRes._o.code === 200);
check('signup bot honeypot: no Airtable write', airtableWrites().length === 0);

reset({ record: null });
await signup({ method: 'POST', body: { email: 'joe@gmail.com', _t: Date.now() - 5000 } }, mkRes());
check('signup gmail no website: WebsiteURL not derived', !('WebsiteURL' in (createFields() || {})));

// ── VERIFY ──
const ts = Date.now();
const email = 'ceo@acme.com';
const tok = crypto.createHmac('sha256', 'sekret').update(`${email}:${ts}`).digest('hex');
const e64 = Buffer.from(email).toString('base64url');

reset({ record: { id: 'rec1', fields: { Email: email, Stage: 'unverified' } } });
let vr = mkRes();
await verify({ method: 'GET', query: { e: e64, t: String(ts), s: tok } }, vr);
check('verify valid: redirects to onboarding', (vr._o.redirect || '').includes('/ai-cmo-advisor/onboarding'));
check('verify valid: Stage->verified', patchFields()?.Stage === 'verified');

reset({ record: { id: 'rec1', fields: { Email: email, Stage: 'onboarded' } } });
vr = mkRes();
await verify({ method: 'GET', query: { e: e64, t: String(ts), s: tok } }, vr);
check('verify no-downgrade: does NOT patch Stage when onboarded', !patchFields() || !('Stage' in patchFields()));
check('verify no-downgrade: still redirects to onboarding', (vr._o.redirect || '').includes('/onboarding'));

reset({ record: null });
vr = mkRes();
await verify({ method: 'GET', query: { e: e64, t: String(ts), s: 'deadbeef' } }, vr);
check('verify bad token: redirects to error', (vr._o.redirect || '').includes('err='));

// ── ONBOARD ──
reset({ record: { id: 'rec1', fields: { Email: email, Stage: 'verified' } } });
await onboard({ method: 'POST', body: { email, q1: 'we sell widgets', q3: 'competitorx.com, competitory.com' } }, mkRes());
check('onboard: Stage->onboarded', patchFields()?.Stage === 'onboarded');
check('onboard: Notes carries competitors', (patchFields()?.Notes || '').includes('competitorx.com'));

// ── FREE-START ──
reset({ record: null });
await freeStart({ method: 'POST', body: { email: 'vp@target.com', website: 'target.com', _t: Date.now() - 5000 } }, mkRes());
cf = createFields();
check('free-start: Source=cmo-free', cf?.Source === 'cmo-free');
check('free-start: QualifiedStatus=pending', cf?.QualifiedStatus === 'pending');
check('free-start: NO paid Stage set', !('Stage' in (cf || {})));

// ── FREE-QUALIFY ──
reset({ record: { id: 'rec9', fields: { Email: 'vp@target.com', Source: 'cmo-free' } }, apolloPerson: { title: 'VP Marketing', seniority: 'vp', organization: { estimated_num_employees: 120, primary_domain: 'target.com' } } });
let qr = mkRes();
await freeQualify({ method: 'POST', body: { email: 'vp@target.com', linkedin: 'https://linkedin.com/in/vp' } }, qr);
let pf = patchFields();
check('free-qualify vp: QualifiedStatus=qualified', pf?.QualifiedStatus === 'qualified');
check('free-qualify vp: enrichment stored', pf?.Title === 'VP Marketing' && pf?.Seniority === 'vp' && pf?.CompanySize === '120');
check('free-qualify vp: StageSince set (free lead, no paid Stage)', /^\d{4}-\d{2}-\d{2}$/.test(pf?.StageSince || ''));
check('free-qualify vp: no Bill review email', resendCalls().length === 0);
const qualifiedMsg = qr._o.json?.message;

reset({ record: { id: 'rec9', fields: { Email: 'intern@target.com', Source: 'cmo-free' } }, apolloPerson: { title: 'Intern', seniority: 'intern', organization: {} } });
await freeQualify({ method: 'POST', body: { email: 'intern@target.com', linkedin: 'https://linkedin.com/in/intern' } }, mkRes());
check('free-qualify intern: QualifiedStatus=rejected', patchFields()?.QualifiedStatus === 'rejected');
check('free-qualify intern: no review email', resendCalls().length === 0);

reset({ record: { id: 'rec9', fields: { Email: 'ghost@target.com', Source: 'cmo-free' } }, apolloPerson: null });
let rr = mkRes();
await freeQualify({ method: 'POST', body: { email: 'ghost@target.com', linkedin: 'https://linkedin.com/in/ghost' } }, rr);
check('free-qualify no-match: QualifiedStatus=review', patchFields()?.QualifiedStatus === 'review');
check('free-qualify no-match: routes review email to Bill', resendCalls().length === 1);
check('free-qualify: no status leak (same msg qualified vs review)', qualifiedMsg && rr._o.json?.message === qualifiedMsg);

reset({ record: { id: 'rec5', fields: { Email: 'paid@target.com', Stage: 'onboarded', StageSince: '2026-01-01' } }, apolloPerson: { title: 'VP', seniority: 'vp', organization: {} } });
await freeQualify({ method: 'POST', body: { email: 'paid@target.com', linkedin: 'https://linkedin.com/in/paid' } }, mkRes());
pf = patchFields();
check('free-qualify paid lead: QualifiedStatus written', pf?.QualifiedStatus === 'qualified');
check('free-qualify paid lead: StageSince NOT reset (guard)', !('StageSince' in (pf || {})));

console.log(log.join('\n'));
console.log(pass ? '\nALL PASS' : '\nFAILED');
process.exit(pass ? 0 : 1);
