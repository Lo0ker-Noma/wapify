"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import QRCode from "qrcode";
import { recordOrder, markOrderPaid } from "@/lib/orders";
import WapuPaymentPanel from "./WapuPaymentPanel";

type CheckoutData = {
  invoice: string;
  verify_url: string;
  amount_sat: number;
  ln_address: string;
  seller_username: string;
  /** True if the seller's LNURL provider advertises NIP-57 zaps */
  nip57?: boolean;
  /** Hex pubkey of the seller's zap-publishing Nostr identity (LUD-12) */
  seller_nostr_pubkey?: string;
  /** Relays the wallet was instructed to publish the receipt to */
  zap_relays?: string[];
};

type Phase = "loading" | "ready" | "paid" | "error";
type Method = "wapu" | "lightning";

export default function CheckoutPanel({
  amountSats,
  productName,
  lnAddress,
  wapuUsername,
  compact,
  buyerNpub,
  buyerName,
}: {
  amountSats: number;
  productName: string;
  lnAddress?: string;
  wapuUsername?: string;
  compact?: boolean;
  buyerNpub?: string;
  buyerName?: string;
}) {
  const initialMethod: Method = wapuUsername ? "wapu" : "lightning";
  const [method, setMethod] = useState<Method>(initialMethod);

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CheckoutData | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState<"invoice" | "ln" | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [ars, setArs] = useState<number | null>(null);
  const polledRef = useRef<NodeJS.Timeout | null>(null);

  // ── ARS conversion preview for Wapu method ──────────────────────────────
  // Fetched whenever sats or method changes, only when method = "wapu" since
  // Wapu rates come from the Wapu API and only matter for ARS-priced sellers.
  useEffect(() => {
    if (method !== "wapu" || !amountSats || amountSats <= 0) {
      setArs(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/rates?sats=${amountSats}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        if (j && typeof j.ars === "number") setArs(j.ars);
      })
      .catch(() => { /* network error — silently hide the preview */ });
    return () => {
      cancelled = true;
    };
  }, [amountSats, method]);

  useEffect(() => {
    if (phase === "paid") setShowPopup(true);
  }, [phase]);

  const seller = useMemo(() => {
    if (method === "wapu") return wapuUsername || lnAddress || "";
    return lnAddress || wapuUsername || "";
  }, [method, lnAddress, wapuUsername]);

  useEffect(() => {
    // Skip the Lightning checkout init when the buyer selected Wapu — that
    // method has its own native panel that handles login + inner_transfer.
    if (method === "wapu") return;

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
          buyerNpub,
          buyerName,
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

  // ── LUD-21 HTTP polling (fast path A) ──────────────────────────────────────
  // Runs whenever there is a verify_url (LUD-21). If the provider didn't
  // return one, we skip polling and rely solely on NIP-57 (fast path B).
  useEffect(() => {
    if (phase !== "ready" || !data?.invoice) return;
    // No verify URL → provider doesn't support LUD-21, NIP-57 handles it
    if (!data.verify_url) return;

    let stopped = false;
    // Wapu confirms in ~1.5s; any Lightning Address poll every 800ms
    const interval = method === "wapu" ? 1500 : 800;

    async function poll() {
      try {
        const res = await fetch(
          `/api/checkout/verify?url=${encodeURIComponent(data!.verify_url)}`
        );
        if (!res.ok) {
          // Verify endpoint returned an error (e.g. host not allowed).
          // Log once and stop polling so we don't spam.
          const err = await res.json().catch(() => ({}));
          console.warn("[checkout verify]", err.error ?? res.status);
          return;
        }
        const json = await res.json();
        if (stopped) return;
        if (json.settled) {
          if (orderId) markOrderPaid(orderId);
          setPhase("paid");
          return;
        }
      } catch {
        // Network error — keep retrying
      }
      if (!stopped) polledRef.current = setTimeout(poll, interval);
    }

    polledRef.current = setTimeout(poll, interval);
    return () => {
      stopped = true;
      if (polledRef.current) clearTimeout(polledRef.current);
    };
  }, [phase, data, method, orderId]);

  // ── NIP-57 zap receipts via Nostr relays (fast path B) ──────────────────────
  // Subscribes to kind:9735 events on the same relays we asked the wallet to
  // publish to. The moment a zap receipt arrives with a bolt11 tag matching
  // our invoice, we confirm in milliseconds.
  //
  // Two important optimisations:
  //  • Filter by #p:<seller_nostr_pubkey> so the relay only sends us zaps to
  //    that recipient (not every zap on the relay).
  //  • Open the WebSockets as soon as we have the invoice (no waiting on the
  //    HTTP polling effect) and subscribe with a tiny `since` window.
  useEffect(() => {
    if (phase !== "ready" || !data?.invoice || !data.nip57) return;

    const RELAYS = (data.zap_relays && data.zap_relays.length > 0)
      ? data.zap_relays
      : [
          "wss://relay.damus.io",
          "wss://relay.nostr.band",
          "wss://nos.lol",
          "wss://relay.primal.net",
        ];

    let confirmed = false;
    const sockets: WebSocket[] = [];

    function confirmPayment() {
      if (confirmed) return;
      confirmed = true;
      if (orderId) markOrderPaid(orderId);
      setPhase("paid");
    }

    const invoiceLower = data.invoice.toLowerCase();
    const since = Math.floor(Date.now() / 1000) - 5;
    // NIP-01 standard tag filter — narrows server-side to just our seller
    const filter: Record<string, any> = { kinds: [9735], since, limit: 30 };
    if (data.seller_nostr_pubkey) filter["#p"] = [data.seller_nostr_pubkey];

    RELAYS.forEach((url) => {
      try {
        const ws = new WebSocket(url);
        const subId = `wfy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        ws.onopen = () => {
          ws.send(
            JSON.stringify(["REQ", subId, filter])
          );
        };
        ws.onmessage = (e) => {
          if (confirmed) return;
          try {
            const msg = JSON.parse(e.data as string);
            if (msg[0] !== "EVENT") return;
            const ev = msg[2];
            if (ev?.kind !== 9735) return;
            const bolt11 = ev.tags?.find((t: string[]) => t[0] === "bolt11")?.[1];
            if (bolt11 && bolt11.toLowerCase() === invoiceLower) confirmPayment();
          } catch { /* ignore malformed messages */ }
        };
        sockets.push(ws);
      } catch { /* ignore relay connection errors */ }
    });

    return () => {
      confirmed = true;
      sockets.forEach((ws) => { try { ws.close(); } catch { /* ok */ } });
    };
  }, [phase, data, orderId]);

  function copy(value: string, kind: "invoice" | "ln") {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    });
  }

  const hasBoth = Boolean(wapuUsername && lnAddress);

  return (
    <div>
      {/* Always render both tabs so the buyer can pick the payment rail.
          If a rail isn't configured yet, the body shows a helpful message
          with a link to /settings to set it up. */}
      {phase !== "paid" && (
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
          <Tab active={method === "wapu"} onClick={() => setMethod("wapu")} badge="cuenta">
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

      {/* ── Wapu native payment ───────────────────────────────────────
          When the buyer chooses Wapu, swap the LNURL/QR flow for the
          native API flow (login → confirm → inner_transfer → poll). */}
      {method === "wapu" && !wapuUsername && (
        <MissingConfigCard
          rail="Wapu"
          message="No hay un usuario Wapu configurado para esta tienda. Configurá tu cuenta Wapu en Settings para aceptar pagos con saldo Wapu."
        />
      )}
      {method === "wapu" && wapuUsername && (
        <WapuPaymentPanel
          amountSats={amountSats}
          productName={productName}
          receiverUsername={wapuUsername}
          buyerNpub={buyerNpub}
          buyerName={buyerName}
          onPaid={() => setShowPopup(true)}
        />
      )}

      {method === "lightning" && !lnAddress && (
        <MissingConfigCard
          rail="Lightning"
          message="No hay un Lightning Address configurado para esta tienda. Configurá uno en Settings (recomendamos uno con NIP-57 como Primal o Alby) para aceptar pagos por Lightning."
        />
      )}
      {method === "lightning" && lnAddress && phase === "loading" && (
        <div
          style={{
            padding: 20,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 10,
            textAlign: "center",
          }}
        >
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Generando invoice via Lightning Address…
          </p>
        </div>
      )}

      {method === "lightning" && lnAddress && phase === "error" && (
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
              onClick={() => setMethod("wapu")}
            >
              Probar con Wapu
            </button>
          )}
        </div>
      )}

      {method === "lightning" && phase === "ready" && data && qr && (
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
              color: "var(--text-secondary)",
              textAlign: "center",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 100,
                background: "rgba(0,255,157,0.08)",
                border: "1px solid rgba(0,255,157,0.2)",
                color: "var(--primary)",
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              ⚡ Lightning verificado
            </span>
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
              ? "Verificando vía Lightning + Nostr (NIP-57)…"
              : data.nip57
              ? "Escuchando zap receipt NIP-57 — confirma en ms"
              : "El Lightning Address del seller no expone auto-verify"}
          </p>
        </>
      )}

      {method === "lightning" && phase === "paid" && data && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(0,255,157,0.08), rgba(153,69,255,0.04))",
            border: "1px solid rgba(0,255,157,0.4)",
            padding: 16,
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 6 }}>⚡</div>
          <div style={{ fontWeight: 700, color: "var(--primary)", fontSize: 16 }}>
            Pago confirmado
          </div>
          <div style={{ fontSize: 13, marginTop: 4, color: "var(--bitcoin)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
            ⚡ {data.amount_sat.toLocaleString()} sats recibidos
          </div>
        </div>
      )}

      {/* ── Celebration popup ─────────────────────────────────────────── */}
      {showPopup && (
        <PaymentPopup
          amountSat={data?.amount_sat ?? amountSats}
          productName={productName}
          method={method}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}

function MissingConfigCard({ rail, message }: { rail: string; message: string }) {
  return (
    <div
      style={{
        padding: 16,
        background: "rgba(220,77,138,0.06)",
        border: "1px dashed rgba(220,77,138,0.4)",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 6,
          color: "#fbcfe8",
        }}
      >
        ⚠ Pago con {rail} no configurado
      </div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
        {message}
      </p>
      <a href="/settings" className="btn btn-outline" style={{ width: "100%", display: "block", textAlign: "center" }}>
        Ir a Settings →
      </a>
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

// ── Confetti particle data ──────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  color: i % 3 === 0 ? "#00ff9d" : i % 3 === 1 ? "#9945ff" : "#ffffff",
  left: `${Math.floor((i / 28) * 100)}%`,
  delay: `${(i * 0.07).toFixed(2)}s`,
  duration: `${0.8 + (i % 5) * 0.15}s`,
  size: i % 4 === 0 ? 10 : i % 3 === 0 ? 8 : 6,
  rotate: `${(i * 47) % 360}deg`,
}));

function PaymentPopup({
  amountSat,
  productName,
  method,
  onClose,
}: {
  amountSat: number;
  productName: string;
  method: "wapu" | "lightning";
  onClose: () => void;
}) {
  // Auto-close after 6 seconds
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes wfy-pop-in {
          0%   { opacity: 0; transform: scale(0.6) translateY(30px); }
          60%  { transform: scale(1.06) translateY(-4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes wfy-glow-pulse {
          0%, 100% { box-shadow: 0 0 0px rgba(0,255,157,0); }
          50%       { box-shadow: 0 0 48px rgba(0,255,157,0.45), 0 0 90px rgba(153,69,255,0.2); }
        }
        @keyframes wfy-bolt {
          0%   { transform: scale(1) rotate(-8deg); }
          30%  { transform: scale(1.35) rotate(8deg); }
          60%  { transform: scale(0.95) rotate(-4deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes wfy-particle {
          0%   { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          80%  { opacity: 0.6; }
          100% { opacity: 0; transform: translateY(-120px) rotate(var(--r)) scale(0.4); }
        }
        @keyframes wfy-ring {
          0%   { transform: scale(0.4); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes wfy-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(8px)",
          zIndex: 9000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {/* Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
            background: "linear-gradient(160deg, #0d0d0d 0%, #111 100%)",
            border: "1px solid rgba(0,255,157,0.35)",
            borderRadius: 24,
            padding: "48px 40px 36px",
            width: "100%", maxWidth: 400,
            textAlign: "center",
            animation: "wfy-pop-in 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards, wfy-glow-pulse 2s 0.6s ease-in-out infinite",
            overflow: "hidden",
          }}
        >
          {/* Confetti particles */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            {PARTICLES.map((p) => (
              <div
                key={p.id}
                style={{
                  position: "absolute",
                  bottom: "20%",
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  borderRadius: p.id % 2 === 0 ? "50%" : 2,
                  // @ts-ignore
                  "--r": p.rotate,
                  animation: `wfy-particle ${p.duration} ${p.delay} ease-out forwards`,
                }}
              />
            ))}
          </div>

          {/* Expanding ring */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 100, height: 100,
            border: "2px solid rgba(0,255,157,0.5)",
            borderRadius: "50%",
            animation: "wfy-ring 0.7s 0.1s ease-out forwards",
            pointerEvents: "none",
          }} />

          {/* Lightning bolt icon */}
          <div style={{
            fontSize: 72,
            lineHeight: 1,
            marginBottom: 16,
            display: "inline-block",
            animation: "wfy-bolt 0.6s 0.3s ease-in-out forwards",
            filter: "drop-shadow(0 0 16px rgba(0,255,157,0.7))",
          }}>
            ⚡
          </div>

          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-1px",
            color: "#fff",
            marginBottom: 8,
          }}>
            ¡Pago confirmado! ✓
          </h2>

          <p style={{
            fontSize: 19,
            fontWeight: 600,
            color: "var(--primary)",
            marginBottom: 6,
            lineHeight: 1.4,
          }}>
            Tu{" "}
            <span style={{ color: "#fff" }}>{productName}</span>
            {" "}está en camino 🚀
          </p>

          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 28 }}>
            <span style={{ color: "var(--bitcoin)", fontWeight: 700 }}>
              ⚡ {amountSat.toLocaleString("es-AR")} sats
            </span>{" "}
            · {method === "wapu" ? "Wapu · LUD-21" : "Lightning · NIP-57"}
          </p>

          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ width: "100%", fontSize: 15, padding: "14px 0" }}
          >
            Continuar →
          </button>

          {/* Auto-close progress bar */}
          <div style={{
            position: "absolute", bottom: 0, left: 0,
            height: 3,
            background: "var(--primary)",
            borderRadius: "0 0 0 24px",
            animation: "wfy-progress 6s linear forwards",
          }} />
        </div>
      </div>
    </>
  );
}
