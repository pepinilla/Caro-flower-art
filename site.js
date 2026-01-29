/* ======================================================
   CARO FLOWER ART – GLOBAL JS (FINAL STABLE)
   - Header inject
   - Currency system
   - Product grid
   - Gallery modal with autoplay + swipe
   - Index card slideshows (fade, no flash)
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
    const lang = String(navigator.language || "").toLowerCase();
    const tz = String(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
    if (lang.includes("en-ca") || tz.includes("Toronto") || tz.includes("Vancouver")) return "CAD";
    return "COP";
  }

  function initCurrency() {
    const saved = localStorage.getItem("CARO_CURRENCY");
    if (saved) return saved;
    const cur = CFG.autoCurrency ? guessCurrency() : CFG.defaultCurrency;
    localStorage.setItem("CARO_CURRENCY", cur);
    return cur;
  }

  window.CARO_CURRENCY = initCurrency();

  function setCurrency(cur) {
    window.CARO_CURRENCY = cur;
    localStorage.setItem("CARO_CURRENCY", cur);
    updateCurrencyUI();
    renderGrid(window.CARO_PAGE || {});
  }
  window.CARO_setCurrency = setCurrency;

  function updateCurrencyUI() {
    qsa("[data-currency]").forEach(b => {
      b.classList.toggle("is-active", b.dataset.currency === window.CARO_CURRENCY);
    });
  }

  /* ======================
     PRODUCTS
     ====================== */
  const PRODUCTS = (window.PRODUCTS || []).map(p => ({
    ...p,
    id: String(p.id || "").trim(),
    gallery: Array.isArray(p.gallery) ? p.gallery : [],
  })).filter(p => p.id && p.thumb);

  /* ======================
     HEADER
     ====================== */
  async function injectHeader() {
    const host = qs("#site-header");
    if (!host) return;
    try {
      const res = await fetch("/header.html", { cache: "no-cache" });
      host.innerHTML = await res.text();
      qsa("[data-currency]", host).forEach(b =>
        b.addEventListener("click", () => setCurrency(b.dataset.currency))
      );
      updateCurrencyUI();
    } catch {
      host.innerHTML = `<header class="site-header"><a href="/index.html">Caro Flower Art</a></header>`;
    }
  }

  /* ======================
     PRICE HELPERS
     ====================== */
  function formatMoney(v, c) {
    return new Intl.NumberFormat(c === "COP" ? "es-CO" : "en-CA", {
      style: "currency", currency: c, maximumFractionDigits: c === "COP" ? 0 : 2
    }).format(v);
  }

  function priceHTML(p) {
    if (CFG.portfolioMode) return `<div class="price-box">Request quote</div>`;
    if (p.price_from_by_currency) {
      return `<div class="price-box"><strong>${
        formatMoney(p.price_from_by_currency[window.CARO_CURRENCY], window.CARO_CURRENCY)
      }</strong></div>`;
    }
    return `<div class="price-box">Request quote</div>`;
  }

  /* ======================
     PRODUCT CARD
     ====================== */
  function cardHTML(p) {
    return `
      <article class="card">
        <div class="card-image-wrapper">
          <img src="${p.thumb}" loading="lazy">
        </div>
        <div class="card-content">
          <h3>${p.name}<span class="es">${p.name_es || ""}</span></h3>
          ${priceHTML(p)}
          <div class="card-actions actions-row">
            <a href="/index.html#contact" class="btn-action btn-quote">
              Request Quote<span class="es">Pedir cotización</span>
            </a>
            <button class="btn-action btn-outline btn-photos" data-id="${p.id}">
              View Photos<span class="es">Ver fotos</span>
            </button>
          </div>
        </div>
      </article>`;
  }

  /* ======================
     GRID
     ====================== */
  function renderGrid(cfg) {
    const grid = qs("#" + (cfg.gridId || "galleryGrid"));
    if (!grid) return;
    let list = [...PRODUCTS];
    if (cfg.category) list = list.filter(p => p.category === cfg.category);
    grid.innerHTML = list.map(cardHTML).join("");
    qsa(".btn-photos", grid).forEach(b =>
      b.onclick = () => openGallery(PRODUCTS.find(p => p.id === b.dataset.id))
    );
  }

  /* ======================
     GALLERY MODAL + AUTOPLAY
     ====================== */
  let galleryState = { photos: [], index: 0, open: false };
  let autoplayTimer = null;

  function ensureModal() {
    if (qs("#galleryModal")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div class="gallery-modal" id="galleryModal">
        <div class="gallery-backdrop" data-close></div>
        <div class="gallery-panel">
          <button class="gallery-close" data-close>×</button>
          <img id="galleryImage">
        </div>
      </div>`);
  }

  function renderGalleryImage() {
    const img = qs("#galleryImage");
    if (!img) return;
    img.style.opacity = "0";
    const src = galleryState.photos[galleryState.index];
    const pre = new Image();
    pre.onload = () => {
      img.src = src;
      requestAnimationFrame(() => img.style.opacity = "1");
    };
    pre.src = src;
  }

  function nextPhoto() {
    galleryState.index = (galleryState.index + 1) % galleryState.photos.length;
    renderGalleryImage();
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(nextPhoto, 2600);
  }

  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }

  function openGallery(p) {
    ensureModal();
    galleryState.photos = p.gallery.length ? p.gallery : [p.thumb];
    galleryState.index = 0;
    galleryState.open = true;
    renderGalleryImage();
    startAutoplay();
    qs("#galleryModal").classList.add("is-open");
  }

  document.addEventListener("click", e => {
    if (e.target?.dataset.close) {
      stopAutoplay();
      qs("#galleryModal")?.classList.remove("is-open");
    }
  });

  /* ======================
     INDEX CARD SLIDESHOWS
     ====================== */
  function initIndexSlides() {
    const slides = [
      {
        selector: ".flowers-slide",
        images: [
          "images/carnations/Carnations_bouquets.webp",
          "images/tulips/Tulips_bouquets.webp",
          "images/hydrangeas/Hydrangeas_bouquets.webp",
          "images/peonies/Bouquets_of_paper_peonies.webp"
        ]
      },
      {
        selector: ".bouquets-slide",
        images: [
          "images/bouquets/hand/gallery/Wedding-bouquet.webp",
          "images/bouquets/jar/Paper-flowers-bouquets.webp",
          "images/bouquets/mini/mini_paper_flower_bouquets.webp"
        ]
      }
    ];

    slides.forEach(s => {
      const img = qs(s.selector);
      if (!img) return;
      let i = 0;
      setInterval(() => {
        i = (i + 1) % s.images.length;
        const pre = new Image();
        pre.onload = () => {
          img.style.opacity = "0";
          setTimeout(() => {
            img.src = s.images[i];
            img.style.opacity = "1";
          }, 250);
        };
        pre.src = s.images[i];
      }, 3000);
    });
  }

  /* ======================
     INIT
     ====================== */
  document.addEventListener("DOMContentLoaded", async () => {
    await injectHeader();
    renderGrid(window.CARO_PAGE || {});
    initIndexSlides();
  });

})();