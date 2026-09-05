// api/verify.js
// Vercel serverless function. Fetches a URL and inspects the HTML for Meta Pixel presence.
// No dependencies. Uses global fetch (Node 18+).

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Use GET' });
    return;
  }

  var target = getParam(req, 'url');
  if (!target || !String(target).trim()) {
    res.status(400).json({ error: 'Pass the page URL as ?url=' });
    return;
  }
  target = String(target).trim();
  if (!/^[a-z][a-z0-9+.\-]*:/i.test(target)) {
    target = 'https://' + target;
  }
  var parsed;
  try {
    parsed = new URL(target);
  } catch (e) {
    res.status(400).json({ error: 'That is not a valid URL' });
    return;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    res.status(400).json({ error: 'Only http and https URLs are supported' });
    return;
  }

  var controller = new AbortController();
  var timer = setTimeout(function () { controller.abort(); }, 12000);

  var html;
  var status;
  try {
    var resp = await fetch(parsed.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'TreetopPixelChecker/1.0 (+https://treetopgrowthstrategy.com/pixel)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.8'
      }
    });
    status = resp.status;
    if (!resp.ok) {
      res.status(200).json({ ok: false, reason: 'http', status: status });
      return;
    }
    html = await resp.text();
  } catch (e) {
    if (e && (e.name === 'AbortError' || /aborted/i.test(String(e && e.message)))) {
      res.status(200).json({ ok: false, reason: 'timeout' });
      return;
    }
    res.status(200).json({ ok: false, reason: 'unreachable' });
    return;
  } finally {
    clearTimeout(timer);
  }

  var result = inspect(html);
  res.status(200).json({
    ok: true,
    url: parsed.toString(),
    ids: result.ids,
    libraryFound: result.libraryFound,
    pageView: result.pageView,
    gtmFound: result.gtmFound,
    inHead: result.inHead
  });
};

function getParam(req, name) {
  if (req.query && req.query[name] != null) return String(req.query[name]);
  try {
    var u = new URL(req.url || '', 'http://x.local');
    return u.searchParams.get(name) || '';
  } catch (e) {
    return '';
  }
}

function inspect(html) {
  var ids = new Set();

  var initRe = /fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/gi;
  var m;
  while ((m = initRe.exec(html)) !== null) {
    ids.add(m[1]);
  }

  var trRe = /facebook\.com\/tr\?id=(\d+)/gi;
  while ((m = trRe.exec(html)) !== null) {
    ids.add(m[1]);
  }

  var libraryFound = /connect\.facebook\.net/i.test(html) && /fbevents\.js/i.test(html);
  var pageView = /fbq\s*\(\s*['"]track['"]\s*,\s*['"]PageView['"]/i.test(html);
  var gtmFound = /googletagmanager\.com\/(gtm|gtag)/i.test(html);

  var inHead = null;
  var headEnd = html.search(/<\/head\s*>/i);
  if (headEnd !== -1) {
    var libPos = html.search(/fbevents\.js/i);
    inHead = libPos !== -1 && libPos < headEnd;
  }

  return {
    ids: Array.from(ids),
    libraryFound: libraryFound,
    pageView: pageView,
    gtmFound: gtmFound,
    inHead: inHead
  };
}
