// api/transcript.js
// CMO Nest backend. Two modes:
//   mode: "extract"        -> transcript text in, structured items out
//   mode: "weekly_email"   -> items in, email subject + body out
// Both modes use gpt-4o-mini.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured on Vercel' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  try {
    const mode = body.mode || 'extract';

    if (mode === 'extract') {
      const text = body.text;
      const callDate = body.callDate;
      if (!text || typeof text !== 'string' || text.trim().length < 20) {
        return res.status(400).json({ error: 'Transcript text is required (minimum 20 characters)' });
      }
      const result = await extractFromTranscript(apiKey, text, callDate);
      return res.status(200).json(result);
    }

    if (mode === 'weekly_email') {
      const items = body.items;
      const dateRange = body.dateRange;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'items array is required' });
      }
      const result = await generateWeeklyEmail(apiKey, items, dateRange);
      return res.status(200).json(result);
    }

    return res.status(400).json({ error: 'Invalid mode. Use "extract" or "weekly_email".' });
  } catch (err) {
    console.error('CMO Nest error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

function stripDashes(s) {
  if (typeof s !== 'string') return s;
  // Replace em dash and en dash with comma + space. Per Bill's standing rule.
  return s.replace(/\u2014/g, ', ').replace(/\u2013/g, ', ');
}

function cleanItemArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(i => ({
      text: stripDashes((i && i.text) ? String(i.text).trim() : ''),
      owner: normalizeOwner(i && i.owner)
    }))
    .filter(i => i.text.length > 0);
}

function normalizeOwner(o) {
  if (!o) return 'Bill';
  const s = String(o).trim().toLowerCase();
  if (s.startsWith('bill') || s.includes('colbert')) return 'Bill';
  if (s.startsWith('dave') || s.includes('johnson')) return 'Dave';
  if (s.startsWith('phil') || s.includes('rankine')) return 'Phil';
  if (s === 'both' || s === 'shared' || s.includes('and')) return 'Both';
  return 'Bill';
}

async function extractFromTranscript(apiKey, text, callDate) {
  const trimmed = text.length > 30000 ? text.slice(0, 30000) : text;

  const systemPrompt = [
    'You analyze meeting transcripts between Bill Colbert (fractional CMO at Treetop Growth Strategy) and Dave Johnson (EVP of ecofit). Phil Rankine, co-founder of ecofit, may also appear.',
    '',
    'Your job: extract a clean, scannable record of what was agreed, what was decided, and what is still open. Always identify who owns each item.',
    '',
    'Rules:',
    '1. "Owner" must be exactly one of: "Bill", "Dave", "Phil", or "Both".',
    '2. Next steps are concrete forward actions someone committed to.',
    '3. Decisions are things settled in the call (a direction chosen, an option ruled out, a number agreed).',
    '4. Open questions are things explicitly left unresolved.',
    '5. Be concise. Each item is one short factual sentence. No filler.',
    '6. Never use em dashes or en dashes in any output. Use periods, commas, colons, or parentheses.',
    '7. Do not invent items. If a category has nothing, return an empty array.',
    '8. Headline is a 6 to 10 word factual summary of the call main thread.',
    '9. Summary is 2 to 3 sentences. No marketing tone. Just what happened.',
    '',
    'Return ONLY valid JSON, no markdown fences, no commentary. Shape:',
    '{',
    '  "headline": "string",',
    '  "summary": "string",',
    '  "next_steps": [{ "text": "string", "owner": "Bill|Dave|Phil|Both" }],',
    '  "decisions": [{ "text": "string", "owner": "Bill|Dave|Phil|Both" }],',
    '  "open_questions": [{ "text": "string", "owner": "Bill|Dave|Phil|Both" }]',
    '}'
  ].join('\n');

  const userPrompt = `Call date: ${callDate || 'unspecified'}\n\nTranscript:\n${trimmed}`;

  const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!apiRes.ok) {
    const errText = await apiRes.text();
    throw new Error(`OpenAI returned ${apiRes.status}: ${errText.slice(0, 400)}`);
  }

  const data = await apiRes.json();
  const content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '{}';

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error('Model returned invalid JSON');
  }

  return {
    headline: stripDashes(parsed.headline || 'Call notes'),
    summary: stripDashes(parsed.summary || ''),
    next_steps: cleanItemArray(parsed.next_steps),
    decisions: cleanItemArray(parsed.decisions),
    open_questions: cleanItemArray(parsed.open_questions)
  };
}

async function generateWeeklyEmail(apiKey, items, dateRange) {
  const systemPrompt = [
    'You write a weekly update email from Bill Colbert (fractional CMO at Treetop Growth Strategy) to Dave Johnson (EVP of ecofit).',
    '',
    'Bill voice rules:',
    '1. Direct, factual, concise. No fluff.',
    '2. Never use the phrases: "excited to announce", "leverage", "synergy", "best-in-class", "circle back", "touch base", "let me know your thoughts".',
    '3. Never use em dashes or en dashes anywhere. Use periods, commas, colons, or parentheses.',
    '4. Short paragraphs. Tight bullets when listing items. Lowercase first word inside bullets is fine.',
    '5. No vendor-status-report tone. Two operators who talk often.',
    '',
    'Structure the email this way:',
    '- One line greeting ("Dave," is fine).',
    '- One line framing what window this covers.',
    '- "What I shipped" section with bullets of Bill items moved to Done.',
    '- "In motion" section with bullets of Bill items moved to In Progress.',
    '- "On your side" section ONLY if there are Dave-owned items in scope (note status).',
    '- "Open question for you" section ONLY if there are open_question items in scope.',
    '- Closing: short, like "More Monday." or "Talk Tuesday." then "Bill" on its own line.',
    '',
    'Skip any section that would be empty. Do not pad.',
    '',
    'Return ONLY valid JSON: { "subject": "string", "body": "string" }',
    'The body uses literal \\n for line breaks. Plain text only. No markdown. No em dashes.'
  ].join('\n');

  const itemSummary = items.length === 0
    ? '(no items)'
    : items.map(i => {
        const type = i.type || 'next_step';
        const status = i.status || 'open';
        const owner = i.owner || 'Bill';
        const callDate = i.call_date || 'undated call';
        return `- type=${type} status=${status} owner=${owner} (from ${callDate}): ${i.text}`;
      }).join('\n');

  const userPrompt = `Period covered: ${dateRange || 'since last update'}\n\nItems in scope (${items.length} total):\n${itemSummary}\n\nWrite the weekly update email.`;

  const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!apiRes.ok) {
    const errText = await apiRes.text();
    throw new Error(`OpenAI returned ${apiRes.status}: ${errText.slice(0, 400)}`);
  }

  const data = await apiRes.json();
  const content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '{}';
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error('Model returned invalid JSON for email');
  }

  return {
    subject: stripDashes(parsed.subject || 'Weekly update'),
    body: stripDashes(parsed.body || '')
  };
}
