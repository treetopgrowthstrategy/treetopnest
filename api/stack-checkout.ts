// Vercel-native serverless function: Managed Stack subscription checkout (Stripe).
// Ported from src/pages/api/stack-checkout.ts, which was shadowed by the root
// api/ dir (Astro /api routes 404 in production). Matches the pattern of
// api/quiz-submit.ts, api/lead-capture.ts.
//
// POST { plan }  ->  { url }   (Stripe Checkout Session URL)

import Stripe from 'stripe';

const SITE = 'https://treetopgrowthstrategy.com';

const PLANS: Record<string, { name: string; amount: number; description: string }> = {
  starter: {
    name: 'Managed Stack — Starter',
    amount: 39900,
    description: 'Hosting, domain/SSL, transactional email, form→CRM routing, analytics, uptime monitoring, 2hrs updates/mo',
  },
  growth: {
    name: 'Managed Stack — Growth',
    amount: 59900,
    description: 'Everything in Starter + 4hrs updates/mo, landing pages, lead funnels, GA4/GSC, monthly strategy call',
  },
  scale: {
    name: 'Managed Stack — Scale',
    amount: 79900,
    description: 'Everything in Growth + 8hrs updates/mo, SEO content, email campaigns, bi-weekly calls, dedicated Slack',
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

    const plan = String(body.plan || '');
    const selected = PLANS[plan];
    if (!selected) return res.status(400).json({ error: 'Invalid plan selected' });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin = (req.headers && (req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : ''))) || SITE;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: selected.name, description: selected.description },
            unit_amount: selected.amount,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: { plan, source: 'treetop-managed-stack' },
      subscription_data: { metadata: { plan, source: 'treetop-managed-stack' } },
      success_url: `${origin}/stack?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/stack?checkout=cancelled`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('stack-checkout error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to create checkout session' });
  }
}
