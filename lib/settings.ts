"use client";

import { DEFAULT_LIGHTNING_ADDRESS } from "@/lib/admin";

const KEY = "wapufy:settings";

export type StoreSettings = {
  lightningAddress: string;
  wapuUsername: string;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  lightningAddress: DEFAULT_LIGHTNING_ADDRESS,
  wapuUsername: "lacrypta",
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
