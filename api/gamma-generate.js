// Gamma handoff for the ecofit Content Planner.
//
//   GET  /api/gamma-generate?probe=1   -> { enabled: bool }   (does a key exist?)
//   GET  /api/gamma-generate?id=<gen>  -> { status, gammaUrl } (poll a generation)
//   POST /api/gamma-generate           -> { generationId, status, gammaUrl? }
//                                         body: { title, inputText }
//
// If GAMMA_API_KEY is not configured we fail loud with 501 so the client falls
// back to its always-working Markdown export. We never fail silently.
const GAMMA_API_KEY = process.env.GAMMA_API_KEY;
const GAMMA_BASE = "https://public-api.gamma.app/v0.2/generations";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getStatus(id) {
  const r = await fetch(`${GAMMA_BASE}/${id}`, {
    headers: { "X-API-KEY": GAMMA_API_KEY, accept: "application/json" }
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ── Config probe: lets the UI show the right path before the user clicks.
    if (req.method === "GET" && req.query && req.query.probe !== undefined) {
      return res.status(200).json({ enabled: !!GAMMA_API_KEY });
    }

    // ── Poll an in-flight generation.
    if (req.method === "GET" && req.query && req.query.id) {
      if (!GAMMA_API_KEY) return res.status(501).json({ error: "no_key" });
      const { ok, status, data } = await getStatus(req.query.id);
      if (!ok) return res.status(status).json({ error: "status_failed", detail: data });
      return res.status(200).json({
        status: data.status,
        gammaUrl: data.gammaUrl || data.url || null
      });
    }

    if (req.method === "POST") {
      if (!GAMMA_API_KEY) {
        return res.status(501).json({
          error: "no_key",
          message: "GAMMA_API_KEY is not configured. Use the Markdown export, or add the key in Vercel and redeploy."
        });
      }
      const { title, inputText } = req.body || {};
      if (!inputText) return res.status(400).json({ error: "inputText required" });

      const createRes = await fetch(GAMMA_BASE, {
        method: "POST",
        headers: { "X-API-KEY": GAMMA_API_KEY, "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          inputText,
          textMode: "preserve",
          format: "presentation",
          additionalInstructions: title ? `Title the deck: ${title}` : undefined
        })
      });
      const created = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        console.error("Gamma create failed:", createRes.status, created);
        return res.status(createRes.status).json({ error: "create_failed", detail: created });
      }
      const generationId = created.generationId || created.id;

      // Short server-side poll. If it is not ready in a few seconds, hand the id
      // back and let the client keep polling via GET ?id=.
      for (let i = 0; i < 4; i++) {
        await sleep(1800);
        const { ok, data } = await getStatus(generationId);
        if (ok && data.status === "completed") {
          return res.status(200).json({ generationId, status: "completed", gammaUrl: data.gammaUrl || data.url || null });
        }
        if (ok && data.status === "failed") {
          return res.status(200).json({ generationId, status: "failed" });
        }
      }
      return res.status(200).json({ generationId, status: "pending" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
