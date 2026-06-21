// Vercel-native serverless function: verify a completed Stripe purchase and
// hand back the buyer's download link. Pairs with api/product-checkout.ts.
//
// GET /api/verify-purchase?session_id=cs_...  ->  { ok: true, download_url }
//
// Note: the download file is a public static asset under /downloads, so this
// gates the thank-you UX rather than the file itself. It confirms the session
// was actually paid before surfacing the link.

import Stripe from 'stripe';

const SITE = 'https://treetopgrowthstrategy.com';

// product key (from checkout-session metadata) -> unguessable download path.
// The file lives under a random token dir and is linked nowhere on the site, so
// it is only revealed here, after a paid Stripe session is confirmed below.
const DOWNLOADS: Record<string, string> = {
  'gym-startup-budget-workbook-pro': '/downloads/_dl-630a982a9e840f3fb2e6155863d1c5f5/gym-startup-budget-workbook-pro-2026-v1.xlsx',
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')     return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not set');
    return res.status(500).json({ error: 'Payments are not configured. Please email bill@treetopgrowthstrategy.com.' });
  }

  try {
    const url = new URL(req.url, SITE);
    const sessionId = url.searchParams.get('session_id');
    if (!sessionId) return res.status(400).json({ error: 'Missing session_id' });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Payment not completed for this session' });
    }

    const product = String(session.metadata?.product || '');
    const path = DOWNLOADS[product] || DOWNLOADS['gym-startup-budget-workbook-pro'];

    return res.status(200).json({ ok: true, download_url: `${SITE}${path}` });
  } catch (err: any) {
    console.error('verify-purchase error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to verify purchase' });
  }
}
