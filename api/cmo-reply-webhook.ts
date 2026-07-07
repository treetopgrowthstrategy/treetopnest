// Fires on email.received from Resend when someone replies to their AI CMO report.
// 1. Verifies the Resend webhook signature  2. Fetches the full inbound email
// 3. Looks up the customer's onboarding answers + last report in Airtable
// 4. Generates a reply in Bill's voice, grounded in their real context
// 5. Gated by CMO_REPLY_AUTO_SEND: dry-run sends the draft to Bill for review,
//    live mode sends directly to the customer (reply-to Bill's real inbox, bcc Bill).

import { Resend } from 'resend';

const RESEND_API_KEY       = process.env.RESEND_API_KEY       || '';
const RESEND_REPLY_WEBHOOK_SECRET = process.env.RESEND_REPLY_WEBHOOK_SECRET || '';
const OPENAI_API_KEY       = process.env.OPENAI_API_KEY       || '';
const AIRTABLE_API_KEY     = process.env.AIRTABLE_API_KEY     || '';
const AIRTABLE_BASE_ID     = (process.env.AIRTABLE_BASE_ID    || 'app0cpbQjtdZh1sHT').split('/')[0];
const AIRTABLE_TABLE       = process.env.AIRTABLE_LEADS_TABLE || 'tbl7PEKkdYKafCEdC';
const FROM_EMAIL           = process.env.RESEND_FROM          || 'Bill Colbert <bill@treetopgrowthstrategy.com>';
const BILL_EMAIL           = process.env.BILL_NOTIFY_EMAIL    || 'william.colbert@treetopgrowthstrategy.com';
const AUTO_SEND            = process.env.CMO_REPLY_AUTO_SEND === 'true';

const resend = new Resend(RESEND_API_KEY);

function rawBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end',  () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function looksLikeAutoReply(headers: Record<string, string> | undefined, fromAddress: string, subject: string): boolean {
  const autoSubmitted = headers?.['auto-submitted'] || headers?.['Auto-Submitted'];
  if (autoSubmitted && autoSubmitted.toLowerCase() !== 'no') return true;
  const f = fromAddress.toLowerCase();
  if (f.includes('mailer-daemon') || f.includes('postmaster') || f.includes('noreply') || f.includes('no-reply')) return true;
  const s = subject.toLowerCase();
  if (s.includes('out of office') || s.includes('automatic reply') || s.includes('undeliverable') || s.includes('delivery status notification')) return true;
  return false;
}

async function fetchCustomerContext(email: string): Promise<{ notes: string; lastReport: string } | null> {
  if (!AIRTABLE_API_KEY) return null;
  const formula = encodeURIComponent(`LOWER({Email})="${String(email).toLowerCase().replace(/"/g, '')}"`);
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}?filterByFormula=${formula}&maxRecords=1`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
  if (!r.ok) { console.error('Airtable lookup failed', r.status); return null; }
  const data: any = await r.json();
  const record = data.records?.[0];
  if (!record) return null;
  return { notes: record.fields?.Notes || '', lastReport: record.fields?.['Last Report'] || '' };
}

async function generateReply(customerEmail: string, question: string, notes: string, lastReport: string): Promise<string> {
  if (!OPENAI_API_KEY) return '';

  const prompt = `You are Bill Colbert, founder of Treetop Growth Strategy and a fractional CMO. A customer who bought your $99 AI CMO Starter Report just replied to that report email with a question or comment. Write the email reply you would actually send.

CUSTOMER'S ONBOARDING ANSWERS:
${notes || '(not available)'}

THEIR MOST RECENT REPORT (for context, do not repeat it back to them):
${lastReport ? lastReport.replace(/<[^>]+>/g, ' ').slice(0, 4000) : '(no report on file)'}

THEIR REPLY / QUESTION:
${question}

OUTPUT: Plain text, formatted as a real email reply. Not a report. Not sectioned with headers. Just how a busy, direct, senior operator actually replies to email: short paragraphs, answers the specific question asked, references their real situation and report when relevant. If they just said thanks or something with no real question, reply naturally and briefly, do not force analysis where none is needed.

HARD CONSTRAINTS:
- NO em dashes anywhere
- Do not sign off with a formal signature block. End the way a real person ends a quick email (a short line, first name only, no title, no company name repeated)
- 60 to 220 words depending on what the question actually calls for
- Be specific to their situation. Never generic advice that could apply to anyone.`;

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!r.ok) {
    console.error('OpenAI reply generation failed:', r.status, await r.text());
    return '';
  }

  const result: any = await r.json();
  return result.choices?.[0]?.message?.content || '';
}

async function sendEmail(to: string, subject: string, text: string, replyTo?: string, bcc?: string): Promise<void> {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set'); return; }
  const payload: Record<string, any> = { from: FROM_EMAIL, to: [to], subject, text };
  if (replyTo) payload.reply_to = [replyTo];
  if (bcc) payload.bcc = [bcc];
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) console.error('Resend send error:', r.status, await r.text());
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = await rawBody(req);

  if (!RESEND_REPLY_WEBHOOK_SECRET) {
    console.error('RESEND_REPLY_WEBHOOK_SECRET not configured');
    return res.status(500).end();
  }

  let event: any;
  try {
    event = resend.webhooks.verify({
      payload: body,
      headers: {
        id: req.headers['svix-id'] || '',
        timestamp: req.headers['svix-timestamp'] || '',
        signature: req.headers['svix-signature'] || '',
      },
      webhookSecret: RESEND_REPLY_WEBHOOK_SECRET,
    });
  } catch (err: any) {
    console.error('Resend webhook signature verification failed:', err.message);
    return res.status(400).send('Webhook signature verification failed');
  }

  if (event.type !== 'email.received') {
    return res.status(200).json({ received: true });
  }

  const emailId = event.data?.email_id;
  if (!emailId) return res.status(200).json({ received: true });

  try {
    const receivedRes = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    });
    if (!receivedRes.ok) {
      console.error('Failed to retrieve received email:', receivedRes.status, await receivedRes.text());
      return res.status(200).json({ received: true });
    }
    const full: any = await receivedRes.json();

    const fromAddress = (full.from || '').toLowerCase().trim();
    const subject = full.subject || '';
    const questionText = (full.text || '').trim();

    if (looksLikeAutoReply(full.headers, fromAddress, subject)) {
      console.log(`Skipping likely auto-reply from ${fromAddress}`);
      return res.status(200).json({ received: true });
    }

    if (!questionText) {
      return res.status(200).json({ received: true });
    }

    const context = await fetchCustomerContext(fromAddress);

    if (!context) {
      // Unrecognized sender: hand off to Bill rather than guess at a response
      await sendEmail(
        BILL_EMAIL,
        `Unrecognized reply to AI CMO from ${fromAddress}`,
        `Got a reply from ${fromAddress} that doesn't match an AI CMO customer record. Handle manually.\n\nSubject: ${subject}\n\n${questionText}`,
      );
      return res.status(200).json({ received: true });
    }

    const reply = await generateReply(fromAddress, questionText, context.notes, context.lastReport);
    if (!reply) {
      await sendEmail(
        BILL_EMAIL,
        `ACTION NEEDED: could not generate reply for ${fromAddress}`,
        `Reply generation failed for a message from ${fromAddress}. Please respond manually.\n\nSubject: ${subject}\n\n${questionText}`,
      );
      return res.status(200).json({ received: true });
    }

    if (AUTO_SEND) {
      await sendEmail(fromAddress, `Re: ${subject}`, reply, BILL_EMAIL, BILL_EMAIL);
      console.log(`Auto-sent reply to ${fromAddress}`);
    } else {
      await sendEmail(
        BILL_EMAIL,
        `DRAFT reply for ${fromAddress} (review, not sent)`,
        `CMO_REPLY_AUTO_SEND is off, so this was not sent. Copy/send manually if it looks right.\n\nTHEIR MESSAGE:\n${questionText}\n\n---\n\nDRAFTED REPLY:\n${reply}`,
        fromAddress,
      );
      console.log(`Drafted reply for ${fromAddress}, sent to Bill for review`);
    }
  } catch (err) {
    console.error('Reply webhook error:', err);
  }

  return res.status(200).json({ received: true });
}
