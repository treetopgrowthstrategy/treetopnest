// POST /api/preview
// { cardId, campaignTitle, date, postCopy, author?, authorTitle? }
// Generates a LinkedIn-style preview HTML page and pushes it to GitHub
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "treetopgrowthstrategy/treetopnest";
const SITE = "https://treetopgrowthstrategy.com";

function cors(res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
}

function buildPreviewHTML({ cardId, campaignTitle, date, postCopy, author, authorTitle }){
  const displayName = author || "Dave Johnson";
  const displayTitle = authorTitle || "EVP, ecofit Networks";
  const initials = displayName.split(' ').map(n=>n[0]).join('').slice(0,2);
  // Format post copy — newlines become <br> blocks
  const formatted = (postCopy||'')
    .split(/\n{2,}/)
    .map(p => `<p>${p.replace(/\n/g,'<br>')}</p>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Content Preview — ${campaignTitle||'Campaign'}</title>
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@700;800&family=Work+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
:root{--green:#84BC41;--bg:#14191f;--surface:#1a2130;--border:rgba(255,255,255,0.08);--text:#F2F3F8;--sub:#9699A2;--muted:#6b6f7a;}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);color:var(--text);font-family:'Work Sans',sans-serif;min-height:100vh;padding-bottom:120px;}
nav{border-bottom:1px solid var(--border);padding:0 40px;height:56px;display:flex;align-items:center;justify-content:space-between;background:var(--bg);position:sticky;top:0;z-index:10;}
.nav-brand{font-family:'Raleway',sans-serif;font-weight:800;font-size:16px;color:var(--green);letter-spacing:-0.03em;}
.nav-label{font-size:11px;color:var(--muted);font-weight:500;letter-spacing:0.06em;text-transform:uppercase;}
.wrap{max-width:620px;margin:0 auto;padding:40px 20px;}
.preview-label{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;}
.campaign-header{margin-bottom:28px;}
.campaign-title{font-family:'Raleway',sans-serif;font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:6px;}
.campaign-meta{font-size:12px;color:var(--sub);}
/* LinkedIn Card */
.li-card{background:#fff;border-radius:12px;padding:0;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.3);margin-bottom:24px;}
.li-header{padding:16px 16px 0;display:flex;gap:10px;align-items:flex-start;}
.li-avatar{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#0a66c2,#0073b1);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:#fff;font-family:Georgia,serif;flex-shrink:0;}
.li-meta{flex:1;}
.li-name{font-weight:600;font-size:14px;color:#000;line-height:1.3;}
.li-title{font-size:12px;color:#666;line-height:1.4;margin-top:1px;}
.li-time{font-size:12px;color:#999;margin-top:2px;}
.li-body{padding:14px 16px 8px;font-size:14px;color:#191919;line-height:1.6;}
.li-body p{margin-bottom:14px;}
.li-body p:last-child{margin-bottom:0;}
.li-engagement{padding:8px 16px;border-top:1px solid #e0e0e0;display:flex;gap:0;margin-top:8px;}
.li-action{flex:1;text-align:center;padding:8px 0;font-size:13px;color:#666;font-weight:600;cursor:default;border-radius:6px;}
/* Edit mode */
.edit-toggle{font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:var(--green);background:rgba(132,188,65,0.08);border:1px solid rgba(132,188,65,0.3);border-radius:20px;padding:5px 14px;cursor:pointer;font-family:'Work Sans',sans-serif;transition:all 0.15s;margin-bottom:10px;display:inline-block;}
.edit-toggle:hover{background:rgba(132,188,65,0.18);}
.edit-area{display:none;background:rgba(255,255,255,0.03);border:1px solid rgba(132,188,65,0.3);border-radius:8px;padding:14px;margin-bottom:14px;}
textarea#editCopy{width:100%;background:transparent;border:none;color:var(--text);font-family:'Work Sans',sans-serif;font-size:13px;line-height:1.75;resize:vertical;outline:none;min-height:200px;}
.btn-apply{font-family:'Work Sans',sans-serif;font-size:11px;font-weight:700;padding:7px 18px;border-radius:6px;cursor:pointer;border:none;background:var(--green);color:#0d1117;transition:all 0.15s;margin-top:8px;}
.btn-apply:hover{background:#a8d96b;}
/* Approval */
.approval-section{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;}
.approval-title{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);margin-bottom:16px;}
.approval-btns{display:flex;gap:10px;margin-bottom:16px;}
.btn-approve{flex:1;font-family:'Work Sans',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:12px;border-radius:8px;cursor:pointer;border:1px solid rgba(132,188,65,0.35);color:var(--green);background:rgba(132,188,65,0.08);transition:all 0.15s;}
.btn-approve:hover,.btn-approve.selected{background:rgba(132,188,65,0.22);border-color:var(--green);}
.btn-changes{flex:1;font-family:'Work Sans',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:12px;border-radius:8px;cursor:pointer;border:1px solid rgba(245,158,11,0.35);color:#f59e0b;background:rgba(245,158,11,0.06);transition:all 0.15s;}
.btn-changes:hover,.btn-changes.selected{background:rgba(245,158,11,0.18);border-color:#f59e0b;}
.comment-area{width:100%;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;color:var(--sub);font-family:'Work Sans',sans-serif;font-size:13px;line-height:1.6;padding:12px;resize:vertical;outline:none;min-height:80px;transition:border-color 0.15s;}
.comment-area:focus{border-color:rgba(132,188,65,0.4);}
.comment-area::placeholder{color:var(--muted);}
.btn-send{margin-top:12px;width:100%;font-family:'Work Sans',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:13px;border-radius:8px;cursor:pointer;border:none;background:var(--green);color:#0d1117;transition:all 0.15s;}
.btn-send:hover{background:#a8d96b;}
.footer-note{font-size:11px;color:var(--muted);text-align:center;margin-top:12px;}
</style>
</head>
<body>
<nav>
  <div class="nav-brand">ecofit</div>
  <div class="nav-label">Content Preview · ${date||''}</div>
</nav>
<div class="wrap">
  <div class="campaign-header">
    <div class="preview-label">Content for review</div>
    <div class="campaign-title">${campaignTitle||'Campaign Preview'}</div>
    <div class="campaign-meta">${date||''} · LinkedIn Post · Dave Johnson</div>
  </div>

  <button class="edit-toggle" onclick="toggleEdit()">✏ Edit Copy</button>
  <div class="edit-area" id="editArea">
    <textarea id="editCopy">${(postCopy||'').replace(/</g,'&lt;')}</textarea>
    <br><button class="btn-apply" onclick="applyEdit()">Apply Changes</button>
  </div>

  <div class="li-card" id="liCard">
    <div class="li-header">
      <div class="li-avatar">${initials}</div>
      <div class="li-meta">
        <div class="li-name">${displayName}</div>
        <div class="li-title">${displayTitle}</div>
        <div class="li-time">Just now · 🌐</div>
      </div>
    </div>
    <div class="li-body" id="liBody">${formatted}</div>
    <div class="li-engagement">
      <div class="li-action">👍 Like</div>
      <div class="li-action">💬 Comment</div>
      <div class="li-action">🔁 Repost</div>
      <div class="li-action">📤 Send</div>
    </div>
  </div>

  <div class="approval-section">
    <div class="approval-title">Your feedback</div>
    <div class="approval-btns">
      <button class="btn-approve" id="btnApprove" onclick="setDecision('approve')">✓ Looks Good</button>
      <button class="btn-changes" id="btnChanges" onclick="setDecision('changes')">⚠ Needs Changes</button>
    </div>
    <textarea class="comment-area" id="commentField" placeholder="Add a comment (optional — what needs changing, or any notes for Bill)…"></textarea>
    <button class="btn-send" onclick="sendFeedback()">Send Feedback to Bill</button>
    <div class="footer-note">Your feedback goes directly to Bill at Treetop Growth Strategy.</div>
  </div>
</div>
<script>
let decision = '';
const ORIGINAL = ${JSON.stringify(postCopy||'')};

function toggleEdit(){
  const area = document.getElementById('editArea');
  const isOpen = area.style.display === 'block';
  area.style.display = isOpen ? 'none' : 'block';
  if(!isOpen) document.getElementById('editCopy').value = getCurrentCopy();
}
function getCurrentCopy(){
  return document.getElementById('liBody').innerText;
}
function applyEdit(){
  const val = document.getElementById('editCopy').value;
  const formatted = val.split(/\n{2,}/).map(function(p){ return '<p>'+p.replace(/\n/g,'<br>')+'</p>'; }).join('\n');
  document.getElementById('liBody').innerHTML = formatted;
  document.getElementById('editArea').style.display = 'none';
}
function setDecision(d){
  decision = d;
  document.getElementById('btnApprove').classList.toggle('selected', d==='approve');
  document.getElementById('btnChanges').classList.toggle('selected', d==='changes');
  if(d==='approve' && !document.getElementById('commentField').value)
    document.getElementById('commentField').placeholder = 'Any notes? (optional)';
  else if(d==='changes')
    document.getElementById('commentField').placeholder = 'What needs changing?';
}
function sendFeedback(){
  if(!decision){ alert('Please select Looks Good or Needs Changes first.'); return; }
  const comment = document.getElementById('commentField').value.trim();
  const currentCopy = getCurrentCopy();
  const copyChanged = currentCopy !== ORIGINAL;
  const subject = encodeURIComponent('Content Feedback: ${campaignTitle||'Campaign'} — ' + (decision==='approve'?'Approved':'Needs Changes'));
  let body = 'Hi Bill,\\n\\n';
  body += decision==='approve' ? 'The content looks good. ' : 'The content needs some changes. ';
  if(comment) body += '\\n\\nNotes: ' + comment;
  if(copyChanged) body += '\\n\\nI edited the copy. Here is the updated version:\\n\\n' + currentCopy;
  body += '\\n\\nDave';
  window.location.href = 'mailto:william.colbert@treetopgrowthstrategy.com?subject=' + subject + '&body=' + encodeURIComponent(body);
}
</script>
</body>
</html>`;
}

async function githubPut(path, content, message){
  let sha = null;
  const g = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    headers:{ Authorization:`token ${GITHUB_TOKEN}`, "User-Agent":"ecofit-preview" }});
  if(g.ok){ const j=await g.json(); sha=j.sha; }
  const body = { message, content, sha: sha||undefined };
  if(!sha) delete body.sha;
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method:"PUT",
    headers:{ Authorization:`token ${GITHUB_TOKEN}`, "Content-Type":"application/json", "User-Agent":"ecofit-preview" },
    body: JSON.stringify(body)});
  return r.ok;
}

export default async function handler(req, res){
  cors(res);
  if(req.method==="OPTIONS") return res.status(200).end();
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  const { cardId, campaignTitle, date, postCopy, author, authorTitle } = req.body||{};
  if(!cardId || !postCopy) return res.status(400).json({error:"cardId and postCopy required"});
  const html = buildPreviewHTML({ cardId, campaignTitle, date, postCopy, author, authorTitle });
  const b64 = Buffer.from(html,"utf8").toString("base64");
  const path = `public/clients/ecofit/previews/${cardId}-linkedin.html`;
  const ok = await githubPut(path, b64, `LinkedIn preview: ${campaignTitle||cardId}`);
  if(!ok) return res.status(500).json({error:"GitHub push failed"});
  const liveUrl = `${SITE}/clients/ecofit/previews/${cardId}-linkedin.html`;
  return res.status(200).json({ ok:true, url: liveUrl });
}
