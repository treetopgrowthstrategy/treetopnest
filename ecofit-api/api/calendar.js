// GET  /api/calendar          → read all campaigns
// POST /api/calendar          → update one campaign  { recordId, fields }
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE      = "appkCLcOtOfpYJkRg";
const CAMPAIGNS = "tbl4UpGZP6Zr8MWV9";

function cors(res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res){
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const r = await fetch(`https://api.airtable.com/v0/${BASE}/${CAMPAIGNS}?pageSize=100`, {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json(data);
      const campaigns = (data.records || []).map(rec => ({ recordId: rec.id, ...rec.fields }));
      return res.status(200).json({ campaigns });
    }

    if (req.method === "POST") {
      const { recordId, fields } = req.body || {};
      if (!recordId || !fields) return res.status(400).json({ error: "recordId and fields required" });
      const r = await fetch(`https://api.airtable.com/v0/${BASE}/${CAMPAIGNS}/${recordId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields })
      });
      const data = await r.json();
      return res.status(r.ok ? 200 : r.status).json(data);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
