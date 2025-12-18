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

  host.querySelectorAll(".nav-menu a").forEach(a => {
    a.addEventListener("click", () => navMenu.classList.remove("active"));
  });
}

document.addEventListener("DOMContentLoaded", loadHeader);
