/* ===========================================================================
   mobile-nav.js — collapses the marketing nav behind a toggle below 900px.
   Added 2026-11-15. Pairs with /assets/mobile.css.

   The nav markup is duplicated as flat HTML across index/platform/analytics/
   integrations/blog, so this builds the toggle at runtime rather than asking
   five files to carry the same button.

   Progressive by design. mobile.css only hides the nav once .js-nav is on
   <html>, so if this file fails to load the nav simply wraps and stays usable.
   Loaded synchronously in <head> so .js-nav is set before first paint and the
   menu never flashes open.
   =========================================================================== */
(function () {
  'use strict';

  var BREAKPOINT = 900;

  // Mark the document immediately, before paint, so the collapsed styles apply
  // on the first frame.
  document.documentElement.className += ' js-nav';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  // WCAG 2.4.1 (Level A): a keyboard user must be able to jump past the nav.
  // Injected here rather than added to nine flat HTML files by hand.
  function addSkipLink(nav) {
    if (document.querySelector('.skip-link')) return;
    var target = document.querySelector('main') ||
                 (nav && nav.nextElementSibling) ||
                 document.body.firstElementChild;
    if (!target) return;
    if (!target.id) target.id = 'main-content';
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');

    var skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#' + target.id;
    skip.textContent = 'Skip to content';
    // Focus the target explicitly: following a hash alone does not move focus
    // in every browser, so a screen reader can otherwise stay in the nav.
    skip.addEventListener('click', function () {
      setTimeout(function () { target.focus(); }, 0);
    });
    document.body.insertBefore(skip, document.body.firstChild);
  }

  ready(function () {
    var nav   = document.querySelector('nav');
    addSkipLink(nav);
    if (!nav) return;

    var inner = nav.querySelector('.nav-inner');
    var links = nav.querySelector('.nav-links');
    var acts  = nav.querySelector('.nav-actions');

    // Pages with their own simple header (assessment, press, reports) have no
    // collapsible nav. Leave them alone.
    if (!inner || !links) return;

    if (!links.id) links.id = 'nav-links';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-toggle';
    btn.setAttribute('aria-label', 'Menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', links.id);
    btn.appendChild(document.createElement('span'));

    // Last child of the flex row. The logo carries margin-right:auto on mobile,
    // so the toggle lands hard right without touching the desktop layout.
    inner.appendChild(btn);

    function setOpen(open) {
      nav.classList.toggle('nav-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    btn.addEventListener('click', function () {
      setOpen(nav.className.indexOf('nav-open') === -1);
    });

    // Following a link should not leave the menu hanging open behind the
    // next page, and in-page anchors would otherwise scroll under it.
    [links, acts].forEach(function (group) {
      if (!group) return;
      group.addEventListener('click', function (e) {
        if (e.target.closest('a')) setOpen(false);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.className.indexOf('nav-open') !== -1) {
        setOpen(false);
        btn.focus();
      }
    });

    // Rotating to landscape can cross the breakpoint with the menu open, which
    // would leave the desktop nav in its expanded state.
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (window.innerWidth > BREAKPOINT) setOpen(false);
      }, 150);
    });
  });
})();
