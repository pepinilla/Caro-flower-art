/* ======================================================
   Caro Flower Art - products.js (ROOT)
   Uses ONLY existing image paths from your repo.
   Categories:
   - flowers  (types of flowers)
   - bouquets (bouquets / arrangements)
   - rose-colors (rose colors)
   - roses (rose bouquets)
   ====================================================== */

window.PRODUCTS = [
  // =========================
  // ROSES (colors) - images/products/*
  // =========================
  {
    id: "rose-salmon",
    category: "rose-colors",
    name: "Salmon Roses",
    name_es: "Rosas salmón",
    prices: [
      { amount: 15000, label: "unit", label_es: "unidad" },
      { amount: 130000, label: "10 units", label_es: "10 unidades" }
    ],
    currency: "COP",
    thumb: "images/products/rose-salmon/thumb/thumb.webp",
    gallery: ["images/products/rose-salmon/gallery/01.webp",
             "images/roses/salmon roses/Paper-rose-salmon-5.webp",
             "images/roses/salmon roses/Paper-rose-salmon-4.webp",
             "images/roses/salmon roses/Paper-rose-salmon-3.webp"],
    badge: "Favorito",
    available: true
  },
  {
    id: "rose-red",
    category: "rose-colors",
    name: "Red Roses",
    name_es: "Rosas rojas",
    prices: [
      { amount: 15000, label: "unit", label_es: "unidad" },
      { amount: 130000, label: "10 units", label_es: "10 unidades" }
    ],
    currency: "COP",
    thumb: "images/roses/red roses/Paper_red_roses.webp",
    gallery: ["images/roses/red roses/Paper_red_roses.webp",
             "images/roses/red roses/Paper_red_roses_bouquet.webp",
             "images/roses/red roses/Red_paper_rose_2.webp",
             "images/roses/red roses/Red_paper_rose_3.webp",
             "images/roses/red roses/A_paper_red_rose.webp",
             "images/roses/red roses/A_rose_bud.webp"],
    badge: "Popular",
    available: true
  },
  {
    id: "rose-yellow-bouquet",
    category: "rose-colors",
    name: "Yellow Roses",
    name_es: "Rosas amarillas",
    prices: [
      { amount: 15000, label: "unit", label_es: "unidad" },
      { amount: 130000, label: "10 units", label_es: "10 unidades" }
    ],
    currency: "COP",
    thumb: "images/roses/yellow roses/Yellow_roses_bouquet.webp",
    gallery: ["images/roses/yellow roses/Yellow_roses_bouquet.webp"],
    badge: "",
    available: true
  },
  {
    id: "rose-purple-mix",
    category: "rose-colors",
    name: "Purple - Pink Roses",
    name_es: "Rosas moradas - rosadas",
    prices: [
      { amount: 15000, label: "unit", label_es: "unidad" },
      { amount: 130000, label: "10 units", label_es: "10 unidades" }
    ],
    currency: "COP",
    thumb: "images/roses/purple roses/Purple-flowers.webp",
    gallery: ["images/roses/purple roses/Purple-flowers.webp",
             "images/roses/purple roses/Pink-purple_roses_3.webp",
             "images/roses/purple roses/Pink-purple_roses.webp"],
    badge: "Nuevo",
    available: true
  },  

  // =========================
  // FLOWERS (types)
  // =========================

   
   {
    id: "tulips",
    category: "flowers",
    name: "Tulips",
    name_es: "Tulipanes",
    prices: [
      { amount: 10000, label: "unit", label_es: "unidad" },
      { amount: 110000, label: "10 units", label_es: "10 unidades" }
    ],
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
    prices: [
      { amount: 15000, label: "unit", label_es: "unidad" },
      { amount: 130000, label: "10 units", label_es: "10 unidades" }
    ],
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
    prices: [
      { amount: 20000, label: "unit", label_es: "unidad" },
      { amount: 180000, label: "10 units", label_es: "10 unidades" }
    ],
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
    prices: [
      { amount: 16000, label: "unit", label_es: "unidad" },
      { amount: 150000, label: "10 units", label_es: "10 unidades" }
    ],
    currency: "COP",
    thumb: "images/carnations/Carnations_bouquets.webp",
    gallery: ["images/carnations/Carnations_bouquets.webp"],
    badge: "",
    available: true
  },

  // =========================
  // BOUQUETS
  // =========================
   
  {
    id: "bouquet-paper-flowers-2",
    category: "bouquets",
    name: "Paper Flowers Bouquet",
    name_es: "Ramo de flores de papel",
    price_from: 140000,
    currency: "COP",
    thumb: "images/bouquets/hand/thumb/Paper_flower_bouquets.webp",
    gallery: ["images/bouquets/hand/gallery/Wedding-bouquet-2.webp",
              "images/bouquets/hand/thumb/Paper_flower_bouquets.webp",
             "images/bouquets/hand/gallery/Wedding-bouquet.webp"],
    badge: "",
    available: true
  },
  {
    id: "bouquet-paper-flowers-3",
    category: "bouquets",
    name: "Paper Flower Bouquet in a Jar",
    name_es: "Ramo de flores de papel en jarron",
    price_from: 200000,
    currency: "COP",
    thumb: "images/bouquets/jar/thumb/Paper_flowers_bouquets.webp",
    gallery: ["images/bouquets/jar/gallery/Paper-flowers-bouquets.webp",
             "images/bouquets/jar/thumb/Paper_flowers_bouquets.webp"],
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
    price_from: 180000,
    currency: "COP",
    thumb: "images/wedding/Wedding_paper_flowers_bouquets.webp",
    gallery: ["images/wedding/Wedding_paper_flowers_bouquets.webp",
             "images/wedding/Paper_flower_bouquet_wedding_3.webp"],
    badge: "Wedding",
    available: true
  }
];
