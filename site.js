/* ======================================================
   CARO FLOWER ART – GLOBAL JS (FINAL STABLE)
   - Header inject (/header.html)
   - Currency system (localStorage + auto)
   - Product grid
   - Gallery modal: autoplay + swipe + keyboard + safe close
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
     CURRENCY
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

    const cur = CFG.autoCurrency ? guessCurrency() : (CFG.defaultCurrency || "CAD");
    localStorage.setItem("CARO_CURRENCY", cur);
    return cur;
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

    const wrap = qs("#currencyWrap");
    if (wrap && CFG.portfolioMode) wrap.style.display = "none";
  }

  /* ======================
     PRODUCTS (normalize safely)
     ====================== */
  const PRODUCTS = (window.PRODUCTS || []).map(p => ({
    ...p,
    id: String(p.id || "").trim(),
    name: p.name || "",
    name_es: p.name_es || "",
    category: String(p.category || "flowers").toLowerCase(),
    thumb: p.thumb || "",
    gallery: Array.isArray(p.gallery) ? p.gallery : [],
    prices: Array.isArray(p.prices) ? p.prices : [],
    price_from: Number(p.price_from || 0),
    prices_by_currency: p.prices_by_currency || null,
    price_from_by_currency: p.price_from_by_currency || null
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
      host.innerHTML = `
        <header class="site-header">
          <div class="header-inner">
            <a class="brand" href="/index.html" aria-label="Caro Flower Art">Caro Flower Art</a>
          </div>
        </header>
      `;
    }
  }

  /* ======================
     PRICE HELPERS
     ====================== */
  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

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
    if (p.prices_by_currency && p.prices_by_currency[cur]) return p.prices_by_currency[cur] || [];
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
    if (CFG.portfolioMode) {
      return `<div class="price-box"><div class="price-line">Request quote</div></div>`;
    }

    const cur = window.CARO_CURRENCY;
    const list = getPrices(p);

    if (list.length) {
      const rows = list.slice(0, 2).map(x => `
        <div class="price-line">
          <strong>${formatMoney(x.amount, cur)}</strong>
          <span class="price-units">${escapeHtml(x.label)} – ${escapeHtml(x.label_es)}</span>
        </div>
      `).join("");

      return `
        <details class="price-details">
          <summary class="price-summary">Price</summary>
          <div class="price-box">${rows}</div>
        </details>
      `;
    }

    const from = getPriceFrom(p);
    if (from) {
      return `
        <details class="price-details">
          <summary class="price-summary">Price</summary>
          <div class="price-box">
            <div class="price-line"><strong>${formatMoney(from, cur)}</strong></div>
          </div>
        </details>
      `;
    }

    return `<div class="price-box"><div class="price-line">Request quote</div></div>`;
  }

  /* ======================
     PRODUCT CARD
     ====================== */
  function cardHTML(p) {
    return `
      <article class="card" data-category="${escapeHtml(p.category)}" data-id="${escapeHtml(p.id)}">
        <div class="card-image-wrapper">
          <img src="${escapeHtml(p.thumb)}" alt="${escapeHtml(p.name)}" loading="lazy">
        </div>

        <div class="card-content">
          <h3>${escapeHtml(p.name)}<span class="es">${escapeHtml(p.name_es)}</span></h3>

          ${priceHTML(p)}

          <div class="card-actions actions-row">
            <a href="/index.html#contact" class="btn-action btn-quote" data-prefill="${escapeHtml(p.name)}">
              Request Quote
              <span class="es">Pedir cotización</span>
            </a>

            <button class="btn-action btn-outline btn-photos" type="button" data-id="${escapeHtml(p.id)}">
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
      list = list.filter(p => p.category === String(cfg.category).toLowerCase());
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
     GALLERY MODAL + AUTOPLAY + SWIPE
     ====================== */
  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let galleryState = { photos: [], index: 0, isOpen: false };
  let autoplayTimer = null;
  let userPaused = false;
  let swipeBound = false;

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

  // ✅ ONLY CHANGE: smoother fade (stable)
  function renderGalleryImage() {
    const img = qs("#galleryImage");
    if (!img || !galleryState.photos.length) return;

    const src = galleryState.photos[galleryState.index];

    // fade out via class (uses your CSS transition)
    img.classList.add("is-fading");

    const pre = new Image();
    pre.onload = () => {
      // small delay helps the fade actually show on fast loads
      setTimeout(() => {
        img.src = src;
        requestAnimationFrame(() => img.classList.remove("is-fading"));
      }, 80);
    };
    pre.onerror = () => {
      setTimeout(() => {
        img.src = src;
        requestAnimationFrame(() => img.classList.remove("is-fading"));
      }, 80);
    };
    pre.src = src;
  }

  function nextPhoto() {
    if (!galleryState.photos.length) return;
    galleryState.index = (galleryState.index + 1) % galleryState.photos.length;
    renderGalleryImage();
  }

  function prevPhoto() {
    if (!galleryState.photos.length) return;
    galleryState.index = (galleryState.index - 1 + galleryState.photos.length) % galleryState.photos.length;
    renderGalleryImage();
  }

  function startAutoplay() {
    if (prefersReduced) return;
    stopAutoplay();
    userPaused = false;

    autoplayTimer = setInterval(() => {
      if (!galleryState.isOpen || userPaused) return;
      nextPhoto();
    }, 2600);
  }

  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayTimer = null;
  }

  function userInteractedWithGallery() {
    userPaused = true;
    setTimeout(() => { userPaused = false; }, 8000);
  }

  function bindAutoplayHoverPause() {
    const modal = qs("#galleryModal");
    if (!modal || modal.dataset.autoplayBound) return;
    modal.dataset.autoplayBound = "1";

    modal.addEventListener("mouseenter", () => { userPaused = true; });
    modal.addEventListener("mouseleave", () => { userPaused = false; });

    modal.addEventListener("touchstart", () => { userInteractedWithGallery(); }, { passive: true });
  }

  function setupSwipe() {
    if (swipeBound) return;
    const area = qs("#gallerySwipeArea");
    if (!area) return;

    let startX = 0, startY = 0, tracking = false;

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

      userInteractedWithGallery();
      if (dx < 0) nextPhoto();
      else prevPhoto();
    }, { passive: true });

    swipeBound = true;
  }

  function openGallery(p) {
    if (!p) return;
    ensureModal();

    galleryState.photos = (p.gallery && p.gallery.length) ? p.gallery : [p.thumb];
    galleryState.index = 0;
    galleryState.isOpen = true;

    renderGalleryImage();
    const title = qs("#galleryTitle");
    const price = qs("#galleryPrice");
    if (title) title.textContent = `${p.name} / ${p.name_es}`;
    if (price) price.innerHTML = priceHTML(p);

    const btnPrev = qs(".gallery-prev");
    const btnNext = qs(".gallery-next");
    if (btnPrev) btnPrev.onclick = (e) => { e.preventDefault(); e.stopPropagation(); userInteractedWithGallery(); prevPhoto(); };
    if (btnNext) btnNext.onclick = (e) => { e.preventDefault(); e.stopPropagation(); userInteractedWithGallery(); nextPhoto(); };

    setupSwipe();
    bindAutoplayHoverPause();
    startAutoplay();

    const modal = qs("#galleryModal");
    if (modal) modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeGallery() {
    stopAutoplay();
    const modal = qs("#galleryModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    galleryState.isOpen = false;
  }

  // robust close: X + backdrop + any child inside them
  document.addEventListener("click", (e) => {
    const closeEl = e.target.closest && e.target.closest("[data-close]");
    if (closeEl) closeGallery();
  });

  document.addEventListener("keydown", (e) => {
    if (!galleryState.isOpen) return;
    if (e.key === "Escape") closeGallery();
    if (e.key === "ArrowRight") { userInteractedWithGallery(); nextPhoto(); }
    if (e.key === "ArrowLeft")  { userInteractedWithGallery(); prevPhoto(); }
  });
/* ======================
     CONTACT FORM (SUPABASE EDGE FUNCTION)
     ====================== */

  async function submitQuoteForm(payload) {
  const url = window.CARO_CONFIG?.supabase?.functionUrl;

  if (!url) {
    throw new Error("Missing Supabase functionUrl in config.js");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch (_) {}

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}

  function ensureFormStatusEl(form) {
    let el = form.querySelector(".form-status");
    if (!el) {
      el = document.createElement("div");
      el.className = "form-status";
      el.setAttribute("aria-live", "polite");
      el.style.marginTop = "10px";
      el.style.fontSize = "14px";
      form.appendChild(el);
    }
    return el;
  }

  function setFormStatus(form, kind, msg) {
    const el = ensureFormStatusEl(form);
    el.textContent = msg || "";
    el.dataset.kind = kind || "info";

    // colores sin tocar tu CSS (si quieres luego lo metemos a site.css)
    el.style.color =
      kind === "success" ? "#1f7a1f" :
      kind === "error"   ? "#b00020" :
      "#333";
  }

  function initContactForm() {
    const form = qs("#contactForm");
    if (!form || form.dataset.bound) return;
    form.dataset.bound = "1";

    const btn = form.querySelector('button[type="submit"]');
    const nameEl = form.querySelector('[name="name"]');
    const emailEl = form.querySelector('[name="email"]');
    const needEl = form.querySelector('[name="need"]');

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = (nameEl?.value || "").trim();
      const email = (emailEl?.value || "").trim();
      const need = (needEl?.value || "").trim();

      if (!name || !email || !need) {
        setFormStatus(form, "error", "Please fill all fields / Por favor completa todos los campos.");
        return;
      }

      // UI: loading
      const oldBtnText = btn ? btn.textContent : "";
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Sending... / Enviando...";
      }
      setFormStatus(form, "info", "Sending... / Enviando...");

      try {
        await submitQuoteForm({ name, email, need });

        setFormStatus(form, "success", "Sent ✓  / Enviado ✓  — I’ll reply soon. / Te responderé pronto.");
        form.reset();
      } catch (err) {
        setFormStatus(form, "error", `Error: ${err?.message || "Could not send"}`);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = oldBtnText || "Request a quote";
        }
      }
    });
  }

  // Optional: prefill textarea when clicking "Request Quote" from a product card
  function initQuotePrefill() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest(".btn-quote[data-prefill]");
      if (!a) return;

      const prefill = a.getAttribute("data-prefill");
      if (!prefill) return;

      // If we are on another page, your link goes to /index.html#contact
      // so this will only run on index page
      const form = qs("#contactForm");
      const needEl = form && form.querySelector('[name="need"]');
      if (needEl && !needEl.value.trim()) {
        needEl.value = `I want: ${prefill} / Quiero: ${prefill}\nQuantity / Cantidad:\nDate / Fecha:`;
      }
    });
  }
  /* ======================
     INIT
     ====================== */
  document.addEventListener("DOMContentLoaded", async () => {
    await injectHeader();
    updateCurrencyUI();
    renderGrid(window.CARO_PAGE || {});
     initContactForm();
    initQuotePrefill();
  });

})();
