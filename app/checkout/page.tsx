"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CheckoutPanel from "../components/CheckoutPanel";

function CheckoutContent() {
  const params = useSearchParams();
  const amountSats = Number(params.get("sats") ?? "0");
  const productName = params.get("product") ?? "Compra";
  const lnAddress = params.get("ln") ?? params.get("seller") ?? "";
  const wapuUsername = params.get("wapu") ?? "";

  return (
    <div className="page-wrap" style={{ maxWidth: 560 }}>
      <span className="tag-pill">⚡ Checkout</span>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(32px, 5vw, 44px)",
          fontWeight: 700,
          letterSpacing: "-1px",
          marginBottom: 8,
        }}
      >
        Escaneá y pagá
      </h1>
      <p className="muted" style={{ fontSize: 15, marginBottom: 24 }}>
        {productName} · ⚡ {amountSats.toLocaleString("es-AR")} sats
      </p>

      <CheckoutPanel
        amountSats={amountSats}
        productName={productName}
        lnAddress={lnAddress}
        wapuUsername={wapuUsername}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="page-wrap">
          <p className="muted">Cargando checkout…</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
