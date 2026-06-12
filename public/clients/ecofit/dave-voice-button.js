/* ================================================================
 *  Dave Voice Button. EcoFIT Content Calendar.
 *  Treetop Growth Strategy
 *  
 *  Auto-injects "Draft this in Dave's voice" buttons next to every
 *  Dave Johnson card on the EcoFIT content calendar. Each click
 *  copies a complete Claude-ready prompt to the clipboard with the
 *  campaign title and Dave card description baked in.
 * ================================================================ */
(function() {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    injectStyles();
    const count = injectButtons();
    console.log('[Dave Voice Button] Injected ' + count + ' button(s).');
  }

  /* ---------- Styles ---------- */
  function injectStyles() {
    if (document.getElementById('tt-dave-styles')) return;
    const css = `
      .tt-dave-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 14px;
        padding: 10px 18px;
        background: #84BC41;
        color: #0a1f1a;
        font-family: 'Work Sans', system-ui, -apple-system, sans-serif;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        text-decoration: none;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        line-height: 1;
        box-shadow: 0 2px 8px rgba(132,188,65,0.15);
      }
      .tt-dave-btn:hover {
        background: #9fd454;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(132,188,65,0.3);
      }
      .tt-dave-btn:active { transform: translateY(0); }
      .tt-dave-btn.tt-copied {
        background: #1a3d31;
        color: #84BC41;
        border: 1px solid #84BC41;
      }
      .tt-dave-btn .tt-icon { font-size: 14px; line-height: 1; }
      .tt-dave-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #143329;
        color: #ecf2ec;
        font-family: 'Work Sans', system-ui, -apple-system, sans-serif;
        font-size: 13px;
        line-height: 1.5;
        padding: 16px 22px;
        border-radius: 8px;
        border-left: 3px solid #84BC41;
        box-shadow: 0 12px 32px rgba(0,0,0,0.35);
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        z-index: 9999;
        max-width: 360px;
        pointer-events: none;
      }
      .tt-dave-toast.show {
        opacity: 1;
        transform: translateY(0);
      }
      .tt-dave-toast strong {
        display: block;
        color: #84BC41;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .tt-dave-toast-link {
        display: inline-block;
        margin-top: 8px;
        color: #84BC41;
        font-size: 12px;
        font-weight: 600;
        text-decoration: underline;
        pointer-events: auto;
      }
    `;
    const style = document.createElement('style');
    style.id = 'tt-dave-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ---------- Button injection ---------- */
  function injectButtons() {
    // Strategy: find every element whose direct text content is "Dave Johnson"
    // (headings, names, labels). Filter to those that look like name labels
    // attached to a description.
    const candidates = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function(node) {
          // Skip script, style, our own buttons
          if (['SCRIPT','STYLE','BUTTON'].includes(node.tagName)) {
            return NodeFilter.FILTER_SKIP;
          }
          // Match element whose immediate text is exactly "Dave Johnson"
          const text = (node.textContent || '').trim();
          if (text === 'Dave Johnson') {
            // Only direct-text matches, not containers that have it nested deep
            const directText = Array.from(node.childNodes)
              .filter(n => n.nodeType === 3)
              .map(n => n.textContent.trim())
              .join('').trim();
            if (directText === 'Dave Johnson' || text === 'Dave Johnson') {
              return NodeFilter.FILTER_ACCEPT;
            }
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );
    let n;
    while ((n = walker.nextNode())) candidates.push(n);

    // Dedupe by closest card container
    const seen = new Set();
    let count = 0;

    candidates.forEach((daveEl, idx) => {
      try {
        const ctx = extractContext(daveEl);
        if (!ctx || !ctx.description) return;

        // Use container element as dedupe key
        if (ctx.container) {
          if (seen.has(ctx.container)) return;
          seen.add(ctx.container);
        }

        const btn = makeButton(ctx);

        // Insert button right after the description element
        if (ctx.descriptionEl && ctx.descriptionEl.parentNode) {
          ctx.descriptionEl.insertAdjacentElement('afterend', btn);
        } else {
          daveEl.parentNode.insertBefore(btn, daveEl.nextSibling);
        }
        count++;
      } catch (err) {
        console.warn('[Dave Voice Button] Skipped card:', err);
      }
    });

    return count;
  }

  /* ---------- Extract campaign context from DOM ---------- */
  function extractContext(daveEl) {
    let title = null;
    let descriptionEl = null;
    let container = null;
    let channel = 'LinkedIn post';
    let length = '150 to 200 words';

    // Walk up to find the campaign card container.
    // A "container" here is the ancestor that holds both the
    // campaign title (h2/h3) AND the Dave card.
    let cur = daveEl;
    for (let i = 0; i < 12 && cur && cur !== document.body; i++) {
      cur = cur.parentElement;
      if (!cur) break;
      // Look for a campaign title (h2 typically) that isn't "Dave Johnson"
      const headings = cur.querySelectorAll('h1, h2, h3');
      for (const h of headings) {
        const t = h.textContent.trim();
        if (t && t !== 'Dave Johnson' && t.length > 8 && t.length < 200) {
          title = t;
          container = cur;
          break;
        }
      }
      if (title) break;
    }

    // Find the Dave description: nearest paragraph/text block AFTER the Dave Johnson label
    // Check next siblings first
    let nextSearch = daveEl.nextElementSibling;
    while (nextSearch && !descriptionEl) {
      if (isDescriptionLike(nextSearch)) {
        descriptionEl = nextSearch;
        break;
      }
      nextSearch = nextSearch.nextElementSibling;
    }

    // If no sibling description, look at parent's next siblings
    if (!descriptionEl && daveEl.parentElement) {
      let sib = daveEl.parentElement.nextElementSibling;
      let steps = 0;
      while (sib && !descriptionEl && steps < 5) {
        if (isDescriptionLike(sib)) {
          descriptionEl = sib;
          break;
        }
        // Also check INSIDE this sibling
        const innerP = sib.querySelector('p');
        if (innerP && innerP.textContent.trim().length > 30) {
          descriptionEl = innerP;
          break;
        }
        sib = sib.nextElementSibling;
        steps++;
      }
    }

    // Look broader in parent container. Find any p near daveEl.
    if (!descriptionEl && daveEl.parentElement && daveEl.parentElement.parentElement) {
      const wrap = daveEl.parentElement.parentElement;
      const paragraphs = wrap.querySelectorAll('p');
      for (const p of paragraphs) {
        const t = p.textContent.trim();
        if (t.length > 30 && t !== 'Dave Johnson' && t !== title) {
          // Check it comes after daveEl in document order
          if (daveEl.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING) {
            descriptionEl = p;
            break;
          }
        }
      }
    }

    const description = descriptionEl ? descriptionEl.textContent.trim() : '';

    // Channel inference: look around for "LinkedIn", "Email", etc.
    // For Week 1 Dave cards, default is LinkedIn post.
    const surrounding = (daveEl.parentElement || daveEl).textContent.toLowerCase();
    if (surrounding.includes('long-form') || surrounding.includes('article')) {
      // Still a Dave LinkedIn post. Long form is separate.
    }

    return {
      title: title || 'EcoFIT campaign',
      description: description,
      descriptionEl: descriptionEl,
      container: container,
      channel: channel,
      length: length
    };
  }

  function isDescriptionLike(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'P' || tag === 'DIV') {
      const text = el.textContent.trim();
      // Description should be longer than a label, but not a whole campaign
      if (text.length > 30 && text.length < 800 && text !== 'Dave Johnson') {
        return true;
      }
    }
    return false;
  }

  /* ---------- Build the button ---------- */
  function makeButton(ctx) {
    const btn = document.createElement('button');
    btn.className = 'tt-dave-btn';
    btn.type = 'button';
    btn.innerHTML = '<span class="tt-icon">✦</span> Draft this in Dave\'s voice';
    btn.setAttribute('aria-label', 'Copy a Dave-voice prompt for: ' + ctx.title);

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      const prompt = buildPrompt(ctx);
      copyToClipboard(prompt).then(function() {
        btn.classList.add('tt-copied');
        btn.innerHTML = '<span class="tt-icon">✓</span> Copied. Paste into Claude';
        showToast(ctx.title);
        setTimeout(function() {
          btn.classList.remove('tt-copied');
          btn.innerHTML = '<span class="tt-icon">✦</span> Draft this in Dave\'s voice';
        }, 4000);
      }).catch(function(err) {
        console.error('[Dave Voice Button] Copy failed:', err);
        btn.innerHTML = '<span class="tt-icon">!</span> Copy failed. Try again';
      });
    });

    return btn;
  }

  /* ---------- The Dave-voice prompt ---------- */
  function buildPrompt(ctx) {
    return [
      "You are writing as Dave Johnson, senior operator at EcoFIT.",
      "",
      "# Dave's voice",
      "Thinks out loud. Stacked enthusiasm. Specific and named (Matrix, EOS, Woodway, 330 sensors, 40 locations). Closer energy. Self-aware. Phone-call energy, never LinkedIn-influencer.",
      "",
      "# Signature phrases to lift naturally",
      '"low-hanging fruit" (governing instinct), "here\'s the thing", "candidly", "anyhow", "right?", "I mean", "moving pretty fast", "get rolling", "spin things up", "cruise control", "are we ready?", "cool stuff", "I think we\'re overthinking it", "I don\'t know enough about this, but..."',
      "",
      "# Hard rules",
      "NEVER use em dashes. Use periods, commas, colons, parentheses.",
      "NEVER use: leverage, synergy, best-in-class, excited to announce, circling back, at the end of the day, thought leader, actionable insights, in today's landscape, deep dive, game-changer, paradigm shift, stakeholders, win-win.",
      "Short sentences. 12 to 18 words average. End with a decision or a question.",
      "",
      "# Example (LinkedIn, operations win, ~95 words)",
      "Spent the morning with the Matrix team mapping out how we instrument 40 locations with one telemetry layer. 330 sensors, one dashboard, one source of truth on equipment health.",
      "",
      "Here's the thing. Most multi-site operators are flying blind on equipment downtime, and downtime is the most expensive thing nobody measures.",
      "",
      "We're moving pretty fast on this. Are we ready? Yeah, I think we are.",
      "",
      "# Your task",
      "Write a " + ctx.channel + " draft for this EcoFIT campaign.",
      "",
      "Campaign title:",
      ctx.title,
      "",
      "Campaign angle (Dave's notes from the content calendar):",
      ctx.description,
      "",
      "Target length: " + ctx.length + ".",
      "",
      "Write in Dave's voice, following every rule above. Don't explain the voice. Don't add headers or preamble. Just give me the post copy, ready to paste into LinkedIn."
    ].join("\n");
  }

  /* ---------- Clipboard ---------- */
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function(resolve, reject) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) resolve(); else reject(new Error('execCommand returned false'));
      } catch (err) {
        document.body.removeChild(ta);
        reject(err);
      }
    });
  }

  /* ---------- Toast notification ---------- */
  function showToast(campaignTitle) {
    let toast = document.querySelector('.tt-dave-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'tt-dave-toast';
      document.body.appendChild(toast);
    }
    const shortTitle = campaignTitle.length > 60
      ? campaignTitle.slice(0, 60) + '...'
      : campaignTitle;
    toast.innerHTML =
      '<strong>Prompt copied</strong>' +
      'Paste into Claude or ChatGPT for: ' + shortTitle +
      '<a href="https://claude.ai/new" target="_blank" rel="noopener" class="tt-dave-toast-link">Open Claude.ai →</a>';

    requestAnimationFrame(function() {
      toast.classList.add('show');
      clearTimeout(toast._hideTimer);
      toast._hideTimer = setTimeout(function() {
        toast.classList.remove('show');
      }, 4500);
    });
  }

})();
