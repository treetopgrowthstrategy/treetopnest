import type { APIRoute } from 'astro';

export const prerender = true;

const pages = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/services', priority: '0.9', changefreq: 'weekly' },
  { url: '/services/ai-audit', priority: '0.9', changefreq: 'monthly' },
  { url: '/services/implementation', priority: '0.9', changefreq: 'monthly' },
  { url: '/services/retainer', priority: '0.8', changefreq: 'monthly' },
  { url: '/about', priority: '0.8', changefreq: 'monthly' },
  { url: '/pricing', priority: '0.95', changefreq: 'monthly' },
  { url: '/how-we-work', priority: '0.9', changefreq: 'monthly' },
  { url: '/the-ai-native-gtm-framework', priority: '0.9', changefreq: 'monthly' },
  { url: '/claude-for-business', priority: '0.95', changefreq: 'monthly' },
  { url: '/how-to-use-claude', priority: '0.95', changefreq: 'monthly' },
  { url: '/how-much-does-claude-cost-for-business', priority: '0.9', changefreq: 'monthly' },
  { url: '/how-much-does-ai-implementation-cost', priority: '0.9', changefreq: 'monthly' },
  { url: '/how-to-use-ai-to-write-proposals', priority: '0.85', changefreq: 'monthly' },
  { url: '/how-to-use-ai-to-research-prospects', priority: '0.85', changefreq: 'monthly' },
  { url: '/claude-vs-perplexity-for-business', priority: '0.85', changefreq: 'monthly' },
  { url: '/how-much-does-a-fractional-cro-cost', priority: '0.85', changefreq: 'monthly' },
  { url: '/ai-consultant-cost', priority: '0.85', changefreq: 'monthly' },
  { url: '/how-much-does-ai-training-cost-for-teams', priority: '0.8', changefreq: 'monthly' },
  { url: '/cost-of-not-using-ai', priority: '0.8', changefreq: 'monthly' },
  { url: '/what-is-ai-implementation', priority: '0.8', changefreq: 'monthly' },
  { url: '/what-is-ai-consulting', priority: '0.8', changefreq: 'monthly' },
  { url: '/what-is-an-ai-native-company', priority: '0.8', changefreq: 'monthly' },
  { url: '/what-is-a-fractional-executive', priority: '0.8', changefreq: 'monthly' },
  { url: '/what-is-revops', priority: '0.8', changefreq: 'monthly' },
  { url: '/how-to-use-ai-to-summarize-meetings', priority: '0.82', changefreq: 'monthly' },
  { url: '/how-to-use-ai-for-board-reports', priority: '0.82', changefreq: 'monthly' },
  { url: '/how-to-use-ai-to-write-job-descriptions', priority: '0.82', changefreq: 'monthly' },
  { url: '/how-to-use-ai-to-do-competitor-research', priority: '0.82', changefreq: 'monthly' },
  { url: '/claude-prompts-for-sales', priority: '0.85', changefreq: 'monthly' },
  { url: '/claude-prompts-for-marketing', priority: '0.85', changefreq: 'monthly' },
  { url: '/why-treetop', priority: '0.9', changefreq: 'monthly' },
  { url: '/claude-vs-notion-ai', priority: '0.85', changefreq: 'monthly' },
  { url: '/claude-team-vs-claude-enterprise', priority: '0.85', changefreq: 'monthly' },
  { url: '/how-to-use-ai-to-write-linkedin-posts', priority: '0.82', changefreq: 'monthly' },
  { url: '/how-to-use-ai-to-onboard-employees', priority: '0.82', changefreq: 'monthly' },
  { url: '/how-to-use-ai-to-build-pitch-decks', priority: '0.82', changefreq: 'monthly' },
  { url: '/ai-policy-template-for-small-business', priority: '0.85', changefreq: 'monthly' },
  { url: '/what-is-claude-projects', priority: '0.8', changefreq: 'monthly' },
  { url: '/what-is-prompt-engineering', priority: '0.8', changefreq: 'monthly' },
  { url: '/what-is-gtm-strategy', priority: '0.8', changefreq: 'monthly' },
  { url: '/what-is-enterprise-ai', priority: '0.8', changefreq: 'monthly' },
  { url: '/what-is-an-ai-audit', priority: '0.8', changefreq: 'monthly' },
  { url: '/claude-prompts-for-customer-service', priority: '0.85', changefreq: 'monthly' },
  { url: '/best-ai-tools-for-b2b-sales', priority: '0.85', changefreq: 'monthly' },
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
  { url: '/resources/what-is-a-fractional-cmo', priority: '0.75', changefreq: 'monthly' },
  { url: '/resources/how-to-build-claude-prompts-for-your-business', priority: '0.75', changefreq: 'monthly' },
  { url: '/resources/ai-gtm-playbook', priority: '0.8', changefreq: 'monthly' },
  { url: '/results', priority: '0.85', changefreq: 'monthly' },
  { url: '/fractional-cmo-vs-full-time-cmo', priority: '0.85', changefreq: 'monthly' },
  { url: '/fractional-cmo-vs-agency', priority: '0.85', changefreq: 'monthly' },
  { url: '/ai-consultant-vs-doing-it-yourself', priority: '0.8', changefreq: 'monthly' },
  { url: '/fractional-cmo-austin-tx', priority: '0.8', changefreq: 'monthly' },
  { url: '/ai-consultant-austin', priority: '0.8', changefreq: 'monthly' },
  { url: '/what-does-a-fractional-cmo-do', priority: '0.8', changefreq: 'monthly' },
  { url: '/how-much-does-a-fractional-cmo-cost', priority: '0.8', changefreq: 'monthly' },
  { url: '/what-is-claude-ai', priority: '0.8', changefreq: 'monthly' },
  { url: '/ai-tools-for-small-business', priority: '0.75', changefreq: 'monthly' },
  { url: '/how-to-build-a-gtm-strategy', priority: '0.8', changefreq: 'monthly' },
  { url: '/b2b-saas-go-to-market-strategy', priority: '0.8', changefreq: 'monthly' },
  { url: '/what-is-ai-native-gtm', priority: '0.85', changefreq: 'monthly' },
  { url: '/how-to-use-claude-for-sales', priority: '0.8', changefreq: 'monthly' },
  { url: '/how-to-use-claude-for-marketing', priority: '0.8', changefreq: 'monthly' },
  { url: '/ai-prompts-for-b2b-sales', priority: '0.75', changefreq: 'monthly' },
  // Claude for X verticals
  { url: '/claude-for-saas', priority: '0.8', changefreq: 'monthly' },
  { url: '/claude-for-healthcare', priority: '0.8', changefreq: 'monthly' },
  { url: '/claude-for-legal', priority: '0.8', changefreq: 'monthly' },
  { url: '/claude-for-real-estate', priority: '0.8', changefreq: 'monthly' },
  { url: '/claude-for-finance', priority: '0.8', changefreq: 'monthly' },
  { url: '/claude-for-hr', priority: '0.8', changefreq: 'monthly' },
  // How to use Claude for X
  { url: '/how-to-use-claude-for-customer-service', priority: '0.78', changefreq: 'monthly' },
  { url: '/how-to-use-claude-for-operations', priority: '0.78', changefreq: 'monthly' },
  { url: '/how-to-use-claude-for-finance', priority: '0.78', changefreq: 'monthly' },
  { url: '/how-to-use-claude-for-hr', priority: '0.78', changefreq: 'monthly' },
  { url: '/how-to-use-claude-for-project-management', priority: '0.78', changefreq: 'monthly' },
  // Comparisons & roundups
  { url: '/claude-vs-microsoft-copilot', priority: '0.85', changefreq: 'monthly' },
  { url: '/claude-vs-gemini-for-business', priority: '0.85', changefreq: 'monthly' },
  { url: '/best-ai-for-business', priority: '0.85', changefreq: 'monthly' },
  // Service & role pages
  { url: '/fractional-cro', priority: '0.85', changefreq: 'monthly' },
  { url: '/revenue-operations-consultant', priority: '0.85', changefreq: 'monthly' },
  { url: '/ai-strategy-consultant', priority: '0.85', changefreq: 'monthly' },
  { url: '/sales-enablement-consultant', priority: '0.82', changefreq: 'monthly' },
  { url: '/ai-implementation-consultant', priority: '0.85', changefreq: 'monthly' },
  // Location pages
  { url: '/fractional-cmo-texas', priority: '0.78', changefreq: 'monthly' },
  { url: '/fractional-cmo-remote', priority: '0.75', changefreq: 'monthly' },
  // Resource articles
  { url: '/resources/how-to-build-a-claude-project-for-your-team', priority: '0.75', changefreq: 'monthly' },
  { url: '/resources/ai-revenue-operations-playbook', priority: '0.78', changefreq: 'monthly' },
  { url: '/resources/fractional-cmo-vs-consulting-firm', priority: '0.75', changefreq: 'monthly' },
  { url: '/resources/claude-system-prompts-library', priority: '0.8', changefreq: 'monthly' },
  // Existing
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
