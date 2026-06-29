import crypto from 'node:crypto';

const SITE          = 'https://treetopgrowthstrategy.com';
const TOKEN_SECRET  = process.env.CMO_TOKEN_SECRET || 'cmo-dev-secret-change-me';
const MAX_AGE_MS    = 24 * 60 * 60 * 1000;

function makeToken(email: string, ts: number): string {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(`${email}:${ts}`).digest('hex');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).end();

  const { e, t, s } = req.query as Record<string, string>;

  if (!e || !t || !s) {
    return res.redirect(302, `${SITE}/ai-cmo-advisor?err=invalid-link`);
  }

  let email: string;
  try {
    email = Buffer.from(e, 'base64url').toString('utf-8');
  } catch {
    return res.redirect(302, `${SITE}/ai-cmo-advisor?err=invalid-link`);
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.redirect(302, `${SITE}/ai-cmo-advisor?err=invalid-link`);
  }

  const ts = Number(t);
  if (!ts || isNaN(ts) || Date.now() - ts > MAX_AGE_MS) {
    return res.redirect(302, `${SITE}/ai-cmo-advisor?err=link-expired`);
  }

  const expected = makeToken(email, ts);
  let valid = false;
  try {
    if (s.length === 64 && expected.length === 64) {
      valid = crypto.timingSafeEqual(Buffer.from(s, 'hex'), Buffer.from(expected, 'hex'));
    }
  } catch {
    valid = false;
  }

  if (!valid) {
    return res.redirect(302, `${SITE}/ai-cmo-advisor?err=invalid-token`);
  }

  const encoded = Buffer.from(email).toString('base64url');
  return res.redirect(302, `${SITE}/ai-cmo-advisor/onboarding?e=${encoded}`);
}
