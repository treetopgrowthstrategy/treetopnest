// Report permalink tests: stateless HMAC token round-trip, serving, 404s,
// and best-effort view tracking. Airtable I/O mocked.

process.env.AIRTABLE_API_KEY = 'test';
process.env.AIRTABLE_BASE_ID = 'app0cpbQjtdZh1sHT';
process.env.CMO_TOKEN_SECRET = 'sekret';

let scenario = {};
let calls = [];
global.fetch = async (url, opts = {}) => {
  const u = String(url);
  calls.push({ u, method: opts.method || 'GET', body: opts.body ? JSON.parse(opts.body) : null });
  if (u.includes('api.airtable.com')) {
    if (u.includes('filterByFormula')) return { ok: true, json: async () => ({ records: scenario.record ? [scenario.record] : [] }) };
    return { ok: true, json: async () => ({ id: 'rec' }), text: async () => '' };
  }
  return { ok: true, json: async () => ({}), text: async () => '' };
};

const mod = await import('./.bundled/report.mjs');
const handler = mod.default;
const reportPermalink = mod.reportPermalink;

function mkRes() {
  const o = { code: 0, headers: {} };
  return {
    _o: o,
    setHeader(k, v) { o.headers[k] = v; },
    status(c) { o.code = c; return { send(s) { o.body = s; return o; }, json(j) { o.json = j; return o; }, end() { return o; } }; },
  };
}
let pass = true; const log = [];
function check(name, cond) { log.push((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) pass = false; }

const email = 'ceo@acme.com';
const url = reportPermalink(email, 'https://x');
const token = url.split('/r/')[1];
check('permalink token form enc.sig', /^[A-Za-z0-9_-]+\.[0-9a-f]{32}$/.test(token));

// valid token serves the report + tracks a view
scenario = { record: { id: 'rec1', fields: { Email: email, 'Last Report': '<h2>REPORT BODY</h2>' } } };
calls = [];
let r = mkRes();
await handler({ method: 'GET', query: { token } }, r);
check('valid: 200', r._o.code === 200);
check('valid: serves report html', (r._o.body || '').includes('REPORT BODY'));
check('valid: content-type html', /text\/html/.test(r._o.headers['Content-Type'] || ''));
check('valid: view tracked (PATCH ReportViews=1)', calls.some(c => c.method === 'PATCH' && c.body?.fields?.ReportViews === 1));
check('valid: first-view stamped', calls.some(c => c.method === 'PATCH' && !!c.body?.fields?.ReportFirstViewedAt));

// tampered token -> 404
r = mkRes();
const bad = token.slice(0, -1) + (token.slice(-1) === 'a' ? 'b' : 'a');
await handler({ method: 'GET', query: { token: bad } }, r);
check('tampered token: 404', r._o.code === 404);

// no token -> 404
r = mkRes();
await handler({ method: 'GET', query: {} }, r);
check('no token: 404', r._o.code === 404);

// valid token but record has no report -> 404
scenario = { record: { id: 'rec1', fields: { Email: email } } };
r = mkRes();
await handler({ method: 'GET', query: { token } }, r);
check('valid token, no stored report: 404', r._o.code === 404);

// non-GET -> 405
r = mkRes();
await handler({ method: 'POST', query: { token } }, r);
check('POST: 405', r._o.code === 405);

console.log(log.join('\n'));
console.log(pass ? '\nALL PASS' : '\nFAILED');
process.exit(pass ? 0 : 1);
