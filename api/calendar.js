// GET  /api/calendar          → read all campaigns
// POST /api/calendar          → update one campaign  { recordId, fields }
//                               allowed from the planner's own origin (or an
//                               optional x-calendar-key === CALENDAR_WRITE_KEY)
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const CALENDAR_WRITE_KEY = process.env.CALENDAR_WRITE_KEY;

// Writes are allowed from the planner's own site (no secret needed in the
// public page) or with the optional CALENDAR_WRITE_KEY header. The origin
// check is a speed bump against anonymous bots, not a hard lock.
const ALLOWED_HOSTS = ["treetopgrowthstrategy.com", "localhost", "127.0.0.1"];
function writeAllowed(req) {
  const provided = req.headers["x-calendar-key"];
  if (CALENDAR_WRITE_KEY && provided === CALENDAR_WRITE_KEY) return true;
  const origin = req.headers.origin || req.headers.referer || "";
  try {
    const h = new URL(origin).hostname.toLowerCase();
    return ALLOWED_HOSTS.includes(h) || h.endsWith(".treetopgrowthstrategy.com") || h.endsWith(".vercel.app");
  } catch (e) { return false; }
}
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
      // Writes must come from the planner's own origin (or carry the optional
      // CALENDAR_WRITE_KEY header). No secret lives in the public page.
      if (!writeAllowed(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const body = req.body || {};
      const authHeaders = { Authorization: `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" };
      const tableUrl = `https://api.airtable.com/v0/${BASE}/${CAMPAIGNS}`;

      // ── CREATE one record  { create: { fields } }
      // Used by the planner's "New Campaign" button. typecast lets us pass single-select
      // option names (Planner Month, Audience, Pillar) as plain strings.
      if (body.create && body.create.fields) {
        const r = await fetch(tableUrl, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ records: [{ fields: body.create.fields }], typecast: true })
        });
        const data = await r.json();
        if (!r.ok) { console.error("Airtable CREATE failed:", r.status, data); return res.status(r.status).json({ error: "Create failed" }); }
        return res.status(200).json(data.records ? data.records[0] : data);
      }

      // ── BATCH update  { records: [{ recordId|id, fields }, ...] }
      // One drag reshuffle = one request. Airtable caps batch PATCH at 10, so we chunk.
      if (Array.isArray(body.records)) {
        const recs = body.records
          .map(rc => ({ id: rc.id || rc.recordId, fields: rc.fields }))
          .filter(rc => rc.id && rc.fields);
        if (!recs.length) return res.status(400).json({ error: "records must contain {recordId, fields}" });
        const out = [];
        for (let i = 0; i < recs.length; i += 10) {
          const chunk = recs.slice(i, i + 10);
          const r = await fetch(tableUrl, {
            method: "PATCH",
            headers: authHeaders,
            body: JSON.stringify({ records: chunk, typecast: true })
          });
          const data = await r.json();
          if (!r.ok) { console.error("Airtable batch PATCH failed:", r.status, data); return res.status(r.status).json({ error: "Update failed" }); }
          out.push(...(data.records || []));
        }
        return res.status(200).json({ records: out });
      }

      // ── SINGLE update  { recordId, fields }  (original contract, unchanged)
      const { recordId, fields } = body;
      if (!recordId || !fields) return res.status(400).json({ error: "recordId and fields required" });
      const r = await fetch(`${tableUrl}/${recordId}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ fields, typecast: true })
      });
      if (!r.ok) { console.error("Airtable PATCH failed:", r.status); return res.status(r.status).json({ error: "Update failed" }); }
      const data = await r.json();
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
