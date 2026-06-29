// Creates a $599/mo Stripe subscription Checkout session for AI CMO Monthly.
// POST { email }  →  { url }  (Stripe-hosted checkout URL)

import Stripe from 'stripe';

const SITE = 'https://treetopgrowthstrategy.com';

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
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: 'price_1Tnm5gC5d0nZeO3cggnQ6XR1',
          quantity: 1,
        },
      ],
      metadata: {
        email,
        product: 'cmo-monthly',
        source: 'ai-cmo-advisor-upgrade',
      },
      success_url: `${SITE}/ai-cmo-advisor/upgrade?success=1&e=${Buffer.from(email).toString('base64url')}`,
      cancel_url:  `${SITE}/ai-cmo-advisor/upgrade?e=${Buffer.from(email).toString('base64url')}`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('cmo-subscribe error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to create subscription checkout' });
  }
}
