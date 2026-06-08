// POST /api/publish   { recordId }
// Fetches an article from Airtable, generates branded HTML, pushes it to GitHub
// at public/clients/ecofit/{slug}.html, then marks the article Published with its live URL.
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const GITHUB_TOKEN   = process.env.GITHUB_TOKEN;
const BASE     = "appkCLcOtOfpYJkRg";
const ARTICLES = "tblykZHualCHDzbei";
const REPO     = "treetopgrowthstrategy/treetopnest";
const SITE     = "https://treetopgrowthstrategy.com/clients/ecofit";

function cors(res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function articleHTML({ title, author, body }){
  const paras = (body || "").split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g,"<br>")}</p>`).join("\n");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — ecofit</title>
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@600;700;800&family=Work+Sans:wght@300;400;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#14191f;--surface:#1a2130;--border:rgba(255,255,255,0.08);--green:#84BC41;--text:#F2F3F8;--sub:#9699A2;}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);color:var(--text);font-family:'Work Sans',sans-serif;line-height:1.7;}
nav{border-bottom:1px solid var(--border);padding:0 40px;height:60px;display:flex;align-items:center;}
.logo{font-family:'Raleway',sans-serif;font-weight:800;font-size:18px;color:var(--green);}
.wrap{max-width:760px;margin:0 auto;padding:60px 40px 80px;}
h1{font-family:'Raleway',sans-serif;font-weight:800;font-size:2.4rem;line-height:1.1;letter-spacing:-0.03em;margin-bottom:18px;}
.meta{color:var(--sub);font-size:13px;margin-bottom:36px;padding-bottom:24px;border-bottom:1px solid var(--border);}
p{font-size:15px;color:var(--sub);font-weight:300;margin-bottom:22px;}
p strong{color:var(--text);font-weight:600;}
</style></head><body>
<nav><span class="logo">ecofit</span></nav>
<div class="wrap"><h1>${title}</h1><div class="meta">${author || "Dave Johnson, EVP"} · ecofit Networks</div>${paras}</div>
</body></html>`;
}

async function airtableGet(recordId){
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${ARTICLES}/${recordId}`, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }});
  return r.json();
}
async function airtablePatch(recordId, fields){
  await fetch(`https://api.airtable.com/v0/${BASE}/${ARTICLES}/${recordId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields })});
}
async function githubPut(path, contentB64, message){
  // get existing sha if present
  let sha = null;
  const g = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, "User-Agent": "ecofit-publisher" }});
  if (g.ok) { const j = await g.json(); sha = j.sha; }
  const body = { message, content: contentB64 };
  if (sha) body.sha = sha;
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `token ${GITHUB_TOKEN}`, "Content-Type": "application/json", "User-Agent": "ecofit-publisher" },
    body: JSON.stringify(body)});
  return r.json();
}

export default async function handler(req, res){
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { recordId } = req.body || {};
    if (!recordId) return res.status(400).json({ error: "recordId required" });

    const rec = await airtableGet(recordId);
    const f = rec.fields || {};
    const slug = (f.Slug || "").trim();
    if (!slug) return res.status(400).json({ error: "Article has no Slug" });

    const html = articleHTML({ title: f.Title, author: f.Author, body: f.Body });
    const b64  = Buffer.from(html, "utf8").toString("base64");
    const path = `public/clients/ecofit/${slug}.html`;

    const gh = await githubPut(path, b64, `Publish article: ${f.Title}`);
    if (gh.message && !gh.content) return res.status(500).json({ error: "GitHub push failed", detail: gh.message });

    const liveUrl = `${SITE}/${slug}.html`;
    await airtablePatch(recordId, {
      "Status": "Published",
      "Live URL": liveUrl,
      "Published At": new Date().toISOString()
    });

    return res.status(200).json({
      ok: true,
      liveUrl,
      note: "HTML pushed to GitHub. Run the Firebase deploy (or the GitHub Action) to make it live."
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
