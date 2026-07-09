// Creates a Stripe subscription Checkout session for an AI CMO tier.
// POST { email, tier }  ->  { url }  (Stripe-hosted checkout URL)
// tier is one of: monitor ($249/mo), guided ($999/mo), embedded ($2,500/mo).
// Price IDs are read from env vars so new Stripe objects need no code change.

import Stripe from 'stripe';

const SITE = 'https://treetopgrowthstrategy.com';

// tier -> Stripe recurring price ID, sourced from env so they can be set once the
// Stripe products/prices exist without touching this file.
const TIER_PRICE_ENV: Record<string, string> = {
  monitor:  'CMO_PRICE_MONITOR',
  guided:   'CMO_PRICE_GUIDED',
  embedded: 'CMO_PRICE_EMBEDDED',
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not set');
    return res.status(503).json({ error: 'Payment system is not yet configured. Email bill@treetopgrowthstrategy.com to proceed.' });
  }

  let body: any = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  const email = (body.email || '').toString().trim().toLowerCase();
  if (!email || !/^[^\s@"]+@[^\s@"]+\.[^\s@"]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const tier = (body.tier || 'monitor').toString().trim().toLowerCase();
  const priceEnvName = TIER_PRICE_ENV[tier];
  if (!priceEnvName) {
    return res.status(400).json({ error: `Unknown tier "${tier}". Choose monitor, guided, or embedded.` });
  }

  const priceId = process.env[priceEnvName];
  if (!priceId) {
    console.error(`Price env var ${priceEnvName} not set for tier ${tier}`);
    return res.status(503).json({ error: 'This plan is not open for self-serve checkout yet. Email bill@treetopgrowthstrategy.com and we will set you up.' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const e64 = Buffer.from(email).toString('base64url');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        email,
        product: `cmo-${tier}`,
        tier,
        source: 'ai-cmo-advisor-upgrade',
      },
      success_url: `${SITE}/ai-cmo-advisor/upgrade?success=1&tier=${tier}&e=${e64}`,
      cancel_url:  `${SITE}/ai-cmo-advisor/upgrade?tier=${tier}&e=${e64}`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('cmo-subscribe error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to create subscription checkout' });
  }
}
