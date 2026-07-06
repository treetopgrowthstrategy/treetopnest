const RESEND_API_KEY   = process.env.RESEND_API_KEY;
const FROM_EMAIL       = process.env.RESEND_FROM || 'Bill Colbert <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL       = process.env.BILL_NOTIFY_EMAIL || 'william.colbert@treetopgrowthstrategy.com';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = (process.env.AIRTABLE_BASE_ID || 'app0cpbQjtdZh1sHT').split('/')[0];
const AIRTABLE_LEADS_TABLE = process.env.AIRTABLE_LEADS_TABLE || 'tbl7PEKkdYKafCEdC';
const SITE             = 'https://treetopgrowthstrategy.com';

function escape(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]!
  );
}

async function sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set'); return false; }
  const body: Record<string, any> = { from: FROM_EMAIL, to: [to], subject, html };
  if (replyTo) body.reply_to = [replyTo];
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { console.error('Resend error:', res.status, await res.text()); return false; }
  return true;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  const email = (body.email || '').toString().trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const q1 = (body.q1 || '').toString().trim(); // business description
  const q2 = (body.q2 || '').toString().trim(); // revenue range
  const q3 = (body.q3 || '').toString().trim(); // competitors
  const q4 = (body.q4 || '').toString().trim(); // channels (comma-separated)
  const q5 = (body.q5 || '').toString().trim(); // growth goals
  const q6 = (body.q6 || '').toString().trim(); // biggest challenge
  const q7 = (body.q7 || '').toString().trim(); // marketing budget

  if (!q1 || !q3) {
    return res.status(400).json({ error: 'Please complete all required questions' });
  }

  const rows: [string, string][] = [
    ['Business description', q1],
    ['Revenue range', q2 || '(not specified)'],
    ['Competitors', q3],
    ['Channels', q4 || '(not specified)'],
    ['Growth goals', q5 || '(not specified)'],
    ['Biggest challenge', q6 || '(not specified)'],
    ['Marketing budget', q7 || '(not specified)'],
  ];

  const billHtml = `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:28px 24px;color:#1a1a1a;line-height:1.6;">
      <h2 style="margin:0 0 6px;font-size:19px;color:#050D05;">AI CMO onboarding complete</h2>
      <p style="margin:0 0 22px;font-size:14px;color:#555;"><a href="mailto:${escape(email)}" style="color:#00897B;">${escape(email)}</a></p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
        ${rows.map(([k, v], i) => `
          <tr style="background:${i % 2 ? '#fff' : '#f9f9f9'}">
            <td style="padding:9px 12px;font-weight:600;width:190px;border:1px solid #e5e5e5;vertical-align:top;">${escape(k)}</td>
            <td style="padding:9px 12px;color:#333;border:1px solid #e5e5e5;white-space:pre-wrap;">${escape(v)}</td>
          </tr>
        `).join('')}
      </table>
      <p style="font-size:13px;color:#777;margin:0;">Next step: pull Ahrefs data for the competitors listed above and generate the report. Reply to this email to reach the submitter.</p>
    </div>
  `;

  await sendEmail(
    BILL_EMAIL,
    `AI CMO intake complete: ${email}`,
    billHtml,
    email,
  );

  // Confirmation to submitter
  const confirmHtml = `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;padding:36px 28px;color:#1a1a1a;line-height:1.65;">
      <p style="margin:0 0 20px;font-size:15px;">Hi,</p>
      <p style="margin:0 0 20px;font-size:15px;">Your onboarding is complete. We have everything we need to build your AI CMO report.</p>
      <p style="margin:0 0 20px;font-size:15px;">Here is what happens next: the last step is the $99 so we can pull your live competitive data and write the report. Once that is in, it lands in this inbox the same day, usually within the hour.</p>
      <p style="margin:0 0 20px;font-size:15px;">If you have questions or want to add anything before we start, reply to this email and it comes straight to us.</p>
      <p style="margin:24px 0 4px;font-size:14px;color:#1a1a1a;border-top:1px solid #eaeaea;padding-top:20px;">Bill Colbert</p>
      <p style="margin:0;font-size:13px;color:#888;">Founder, Treetop Growth Strategy<br/><a href="${SITE}" style="color:#888;">treetopgrowthstrategy.com</a></p>
    </div>
  `;
  await sendEmail(email, 'Your AI CMO onboarding is complete', confirmHtml, BILL_EMAIL);

  // Upsert to Airtable: update the existing lead record (one record per email),
  // advancing Stage to 'onboarded' and storing the intake answers.
  try {
    if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      const notes = rows.map(([k, v]) => `${k}: ${v}`).join('\n\n');
      const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_LEADS_TABLE}`;
      const auth = { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' };
      const q = encodeURIComponent(`LOWER({Email})="${email}"`);
      const fr = await fetch(`${base}?filterByFormula=${q}&maxRecords=1&sort[0][field]=Created&sort[0][direction]=desc`, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
      const fd: any = fr.ok ? await fr.json() : { records: [] };
      const rec = fd.records?.[0];
      if (rec) {
        await fetch(`${base}/${rec.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ fields: { Stage: 'onboarded', StageSince: new Date().toISOString().slice(0, 10), Notes: notes } }) });
      } else {
        await fetch(base, { method: 'POST', headers: auth, body: JSON.stringify({ fields: {
          Name: email.split('@')[0], Email: email, Source: 'cmo-onboarding', Stage: 'onboarded', StageSince: new Date().toISOString().slice(0, 10), Notes: notes,
        } }) });
      }
    }
  } catch (err) {
    console.error('Airtable upsert error:', err);
  }

  return res.status(200).json({ success: true });
}
