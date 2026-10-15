/* =========================================================
   DAT LAWN GUY — motion.js
   Springs, reveals, scroll-linked motion and drag rails.
   Everything reads live values each frame and every gesture
   can be interrupted.
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var allowMotion = function () { return !reduceQuery.matches; };

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var vh = window.innerHeight;

  /* ---------- Spring: damping ratio + response (seconds), mass 1 ---------- */
  function Spring(opts) {
    opts = opts || {};
    this.value = opts.value || 0;
    this.target = this.value;
    this.velocity = 0;
    this.configure(opts.damping == null ? 1 : opts.damping, opts.response || 0.4);
    this.onUpdate = opts.onUpdate || null;
    this.onRest = opts.onRest || null;
    this.raf = 0;
    this.last = 0;
    this.tick = this.tick.bind(this);
  }
  Spring.prototype.configure = function (damping, response) {
    this.stiffness = Math.pow((2 * Math.PI) / response, 2);
    this.damping = (4 * Math.PI * damping) / response;
  };
  // Re-target from the current value and velocity: interruptible by design
  Spring.prototype.to = function (target, velocity) {
    this.target = target;
    if (velocity != null) this.velocity = velocity;
    if (!allowMotion()) { this.set(target); return this; }
    if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); }
    return this;
  };
  Spring.prototype.set = function (value) {
    this.stop();
    this.value = this.target = value;
    this.velocity = 0;
    if (this.onUpdate) this.onUpdate(value, 0);
    return this;
  };
  Spring.prototype.stop = function () {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  };
  Spring.prototype.tick = function (now) {
    var dt = Math.min(0.064, (now - this.last) / 1000);
    this.last = now;
    var steps = Math.max(1, Math.ceil(dt / 0.004));
    var h = dt / steps;
    for (var i = 0; i < steps; i++) {
      var force = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
      this.velocity += force * h;
      this.value += this.velocity * h;
    }
    var resting = Math.abs(this.value - this.target) < 0.05 && Math.abs(this.velocity) < 0.05;
    if (resting) { this.value = this.target; this.velocity = 0; }
    if (this.onUpdate) this.onUpdate(this.value, this.velocity);
    if (resting) { this.raf = 0; if (this.onRest) this.onRest(); return; }
    this.raf = requestAnimationFrame(this.tick);
  };

  // Where a flick would come to rest (scroll-style exponential deceleration)
  function project(velocity, rate) {
    rate = rate || 0.998;
    return ((velocity / 1000) * rate) / (1 - rate);
  }

  function rubberband(overshoot, dimension) {
    var c = 0.55;
    return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
  }

  // Short pointer history so release velocity is honest
  function VelocityTracker() { this.samples = []; }
  VelocityTracker.prototype.add = function (x, y) {
    var t = performance.now();
    this.samples.push({ x: x, y: y, t: t });
    while (this.samples.length > 2 && t - this.samples[0].t > 100) this.samples.shift();
  };
  VelocityTracker.prototype.get = function () {
    var s = this.samples;
    if (s.length < 2) return { x: 0, y: 0 };
    var a = s[0], b = s[s.length - 1];
    var dt = Math.max(1, b.t - a.t) / 1000;
    return { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt };
  };
  VelocityTracker.prototype.reset = function () { this.samples = []; };

  /* ---------- Split headings into masked words ---------- */
  function splitNode(node, state) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var parts = child.textContent.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        parts.forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          var w = document.createElement("span");
          w.className = "w";
          var inner = document.createElement("span");
          inner.textContent = part;
          inner.style.setProperty("--i", state.i++);
          w.appendChild(inner);
          frag.appendChild(w);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1 && child.tagName !== "BR") {
        splitNode(child, state);
      }
    });
  }
  function splitAll(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll("[data-split]"), function (el) {
      if (el.querySelector(".w")) return;
      splitNode(el, { i: 0 });
      el.classList.add("split");
    });
  }

  /* ---------- Reveal on enter ---------- */
  var revealObserver = null;
  function observeReveals(scope) {
    var targets = (scope || document).querySelectorAll("[data-reveal]:not(.is-in), [data-split]:not(.is-in)");
    if (!allowMotion() || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(targets, function (el) { el.classList.add("is-in"); });
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    }
    Array.prototype.forEach.call(targets, function (el) { revealObserver.observe(el); });
  }

  /* ---------- Statement: words light up with reading progress ---------- */
  var wordBlocks = [];
  function initWords() {
    wordBlocks = Array.prototype.slice.call(document.querySelectorAll("[data-words]")).map(function (el) {
      var text = el.textContent.trim();
      el.innerHTML = text.split(/\s+/).map(function (w) { return '<span class="wd">' + w + "</span>"; }).join(" ");
      el.classList.add("words");
      return { el: el, words: Array.prototype.slice.call(el.querySelectorAll(".wd")), lit: -1 };
    });
  }
  function updateWords() {
    wordBlocks.forEach(function (b) {
      var r = b.el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.3), 0, 1);
      var lit = Math.round(p * b.words.length);
      if (lit === b.lit) return;
      b.lit = lit;
      b.words.forEach(function (w, i) { w.classList.toggle("on", i < lit); });
    });
  }

  /* ---------- Counters ---------- */
  function formatCount(el, value) {
    var decimals = Number(el.dataset.decimals || 0);
    var lang = root.lang === "en" ? "en-US" : "de-DE";
    var num = new Intl.NumberFormat(lang, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
    return num + (el.dataset.suffix || "");
  }
  function initCounters() {
    var els = document.querySelectorAll("[data-count]");
    Array.prototype.forEach.call(els, function (el) {
      el.textContent = formatCount(el, allowMotion() ? 0 : Number(el.dataset.count));
    });
    if (!allowMotion() || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        var el = entry.target;
        var target = Number(el.dataset.count);
        var start = performance.now();
        (function step(now) {
          var t = clamp((now - start) / 1800, 0, 1);
          el.textContent = formatCount(el, target * easeOut(t));
          if (t < 1) requestAnimationFrame(step);
          else el.dataset.counted = "1";
        })(start);
      });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  }
  function refreshCounters() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-count]"), function (el) {
      if (el.dataset.counted === "1" || !allowMotion()) el.textContent = formatCount(el, Number(el.dataset.count));
    });
  }

  /* ---------- Scroll-linked: parallax, scenes, wordmark, progress ---------- */
  var parallaxEls = [];
  var scenes = [];
  var wordmark = null;
  var progressBar = null;

  function updateScrollLinked() {
    if (allowMotion()) {
      parallaxEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = Number(el.dataset.parallax) || 0.12;
        el.style.setProperty("--py", ((r.top + r.height / 2 - vh / 2) * -speed).toFixed(1) + "px");
      });
      scenes.forEach(function (sc) {
        var r = sc.el.getBoundingClientRect();
        if (r.bottom < -50 || r.top > vh + 50) return;
        var g = clamp((vh - r.top) / r.height, 0, 1);
        sc.el.style.setProperty("--s", (1.16 - 0.16 * easeOut(g)).toFixed(4));
        if (sc.copy) {
          var o = clamp((g - 0.3) / 0.25, 0, 1);
          sc.copy.style.setProperty("--o", o.toFixed(3));
          sc.copy.style.setProperty("--y", (40 * (1 - easeOut(o))).toFixed(1) + "px");
        }
      });
      if (wordmark) {
        var wr = wordmark.getBoundingClientRect();
        if (wr.top < vh) {
          var wp = clamp((vh - wr.top) / (vh * 0.6), 0, 1);
          wordmark.style.setProperty("--wy", (60 * (1 - easeOut(wp))).toFixed(1) + "px");
        }
      }
    }
    if (progressBar) {
      var max = Math.max(1, document.documentElement.scrollHeight - vh);
      progressBar.style.setProperty("--p", clamp(window.scrollY / max, 0, 1).toFixed(4));
    }
    updateWords();
  }

  var ticking = false;
  function requestFrame() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; updateScrollLinked(); });
  }

  /* ---------- Magnetic controls (fine pointers only) ---------- */
  function initMagnetic(scope) {
    if (!finePointer.matches || !allowMotion()) return;
    Array.prototype.forEach.call((scope || document).querySelectorAll("[data-magnetic]:not([data-mag-bound])"), function (el) {
      el.dataset.magBound = "1";
      var sx = new Spring({ damping: 0.7, response: 0.35 });
      var sy = new Spring({ damping: 0.7, response: 0.35 });
      var apply = function () { el.style.translate = sx.value.toFixed(2) + "px " + sy.value.toFixed(2) + "px"; };
      sx.onUpdate = apply;
      sy.onUpdate = apply;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        sx.to((e.clientX - (r.left + r.width / 2)) * 0.28);
        sy.to((e.clientY - (r.top + r.height / 2)) * 0.36);
      });
      el.addEventListener("pointerleave", function () { sx.to(0); sy.to(0); });
    });
  }

  /* ---------- Index list: preview image follows the pointer on springs ---------- */
  function initPreview() {
    var list = document.querySelector("[data-preview]");
    var preview = document.querySelector(".preview");
    if (!list || !preview || !finePointer.matches) return;
    var imgs = {};
    Array.prototype.forEach.call(list.querySelectorAll("[data-img]"), function (row) {
      var src = row.dataset.img;
      if (imgs[src]) return;
      var img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.loading = "lazy";
      preview.appendChild(img);
      imgs[src] = img;
    });
    var w = 300, h = 375;
    var x = new Spring({ damping: 0.85, response: 0.45 });
    var y = new Spring({ damping: 0.85, response: 0.45 });
    var sc = new Spring({ value: 0.6, damping: 0.75, response: 0.4 });
    var paint = function () {
      preview.style.setProperty("--x", (x.value - w / 2).toFixed(1) + "px");
      preview.style.setProperty("--y", (y.value - h / 2).toFixed(1) + "px");
      preview.style.setProperty("--r", clamp(x.velocity * 0.008, -10, 10).toFixed(2) + "deg");
      preview.style.setProperty("--sc", sc.value.toFixed(3));
    };
    x.onUpdate = paint; y.onUpdate = paint; sc.onUpdate = paint;
    var current = null;
    list.addEventListener("pointerenter", function (e) { x.set(e.clientX); y.set(e.clientY); });
    list.addEventListener("pointermove", function (e) {
      x.to(e.clientX);
      y.to(e.clientY);
      var row = e.target.closest("[data-img]");
      if (!row) return;
      if (row !== current) {
        current = row;
        Object.keys(imgs).forEach(function (k) { imgs[k].classList.toggle("on", k === row.dataset.img); });
      }
      preview.classList.add("on");
      sc.to(1);
    });
    list.addEventListener("pointerleave", function () {
      preview.classList.remove("on");
      sc.to(0.6);
      current = null;
    });
  }

  /* ---------- Rails: native scroll + mouse drag with momentum and snap ---------- */
  function initRails(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll("[data-rail]:not([data-rail-bound])"), function (rail) {
      rail.dataset.railBound = "1";
      var cards = function () { return Array.prototype.slice.call(rail.children); };
      var scroller = new Spring({ damping: 1, response: 0.45 });
      scroller.onUpdate = function (v) { rail.scrollLeft = v; };
      scroller.onRest = function () { rail.classList.remove("is-dragging"); };
      var tracker = new VelocityTracker();
      var dragging = false, moved = false, startX = 0, startScroll = 0;

      var maxScroll = function () { return rail.scrollWidth - rail.clientWidth; };
      var snapTarget = function (pos) {
        var center = pos + rail.clientWidth / 2;
        var best = pos, bestD = Infinity;
        cards().forEach(function (c) {
          var cc = c.offsetLeft + c.offsetWidth / 2;
          var d = Math.abs(cc - center);
          if (d < bestD) { bestD = d; best = cc - rail.clientWidth / 2; }
        });
        return clamp(best, 0, maxScroll());
      };

      rail.addEventListener("pointerdown", function (e) {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        scroller.stop();
        dragging = true;
        moved = false;
        startX = e.clientX;
        startScroll = rail.scrollLeft;
        tracker.reset();
        tracker.add(e.clientX, 0);
      });
      window.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - startX;
        if (!moved && Math.abs(dx) > 6) {
          moved = true;
          rail.classList.add("is-dragging");
        }
        if (!moved) return;
        var next = startScroll - dx;
        var max = maxScroll();
        // soft edges instead of a hard stop
        var over = next < 0 ? rubberband(-next, rail.clientWidth) : next > max ? -rubberband(next - max, rail.clientWidth) : 0;
        rail.style.transform = over ? "translateX(" + over.toFixed(1) + "px)" : "";
        rail.scrollLeft = clamp(next, 0, max);
        tracker.add(e.clientX, 0);
      });
      var release = function () {
        if (!dragging) return;
        dragging = false;
        if (!moved) return;
        var v = -tracker.get().x;
        if (rail.style.transform) {
          rail.style.transition = "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
          rail.style.transform = "";
          setTimeout(function () { rail.style.transition = ""; }, 600);
        }
        scroller.value = rail.scrollLeft;
        scroller.velocity = v;
        scroller.to(snapTarget(rail.scrollLeft + project(v, 0.998)));
      };
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
      // a drag is not a click
      rail.addEventListener("click", function (e) {
        if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
      }, true);
      rail.addEventListener("dragstart", function (e) { e.preventDefault(); });

      var wrap = rail.closest(".rail-wrap") || rail.parentElement;
      var prev = wrap.querySelector("[data-rail-prev]");
      var next = wrap.querySelector("[data-rail-next]");
      var step = function (dir) {
        var c = cards()[0];
        var amount = c ? c.offsetWidth + 16 : rail.clientWidth * 0.8;
        rail.classList.add("is-dragging");
        scroller.stop();
        scroller.value = rail.scrollLeft;
        scroller.to(snapTarget(clamp(scroller.target + amount * dir, 0, maxScroll())));
      };
      if (prev) prev.addEventListener("click", function () { step(-1); });
      if (next) next.addEventListener("click", function () { step(1); });

      var paint = function () {
        var center = rail.scrollLeft + rail.clientWidth / 2;
        cards().forEach(function (c) {
          var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center) / rail.clientWidth;
          c.style.setProperty("--sc", allowMotion() ? (1 - Math.min(0.08, d * 0.12)).toFixed(4) : "1");
        });
        if (prev) prev.disabled = rail.scrollLeft < 4;
        if (next) next.disabled = rail.scrollLeft > maxScroll() - 4;
      };
      rail.addEventListener("scroll", function () { requestAnimationFrame(paint); }, { passive: true });
      window.addEventListener("resize", paint, { passive: true });
      paint();
    });
  }

  /* ---------- Ebook cover tilts toward the pointer ---------- */
  function initTilt() {
    var stage = document.querySelector("[data-tilt]");
    if (!stage || !allowMotion()) return;
    var target = stage.querySelector("[data-tilt-target]") || stage.firstElementChild;
    var rx = new Spring({ value: 4, damping: 0.8, response: 0.6 });
    var ry = new Spring({ value: -8, damping: 0.8, response: 0.6 });
    var paint = function () {
      target.style.setProperty("--rx", rx.value.toFixed(2) + "deg");
      target.style.setProperty("--ry", ry.value.toFixed(2) + "deg");
    };
    rx.onUpdate = paint; ry.onUpdate = paint;
    stage.addEventListener("pointermove", function (e) {
      var r = stage.getBoundingClientRect();
      ry.to(((e.clientX - r.left) / r.width - 0.5) * 22);
      rx.to(-((e.clientY - r.top) / r.height - 0.5) * 16);
    });
    stage.addEventListener("pointerleave", function () { rx.to(4); ry.to(-8); });
  }

  /* ---------- Public API ---------- */
  function init() {
    root.classList.toggle("motion", allowMotion());
    parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    scenes = Array.prototype.slice.call(document.querySelectorAll("[data-scene]")).map(function (el) {
      return { el: el, copy: el.querySelector(".scene-copy") };
    });
    wordmark = document.querySelector(".wordmark");
    progressBar = document.querySelector(".progress");

    splitAll();
    initWords();
    // the first screen is visible from the start: its reveals play on load, not on scroll
    Array.prototype.forEach.call(document.querySelectorAll(".hero [data-reveal], .hero [data-split]"), function (el) {
      el.classList.add("is-in");
    });
    observeReveals();
    initCounters();
    initMagnetic();
    initPreview();
    initRails();
    initTilt();
    updateScrollLinked();

    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", function () { vh = window.innerHeight; requestFrame(); }, { passive: true });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { root.classList.add("is-loaded"); });
    });
  }

  // After the language changes, headings get new text: split and show them again
  function refreshText() {
    splitAll();
    Array.prototype.forEach.call(document.querySelectorAll("[data-split]"), function (el) {
      if (el.getBoundingClientRect().top < vh) el.classList.add("is-in");
    });
    initWords();
    updateWords();
    refreshCounters();
    observeReveals();
  }

  reduceQuery.addEventListener && reduceQuery.addEventListener("change", function () { window.location.reload(); });

  window.Motion = {
    Spring: Spring,
    VelocityTracker: VelocityTracker,
    project: project,
    rubberband: rubberband,
    allowMotion: allowMotion,
    init: init,
    refreshText: refreshText,
    observeReveals: observeReveals,
    initMagnetic: initMagnetic,
    initRails: initRails,
  };
})();
