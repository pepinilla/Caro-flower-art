/* ======================================================
   CARO FLOWER ART – GLOBAL JS
   Header include + menu + filters + WhatsApp form
   ====================================================== */

(function () {
  // ---- Load header.html into #site-header ----
  async function loadHeader() {
    const slot = document.getElementById('site-header');
    if (!slot) return;

    try {
      const res = await fetch('header.html', { cache: 'no-store' });
      if (!res.ok) throw new Error('header.html not found');
      const html = await res.text();
      slot.innerHTML = html;
      wireHeader();
    } catch (err) {
      // fallback minimal header if header.html missing
      slot.innerHTML = `
        <header class="site-header">
          <nav class="nav">
            <a class="brand" href="#home">
              <span>Caro Flower Art</span>
            </a>
            <button class="hamburger" aria-label="Open menu" type="button">
              <i class="fa-solid fa-bars"></i>
            </button>
            <ul class="nav-menu">
              <li><a href="#gallery">Gallery</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#contact">Quote</a></li>
              <li><a href="https://www.instagram.com/caroflowerart" target="_blank" rel="noopener">Instagram</a></li>
            </ul>
          </nav>
        </header>
      `;
      wireHeader();
    }
  }

  function wireHeader() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (!hamburger || !navMenu) return;

    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-menu a').forEach(link => {
      link.addEventListener('click', () => navMenu.classList.remove('active'));
    });
  }

  // ---- Filters ----
  function wireFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.card');
    if (!filterButtons.length || !cards.length) return;

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');

        cards.forEach(card => {
          const cat = card.getAttribute('data-category');
          const show = (filter === 'all' || cat === filter);
          card.style.display = show ? 'flex' : 'none';
        });
      });
    });
  }

  // ---- Prefill contact form from buttons ----
  function wirePrefills() {
    const triggers = document.querySelectorAll('[data-prefill]');
    const occasion = document.getElementById('occasion');
    if (!triggers.length || !occasion) return;

    triggers.forEach(t => {
      t.addEventListener('click', () => {
        const value = t.getAttribute('data-prefill');
        occasion.value = value || '';
      });
    });
  }

  // ---- WhatsApp Contact Form ----
  function wireContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = (document.getElementById('name')?.value || '').trim();
      const email = (document.getElementById('email')?.value || '').trim();
      const phone = (document.getElementById('phone')?.value || '').trim();
      const occasion = (document.getElementById('occasion')?.value || '').trim();
      const message = (document.getElementById('message')?.value || '').trim();

      if (!name || !email || !message) {
        alert('Please fill Name, Email, and Details.');
        return;
      }

      const text =
`Hello Caro Flower Art! 🌸

Name: ${name}
Email: ${email}
WhatsApp: ${phone || 'N/A'}
Request: ${occasion || 'N/A'}

Details:
${message}

(Prices shown are starting prices; final quote depends on size/colors/delivery.)`;

      const wa = `https://wa.me/573209781661?text=${encodeURIComponent(text)}`;
      window.open(wa, '_blank', 'noopener');

      form.reset();
    });
  }

  // ---- Smooth scroll (safe) ----
  function wireSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;

        const el = document.querySelector(href);
        if (!el) return;

        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // Init
  document.addEventListener('DOMContentLoaded', async () => {
    await loadHeader();
    wireFilters();
    wirePrefills();
    wireContactForm();
    wireSmoothScroll();
  });
})();
