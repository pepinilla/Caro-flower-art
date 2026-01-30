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
    "images/bouquets/jar/Hydrangeas3.webp",
    "images/hydrangeas/Hydrangeas_bouquets.webp",
    "images/bouquets/jar/Flowerboiqtes.webp"
  ];

  const BOUQUETS = [
    "images/bouquets/jar/Fkower_bouquet5.webp",
    "images/bouquets/hand/thumb/Paper_flower_bouquets.webp",
    "images/bouquets/jar/Paper-flowers-bouquets.webp",
    "images/bouquets/hand/gallery/Wedding-bouquet-2.webp",
    "images/wedding/Wedding_paper_flowers_bouquets.webp"
  ];

  function ensureLayers(imgEl) {
    const wrapper = imgEl?.closest(".card-image-wrapper");
    if (!imgEl || !wrapper) return null;

    wrapper.classList.add("is-slideshow");

    // layer A = original image
    imgEl.classList.add("card-slide-layer", "layer-a", "is-visible");
    imgEl.removeAttribute("loading"); // avoid lazy flicker

    // layer B = clone
    let layerB = wrapper.querySelector(".card-slide-layer.layer-b");
    if (!layerB) {
      layerB = imgEl.cloneNode(false);
      layerB.className = "card-slide-layer layer-b";
      layerB.removeAttribute("loading");
      wrapper.insertBefore(layerB, imgEl);
    }

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

    const layers = ensureLayers(imgEl);
    if (!layers) return;

    const { wrapper, layerA, layerB } = layers;

    let i = 0;
    const cur = layerA.getAttribute("src") || "";
    const found = list.indexOf(cur);
    if (found >= 0) i = found;

    let showingA = true;
    let paused = false;

    async function next() {
      if (paused) return;

      i = (i + 1) % list.length;
      const nextSrc = list[i];

      const ok = await preload(nextSrc);
      if (!ok) return;

      const show = showingA ? layerB : layerA;
      const hide = showingA ? layerA : layerB;

      show.src = nextSrc;

      show.classList.add("is-visible");
      hide.classList.remove("is-visible");

      showingA = !showingA;
    }

    let timer = setInterval(next, ms);

    wrapper.addEventListener("mouseenter", () => { paused = true; });
    wrapper.addEventListener("mouseleave", () => { paused = false; });

    wrapper.addEventListener("touchstart", () => {
      paused = true;
      setTimeout(() => { paused = false; }, 2500);
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearInterval(timer);
      } else {
        clearInterval(timer);
        timer = setInterval(next, ms);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const flowersImg = document.querySelector(".flowers-slide");
    const bouquetsImg = document.querySelector(".bouquets-slide");

    setTimeout(() => {
      startCrossfade(flowersImg, FLOWERS, 2800);
      startCrossfade(bouquetsImg, BOUQUETS, 2800);
    }, 150);
  });
})();
