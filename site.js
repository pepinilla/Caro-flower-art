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
  })).filter(p => p.id && p.thumb);

  // ---------- HEADER (from header.html) ----------
  async function injectHeader() {
    const host = qs("#site-header");
    if (!host) return;

    try {
      const res = await fetch("/header.html", { cache: "no-cache" });
      if (!res.ok) throw new Error("header.html not found");
      host.innerHTML = await res.text();

      // Si estoy en otra página, pero quiero ir al #gallery o #contact del index:
      const onIndex = location.pathname === "/" || location.pathname.endsWith("/index.html");
      qsa('a[href^="/#"]', host).forEach(a => {
        const href = a.getAttribute("href"); // "/#gallery"
        if (!href) return;
        if (!onIndex) a.setAttribute("href", "/index.html" + href.substring(1)); // "/index.html#gallery"
      });
    } catch (e) {
      // fallback mínimo si falla el fetch
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
  function priceHTML(p) {
    return p.price_from
      ? `<div class="price">From $${Math.round(p.price_from)}<span class="es">Desde $${Math.round(p.price_from)}</span></div>`
      : `<div class="price">Request quote<span class="es">Pedir cotización</span></div>`;
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

          <div class="card-actions">
            <a href="/index.html#contact" class="btn-quote" data-prefill="${escapeHtml(p.name)}">Request Quote<span class="es">Pedir cotización</span></a>
            <a href="#" class="btn-photos" data-id="${p.id}">View Photos<span class="es">Ver fotos</span></a>
          </div>
        </div>
      </article>
    `;
  }

  // ---------- RENDER GRID ----------
  function renderGrid(cfg) {
    const grid = qs("#galleryGrid");
    if (!grid) return;

    let list = PRODUCTS.slice();

    // cfg.mode: "all" | "category" | "roses" | "ids"
    const mode = (cfg && cfg.mode) || "all";

    if (mode === "category" && cfg.category) {
      const c = String(cfg.category).toLowerCase();
      list = list.filter(p => p.category === c);
    } else if (mode === "roses") {
      list = list.filter(p => p.id.startsWith("rose"));
    } else if (mode === "ids" && Array.isArray(cfg.ids)) {
      const set = new Set(cfg.ids.map(x => String(x)));
      list = list.filter(p => set.has(p.id));
    }

    grid.innerHTML = list.map(cardHTML).join("");

    // Bind "View Photos"
    qsa(".btn-photos", grid).forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const id = btn.getAttribute("data-id");
        const p = PRODUCTS.find(x => x.id === id);
        if (p) openGallery(p);
      });
    });

    // Bind "Request Quote" (prefill)
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
          </div>

          <div class="gallery-meta">
            <div class="gallery-title" id="galleryTitle"></div>
            <div class="gallery-price" id="galleryPrice"></div>
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
    price.innerHTML = p.price_from
      ? `From $${Math.round(p.price_from)} <span class="es">Desde $${Math.round(p.price_from)}</span>`
      : `Request quote <span class="es">Pedir cotización</span>`;

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
      // opcional: enfocar el textarea
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

    const cfg = window.CARO_PAGE || { mode: "all" };
    renderGrid(cfg);

    // al llegar al index#contact desde otro producto:
    setTimeout(applyQuotePrefill, 50);
  });
})();
