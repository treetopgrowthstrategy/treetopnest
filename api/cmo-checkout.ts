// Creates a $99 Stripe Checkout session for the AI CMO Starter Report.
// POST { email }  →  { url }  (Stripe-hosted checkout URL)
// The client redirects to `url` immediately.

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
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AI CMO Starter Report',
              description: 'Competitive analysis and 90-day marketing roadmap built on live Ahrefs data and real CMO judgment. Delivered within 24 hours.',
            },
            unit_amount: 9900, // $99.00
          },
          quantity: 1,
        },
      ],
      metadata: {
        email,
        product: 'cmo-starter-report',
        source: 'ai-cmo-advisor',
      },
      success_url: `${SITE}/ai-cmo-advisor/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/ai-cmo-advisor/onboarding?e=${Buffer.from(email).toString('base64url')}&cancelled=1`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('cmo-checkout error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to create checkout session' });
  }
}
