/* ======================================================
   CARO FLOWER ART – GLOBAL JS
   ====================================================== */

(function () {
  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ======================
     CURRENCY
     ====================== */
  window.CARO_CURRENCY = localStorage.getItem("CARO_CURRENCY") || "CAD";

  function setCurrency(cur){
    window.CARO_CURRENCY = cur;
    localStorage.setItem("CARO_CURRENCY", cur);
    renderGrid(window.CARO_PAGE || {});
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
    prices: Array.isArray(p.prices) ? p.prices : [],
    prices_by_currency: p.prices_by_currency || null,
    price_from: Number(p.price_from || 0),
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

      qsa('a[href^="/#"]', host).forEach(a => {
        if (!onIndex) {
          a.setAttribute("href", "/index.html" + a.getAttribute("href").slice(1));
        }
      });
    } catch {}
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

    if (p.prices_by_currency && p.prices_by_currency[cur]) {
      return p.prices_by_currency[cur];
    }

    if (p.prices && p.prices.length) {
      return p.prices;
    }

    return [];
  }

  function priceHTML(p){
    const cur = window.CARO_CURRENCY;
    const list = getPrices(p);

    if (list.length){
      const rows = list.slice(0,2).map(x => `
        <div class="price-line">
          <strong>${formatMoney(x.amount, cur)}</strong>
          <span class="price-units">/ ${x.label} – ${x.label_es}</span>
        </div>
      `).join("");

      return `<div class="price-box">${rows}</div>`;
    }

    if (p.price_from){
      return `
        <div class="price-box">
          <div class="price-line">
            <strong>${formatMoney(p.price_from, cur)}</strong>
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
  }

  /* ======================
     GALLERY MODAL
     ====================== */
  function ensureModal(){
    if (qs("#galleryModal")) return;

    document.body.insertAdjacentHTML("beforeend", `
      <div class="gallery-modal" id="galleryModal">
        <div class="gallery-backdrop" data-close></div>
        <div class="gallery-panel">
          <button class="gallery-close" data-close>×</button>
          <button class="gallery-nav gallery-prev">‹</button>
          <button class="gallery-nav gallery-next">›</button>

          <div class="gallery-image-wrap">
            <img id="galleryImage">
          </div>

          <div class="gallery-meta">
            <div id="galleryTitle" class="gallery-title"></div>
            <div id="galleryPrice" class="gallery-price"></div>
          </div>
        </div>
      </div>
    `);
  }

  let galleryState = { photos: [], index: 0 };

  function openGallery(p){
    ensureModal();
    galleryState.photos = p.gallery.length ? p.gallery : [p.thumb];
    galleryState.index = 0;

    qs("#galleryImage").src = galleryState.photos[0];
    qs("#galleryTitle").textContent = `${p.name} / ${p.name_es}`;
    qs("#galleryPrice").innerHTML = priceHTML(p);

    qs(".gallery-prev").onclick = () => move(-1);
    qs(".gallery-next").onclick = () => move(1);

    qs("#galleryModal").classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function move(dir){
    const len = galleryState.photos.length;
    galleryState.index = (galleryState.index + dir + len) % len;
    qs("#galleryImage").src = galleryState.photos[galleryState.index];
  }

  document.addEventListener("click", e => {
    if (e.target.matches("[data-close]")){
      qs("#galleryModal")?.classList.remove("is-open");
      document.body.style.overflow = "";
    }
  });

  function escapeHtml(str){
    return String(str || "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;");
  }

  /* ======================
     INIT
     ====================== */
  document.addEventListener("DOMContentLoaded", async () => {
    await injectHeader();
    renderGrid(window.CARO_PAGE || {});
  });
})();