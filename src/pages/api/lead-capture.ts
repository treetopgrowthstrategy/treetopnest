import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { first_name, last_name, email, company, team_size, gain, source } = body;

  if (!first_name || !email) {
    return new Response(JSON.stringify({ error: 'first_name and email are required' }), { status: 400 });
  }

  const name = [first_name, last_name].filter(Boolean).join(' ');

  // Send notification email via Resend REST API (no package needed)
  try {
    const apiKey = import.meta.env.RESEND_API_KEY;
    if (apiKey) {
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:24px;">
          <h2 style="color:#050D05;margin-bottom:24px;">New Lead from Treetop Website</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr style="background:#f9f9f9;">
              <td style="padding:10px 14px;font-weight:600;color:#333;width:140px;border:1px solid #e5e5e5;">Name</td>
              <td style="padding:10px 14px;color:#555;border:1px solid #e5e5e5;">${name}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-weight:600;color:#333;border:1px solid #e5e5e5;">Email</td>
              <td style="padding:10px 14px;color:#555;border:1px solid #e5e5e5;">${email}</td>
            </tr>
            <tr style="background:#f9f9f9;">
              <td style="padding:10px 14px;font-weight:600;color:#333;border:1px solid #e5e5e5;">Company</td>
              <td style="padding:10px 14px;color:#555;border:1px solid #e5e5e5;">${company || '—'}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-weight:600;color:#333;border:1px solid #e5e5e5;">Team Size</td>
              <td style="padding:10px 14px;color:#555;border:1px solid #e5e5e5;">${team_size || '—'}</td>
            </tr>
            <tr style="background:#f9f9f9;">
              <td style="padding:10px 14px;font-weight:600;color:#333;border:1px solid #e5e5e5;">What they'd gain</td>
              <td style="padding:10px 14px;color:#555;border:1px solid #e5e5e5;">${gain || '—'}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-weight:600;color:#333;border:1px solid #e5e5e5;">Source</td>
              <td style="padding:10px 14px;color:#555;border:1px solid #e5e5e5;">${source || '—'}</td>
            </tr>
          </table>
          <a href="mailto:${email}?subject=Re: Your inquiry to Treetop Growth Strategy"
             style="display:inline-block;background:#00C853;color:#050D05;padding:12px 24px;text-decoration:none;font-weight:600;font-size:14px;">
            Reply to ${first_name} →
          </a>
        </div>
      `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Treetop Leads <bill@treetopgrowthstrategy.com>',
          to: ['william.colbert@treetopgrowthstrategy.com'],
          subject: `New lead: ${name}${company ? ` — ${company}` : ''} (${source || 'website'})`,
          html,
        }),
      });
    }
  } catch (err) {
    console.error('Resend error:', err);
    // Don't block on email failure
  }

  // Log to Airtable (non-blocking)
  try {
    const baseId = import.meta.env.AIRTABLE_BASE_ID;
    const apiKey = import.meta.env.AIRTABLE_API_KEY;
    if (baseId && apiKey) {
      const notes = [
        team_size && `Team size: ${team_size}`,
        gain && `What they'd gain: ${gain}`,
      ].filter(Boolean).join('\n');

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
            Company: company || '',
            Notes: notes,
            Source: source || '',
          },
        }),
      });
    }
  } catch (err) {
    console.error('Airtable error:', err);
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
