"use client";

import { useEffect, useRef, useState } from "react";
import { recordOrder, markOrderPaid } from "@/lib/orders";

type Phase = "login" | "confirm" | "paying" | "polling" | "paid" | "error";

const TOKEN_KEY = "wapufy:wapuToken";

export default function WapuPaymentPanel({
  amountSats,
  productName,
  receiverUsername,
  buyerNpub,
  buyerName,
  buyerNote,
  onPaid,
}: {
  amountSats: number;
  productName: string;
  receiverUsername: string;
  buyerNpub?: string;
  buyerName?: string;
  buyerNote?: string;
  onPaid?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [ars, setArs] = useState<number | null>(null);
  const [arsUpdatedAt, setArsUpdatedAt] = useState<number | null>(null);
  const [usdt, setUsdt] = useState<number | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Restore JWT from sessionStorage on mount so the buyer doesn't re-login
  // for each item in the same browser session.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.sessionStorage.getItem(TOKEN_KEY);
    if (stored) {
      setAccessToken(stored);
      setPhase("confirm");
    }
  }, []);

  // Fetch ARS preview and keep it fresh — Wapu rates can move fast and we
  // don't want the buyer staring at a stale number. Hits /api/rates (now
  // Cache-Control: no-store) every 5s while the panel is mounted and paused
  // once the payment is settled.
  useEffect(() => {
    if (amountSats <= 0) return;
    let cancelled = false;
    const ac = new AbortController();

    async function fetchRate() {
      try {
        const res = await fetch(
          `/api/rates?sats=${amountSats}&t=${Date.now()}`,
          { cache: "no-store", signal: ac.signal }
        );
        if (!res.ok || cancelled) return;
        const j = await res.json();
        if (cancelled || typeof j?.ars !== "number") return;
        setArs(j.ars);
        setArsUpdatedAt(Date.now());
      } catch {
        /* swallow — show stale value until next tick */
      }
    }

    // Initial fetch
    fetchRate();
    // Refresh every 5s unless we're already paid
    const id = phase === "paid" ? null : setInterval(fetchRate, 5000);
    return () => {
      cancelled = true;
      ac.abort();
      if (id) clearInterval(id);
    };
  }, [amountSats, phase]);

  // Tick once a second so the "actualizado hace Xs" caption keeps counting
  // even when no fetch fires.
  const [, setNow] = useState(0);
  useEffect(() => {
    if (phase === "paid") return;
    const id = setInterval(() => setNow((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPhase("paying"); // reuse "paying" as loading
    try {
      const res = await fetch("/api/wapu/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json();
      if (!res.ok) {
        // Surface a friendlier explanation when the wrong env is the cause
        const upstream = json.error ?? `HTTP ${res.status}`;
        if (
          /user|usuario|not\s*found|email/i.test(upstream) &&
          !/password/i.test(upstream)
        ) {
          throw new Error(
            `${upstream} — Wapufy usa ${json.base ?? "be-stage.wapu.app"} (STAGING). Si tu cuenta es de producción no funciona acá. Registrate en stage.wapu.app y volvé a intentar.`
          );
        }
        throw new Error(upstream);
      }
      setAccessToken(json.access_token);
      window.sessionStorage.setItem(TOKEN_KEY, json.access_token);
      setPassword("");
      setPhase("confirm");
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
      setPhase("login");
    }
  }

  async function handlePay() {
    if (!accessToken) return;
    setError(null);
    setPhase("paying");
    try {
      const res = await fetch("/api/wapu/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          amountSats,
          receiverUsername,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Transfer failed");

      const tx = json.transaction;
      setUsdt(json.amountUsdt);
      setTxId(tx.transaction_id);

      // Record the order locally so it appears in /pedidos
      const order = recordOrder({
        productName,
        amountSats,
        invoice: "",
        verifyUrl: "",
        // Wapu has nothing to do with Lightning — lnAddress stays empty.
        lnAddress: "",
        wapuReceiver: receiverUsername,
        buyerNpub,
        buyerName,
        buyerNote,
        paymentMethod: "wapu",
      });
      setOrderId(order.id);

      // If Wapu returned an already-completed tx (unlikely but possible)
      if (tx.status === "Completed") {
        markOrderPaid(order.id);
        setPhase("paid");
        onPaid?.();
        return;
      }
      setPhase("polling");
    } catch (err: any) {
      setError(err?.message ?? "Pay failed");
      setPhase("confirm");
    }
  }

  // Poll transaction status until Completed / Rejected / Canceled
  useEffect(() => {
    if (phase !== "polling" || !txId || !accessToken) return;
    let stopped = false;
    async function poll() {
      try {
        const res = await fetch(
          `/api/wapu/transaction?id=${encodeURIComponent(txId!)}&token=${encodeURIComponent(accessToken!)}`
        );
        const json = await res.json();
        if (stopped) return;
        if (res.ok && json.status === "Completed") {
          if (orderId) markOrderPaid(orderId);
          setPhase("paid");
          onPaid?.();
          return;
        }
        if (res.ok && (json.status === "Canceled" || json.status === "Rejected")) {
          setError(`Transacción ${json.status === "Canceled" ? "cancelada" : "rechazada"} por Wapu`);
          setPhase("error");
          return;
        }
      } catch { /* swallow */ }
      if (!stopped) pollingRef.current = setTimeout(poll, 1500);
    }
    pollingRef.current = setTimeout(poll, 800);
    return () => {
      stopped = true;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [phase, txId, accessToken, orderId, onPaid]);

  function handleLogout() {
    window.sessionStorage.removeItem(TOKEN_KEY);
    setAccessToken(null);
    setPhase("login");
  }

  // ── Always-visible ARS conversion card ──────────────────────────────────
  const secondsAgo = arsUpdatedAt
    ? Math.floor((Date.now() - arsUpdatedAt) / 1000)
    : null;

  const arsCard = phase !== "paid" && (
    <div
      style={{
        position: "relative",
        padding: "10px 14px",
        marginBottom: 14,
        borderRadius: 10,
        background: "linear-gradient(135deg, rgba(0,255,157,0.06), rgba(153,69,255,0.04))",
        border: "1px solid rgba(0,255,157,0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              color: "var(--muted)",
              fontWeight: 600,
              marginBottom: 2,
            }}
          >
            Equivale a
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--primary)",
              lineHeight: 1.1,
            }}
          >
            {ars !== null
              ? `$ ${ars.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} ARS`
              : "…"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              color: "var(--muted)",
              fontWeight: 600,
              marginBottom: 2,
            }}
          >
            Pagás
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--bitcoin)",
              lineHeight: 1.1,
            }}
          >
            ⚡ {amountSats.toLocaleString("es-AR")} sats
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: 10,
          color: "var(--muted)",
          marginTop: 8,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: 3,
            background: "var(--primary)",
            animation: "pulse 1.6s ease-in-out infinite",
          }}
        />
        {secondsAgo === null
          ? "Cargando cotización Wapu…"
          : secondsAgo === 0
          ? "Cotización actualizada ahora"
          : `Cotización actualizada hace ${secondsAgo}s · refresca cada 5s`}
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  if (phase === "login" || (phase === "paying" && !accessToken)) {
    return (
      <>
        {arsCard}
        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(220,77,138,0.06)",
              border: "1px solid rgba(220,77,138,0.25)",
              borderRadius: 10,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
              🤖 Iniciar sesión en Wapu
            </div>
            <p className="muted" style={{ fontSize: 12, margin: 0, lineHeight: 1.5 }}>
              Pagás con tu saldo de Wapu (USDT). Apuntamos a <code style={{ fontSize: 11 }}>be-stage.wapu.app</code>.
            </p>
          </div>
          <Field label="Email Wapu">
            <input
              className="wapu-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="username"
            />
          </Field>
          <Field label="Contraseña">
            <input
              className="wapu-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </Field>
          {error && (
            <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={phase === "paying"}
          >
            {phase === "paying" ? "Conectando…" : "Conectar con Wapu →"}
          </button>
        </form>
      </>
    );
  }

  if (phase === "confirm" || phase === "paying") {
    return (
      <>
        {arsCard}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              padding: 16,
              background: "linear-gradient(135deg, rgba(0,255,157,0.05), rgba(153,69,255,0.04))",
              border: "1px solid rgba(0,255,157,0.18)",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                color: "var(--muted)",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Transferencia interna Wapu
            </div>
            <Row label="Producto" value={productName} />
            <Row label="Hacia" value={`@${receiverUsername}`} />
          </div>
          {error && (
            <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p>
          )}
          <button
            onClick={handlePay}
            className="btn btn-primary"
            disabled={phase === "paying"}
          >
            {phase === "paying" ? "Procesando…" : "Confirmar y pagar ⚡"}
          </button>
          <button onClick={handleLogout} className="btn btn-outline">
            Salir de Wapu
          </button>
        </div>
      </>
    );
  }

  if (phase === "polling") {
    return (
      <>
        {arsCard}
        <div
          style={{
            padding: 20,
            textAlign: "center",
            background: "rgba(0,255,157,0.04)",
            border: "1px solid rgba(0,255,157,0.2)",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: "inline-block",
              width: 9,
              height: 9,
              borderRadius: 5,
              background: "var(--primary)",
              marginRight: 8,
              animation: "pulse 1.6s ease-in-out infinite",
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            Esperando confirmación Wapu…
          </span>
          <p
            className="muted"
            style={{ fontSize: 12, marginTop: 10, lineHeight: 1.5 }}
          >
            Transacción {txId?.slice(0, 8)}… enviada. Wapu confirma en ~1-3s.
          </p>
        </div>
      </>
    );
  }

  if (phase === "paid") {
    return (
      <div
        style={{
          padding: 20,
          textAlign: "center",
          background: "linear-gradient(135deg, rgba(0,255,157,0.08), rgba(153,69,255,0.04))",
          border: "1px solid rgba(0,255,157,0.4)",
          borderRadius: 12,
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 6 }}>✓</div>
        <div style={{ fontWeight: 700, color: "var(--primary)", fontSize: 16 }}>
          Pago confirmado vía Wapu
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          {usdt !== null && `${usdt.toFixed(2)} USDT transferidos a @${receiverUsername}`}
        </div>
        {ars !== null && (
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ≈ $ {ars.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ARS
          </div>
        )}
        {orderId && (
          <button
            onClick={() => {
              import("@/lib/orders").then(({ loadOrders }) => {
                const order = loadOrders().find((o) => o.id === orderId);
                if (!order) return;
                import("@/lib/receipt").then(({ downloadReceipt }) =>
                  downloadReceipt(order)
                );
              });
            }}
            className="btn btn-outline"
            style={{
              marginTop: 14,
              borderColor: "rgba(247,147,26,0.5)",
              color: "var(--bitcoin)",
              fontSize: 13,
            }}
          >
            📄 Descargar recibo
          </button>
        )}
      </div>
    );
  }

  // error
  return (
    <>
      {arsCard}
      <div
        style={{
          padding: 16,
          background: "rgba(248,113,113,0.05)",
          border: "1px solid rgba(248,113,113,0.4)",
          borderRadius: 12,
        }}
      >
        <p style={{ color: "#fca5a5", fontSize: 14, margin: 0, marginBottom: 10 }}>
          <strong>Error:</strong> {error}
        </p>
        <button
          onClick={() => {
            setError(null);
            setPhase(accessToken ? "confirm" : "login");
          }}
          className="btn btn-outline"
          style={{ width: "100%" }}
        >
          Reintentar
        </button>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 10,
        marginTop: 4,
      }}
    >
      <span style={{ fontSize: 12, color: "var(--muted)" }}>{label}</span>
      <span
        style={{
          fontSize: mono ? 18 : 14,
          fontWeight: mono ? 700 : 500,
          fontFamily: mono ? "var(--font-mono)" : undefined,
          color: mono ? "var(--bitcoin)" : "var(--text)",
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          color: "var(--muted)",
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
