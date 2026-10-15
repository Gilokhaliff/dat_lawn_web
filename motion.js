/* =========================================================
   DAT LAWN GUY — motion.js
   Springs, reveals, scroll-linked motion, drag rails and the
   living lawn in the home hero. Everything reads live values
   each frame and every gesture can be interrupted.
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

  /* ---------- Home hero: a lawn you can brush and mow ---------- */
  function initGrass() {
    var canvas = document.querySelector("[data-grass]");
    if (!canvas || !canvas.getContext) return;
    var hero = canvas.closest(".hero");
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    hero.classList.add("has-canvas");

    var W = 0, H = 0, dpr = 1;
    var blades = [];
    var pointer = { x: -9999, y: -9999, vx: 0, speed: 0, lastX: 0, lastY: 0, lastT: 0 };
    var running = false, visible = true, raf = 0;

    function rand(a, b) { return a + Math.random() * (b - a); }

    function build() {
      W = canvas.clientWidth;
      // phones get fewer pixels to push so the lawn stays smooth
      dpr = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 1.75);
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      var count = Math.round(W * (W < 700 ? 1.5 : 2.1));
      blades = [];
      for (var i = 0; i < count; i++) {
        var depth = Math.pow(Math.random(), 0.8);
        var x = rand(-0.04, 1.04) * W;
        var base = H * (0.6 + depth * 0.44);
        var h = (H * 0.07 + Math.random() * H * 0.08) * (0.35 + depth * 1.1);
        // mowing stripes radiate from the vanishing point
        var stripe = Math.floor(((x - W / 2) / (0.22 + depth * 0.78) + W * 8) / 80) % 2;
        var light = 8 + depth * 22 + stripe * 9 + Math.random() * 4;
        blades.push({
          x: x,
          base: base,
          h: h,
          w: (0.9 + depth * 2.4) * rand(0.8, 1.3),
          depth: depth,
          phase: Math.random() * Math.PI * 2,
          lean: rand(-0.24, 0.24),
          bend: 0,
          bendV: 0,
          cut: 1,
          color: "hsl(" + Math.round(rand(88, 114)) + "," + Math.round(30 + depth * 22) + "%," + light.toFixed(1) + "%)",
        });
      }
      blades.sort(function (a, b) { return a.depth - b.depth; });
    }

    function draw(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // low light on the horizon
      var glow = ctx.createRadialGradient(W * 0.5, H * 0.62, 0, W * 0.5, H * 0.62, Math.max(W, H) * 0.7);
      glow.addColorStop(0, "rgba(120, 160, 90, 0.16)");
      glow.addColorStop(1, "rgba(120, 160, 90, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      var gust = Math.sin(t * 0.00052) * 0.5 + Math.sin(t * 0.0013 + 1.3) * 0.3;
      var interactive = pointer.x > -999;
      for (var i = 0; i < blades.length; i++) {
        var b = blades[i];
        // a coherent wave rolls across the field, with a little individual flutter
        var wave = Math.sin(t * 0.0012 - b.x * 0.0045) * 0.7 + Math.sin(t * 0.0021 + b.phase) * 0.3;
        var sway = wave * 0.09 * (0.4 + b.depth) + gust * 0.12 * (0.5 + b.depth);
        var target = 0;
        if (interactive) {
          var dx = b.x - pointer.x;
          var dy = b.base - b.h * b.cut * 0.5 - pointer.y;
          var R = 120 * (0.5 + b.depth);
          var d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            var f = 1 - Math.sqrt(d2) / R;
            target = (dx >= 0 ? 1 : -1) * f * 0.9 + clamp(pointer.vx * 0.0006, -0.6, 0.6) * f;
            // a fast pass mows the blades down to the pointer height
            if (pointer.speed > 900 && Math.abs(dx) < 18 * (0.6 + b.depth) && pointer.y < b.base && pointer.y > b.base - b.h * b.cut) {
              b.cut = clamp((b.base - pointer.y) / b.h, 0.22, 1);
            }
          }
        }
        // per-blade spring toward its target bend
        b.bendV += (target - b.bend) * 0.09;
        b.bendV *= 0.84;
        b.bend += b.bendV;
        if (b.cut < 1) b.cut = Math.min(1, b.cut + 0.0009);

        var a = b.lean + sway + b.bend;
        var len = b.h * b.cut;
        var tipX = b.x + Math.sin(a) * len;
        var tipY = b.base - Math.cos(a) * len;
        var cx = b.x + Math.sin(a * 0.35) * len * 0.42;
        var cy = b.base - Math.cos(a * 0.35) * len * 0.6;
        ctx.beginPath();
        ctx.moveTo(b.x - b.w / 2, b.base);
        ctx.quadraticCurveTo(cx, cy, tipX, tipY);
        ctx.quadraticCurveTo(cx, cy, b.x + b.w / 2, b.base);
        ctx.fillStyle = b.color;
        ctx.fill();
      }

      // mist that lets the far lawn dissolve into the night
      var mist = ctx.createLinearGradient(0, H * 0.42, 0, H * 0.74);
      mist.addColorStop(0, "rgba(11, 17, 13, 1)");
      mist.addColorStop(1, "rgba(11, 17, 13, 0)");
      ctx.fillStyle = mist;
      ctx.fillRect(0, H * 0.42, W, H * 0.32);
      ctx.fillStyle = "rgb(11, 17, 13)";
      ctx.fillRect(0, 0, W, H * 0.42);

      pointer.speed *= 0.9;
      pointer.vx *= 0.9;
    }

    function loop(t) {
      raf = 0;
      if (!running) return;
      draw(t);
      raf = requestAnimationFrame(loop);
    }
    function start() {
      if (running || !allowMotion()) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    hero.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;
      var now = performance.now();
      var dt = Math.max(8, now - pointer.lastT) / 1000;
      if (pointer.x > -999) {
        var vx = (x - pointer.lastX) / dt;
        var vy = (y - pointer.lastY) / dt;
        pointer.vx = pointer.vx * 0.6 + vx * 0.4;
        pointer.speed = pointer.speed * 0.5 + Math.sqrt(vx * vx + vy * vy) * 0.5;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.lastX = x;
      pointer.lastY = y;
      pointer.lastT = now;
    });
    hero.addEventListener("pointerleave", function () { pointer.x = pointer.y = -9999; });

    build();
    draw(0);
    var resizeTimer = 0;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { build(); if (!running) draw(performance.now()); }, 150);
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !document.hidden) start(); else stop();
      }).observe(hero);
    } else {
      start();
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (visible) start();
    });
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
    observeReveals();
    initCounters();
    initMagnetic();
    initPreview();
    initRails();
    initTilt();
    initGrass();
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
