import type { APIRoute } from 'astro';

export const prerender = true;

const BASE = 'https://treetopgrowthstrategy.com';
const today = new Date().toISOString();

// Recent and most-valuable content for the feed
// Sorted by recency / relevance
const items = [
  // Industry playbooks (most recent + highest-leverage)
  { url: '/healthcare-ai-playbook-2026', title: 'Healthcare AI Playbook 2026', description: 'A practical 2026 AI playbook for private medical practices and mid-market healthcare organizations.' },
  { url: '/legal-ai-playbook-2026', title: 'Legal AI Playbook 2026', description: 'A practical 2026 AI playbook for mid-sized law firms (5-50 attorneys).' },
  { url: '/manufacturing-ai-playbook-2026', title: 'Manufacturing AI Playbook 2026', description: 'A 2026 AI playbook for mid-market industrial manufacturers — commercial-side focus.' },
  { url: '/financial-services-ai-playbook-2026', title: 'Financial Services AI Playbook 2026', description: 'A 2026 AI playbook for financial advisory, wealth management, and brokerage firms.' },
  { url: '/ecommerce-ai-playbook-2026', title: 'E-commerce AI Playbook 2026', description: 'A 2026 AI playbook for DTC brands $2M-$50M.' },
  { url: '/nonprofit-ai-playbook-2026', title: 'Nonprofit AI Playbook 2026', description: 'A 2026 AI playbook for mid-sized nonprofits — capacity expansion framing.' },
  { url: '/real-estate-ai-playbook-2026', title: 'Real Estate AI Playbook 2026', description: 'A 2026 AI playbook for real estate brokerages and property management companies.' },

  // Case studies
  { url: '/case-study-real-estate-brokerage-doubled-listings-per-agent', title: 'How a 22-Agent Brokerage Doubled Listings per Agent with Claude', description: 'Composite case study: a residential brokerage rebuilt agent workflow around Claude.' },
  { url: '/case-study-medical-practice-recovered-12-hours-weekly', title: 'How a 3-Doctor Medical Practice Recovered 12 Hours/Week with Claude', description: 'Composite case study: HIPAA-aware AI rollout in a private practice.' },
  { url: '/case-study-law-firm-doubled-contract-throughput', title: 'How a 15-Lawyer Firm Doubled Contract Throughput with Claude', description: 'Composite case study: contract drafting and review workflow rebuild.' },

  // Long-form guides
  { url: '/how-to-build-an-ai-strategy-on-one-page', title: 'How to Build an AI Strategy on One Page', description: 'Template + worked example for one-page AI strategy.' },
  { url: '/how-to-evaluate-ai-fluency-when-hiring', title: 'How to Evaluate AI Fluency When Hiring', description: 'Interview questions and assessment tasks for AI fluency in hiring.' },
  { url: '/how-to-use-claude-for-engineering-teams', title: 'How to Use Claude for Engineering Teams', description: 'Practical workflows for Claude Code, Cursor, and Copilot positioning.' },
  { url: '/how-to-handle-an-ai-data-incident', title: 'How to Handle an AI Data Incident', description: 'Incident response playbook for AI data incidents.' },
  { url: '/ai-implementation-partner-vs-internal-team', title: 'AI Implementation: Partner vs Internal Team', description: 'Hybrid framework for choosing between external and internal AI rollout.' },
  { url: '/how-to-roll-out-ai-to-a-50-person-company', title: 'How to Roll Out AI to a 50-Person Company', description: 'The operator\'s guide for $5M-$30M B2B companies.' },

  // State-of reads (May 2026)
  { url: '/state-of-ai-in-b2b-sales-2026', title: 'State of AI in B2B Sales 2026', description: 'May 2026 read on what\'s working in B2B sales AI rollouts.' },
  { url: '/state-of-ai-in-b2b-marketing-2026', title: 'State of AI in B2B Marketing 2026', description: 'May 2026 read on B2B marketing AI patterns.' },
  { url: '/state-of-fractional-executive-talent-2026', title: 'State of Fractional Executive Talent 2026', description: 'May 2026 market read for CEOs hiring fractional leaders.' },
  { url: '/ai-trends-for-mid-market-companies-2026', title: 'AI Trends for Mid-Market Companies 2026', description: '8 practical trends shaping $5M-$50M B2B.' },
  { url: '/claude-vs-chatgpt-2026', title: 'Claude vs ChatGPT 2026', description: 'Honest side-by-side current-version comparison.' },

  // Frameworks
  { url: '/ai-implementation-roadmap-template', title: 'AI Implementation Roadmap Template', description: '90-day plan template for B2B AI rollouts.' },
  { url: '/ai-policy-template', title: 'AI Policy Template', description: 'One-page AI usage policy framework.' },
  { url: '/claude-project-template-library', title: 'Claude Project Template Library', description: '12 starter Project templates for B2B teams.' },
  { url: '/ai-readiness-checklist', title: 'AI Readiness Checklist', description: '25 organizational questions to answer before rollout.' },
  { url: '/ai-rollout-checklist-for-ceos', title: 'AI Rollout Checklist for CEOs', description: '15 boxes to check before greenlighting rollout.' },

  // Tactical how-tos
  { url: '/how-to-clean-your-crm-with-ai', title: 'How to Clean Your CRM with AI', description: 'Practical quarterly workflow.' },
  { url: '/how-to-build-an-internal-prompt-library', title: 'How to Build an Internal Prompt Library', description: 'Structure, tooling, and governance.' },
  { url: '/how-to-prep-for-a-board-meeting-with-claude', title: 'How to Prep for a Board Meeting with Claude', description: 'CEO workflow.' },
  { url: '/how-to-explain-ai-to-your-team', title: 'How to Explain AI to Your Team', description: 'The framing that produces adoption.' },
];

export const GET: APIRoute = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Treetop Growth Strategy</title>
  <subtitle>Frameworks, playbooks, and case studies for B2B mid-market AI rollouts</subtitle>
  <link href="${BASE}/feed.xml" rel="self" />
  <link href="${BASE}/" />
  <id>${BASE}/</id>
  <updated>${today}</updated>
  <author>
    <name>Bill Colbert</name>
    <email>bill@treetopgrowthstrategy.com</email>
    <uri>${BASE}/about</uri>
  </author>
  <rights>© 2026 Treetop Growth Strategy</rights>
${items.map(item => `  <entry>
    <title>${item.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
    <link href="${BASE}${item.url}" />
    <id>${BASE}${item.url}</id>
    <updated>${today}</updated>
    <summary type="text">${item.description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</summary>
    <author><name>Bill Colbert</name></author>
  </entry>`).join('\n')}
</feed>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
