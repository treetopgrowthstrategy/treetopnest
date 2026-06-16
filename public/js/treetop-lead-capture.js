/**
 * Treetop Growth Strategy — Lead Capture
 * Includes: exit-intent popup, sticky bottom bar
 * Drop this file in public/js/ and add one <script> tag to your Layout.
 * 
 * To add site-wide:
 * In src/layouts/Layout.astro, before </body>:
 *   <script src="/js/treetop-lead-capture.js" defer></script>
 */

(function () {
  'use strict';

  // ── CONFIG ────────────────────────────────────────────────────────────────
  const CONFIG = {
    // Where the form submits — update to your actual form endpoint
    // Options: Mailchimp embed URL, ConvertKit, your Firebase function, Formspree
    formAction: 'https://formspree.io/f/xbdeqldr',

    // Delay before sticky bar appears (ms after scroll threshold)
    stickyBarDelay: 3000,

    // Scroll % before sticky bar appears
    stickyScrollThreshold: 0.40,

    // Days to suppress popup after dismissal
    suppressDays: 7,

    // Page-specific offer mapping (slug substring → offer text)
    // First match wins; order matters. Falls back to default if no match.
    // The order here is intentional: more specific patterns first.
    offers: {
      // Cost / pricing pages: deliver the 2026 Fractional Executive Pricing Report
      'how-much-does-a-fractional': { asset: '2026 Fractional Executive Pricing Report', desc: 'Side-by-side rates, retainer ranges, and what to negotiate for fractional CMO, CRO, CFO, COO, CHRO, and CTO. Updated June 2026.' },
      'how-much-does-an-ai':        { asset: 'AI Investment Budget Worksheet', desc: 'What B2B mid-market companies actually spend on AI in 2026: tools, consultants, implementation, and run-rate. Pre-built worksheet with sane ranges.' },
      'how-much-does-claude':       { asset: 'Claude Pricing & ROI Worksheet', desc: 'Tier-by-tier Claude pricing for 2026 plus a worksheet for sizing the right plan against your team and use cases.' },
      'how-much-does-chatgpt':      { asset: 'ChatGPT Pricing & ROI Worksheet', desc: 'Tier-by-tier ChatGPT pricing for 2026 plus a worksheet for sizing Plus vs Team vs Enterprise against your use case.' },
      'how-much-does-ai-marketing': { asset: 'AI Marketing Budget Template', desc: 'Realistic AI marketing budgets by company stage, with the line items most teams underspend on.' },

      // Comparison pages (X-vs-Y): AI Tool Comparison Matrix
      '-vs-':                       { asset: 'AI Tool Comparison Matrix (2026)', desc: 'Side-by-side scorecard for Claude, ChatGPT, Gemini, Copilot, Perplexity, plus the verticals (Notion AI, Airtable AI, Jasper, Copy.ai). Editable and decision-ready.' },

      // AI agents pages: AI Agents Implementation Playbook
      'ai-agents-for':              { asset: 'AI Agents Implementation Playbook', desc: 'The operating model for deploying AI agents: workflow selection, human-in-the-loop design, vendor choice, and the metrics that prove ROI.' },

      // Industry × role and industry pages: Industry AI Operating Model
      'ai-for-saas':                { asset: 'B2B SaaS AI Operating Model', desc: 'The role-by-role AI deployment playbook for B2B SaaS. CMO, CRO, CFO, VP of Marketing, Founder mapped to specific workflows and tools.' },
      'ai-for-fintech':             { asset: 'Fintech AI Operating Model', desc: 'AI deployment inside the fintech regulatory perimeter. BAA-grade vendor selection, audit-trail design, and the playbook for each function.' },
      'ai-for-healthcare-tech':     { asset: 'Healthcare Tech AI Operating Model', desc: 'HIPAA-aware AI deployment for healthcare technology. Vendor selection, BAA setup, and the role-by-role playbook.' },
      'ai-for-legal':               { asset: 'Legal Services AI Operating Model', desc: 'UPL-aware AI deployment for legal services. Vendor selection, supervision design, and ethics-compliant workflows.' },
      'ai-for-insurance':           { asset: 'Insurance AI Operating Model', desc: 'Compliance-aware AI deployment for insurance. State regulatory considerations, underwriting integrity, and the role-by-role playbook.' },
      'ai-for-ecommerce':           { asset: 'Ecommerce AI Operating Model', desc: 'AI deployment for DTC and B2B ecommerce. Catalog ops, customer-service deflection, and conversion-economics playbook.' },
      'ai-for-manufacturing':       { asset: 'Manufacturing AI Operating Model', desc: 'AI deployment for B2B manufacturing. Technical content, long-cycle nurture, and channel enablement playbook.' },
      'ai-for-small-business':      { asset: 'Small Business AI Stack Worksheet', desc: 'Pick the right AI stack for your small business in 30 minutes. Workflow audit, tool selector, and budget calculator.' },
      'ai-for-':                    { asset: 'Industry AI Operating Model', desc: 'The role-by-role AI deployment playbook for your industry. Concrete workflows, tools, and ROI math.' },

      // Glossary: AI-Native GTM Glossary PDF
      'what-is-':                   { asset: 'AI-Native GTM Glossary (PDF)', desc: 'Every term in the Treetop glossary in a citation-friendly PDF. 100+ plain-English definitions for AI, GTM, and fractional executive vocabulary.' },

      // How-to pages: Operator AI How-To Library
      'how-to-':                    { asset: 'Operator AI How-To Library', desc: 'A curated library of practical Claude and AI workflows for B2B operators. Prompt templates included.' },

      // Claude-for pages
      'claude-for':                 { asset: 'Claude for B2B Operators Guide', desc: 'A practical Claude guide for B2B operators by industry and role. Workflows, prompts, and the operating model.' },

      // Existing offers (kept; less specific so listed after)
      '30-60-90-day-plan-marketing': { asset: '30-60-90 Day Marketing Plan Template', desc: 'The benchmark tracker, testing cadence, and 90-day report structure, pre-built.' },
      'b2b-marketing-benchmarks':    { asset: 'B2B Marketing Benchmark Tracker', desc: 'Every benchmark in this guide as a pre-formatted spreadsheet you can fill with your numbers.' },
      'competitive-marketing-audit': { asset: 'Competitive Audit Matrix Template', desc: 'The blank competitive matrix from this guide, ready to fill in for your top competitors.' },
      'fractional-cmo':              { asset: 'Fractional CMO Scope of Work Template', desc: 'What good fractional CMO deliverables look like: scope, KPIs, and 90-day milestones.' },
      'fractional-cro':              { asset: 'Fractional CRO Playbook', desc: 'Revenue leadership scope, benchmarks, and what a fractional CRO should deliver in 90 days.' },
      'gtm':                         { asset: 'GTM Strategy Framework', desc: 'The go-to-market framework used by AI-native B2B companies to pick their motion and execute.' },
      'marketing-budget':            { asset: 'Marketing Budget Template', desc: 'B2B marketing budget breakdown by stage, channel, and headcount, pre-built spreadsheet.' },
      'demand-generation':           { asset: 'Demand Gen vs Lead Gen Playbook', desc: "The complete playbook for building demand gen programs that don't depend on existing search volume." },
      'default':                     { asset: 'AI-Native GTM Playbook', desc: 'The Treetop framework for building AI-native go-to-market programs that scale without adding headcount.' },
    },
  };

  // ── UTILS ─────────────────────────────────────────────────────────────────
  function getSlugKey() {
    const path = window.location.pathname.replace(/\//g, '');
    for (const key of Object.keys(CONFIG.offers)) {
      if (key !== 'default' && path.includes(key)) return key;
    }
    return 'default';
  }

  function getOffer() {
    return CONFIG.offers[getSlugKey()];
  }

  function isSupressed() {
    const val = localStorage.getItem('tt_lc_dismissed');
    if (!val) return false;
    return (Date.now() - parseInt(val)) < CONFIG.suppressDays * 86400000;
  }

  function suppress() {
    localStorage.setItem('tt_lc_dismissed', Date.now().toString());
  }

  function injectStyles() {
    if (document.getElementById('tt-lc-styles')) return;
    const style = document.createElement('style');
    style.id = 'tt-lc-styles';
    style.textContent = `
      /* ── STICKY BAR ── */
      #tt-sticky-bar {
        position: fixed; bottom: 0; left: 0; right: 0; z-index: 9000;
        background: #1a1a2e; color: #fff;
        padding: 12px 20px;
        display: flex; align-items: center; justify-content: space-between; gap: 16px;
        flex-wrap: wrap;
        box-shadow: 0 -2px 12px rgba(0,0,0,.25);
        transform: translateY(100%);
        transition: transform .35s cubic-bezier(.4,0,.2,1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      #tt-sticky-bar.visible { transform: translateY(0); }
      #tt-sticky-bar .tt-sb-text { font-size: .88rem; color: #cbd5e1; flex: 1; min-width: 200px; }
      #tt-sticky-bar .tt-sb-text strong { color: #fff; }
      #tt-sticky-bar .tt-sb-form { display: flex; gap: 8px; flex-wrap: wrap; }
      #tt-sticky-bar input[type=email] {
        padding: 8px 12px; border-radius: 5px; border: none;
        font-size: .88rem; min-width: 220px; outline: none;
      }
      #tt-sticky-bar button.tt-sb-cta {
        background: #6366f1; color: #fff; border: none; border-radius: 5px;
        padding: 8px 16px; font-size: .88rem; font-weight: 600; cursor: pointer;
        white-space: nowrap;
      }
      #tt-sticky-bar button.tt-sb-cta:hover { background: #4f46e5; }
      #tt-sticky-bar .tt-sb-close {
        background: none; border: none; color: #64748b; cursor: pointer;
        font-size: 1.2rem; padding: 0 4px; line-height: 1;
      }
      #tt-sticky-bar .tt-sb-close:hover { color: #fff; }

      /* ── EXIT POPUP ── */
      #tt-popup-overlay {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(0,0,0,.55);
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
        opacity: 0; pointer-events: none;
        transition: opacity .25s;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      #tt-popup-overlay.visible { opacity: 1; pointer-events: all; }
      #tt-popup {
        background: #fff; border-radius: 12px;
        max-width: 480px; width: 100%;
        padding: 36px 32px;
        position: relative;
        transform: translateY(16px);
        transition: transform .25s;
      }
      #tt-popup-overlay.visible #tt-popup { transform: translateY(0); }
      #tt-popup .tt-p-eyebrow {
        font-size: .72rem; font-weight: 700; letter-spacing: .1em;
        text-transform: uppercase; color: #6366f1; margin-bottom: 10px;
      }
      #tt-popup h3 { font-size: 1.35rem; font-weight: 700; color: #1a1a2e; margin: 0 0 10px; line-height: 1.3; }
      #tt-popup p { font-size: .9rem; color: #64748b; margin: 0 0 20px; line-height: 1.65; }
      #tt-popup .tt-p-form { display: flex; flex-direction: column; gap: 10px; }
      #tt-popup .tt-p-form input[type=email] {
        padding: 11px 14px; border: 1.5px solid #e2e8f0; border-radius: 6px;
        font-size: .93rem; outline: none;
      }
      #tt-popup .tt-p-form input[type=email]:focus { border-color: #6366f1; }
      #tt-popup .tt-p-form button {
        background: #6366f1; color: #fff; border: none; border-radius: 6px;
        padding: 12px; font-size: .95rem; font-weight: 600; cursor: pointer;
      }
      #tt-popup .tt-p-form button:hover { background: #4f46e5; }
      #tt-popup .tt-p-skip {
        display: block; text-align: center; margin-top: 12px;
        font-size: .8rem; color: #94a3b8; cursor: pointer; text-decoration: underline;
      }
      #tt-popup .tt-p-close {
        position: absolute; top: 14px; right: 16px;
        background: none; border: none; font-size: 1.4rem;
        color: #94a3b8; cursor: pointer; line-height: 1;
      }
      #tt-popup .tt-p-close:hover { color: #1a1a2e; }
      #tt-popup .tt-p-success {
        text-align: center; padding: 16px 0;
        display: none;
      }
      #tt-popup .tt-p-success .icon { font-size: 2.5rem; margin-bottom: 10px; }
      #tt-popup .tt-p-success h4 { color: #1a1a2e; font-size: 1.1rem; margin-bottom: 6px; }
      #tt-popup .tt-p-success p { color: #64748b; font-size: .88rem; }
    `;
    document.head.appendChild(style);
  }

  // ── STICKY BAR ────────────────────────────────────────────────────────────
  function initStickyBar() {
    if (isSupressed()) return;
    const offer = getOffer();

    const bar = document.createElement('div');
    bar.id = 'tt-sticky-bar';
    bar.innerHTML = `
      <div class="tt-sb-text"><strong>Free download:</strong> ${offer.asset} — ${offer.desc}</div>
      <div class="tt-sb-form">
        <input type="email" placeholder="your@email.com" aria-label="Email address">
        <button class="tt-sb-cta">Send it to me</button>
      </div>
      <button class="tt-sb-close" aria-label="Close">×</button>
    `;
    document.body.appendChild(bar);

    // Show after scroll threshold
    let shown = false;
    let timer;
    window.addEventListener('scroll', () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (!shown && pct >= CONFIG.stickyScrollThreshold) {
        shown = true;
        timer = setTimeout(() => bar.classList.add('visible'), CONFIG.stickyBarDelay);
      }
    }, { passive: true });

    // Close
    bar.querySelector('.tt-sb-close').addEventListener('click', () => {
      bar.classList.remove('visible');
      suppress();
      clearTimeout(timer);
    });

    // Submit
    bar.querySelector('.tt-sb-cta').addEventListener('click', () => {
      const email = bar.querySelector('input[type=email]').value.trim();
      if (!email || !email.includes('@')) {
        bar.querySelector('input[type=email]').focus();
        return;
      }
      submitEmail(email, offer.asset, () => {
        bar.innerHTML = `<div style="text-align:center;width:100%;font-size:.9rem;color:#a5b4fc;">✓ &nbsp;Check your inbox — we'll send the download shortly.</div>`;
        suppress();
        setTimeout(() => bar.classList.remove('visible'), 3000);
      });
    });
  }

  // ── EXIT INTENT POPUP ─────────────────────────────────────────────────────
  function initExitIntent() {
    if (isSupressed()) return;
    const offer = getOffer();

    const overlay = document.createElement('div');
    overlay.id = 'tt-popup-overlay';
    overlay.innerHTML = `
      <div id="tt-popup">
        <button class="tt-p-close" aria-label="Close">×</button>
        <div class="tt-p-eyebrow">Free Download</div>
        <h3>Before you go — grab the ${offer.asset}</h3>
        <p>${offer.desc}</p>
        <div class="tt-p-form">
          <input type="email" placeholder="your@email.com" aria-label="Email address">
          <button>Send me the download</button>
          <span class="tt-p-skip">No thanks, I don't need it</span>
        </div>
        <div class="tt-p-success">
          <div class="icon">✓</div>
          <h4>You're in.</h4>
          <p>Check your inbox — the download is on its way.</p>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    let triggered = false;

    // Desktop: mouse leaves viewport top
    document.addEventListener('mouseleave', (e) => {
      if (e.clientY <= 0 && !triggered && !isSupressed()) {
        triggered = true;
        overlay.classList.add('visible');
      }
    });

    // Mobile: back button / time on page (30s)
    let mobileTimer = setTimeout(() => {
      if (!triggered && !isSupressed() && window.innerWidth < 768) {
        triggered = true;
        overlay.classList.add('visible');
      }
    }, 30000);

    function closePopup() {
      overlay.classList.remove('visible');
      suppress();
      clearTimeout(mobileTimer);
    }

    overlay.querySelector('.tt-p-close').addEventListener('click', closePopup);
    overlay.querySelector('.tt-p-skip').addEventListener('click', closePopup);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });

    overlay.querySelector('.tt-p-form button').addEventListener('click', () => {
      const email = overlay.querySelector('input[type=email]').value.trim();
      if (!email || !email.includes('@')) {
        overlay.querySelector('input[type=email]').focus();
        return;
      }
      submitEmail(email, offer.asset, () => {
        overlay.querySelector('.tt-p-form').style.display = 'none';
        overlay.querySelector('.tt-p-success').style.display = 'block';
        suppress();
        setTimeout(closePopup, 3000);
      });
    });
  }

  // ── FORM SUBMISSION ───────────────────────────────────────────────────────
  function submitEmail(email, asset, onSuccess) {
    // Replace CONFIG.formAction with your actual endpoint.
    // Formspree is the simplest — sign up at formspree.io, create a form, paste the ID above.
    fetch(CONFIG.formAction, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, asset, source: window.location.pathname }),
    })
    .then(r => r.ok ? onSuccess() : console.warn('Form submission failed'))
    .catch(() => onSuccess()); // Fail gracefully — show success even if endpoint isn't set up yet
  }

  // ── INIT ──────────────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    initStickyBar();
    // Slight delay on exit intent so it doesn't fire before page is fully read
    setTimeout(initExitIntent, 5000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
