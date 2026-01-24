/* ======================================================
   CARO FLOWER ART – GLOBAL JS
   ====================================================== */

(function () {
  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ======================
     CURRENCY (LocalStorage)
     ====================== */
  const CURRENCY_KEY = "CARO_CURRENCY";
  window.CARO_CURRENCY = localStorage.getItem(CURRENCY_KEY) || "CAD";

  function setCurrency(cur){
    window.CARO_CURRENCY = cur;
    localStorage.setItem(CURRENCY_KEY, cur);

    // Actualiza grid
    renderGrid(window.CARO_PAGE || {});

    // Actualiza modal si está abierto
    if (galleryState.isOpen && galleryState.product) {
      qs("#galleryPrice").innerHTML = priceHTML(galleryState.product);
    }

    // Actualiza UI del header (botones)
    syncCurrencyUI();
  }

  // por si quieres llamarlo desde cualquier lado
  window.CARO_setCurrency = setCurrency;

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

    // formatos soportados:
    prices: Array.isArray(p.prices) ? p.prices : [],
    price_from: Number(p.price_from || 0),

    prices_by_currency: p.prices_by_currency || null,
    price_from_by_currency: p.price_from_by_currency || null,

    currency: p.currency || "COP",
  })).filter(p => p.id && p.thumb);

  /* ======================
     HEADER
     ====================== */
  async function injectHeader() {
    const host = qs("#site-header");
    if (!host) return;

    try {
      const res = await fetch("/header.html", { cache: "no-cache" });
      if (!res.ok) throw new Error();
      host.innerHTML = await res.text();

      const onIndex =
        location.pathname === "/" ||
        location.pathname.endsWith("/index.html");

      // En páginas internas: /#contact -> /index.html#contact
      qsa('a[href^="/#"]', host).forEach(a => {
        if (!onIndex) {
          a.setAttribute("href", "/index.html" + a.getAttribute("href").slice(1));
        }
      });

      // Botones de moneda
      qsa("[data-currency]", host).forEach(btn => {
        btn.addEventListener("click", () => setCurrency(btn.dataset.currency));
      });

      // pinta estado actual en header
      syncCurrencyUI();
    } catch {
      /* fallback mínimo */
    }
  }

  function syncCurrencyUI(){
    const cur = window.CARO_CURRENCY;
    qsa("[data-currency]").forEach(btn => {
      btn.setAttribute("aria-pressed", btn.dataset.currency === cur ? "true" : "false");
    });
    const label = qs("#currencyLabel");
    if (label) label.textContent = cur;
  }

  /* ======================
     PRICE HELPERS
     ====================== */
  function formatMoney(amount, currency){
    const locale = currency === "COP" ? "es-CO" : "en-CA";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "COP" ? 0 : 2
    }).format(Number(amount || 0));
  }

  function getPrices(p){
    const cur = window.CARO_CURRENCY;

    // ✅ nuevo formato (recomendado)
    if (p.prices_by_currency && p.prices_by_currency[cur]) {
      return p.prices_by_currency[cur] || [];
    }

    // fallback viejo
    if (p.prices && p.prices.length) return p.prices;

    return [];
  }

  function getPriceFrom(p){
    const cur = window.CARO_CURRENCY;

    // ✅ nuevo formato (price_from_by_currency)
    if (p.price_from_by_currency && typeof p.price_from_by_currency[cur] !== "undefined") {
      return Number(p.price_from_by_currency[cur] || 0);
    }

    // fallback viejo
    if (p.price_from) return Number(p.price_from || 0);

    return 0;
  }

  function priceHTML(p){
    const cur = window.CARO_CURRENCY;
    const list = getPrices(p);

    if (list.length){
      const rows = list.slice(0,2).map(x => `
        <div class="price-line">
          <strong>${formatMoney(x.amount, cur)}</strong>
          <span class="price-units">/ ${escapeHtml(x.label)} – ${escapeHtml(x.label_es)}</span>
        </div>
      `).join("");

      return `<div class="price-box">${rows}</div>`;
    }

    const from = getPriceFrom(p);
    if (from){
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
  function cardHTML(p){
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
  function renderGrid(cfg){
    const grid = qs("#" + (cfg.gridId || "galleryGrid"));
    if (!grid) return;

    let list = [...PRODUCTS];
    if (cfg.mode === "category" && cfg.category){
      list = list.filter(p => p.category === cfg.category);
    }

    grid.innerHTML = list.map(cardHTML).join("");

    qsa(".btn-photos", grid).forEach(btn => {
      btn.onclick = () => {
        const p = PRODUCTS.find(x => x.id === btn.dataset.id);
        if (p) openGallery(p);
      };
    });

    qsa(".btn-quote", grid).forEach(btn => {
      btn.onclick = () => {
        window.CARO_SELECTED_PRODUCT = btn.dataset.prefill;
      };
    });
  }

  /* ======================
     GALLERY MODAL
     ====================== */
  function ensureModal(){
    if (qs("#galleryModal")) return;

    document.body.insertAdjacentHTML("beforeend", `
      <div class="gallery-modal" id="galleryModal">
        <div class="gallery-backdrop" data-close></div>

        <div class="gallery-panel" role="dialog" aria-modal="true">
          <button class="gallery-close" type="button" data-close aria-label="Close">×</button>
          <button class="gallery-nav gallery-prev" type="button" aria-label="Previous">‹</button>
          <button class="gallery-nav gallery-next" type="button" aria-label="Next">›</button>

          <div class="gallery-image-wrap">
            <img id="galleryImage" alt="">
          </div>

          <div class="gallery-meta">
            <div id="galleryTitle" class="gallery-title"></div>
            <div id="galleryPrice" class="gallery-price"></div>
          </div>
        </div>
      </div>
    `);
  }

  let galleryState = { photos: [], index: 0, isOpen: false, product: null };

  function openGallery(p){
    ensureModal();

    galleryState.product = p;
    galleryState.photos = (p.gallery && p.gallery.length) ? p.gallery : [p.thumb];
    galleryState.index = 0;
    galleryState.isOpen = true;

    qs("#galleryImage").src = galleryState.photos[0];
    qs("#galleryTitle").textContent = `${p.name} / ${p.name_es}`;
    qs("#galleryPrice").innerHTML = priceHTML(p);

    const prevBtn = qs(".gallery-prev");
    const nextBtn = qs(".gallery-next");
    if (prevBtn) prevBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); move(-1); };
    if (nextBtn) nextBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); move(1); };

    qs("#galleryModal").classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeGallery(){
    const modal = qs("#galleryModal");
    if (!modal) return;

    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    galleryState.isOpen = false;
    galleryState.product = null;
  }

  function move(dir){
    const len = galleryState.photos.length;
    if (!len) return;
    galleryState.index = (galleryState.index + dir + len) % len;
    qs("#galleryImage").src = galleryState.photos[galleryState.index];
  }

  document.addEventListener("click", e => {
    if (e.target && e.target.matches("[data-close]")){
      closeGallery();
    }
  });

  document.addEventListener("keydown", e => {
    if (!galleryState.isOpen) return;
    if (e.key === "Escape") closeGallery();
    if (e.key === "ArrowLeft") move(-1);
    if (e.key === "ArrowRight") move(1);
  });

  /* ======================
     HELPERS
     ====================== */
  function escapeHtml(str){
    return String(str || "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;");
  }

  /* ======================
     INIT
     ====================== */
  document.addEventListener("DOMContentLoaded", async () => {
    await injectHeader();
    renderGrid(window.CARO_PAGE || {});
  });
})();