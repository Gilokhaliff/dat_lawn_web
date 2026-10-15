/* =========================================================
   DAT LAWN GUY — app.js
   Language, navigation, catalog, community (Instagram,
   gallery, reviews), FAQ, forms and checkout.
   Needs data.js and motion.js loaded first.
   ========================================================= */
(function () {
  "use strict";

  const $ = (s, scope = document) => scope.querySelector(s);
  const $$ = (s, scope = document) => Array.from(scope.querySelectorAll(s));
  const M = window.Motion;

  const LANG_KEY = "dlg_lang";
  const CLICKS_KEY = "datlawn_click_counts_v1";

  let currentLang = readLang();
  let reviews = [];
  let consumablesFilter = "all";
  let activeSeason = "";
  let productClickCounts = {};

  const dict = () => translations[currentLang] || translations.en;
  const t = (key, fallback = "") => dict()[key] || translations.en[key] || fallback;

  /* ---------- Storage ---------- */
  function readLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "de" || saved === "en") return saved;
    } catch (err) { /* storage unavailable */ }
    return "de";
  }
  function writeLang(lang) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (err) { /* ignore */ }
  }
  function readClickCounts() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CLICKS_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
      return {};
    }
  }
  function writeClickCounts() {
    try { localStorage.setItem(CLICKS_KEY, JSON.stringify(productClickCounts)); } catch (err) { /* ignore */ }
  }

  /* ---------- Helpers ---------- */
  function escapeHtml(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function formatDate(value) {
    const date = new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(currentLang === "de" ? "de-DE" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function starDisplay(rating = 0) {
    const n = Math.max(0, Math.min(5, Math.round(rating)));
    return `<span class="on">${"★".repeat(n)}</span><span class="off">${"★".repeat(5 - n)}</span>`;
  }
  function setStatusLoading(el, text) {
    if (!el) return;
    el.classList.add("loading");
    el.innerHTML = `${escapeHtml(text)} <span class="loading-dots"><span></span><span></span><span></span></span>`;
    el.classList.remove("hidden");
  }
  function setStatusMessage(el, text) {
    if (!el) return;
    el.classList.remove("loading");
    el.textContent = text || "";
    el.classList.remove("hidden");
  }

  let toastStack;
  function showToast(message, type = "success", duration = 3000) {
    if (!toastStack) {
      toastStack = document.createElement("div");
      toastStack.className = "toast-stack";
      toastStack.setAttribute("role", "status");
      document.body.appendChild(toastStack);
    }
    const toast = document.createElement("div");
    toast.className = `toast${type === "error" ? " error" : ""}`;
    toast.textContent = message;
    toastStack.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      setTimeout(() => toast.remove(), 260);
    }, duration);
  }

  function burstFromElement(el, count = 16) {
    if (!el || !M.allowMotion()) return;
    const r = el.getBoundingClientRect();
    const host = document.createElement("span");
    host.className = "burst-host";
    host.style.left = `${r.left + r.width / 2}px`;
    host.style.top = `${r.top + r.height / 2}px`;
    const palette = ["#2d6a3b", "#b9e26f", "#101712", "#e8e7df"];
    for (let i = 0; i < count; i += 1) {
      const dot = document.createElement("span");
      dot.className = "burst-dot";
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = 18 + Math.random() * 36;
      dot.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      dot.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      dot.style.setProperty("--scale", `${0.6 + Math.random() * 0.7}`);
      dot.style.setProperty("--delay", `${Math.random() * 80}ms`);
      dot.style.background = palette[i % palette.length];
      host.appendChild(dot);
    }
    document.body.appendChild(host);
    setTimeout(() => host.remove(), 900);
  }

  async function copyText(text = "") {
    if (!text) return false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) { /* fall back below */ }
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-9999px";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    area.remove();
    return ok;
  }

  /* =========================================================
     Language
     ========================================================= */
  function applyStaticTranslations() {
    const d = dict();
    $$("[data-i18n]").forEach((el) => {
      const value = d[el.dataset.i18n];
      if (value) el.innerHTML = value;
    });
    $$("[data-i18n-placeholder]").forEach((el) => {
      const value = d[el.dataset.i18nPlaceholder];
      if (value) el.placeholder = value;
    });
    $$("[data-i18n-aria]").forEach((el) => {
      const value = d[el.dataset.i18nAria];
      if (value) el.setAttribute("aria-label", value);
    });
    $$("[data-ig-followers]").forEach((el) => {
      el.textContent = community.followersLabel[currentLang] || community.followersLabel.en;
    });
    const titleKey = document.body.dataset.title;
    if (titleKey && d[titleKey]) document.title = `${d[titleKey].replace(/<[^>]+>/g, "")} — Dat Lawn Guy`;
  }

  function renderDynamic() {
    renderSeasonalNote();
    renderProducts();
    updateFilterUI();
    renderFaq();
    renderInstagram();
    renderReviews();
    $$(".file-input input[type='file']").forEach((input) => updateFileName(input));
  }

  function setLanguage(lang, initial = false) {
    currentLang = lang === "en" ? "en" : "de";
    writeLang(currentLang);
    document.documentElement.lang = currentLang;
    document.documentElement.dataset.lang = currentLang;
    applyStaticTranslations();
    renderDynamic();
    $$(".lang-btn").forEach((btn) => {
      const active = btn.dataset.lang === currentLang;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (!initial) {
      M.refreshText();
      requestAnimationFrame(positionSeasonThumb);
    }
  }

  function initLanguageToggle() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".lang-btn");
      if (!btn) return;
      setLanguage(btn.dataset.lang);
    });
  }

  /* =========================================================
     Navigation
     ========================================================= */
  function initNav() {
    const nav = $("#nav");
    const page = document.body.dataset.page;
    $$("[data-nav]").forEach((a) => {
      if (a.dataset.nav === page) a.setAttribute("aria-current", "page");
    });
    if (!nav) return;

    const darkZones = $$("[data-theme='dark']");
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const probe = nav.offsetHeight / 2;
      const dark = darkZones.some((z) => {
        const r = z.getBoundingClientRect();
        return r.top <= probe && r.bottom >= probe;
      });
      nav.classList.toggle("is-dark", dark);
      nav.classList.toggle("is-scrolled", y > 8);
      const menuOpen = document.body.classList.contains("menu-open");
      if (!menuOpen && Math.abs(y - lastY) > 6) {
        nav.classList.toggle("is-hidden", y > lastY && y > 240);
        lastY = y;
      }
    };
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();

    // Overlay menu
    const burger = $(".nav-burger");
    const menu = $("#menu");
    if (!burger || !menu) return;
    $$(".menu-list a").forEach((a, i) => a.style.setProperty("--i", i));
    const setOpen = (open) => {
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      menu.inert = !open;
      nav.classList.remove("is-hidden");
      if (open) {
        const first = $(".menu-list a", menu);
        if (first) setTimeout(() => first.focus({ preventScroll: true }), 300);
      }
      update();
    };
    menu.inert = true;
    burger.addEventListener("click", () => setOpen(!document.body.classList.contains("menu-open")));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
        setOpen(false);
        burger.focus();
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1080 && document.body.classList.contains("menu-open")) setOpen(false);
    });
  }

  /* =========================================================
     Promo code
     ========================================================= */
  function initPromoCopy() {
    $$("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const code = (btn.dataset.copy || "").trim();
        const ok = await copyText(code);
        if (!ok) {
          showToast(t("promo_copy_error", "Copy failed."), "error", 2200);
          return;
        }
        btn.classList.add("copied");
        burstFromElement(btn, 14);
        setTimeout(() => btn.classList.remove("copied"), 1400);
        showToast(t("promo_copy_success", "Code copied."), "success", 1800);
      });
    });
  }

  /* =========================================================
     Catalog
     ========================================================= */
  const productText = (item = {}) =>
    `${item?.name?.en || ""} ${item?.name?.de || ""} ${item?.note?.en || ""} ${item?.note?.de || ""}`.toLowerCase();

  function inferConsumableCategory(item = {}) {
    if (["fertilizer", "seed", "soil", "bundle", "weed"].includes(item.category)) return item.category;
    const nameText = `${item?.name?.en || ""} ${item?.name?.de || ""}`.toLowerCase();
    const text = productText(item);
    if (/\bbundle\b|\bpaket\b|\bset\b|komplettset|sorglos-paket/.test(nameText)) return "bundle";
    if (/unkraut|weed|herbicide/.test(text)) return "weed";
    if (/rasensamen|lawn seed|saatgut|poa|trockenrasen|schattenrasen|sun\s*and\s*shade|heat\s*&\s*drought/.test(nameText)) return "seed";
    if (/boden|soil|erde|ph|kalk|humus|fulva|amino|humin/.test(text)) return "soil";
    return "fertilizer";
  }

  function getSeasonalPatterns(season = "") {
    if (season === "spring") {
      return [
        /starterd(?:ü|u)nger|starter fertilizer/i,
        /fr(?:ü|u)hjahrsd(?:ü|u)nger|spring fertilizer|langzeitd(?:ü|u)nger|slow-release/i,
        /bodenverbesserer|soil improver/i,
        /soil p\s*h test|p\s*h boden test|ph boden test/i,
        /bodenpower|soil power bundle|huminiron|liqhumus|fulvagra|amino power/i,
        /rasenerde|lawn soil mix/i,
        /poa\s*supina|rasensamen/i,
      ];
    }
    if (season === "summer") {
      return [/sommerd(?:ü|u)nger|summer fertilizer/i, /bodenverbesserer|soil improver/i, /langzeitd(?:ü|u)nger|slow-release/i];
    }
    if (season === "fall") {
      return [/herbstd(?:ü|u)nger|fall fertilizer/i, /bodenverbesserer|soil improver/i, /poa\s*supina|rasensamen/i];
    }
    return [];
  }
  const isSeasonItem = (item, season) => {
    if (!season) return true;
    const patterns = getSeasonalPatterns(season);
    return !patterns.length || patterns.some((p) => p.test(productText(item)));
  };
  const isPoaSupina = (item) => /poa\s*supina/.test(productText(item));

  function getSeasonalMeta(season) {
    if (season === "summer") {
      return { title: t("seasonal_summer_title"), body: t("seasonal_summer_body"), plan: t("seasonal_plan_summer"), poa: false, seedNeed: false };
    }
    if (season === "fall") {
      return { title: t("seasonal_fall_title"), body: t("seasonal_fall_body"), plan: t("seasonal_plan_fall"), poa: true, seedNeed: true };
    }
    if (season === "spring") {
      return { title: t("seasonal_spring_title"), body: t("seasonal_spring_body"), plan: t("seasonal_plan_spring"), poa: true, seedNeed: false };
    }
    return { title: t("seasonal_intro_title"), body: t("season_hint"), plan: "", poa: false, seedNeed: false };
  }

  function renderSeasonalNote() {
    const note = $("#seasonalNote");
    if (!note) return;
    const meta = getSeasonalMeta(activeSeason);
    note.innerHTML = `
      <h3 class="t-h3 season-title">${meta.title}</h3>
      <p class="season-body">${meta.body}</p>
      ${meta.plan ? `<p class="season-plan"><strong>${t("seasonal_plan_label")}:</strong> ${meta.plan}</p>` : ""}
      ${meta.poa ? `<p class="season-warning">${t("seasonal_poa_warning")}</p>` : ""}
      ${meta.seedNeed ? `<p class="season-warning">${t("seasonal_seed_need_warning")}</p>` : ""}
    `;
    $$("#seasonControl button").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.season === activeSeason ? "true" : "false");
    });
  }

  let thumbX, thumbW;
  function positionSeasonThumb(animate = true) {
    const control = $("#seasonControl");
    const thumb = control && $(".segmented-thumb", control);
    const active = control && $("button[aria-pressed='true']", control);
    if (!thumb || !active) return;
    if (!thumbX) {
      const paint = () => {
        thumb.style.setProperty("--x", `${thumbX.value.toFixed(2)}px`);
        thumb.style.setProperty("--w", `${thumbW.value.toFixed(2)}px`);
      };
      thumbX = new M.Spring({ damping: 0.82, response: 0.42, onUpdate: paint });
      thumbW = new M.Spring({ damping: 0.82, response: 0.42, onUpdate: paint });
      animate = false;
    }
    const x = active.offsetLeft;
    const w = active.offsetWidth;
    if (animate) { thumbX.to(x); thumbW.to(w); } else { thumbX.set(x); thumbW.set(w); }
  }

  function initSeasons() {
    const control = $("#seasonControl");
    if (!control) return;
    control.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-season]");
      if (!btn) return;
      activeSeason = btn.dataset.season;
      consumablesFilter = "all";
      renderSeasonalNote();
      renderProducts();
      updateFilterUI();
      positionSeasonThumb();
    });
    window.addEventListener("resize", () => positionSeasonThumb(false), { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => positionSeasonThumb(false));
    requestAnimationFrame(() => positionSeasonThumb(false));
  }

  function updateFilterUI() {
    $$("#consumablesFilters .chip").forEach((chip) => {
      const active = chip.dataset.filter === consumablesFilter;
      chip.classList.toggle("active", active);
      chip.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function initFilters() {
    const wrap = $("#consumablesFilters");
    if (!wrap) return;
    wrap.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip[data-filter]");
      if (!chip || chip.dataset.filter === consumablesFilter) return;
      consumablesFilter = chip.dataset.filter;
      updateFilterUI();
      renderProducts();
    });
    updateFilterUI();
  }

  const productId = (section, idx) => `${section}:${idx}`;
  function getTopPickIds(limit = 3) {
    const ranked = Object.entries(productClickCounts)
      .filter(([, n]) => Number(n) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, limit)
      .map(([id]) => id);
    return ranked.length ? ranked : ["toolsGrid:0", "consumablesGrid:0", "videoGrid:0"].slice(0, limit);
  }

  function renderProducts() {
    const mapping = [
      ["toolsGrid", products.tools],
      ["consumablesGrid", products.consumables],
      ["videoGrid", products.videoGear],
    ];
    const topPicks = new Set(getTopPickIds(3));
    mapping.forEach(([id, items]) => {
      const grid = document.getElementById(id);
      if (!grid) return;
      let visible = items.map((item, idx) => ({ item, idx }));
      if (id === "consumablesGrid") {
        visible = visible.filter(({ item }) => consumablesFilter === "all" || inferConsumableCategory(item) === consumablesFilter);
        if (activeSeason) visible = visible.filter(({ item }) => isSeasonItem(item, activeSeason));
      }
      grid.innerHTML = visible.map(({ item, idx }, i) => productCard(id, item, idx, i, topPicks)).join("");
      const count = $(`[data-count-for="${id}"]`);
      if (count) count.textContent = `${String(visible.length).padStart(2, "0")} ${t("catalog_count")}`;
    });
    attachImageFallbacks();
    requestAnimationFrame(updateDescToggles);
  }

  function productCard(sectionId, item, idx, order, topPicks) {
    const name = item.name[currentLang] || item.name.en;
    const note = item.note[currentLang] || item.note.en;
    const id = productId(sectionId, idx);
    const descId = `desc-${sectionId}-${idx}`;
    const initial = escapeHtml((name || "?").trim().charAt(0));
    const badges = [];
    if (topPicks.has(id)) badges.push(`<span class="badge">${t("top_pick")}</span>`);
    if (item.comingSoon) badges.push(`<span class="badge badge--soft">${t("coming_soon")}</span>`);
    const showPoa = sectionId === "consumablesGrid" && (activeSeason === "spring" || activeSeason === "fall") && isPoaSupina(item);
    const poaNote = showPoa
      ? `<span class="seasonal-inline-note">${t("seasonal_poa_warning")}${activeSeason === "fall" ? ` ${t("seasonal_seed_need_warning")}` : ""}</span>`
      : "";
    const photo = item.image
      ? `<div class="product-photo" data-initial="${initial}">
           ${badges.length ? `<div class="product-badges">${badges.join("")}</div>` : ""}
           <img src="${item.image}" alt="${escapeHtml(name)}" loading="${order < 3 ? "eager" : "lazy"}" decoding="async">
         </div>`
      : `<div class="product-photo placeholder"><span>${initial}</span></div>`;
    const link = item.viewLink || item.link;
    const actions = [];
    if (link && link !== "#") {
      const external = /^https?:\/\//i.test(link);
      actions.push(
        `<a class="btn btn--sm btn--ghost view-link" data-product-id="${id}" href="${escapeHtml(link)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${t("product_view", "View")} <span class="arrow${external ? " arrow--out" : ""}" aria-hidden="true"></span></a>`
      );
    }
    if (item.priceId) {
      actions.push(`<button class="btn btn--sm checkout-btn" type="button" data-product-id="${id}" data-price="${item.priceId}">${t("product_buy", "Buy")}</button>`);
    }
    return `
      <article class="product" style="--i:${Math.min(order, 12)}">
        ${photo}
        <div class="product-body">
          <div class="product-top">
            <h3 class="product-title">${escapeHtml(name)}</h3>
            <span class="product-price">${escapeHtml(item.price || "")}</span>
          </div>
          <p class="product-desc is-clamped" id="${descId}">${note}${poaNote}</p>
          <button type="button" class="desc-toggle hidden" data-desc-target="${descId}" aria-expanded="false">${t("read_more")}</button>
          ${actions.length ? `<div class="product-actions">${actions.join("")}</div>` : ""}
        </div>
      </article>`;
  }

  function attachImageFallbacks() {
    $$(".product-photo img").forEach((img) => {
      img.addEventListener("error", () => {
        const parent = img.parentElement;
        if (!parent) return;
        parent.innerHTML = `<span>${escapeHtml(parent.dataset.initial || "?")}</span>`;
        parent.classList.add("placeholder");
      }, { once: true });
    });
  }

  function updateDescToggles() {
    $$(".product").forEach((card) => {
      const desc = $(".product-desc", card);
      const toggle = $(".desc-toggle", card);
      if (!desc || !toggle) return;
      desc.classList.add("is-clamped");
      toggle.textContent = t("read_more");
      toggle.setAttribute("aria-expanded", "false");
      toggle.classList.toggle("hidden", desc.scrollHeight - desc.clientHeight <= 2);
    });
  }

  function initProductInteractions() {
    document.addEventListener("click", (e) => {
      const toggle = e.target.closest(".desc-toggle[data-desc-target]");
      if (toggle) {
        const desc = document.getElementById(toggle.dataset.descTarget);
        if (!desc) return;
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        desc.classList.toggle("is-clamped", expanded);
        toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
        toggle.textContent = expanded ? t("read_more") : t("read_less");
        return;
      }
      const view = e.target.closest(".view-link");
      if (view) {
        const id = view.dataset.productId;
        if (id) {
          productClickCounts[id] = Number(productClickCounts[id] || 0) + 1;
          writeClickCounts();
        }
        if (view.target === "_blank") showToast(t("cta_external_shop"), "success", 2200);
        return;
      }
      const photo = e.target.closest(".product-photo:not(.placeholder) img");
      if (photo) {
        const card = photo.closest(".product");
        const title = card ? $(".product-title", card).textContent : "";
        lightbox.open([{ src: photo.currentSrc || photo.src, alt: photo.alt, title, contain: true }], 0, photo);
      }
    });
    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateDescToggles, 150);
    });
  }

  /* =========================================================
     Checkout
     ========================================================= */
  async function startCheckout(priceId, btn) {
    if (!priceId) return;
    btn.classList.add("btn-loading");
    btn.disabled = true;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      showToast(data.error || "Unable to start checkout.", "error");
    } catch (err) {
      console.error(err);
      showToast("Checkout failed. Please try again.", "error");
    }
    btn.classList.remove("btn-loading");
    btn.disabled = false;
  }
  function initCheckout() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".checkout-btn[data-price]");
      if (!btn) return;
      if (btn.dataset.productId) {
        productClickCounts[btn.dataset.productId] = Number(productClickCounts[btn.dataset.productId] || 0) + 1;
        writeClickCounts();
      }
      startCheckout(btn.dataset.price, btn);
    });
  }

  /* =========================================================
     Lightbox — grows out of its thumbnail, follows the finger,
     flick down to dismiss, swipe sideways to browse.
     ========================================================= */
  const lightbox = (() => {
    let el, stage, img, scrimEl, counter, text, prevBtn, nextBtn, closeBtn;
    let items = [];
    let index = 0;
    let origin = null;
    let lastFocus = null;
    let isOpen = false;
    let fit = { x: 0, y: 0, w: 0, h: 0 };
    const sx = new M.Spring({ damping: 1, response: 0.42 });
    const sy = new M.Spring({ damping: 1, response: 0.42 });
    const ss = new M.Spring({ value: 1, damping: 1, response: 0.42 });
    const scrim = new M.Spring({ damping: 1, response: 0.35 });

    function paint() {
      if (!img) return;
      img.style.transform = `translate3d(${sx.value.toFixed(2)}px, ${sy.value.toFixed(2)}px, 0) scale(${ss.value.toFixed(4)})`;
    }
    sx.onUpdate = paint;
    sy.onUpdate = paint;
    ss.onUpdate = paint;
    scrim.onUpdate = (v) => {
      el.style.setProperty("--scrim", Math.max(0, v).toFixed(3));
      el.style.setProperty("--chrome", Math.max(0, Math.min(1, v * 1.4 - 0.4)).toFixed(3));
    };

    function build() {
      el = document.createElement("div");
      el.className = "lightbox";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-modal", "true");
      el.innerHTML = `
        <div class="lightbox-scrim"></div>
        <div class="lightbox-bar"><span class="mono lightbox-counter"></span><button class="lightbox-close" type="button">×</button></div>
        <div class="lightbox-stage"><img class="lightbox-img" alt="" draggable="false"></div>
        <div class="lightbox-foot">
          <div class="lightbox-text"></div>
          <div class="lightbox-nav"><button type="button" data-dir="-1">←</button><button type="button" data-dir="1">→</button></div>
        </div>`;
      document.body.appendChild(el);
      stage = $(".lightbox-stage", el);
      img = $(".lightbox-img", el);
      scrimEl = $(".lightbox-scrim", el);
      counter = $(".lightbox-counter", el);
      text = $(".lightbox-text", el);
      [prevBtn, nextBtn] = $$(".lightbox-nav button", el);
      closeBtn = $(".lightbox-close", el);

      closeBtn.addEventListener("click", close);
      scrimEl.addEventListener("click", close);
      prevBtn.addEventListener("click", () => go(-1));
      nextBtn.addEventListener("click", () => go(1));
      document.addEventListener("keydown", (e) => {
        if (!isOpen) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
        if (e.key === "Tab") {
          const focusables = [closeBtn, prevBtn, nextBtn].filter((b) => !b.disabled);
          const i = focusables.indexOf(document.activeElement);
          e.preventDefault();
          focusables[(i + (e.shiftKey ? -1 : 1) + focusables.length) % focusables.length].focus();
        }
      });
      initDrag();
      window.addEventListener("resize", () => { if (isOpen) layout(true); });
    }

    function measureFit(nw, nh) {
      const r = stage.getBoundingClientRect();
      const pad = window.innerWidth < 640 ? 12 : 32;
      const maxW = r.width - pad * 2;
      const maxH = r.height - pad;
      const ratio = nw && nh ? nw / nh : 1;
      let w = maxW;
      let h = w / ratio;
      if (h > maxH) { h = maxH; w = h * ratio; }
      fit = { x: r.left + (r.width - w) / 2, y: r.top + (r.height - h) / 2, w, h };
      img.style.width = `${w}px`;
      img.style.height = `${h}px`;
      // the image lives in viewport coordinates
      img.style.left = `${-r.left}px`;
      img.style.top = `${-r.top}px`;
    }

    function layout(jump) {
      measureFit(img.naturalWidth, img.naturalHeight);
      if (jump) { sx.set(fit.x); sy.set(fit.y); ss.set(1); return; }
      sx.to(fit.x); sy.to(fit.y); ss.to(1);
    }

    function describe() {
      const item = items[index];
      counter.textContent = items.length > 1 ? `${index + 1} / ${items.length}` : "";
      text.innerHTML = item.title || item.text
        ? `${item.title ? `<strong>${escapeHtml(item.title)}</strong>` : ""}${item.text ? escapeHtml(item.text) : ""}`
        : "";
      prevBtn.disabled = index <= 0;
      nextBtn.disabled = index >= items.length - 1;
      $(".lightbox-nav", el).hidden = items.length < 2;
      img.alt = item.alt || item.title || "";
      img.style.objectFit = item.contain ? "contain" : "cover";
      img.style.background = item.contain ? "#fff" : "transparent";
    }

    function load(src) {
      return new Promise((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
        if (img.complete && img.naturalWidth) resolve();
      });
    }

    async function open(list, start = 0, originEl = null) {
      if (!el) build();
      items = list;
      index = start;
      origin = originEl;
      lastFocus = document.activeElement;
      isOpen = true;
      el.classList.add("open");
      document.body.style.overflow = "hidden";
      describe();
      el.setAttribute("aria-label", items[index].title || t("gallery_heading"));
      const o = origin && origin.getBoundingClientRect();
      const nw = origin && origin.naturalWidth;
      const nh = origin && origin.naturalHeight;
      measureFit(nw, nh);
      if (o && o.width) {
        // start exactly on top of the thumbnail
        const s = o.width / fit.w;
        sx.set(o.left);
        sy.set(o.top + (o.height - fit.h * s) / 2);
        ss.set(s);
      } else {
        sx.set(fit.x);
        sy.set(fit.y + 40);
        ss.set(0.94);
      }
      scrim.set(0);
      await load(items[index].src);
      layout(false);
      scrim.to(1);
      setTimeout(() => closeBtn.focus({ preventScroll: true }), 50);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      // fly back into the thumbnail when it is still on screen, otherwise sink away
      const o = origin && origin.isConnected ? origin.getBoundingClientRect() : null;
      const inView = o && o.bottom > 0 && o.top < window.innerHeight && o.width > 0;
      if (inView && origin.src === img.src) {
        const s = o.width / fit.w;
        sx.to(o.left);
        sy.to(o.top + (o.height - fit.h * s) / 2);
        ss.to(s);
      } else {
        sy.to(sy.value + 60);
        ss.to(0.92);
      }
      scrim.onRest = () => {
        scrim.onRest = null;
        if (isOpen) return;
        el.classList.remove("open");
        document.body.style.overflow = "";
        img.removeAttribute("src");
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      };
      scrim.to(0);
    }

    async function go(dir, velocity = 0) {
      const next = index + dir;
      if (next < 0 || next >= items.length) {
        sx.to(fit.x, velocity);
        return;
      }
      // leave toward the swipe, arrive from the other side
      const exitX = fit.x - dir * window.innerWidth * 0.6;
      sx.to(exitX, velocity);
      await new Promise((r) => setTimeout(r, M.allowMotion() ? 140 : 0));
      index = next;
      origin = null;
      describe();
      await load(items[index].src);
      measureFit(img.naturalWidth, img.naturalHeight);
      sx.set(fit.x + dir * window.innerWidth * 0.4);
      sy.set(fit.y);
      ss.set(1);
      sx.to(fit.x);
    }

    function initDrag() {
      const tracker = new M.VelocityTracker();
      let active = false;
      let axis = "";
      let startX = 0, startY = 0, baseX = 0, baseY = 0;
      stage.addEventListener("pointerdown", (e) => {
        if (!isOpen) return;
        active = true;
        axis = "";
        startX = e.clientX;
        startY = e.clientY;
        baseX = sx.value;
        baseY = sy.value;
        sx.stop(); sy.stop(); ss.stop(); scrim.stop();
        tracker.reset();
        tracker.add(e.clientX, e.clientY);
        stage.setPointerCapture(e.pointerId);
      });
      stage.addEventListener("pointermove", (e) => {
        if (!active) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        // ~10px of hysteresis before committing to a direction
        if (!axis && Math.hypot(dx, dy) > 10) axis = Math.abs(dx) > Math.abs(dy) && items.length > 1 ? "x" : "y";
        tracker.add(e.clientX, e.clientY);
        if (axis === "x") {
          const atEdge = (dx > 0 && index === 0) || (dx < 0 && index === items.length - 1);
          sx.set(baseX + (atEdge ? M.rubberband(dx, window.innerWidth) : dx));
        } else if (axis === "y") {
          const progress = Math.min(1, Math.abs(dy) / (window.innerHeight * 0.5));
          sx.set(baseX + dx * 0.6);
          sy.set(baseY + dy);
          ss.set(1 - progress * 0.25);
          scrim.set(1 - progress * 0.8);
        }
      });
      const end = (e) => {
        if (!active) return;
        active = false;
        // a tap beside the photo closes, like tapping the scrim
        if (!axis && e.type === "pointerup" && e.target !== img) {
          close();
          return;
        }
        const v = tracker.get();
        if (axis === "x") {
          const dx = sx.value - fit.x;
          const projected = dx + M.project(v.x, 0.99);
          if (Math.abs(projected) > window.innerWidth * 0.25) go(projected < 0 ? 1 : -1, v.x);
          else sx.to(fit.x, v.x);
        } else if (axis === "y") {
          const dy = sy.value - fit.y;
          const projected = dy + M.project(v.y, 0.99);
          if (Math.abs(projected) > 140) {
            close();
          } else {
            sx.to(fit.x); sy.to(fit.y, v.y); ss.to(1); scrim.to(1);
          }
        } else {
          sx.to(fit.x); sy.to(fit.y); ss.to(1); scrim.to(1);
        }
        axis = "";
      };
      stage.addEventListener("pointerup", end);
      stage.addEventListener("pointercancel", end);
    }

    return { open, close };
  })();

  /* =========================================================
     Community: Instagram rail
     ========================================================= */
  function renderInstagram() {
    const rail = $("#igRail");
    if (!rail || typeof community === "undefined") return;
    const locale = currentLang === "de" ? "de-DE" : "en-US";
    rail.innerHTML = community.posts
      .map((post) => {
        const title = post.title[currentLang] || post.title.en;
        const date = new Date(`${post.date}T12:00:00`);
        const label = date.toLocaleDateString(locale, { day: "numeric", month: "short" });
        return `
          <a class="rail-card" href="https://www.instagram.com/${post.kind}/${post.id}/" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(title)} — ${t("ig_open")}">
            <div class="media">
              <img src="images/site/ig/${post.id}.jpg" alt="${escapeHtml(title)}" loading="lazy" width="360" height="640" draggable="false">
              <span class="rail-kind">${post.kind === "reel" ? "Reel" : "Post"}</span>
            </div>
            <div class="rail-card-meta"><span>${escapeHtml(title)}</span><time datetime="${post.date}">${label}</time></div>
          </a>`;
      })
      .join("");
    rail.dispatchEvent(new Event("scroll"));
  }

  /* =========================================================
     Reviews + gallery
     ========================================================= */
  function getReviewText(entry) {
    if (!entry || entry.text == null) return "";
    if (typeof entry.text === "string") return entry.text;
    if (typeof entry.text === "object") return entry.text[currentLang] || entry.text.en || Object.values(entry.text)[0] || "";
    return "";
  }

  function renderReviewSkeletons() {
    const list = $("#reviewsList");
    if (!list) return;
    list.innerHTML = Array.from({ length: 3 })
      .map(() => `<div class="review-skel"><div class="skeleton skel-line short"></div><div class="skeleton skel-line"></div><div class="skeleton skel-line"></div></div>`)
      .join("");
  }

  async function loadReviews() {
    if (!$("#reviewsList") && !$("#galleryGrid")) return;
    renderReviewSkeletons();
    try {
      const res = await fetch("/api/reviews");
      if (!res.ok) throw new Error(`Failed to load reviews: ${res.status}`);
      const data = await res.json().catch(() => ({}));
      reviews = Array.isArray(data.reviews)
        ? data.reviews.map((r) => ({
            name: String(r.name || "Guest").slice(0, 80),
            text: typeof r.text === "string" ? r.text.slice(0, 800) : r.text,
            createdAt: r.createdAt || Date.now(),
            rating: Number(r.rating) || 0,
            imageUrls: Array.isArray(r.imageUrls)
              ? r.imageUrls.filter((u) => typeof u === "string" && u)
              : [r.imageUrl, r.image, r.photo].filter((u) => typeof u === "string" && u),
          }))
        : [];
    } catch (err) {
      console.warn("Review load failed", err);
      reviews = [];
    }
    renderReviews();
  }

  function renderReviews() {
    const list = $("#reviewsList");
    const empty = $("#reviewsEmpty");
    if (list) {
      list.innerHTML = reviews
        .map((r, ri) => {
          const images = r.imageUrls || [];
          return `
            <article class="review">
              <div class="review-head">
                <span class="review-name">${escapeHtml(r.name || "Guest")}</span>
                <span class="review-date">${formatDate(r.createdAt)}</span>
              </div>
              <div class="stars" aria-label="${Math.round(r.rating)} / 5">${starDisplay(r.rating)}</div>
              <p class="review-text">${escapeHtml(getReviewText(r)).replace(/\n/g, "<br>")}</p>
              ${images.length
                ? `<div class="review-thumbs">${images
                    .map((u, pi) => `<button type="button" class="review-thumb" data-review="${ri}" data-photo="${pi}" aria-label="Foto ${pi + 1}"><img src="${escapeHtml(u)}" alt="" loading="lazy"></button>`)
                    .join("")}</div>`
                : ""}
            </article>`;
        })
        .join("");
      if (empty) empty.classList.toggle("hidden", reviews.length > 0);
    }
    renderGallery();
  }

  function galleryItems() {
    const out = [];
    reviews.forEach((r) => {
      (r.imageUrls || []).forEach((src) => {
        out.push({ src, title: r.name, text: getReviewText(r), alt: `${r.name}: Rasenfoto` });
      });
    });
    return out;
  }

  function renderGallery() {
    const grid = $("#galleryGrid");
    if (!grid) return;
    const items = galleryItems();
    const empty = $("#galleryEmpty");
    if (empty) empty.classList.toggle("hidden", items.length > 0);
    grid.innerHTML = items
      .map((item, i) => `
        <figure class="gallery-item" data-reveal style="--d:${(i % 4) * 70}ms">
          <button type="button" data-gallery="${i}" aria-label="${escapeHtml(item.alt)}" style="display:block;width:100%">
            <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" loading="lazy">
          </button>
          <figcaption>${escapeHtml(item.title)}</figcaption>
        </figure>`)
      .join("");
    M.observeReveals(grid);
  }

  function initGalleryClicks() {
    document.addEventListener("click", (e) => {
      const g = e.target.closest("[data-gallery]");
      if (g) {
        const imgEl = $("img", g);
        lightbox.open(galleryItems(), Number(g.dataset.gallery) || 0, imgEl);
        return;
      }
      const thumb = e.target.closest(".review-thumb");
      if (thumb) {
        const r = reviews[Number(thumb.dataset.review)];
        if (!r) return;
        const items = r.imageUrls.map((src) => ({ src, title: r.name, text: getReviewText(r), alt: `${r.name}: Rasenfoto` }));
        lightbox.open(items, Number(thumb.dataset.photo) || 0, $("img", thumb));
      }
    });
  }

  /* ---------- Review form ---------- */
  const getSelectedFiles = (input) => (Array.isArray(input._selectedFiles) ? input._selectedFiles : input.files ? Array.from(input.files) : []);
  const fileKey = (f) => `${f.name}-${f.size}-${f.lastModified}`;
  function setSelectedFiles(input, files) {
    input._selectedFiles = Array.from(files || []);
    if (typeof DataTransfer !== "undefined") {
      const dt = new DataTransfer();
      input._selectedFiles.forEach((f) => dt.items.add(f));
      input.files = dt.files;
    }
  }
  function updateFileName(input) {
    const wrapper = input.closest(".file-input");
    const display = wrapper && $(".file-name", wrapper);
    const count = wrapper && $(".file-count", wrapper.parentElement);
    if (!display) return;
    const files = getSelectedFiles(input);
    if (!files.length) {
      display.textContent = t("reviews_file_empty");
      if (count) { count.textContent = ""; count.classList.add("is-hidden"); }
      return;
    }
    display.textContent = files[files.length - 1].name;
    if (count) {
      count.textContent = `${files.length} ${files.length === 1 ? t("reviews_file_single") : t("reviews_file_multi")}`;
      count.classList.remove("is-hidden");
    }
  }
  function updateFilePreview(input) {
    const wrapper = input.closest(".file-input");
    const preview = wrapper && $(".file-preview", wrapper.parentElement);
    if (!preview) return;
    $$(".file-thumb img", preview).forEach((img) => img.dataset.url && URL.revokeObjectURL(img.dataset.url));
    $$(".file-thumb", preview).forEach((n) => n.remove());
    getSelectedFiles(input).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      const thumb = document.createElement("div");
      thumb.className = "file-thumb";
      thumb.innerHTML = `<img src="${url}" alt="${escapeHtml(file.name)}" data-url="${url}"><button type="button" class="file-remove" aria-label="Remove ${escapeHtml(file.name)}">×</button>`;
      $(".file-remove", thumb).addEventListener("click", () => {
        setSelectedFiles(input, getSelectedFiles(input).filter((f) => fileKey(f) !== fileKey(file)));
        updateFileName(input);
        updateFilePreview(input);
      });
      preview.appendChild(thumb);
    });
  }
  function initFileInputs() {
    $$(".file-input input[type='file']").forEach((input) => {
      input.addEventListener("change", () => {
        const picked = input.files ? Array.from(input.files) : [];
        if (picked.length) {
          const map = new Map(getSelectedFiles(input).map((f) => [fileKey(f), f]));
          picked.forEach((f) => map.set(fileKey(f), f));
          setSelectedFiles(input, map.values());
        }
        updateFileName(input);
        updateFilePreview(input);
      });
      updateFileName(input);
    });
  }

  async function uploadReviewImages(files, statusEl) {
    const form = $("#reviewForm");
    const cloudName = form?.dataset.cloudName || window.CLOUDINARY_CLOUD_NAME || "";
    const preset = form?.dataset.uploadPreset || window.CLOUDINARY_UPLOAD_PRESET || "";
    if (!cloudName || !preset) throw new Error("Photo upload not configured.");
    const urls = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) throw new Error("Photo is too large (max 10MB).");
      setStatusLoading(statusEl, currentLang === "de" ? `Foto wird hochgeladen (${i + 1}/${files.length})` : `Uploading photo (${i + 1}/${files.length})`);
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", preset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.secure_url) throw new Error(t("reviews_upload_error", "Photo upload failed."));
      urls.push(data.secure_url);
    }
    return urls;
  }

  function initReviewForm() {
    const form = $("#reviewForm");
    if (!form) return;
    const status = $("#reviewStatus");
    const starsWrap = $("#reviewStars");
    const rating = $("#reviewRating");
    const paintStars = (value, cls = "active") => {
      $$(".star", starsWrap).forEach((s) => s.classList.toggle(cls, Number(s.dataset.value) <= value));
    };
    if (starsWrap && rating) {
      rating.value = Number(rating.value) > 0 ? rating.value : 5;
      paintStars(Number(rating.value));
      starsWrap.addEventListener("click", (e) => {
        const star = e.target.closest(".star");
        if (!star) return;
        rating.value = star.dataset.value;
        paintStars(Number(rating.value));
        $$(".star", starsWrap).forEach((s) => s.setAttribute("aria-checked", s === star ? "true" : "false"));
      });
      starsWrap.addEventListener("pointerover", (e) => {
        const star = e.target.closest(".star");
        if (star) paintStars(Number(star.dataset.value), "preview");
      });
      starsWrap.addEventListener("pointerleave", () => paintStars(0, "preview"));
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submit = $("button[type='submit']", form);
      const restore = () => { submit.classList.remove("btn-loading"); submit.disabled = false; };
      const nameInput = $("#reviewName");
      const commentInput = $("#reviewComment");
      const photoInput = $("#reviewPhoto");
      const comment = (commentInput.value || "").trim();
      if (!comment) {
        commentInput.classList.add("input-error");
        setTimeout(() => commentInput.classList.remove("input-error"), 600);
        commentInput.focus();
        return;
      }
      submit.classList.add("btn-loading");
      submit.disabled = true;

      let imageUrls = [];
      const files = photoInput ? getSelectedFiles(photoInput) : [];
      if (files.length) {
        try {
          imageUrls = await uploadReviewImages(files, status);
        } catch (err) {
          setStatusMessage(status, err.message);
          showToast(err.message, "error");
          restore();
          return;
        }
      }

      setStatusLoading(status, currentLang === "de" ? "Wird gesendet" : "Posting");
      const payload = {
        name: ((nameInput.value || "").trim() || "Guest").slice(0, 80),
        comment: comment.slice(0, 800),
        rating: Math.max(0, Math.min(5, Math.round(Number(rating?.value) || 0))),
        imageUrls,
      };
      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Review save failed (${res.status})`);
        if (data && data.review) {
          reviews.unshift({
            name: data.review.name || payload.name,
            text: data.review.text || payload.comment,
            createdAt: data.review.createdAt || Date.now(),
            rating: data.review.rating || payload.rating,
            imageUrls: data.review.imageUrls || payload.imageUrls,
          });
          reviews = reviews.slice(0, 30);
          renderReviews();
        } else {
          await loadReviews();
        }
        setStatusMessage(status, t("reviews_status"));
        showToast(t("reviews_status"));
        burstFromElement(submit, 18);
        form.reset();
        if (photoInput) {
          photoInput._selectedFiles = [];
          updateFileName(photoInput);
          updateFilePreview(photoInput);
        }
        if (rating) { rating.value = 5; paintStars(5); }
      } catch (err) {
        console.warn("Review submit failed", err);
        setStatusMessage(status, err.message || "Could not post your review. Please try again.");
        showToast(err.message || "Could not post your review.", "error");
      }
      restore();
    });
  }

  /* =========================================================
     FAQ
     ========================================================= */
  function renderFaq() {
    const list = $("#faqList");
    if (!list) return;
    const open = $$(".faq-item:not(.collapsed)", list).map((n) => n.dataset.index);
    list.innerHTML = faqs
      .map((f, i) => {
        const isOpen = open.includes(String(i));
        return `
          <div class="faq-item${isOpen ? "" : " collapsed"}" data-index="${i}" data-reveal style="--d:${i * 80}ms">
            <button class="faq-q" type="button" aria-expanded="${isOpen}" aria-controls="faq-a-${i}" id="faq-q-${i}">
              <span>${f.q[currentLang] || f.q.en}</span><span class="faq-icon" aria-hidden="true"></span>
            </button>
            <div class="faq-a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}"><div><p>${f.a[currentLang] || f.a.en}</p></div></div>
          </div>`;
      })
      .join("");
    if (list.dataset.bound !== "1") {
      list.dataset.bound = "1";
      list.addEventListener("click", (e) => {
        const btn = e.target.closest(".faq-q");
        if (!btn) return;
        const item = btn.closest(".faq-item");
        const opened = item.classList.toggle("collapsed") === false;
        btn.setAttribute("aria-expanded", opened ? "true" : "false");
      });
    }
  }

  /* =========================================================
     Contact form
     ========================================================= */
  function initContactForm() {
    const form = $("#contactForm");
    if (!form) return;
    const status = $("#contactStatus");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submit = e.submitter || $("button[type='submit']", form);
      const data = new FormData(form);
      if (data.get("trap")) return;
      setStatusLoading(status, currentLang === "de" ? "Wird gesendet" : "Sending");
      submit.classList.add("btn-loading");
      submit.disabled = true;
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.get("name") || "", email: data.get("contact") || "", message: data.get("message") || "" }),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(out.error || t("contact_error"));
        setStatusMessage(status, t("contact_status"));
        showToast(t("contact_status"));
        burstFromElement(submit, 18);
        form.reset();
      } catch (err) {
        setStatusMessage(status, err.message || t("contact_error"));
        showToast(err.message || t("contact_error"), "error");
      } finally {
        submit.classList.remove("btn-loading");
        submit.disabled = false;
      }
    });
  }

  /* =========================================================
     Boot
     ========================================================= */
  document.addEventListener("DOMContentLoaded", () => {
    productClickCounts = readClickCounts();
    initNav();
    initLanguageToggle();
    setLanguage(currentLang, true);
    M.init();
    initSeasons();
    initFilters();
    initProductInteractions();
    initCheckout();
    initPromoCopy();
    initFileInputs();
    initReviewForm();
    initGalleryClicks();
    initContactForm();
    loadReviews();
  });
})();
