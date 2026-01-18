/* ======================================================
   CARO FLOWER ART – GLOBAL JS
   - Inject header from /header.html (same on all pages)
   - Render products from products.js (window.PRODUCTS)
   - Page config via window.CARO_PAGE
   - Filtering buttons (.filter-btn)
   - Modal gallery (View Photos)
   - Quote prefill via data-prefill + #occasion
   ====================================================== */

(function () {
  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- PRODUCTS ----------
  const PRODUCTS = (window.PRODUCTS || []).map(p => ({
    ...p,
    id: String(p.id || "").trim(),
    name: p.name || "",
    name_es: p.name_es || "",
    category: String(p.category || "flowers").toLowerCase(),
    thumb: p.thumb || "",
    gallery: Array.isArray(p.gallery) ? p.gallery : [],
    price_from: Number(p.price_from || 0),
    prices: Array.isArray(p.prices) ? p.prices : [],
    currency: p.currency || "COP",
  })).filter(p => p.id && p.thumb);

  // ---------- MINI CSS (injected once) ----------
  function injectMiniStyles() {
    if (qs("#caro-mini-styles")) return;

    const style = document.createElement("style");
    style.id = "caro-mini-styles";
    style.textContent = `
      /* Buttons row inside cards */
      .actions-row{
        display:flex; gap:12px; justify-content:center; align-items:center;
        flex-wrap:wrap; margin-top:14px;
      }
      .btn-action{
        display:inline-flex; align-items:center; justify-content:center;
        padding:12px 16px; border-radius:14px;
        font-weight:700; text-decoration:none; cursor:pointer;
        border:1px solid rgba(220, 150, 170, .35);
        background: rgba(250, 240, 244, .9);
        color: inherit;
        min-width: 160px;
      }
      .btn-action .es{
        display:block; font-weight:600; opacity:.75;
        font-style:italic; margin-top:4px;
      }
      .btn-outline{ background: transparent; }
      .btn-action:hover{ transform: translateY(-1px); }

      /* Price pills (unit + 10 units) */
      .price-stack{ display:grid; gap:10px; justify-items:center; margin:12px 0; }
      .price-pill{
        padding:12px 16px; border-radius:16px;
        background: rgba(250, 240, 244, .9);
        border:1px solid rgba(220, 150, 170, .25);
        text-align:center;
        min-width: 220px;
      }
      .price-note{ margin-left:6px; opacity:.75; font-weight:600; }

      /* Modal: make photo NOT crop on desktop + readable text */
      .gallery-panel{
        max-width: 980px;
        width: calc(100% - 24px);
        max-height: calc(100vh - 24px);
        overflow: hidden;
      }

      /* Keep image fully visible (no crop) */
      .gallery-image-wrap{
        position: relative;
        display:flex;
        align-items:center;
        justify-content:center;
        max-height: 70vh;
        overflow:hidden;
        border-radius: 16px;
      }

      #galleryImage{
        width: 100%;
        height: auto;
        max-height: 70vh;
        object-fit: contain; /* ✅ this avoids cropping */
        display:block;
      }

      /* Text overlay with gradient so it’s readable */
      .gallery-meta{
        position:absolute;
        left:0; right:0; bottom:0;
        padding: 14px 16px;
        color: #111;
        pointer-events:none;
        background: linear-gradient(to top, rgba(255,255,255,.92), rgba(255,255,255,.0));
      }

      .gallery-title{
        font-weight: 800;
        font-size: 20px;
        line-height: 1.2;
        text-shadow: 0 1px 0 rgba(255,255,255,.6);
      }

      .gallery-price{
        margin-top: 6px;
        font-weight: 700;
      }

      .modal-price-line{
        margin: 4px 0;
      }

      /* Make close button always visible */
      .gallery-close{
        width: 44px; height: 44px;
        border-radius: 999px;
        font-size: 26px;
        line-height: 1;
      }

      /* Nav buttons a bit nicer */
      .gallery-nav{
        width: 44px; height: 44px;
        border-radius: 999px;
        font-size: 28px;
      }

      /* On very small screens: give more height to image */
      @media (max-width: 480px){
        .gallery-image-wrap{ max-height: 78vh; }
        #galleryImage{ max-height: 78vh; }
      }
    `;
    document.head.appendChild(style);
  }

  // ---------- HEADER (from header.html) ----------
  async function injectHeader() {
    const host = qs("#site-header");
    if (!host) return;

    try {
      const res = await fetch("/header.html", { cache: "no-cache" });
      if (!res.ok) throw new Error("header.html not found");
      host.innerHTML = await res.text();

      const onIndex = location.pathname === "/" || location.pathname.endsWith("/index.html");
      qsa('a[href^="/#"]', host).forEach(a => {
        const href = a.getAttribute("href");
        if (!href) return;
        if (!onIndex) a.setAttribute("href", "/index.html" + href.substring(1));
      });
    } catch (e) {
      host.innerHTML = `
        <header class="site-header">
          <div class="header-inner">
            <a class="brand" href="/index.html">
              <img class="brand-logo" src="/logo.svg" alt="Caro Flower Art logo"/>
              <span class="brand-name">Caro Flower Art</span>
            </a>
            <nav class="nav" aria-label="Main">
              <a class="nav-link" href="/index.html#gallery">Gallery</a>
              <a class="nav-link" href="/flowers.html">Flowers</a>
              <a class="nav-link" href="/roses.html">Roses</a>
              <a class="nav-link" href="/about.html">About</a>
              <a class="nav-link nav-cta" href="/index.html#contact">Quote</a>
            </nav>
          </div>
        </header>
      `;
    }
  }

  // ---------- PRICE ----------
  function formatMoney(amount) {
  const n = Number(amount || 0);
  if (!n) return "";
  try {
    return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n);
  } catch {
    return String(Math.round(n));
  }
}

function priceHTML(p) {
  // si hay lista de precios, pintamos 1 fila por item
  if (Array.isArray(p.prices) && p.prices.length) {
    const rows = p.prices.slice(0, 2).map(x => {
      const amt = formatMoney(x.amount);
      const labelEN = x.label || "";
      const labelES = x.label_es || "";
      return `
        <div class="price-row">
          <strong>$${amt} COP</strong>
          <span class="price-note">/ ${labelEN} <span class="muted">(${labelES})</span></span>
        </div>
      `;
    }).join("");

    return `<div class="price-box">${rows}</div>`;
  }

  // fallback
  if (p.price_from) {
    const amt = formatMoney(p.price_from);
    return `<div class="price">From $${amt} COP<span class="es">Desde $${amt} COP</span></div>`;
  }

  return `<div class="price">Request quote<span class="es">Pedir cotización</span></div>`;
}

  // ---------- CARD ----------
  function cardHTML(p) {
    const alt = `${p.name}${p.name_es ? " / " + p.name_es : ""}`;
    return `
      <article class="card" data-category="${p.category}" data-id="${p.id}">
        <div class="card-image-wrapper">
          <img src="${p.thumb}" alt="${alt}" loading="lazy" />
        </div>

        <div class="card-content">
          <h3>${p.name}<span class="es">${p.name_es}</span></h3>
          ${priceHTML(p)}

          <div class="card-actions actions-row">
            <a href="/index.html#contact" class="btn-quote btn-action" data-prefill="${escapeHtml(p.name)}">
              Request Quote<span class="es">Pedir cotización</span>
            </a>

            <button type="button" class="btn-photos btn-action btn-outline" data-id="${p.id}">
              View Photos<span class="es">Ver fotos</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  // ---------- RENDER GRID ----------
  function renderGrid(cfg) {
    const gridId = (cfg && cfg.gridId) ? cfg.gridId : "galleryGrid";
    const grid = qs("#" + gridId);
    if (!grid) return;

    let list = PRODUCTS.slice();
    const mode = (cfg && cfg.mode) || "all";

    if (mode === "category" && cfg.category) {
      const c = String(cfg.category).toLowerCase();
      list = list.filter(p => p.category === c);
    } else if (mode === "roses") {
      list = list.filter(p => p.category === "roses");
    } else if (mode === "rose-colors") {
      list = list.filter(p => p.category === "rose-colors");
    } else if (mode === "ids" && Array.isArray(cfg.ids)) {
      const set = new Set(cfg.ids.map(x => String(x)));
      list = list.filter(p => set.has(p.id));
    }

    grid.innerHTML = list.map(cardHTML).join("");

    // View Photos
    qsa(".btn-photos", grid).forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const p = PRODUCTS.find(x => x.id === id);
        if (p) openGallery(p);
      });
    });

    // Request Quote (prefill)
    qsa(".btn-quote", grid).forEach(btn => {
      btn.addEventListener("click", () => {
        window.CARO_SELECTED_PRODUCT = btn.getAttribute("data-prefill") || "";
      });
    });

    // Filtering buttons (si existen)
    const filterBtns = qsa(".filter-btn");
    if (filterBtns.length) {
      filterBtns.forEach(b => {
        b.addEventListener("click", () => {
          filterBtns.forEach(x => x.classList.remove("active"));
          b.classList.add("active");

          const f = (b.getAttribute("data-filter") || "all").toLowerCase();
          qsa(".card", grid).forEach(card => {
            const cat = (card.getAttribute("data-category") || "").toLowerCase();
            card.style.display = (f === "all" || cat === f) ? "" : "none";
          });
        });
      });
    }
  }

  // ---------- MODAL GALLERY ----------
  function ensureModal() {
    if (qs("#galleryModal")) return;

    document.body.insertAdjacentHTML("beforeend", `
      <div class="gallery-modal" id="galleryModal" aria-hidden="true">
        <div class="gallery-backdrop" data-close></div>

        <div class="gallery-panel" role="dialog" aria-modal="true" aria-label="Product gallery">
          <button class="gallery-close" type="button" aria-label="Close" data-close>×</button>

          <button class="gallery-nav gallery-prev" type="button" aria-label="Previous">‹</button>
          <button class="gallery-nav gallery-next" type="button" aria-label="Next">›</button>

          <div class="gallery-image-wrap">
            <img id="galleryImage" alt="Product photo" />
            <div class="gallery-meta">
              <div class="gallery-title" id="galleryTitle"></div>
              <div class="gallery-price" id="galleryPrice"></div>
            </div>
          </div>
        </div>
      </div>
    `);
  }

  let galleryState = { photos: [], index: 0, product: null };
  let modalEventsBound = false;

  function openGallery(p) {
    ensureModal();

    const modal = qs("#galleryModal");
    const img   = qs("#galleryImage");
    const title = qs("#galleryTitle");
    const price = qs("#galleryPrice");

    const photos = (p.gallery && p.gallery.length) ? p.gallery : [p.thumb];
    galleryState = { photos, index: 0, product: p };

    title.textContent = `${p.name}${p.name_es ? " / " + p.name_es : ""}`;

    if (Array.isArray(p.prices) && p.prices.length) {
      price.innerHTML = p.prices.slice(0, 2).map(x => {
        const amt = formatMoney(x.amount);
        return `
          <div class="modal-price-line">
            <strong>$${amt}</strong> <span class="price-note">${x.label || ""}</span>
            <span class="es"><strong>$${amt}</strong> <span class="price-note">${x.label_es || ""}</span></span>
          </div>
        `;
      }).join("");
    } else if (p.price_from) {
      const amt = formatMoney(p.price_from);
      price.innerHTML = `From $${amt} <span class="es">Desde $${amt}</span>`;
    } else {
      price.innerHTML = `Request quote <span class="es">Pedir cotización</span>`;
    }

    img.src = photos[0];

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    bindModalEventsOnce();
  }

  function closeGallery() {
    const modal = qs("#galleryModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function setIndex(i) {
    const img = qs("#galleryImage");
    if (!img || !galleryState.photos.length) return;
    const n = galleryState.photos.length;
    galleryState.index = (i + n) % n;
    img.src = galleryState.photos[galleryState.index];
  }

  function bindModalEventsOnce() {
    if (modalEventsBound) return;
    modalEventsBound = true;

    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!t) return;

      if (t.matches("[data-close]")) closeGallery();

      const modal = qs("#galleryModal");
      if (modal && modal.classList.contains("is-open")) {
        if (t.matches(".gallery-prev")) setIndex(galleryState.index - 1);
        if (t.matches(".gallery-next")) setIndex(galleryState.index + 1);
      }
    });

    document.addEventListener("keydown", (e) => {
      const modal = qs("#galleryModal");
      if (!modal || !modal.classList.contains("is-open")) return;

      if (e.key === "Escape") closeGallery();
      if (e.key === "ArrowLeft") setIndex(galleryState.index - 1);
      if (e.key === "ArrowRight") setIndex(galleryState.index + 1);
    });
  }

  // ---------- QUOTE PREFILL ----------
  function applyQuotePrefill() {
    const onIndex = location.pathname === "/" || location.pathname.endsWith("/index.html");
    if (!onIndex) return;

    const occ = qs("#occasion");
    if (!occ) return;

    if (window.CARO_SELECTED_PRODUCT) {
      occ.value = window.CARO_SELECTED_PRODUCT;
      window.CARO_SELECTED_PRODUCT = "";
      const msg = qs("#message");
      if (msg) msg.focus();
    }
  }

  // ---------- HELPERS ----------
  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ---------- INIT ----------
  document.addEventListener("DOMContentLoaded", async () => {
    await injectHeader();
    injectMiniStyles();

    const cfg = window.CARO_PAGE || { mode: "all" };
    renderGrid(cfg);

    setTimeout(applyQuotePrefill, 50);
  });
})();