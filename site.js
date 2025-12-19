/* ===============================
   HEADER + MOBILE MENU
================================ */

async function loadHeader() {
  const host = document.getElementById("site-header");
  if (!host) return;

  const res = await fetch("header.html", { cache: "no-cache" });
  host.innerHTML = await res.text();

  const hamburger = host.querySelector(".hamburger");
  const navMenu = host.querySelector(".nav-menu");

  hamburger?.addEventListener("click", () => {
    navMenu.classList.toggle("active");
  });

  host.querySelectorAll(".nav-menu a").forEach((a) => {
    a.addEventListener("click", () => navMenu.classList.remove("active"));
  });
}

/* ===============================
   CAROUSEL - ABOUT PAGE
================================ */

let currentSlide = 0;

function moveSlide(direction) {
  const slide = document.querySelector(".carousel-slide");
  if (!slide) return; // si no hay carrusel en esta página, no hace nada

  const images = slide.querySelectorAll("img");
  const totalSlides = images.length;
  if (totalSlides === 0) return;

  currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
  slide.style.transform = `translateX(-${currentSlide * 100}%)`;
}

// Para que funcione con onclick="moveSlide(...)"
window.moveSlide = moveSlide;

/* ===============================
   INIT
================================ */

document.addEventListener("DOMContentLoaded", () => {
  loadHeader();
});
