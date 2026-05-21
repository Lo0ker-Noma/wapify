"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { useBtcPrice, satsToUsdStr } from "@/lib/use-btc-price";

/**
 * Sticky bottom bar shown on mobile when the cart has at least 1 item.
 * Gives a prominent path to checkout without needing to find the navbar icon.
 */
export default function MobileCartBar() {
  const { count, items } = useCart();
  const { price: btcPrice } = useBtcPrice();

  if (count === 0) return null;

  const totalSats = items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const usdStr = btcPrice ? satsToUsdStr(totalSats, btcPrice.usd) : null;

  return (
    <div className="mobile-cart-bar">
      <div style={{ lineHeight: 1.3 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
          🛒 {count} {count === 1 ? "producto" : "productos"}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--bitcoin)",
            fontWeight: 600,
          }}
        >
          ⚡ {totalSats.toLocaleString("es-AR")} sats
          {usdStr && (
            <span style={{ color: "var(--muted)", fontWeight: 400 }}>
              {" "}· {usdStr}
            </span>
          )}
        </div>
      </div>
      <Link
        href="/cart"
        className="btn btn-primary"
        style={{ fontSize: 14, padding: "10px 20px", whiteSpace: "nowrap" }}
      >
        Ver carrito →
      </Link>
    </div>
  );
}
