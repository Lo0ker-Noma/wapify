"use client";

export type StoreMeta = {
  name: string;
  bio: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroKicker?: string;
  logo?: string;
};

const KEY_PREFIX = "wapufy:storemeta:";

export const DEFAULT_META: Record<string, StoreMeta> = {
  demo: {
    name: "Tienda Demo",
    bio: "Productos mock para probar el flow Wapu Lightning. El pago va a la Lightning Address configurada en Settings.",
  },
  lacrypta: {
    name: "LaCrypta Apparel HDMP",
    bio: "Drop oficial de la comunidad. Hecho en Argentina, pagado con WAPU o Lightning. Sin custodia, sin intermediarios.",
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

/**
 * Loads meta preferring server (Vercel Blob) data over localStorage.
 * If server is empty but localStorage has custom data, migrates it up.
 */
export async function loadStoreMetaWithServerSync(slug: string): Promise<StoreMeta | null> {
  const fallback = DEFAULT_META[slug] ?? null;
  if (typeof window === "undefined") return fallback;

  try {
    const res = await fetch(
      `/api/store-data?slug=${encodeURIComponent(slug)}&kind=meta`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const json = await res.json();
      const serverData = json.data;
      if (serverData && typeof serverData === "object" && serverData.name) {
        window.localStorage.setItem(KEY_PREFIX + slug, JSON.stringify(serverData));
        return { ...(fallback ?? { name: slug, bio: "" }), ...serverData };
      }
    }

    // Server empty → migrate localStorage up
    const localRaw = window.localStorage.getItem(KEY_PREFIX + slug);
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw) as StoreMeta;
        if (parsed && parsed.name) {
          fetch(`/api/store-data?slug=${encodeURIComponent(slug)}&kind=meta`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: parsed }),
          }).catch(() => { /* best-effort */ });
        }
      } catch { /* ignore */ }
    }
  } catch {
    // Server unavailable → fall through
  }
  return loadStoreMeta(slug);
}

export function saveStoreMeta(slug: string, meta: StoreMeta): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_PREFIX + slug, JSON.stringify(meta));
  // Persist to server (Vercel Blob) so it's visible from any browser
  fetch(`/api/store-data?slug=${encodeURIComponent(slug)}&kind=meta`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: meta }),
  }).catch(() => { /* best-effort */ });
}

export function resetStoreMeta(slug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY_PREFIX + slug);
}
