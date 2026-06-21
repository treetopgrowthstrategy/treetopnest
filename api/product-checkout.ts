// Vercel-native serverless function: one-time product checkout (Stripe).
// Placed in root api/ (not src/pages/api/) because Astro's Vercel adapter
// conflicts with the root api/ functions and the Astro /api routes 404 in
// production. Matches the pattern of api/quiz-submit.ts, api/lead-capture.ts.
//
// POST { product }  ->  { url }   (Stripe Checkout Session URL)

import Stripe from 'stripe';

const SITE = 'https://treetopgrowthstrategy.com';

interface ProductSpec {
  name: string;
  description: string;
  amount: number; // cents
  download: string; // path under SITE served from public/downloads
}

// One-time digital products. The `download` path is also used by
// /api/verify-purchase to hand the buyer their file after payment.
const PRODUCTS: Record<string, ProductSpec> = {
  'gym-startup-budget-workbook-pro': {
    name: 'Gym Startup Budget Workbook — PRO Edition',
    description: 'Interactive editable XLSX. 12 sheets, live formulas, scenario toggles, format presets, capital-stack builder, sensitivity tables.',
    amount: 9900,
    download: '/downloads/gym-startup-budget-workbook-pro-2026-v1.xlsx',
  },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not set');
    return res.status(500).json({ error: 'Payments are not configured. Please email bill@treetopgrowthstrategy.com.' });
  }

  try {
    let body: any = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    if (!body || typeof body !== 'object') body = {};

    const product = String(body.product || '');
    const spec = PRODUCTS[product];
    if (!spec) return res.status(400).json({ error: 'Invalid product selected' });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin = (req.headers && (req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : ''))) || SITE;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: spec.name, description: spec.description },
            unit_amount: spec.amount,
          },
          quantity: 1,
        },
      ],
      metadata: { product, source: 'treetop-product' },
      success_url: `${origin}/gym-startup-budget-workbook-pro/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/gym-startup-budget-workbook-pro?checkout=cancelled`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('product-checkout error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to create checkout session' });
  }
}
