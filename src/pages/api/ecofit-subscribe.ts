export const prerender = false;

import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-03-25.dahlia',
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Ecofit — Website Management Retainer',
              description: 'Firebase hosting, domain/SSL, HubSpot CRM integration, uptime monitoring, monthly site updates & maintenance',
            },
            unit_amount: 19900,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: {
        client: 'ecofit',
        plan: 'website-management',
        source: 'treetop-managed-stack',
      },
      subscription_data: {
        metadata: {
          client: 'ecofit',
          plan: 'website-management',
          source: 'treetop-managed-stack',
        },
      },
      success_url: `${origin}/ecofit/subscribe?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/ecofit/subscribe?checkout=cancelled`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('ecofit-subscribe error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to create checkout session' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
