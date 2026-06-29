// POST /api/claude-proxy
// Server-side relay to the Anthropic Messages API.
//
// Browsers can't call api.anthropic.com directly (CORS, and the key must stay
// server-side), so the Ecofit "Dave voice grader" tool POSTs here instead. We
// attach the secret key, forward the request body to Anthropic verbatim, and
// stream the SSE response straight back to the caller.
//
// Edge runtime: returns `new Response(upstream.body, ...)` so the upstream
// stream passes through untouched — no buffering, true token-by-token SSE.
//
// Auth: ANTHROPIC_API_KEY env var (set in the Vercel project settings).
export const config = { runtime: 'edge' };

const ALLOWED_ORIGIN = 'https://treetopgrowthstrategy.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '3600',
};

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonError('Proxy not configured', 500);
  }

  let upstream;
  try {
    const body = await req.text();
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body,
    });
  } catch (err) {
    return jsonError('Upstream request failed', 502);
  }

  // Stream the upstream body (SSE or JSON) straight back to the caller.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      ...corsHeaders,
      'Content-Type': upstream.headers.get('content-type') || 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
