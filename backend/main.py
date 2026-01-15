from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# -----------------------------
# Config
# -----------------------------
APP_NAME = "Caro Flower Art API"

# Ajusta con env si quieres (no obligatorio)
PUBLIC_API_BASE = os.getenv("PUBLIC_API_BASE", "").rstrip("/")
COP_PER_USD = float(os.getenv("COP_PER_USD", "4100"))

# Moneda por defecto (por ahora solo CO en el frontend)
DEFAULT_COUNTRY = "CO"

# -----------------------------
# Catalog (single source of truth)
# Slugs DEBEN coincidir con tus carpetas en images/products/<slug>/
# -----------------------------
CATALOG: List[Dict[str, Any]] = [
    # Roses (ya creaste estas carpetas)
    {
        "sku": "rose-salmon",
        "category": "roses",
        "name": "Salmon Paper Rose",
        "name_es": "Rosa de papel salmón",
        "base_usd": 38,
        "thumb": "/images/products/rose-salmon/thumb/thumb.webp",
        "gallery": [
            "/images/products/rose-salmon/gallery/01.webp",
        ],
    },
    {
        "sku": "rose-red",
        "category": "roses",
        "name": "Red Rose Bouquet",
        "name_es": "Ramo de rosas rojas",
        "base_usd": 55,
        "thumb": "/images/products/rose-red/thumb/thumb.webp",
        "gallery": [
            "/images/products/rose-red/gallery/01.webp",
        ],
    },
    {
        "sku": "rose-bouquet",
        "category": "roses",
        "name": "Classic Roses Bouquet",
        "name_es": "Ramo clásico de rosas",
        "base_usd": 65,
        "thumb": "/images/products/rose-bouquet/thumb/thumb.webp",
        "gallery": [
            "/images/products/rose-bouquet/gallery/01.webp",
        ],
    },
    {
        "sku": "rose-yellow-bouquet",
        "category": "roses",
        "name": "Yellow Roses Bouquet",
        "name_es": "Ramo de rosas amarillas",
        "base_usd": 58,
        "thumb": "/images/products/rose-yellow-bouquet/thumb/thumb.webp",
        "gallery": [
            "/images/products/rose-yellow-bouquet/gallery/01.webp",
        ],
    },
    {
        "sku": "rose-purple-mix",
        "category": "roses",
        "name": "Purple Mix Bouquet",
        "name_es": "Ramo mezcla morada",
        "base_usd": 62,
        "thumb": "/images/products/rose-purple-mix/thumb/thumb.webp",
        "gallery": [
            "/images/products/rose-purple-mix/gallery/01.webp",
        ],
    },

    # (Listos para cuando armes esas páginas)
    {
        "sku": "tulips-bouquet",
        "category": "tulips",
        "name": "Tulips Bouquet",
        "name_es": "Ramo de tulipanes",
        "base_usd": 52,
        "thumb": "/images/products/tulips-bouquet/thumb/thumb.webp",
        "gallery": ["/images/products/tulips-bouquet/gallery/01.webp"],
    },
    {
        "sku": "wedding-bouquet",
        "category": "wedding",
        "name": "Wedding Paper Flowers Bouquet",
        "name_es": "Ramo de flores de papel para boda",
        "base_usd": 95,
        "thumb": "/images/products/wedding-bouquet/thumb/thumb.webp",
        "gallery": ["/images/products/wedding-bouquet/gallery/01.webp"],
    },
    {
        "sku": "peonies-bouquet",
        "category": "peonies",
        "name": "Peonies Bouquet",
        "name_es": "Ramo de peonías",
        "base_usd": 78,
        "thumb": "/images/products/peonies-bouquet/thumb/thumb.webp",
        "gallery": ["/images/products/peonies-bouquet/gallery/01.webp"],
    },
    {
        "sku": "hydrangeas-bouquet",
        "category": "hydrangeas",
        "name": "Hydrangeas Bouquet",
        "name_es": "Ramo de hortensias",
        "base_usd": 80,
        "thumb": "/images/products/hydrangeas-bouquet/thumb/thumb.webp",
        "gallery": ["/images/products/hydrangeas-bouquet/gallery/01.webp"],
    },
    {
        "sku": "carnations-bouquet",
        "category": "carnations",
        "name": "Carnations Bouquet",
        "name_es": "Ramo de claveles",
        "base_usd": 70,
        "thumb": "/images/products/carnations-bouquet/thumb/thumb.webp",
        "gallery": ["/images/products/carnations-bouquet/gallery/01.webp"],
    },
    {
        "sku": "bouquet-classic",
        "category": "bouquets",
        "name": "Paper Flowers Bouquet",
        "name_es": "Ramo de flores de papel",
        "base_usd": 85,
        "thumb": "/images/products/bouquet-classic/thumb/thumb.webp",
        "gallery": ["/images/products/bouquet-classic/gallery/01.webp"],
    },
    {
        "sku": "bouquet-mini",
        "category": "bouquets",
        "name": "Mini Bouquet",
        "name_es": "Ramo mini",
        "base_usd": 35,
        "thumb": "/images/products/bouquet-mini/thumb/thumb.webp",
        "gallery": ["/images/products/bouquet-mini/gallery/01.webp"],
    },
]


# -----------------------------
# Pricing rules
# -----------------------------
def country_rules(country: str) -> Dict[str, Any]:
    c = (country or DEFAULT_COUNTRY).upper().strip()

    # Por ahora, el sitio mostrará CO únicamente.
    # Pero dejamos estructura lista por si luego lo activas.
    if c == "CO":
        return {
            "country": "CO",
            "currency": "COP",
            "rate": COP_PER_USD,
            "multiplier": 1.0,  # puedes ajustar
        }
    if c == "US":
        return {"country": "US", "currency": "USD", "rate": 1.0, "multiplier": 1.15}
    if c == "CA":
        # tasa simple aproximada si luego la activas; puedes cambiarla
        return {"country": "CA", "currency": "CAD", "rate": 1.35, "multiplier": 1.15}

    return country_rules(DEFAULT_COUNTRY)


def format_money(amount: float, currency: str) -> str:
    currency = currency.upper()
    if currency == "COP":
        # COP sin decimales, con separador de miles
        return f"${int(round(amount)):,}".replace(",", ".")
    if currency == "USD":
        return f"${amount:,.0f}"
    if currency == "CAD":
        return f"CA${amount:,.0f}"
    return f"{amount:,.0f} {currency}"


def priced_items(country: str, category: Optional[str] = None) -> Dict[str, Any]:
    r = country_rules(country)
    currency = r["currency"]
    rate = float(r["rate"])
    mult = float(r["multiplier"])

    items = []
    for p in CATALOG:
        if category and p["category"] != category:
            continue

        local = float(p["base_usd"]) * rate * mult
        items.append(
            {
                "sku": p["sku"],
                "category": p["category"],
                "name": p["name"],
                "name_es": p["name_es"],
                "currency": currency,
                "price": local,
                "price_label": f"From {format_money(local, currency)}",
                "price_label_es": f"Desde {format_money(local, currency)}",
                "thumb": p["thumb"],
                "gallery": p.get("gallery", []),
            }
        )

    return {"country": r["country"], "currency": currency, "items": items}


# -----------------------------
# API
# -----------------------------
app = FastAPI(title=APP_NAME)

# CORS (simple)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuoteIn(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    occasion: Optional[str] = None
    message: str
    sku: Optional[str] = None


@app.get("/health")
def health():
    return {"ok": True, "service": APP_NAME}


@app.get("/api/catalog")
def api_catalog(country: str = DEFAULT_COUNTRY, category: Optional[str] = None):
    """
    Returns priced catalog items.
    Example:
      /api/catalog?country=CO
      /api/catalog?country=CO&category=roses
    """
    return priced_items(country=country, category=category)


@app.post("/api/quote")
def create_quote(q: QuoteIn):
    # Por ahora solo "recibido". Luego lo conectas a email/DB/Notion/etc.
    return {"ok": True, "received": q.model_dump()}


@app.get("/api/config")
def api_config():
    """
    Optional helper for frontend.
    """
    return {
        "default_country": DEFAULT_COUNTRY,
        "public_api_base": PUBLIC_API_BASE,
    }
