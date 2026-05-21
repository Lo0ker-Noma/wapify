"use client";

import { useEffect, useState } from "react";

type PriceState = { usd: number; ars: number };

// Module-level cache shared across all hook instances in the same tab.
let _cache: PriceState | null = null;
let _cachedAt = 0;
const TTL_MS = 60_000; // 1 min

export function useBtcPrice() {
  const [price, setPrice] = useState<PriceState | null>(_cache);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    const now = Date.now();
    if (_cache && now - _cachedAt < TTL_MS) {
      setPrice(_cache);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/api/btc-price")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.usd > 0) {
          _cache = { usd: data.usd, ars: data.ars };
          _cachedAt = Date.now();
          setPrice(_cache);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { price, loading };
}

/**
 * Convert sats to a display USD string like "$3.50" or "$0.0012"
 */
export function satsToUsdStr(sats: number, usdPerBtc: number): string {
  const usd = (sats / 1e8) * usdPerBtc;
  if (usd === 0) return "$0.00";
  if (usd < 0.001) return `$${usd.toFixed(6)}`;
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) return `$${usd.toFixed(2)}`;
  if (usd < 1000) return `$${usd.toFixed(2)}`;
  return `$${usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
