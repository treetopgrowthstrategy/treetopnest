// Payment webhook tests: idempotency (Airtable-field fallback, no Upstash),
// retry recovery, and never-silence on permanent failure.
// Uses the real Stripe SDK to forge a valid signature; all other I/O mocked.
import Stripe from 'stripe';
import { Readable } from 'node:stream';

process.env.STRIPE_SECRET_KEY = 'sk_test_x';
process.env.CMO_WEBHOOK_SECRET = 'whsec_testsecret';
process.env.RESEND_API_KEY = 'test';
process.env.OPENAI_API_KEY = 'test';
process.env.AIRTABLE_API_KEY = 'test';
process.env.AHREFS_API_KEY = 'test';
process.env.BILL_NOTIFY_EMAIL = 'bill@example.com';
process.env.CMO_RETRY_BACKOFF_MS = '0'; // no real waiting in tests
// UPSTASH intentionally unset: exercises the Airtable-field idempotency fallback.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

let scenario = {};
let calls = [];
global.fetch = async (url, opts = {}) => {
  const u = String(url);
  const body = opts.body ? JSON.parse(opts.body) : null;
  calls.push({ u, method: opts.method || 'GET', body });
  if (u.includes('ahrefs.com')) {
    return { ok: true, json: async () => ({ domain_rating: { domain_rating: 70 }, metrics: { org_keywords: 100, org_traffic: 5000 }, keywords: [] }) };
  }
  if (u.includes('openai.com')) {
    scenario._openai = (scenario._openai || 0) + 1;
    if (scenario._openai <= (scenario.openaiFailFirst || 0)) return { ok: false, status: 500, text: async () => 'boom' };
    return { ok: true, json: async () => ({ choices: [{ message: { content: '<h2>1. Competitive Snapshot</h2><p>real report</p>' } }] }) };
  }
  if (u.includes('api.resend.com')) {
    const toCustomer = (body?.to || []).includes('buyer@acme.com');
    if (toCustomer && scenario.resendCustomerFail) return { ok: false, status: 400, text: async () => 'bounce' };
    return { ok: true, json: async () => ({ id: 'x' }), text: async () => '' };
  }
  if (u.includes('api.airtable.com')) {
    if (u.includes('filterByFormula')) return { ok: true, json: async () => ({ records: scenario.record ? [scenario.record] : [] }) };
    return { ok: true, json: async () => ({ id: 'rec' }), text: async () => '' };
  }
  return { ok: true, json: async () => ({}), text: async () => '' };
};

const handler = (await import('./.bundled/webhook.mjs')).default;

function mkReq(payload, sig) {
  const r = Readable.from([Buffer.from(payload)]);
  r.method = 'POST';
  r.headers = { 'stripe-signature': sig };
  return r;
}
function mkRes() {
  const o = { code: 0 };
  return {
    _o: o,
    status(c) { o.code = c; return { json(j) { o.json = j; return o; }, end() { return o; }, send(s) { o.sent = s; return o; } }; },
  };
}
function fireEvent(session) {
  const event = { id: 'evt_' + session.id, type: 'checkout.session.completed', data: { object: session } };
  const payload = JSON.stringify(event);
  const sig = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.CMO_WEBHOOK_SECRET });
  return handler(mkReq(payload, sig), mkRes());
}
const starterSession = (id) => ({ id, customer_email: 'buyer@acme.com', metadata: { product: 'cmo-starter-report' } });
const openaiCalls = () => calls.filter(c => c.u.includes('openai.com'));
const customerSends = () => calls.filter(c => c.u.includes('api.resend.com') && (c.body?.to || []).includes('buyer@acme.com'));
const billSends = () => calls.filter(c => c.u.includes('api.resend.com') && (c.body?.to || []).includes('bill@example.com'));
const airtablePatches = () => calls.filter(c => c.u.includes('api.airtable.com') && c.method === 'PATCH');

let pass = true; const log = [];
function check(name, cond) { log.push((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) pass = false; }
function reset(sc = {}) { scenario = sc; calls = []; }

// ── 1. Bad signature rejected ──
reset({ record: { id: 'rec1', fields: { Notes: 'Competitors: rival.com' } } });
{
  const r = await handler(mkReq(JSON.stringify({ type: 'checkout.session.completed', data: { object: starterSession('cs_bad') } }), 't=1,v1=deadbeef'), mkRes());
  check('bad signature: 400', r.code === 400);
  check('bad signature: no OpenAI spend', openaiCalls().length === 0);
}

// ── 2. Happy path ──
reset({ record: { id: 'rec1', fields: { Notes: 'Competitors: rival.com' } } });
{
  const r = await fireEvent(starterSession('cs_happy'));
  check('happy: 200', r.code === 200);
  check('happy: OpenAI called once', openaiCalls().length === 1);
  check('happy: customer report sent', customerSends().some(c => /Starter Report is ready/.test(c.body?.subject || '')));
  const patch = airtablePatches().find(c => c.body?.fields?.Stage === 'report_delivered');
  check('happy: Stage->report_delivered', !!patch);
  check('happy: session id recorded for idempotency', patch?.body?.fields?.LastPaidSessionId === 'cs_happy');
}

// ── 3. Idempotency (Airtable-field fallback) ──
reset({ record: { id: 'rec1', fields: { Notes: 'Competitors: rival.com', LastPaidSessionId: 'cs_happy' } } });
{
  const r = await fireEvent(starterSession('cs_happy'));
  check('idempotent: duplicate returns duplicate:true', r.json?.duplicate === true);
  check('idempotent: NO OpenAI spend on replay', openaiCalls().length === 0);
  check('idempotent: NO customer send on replay', customerSends().length === 0);
}

// ── 4. Retry recovery: OpenAI fails once, succeeds on attempt 2 ──
reset({ record: { id: 'rec1', fields: { Notes: 'Competitors: rival.com' } }, openaiFailFirst: 1 });
{
  const r = await fireEvent(starterSession('cs_retry'));
  check('retry: 200', r.code === 200);
  check('retry: OpenAI retried (2 calls)', openaiCalls().length === 2);
  check('retry: customer report ultimately delivered', customerSends().some(c => /Starter Report is ready/.test(c.body?.subject || '')));
}

// ── 5. Never-silence: permanent failure ──
reset({ record: { id: 'rec1', fields: { Notes: 'Competitors: rival.com' } }, openaiFailFirst: 99 });
{
  const r = await fireEvent(starterSession('cs_fail'));
  check('never-silence: 200 (Stripe not retried)', r.code === 200);
  check('never-silence: 3 attempts made', openaiCalls().length === 3);
  check('never-silence: customer got holding note', customerSends().some(c => /on its way/i.test(c.body?.subject || '')));
  check('never-silence: Bill got ACTION NEEDED', billSends().some(c => /ACTION NEEDED/.test(c.body?.subject || '')));
  check('never-silence: Airtable marked failed', airtablePatches().some(c => c.body?.fields?.ReportStatus === 'failed'));
  check('never-silence: Stage NOT advanced to delivered', !airtablePatches().some(c => c.body?.fields?.Stage === 'report_delivered'));
}

// ── 6. Subscription tier: advances stage, no report ──
reset({ record: { id: 'rec1', fields: {} } });
{
  const r = await fireEvent({ id: 'cs_sub', customer_email: 'buyer@acme.com', metadata: { product: 'cmo-monitor', tier: 'monitor' } });
  check('subscription: 200', r.code === 200);
  check('subscription: no OpenAI spend', openaiCalls().length === 0);
  check('subscription: stage set to tier', airtablePatches().some(c => c.body?.fields?.Stage === 'monitor'));
}

console.log(log.join('\n'));
console.log(pass ? '\nALL PASS' : '\nFAILED');
process.exit(pass ? 0 : 1);
