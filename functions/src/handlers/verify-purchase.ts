import Stripe from 'stripe';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return _stripe;
}

const DOWNLOAD_PATHS: Record<string, string> = {
  'gym-startup-budget-workbook-pro': '/downloads/gym-startup-budget-workbook-pro-2026-v1.xlsx',
};

/**
 * Server-side verification that a Stripe checkout session is paid + matches a known
 * product, then returns the download URL. Client calls this from the thank-you page
 * with the session_id from the success_url. Without a valid session_id, no download.
 */
export async function handle(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing session_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'Payment not completed', status: session.payment_status }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const productKey = session.metadata?.product;
    if (!productKey || !DOWNLOAD_PATHS[productKey]) {
      return new Response(
        JSON.stringify({ error: 'Unknown product' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log to Airtable (non-blocking, mirrors lead-capture pattern)
    try {
      const baseId = process.env.AIRTABLE_BASE_ID;
      const apiKey = process.env.AIRTABLE_API_KEY;
      const email = session.customer_details?.email || '';
      const name = session.customer_details?.name || '';
      if (baseId && apiKey && email) {
        await fetch(`https://api.airtable.com/v0/${baseId}/Contacts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: {
              Name: name,
              Email: email,
              Notes: `Purchased: ${productKey} ($${(session.amount_total || 0) / 100})`,
              Source: 'product-purchase',
            },
          }),
        });
      }
    } catch (err) {
      console.error('Airtable log error:', err);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        download_url: DOWNLOAD_PATHS[productKey],
        email: session.customer_details?.email || null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('verify-purchase error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to verify purchase' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
