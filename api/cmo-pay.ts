// GET redirect to a $99 Stripe Checkout for a known email. Used by recovery emails
// so a "pay now" link works from any device (no localStorage needed).
// GET /api/cmo-pay?e=<base64url email>  ->  302 to Stripe Checkout

import Stripe from 'stripe';

const SITE = 'https://treetopgrowthstrategy.com';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).end();

  const e = (req.query?.e || '').toString();
  let email = '';
  try { email = Buffer.from(e, 'base64url').toString('utf-8').toLowerCase().trim(); } catch { email = ''; }

  if (!email || !/^[^\s@"]+@[^\s@"]+\.[^\s@"]+$/.test(email)) {
    return res.redirect(302, `${SITE}/ai-cmo-advisor`);
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.redirect(302, `${SITE}/ai-cmo-advisor`);
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [{ price: 'price_1TnlllC5d0nZeO3cVFZwIVhw', quantity: 1 }],
      metadata: { email, product: 'cmo-starter-report', source: 'nurture-recovery' },
      success_url: `${SITE}/ai-cmo-advisor/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${SITE}/ai-cmo-advisor/onboarding?e=${e}&cancelled=1`,
    });
    return res.redirect(302, session.url as string);
  } catch (err) {
    console.error('cmo-pay error:', err);
    return res.redirect(302, `${SITE}/ai-cmo-advisor`);
  }
}
