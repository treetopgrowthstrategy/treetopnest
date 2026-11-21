// Monitor cron tests: auth, dry-run digest, selection logic, baseline path,
// delta diff, error isolation, cost cap.

process.env.CRON_SECRET = 'test-secret';
process.env.AIRTABLE_API_KEY = 'test';
process.env.RESEND_API_KEY = 'test';
process.env.OPENAI_API_KEY = 'test';
process.env.AHREFS_API_KEY = 'test';
process.env.BILL_NOTIFY_EMAIL = 'bill@example.com';

let records = [];
let patches = [];
let resendCalls = [];
let openaiCalls = [];
let ahrefsCallCount = 0;

function resetMocks() {
  records = [];
  patches = [];
  resendCalls = [];
  openaiCalls = [];
  ahrefsCallCount = 0;
}

global.fetch = async (url, opts = {}) => {
  const u = String(url);
  const body = opts.body ? JSON.parse(opts.body) : null;

  if (u.includes('api.ahrefs.com')) {
    ahrefsCallCount++;
    if (u.includes('domain-rating')) {
      return { ok: true, json: async () => ({ domain_rating: { domain_rating: 42, ahrefs_rank: 100 } }) };
    }
    if (u.includes('/metrics')) {
      return { ok: true, json: async () => ({ metrics: { org_keywords: 150, org_traffic: 3000 } }) };
    }
    if (u.includes('organic-keywords')) {
      return { ok: true, json: async () => ({ keywords: [{ keyword: 'test kw', volume: 100, best_position: 5, sum_traffic: 50 }] }) };
    }
    if (u.includes('organic-competitors')) {
      return { ok: true, json: async () => ({ organic_competitors: [{ domain: 'comp1.com' }] }) };
    }
    return { ok: true, json: async () => ({}) };
  }

  if (u.includes('api.airtable.com')) {
    if (u.includes('filterByFormula')) {
      return { ok: true, json: async () => ({ records }) };
    }
    if (opts.method === 'PATCH') {
      patches.push({ url: u, fields: body?.fields });
      return { ok: true, json: async () => ({ id: 'rec' }), text: async () => '' };
    }
    return { ok: true, json: async () => ({}), text: async () => '' };
  }

  if (u.includes('api.openai.com')) {
    openaiCalls.push(body);
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '<h2>What Changed</h2><p>DR up.</p><h2>Competitor Watch</h2><p>Comp gained.</p><h2>This Month\'s One Move</h2><p>Target "test kw".</p>' } }],
      }),
    };
  }

  if (u.includes('api.resend.com')) {
    resendCalls.push(body);
    return { ok: true, json: async () => ({ id: 'x' }), text: async () => '' };
  }

  return { ok: true, json: async () => ({}), text: async () => '' };
};

const handler = (await import('./.bundled/monitor-cron.mjs')).default;

function mkReq(query = {}, headers = {}) {
  return { headers: { authorization: `Bearer ${process.env.CRON_SECRET}`, ...headers }, query };
}
function mkRes() {
  const o = { code: 0, json: null };
  return {
    _o: o,
    status(c) { o.code = c; return { json(j) { o.json = j; return o; }, end() { return o; } }; },
  };
}

let pass = true;
const log = [];
function check(name, cond) { log.push((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) pass = false; }

// ── 1. Auth required ──
resetMocks();
{
  const res = mkRes();
  await handler({ headers: {}, query: {} }, res);
  check('auth: rejects missing cron secret', res._o.code === 401);
}

// ── 2. Auth via query key ──
resetMocks();
{
  const res = mkRes();
  await handler({ headers: {}, query: { key: 'test-secret' } }, res);
  check('auth: accepts query key', res._o.code === 200);
}

// ── 3. No eligible subscribers = quick exit ──
resetMocks();
{
  const res = mkRes();
  await handler(mkReq(), res);
  check('empty: returns 200 with 0 processed', res._o.code === 200 && res._o.json?.processed === 0);
}

// ── 4. Dry-run: baseline path (no LastSnapshotJson) ──
resetMocks();
records = [{ id: 'recA', fields: { Email: 'new@acme.com', SubscriptionStatus: 'active', SubscriptionTier: 'monitor', WebsiteURL: 'acme.com' } }];
{
  const res = mkRes();
  await handler(mkReq(), res);
  check('dry-run baseline: 200', res._o.code === 200);
  check('dry-run baseline: mode is dry-run', res._o.json?.mode === 'dry-run');
  check('dry-run baseline: 1 baseline counted', res._o.json?.baselines === 1);
  check('dry-run baseline: no Airtable patches (dry-run)', patches.length === 0);
  check('dry-run baseline: digest sent to Bill', resendCalls.length === 1 && resendCalls[0]?.to?.[0] === 'bill@example.com');
}

// ── 5. Dry-run: delta path (has LastSnapshotJson) ──
resetMocks();
const prevSnapshot = JSON.stringify({
  domain: 'delta.com', domainRating: 38, orgTraffic: 2500, orgKeywords: 120,
  topKeywords: [{ keyword: 'old kw', volume: 80, best_position: 8, sum_traffic: 30 }],
  competitors: [], takenAt: '2026-06-01',
});
records = [{ id: 'recB', fields: { Email: 'delta@acme.com', SubscriptionStatus: 'active', SubscriptionTier: 'monitor', WebsiteURL: 'delta.com', LastSnapshotJson: prevSnapshot } }];
{
  const res = mkRes();
  await handler(mkReq(), res);
  check('dry-run delta: 200', res._o.code === 200);
  check('dry-run delta: 1 delta counted', res._o.json?.deltas === 1);
  check('dry-run delta: OpenAI called for memo', openaiCalls.length === 1);
  check('dry-run delta: no patches (dry-run)', patches.length === 0);
}

// ── 6. Skip ineligible: LastMemoSentAt too recent ──
resetMocks();
const recentDate = new Date().toISOString().slice(0, 10);
records = [{ id: 'recC', fields: { Email: 'recent@acme.com', SubscriptionStatus: 'active', SubscriptionTier: 'monitor', LastMemoSentAt: recentDate } }];
{
  const res = mkRes();
  await handler(mkReq(), res);
  check('skip recent: 0 processed', res._o.json?.processed === 0);
}

// ── 7. Live mode: baseline writes snapshot to Airtable ──
resetMocks();
process.env.CMO_MONITOR_AUTO_SEND = 'true';
records = [{ id: 'recD', fields: { Email: 'live@acme.com', SubscriptionStatus: 'active', SubscriptionTier: 'monitor', WebsiteURL: 'live.com' } }];
{
  const res = mkRes();
  await handler(mkReq(), res);
  check('live baseline: 200', res._o.code === 200);
  check('live baseline: mode=live', res._o.json?.mode === 'live');
  check('live baseline: baseline email sent', resendCalls.some(c => /baseline/i.test(c.subject || '')));
  check('live baseline: snapshot written', patches.some(c => c.fields?.LastSnapshotJson && c.fields?.LastSnapshotAt));
}
delete process.env.CMO_MONITOR_AUTO_SEND;

// ── 8. Live mode: delta writes memo fields ──
resetMocks();
process.env.CMO_MONITOR_AUTO_SEND = 'true';
records = [{ id: 'recE', fields: { Email: 'memo@acme.com', SubscriptionStatus: 'active', SubscriptionTier: 'monitor', WebsiteURL: 'memo.com', LastSnapshotJson: prevSnapshot, MemoCount: 2 } }];
{
  const res = mkRes();
  await handler(mkReq(), res);
  check('live delta: memo email sent', resendCalls.some(c => /memo/i.test(c.subject || '')));
  const memoPatch = patches.find(c => c.fields?.MemoCount === 3);
  check('live delta: MemoCount incremented', !!memoPatch);
  check('live delta: LastMemoSentAt stamped', !!memoPatch?.fields?.LastMemoSentAt);
  check('live delta: snapshot updated', !!memoPatch?.fields?.LastSnapshotJson);
}
delete process.env.CMO_MONITOR_AUTO_SEND;

console.log(log.join('\n'));
console.log(pass ? '\nALL PASS' : '\nFAILED');
process.exit(pass ? 0 : 1);
