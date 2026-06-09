// POST /api/voice
// { action: 'check'|'rewrite', content: string, profile?: 'dave'|'brand'|string }
// Checks or rewrites copy against a named or custom voice profile
const OPENAI_KEY = process.env.OPENAI_API_KEY;

function cors(res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
}

const PROFILES = {
  dave: `
Dave Johnson is EVP at ecofit (always lowercase). He writes LinkedIn posts for fitness facility operators.

VOICE RULES:
- Peer-to-peer tone. Industry insider talking to operators, not a vendor pitching.
- Lead with insight or data, never with the product.
- The operator is the hero. Dave is the guide.
- Short paragraphs. One idea per paragraph. LinkedIn-optimized white space.
- No em dashes. Use a period or line break instead.
- No exclamation points.
- No jargon: no "leverage", "synergy", "ecosystem", "robust", "seamless", "journey".
- Numbers and specifics over vague adjectives.
- First person singular ("I", not "we") for LinkedIn posts.
- "ecofit" is always lowercase, even at the start of a sentence.
- Calls to action go at the end, never in the middle.
- No hashtags unless specifically requested.

GOOD EXAMPLES:
"Equipment fault detection that relies on member complaints has a window of weeks. Sometimes months. That window is where operator liability accumulates."
"The cardio zone was running at 58% utilization. The functional area was at 140%. We were about to make the wrong space bigger."

BAD (avoid):
"We're excited to announce our robust partnership!"
"Leverage real-time insights to optimize your facility's performance journey."`,

  brand: `
ecofit is a B2B fitness facility intelligence platform. Always written as "ecofit" — never "EcoFit" or "ECOFIT".

BRAND VOICE RULES:
- The operator is always the hero. ecofit is the guide (StoryBrand framework).
- Lead with outcomes, not features. Operators care about results, not technology.
- Three core pillars: Maximize Your Equipment, Maximize Your Floor, Maximize Your Members.
- No technical jargon in operator-facing copy: no "CCTV", "API", "sensor integration", "IoT".
- Use specific numbers: "5,000+ gyms", dollar figures, utilization percentages.
- Named brand relationships are credibility anchors: EoS Fitness, Planet Fitness, Woodway, Matrix.
- No corporate speak: no "leverage", "ecosystem", "seamless", "best-in-class", "world-class".
- Calls to action are specific: "Book an Assessment", "See your floor", not generic "Learn More".
- Tone is authoritative but not arrogant. Confident, not boastful.
- Never anthropomorphize the platform ("ecofit knows", "ecofit thinks" — avoid).
- Speak to the operator's business problem first, then introduce how ecofit helps.

GOOD EXAMPLES:
"Operators who can see their floor make better decisions. That's the whole idea."
"5,000+ fitness facilities already know what their equipment is doing. Yours can too."

BAD (avoid):
"EcoFit's innovative AI-powered ecosystem seamlessly integrates with your existing infrastructure."
"Leverage our best-in-class sensor technology to optimize your facility's performance journey."`
};

export default async function handler(req, res){
  cors(res);
  if(req.method==="OPTIONS") return res.status(200).end();
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});

  const { action, content, profile='dave', customProfile } = req.body || {};
  if(!action || !content) return res.status(400).json({error:"action and content required"});

  const voiceProfile = customProfile || PROFILES[profile] || PROFILES.dave;
  const isCheck = action === 'check';

  const prompt = isCheck
    ? `${voiceProfile}

Review this copy. Identify specific issues — wrong capitalization, wrong tone, jargon, em dashes, vendor-speak, missing specifics. Be direct and brief.

COPY TO REVIEW:
"${content}"

Respond ONLY with valid JSON:
{"issues": ["issue 1", "issue 2"], "score": "good|needs work|off-brand", "summary": "one line overall verdict"}`

    : `${voiceProfile}

Rewrite this copy applying all voice rules strictly. Keep the same meaning and facts.

ORIGINAL:
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
