/* ======================================================
   CARO FLOWER ART – GLOBAL JS (STABLE)
   - No BASE path logic
   - Header loads from /header.html
   - Gallery uses paths as-is (no modifications)
   ====================================================== */

(function () {
  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const CFG = window.CARO_CONFIG || {};

  /* ======================
     SAFE DEFAULTS
     ====================== */
  if (typeof CFG.portfolioMode === "undefined") CFG.portfolioMode = false;
  if (typeof CFG.autoCurrency === "undefined") CFG.autoCurrency = true;
  if (!CFG.defaultCurrency) CFG.defaultCurrency = "CAD";

  /* ======================
     CURRENCY (LocalStorage + Auto)
     ====================== */
  function guessCurrency() {
    const lang = String((navigator.languages && navigator.languages[0]) || navigator.language || "").toLowerCase();
    const tz = String(Intl.DateTimeFormat().resolvedOptions().timeZone || "");

    const tzLooksCanada =
      tz.includes("Vancouver") ||
      tz.includes("Toronto") ||
      tz.includes("Edmonton") ||
      tz.includes("Winnipeg") ||
      tz.includes("Halifax") ||
      tz.includes("St_Johns") ||
      tz.includes("Regina") ||
      tz.includes("Calgary") ||
      tz.includes("Montreal");

    if (lang.includes("en-ca") || tzLooksCanada) return "CAD";
    return "COP";
  }

  function initCurrency() {
    const saved = localStorage.getItem("CARO_CURRENCY");
    if (saved) return saved;

    if (CFG.autoCurrency) {
      const guessed = guessCurrency();
      localStorage.setItem("CARO_CURRENCY", guessed);
      return guessed;
    }

    const fallback = CFG.defaultCurrency || "CAD";
    localStorage.setItem("CARO_CURRENCY", fallback);
    return fallback;
  }

  window.CARO_CURRENCY = initCurrency();

  function setCurrency(cur) {
    if (!cur) return;
    window.CARO_CURRENCY = cur;
    localStorage.setItem("CARO_CURRENCY", cur);
    updateCurrencyUI();
    renderGrid(window.CARO_PAGE || {});
  }
  window.CARO_setCurrency = setCurrency;

  function updateCurrencyUI() {
    qsa("[data-currency]").forEach(btn => {
      const isActive = btn.dataset.currency === window.CARO_CURRENCY;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    const hint = qs("#currencyHint");
    if (hint && CFG.currencyHint) {
      hint.textContent = CFG.currencyHint[window.CARO_CURRENCY] || "";
    }

    // Optional: hide currency switch in portfolio mode
    const wrap = qs("#currencyWrap");
    if (wrap && CFG.portfolioMode) wrap.style.display = "none";
  }

  /* ======================
     PRODUCTS NORMALIZATION
     ====================== */
  const PRODUCTS = (window.PRODUCTS || []).map(p => ({
    ...p,
    id: String(p.id || "").trim(),
    name: p.name || "",
    name_es: p.name_es || "",
    category: String(p.category || "flowers").toLowerCase(),
    thumb: p.thumb || "",
    gallery: Array.isArray(p.gallery) ? p.gallery : [],

    // legacy
    prices: Array.isArray(p.prices) ? p.prices : [],
    price_from: Number(p.price_from || 0),

    // new
    prices_by_currency: p.prices_by_currency || null,
    price_from_by_currency: p.price_from_by_currency || null,
  })).filter(p => p.id && p.thumb);

  /* ======================
     HEADER
     ====================== */
  async function injectHeader() {
    const host = qs("#site-header");
    if (!host) return;

    try {
      const res = await fetch("/header.html", { cache: "no-cache" });
      if (!res.ok) throw new Error("header.html not found");
      host.innerHTML = await res.text();

      const onIndex =
        location.pathname === "/" ||
        location.pathname.endsWith("/index.html");

      // On internal pages: "/#contact" -> "/index.html#contact"
      qsa('a[href^="/#"]', host).forEach(a => {
        if (!onIndex) {
          const raw = a.getAttribute("href"); // "/#contact"
          if (!raw) return;
          const hash = raw.replace("/#", "#");
          a.setAttribute("href", "/index.html" + hash);
        }
      });

      // Currency buttons
      qsa("[data-currency]", host).forEach(btn => {
        btn.addEventListener("click", () => setCurrency(btn.dataset.currency));
      });

      updateCurrencyUI();
    } catch (err) {
      // Fallback minimal header (so it never disappears)
      host.innerHTML = `
        <header class="site-header">
          <div class="header-inner">
            <a class="brand" href="/index.html" aria-label="Caro Flower Art">
              <img class="brand-logo" src="/logo.svg" alt="Caro Flower Art logo" loading="eager" />
            </a>
          </div>
        </header>
      `;
    }
  }

  /* ======================
     PRICE HELPERS
     ====================== */
  function formatMoney(amount, currency) {
    const locale = currency === "COP" ? "es-CO" : "en-CA";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "COP" ? 0 : 2
    }).format(Number(amount || 0));
  }

  function getPrices(p) {
    const cur = window.CARO_CURRENCY;

    if (p.prices_by_currency && p.prices_by_currency[cur]) {
      return p.prices_by_currency[cur] || [];
    }
    if (p.prices && p.prices.length) return p.prices;
    return [];
  }

  function getPriceFrom(p) {
    const cur = window.CARO_CURRENCY;

    if (p.price_from_by_currency && typeof p.price_from_by_currency[cur] !== "undefined") {
      return Number(p.price_from_by_currency[cur] || 0);
    }
    if (p.price_from) return Number(p.price_from || 0);
    return 0;
  }

  function priceHTML(p) {
    // Portfolio mode: hide all prices
    if (CFG.portfolioMode) {
      return `<div class="price-box"><div class="price-line">Request quote</div></div>`;
    }

    const cur = window.CARO_CURRENCY;
    const list = getPrices(p);

    if (list.length) {
      const rows = list.slice(0, 2).map(x => `
        <div class="price-line">
          <strong>${formatMoney(x.amount, cur)}</strong>
          <span class="price-units">/ ${escapeHtml(x.label)} – ${escapeHtml(x.label_es)}</span>
        </div>
      `).join("");

      return `<div class="price-box">${rows}</div>`;
    }

    const from = getPriceFrom(p);
    if (from) {
      return `
        <div class="price-box">
          <div class="price-line">
            <strong>${formatMoney(from, cur)}</strong>
          </div>
        </div>`;
    }

    return `<div class="price-box"><div class="price-line">Request quote</div></div>`;
  }

  /* ======================
     CARD
     ====================== */
  function cardHTML(p) {
    return `
      <article class="card" data-category="${p.category}" data-id="${p.id}">
        <div class="card-image-wrapper">
          <img src="${p.thumb}" alt="${escapeHtml(p.name)}" loading="lazy">
        </div>

        <div class="card-content">
          <h3>${escapeHtml(p.name)}<span class="es">${escapeHtml(p.name_es)}</span></h3>

          ${priceHTML(p)}

          <div class="card-actions actions-row">
            <a href="/index.html#contact"
               class="btn-action btn-quote"
               data-prefill="${escapeHtml(p.name)}">
              Request Quote
              <span class="es">Pedir cotización</span>
            </a>

            <button class="btn-action btn-outline btn-photos"
                    type="button"
                    data-id="${p.id}">
              View Photos
              <span class="es">Ver fotos</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  /* ======================
     GRID
     ====================== */
  function renderGrid(cfg) {
    const grid = qs("#" + (cfg.gridId || "galleryGrid"));
    if (!grid) return;

    let list = [...PRODUCTS];
    if (cfg.mode === "category" && cfg.category) {
      list = list.filter(p => p.category === cfg.category);
    }

    grid.innerHTML = list.map(cardHTML).join("");

    qsa(".btn-photos", grid).forEach(btn => {
      btn.onclick = () => {
        const p = PRODUCTS.find(x => x.id === btn.dataset.id);
        if (p) openGallery(p);
      };
    });
  }

  /* ======================
     GALLERY MODAL
     ====================== */
  function ensureModal() {
    if (qs("#galleryModal")) return;

    document.body.insertAdjacentHTML("beforeend", `
      <div class="gallery-modal" id="galleryModal">
        <div class="gallery-backdrop" data-close></div>

        <div class="gallery-panel" role="dialog" aria-modal="true">
          <button class="gallery-close" type="button" data-close aria-label="Close">×</button>

          <div class="gallery-body">
            <button class="gallery-nav gallery-prev" type="button" aria-label="Previous">‹</button>
            <button class="gallery-nav gallery-next" type="button" aria-label="Next">›</button>

            <div class="gallery-image-wrap" id="gallerySwipeArea">
              <img id="galleryImage" alt="">
            </div>

            <div class="gallery-meta">
              <div id="galleryTitle" class="gallery-title"></div>
              <div id="galleryPrice" class="gallery-price"></div>
            </div>
          </div>
        </div>
      </div>
    `);
  }

  let galleryState = { photos: [], index: 0, isOpen: false };

  function renderGalleryImage() {
    const img = qs("#galleryImage");
    if (!img || !galleryState.photos.length) return;
    // ✅ IMPORTANT: use paths as-is (do NOT prepend slash/base)
    img.src = galleryState.photos[galleryState.index];
  }

  function nextPhoto() {
    if (!galleryState.photos.length) return;
    galleryState.index = (galleryState.index + 1) % galleryState.photos.length;
    renderGalleryImage();
  }

  function prevPhoto() {
    if (!galleryState.photos.length) return;
    galleryState.index =
      (galleryState.index - 1 + galleryState.photos.length) % galleryState.photos.length;
    renderGalleryImage();
  }

  function openGallery(p) {
    ensureModal();

    galleryState.photos = (p.gallery && p.gallery.length) ? p.gallery : [p.thumb];
    galleryState.index = 0;
    galleryState.isOpen = true;

    renderGalleryImage();
    qs("#galleryTitle").textContent = `${p.name} / ${p.name_es}`;
    qs("#galleryPrice").innerHTML = priceHTML(p);

    const btnPrev = qs(".gallery-prev");
    const btnNext = qs(".gallery-next");
    if (btnPrev) btnPrev.onclick = (e) => { e.preventDefault(); e.stopPropagation(); prevPhoto(); };
    if (btnNext) btnNext.onclick = (e) => { e.preventDefault(); e.stopPropagation(); nextPhoto(); };

    setupSwipe();

    qs("#galleryModal").classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeGallery() {
    const modal = qs("#galleryModal");
    if (!modal) return;

    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    galleryState.isOpen = false;
  }

  document.addEventListener("click", (e) => {
    if (e.target && e.target.matches("[data-close]")) closeGallery();
  });

  document.addEventListener("keydown", (e) => {
    if (!galleryState.isOpen) return;
    if (e.key === "Escape") closeGallery();
    if (e.key === "ArrowRight") nextPhoto();
    if (e.key === "ArrowLeft") prevPhoto();
  });

  let swipeBound = false;
  function setupSwipe() {
    if (swipeBound) return;
    const area = qs("#gallerySwipeArea");
    if (!area) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    area.addEventListener("touchstart", (ev) => {
      if (!galleryState.isOpen) return;
      const t = ev.touches && ev.touches[0];
      if (!t) return;
      tracking = true;
      startX = t.clientX;
      startY = t.clientY;
    }, { passive: true });

    area.addEventListener("touchend", (ev) => {
      if (!galleryState.isOpen || !tracking) return;
      tracking = false;

      const t = ev.changedTouches && ev.changedTouches[0];
      if (!t) return;

      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      if (Math.abs(dx) < 40) return;
      if (Math.abs(dy) > 120) return;

      if (dx < 0) nextPhoto();
      else prevPhoto();
    }, { passive: true });

    swipeBound = true;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  /* ======================
     INIT
     ====================== */
  document.addEventListener("DOMContentLoaded", async () => {
    await injectHeader();
    updateCurrencyUI();
    renderGrid(window.CARO_PAGE || {});
  });
})();