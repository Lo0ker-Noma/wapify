"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { recordOrder, markOrderPaid } from "@/lib/orders";

type CheckoutData = {
  invoice: string;
  verify_url: string;
  amount_sat: number;
  ln_address: string;
  seller_username: string;
};

type Phase = "loading" | "ready" | "paid" | "error";
type Method = "wapu" | "lightning";

function CheckoutContent() {
  const params = useSearchParams();
  const amountSats = Number(params.get("sats") ?? "0");
  const productName = params.get("product") ?? "Compra";
  // Both new params and legacy `seller` are supported
  const lnAddress = params.get("ln") ?? params.get("seller") ?? "";
  const wapuUsername = params.get("wapu") ?? "";

  // Default method: Wapu when available (instant LUD-21 verify), else Lightning
  const initialMethod: Method = wapuUsername ? "wapu" : "lightning";
  const [method, setMethod] = useState<Method>(initialMethod);

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CheckoutData | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState<"invoice" | "ln" | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const polledRef = useRef<NodeJS.Timeout | null>(null);

  const seller = useMemo(() => {
    if (method === "wapu") return wapuUsername || lnAddress;
    return lnAddress || wapuUsername;
  }, [method, lnAddress, wapuUsername]);

  // Re-fetch invoice when method changes
  useEffect(() => {
    let cancelled = false;
    setPhase("loading");
    setData(null);
    setQr(null);
    setError(null);
    setOrderId(null);

    async function init() {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            amount_sats: amountSats,
            seller,
            product_id: productName,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "checkout error");
        if (cancelled) return;
        setData(json);
        const dataUrl = await QRCode.toDataURL(json.invoice.toUpperCase(), {
          margin: 1,
          width: 320,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        if (cancelled) return;
        setQr(dataUrl);
        setPhase("ready");
        const order = recordOrder({
          productName,
          amountSats: json.amount_sat,
          invoice: json.invoice,
          verifyUrl: json.verify_url,
          lnAddress: json.ln_address,
        });
        setOrderId(order.id);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Error desconocido");
        setPhase("error");
      }
    }

    if (amountSats > 0 && seller) init();
    else if (!seller) {
      setError("Falta el vendedor (Lightning Address o Wapu username)");
      setPhase("error");
    } else {
      setError("Falta el parámetro sats en la URL");
      setPhase("error");
    }

    return () => {
      cancelled = true;
    };
  }, [amountSats, seller, productName, method]);

  // Polling — faster cadence (1.5s) for Wapu, 2.5s for Lightning Address
  useEffect(() => {
    if (phase !== "ready" || !data) return;
    if (!data.verify_url) return; // some LNURL providers (WoS) don't return verify
    let stopped = false;
    const interval = method === "wapu" ? 1500 : 2500;

    async function poll() {
      try {
        const res = await fetch(
          `/api/checkout/verify?url=${encodeURIComponent(data!.verify_url)}`
        );
        const json = await res.json();
        if (stopped) return;
        if (json.settled) {
          if (orderId) markOrderPaid(orderId);
          setPhase("paid");
          return;
        }
      } catch {
        // ignore transient errors
      }
      if (!stopped) polledRef.current = setTimeout(poll, interval);
    }
    polledRef.current = setTimeout(poll, interval);
    return () => {
      stopped = true;
      if (polledRef.current) clearTimeout(polledRef.current);
    };
  }, [phase, data, method, orderId]);

  function copy(value: string, kind: "invoice" | "ln") {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    });
  }

  const hasBothMethods = Boolean(wapuUsername && lnAddress);
  const verifySupported = method === "wapu" || (data && data.verify_url);

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
        {phase === "paid" ? "✓ Pagado" : "Escaneá y pagá"}
      </h1>
      <p className="muted" style={{ fontSize: 15, marginBottom: 24 }}>
        {productName} · ⚡ {amountSats.toLocaleString("es-AR")} sats
      </p>

      {hasBothMethods && phase !== "paid" && (
        <div
          style={{
            display: "flex",
            gap: 6,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: 4,
            marginBottom: 16,
          }}
        >
          <MethodTab
            active={method === "wapu"}
            onClick={() => setMethod("wapu")}
            badge="rápido"
          >
            🤖 Wapu
          </MethodTab>
          <MethodTab
            active={method === "lightning"}
            onClick={() => setMethod("lightning")}
          >
            ⚡ Lightning Address
          </MethodTab>
        </div>
      )}

      {phase === "loading" && (
        <div className="card">
          <p className="muted">
            Generando invoice via{" "}
            {method === "wapu" ? "Wapu" : "Lightning Address"}…
          </p>
        </div>
      )}

      {phase === "error" && (
        <div
          className="card"
          style={{
            borderColor: "rgba(248,113,113,0.4)",
            background: "rgba(248,113,113,0.05)",
          }}
        >
          <h3 style={{ marginBottom: 8 }}>No pude generar el invoice</h3>
          <p className="muted" style={{ fontSize: 14 }}>
            {error}
          </p>
          {hasBothMethods && (
            <button
              className="btn btn-outline"
              style={{ marginTop: 16 }}
              onClick={() =>
                setMethod(method === "wapu" ? "lightning" : "wapu")
              }
            >
              Probar con {method === "wapu" ? "Lightning Address" : "Wapu"}
            </button>
          )}
        </div>
      )}

      {phase === "ready" && data && qr && (
        <>
          <div className="card" style={{ textAlign: "center" }}>
            <img
              src={qr}
              alt="Lightning invoice QR"
              style={{
                width: "100%",
                maxWidth: 320,
                height: "auto",
                margin: "0 auto",
                borderRadius: 12,
              }}
            />
            <p
              className="muted"
              style={{
                marginTop: 16,
                fontSize: 13,
                fontFamily: "var(--font-mono)",
              }}
            >
              {data.amount_sat.toLocaleString()} sats · ⚡{" "}
              <strong style={{ color: "var(--primary)" }}>
                {data.ln_address}
              </strong>
            </p>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3
              style={{
                fontSize: 14,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                color: "var(--muted)",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Pagar con
            </h3>
            <button
              className="btn btn-primary btn-block"
              onClick={() => (window.location.href = `lightning:${data.invoice}`)}
              style={{ marginBottom: 10 }}
            >
              Abrir wallet Lightning →
            </button>
            <button
              className="btn btn-outline btn-block"
              onClick={() => copy(data.invoice, "invoice")}
              style={{ marginBottom: 10 }}
            >
              {copied === "invoice" ? "✓ Invoice copiado" : "Copiar invoice"}
            </button>
            <button
              className="btn btn-outline btn-block"
              onClick={() => copy(data.ln_address, "ln")}
            >
              {copied === "ln" ? "✓ LN address copiado" : `Copiar ${data.ln_address}`}
            </button>
          </div>

          <p
            className="muted"
            style={{
              marginTop: 20,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: 4,
                background: "var(--primary)",
                marginRight: 8,
                animation: "pulse 1.6s ease-in-out infinite",
              }}
            />
            {verifySupported
              ? method === "wapu"
                ? "Wapu confirma el pago en ~1.5s"
                : "Esperando confirmación on-chain…"
              : "Esta wallet no soporta auto-verify (LUD-21). Marcá manualmente cuando pagues."}
          </p>
        </>
      )}

      {phase === "paid" && data && (
        <div
          className="card"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,255,157,0.08), rgba(153,69,255,0.04))",
            borderColor: "rgba(0,255,157,0.4)",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              fontWeight: 600,
              color: "var(--primary)",
              marginBottom: 12,
            }}
          >
            Pago confirmado ⚡
          </h3>
          <p style={{ marginBottom: 16, fontSize: 15 }}>
            Recibimos {data.amount_sat.toLocaleString()} sats en{" "}
            <strong>{data.ln_address}</strong>. La orden quedó marcada como
            pagada en Wapufy.
          </p>
          <p className="muted" style={{ fontSize: 13 }}>
            Vía {method === "wapu" ? "Wapu (LNURL-pay + LUD-21 verify)" : "Lightning Address"}.
          </p>
        </div>
      )}
    </div>
  );
}

function MethodTab({
  active,
  onClick,
  children,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 14px",
        borderRadius: 8,
        background: active ? "var(--primary)" : "transparent",
        color: active ? "#000" : "var(--text-secondary)",
        border: "none",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
        transition: "all .2s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {children}
      {badge && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 100,
            background: active ? "rgba(0,0,0,0.15)" : "rgba(0,255,157,0.15)",
            color: active ? "#000" : "#00ff9d",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {badge}
        </span>
      )}
    </button>
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
