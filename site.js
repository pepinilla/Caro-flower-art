/* ======================================================
   CARO FLOWER ART – GLOBAL JS
   ====================================================== */

(function () {
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------------- HEADER ---------------- */
  function injectHeader() {
    const host = qs("#site-header");
    if (!host) return;

    host.innerHTML = `
      <header class="site-header">
        <div class="header-inner">
          <a href="/index.html" class="brand">
            <img src="/logo.svg" alt="Caro Flower Art logo" class="brand-logo"/>
            <span class="brand-name">Caro Flower Art</span>
          </a>

          <nav class="nav">
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

  /* ---------------- PRODUCTS ---------------- */
  const PRODUCTS = (window.PRODUCTS || []).map(p => ({
    ...p,
    category: (p.category || "flowers").toLowerCase(),
    price_from: Number(p.price_from || 0),
  }));

  function priceHTML(p) {
    return p.price_from
      ? `<div class="price">From $${Math.round(p.price_from)}<span class="es">Desde $${Math.round(p.price_from)}</span></div>`
      : `<div class="price">Request quote<span class="es">Pedir cotización</span></div>`;
  }

  function cardHTML(p) {
    return `
      <article class="card" data-category="${p.category}">
        <img src="${p.thumb}" alt="${p.name}" loading="lazy"/>
        <div class="card-content">
          <h3>${p.name}<span class="es">${p.name_es}</span></h3>
          ${priceHTML(p)}
          <div class="card-actions">
            <a href="/index.html#contact" class="btn-quote">Request Quote</a>
            <a href="#" class="btn-photos">View Photos</a>
          </div>
        </div>
      </article>
    `;
  }

  function renderGrid() {
    const grid = qs("#galleryGrid");
    if (!grid) return;
    grid.innerHTML = PRODUCTS.map(cardHTML).join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectHeader();
    renderGrid();
  });
})();
