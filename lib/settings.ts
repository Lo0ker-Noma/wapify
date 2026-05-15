"use client";

import { DEFAULT_LIGHTNING_ADDRESS } from "@/lib/admin";

const KEY = "wapufy:settings";

export type StoreTheme = "crypta" | "wapu" | "earth";
export type GridSize = "sm" | "md" | "lg";

export type StoreSettings = {
  lightningAddress: string;
  wapuUsername: string;
  wapuApiKey?: string;
  wapuApiBase?: string;
  /** Visual theme applied to the storefront */
  theme?: StoreTheme;
  /** Product grid density on the storefront */
  gridSize?: GridSize;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  lightningAddress: DEFAULT_LIGHTNING_ADDRESS,
  // Usertag real del admin del demo en Wapu staging (be-stage.wapu.app).
  // El usertag previo "lacrypta" no existe en staging y devolvía
  // "User not found" al intentar pagar con Wapu.
  wapuUsername: "lookernoma",
  wapuApiBase: "https://be-stage.wapu.app",
  theme: "crypta",
  gridSize: "md",
};

// Legacy demo placeholders we shipped before — auto-migrate to current defaults
// so existing browsers don't keep paying / receiving on dead addresses.
const LEGACY_LN_DEFAULTS = ["savvyutensil489@walletofsatoshi.com"];
const LEGACY_WAPU_DEFAULTS = ["lacrypta"];

export function loadSettings(): StoreSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoreSettings>;
      const merged: StoreSettings = { ...DEFAULT_SETTINGS, ...parsed };
      let mutated = false;
      if (LEGACY_LN_DEFAULTS.includes(merged.lightningAddress)) {
        merged.lightningAddress = DEFAULT_LIGHTNING_ADDRESS;
        mutated = true;
      }
      if (LEGACY_WAPU_DEFAULTS.includes(merged.wapuUsername)) {
        merged.wapuUsername = DEFAULT_SETTINGS.wapuUsername;
        mutated = true;
      }
      if (mutated) {
        window.localStorage.setItem(KEY, JSON.stringify(merged));
      }
      return merged;
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(s: StoreSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
}
