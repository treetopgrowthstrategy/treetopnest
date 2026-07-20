// Shared Ahrefs data-fetching for the AI CMO endpoints.
//
// This follows the same pattern as cmo-guards.ts: a shared library that lives
// in api/ so Vercel includes it in every function bundle that imports it. The
// default export is an inert 404 so the incidental /api/cmo-ahrefs route does
// nothing; the real value is the named exports.
//
// Consumers: cmo-free-report.ts, cmo-payment-webhook.ts, cron-cmo-nurture.ts,
// cron-cmo-monitor.ts.
//
// All imports of this module MUST use the .js extension:
//   import { fetchOwnMetrics } from './cmo-ahrefs.js';

const AHREFS_API_KEY = process.env.AHREFS_API_KEY || '';
const BASE = 'https://api.ahrefs.com/v3/site-explorer';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DomainMetrics {
  domain: string;
  domainRating: number | null;
  orgTraffic: number | null;
  orgKeywords: number | null;
}

export interface CompetitorRow {
  domain: string;
  domainRating: number | null;
  orgTraffic: number | null;
}

export interface KeywordRow {
  keyword: string;
  volume: number;
  best_position: number;
  sum_traffic: number;
  cpc?: number | null;
}

export interface AhrefsData {
  domain: string;
  domainRating: number | null;
  ahrefsRank: number | null;
  orgKeywords: number | null;
  orgTraffic: number | null;
  topKeywords: Array<{ keyword: string; volume: number; best_position: number; sum_traffic: number }>;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

export async function fetchOwnMetrics(domain: string, date: string): Promise<DomainMetrics | null> {
  if (!AHREFS_API_KEY || !domain) return null;
  const h = { Authorization: `Bearer ${AHREFS_API_KEY}` };
  try {
    const [drRes, mRes] = await Promise.all([
      fetch(`${BASE}/domain-rating?target=${domain}&date=${date}&output=json`, { headers: h }),
      fetch(`${BASE}/metrics?target=${domain}&date=${date}&mode=subdomains&output=json`, { headers: h }),
    ]);
    const dr: any = drRes.ok ? await drRes.json() : null;
    const m: any  = mRes.ok  ? await mRes.json()  : null;
    if (!drRes.ok) console.warn(`Ahrefs domain-rating ${domain}: HTTP ${drRes.status}`);
    if (!mRes.ok)  console.warn(`Ahrefs metrics ${domain}: HTTP ${mRes.status}`);
    const result = {
      domain,
      domainRating: dr?.domain_rating?.domain_rating ?? dr?.domain_rating ?? null,
      orgTraffic:   m?.metrics?.org_traffic ?? null,
      orgKeywords:  m?.metrics?.org_keywords ?? null,
    };
    if (result.domainRating == null && result.orgTraffic == null) {
      console.warn(`Ahrefs returned no usable metrics for ${domain}. DR response keys: ${dr ? Object.keys(dr).join(',') : 'null'}. Metrics response keys: ${m ? Object.keys(m).join(',') : 'null'}`);
    }
    return result;
  } catch (err) {
    console.error('fetchOwnMetrics failed:', err);
    return null;
  }
}

export async function fetchTopKeywords(domain: string, date: string, limit = 20): Promise<KeywordRow[]> {
  if (!AHREFS_API_KEY || !domain) return [];
  const url = `${BASE}/organic-keywords?target=${domain}&date=${date}&mode=subdomains&select=keyword,volume,best_position,sum_traffic,cpc&order_by=sum_traffic:desc&limit=${limit}&output=json`;
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${AHREFS_API_KEY}` } });
    if (!r.ok) return [];
    const data: any = await r.json();
    return (data?.keywords || []) as KeywordRow[];
  } catch (err) {
    console.error('fetchTopKeywords failed:', err);
    return [];
  }
}

export async function fetchCompetitors(domain: string, date: string, limit = 3): Promise<string[]> {
  if (!AHREFS_API_KEY || !domain) return [];
  const url = `${BASE}/organic-competitors?target=${domain}&date=${date}&mode=subdomains&select=competitor_domain,intersecting_keywords&order_by=intersecting_keywords:desc&limit=${limit}&output=json`;
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${AHREFS_API_KEY}` } });
    if (!r.ok) return [];
    const data: any = await r.json();
    const rows: Array<{ competitor_domain?: string; domain?: string }> = data?.competitors || data?.organic_competitors || data?.results || [];
    if (!rows.length) console.warn(`Ahrefs organic-competitors for ${domain}: 0 results. Response keys: ${Object.keys(data || {}).join(',')}`);
    return rows
      .map(x => (x.competitor_domain || x.domain || '').toString().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase())
      .filter(Boolean)
      .filter(d => d !== domain)
      .slice(0, limit);
  } catch (err) {
    console.error('fetchCompetitors failed:', err);
    return [];
  }
}

export async function enrichCompetitors(domains: string[], date: string): Promise<CompetitorRow[]> {
  if (!domains.length) return [];
  const rows = await Promise.all(domains.map(async d => {
    const m = await fetchOwnMetrics(d, date);
    return {
      domain: d,
      domainRating: m?.domainRating ?? null,
      orgTraffic:   m?.orgTraffic ?? null,
    };
  }));
  return rows;
}

export async function fetchAhrefsData(domain: string, todayDate: string): Promise<AhrefsData | null> {
  if (!AHREFS_API_KEY) return null;
  const h = { Authorization: `Bearer ${AHREFS_API_KEY}` };
  try {
    const [drRes, metricsRes, kwRes] = await Promise.all([
      fetch(`${BASE}/domain-rating?target=${domain}&date=${todayDate}&output=json`, { headers: h }),
      fetch(`${BASE}/metrics?target=${domain}&date=${todayDate}&mode=subdomains&output=json`, { headers: h }),
      fetch(`${BASE}/organic-keywords?target=${domain}&date=${todayDate}&mode=subdomains&select=keyword,volume,best_position,sum_traffic&order_by=sum_traffic:desc&limit=10&output=json`, { headers: h }),
    ]);
    const dr: any      = drRes.ok      ? await drRes.json()      : null;
    const metrics: any = metricsRes.ok ? await metricsRes.json() : null;
    const kw: any      = kwRes.ok      ? await kwRes.json()      : null;
    return {
      domain,
      domainRating:  dr?.domain_rating?.domain_rating  ?? null,
      ahrefsRank:    dr?.domain_rating?.ahrefs_rank     ?? null,
      orgKeywords:   metrics?.metrics?.org_keywords     ?? null,
      orgTraffic:    metrics?.metrics?.org_traffic      ?? null,
      topKeywords:   kw?.keywords                       ?? [],
    };
  } catch (err) {
    console.error(`Ahrefs fetch failed for ${domain}:`, err);
    return null;
  }
}

// ─── Inert default handler ─────────────────────────────────────────────────

export default function handler(_req: any, res: any) {
  return res.status(404).json({ error: 'not a public endpoint' });
}
