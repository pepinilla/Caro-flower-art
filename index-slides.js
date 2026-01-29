/* ======================================================
   index-slides.js
   Slideshow ONLY for the 2 cards on index:
   - .flowers-slide
   - .bouquets-slide
   Smooth fade without white flash
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

  function startFadeSlideshow(imgEl, list, ms = 2800) {
    if (!imgEl || !Array.isArray(list) || list.length < 2) return;

    let i = 0;
    let timer = null;

    // Start from current src if it matches
    const cur = imgEl.getAttribute("src") || "";
    const found = list.indexOf(cur);
    if (found >= 0) i = found;

    function next() {
      i = (i + 1) % list.length;
      const nextSrc = list[i];

      const pre = new Image();
      pre.onload = () => {
        // fade out
        imgEl.style.opacity = "0";

        // swap while hidden
        setTimeout(() => {
          imgEl.src = nextSrc;

          // fade in (next frame = smoother)
          requestAnimationFrame(() => {
            imgEl.style.opacity = "1";
          });
        }, 220);
      };
      pre.src = nextSrc;
    }

    timer = setInterval(next, ms);

    // Pause on hover (desktop)
    const wrapper = imgEl.closest(".card-image-wrapper");
    if (wrapper) {
      wrapper.addEventListener("mouseenter", () => clearInterval(timer));
      wrapper.addEventListener("mouseleave", () => {
        timer = setInterval(next, ms);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Ensure initial opacity is 1
    const flowersImg = document.querySelector(".flowers-slide");
    const bouquetsImg = document.querySelector(".bouquets-slide");
    if (flowersImg) flowersImg.style.opacity = "1";
    if (bouquetsImg) bouquetsImg.style.opacity = "1";

    // Small delay so layout loads first (prevents jank)
    setTimeout(() => {
      startFadeSlideshow(flowersImg, FLOWERS, 2800);
      startFadeSlideshow(bouquetsImg, BOUQUETS, 2800);
    }, 200);
  });
})();