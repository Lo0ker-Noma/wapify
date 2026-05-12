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
  wapuUsername: "lacrypta",
  wapuApiBase: "https://be-stage.wapu.app",
  theme: "crypta",
  gridSize: "md",
};

export function loadSettings(): StoreSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoreSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
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
