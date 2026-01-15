/* ======================================================
   CARO FLOWER ART – GLOBAL JS
   - Renders products from products.js (window.PRODUCTS)
   - Filtering (All / Flowers / Wedding / Special / Mini)
   - Modal gallery slider
   - Simple header injection
   ====================================================== */

(function () {
  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  const PRODUCTS = (window.PRODUCTS || []).map(p => ({
    ...p,
    // normalize expected fields
    id: p.id,
    name: p.name || "",
    name_es: p.name_es || "",
    category: (p.category || "flowers").toLowerCase(),
    thumb: p.thumb,
    gallery: Array.isArray(p.gallery) ? p.gallery : [],
    price_from: Number.isFinite(p.price_from) ? p.price_from : (parseFloat(p.price_from) || 0),
  }));

  // -----------------------------
  // Header (simple)
  // -----------------------------
  function injectHeader() {
    const host = qs("#site-header");
    if (!host) return;

    host.innerHTML = `
      <header class="site-header">
        <div class="nav-wrap">
          <a class="logo" href="index.html">Caro Flower Art</a>

          <nav class="nav">
            <a href="index.html#gallery">Gallery</a>
            <a href="flowers.html">Flowers</a>
            <a href="roses.html">Roses</a>
            <a href="about.html">About</a>
            <a href="index.html#contact" class="nav-cta">Quote</a>
          </nav>
        </div>
      </header>
    `;
  }

  // -----------------------------
  // Price label (USD for now)
  // -----------------------------
  function priceHTML(p) {
    const usd = p.price_from ? `$${Math.round(p.price_from)}` : "Request quote";
    const es  = p.price_from ? `Desde $${Math.round(p.price_from)}` : "Pedir cotización";
    return `<div class="price">From ${usd}<span class="es">${es}</span></div>`;
  }

  // -----------------------------
  // Card template
  // -----------------------------
  function cardHTML(p) {
    const alt = `${p.name} / ${p.name_es}`;
    return `
      <article class="card" data-category="${p.category}" data-id="${p.id}">
        <div class="card-image-wrapper">
          <img src="${p.thumb}" alt="${alt}" loading="lazy" />
        </div>

        <div class="card-content">
          <h3>${p.name}<span class="es">${p.name_es}</span></h3>
          ${priceHTML(p)}

          <div class="card-footer">
            <a href="index.html#contact" class="btn-quote" data-id="${p.id}">Request Quote</a>
            <a href="#" class="btn-photos" data-id="${p.id}">View Photos</a>
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
    price.innerHTML = p.price_from ? `From $${Math.round(p.price_from)} <span class="es">Desde $${Math.round(p.price_from)}</span>` : `Request quote <span class="es">Pedir cotización</span>`;
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
  document.addEventListener("DOMContentLoaded", () => {
    injectHeader();

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
