/* ======================================================
   Caro Flower Art - products.js (ROOT)
   prices_by_currency en TODOS los productos
   Base: COP
   CAD se calcula automáticamente
   ====================================================== */

/* 🔧 Ajusta SOLO este valor cuando quieras */
const FX_COP_PER_CAD = 3000; // 1 CAD = 3000 COP

function toCADfromCOP(cop) {
  return Math.round((Number(cop || 0) / FX_COP_PER_CAD) * 100) / 100;
}

function pricesCOPtoCAD(pricesCOP) {
  return (pricesCOP || []).map(p => ({
    amount: toCADfromCOP(p.amount),
    label: p.label,
    label_es: p.label_es
  }));
}

window.PRODUCTS = [

  /* =========================
     ROSES (colors)
     ========================= */
  {
    id: "rose-salmon",
    category: "rose-colors",
    name: "Salmon Roses",
    name_es: "Rosas salmón",
    prices_by_currency: {
      COP: [
        { amount: 15000, label: "unit", label_es: "unidad" },
        { amount: 130000, label: "10 units", label_es: "10 unidades" }
      ],
      CAD: pricesCOPtoCAD([
        { amount: 15000, label: "unit", label_es: "unidad" },
        { amount: 130000, label: "10 units", label_es: "10 unidades" }
      ])
    },
    thumb: "images/products/rose-salmon/thumb/thumb.webp",
    gallery: [
      "images/products/rose-salmon/gallery/01.webp",
      "images/roses/salmon roses/Paper-rose-salmon-5.webp",
      "images/roses/salmon roses/Paper-rose-salmon-4.webp",
      "images/roses/salmon roses/Paper-rose-salmon-3.webp"
    ],
    available: true
  },

  {
    id: "rose-red",
    category: "rose-colors",
    name: "Red Roses",
    name_es: "Rosas rojas",
    prices_by_currency: {
      COP: [
        { amount: 15000, label: "unit", label_es: "unidad" },
        { amount: 130000, label: "10 units", label_es: "10 unidades" }
      ],
      CAD: pricesCOPtoCAD([
        { amount: 15000, label: "unit", label_es: "unidad" },
        { amount: 130000, label: "10 units", label_es: "10 unidades" }
      ])
    },
    thumb: "images/roses/red roses/Paper_red_roses.webp",
    gallery: [
      "images/roses/red roses/Paper_red_roses.webp",
      "images/roses/red roses/Paper_red_roses_bouquet.webp"
    ],
    available: true
  },

  /* =========================
     FLOWERS
     ========================= */
  {
    id: "tulips",
    category: "flowers",
    name: "Tulips",
    name_es: "Tulipanes",
    prices_by_currency: {
      COP: [
        { amount: 10000, label: "unit", label_es: "unidad" },
        { amount: 110000, label: "10 units", label_es: "10 unidades" }
      ],
      CAD: pricesCOPtoCAD([
        { amount: 10000, label: "unit", label_es: "unidad" },
        { amount: 110000, label: "10 units", label_es: "10 unidades" }
      ])
    },
    thumb: "images/tulips/Tulips_bouquets.webp",
    gallery: ["images/tulips/Tulips_bouquets.webp"],
    available: true
  },

  /* =========================
     BOUQUETS
     ========================= */
  {
    id: "bouquet-paper-flowers",
    category: "bouquets",
    name: "Paper Flowers Bouquet",
    name_es: "Ramo de flores de papel",
    price_from_by_currency: {
      COP: 140000,
      CAD: toCADfromCOP(140000)
    },
    thumb: "images/bouquets/hand/thumb/Paper_flower_bouquets.webp",
    gallery: [
      "images/bouquets/hand/gallery/Wedding-bouquet.webp"
    ],
    available: true
  }
];