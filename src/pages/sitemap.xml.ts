import type { APIRoute } from 'astro';

const pages = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/services', priority: '0.9', changefreq: 'weekly' },
  { url: '/services/ai-audit', priority: '0.9', changefreq: 'monthly' },
  { url: '/services/implementation', priority: '0.9', changefreq: 'monthly' },
  { url: '/services/retainer', priority: '0.8', changefreq: 'monthly' },
  { url: '/about', priority: '0.8', changefreq: 'monthly' },
  { url: '/claude-for-small-business', priority: '0.9', changefreq: 'monthly' },
  { url: '/claude-implementation-consultant', priority: '0.85', changefreq: 'monthly' },
  { url: '/anthropic-claude-setup-for-business', priority: '0.8', changefreq: 'monthly' },
  { url: '/ai-workflow-automation-small-business', priority: '0.8', changefreq: 'monthly' },
  { url: '/chatgpt-vs-claude-for-business', priority: '0.85', changefreq: 'monthly' },
  { url: '/claude-ai-vs-chatgpt-small-business', priority: '0.85', changefreq: 'monthly' },
  { url: '/claude-for-consultants', priority: '0.8', changefreq: 'monthly' },
  { url: '/claude-for-agencies', priority: '0.8', changefreq: 'monthly' },
  { url: '/claude-for-professional-services', priority: '0.8', changefreq: 'monthly' },
  { url: '/claude-for-e-commerce', priority: '0.8', changefreq: 'monthly' },
  { url: '/ai-for-small-business', priority: '0.8', changefreq: 'monthly' },
  { url: '/save-time-with-ai-small-business', priority: '0.75', changefreq: 'monthly' },
  { url: '/how-to-use-ai-in-your-business', priority: '0.75', changefreq: 'monthly' },
  { url: '/resources', priority: '0.8', changefreq: 'weekly' },
  { url: '/resources/how-to-set-up-claude-projects', priority: '0.75', changefreq: 'monthly' },
  { url: '/resources/claude-vs-chatgpt-small-business', priority: '0.75', changefreq: 'monthly' },
  { url: '/resources/five-claude-workflows-small-business', priority: '0.75', changefreq: 'monthly' },
  { url: '/fractional-cmo', priority: '0.8', changefreq: 'monthly' },
  { url: '/claude-training', priority: '0.8', changefreq: 'monthly' },
  { url: '/quiz', priority: '0.7', changefreq: 'monthly' },
];

const BASE = 'https://treetopgrowthstrategy.com';
const today = new Date().toISOString().split('T')[0];

export const GET: APIRoute = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
