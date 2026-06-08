// POST /api/ai-apply
// { cardContent: {field: text}, comment: string }
// Proxies AI edit requests through OpenAI server-side — avoids CORS + keeps key secure
const OPENAI_KEY = process.env.OPENAI_API_KEY;

function cors(res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
}

export default async function handler(req, res){
  cors(res);
  if(req.method==="OPTIONS") return res.status(200).end();
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});

  const { cardContent, comment } = req.body || {};
  if(!cardContent || !comment) return res.status(400).json({error:"cardContent and comment required"});

  const prompt = `You are helping maintain an ecofit content calendar. A reviewer left a comment on a campaign card.

Current card content (JSON):
${JSON.stringify(cardContent, null, 2)}

Reviewer comment: "${comment}"

Rules:
- ecofit is always lowercase — never "EcoFit"
- Only apply NON-MATERIAL changes: wording tweaks, name fixes, minor clarifications, small additions
- Do NOT apply changes that restructure content, add major new sections, or require strategic decisions

If you can apply this change, respond ONLY with valid JSON:
{"canApply":true,"changes":{"field-key":"new text"},"summary":"one line summary of what changed"}

If too material for auto-apply, respond ONLY with valid JSON:
{"canApply":false,"reason":"brief explanation of why this needs human review"}

Respond with JSON only. No markdown, no preamble.`;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await r.json();
    if(!r.ok) return res.status(r.status).json({error: data.error?.message || "OpenAI API error"});

    const text = data.choices?.[0]?.message?.content || "{}";
    let result;
    try { result = JSON.parse(text); }
    catch(e){ return res.status(500).json({error:"Could not parse AI response"}); }

    return res.status(200).json(result);
  } catch(err){
    return res.status(500).json({error: String(err)});
  }
}
