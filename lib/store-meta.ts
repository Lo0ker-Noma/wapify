"use client";

export type StoreMeta = {
  name: string;
  bio: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroKicker?: string;
};

const KEY_PREFIX = "wapufy:storemeta:";

export const DEFAULT_META: Record<string, StoreMeta> = {
  demo: {
    name: "Tienda Demo",
    bio: "Productos mock para probar el flow Wapu Lightning. El pago va a la Lightning Address configurada en Settings.",
  },
  lacrypta: {
    name: "LaCrypta Apparel HDMP",
    bio: "Drop oficial de la comunidad. Hecho en Argentina, pagado en Lightning. Sin custodia, sin intermediarios — Hodl & wear.",
    heroTitle: "Apparel HDMP",
    heroSubtitle:
      "La línea de ropa de la comunidad LaCrypta. Cada pieza es un manifiesto.",
    heroKicker: "DROP 001 · HODL DON'T MISS PURPOSE",
  },
};

export function loadStoreMeta(slug: string): StoreMeta | null {
  const fallback = DEFAULT_META[slug] ?? null;
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + slug);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoreMeta>;
    return { ...(fallback ?? { name: slug, bio: "" }), ...parsed };
  } catch {
    return fallback;
  }
}

export function saveStoreMeta(slug: string, meta: StoreMeta): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_PREFIX + slug, JSON.stringify(meta));
}

export function resetStoreMeta(slug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY_PREFIX + slug);
}
