// Unit tests for the shared spend/abuse guard module.
// A tiny in-memory Redis stands in for Upstash via the mocked global.fetch.

process.env.UPSTASH_REDIS_REST_URL = 'https://fake-upstash';
process.env.UPSTASH_REDIS_REST_TOKEN = 'tok';
process.env.CMO_RATE_PER_IP_DAY = '3';
process.env.CMO_RATE_PER_EMAIL_DAY = '2';
process.env.CMO_DAILY_BUDGET = '5';
process.env.RESEND_API_KEY = 'test';
process.env.BILL_NOTIFY_EMAIL = 'bill@example.com';

const store = new Map();
let resendCalls = [];
global.fetch = async (url, opts = {}) => {
  const u = String(url);
  if (u.startsWith('https://fake-upstash')) {
    const parts = u.slice('https://fake-upstash/'.length).split('/').map(decodeURIComponent);
    const cmd = parts[0].toLowerCase();
    if (cmd === 'incr') { const k = parts[1]; const n = (store.get(k) || 0) + 1; store.set(k, n); return { ok: true, json: async () => ({ result: n }) }; }
    if (cmd === 'get')  { const k = parts[1]; const v = store.get(k); return { ok: true, json: async () => ({ result: v == null ? null : String(v) }) }; }
    if (cmd === 'set')  { const k = parts[1]; store.set(k, parts[2] ?? '1'); return { ok: true, json: async () => ({ result: 'OK' }) }; }
    if (cmd === 'expire') return { ok: true, json: async () => ({ result: 1 }) };
    return { ok: true, json: async () => ({ result: null }) };
  }
  if (u.includes('api.resend.com')) { resendCalls.push(opts.body ? JSON.parse(opts.body) : {}); return { ok: true, json: async () => ({ id: 'x' }), text: async () => '' }; }
  return { ok: true, json: async () => ({}), text: async () => '' };
};

const G = await import('./.bundled/guards.mjs');

let pass = true; const log = [];
function check(name, cond) { log.push((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) pass = false; }

// ── storeConfigured ──
check('storeConfigured true when UPSTASH set', G.storeConfigured() === true);

// ── kill switch ──
check('killSwitch off by default', G.killSwitchOn() === false);
process.env.CMO_KILL_SWITCH = 'true';
check('killSwitch on when true', G.killSwitchOn() === true);
process.env.CMO_KILL_SWITCH = '';
check('killSwitch off when empty', G.killSwitchOn() === false);

// ── disposable ──
check('disposable: mailinator blocked', G.isDisposableEmail('a@mailinator.com') === true);
check('disposable: corporate allowed', G.isDisposableEmail('vp@acme.com') === false);

// ── plausibility ──
check('plausible: exact domain match', G.emailMatchesWebsite('vp@acme.com', 'https://acme.com') === true);
check('plausible: www + subpath match', G.emailMatchesWebsite('vp@acme.com', 'www.acme.com/pricing') === true);
check('plausible: gmail vs brand mismatch', G.emailMatchesWebsite('someone@gmail.com', 'acme.com') === false);
check('plausible: no website is false', G.emailMatchesWebsite('vp@acme.com', '') === false);

// ── clientIp ──
check('clientIp reads x-forwarded-for first', G.clientIp({ headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } }) === '1.2.3.4');

// ── admin auth ──
check('admin denied when no key set', G.adminAuthorized({ headers: { 'x-cmo-admin-key': 'x' } }) === false);
process.env.CMO_ADMIN_KEY = 'secret';
check('admin denied on wrong key', G.adminAuthorized({ headers: { 'x-cmo-admin-key': 'nope' } }) === false);
check('admin allowed on right key', G.adminAuthorized({ headers: { 'x-cmo-admin-key': 'secret' } }) === true);

// ── rate limiting: per-IP cap = 3 ──
store.clear();
let last;
for (let i = 0; i < 3; i++) last = await G.rateLimitSubmission('9.9.9.9', `u${i}@acme.com`, 'q');
check('rate: first 3 IP hits allowed', last.ok === true);
last = await G.rateLimitSubmission('9.9.9.9', 'u4@acme.com', 'q');
check('rate: 4th IP hit blocked', last.ok === false && last.reason === 'ip-rate');

// ── rate limiting: per-email cap = 2 (fresh IPs so IP cap is not the trigger) ──
store.clear();
await G.rateLimitSubmission('a.0', 'same@acme.com', 'q');
await G.rateLimitSubmission('a.1', 'same@acme.com', 'q');
last = await G.rateLimitSubmission('a.2', 'same@acme.com', 'q');
check('rate: 3rd same-email hit blocked', last.ok === false && last.reason === 'email-rate');

// ── separate buckets do not double-count ──
store.clear();
await G.rateLimitSubmission('7.7.7.7', 'p@acme.com', 's'); // intake
last = await G.rateLimitSubmission('7.7.7.7', 'p@acme.com', 'q'); // qualify, different bucket
check('rate: start and qualify buckets independent', last.ok === true);

// ── budget cap = 5 ──
store.clear();
let b = await G.budgetAvailable();
check('budget: available when empty', b.ok === true && b.cap === 5);
for (let i = 0; i < 5; i++) await G.consumeBudget();
b = await G.budgetAvailable();
check('budget: exhausted after cap consumed', b.ok === false && b.count === 5);

// ── idempotency: wasProcessed / markProcessed ──
store.clear();
let p = await G.wasProcessed('cmo:paid:sess1');
check('idem: unseen key not processed', p.enforced === true && p.seen === false);
await G.markProcessed('cmo:paid:sess1');
p = await G.wasProcessed('cmo:paid:sess1');
check('idem: seen after markProcessed', p.seen === true);

// ── alert throttle: one per kind per day ──
store.clear(); resendCalls = [];
await G.alertOps('budget', 'sub', '<p>x</p>');
await G.alertOps('budget', 'sub', '<p>x</p>');
check('alert: throttled to one per kind per day', resendCalls.length === 1);

// ── no-store degradation ──
const savedUrl = process.env.UPSTASH_REDIS_REST_URL;
process.env.UPSTASH_REDIS_REST_URL = '';
check('storeConfigured false without URL', G.storeConfigured() === false);
const r = await G.rateLimitSubmission('1.1.1.1', 'x@acme.com', 'q');
check('rate: no-store degrades to allow (not enforced)', r.ok === true && r.enforced === false);
const bud = await G.budgetAvailable();
check('budget: no-store degrades to available (not enforced)', bud.ok === true && bud.enforced === false);
process.env.UPSTASH_REDIS_REST_URL = savedUrl;

console.log(log.join('\n'));
console.log(pass ? '\nALL PASS' : '\nFAILED');
process.exit(pass ? 0 : 1);
