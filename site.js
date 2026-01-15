/* ======================================================
   CARO FLOWER ART – GLOBAL JS
   - Renders products from products.js (window.PRODUCTS)
   - Filtering (All / Flowers / Wedding / Special / Mini)
   - Modal gallery slider
   - Shared header injection (loads /header.html)
   ====================================================== */

(function () {
  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  const PRODUCTS = (window.PRODUCTS || []).map(p => ({
    ...p,
    id: String(p.id || ""),
    name: p.name || "",
    name_es: p.name_es || "",
    category: String(p.category || "flowers").toLowerCase(),
    thumb: p.thumb || "",
    gallery: Array.isArray(p.gallery) ? p.gallery : [],
    price_from: Number.isFinite(p.price_from) ? p.price_from : (parseFloat(p.price_from) || 0),
  }));

  // -----------------------------
  // Header (shared via header.html)
  // -----------------------------
  async function injectHeader() {
    const host = qs("#site-header");
    if (!host) return;

    try {
      const res = await fetch("/header.html", { cache: "no-store" });
      if (!res.ok) throw new Error("header.html not found");
      host.innerHTML = await res.text();
    } catch (e) {
      // fallback (in case fetch fails)
      host.innerHTML = `
        <header class="site-header">
          <div class="header-inner">
            <a class="brand" href="/" aria-label="Caro Flower Art">
              <img class="brand-logo" src="/logo.svg" alt="Caro Flower Art logo" />
              <span class="brand-name">Caro Flower Art</span>
            </a>
            <nav class="nav" aria-label="Main">
              <a class="nav-link" href="/#gallery">Gallery</a>
              <a class="nav-link" href="/flowers.html">Flowers</a>
              <a class="nav-link" href="/roses.html">Roses</a>
              <a class="nav-link" href="/about.html">About</a>
              <a class="nav-link" href="/#contact">Quote</a>
            </nav>
          </div>
        </header>
      `;
      console.warn("Header failed to load, using fallback.", e);
    }
  }

  // -----------------------------
  // Price label
  // NOTE: your site shows $ as-is; later we can switch COP/USD labels
  // -----------------------------
  function priceHTML(p) {
    if (!p.price_from) {
      return `
        <div class="price">
          Request quote
          <span class="es">Pedir cotización</span>
        </div>
      `;
    }
    const amount = Math.round(p.price_from);
    return `
      <div class="price">
        From $${amount}
        <span class="es">Desde $${amount}</span>
      </div>
    `;
  }

  // -----------------------------
  // Card template
  // -----------------------------
  function cardHTML(p) {
    const alt = `${p.name} / ${p.name_es}`.trim();
    const viewPhotosLabel = `View Photos<span class="es">Ver fotos</span>`;
    const requestQuoteLabel = `Request Quote<span class="es">Pedir cotización</span>`;

    return `
      <article class="card" data-category="${p.category}" data-id="${p.id}">
        <div class="card-image-wrapper">
          <img src="${p.thumb}" alt="${alt}" loading="lazy" />
        </div>

        <div class="card-content">
          <h3>${p.name}<span class="es">${p.name_es}</span></h3>
          ${priceHTML(p)}

          <div class="card-footer">
            <a href="/#contact" class="btn-quote" data-id="${p.id}">${requestQuoteLabel}</a>
            <a href="#" class="btn-photos" data-id="${p.id}">${viewPhotosLabel}</a>
          </div>
        </div>
      </article>
    `;
  }

  // -----------------------------
  // Render grid
  // gridId: "galleryGrid" by default
  // mode:
  //  - all: show all products
  //  - category: filter by category (flowers/wedding/...)
  //  - roses: ids starting with "rose"
  // -----------------------------
  function renderGrid({ gridId = "galleryGrid", mode = "all", category = null }) {
    const grid = qs(`#${gridId}`);
    if (!grid) return;

    let list = PRODUCTS.slice();

    if (mode === "category" && category) {
      const c = String(category).toLowerCase();
      list = list.filter(p => p.category === c);
    }

    if (mode === "roses") {
      list = list.filter(p => p.id.startsWith("rose"));
    }

    grid.innerHTML = list.map(cardHTML).join("");

    // bind buttons for modal
    qsa(".btn-photos", grid).forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const id = btn.getAttribute("data-id");
        const p = PRODUCTS.find(x => x.id === id);
        if (p) openGallery(p);
      });
    });

    // store selection for quote
    qsa(".btn-quote", grid).forEach(btn => {
      btn.addEventListener("click", () => {
        window.CARO_SELECTED_PRODUCT = btn.getAttribute("data-id") || "";
      });
    });

    // filtering buttons (only if exist on the page)
    const filterButtons = qsa(".filter-btn");
    if (filterButtons.length) {
      filterButtons.forEach(b => {
        b.addEventListener("click", () => {
          filterButtons.forEach(x => x.classList.remove("active"));
          b.classList.add("active");

          const f = (b.getAttribute("data-filter") || "all").toLowerCase();
          qsa(".card", grid).forEach(card => {
            const cardCat = (card.getAttribute("data-category") || "").toLowerCase();
            if (f === "all") card.style.display = "";
            else card.style.display = (cardCat === f ? "" : "none");
          });
        });
      });
    }
  }

  // -----------------------------
  // Gallery modal
  // -----------------------------
  function ensureModal() {
    if (qs("#galleryModal")) return;

    const modalHTML = `
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
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  let galleryState = { photos: [], index: 0, product: null };

  function openGallery(p) {
    ensureModal();

    const modal = qs("#galleryModal");
    const img = qs("#galleryImage");
    const title = qs("#galleryTitle");
    const price = qs("#galleryPrice");

    const photos = (p.gallery && p.gallery.length) ? p.gallery : [p.thumb];
    galleryState = { photos, index: 0, product: p };

    title.textContent = `${p.name} / ${p.name_es}`;

    if (p.price_from) {
      const amount = Math.round(p.price_from);
      price.innerHTML = `From $${amount} <span class="es">Desde $${amount}</span>`;
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

  let modalEventsBound = false;
  function bindModalEventsOnce() {
    if (modalEventsBound) return;
    modalEventsBound = true;

    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!t) return;
      if (t.matches("[data-close]")) closeGallery();
    });

    document.addEventListener("keydown", (e) => {
      const modal = qs("#galleryModal");
      if (!modal || !modal.classList.contains("is-open")) return;

      if (e.key === "Escape") closeGallery();
      if (e.key === "ArrowLeft") setIndex(galleryState.index - 1);
      if (e.key === "ArrowRight") setIndex(galleryState.index + 1);
    });

    document.addEventListener("click", (e) => {
      const modal = qs("#galleryModal");
      if (!modal || !modal.classList.contains("is-open")) return;

      if (e.target && e.target.matches(".gallery-prev")) setIndex(galleryState.index - 1);
      if (e.target && e.target.matches(".gallery-next")) setIndex(galleryState.index + 1);
    });
  }

  // -----------------------------
  // Init
  // -----------------------------
  document.addEventListener("DOMContentLoaded", async () => {
    await injectHeader();

    // Page configuration via window.CARO_PAGE
    // Examples:
    //  { gridId:"galleryGrid", mode:"all" }
    //  { gridId:"galleryGrid", mode:"category", category:"flowers" }
    //  { gridId:"galleryGrid", mode:"roses" }
    const cfg = window.CARO_PAGE || { gridId: "galleryGrid", mode: "all" };

    renderGrid({
      gridId: cfg.gridId || "galleryGrid",
      mode: cfg.mode || "all",
      category: cfg.category || null,
    });
  });
})();
