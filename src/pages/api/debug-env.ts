export const prerender = false;
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    GITHUB_TOKEN: import.meta.env.GITHUB_TOKEN ? 'SET (length:' + import.meta.env.GITHUB_TOKEN.length + ')' : 'NOT SET',
    GITHUB_REPO:  import.meta.env.GITHUB_REPO  || 'NOT SET',
    RESEND_API_KEY: import.meta.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
    AIRTABLE_API_KEY: import.meta.env.AIRTABLE_API_KEY ? 'SET' : 'NOT SET',
    BILL_NOTIFY_EMAIL: import.meta.env.BILL_NOTIFY_EMAIL || 'NOT SET',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
