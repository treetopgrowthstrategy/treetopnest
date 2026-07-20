// Subscription lifecycle tests: checkout activation, cancellation, payment
// failure, payment recovery, idempotency.
import Stripe from 'stripe';
import { Readable } from 'node:stream';

process.env.STRIPE_SECRET_KEY = 'sk_test_x';
process.env.CMO_WEBHOOK_SECRET = 'whsec_testsecret';
process.env.RESEND_API_KEY = 'test';
process.env.AIRTABLE_API_KEY = 'test';
process.env.BILL_NOTIFY_EMAIL = 'bill@example.com';
process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

let records = [];
let patches = [];
let redisStore = {};
let resendCalls = [];

global.fetch = async (url, opts = {}) => {
  const u = String(url);
  const body = opts.body ? JSON.parse(opts.body) : null;

  if (u.includes('fake-redis.upstash.io')) {
    const path = new URL(u).pathname.replace(/^\//, '');
    const parts = path.split('/').map(decodeURIComponent);
    const cmd = parts[0].toUpperCase();
    if (cmd === 'GET') return { ok: true, json: async () => ({ result: redisStore[parts[1]] ?? null }) };
    if (cmd === 'SET') { redisStore[parts[1]] = parts[2]; return { ok: true, json: async () => ({ result: 'OK' }) }; }
    if (cmd === 'INCR') {
      redisStore[parts[1]] = String((parseInt(redisStore[parts[1]] || '0') + 1));
      return { ok: true, json: async () => ({ result: parseInt(redisStore[parts[1]]) }) };
    }
    if (cmd === 'EXPIRE') return { ok: true, json: async () => ({ result: 1 }) };
    return { ok: true, json: async () => ({ result: null }) };
  }

  if (u.includes('api.airtable.com')) {
    if (u.includes('filterByFormula')) {
      const decoded = decodeURIComponent(u);
      const subMatch = decoded.match(/\{SubscriptionId\}="([^"]+)"/);
      const emailMatch = decoded.match(/LOWER\(\{Email\}\)="([^"]+)"/);
      let rec = null;
      if (subMatch) rec = records.find(r => r.fields?.SubscriptionId === subMatch[1]);
      else if (emailMatch) rec = records.find(r => (r.fields?.Email || '').toLowerCase() === emailMatch[1]);
      return { ok: true, json: async () => ({ records: rec ? [rec] : [] }) };
    }
    if (opts.method === 'PATCH') {
      patches.push({ url: u, fields: body?.fields });
      return { ok: true, json: async () => ({ id: 'rec' }), text: async () => '' };
    }
    if (opts.method === 'POST') {
      patches.push({ url: u, fields: body?.fields });
      return { ok: true, json: async () => ({ id: 'rec_new' }), text: async () => '' };
    }
    return { ok: true, json: async () => ({}), text: async () => '' };
  }

  if (u.includes('api.resend.com')) {
    resendCalls.push(body);
    return { ok: true, json: async () => ({ id: 'x' }), text: async () => '' };
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
function fire(type, obj, eventId) {
  const event = { id: eventId || `evt_${type}_${Date.now()}`, type, data: { object: obj } };
  const payload = JSON.stringify(event);
  const sig = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.CMO_WEBHOOK_SECRET });
  return handler(mkReq(payload, sig), mkRes());
}

let pass = true;
const log = [];
function check(name, cond) { log.push((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) pass = false; }
function reset() { records = []; patches = []; redisStore = {}; resendCalls = []; }

// ── 1. Subscription checkout writes all subscription fields ──
reset();
records.push({ id: 'recA', fields: { Email: 'sub@acme.com' } });
{
  const r = await fire('checkout.session.completed', {
    id: 'cs_sub1', customer_email: 'sub@acme.com', subscription: 'sub_activate',
    metadata: { product: 'cmo-monitor', tier: 'monitor' },
  }, 'evt_sub1');
  check('sub checkout: 200', r.code === 200);
  const p = patches.find(c => c.fields?.SubscriptionId === 'sub_activate');
  check('sub checkout: SubscriptionId written', !!p);
  check('sub checkout: SubscriptionStatus=active', p?.fields?.SubscriptionStatus === 'active');
  check('sub checkout: SubscriptionTier=monitor', p?.fields?.SubscriptionTier === 'monitor');
  check('sub checkout: SubscriptionStartedAt stamped', !!p?.fields?.SubscriptionStartedAt);
  check('sub checkout: Stage=monitor', p?.fields?.Stage === 'monitor');
}

// ── 2. Subscription deleted marks cancelled ──
reset();
records.push({ id: 'recB', fields: { Email: 'cancel@acme.com', SubscriptionId: 'sub_cancel', SubscriptionStatus: 'active' } });
{
  const r = await fire('customer.subscription.deleted', { id: 'sub_cancel', customer: 'cus_1' }, 'evt_del1');
  check('deletion: 200', r.code === 200);
  const p = patches.find(c => c.fields?.SubscriptionStatus === 'cancelled');
  check('deletion: SubscriptionStatus=cancelled', !!p);
  check('deletion: SubscriptionCancelledAt stamped', !!p?.fields?.SubscriptionCancelledAt);
  check('deletion: Bill alerted', resendCalls.some(c => /cancelled/i.test(c.subject || '')));
}

// ── 3. Deletion replay is idempotent ──
{
  patches = [];
  resendCalls = [];
  const r = await fire('customer.subscription.deleted', { id: 'sub_cancel', customer: 'cus_1' }, 'evt_del1');
  check('deletion idempotent: duplicate', r.json?.duplicate === true);
  check('deletion idempotent: no extra patch', patches.length === 0);
}

// ── 4. Payment failed marks past_due ──
reset();
records.push({ id: 'recC', fields: { Email: 'late@acme.com', SubscriptionId: 'sub_pastdue', SubscriptionStatus: 'active' } });
{
  const r = await fire('invoice.payment_failed', { subscription: 'sub_pastdue', customer: 'cus_2' }, 'evt_fail1');
  check('payment failed: 200', r.code === 200);
  check('payment failed: past_due', patches.some(c => c.fields?.SubscriptionStatus === 'past_due'));
  check('payment failed: Bill alerted', resendCalls.some(c => /failed/i.test(c.subject || '')));
}

// ── 5. Invoice paid restores from past_due ──
reset();
records.push({ id: 'recD', fields: { Email: 'restored@acme.com', SubscriptionId: 'sub_restore', SubscriptionStatus: 'past_due' } });
{
  const r = await fire('invoice.paid', { subscription: 'sub_restore', customer: 'cus_3' }, 'evt_paid1');
  check('invoice paid restore: 200', r.code === 200);
  check('invoice paid restore: active', patches.some(c => c.fields?.SubscriptionStatus === 'active'));
}

// ── 6. Invoice paid no-op on normal renewal ──
reset();
records.push({ id: 'recE', fields: { Email: 'normal@acme.com', SubscriptionId: 'sub_normal', SubscriptionStatus: 'active' } });
{
  const r = await fire('invoice.paid', { subscription: 'sub_normal', customer: 'cus_4' }, 'evt_paid2');
  check('normal renewal: 200', r.code === 200);
  check('normal renewal: no patch', patches.length === 0);
}

// ── 7. Unknown subscription ID: graceful 200 ──
reset();
{
  const r = await fire('customer.subscription.deleted', { id: 'sub_unknown', customer: 'cus_99' }, 'evt_del_unk');
  check('unknown sub: 200', r.code === 200);
  check('unknown sub: no patches', patches.length === 0);
}

console.log(log.join('\n'));
console.log(pass ? '\nALL PASS' : '\nFAILED');
process.exit(pass ? 0 : 1);
