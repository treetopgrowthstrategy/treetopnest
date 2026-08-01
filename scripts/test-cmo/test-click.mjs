// Click tracker tests: valid token + section -> 302 to pay + Airtable written,
// invalid token -> 302 to pricing, invalid section -> 302 to pricing,
// Airtable failure does not block redirect.

process.env.AIRTABLE_API_KEY = 'test';
process.env.CMO_TOKEN_SECRET = 'test-secret';

let airtableCalls = [];
let airtablePatches = [];

function resetMocks() {
  airtableCalls = [];
  airtablePatches = [];
}

global.fetch = async (url, opts = {}) => {
  const u = String(url);
  const body = opts.body ? JSON.parse(opts.body) : null;

  if (u.includes('api.airtable.com')) {
    airtableCalls.push({ url: u, method: opts.method || 'GET', body });
    if (u.includes('filterByFormula')) {
      return {
        ok: true,
        json: async () => ({
          records: [{ id: 'rec1', fields: { Email: 'test@acme.com', ClickedSections: '[]' } }],
        }),
      };
    }
    if (opts.method === 'PATCH') {
      airtablePatches.push({ url: u, fields: body?.fields });
      return { ok: true, json: async () => ({ id: 'rec1' }), text: async () => '' };
    }
    return { ok: true, json: async () => ({}), text: async () => '' };
  }

  return { ok: true, json: async () => ({}), text: async () => '' };
};

const handler = (await import('./.bundled/click.mjs')).default;

function mkReq(query = {}) {
  return { query };
}
function mkRes() {
  const o = { code: 0, headers: {} };
  return {
    _o: o,
    status(c) {
      o.code = c;
      return {
        setHeader(k, v) { o.headers[k] = v; return { end() {} }; },
        json(j) { o.json = j; },
        end() {},
      };
    },
    setHeader(k, v) { o.headers[k] = v; return o; },
  };
}

import crypto from 'node:crypto';

function makeToken(email) {
  const e = email.trim().toLowerCase();
  const enc = Buffer.from(e).toString('base64url');
  const sig = crypto.createHmac('sha256', 'test-secret').update(`report:${e}`).digest('hex').slice(0, 32);
  return `${enc}.${sig}`;
}

let pass = true;
const log = [];
function check(name, cond) { log.push((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) pass = false; }

// ── 1. Valid token + valid section -> 302 to pay ──
resetMocks();
{
  const token = makeToken('test@acme.com');
  const res = mkRes();
  await handler(mkReq({ s: 'snapshot', t: token }), res);
  check('valid click: 302', res._o.code === 302);
  check('valid click: redirects to cmo-pay', (res._o.headers.Location || '').includes('/api/cmo-pay?e='));
  // Give fire-and-forget a tick to complete
  await new Promise(r => setTimeout(r, 50));
  check('valid click: Airtable PATCH sent', airtablePatches.length === 1);
  const written = JSON.parse(airtablePatches[0]?.fields?.ClickedSections || '[]');
  check('valid click: section recorded', written.some(c => c.section === 'snapshot'));
  check('valid click: clickedAt stamped', written.some(c => c.clickedAt));
}

// ── 2. Invalid token -> 302 to pricing ──
resetMocks();
{
  const res = mkRes();
  await handler(mkReq({ s: 'snapshot', t: 'garbage.token' }), res);
  check('bad token: 302', res._o.code === 302);
  check('bad token: redirects to pricing', (res._o.headers.Location || '').includes('/ai-cmo-advisor/pricing'));
  check('bad token: no Airtable calls', airtableCalls.length === 0);
}

// ── 3. Missing token -> 302 to pricing ──
resetMocks();
{
  const res = mkRes();
  await handler(mkReq({ s: 'snapshot' }), res);
  check('no token: 302 to pricing', res._o.code === 302 && (res._o.headers.Location || '').includes('/pricing'));
}

// ── 4. Invalid section slug -> 302 to pricing ──
resetMocks();
{
  const token = makeToken('test@acme.com');
  const res = mkRes();
  await handler(mkReq({ s: 'not-a-real-section', t: token }), res);
  check('bad section: 302 to pricing', res._o.code === 302 && (res._o.headers.Location || '').includes('/pricing'));
}

// ── 5. All six valid sections accepted ──
resetMocks();
{
  const token = makeToken('test@acme.com');
  for (const slug of ['snapshot', 'keyword-gap', 'positioning', 'levers', 'roadmap', 'first-move']) {
    const res = mkRes();
    await handler(mkReq({ s: slug, t: token }), res);
    check(`section "${slug}" accepted`, res._o.code === 302 && (res._o.headers.Location || '').includes('/api/cmo-pay'));
  }
}

// ── 6. Airtable failure does not block redirect ──
resetMocks();
{
  const origFetch = global.fetch;
  global.fetch = async (url, opts) => {
    if (String(url).includes('api.airtable.com')) throw new Error('DB down');
    return origFetch(url, opts);
  };
  const token = makeToken('test@acme.com');
  const res = mkRes();
  await handler(mkReq({ s: 'levers', t: token }), res);
  check('airtable fail: still 302 to pay', res._o.code === 302 && (res._o.headers.Location || '').includes('/api/cmo-pay'));
  global.fetch = origFetch;
}

console.log(log.join('\n'));
console.log(pass ? '\nALL PASS' : '\nFAILED');
process.exit(pass ? 0 : 1);
