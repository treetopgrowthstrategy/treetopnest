// POST /api/voice
// { action: 'check'|'rewrite', content: string }
// Checks or rewrites copy against Dave Johnson's documented voice
const OPENAI_KEY = process.env.OPENAI_API_KEY;

function cors(res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
}

const DAVE_VOICE = `
Dave Johnson is EVP at ecofit (always lowercase — never "EcoFit"), a fitness facility intelligence platform.

VOICE RULES:
- Peer-to-peer tone. Dave writes like an industry insider talking to operators, not a vendor pitching.
- Lead with insight or data, never with the product. The product is mentioned as the enabler, not the hero.
- The operator is the hero. Dave is the guide.
- Short paragraphs. One idea per paragraph. LinkedIn-optimized white space.
- No em dashes. Use a period or line break instead.
- No exclamation points.
- No corporate jargon: no "leverage", "synergy", "ecosystem", "robust", "seamless", "journey".
- Numbers and specifics are good. Vague adjectives are not.
- First person singular ("I", not "we") for LinkedIn posts.
- "ecofit" is always lowercase, even at the start of a sentence.
- Calls to action go at the end, never in the middle.
- No hashtags unless specifically requested.

TONE EXAMPLES (good):
"Equipment fault detection that relies on member complaints has a window of weeks. Sometimes months. That window is where operator liability accumulates."
"The cardio zone was running at 58% utilization. The functional area was at 140%. We were about to make the wrong space bigger."

TONE EXAMPLES (bad — avoid):
"We're excited to announce our robust partnership!"
"Leverage real-time insights to optimize your facility's performance journey."
`;

export default async function handler(req, res){
  cors(res);
  if(req.method==="OPTIONS") return res.status(200).end();
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});

  const { action, content } = req.body || {};
  if(!action || !content) return res.status(400).json({error:"action and content required"});

  const isCheck = action === 'check';

  const prompt = isCheck
    ? `${DAVE_VOICE}

Review this copy for Dave Johnson's voice. Identify specific issues — wrong capitalization, wrong tone, jargon, em dashes, vendor-speak, missing specifics. Be direct and brief.

COPY TO REVIEW:
"${content}"

Respond ONLY with valid JSON:
{"issues": ["issue 1", "issue 2"], "score": "good|needs work|off-brand", "summary": "one line overall verdict"}`

    : `${DAVE_VOICE}

Rewrite this copy in Dave Johnson's voice. Keep the same meaning and facts. Apply all voice rules strictly.

ORIGINAL COPY:
"${content}"

Respond ONLY with valid JSON:
{"rewritten": "the rewritten copy", "changes": ["what changed 1", "what changed 2"]}`;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${OPENAI_KEY}`},
      body: JSON.stringify({
        model:"gpt-4o-mini",
        max_tokens:800,
        response_format:{type:"json_object"},
        messages:[{role:"user",content:prompt}]
      })
    });
    const data = await r.json();
    if(!r.ok) return res.status(r.status).json({error:data.error?.message||"OpenAI error"});
    let result;
    try { result = JSON.parse(data.choices?.[0]?.message?.content||"{}"); }
    catch(e){ return res.status(500).json({error:"Could not parse response"}); }
    return res.status(200).json(result);
  } catch(err){
    return res.status(500).json({error:String(err)});
  }
}
