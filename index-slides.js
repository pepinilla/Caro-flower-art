document.addEventListener("DOMContentLoaded", () => {

  const slides = {
    flowers: [
      "images/roses/red roses/Paper_red_roses.webp",
      "images/tulips/Tulips_bouquets.webp",
      "images/hydrangeas/Hydrangeas_bouquets.webp",
      "images/peonies/Bouquets_of_paper_peonies.webp",
      "images/carnations/Carnations_bouquets.webp"
    ],
    bouquets: [
      "images/bouquets/hand/thumb/Paper_flower_bouquets.webp",
      "images/bouquets/jar/Paper-flowers-bouquets.webp",
      "images/bouquets/mini/mini_paper_flower_bouquets.webp",
      "images/wedding/Wedding_paper_flowers_bouquets.webp"
    ]
  };

  function startSlideshow(selector, images, delay = 3500) {
    const img = document.querySelector(selector);
    if (!img || !images.length) return;

    let index = 0;

    setInterval(() => {
      img.classList.add("is-fading");

      setTimeout(() => {
        index = (index + 1) % images.length;
        img.src = images[index];
        img.classList.remove("is-fading");
      }, 400);

    }, delay);
  }

  startSlideshow(".flowers-slide", slides.flowers);
  startSlideshow(".bouquets-slide", slides.bouquets);

});