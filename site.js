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

/* ==============================
   ABOUT – PROCESS CAROUSEL
   ============================== */

let processIndex = 0;

function processMove(direction) {
  const track = document.querySelector(".carousel-track");
  if (!track) return;

  const items = track.querySelectorAll(".carousel-item");
  const total = items.length;
  if (!total) return;

  processIndex = (processIndex + direction + total) % total;
  track.style.transform = `translateX(-${processIndex * 100}%)`;
}

/* make it available for inline onclick */
window.processMove = processMove;

/* ===============================
   INIT
================================ */

document.addEventListener("DOMContentLoaded", () => {
  loadHeader();
});
