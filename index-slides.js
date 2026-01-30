/* ======================================================
   index-slides.js
   Slideshow ONLY for the 2 cards on index:
   - .flowers-slide
   - .bouquets-slide
   Crossfade PRO (2-layer), no white flash
   ====================================================== */

(function () {
  const FLOWERS = [
    "images/carnations/Carnations_bouquets.webp",
    "images/tulips/Tulips_bouquets.webp",
    "images/hydrangeas/Hydrangeas_bouquets.webp",
    "images/peonies/Bouquets_of_paper_peonies.webp"
  ];

  const BOUQUETS = [
    "images/bouquets/hand/gallery/Wedding-bouquet.webp",
    "images/bouquets/hand/thumb/Paper_flower_bouquets.webp",
    "images/bouquets/jar/Paper-flowers-bouquets.webp",
    "images/bouquets/mini/mini_paper_flower_bouquets.webp",
    "images/wedding/Wedding_paper_flowers_bouquets.webp"
  ];

  function ensureSlideshowLayers(imgEl) {
    const wrapper = imgEl?.closest(".card-image-wrapper");
    if (!imgEl || !wrapper) return null;

    // mark wrapper
    wrapper.classList.add("is-slideshow");

    // create 2 layers (reuse original as layer A)
    imgEl.classList.add("card-slide-layer", "is-visible");
    imgEl.style.opacity = ""; // we will control via classes, not inline opacity

    // Create layer B only once
    let layerB = wrapper.querySelector(".card-slide-layer.layer-b");
    if (!layerB) {
      layerB = imgEl.cloneNode(false);
      layerB.className = "card-slide-layer layer-b"; // NOT visible initially
      layerB.removeAttribute("loading"); // avoid weird lazy behavior during crossfade
      wrapper.insertBefore(layerB, wrapper.firstChild);
    }

    // Ensure layer A is first as well (optional)
    imgEl.classList.add("layer-a");

    return { wrapper, layerA: imgEl, layerB };
  }

  function preload(src) {
    return new Promise((resolve) => {
      const im = new Image();
      im.onload = () => resolve(true);
      im.onerror = () => resolve(false);
      im.src = src;
    });
  }

  function startCrossfade(imgEl, list, ms = 2800) {
    if (!imgEl || !Array.isArray(list) || list.length < 2) return;

    const layers = ensureSlideshowLayers(imgEl);
    if (!layers) return;

    const { wrapper, layerA, layerB } = layers;

    // pick start index based on current src
    let i = 0;
    const cur = layerA.getAttribute("src") || "";
    const found = list.indexOf(cur);
    if (found >= 0) i = found;

    let showingA = true;
    let timer = null;
    let paused = false;

    async function next() {
      if (paused) return;

      i = (i + 1) % list.length;
      const nextSrc = list[i];

      // load image before showing it
      const ok = await preload(nextSrc);
      if (!ok) return;

      const show = showingA ? layerB : layerA;
      const hide = showingA ? layerA : layerB;

      show.src = nextSrc;

      // crossfade via classes (CSS controls opacity)
      show.classList.add("is-visible");
      hide.classList.remove("is-visible");

      showingA = !showingA;
    }

    timer = setInterval(next, ms);

    // Pause on hover (desktop)
    wrapper.addEventListener("mouseenter", () => { paused = true; });
    wrapper.addEventListener("mouseleave", () => { paused = false; });

    // Pause briefly after any touch (mobile)
    wrapper.addEventListener("touchstart", () => {
      paused = true;
      setTimeout(() => { paused = false; }, 2500);
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const flowersImg = document.querySelector(".flowers-slide");
    const bouquetsImg = document.querySelector(".bouquets-slide");

    // Small delay so layout settles
    setTimeout(() => {
      startCrossfade(flowersImg, FLOWERS, 2800);
      startCrossfade(bouquetsImg, BOUQUETS, 2800);
    }, 150);
  });
})();