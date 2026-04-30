(function () {
  'use strict';

  var RAF = window.requestAnimationFrame || function (cb) { setTimeout(cb, 16); };
  var motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Shared scroll state ── */
  var scenes = [];
  var parallaxHosts = [];
  var catalogGroups = [];
  var ebookFeature = null;
  var ticking = false;

  /* ── Collect parallax targets ── */
  function collectScenes() {
    document.querySelectorAll('.scene-break').forEach(function (scene) {
      var wrap = scene.querySelector('.scene-parallax-wrap');
      if (wrap) scenes.push({ scene: scene, wrap: wrap });
    });
  }

  function collectParallaxHosts() {
    document.querySelectorAll('.parallax-host').forEach(function (host) {
      var img = host.querySelector('.parallax-img');
      if (img) parallaxHosts.push({ host: host, img: img });
    });
  }

  function collectCatalogGroups() {
    document.querySelectorAll(
      '.catalog-group.tools-highlight,' +
      '.catalog-group.consumables-highlight,' +
      '.catalog-group.gear-highlight'
    ).forEach(function (el) { catalogGroups.push(el); });
    ebookFeature = document.querySelector('.ebook-feature');
  }

  /* ── Scroll update ── */
  function onScroll() {
    if (!ticking) { RAF(update); ticking = true; }
  }

  function update() {
    ticking = false;
    var viewH = window.innerHeight;

    /* Scene background parallax (slower layer behind Ken Burns) */
    if (motionOk) {
      scenes.forEach(function (s) {
        var rect = s.scene.getBoundingClientRect();
        var mid = rect.top + rect.height * 0.5;
        var progress = (viewH * 0.5 - mid) / (viewH + rect.height);
        var offset = progress * 130;
        s.wrap.style.transform = 'translate3d(0,' + offset + 'px,0)';
      });

      /* Generic parallax image hosts */
      parallaxHosts.forEach(function (p) {
        var rect = p.host.getBoundingClientRect();
        var mid = rect.top + rect.height * 0.5;
        var progress = (viewH * 0.5 - mid) / (viewH + rect.height);
        p.img.style.transform = 'translate3d(0,' + (progress * 50) + 'px,0) scale(1.06)';
      });

      /* Catalog group deep parallax (stacks on main.js --section-shift) */
      catalogGroups.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var mid = rect.top + rect.height * 0.5;
        var delta = viewH * 0.5 - mid;
        var shift = Math.max(-20, Math.min(20, delta * 0.04));
        el.style.setProperty('--cine-extra-shift', shift.toFixed(2) + 'px');
      });

      /* Ebook section deep parallax */
      if (ebookFeature) {
        var rect = ebookFeature.getBoundingClientRect();
        var mid = rect.top + rect.height * 0.5;
        var delta = viewH * 0.5 - mid;
        var shift = Math.max(-20, Math.min(20, delta * 0.04));
        ebookFeature.style.setProperty('--cine-extra-shift', shift.toFixed(2) + 'px');
      }
    }
  }

  /* ── Scene text reveal ── */
  function initSceneReveal() {
    var els = document.querySelectorAll('.scene-break');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('scene-visible'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('scene-visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.22 });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ── Generic clip-path reveals ── */
  function initClipReveals() {
    var els = document.querySelectorAll('.cinematic-clip-reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('cinematic-in-view'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('cinematic-in-view'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ── Mouse tilt on scene sections ── */
  function initSceneTilt() {
    if (!motionOk) return;
    document.querySelectorAll('.scene-break').forEach(function (scene) {
      var content = scene.querySelector('.scene-content');
      if (!content) return;
      scene.addEventListener('mousemove', function (e) {
        var rect = scene.getBoundingClientRect();
        var dx = (e.clientX - rect.left - rect.width  * 0.5) / rect.width;
        var dy = (e.clientY - rect.top  - rect.height * 0.5) / rect.height;
        content.style.transform =
          'translate3d(' + (dx * 8) + 'px,' + (dy * 5) + 'px,0)' +
          'rotateX(' + (-dy * 2) + 'deg)' +
          'rotateY(' + (dx * 3) + 'deg)';
      });
      scene.addEventListener('mouseleave', function () { content.style.transform = ''; });
    });
  }

  /* ── Section heading staggered reveals ── */
  function initSectionHeadReveals() {
    var heads = document.querySelectorAll('.section-head');
    if (!heads.length) return;

    /* Mark children with animation classes */
    heads.forEach(function (head) {
      head.querySelectorAll('.pill, [class*="pill"]').forEach(function (el) {
        el.classList.add('cine-head-pill');
      });
      var h2 = head.querySelector('h2');
      if (h2) h2.classList.add('cine-head-title');
      var sub = head.querySelector('p.muted, p[data-i18n]');
      if (sub) sub.classList.add('cine-head-sub');
    });

    if (!('IntersectionObserver' in window)) {
      heads.forEach(function (h) { h.classList.add('cine-visible'); });
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('cine-visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.18 });

    heads.forEach(function (h) { obs.observe(h); });
  }

  /* ── Why/Highlights grid reveal ── */
  function initWhyGridReveal() {
    var grid = document.querySelector('.why-grid');
    if (!grid) return;
    if (!('IntersectionObserver' in window)) {
      grid.classList.add('cine-visible');
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('cine-visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.18 });
    obs.observe(grid);
  }

  /* ── FAQ item stagger reveal ── */
  function animateFAQItems(items) {
    items.forEach(function (item, i) {
      item.classList.add('cine-enter');
      item.style.setProperty('--stagger-delay', (i * 65) + 'ms');
      /* Double RAF to ensure transition property is applied before state change */
      RAF(function () {
        RAF(function () { item.classList.add('cine-in'); });
      });
    });
  }

  function initFAQReveal() {
    var list = document.getElementById('faqList');
    if (!list) return;

    /* Items may already be present */
    var existing = list.querySelectorAll('.faq-item');
    if (existing.length) { animateFAQItems(Array.from(existing)); return; }

    /* Watch for dynamic insertion */
    if (!('MutationObserver' in window)) return;
    var mo = new MutationObserver(function (mutations) {
      var added = [];
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('faq-item')) {
              added.push(node);
            } else {
              node.querySelectorAll && node.querySelectorAll('.faq-item').forEach(function (n) { added.push(n); });
            }
          }
        });
      });
      if (added.length) { animateFAQItems(added); mo.disconnect(); }
    });
    mo.observe(list, { childList: true, subtree: true });
  }

  /* ── Review card stagger reveal ── */
  function animateReviewCards(cards) {
    cards.forEach(function (card, i) {
      card.classList.add('cine-enter');
      card.style.setProperty('--stagger-delay', (i * 55) + 'ms');
      RAF(function () {
        RAF(function () { card.classList.add('cine-in'); });
      });
    });
  }

  function initReviewReveal() {
    var list = document.getElementById('reviewsList');
    if (!list) return;

    var existing = list.querySelectorAll('.review-card');
    if (existing.length) { animateReviewCards(Array.from(existing)); return; }

    if (!('MutationObserver' in window)) return;
    var mo = new MutationObserver(function (mutations) {
      var added = [];
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('review-card')) {
              added.push(node);
            } else {
              node.querySelectorAll && node.querySelectorAll('.review-card').forEach(function (n) { added.push(n); });
            }
          }
        });
      });
      if (added.length) animateReviewCards(added);
    });
    mo.observe(list, { childList: true, subtree: true });
  }

  /* ── Boot ── */
  function init() {
    collectScenes();
    collectParallaxHosts();
    collectCatalogGroups();

    initSceneReveal();
    initClipReveals();
    initSceneTilt();
    initSectionHeadReveals();
    initWhyGridReveal();
    initFAQReveal();
    initReviewReveal();

    var needsScroll = scenes.length || parallaxHosts.length || catalogGroups.length || ebookFeature;
    if (needsScroll) {
      window.addEventListener('scroll', onScroll, { passive: true });
      update();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
