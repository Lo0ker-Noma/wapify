"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

export default function CheckoutPanel({
  amountSats,
  productName,
  lnAddress,
  wapuUsername,
  compact,
}: {
  amountSats: number;
  productName: string;
  lnAddress?: string;
  wapuUsername?: string;
  compact?: boolean;
}) {
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
    if (method === "wapu") return wapuUsername || lnAddress || "";
    return lnAddress || wapuUsername || "";
  }, [method, lnAddress, wapuUsername]);

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
          width: compact ? 240 : 320,
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
      setError("Falta el monto en sats");
      setPhase("error");
    }
    return () => {
      cancelled = true;
    };
  }, [amountSats, seller, productName, method, compact]);

  useEffect(() => {
    if (phase !== "ready" || !data || !data.verify_url) return;
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
        // ignore
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

  const hasBoth = Boolean(wapuUsername && lnAddress);

  return (
    <div>
      {hasBoth && phase !== "paid" && (
        <div
          style={{
            display: "flex",
            gap: 6,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: 4,
            marginBottom: 14,
          }}
        >
          <Tab active={method === "wapu"} onClick={() => setMethod("wapu")} badge="rápido">
            🤖 Wapu
          </Tab>
          <Tab
            active={method === "lightning"}
            onClick={() => setMethod("lightning")}
          >
            ⚡ Lightning
          </Tab>
        </div>
      )}

      {phase === "loading" && (
        <div
          style={{
            padding: 20,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 10,
            textAlign: "center",
          }}
        >
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Generando invoice via {method === "wapu" ? "Wapu" : "Lightning Address"}…
          </p>
        </div>
      )}

      {phase === "error" && (
        <div
          style={{
            padding: 16,
            border: "1px solid rgba(248,113,113,0.4)",
            background: "rgba(248,113,113,0.05)",
            borderRadius: 10,
          }}
        >
          <p style={{ color: "#fca5a5", fontSize: 14, margin: 0 }}>
            <strong>Error:</strong> {error}
          </p>
          {hasBoth && (
            <button
              className="btn btn-outline"
              style={{ marginTop: 12 }}
              onClick={() => setMethod(method === "wapu" ? "lightning" : "wapu")}
            >
              Probar con {method === "wapu" ? "Lightning Address" : "Wapu"}
            </button>
          )}
        </div>
      )}

      {phase === "ready" && data && qr && (
        <>
          <div
            style={{
              background: "#fff",
              padding: 12,
              borderRadius: 12,
              textAlign: "center",
            }}
          >
            <img
              src={qr}
              alt="Lightning invoice QR"
              style={{
                width: "100%",
                maxWidth: compact ? 240 : 320,
                height: "auto",
                margin: "0 auto",
                display: "block",
              }}
            />
          </div>
          <p
            style={{
              marginTop: 10,
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              color: "var(--text-secondary)",
              textAlign: "center",
            }}
          >
            ⚡{" "}
            <strong style={{ color: "var(--primary)" }}>{data.ln_address}</strong>
          </p>

          <button
            className="btn btn-primary btn-block"
            onClick={() => (window.location.href = `lightning:${data.invoice}`)}
            style={{ marginTop: 12 }}
          >
            Abrir wallet Lightning →
          </button>
          <button
            className="btn btn-outline btn-block"
            onClick={() => copy(data.invoice, "invoice")}
            style={{ marginTop: 8 }}
          >
            {copied === "invoice" ? "✓ Invoice copiado" : "Copiar invoice"}
          </button>
          <button
            className="btn btn-outline btn-block"
            onClick={() => copy(data.ln_address, "ln")}
            style={{ marginTop: 8 }}
          >
            {copied === "ln" ? "✓ LN copiado" : `Copiar ${data.ln_address}`}
          </button>

          <p
            className="muted"
            style={{
              marginTop: 14,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: 4,
                background: "var(--primary)",
                marginRight: 8,
                animation: "pulse 1.6s ease-in-out infinite",
              }}
            />
            {data.verify_url
              ? method === "wapu"
                ? "Wapu confirma en ~1.5s"
                : "Esperando confirmación on-chain…"
              : "Esta wallet no soporta auto-verify"}
          </p>
        </>
      )}

      {phase === "paid" && data && (
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(0,255,157,0.08), rgba(153,69,255,0.04))",
            border: "1px solid rgba(0,255,157,0.4)",
            padding: 20,
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--primary)",
              marginBottom: 10,
            }}
          >
            ✓ Pago confirmado ⚡
          </h3>
          <p style={{ fontSize: 14, marginBottom: 6 }}>
            Recibimos {data.amount_sat.toLocaleString()} sats en{" "}
            <strong>{data.ln_address}</strong>.
          </p>
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>
            Vía {method === "wapu" ? "Wapu (LUD-21 verify)" : "Lightning Address"}.
          </p>
        </div>
      )}
    </div>
  );
}

function Tab({
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
        padding: "9px 12px",
        borderRadius: 8,
        background: active ? "var(--primary)" : "transparent",
        color: active ? "#000" : "var(--text-secondary)",
        border: "none",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
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
