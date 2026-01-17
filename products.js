/* ======================================================
   Caro Flower Art - products.js (ROOT)
   Uses ONLY existing image paths from your repo.
   Categories:
   - flowers  (types of flowers)
   - bouquets (bouquets / arrangements)
   - roses    (rose colors)
   ====================================================== */

window.PRODUCTS = [
  // =========================
  // ROSES (colors) - best assets under images/products/*
  // =========================
  {
    id: "rose-salmon",
    category: "roses",
    name: "Salmon Roses",
    name_es: "Rosas salmón",
    price_from: 15000,
    currency: "COP",
    thumb: "images/products/rose-salmon/thumb/thumb.webp",
    gallery: ["images/products/rose-salmon/gallery/01.webp"],
    badge: "Favorito",
    available: true
  },
  {
    id: "rose-red",
    category: "roses",
    name: "Red Roses",
    name_es: "Rosas rojas",
    price_from: 15000,
    currency: "COP",
    thumb: "images/products/rose-red/thumb/thumb.webp",
    gallery: ["images/products/rose-red/gallery/01.webp"],
    badge: "Popular",
    available: true
  },
  {
    id: "rose-yellow-bouquet",
    category: "roses",
    name: "Yellow Roses Bouquet",
    name_es: "Ramo de rosas amarillas",
    price_from: 15000,
    currency: "COP",
    thumb: "images/products/rose-yellow-bouquet/thumb/thumb.webp",
    gallery: ["images/products/rose-yellow-bouquet/gallery/01.webp"],
    badge: "",
    available: true
  },
  {
    id: "rose-purple-mix",
    category: "roses",
    name: "Purple Mix",
    name_es: "Mezcla morada",
    price_from: 22000,
    currency: "COP",
    thumb: "images/products/rose-purple-mix/thumb/thumb.webp",
    gallery: ["images/products/rose-purple-mix/gallery/01.webp"],
    badge: "Nuevo",
    available: true
  },
  {
    id: "rose-bouquet",
    category: "roses",
    name: "Classic Roses Bouquet",
    name_es: "Ramo clásico de rosas",
    price_from: 15000,
    currency: "COP",
    thumb: "images/products/rose-bouquet/thumb/thumb.webp",
    gallery: ["images/products/rose-bouquet/gallery/01.webp"],
    badge: "",
    available: true
  },

  // =========================
  // FLOWERS (types) - using existing one-image assets per type
  // =========================
  {
    id: "tulips",
    category: "flowers",
    name: "Tulips",
    name_es: "Tulipanes",
    price_from: 18000,
    currency: "COP",
    thumb: "images/tulips/Tulips_bouquets.webp",
    gallery: ["images/tulips/Tulips_bouquets.webp"],
    badge: "Bestseller",
    available: true
  },
  {
    id: "hydrangeas",
    category: "flowers",
    name: "Hydrangeas",
    name_es: "Hortensias",
    price_from: 25000,
    currency: "COP",
    thumb: "images/hydrangeas/Hydrangeas_bouquets.webp",
    gallery: ["images/hydrangeas/Hydrangeas_bouquets.webp"],
    badge: "Popular",
    available: true
  },
  {
    id: "peonies",
    category: "flowers",
    name: "Peonies",
    name_es: "Peonías",
    price_from: 30000,
    currency: "COP",
    thumb: "images/peonies/Bouquets_of_paper_peonies.webp",
    gallery: ["images/peonies/Bouquets_of_paper_peonies.webp"],
    badge: "Exclusivo",
    available: true
  },
  {
    id: "carnations",
    category: "flowers",
    name: "Carnations",
    name_es: "Claveles",
    price_from: 20000,
    currency: "COP",
    thumb: "images/carnations/Carnations_bouquets.webp",
    gallery: ["images/carnations/Carnations_bouquets.webp"],
    badge: "",
    available: true
  },

  // =========================
  // BOUQUETS - using existing bouquet images
  // =========================
  {
    id: "bouquet-paper-flowers",
    category: "bouquets",
    name: "Paper Flowers Bouquet",
    name_es: "Ramo de flores de papel",
    price_from: 120000,
    currency: "COP",
    thumb: "images/bouquets/Paper_flowers_bouquets.webp",
    gallery: ["images/bouquets/Paper_flowers_bouquets.webp"],
    badge: "Popular",
    available: true
  },
  {
    id: "bouquet-paper-flowers-2",
    category: "bouquets",
    name: "Paper Flowers Bouquet (Alt)",
    name_es: "Ramo de flores de papel (Alt)",
    price_from: 140000,
    currency: "COP",
    thumb: "images/bouquets/Paper_flower_bouquets.webp",
    gallery: ["images/bouquets/Paper_flower_bouquets.webp"],
    badge: "",
    available: true
  },
  {
    id: "bouquet-paper-flowers-3",
    category: "bouquets",
    name: "Paper Flowers Bouquet (Variant)",
    name_es: "Ramo de flores de papel (Variante)",
    price_from: 150000,
    currency: "COP",
    thumb: "images/bouquets/Paper_flowers-bouquets.webp",
    gallery: ["images/bouquets/Paper_flowers-bouquets.webp"],
    badge: "Bestseller",
    available: true
  },
  {
    id: "bouquet-mini",
    category: "bouquets",
    name: "Mini Bouquet",
    name_es: "Ramo mini",
    price_from: 45000,
    currency: "COP",
    thumb: "images/bouquets/mini_paper_flower_bouquets.webp",
    gallery: ["images/bouquets/mini_paper_flower_bouquets.webp"],
    badge: "Nuevo",
    available: true
  },
  {
    id: "bouquet-wedding",
    category: "bouquets",
    name: "Wedding Paper Flowers Bouquet",
    name_es: "Ramo para boda con flores de papel",
    price_from: 150000,
    currency: "COP",
    thumb: "images/wedding/Wedding_paper_flowers_bouquets.webp",
    gallery: ["images/wedding/Wedding_paper_flowers_bouquets.webp"],
    badge: "Wedding",
    available: true
  }
];