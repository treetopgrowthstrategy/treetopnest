// Shared spend/abuse guards for the AI CMO public endpoints.
//
// The underscore prefix keeps Vercel from routing this file as an endpoint;
// it is a library imported by the real handlers.
//
// What it provides:
//   - Kill switch: one env var pauses all spend-incurring generation + sends.
//   - Rate limiting: per-IP and per-email daily caps on public submissions.
//   - Global daily budget: a hard ceiling on free reports generated per day.
//   - Disposable-email blocklist.
//   - Email-domain vs website-domain plausibility (used to gate auto-qualify).
//   - Admin-key check for the manual re-run HTTP path.
//   - Throttled ops alert to Bill when a cap trips.
//
// Store: rate/budget counters need atomic cross-invocation state, so they use
// Upstash Redis over its REST API (no npm dependency, just fetch, which also
// lets the test harness mock it). If UPSTASH_REDIS_REST_URL/TOKEN are not set,
// the counter-based guards degrade to no-op and report `store-not-configured`
// so callers can log loudly. Kill switch, disposable, plausibility, and admin
// checks work with no store.
//
// All thresholds read env at call time so they are tunable without redeploy
// and so tests can reconfigure between cases.

// ─── Config helpers ─────────────────────────────────────────────────────────

function intEnv(v: any, dflt: number): number {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) && n >= 0 ? n : dflt;
}

export function storeConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function dayStamp(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

// ─── Upstash Redis REST ─────────────────────────────────────────────────────

async function redis(...parts: string[]): Promise<any> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return { result: null };
  try {
    const path = parts.map(encodeURIComponent).join('/');
    const r = await fetch(`${url.replace(/\/$/, '')}/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) { console.error('Upstash REST error', r.status); return { result: null, _error: true }; }
    return await r.json();
  } catch (err) {
    console.error('Upstash REST fetch failed:', err);
    return { result: null, _error: true };
  }
}

// INCR a key and set a TTL on first touch. Returns the new count, or null if
// the store is not configured / errored (caller treats null as "not enforced").
async function bump(key: string, ttlSeconds = 172800): Promise<number | null> {
  if (!storeConfigured()) return null;
  const res = await redis('incr', key);
  const n = Number(res?.result);
  if (!Number.isFinite(n)) return null;
  if (n === 1) await redis('expire', key, String(ttlSeconds));
  return n;
}

async function peek(key: string): Promise<number> {
  if (!storeConfigured()) return 0;
  const res = await redis('get', key);
  const n = Number(res?.result);
  return Number.isFinite(n) ? n : 0;
}

// ─── Kill switch ────────────────────────────────────────────────────────────

export function killSwitchOn(): boolean {
  const v = (process.env.CMO_KILL_SWITCH || '').toString().trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'on' || v === 'yes';
}

// ─── Disposable email blocklist ─────────────────────────────────────────────

const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', 'sharklasers.com',
  '10minutemail.com', '10minutemail.net', 'tempmail.com', 'temp-mail.org',
  'throwawaymail.com', 'yopmail.com', 'getnada.com', 'nada.email', 'dispostable.com',
  'trashmail.com', 'maildrop.cc', 'mailnesia.com', 'fakeinbox.com', 'tempinbox.com',
  'mytemp.email', 'mohmal.com', 'emailondeck.com', 'spam4.me', 'grr.la', 'guerrillamailblock.com',
  'mailcatch.com', 'inboxkitten.com', 'tempr.email', 'discard.email', 'burnermail.io',
  'moakt.com', 'tmpmail.org', 'tmpmail.net', 'mailtemp.net', 'luxusmail.org',
]);

export function isDisposableEmail(email: string): boolean {
  const d = (email.split('@')[1] || '').toLowerCase().trim();
  return !!d && DISPOSABLE.has(d);
}

// ─── Domain plausibility (email vs submitted website) ───────────────────────
// Returns true only when the person's email domain matches the company website
// they submitted (approx by comparing the registrable domain, last two labels).
// Used to gate AUTO-qualification: a mismatch (e.g. a gmail address claiming a
// Fortune 500 website) should route to human review, not auto-approve spend.

export function emailMatchesWebsite(email: string, website?: string): boolean {
  const ed = (email.split('@')[1] || '').toLowerCase().trim();
  const wd = (website || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
  if (!ed || !wd) return false;
  const registrable = (h: string) => h.split('.').slice(-2).join('.');
  return registrable(ed) === registrable(wd);
}

// ─── Client IP ──────────────────────────────────────────────────────────────

export function clientIp(req: any): string {
  const xff = (req?.headers?.['x-forwarded-for'] || '').toString();
  if (xff) return xff.split(',')[0].trim();
  return (req?.headers?.['x-real-ip'] || req?.socket?.remoteAddress || 'unknown').toString();
}

// ─── Rate limiting ──────────────────────────────────────────────────────────

export interface RateResult {
  ok: boolean;
  reason?: 'ip-rate' | 'email-rate' | 'store-not-configured';
  ipCount?: number;
  emailCount?: number;
  enforced: boolean;
}

// Count one submission against the per-IP and per-email daily caps.
// Call this once per public submission BEFORE any paid work. `bucket` separates
// counters so a legit intake (bucket 's') and its qualify (bucket 'q') from the
// same IP do not double-count against one another.
export async function rateLimitSubmission(ip: string, email: string, bucket = 'q'): Promise<RateResult> {
  if (!storeConfigured()) return { ok: true, reason: 'store-not-configured', enforced: false };
  const day = dayStamp();
  const ipCap = intEnv(process.env.CMO_RATE_PER_IP_DAY, 3);
  const emailCap = intEnv(process.env.CMO_RATE_PER_EMAIL_DAY, 2);
  const ipN = await bump(`cmo:${bucket}:ip:${ip}:${day}`);
  const emN = await bump(`cmo:${bucket}:email:${email}:${day}`);
  if (ipN !== null && ipN > ipCap) return { ok: false, reason: 'ip-rate', ipCount: ipN, enforced: true };
  if (emN !== null && emN > emailCap) return { ok: false, reason: 'email-rate', emailCount: emN, enforced: true };
  return { ok: true, ipCount: ipN ?? undefined, emailCount: emN ?? undefined, enforced: true };
}

// ─── Global daily budget ────────────────────────────────────────────────────

export interface BudgetStatus { ok: boolean; count: number; cap: number; enforced: boolean; }

// Read-only check: is there budget left today? Call BEFORE generating a report.
export async function budgetAvailable(): Promise<BudgetStatus> {
  const cap = intEnv(process.env.CMO_DAILY_BUDGET, 100);
  if (!storeConfigured()) return { ok: true, count: 0, cap, enforced: false };
  const count = await peek(`cmo:budget:${dayStamp()}`);
  return { ok: count < cap, count, cap, enforced: true };
}

// Consume one unit of budget. Call right before the actual spend so that even
// a later-failed send still counts (prevents infinite retry burn). Returns the
// new count, or null when the store is not configured.
export async function consumeBudget(): Promise<number | null> {
  return bump(`cmo:budget:${dayStamp()}`);
}

// ─── Idempotency (check-before / mark-after-success) ────────────────────────
// A processed marker is written only AFTER a unit of work succeeds, so a failed
// attempt never blocks a legitimate reprocess. `enforced:false` means no store
// is configured and the caller should fall back to its own dedupe (e.g. an
// Airtable field marker).

export interface ProcessedResult { seen: boolean; enforced: boolean; }

export async function wasProcessed(key: string): Promise<ProcessedResult> {
  if (!storeConfigured()) return { seen: false, enforced: false };
  const res = await redis('get', key);
  if (res?._error) return { seen: false, enforced: false }; // store errored: do not block delivery
  return { seen: res?.result != null, enforced: true };
}

export async function markProcessed(key: string, ttlSeconds = 2592000): Promise<void> {
  if (!storeConfigured()) return;
  await redis('set', key, '1', 'EX', String(ttlSeconds));
}

// ─── Admin auth for the manual re-run HTTP path ─────────────────────────────
// Denies by default: if CMO_ADMIN_KEY is unset, the manual path is closed.

export function adminAuthorized(req: any): boolean {
  const want = (process.env.CMO_ADMIN_KEY || '').toString();
  if (!want) return false;
  const got = (req?.headers?.['x-cmo-admin-key'] || '').toString();
  return got.length > 0 && got === want;
}

// ─── Ops alert (throttled) ──────────────────────────────────────────────────
// Emails Bill when a cap trips. Throttled to one alert per kind per day when a
// store is available, so a flood does not produce a flood of alerts.

export async function alertOps(kind: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  if (storeConfigured()) {
    const n = await bump(`cmo:alert:${kind}:${dayStamp()}`);
    if (n !== null && n > 1) return; // already alerted for this kind today
  }
  const from = process.env.RESEND_FROM || 'Bill Colbert <bill@treetopgrowthstrategy.com>';
  const to = process.env.BILL_NOTIFY_EMAIL || 'william.colbert@treetopgrowthstrategy.com';
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  }).catch(() => {});
}
