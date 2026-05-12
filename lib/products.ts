"use client";

export type Product = {
  id: string;
  name: string;
  subtitle?: string;
  price: number; // sats
  img: string;
  tag?: string;
};

const KEY_PREFIX = "wapufy:products:";

export const DEFAULT_LACRYPTA_PRODUCTS: Product[] = [
  {
    id: "yerba-hdmp",
    name: "Yerba Mate HDMP",
    subtitle: "Yerba mate con palo para tener el pito parado.",
    price: 8,
    img: "https://placehold.co/600x600/000000/00ff9d/png?text=YERBA+HDMP",
    tag: "★ Más vendida",
  },
  {
    id: "hoodie-crypta",
    name: "Hoodie LaCrypta Black",
    subtitle: "Algodón pesado, capucha forrada. Made in AR.",
    price: 7,
    img: "https://placehold.co/600x600/000000/00ff9d/png?text=HOODIE",
  },
  {
    id: "cap-hdmp",
    name: "Gorra HDMP Verde",
    subtitle: "Bordado verde Nostr sobre negro.",
    price: 5,
    img: "https://placehold.co/600x600/000000/00ff9d/png?text=CAP",
  },
  {
    id: "stickers",
    name: "Sticker Pack (10u)",
    subtitle: "Pack troquelado, vinilo resistente al agua.",
    price: 3,
    img: "https://placehold.co/600x600/000000/9945ff/png?text=STICKERS",
  },
  {
    id: "tote-hodl",
    name: "Tote 'HODL' Crudo",
    subtitle: "Para llevar tus seeds y la merca a la feria.",
    price: 4,
    img: "https://placehold.co/600x600/000000/00ff9d/png?text=TOTE",
  },
  {
    id: "mug-lightning",
    name: "Taza ⚡ Lightning",
    subtitle: "Cerámica, 350ml, asa anti-quema-dedos.",
    price: 5,
    img: "https://placehold.co/600x600/000000/9945ff/png?text=MUG",
  },
  {
    id: "spray-antikukas",
    name: "Spray de Pimienta Antikukas",
    subtitle: "Perfecto para que no te suen la billetera.",
    price: 6,
    img: "https://placehold.co/600x600/000000/00ff9d/png?text=ANTIKUKAS",
    tag: "🌶 Defensa P2P",
  },
];

export const DEFAULT_DEMO_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Yerba mate orgánica 500g",
    price: 4,
    img: "https://placehold.co/600x600/0a0a0a/dc4d8a/png?text=Yerba",
  },
  {
    id: "p2",
    name: "Mate de calabaza",
    price: 7,
    img: "https://placehold.co/600x600/0a0a0a/9945ff/png?text=Mate",
  },
  {
    id: "p3",
    name: "Bombilla de alpaca",
    price: 5,
    img: "https://placehold.co/600x600/0a0a0a/dc4d8a/png?text=Bombilla",
  },
];

export function getDefaultProducts(slug: string): Product[] {
  if (slug === "lacrypta") return DEFAULT_LACRYPTA_PRODUCTS;
  if (slug === "demo") return DEFAULT_DEMO_PRODUCTS;
  return [];
}

export function loadProducts(slug: string): Product[] {
  if (typeof window === "undefined") return getDefaultProducts(slug);
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + slug);
    if (raw) {
      const parsed = JSON.parse(raw) as Product[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    // ignore
  }
  return getDefaultProducts(slug);
}

export function saveProducts(slug: string, products: Product[]): void {
  if (typeof window === "undefined") return;
  // Save to localStorage for immediate reads
  window.localStorage.setItem(KEY_PREFIX + slug, JSON.stringify(products));
  // Also persist to server disk so data survives port changes and cache clears
  fetch(`/api/store-data?slug=${encodeURIComponent(slug)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products }),
  }).catch(() => {
    // Non-fatal: localStorage is the primary store, server is backup
  });
}

/**
 * Loads products preferring server disk data over localStorage defaults.
 * Falls back to localStorage then defaults. Call this once on mount.
 */
export async function loadProductsWithServerSync(slug: string): Promise<Product[]> {
  if (typeof window === "undefined") return getDefaultProducts(slug);
  try {
    const res = await fetch(`/api/store-data?slug=${encodeURIComponent(slug)}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.products) && json.products.length > 0) {
        // Update localStorage with authoritative server data
        window.localStorage.setItem(KEY_PREFIX + slug, JSON.stringify(json.products));
        return json.products as Product[];
      }
    }
  } catch {
    // Server unavailable — fall through to localStorage
  }
  return loadProducts(slug);
}

export function resetProducts(slug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY_PREFIX + slug);
  fetch(`/api/store-data?slug=${encodeURIComponent(slug)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products: [] }),
  }).catch(() => {});
}
