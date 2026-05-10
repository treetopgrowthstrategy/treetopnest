export const prerender = false;

import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-03-25.dahlia',
});

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

export const POST: APIRoute = async ({ request }) => {
  try {
    const { plan } = await request.json();

    if (!plan || !PLANS[plan]) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan selected' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const selected = PLANS[plan];
    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selected.name,
              description: selected.description,
            },
            unit_amount: selected.amount,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan,
        source: 'treetop-managed-stack',
      },
      subscription_data: {
        metadata: {
          plan,
          source: 'treetop-managed-stack',
        },
      },
      success_url: `${origin}/stack?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/stack?checkout=cancelled`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('stack-checkout error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to create checkout session' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
