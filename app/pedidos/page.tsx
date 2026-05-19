"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import { Order, loadOrders } from "@/lib/orders";
import { downloadReceipt } from "@/lib/receipt";

function fmtTime(ms: number): string {
  const diffSec = Math.floor((Date.now() - ms) / 1000);
  if (diffSec < 60) return `hace ${diffSec}s`;
  if (diffSec < 3600) return `hace ${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `hace ${Math.floor(diffSec / 3600)}h`;
  return `hace ${Math.floor(diffSec / 86400)}d`;
}

function shortInvoice(inv: string): string {
  if (!inv) return "—";
  return `${inv.slice(0, 14)}…${inv.slice(-8)}`;
}

export default function PedidosPage() {
  const { pubkey, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!pubkey || !isAdmin) {
      router.replace("/login");
      return;
    }
    setOrders(loadOrders());
    setHydrated(true);
  }, [pubkey, isAdmin, loading, router]);

  const totals = useMemo(() => {
    const paid = orders.filter((o) => o.status === "paid");
    const totalSats = paid.reduce((acc, o) => acc + o.amountSats, 0);
    return { count: orders.length, paid: paid.length, totalSats };
  }, [orders]);

  if (!pubkey || !isAdmin || !hydrated) {
    return (
      <div className="page-wrap">
        <p className="muted">Verificando sesión…</p>
      </div>
    );
  }

  return (
    <div className="page-wrap theme-crypta" style={{ maxWidth: 880 }}>
      <span className="tag-pill">📑 Pedidos · LaCrypta</span>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(36px, 5vw, 52px)",
          fontWeight: 700,
          letterSpacing: "-1.5px",
          lineHeight: 1.05,
          marginBottom: 12,
        }}
      >
        Tus pedidos
      </h1>
      <p className="muted" style={{ fontSize: 16, marginBottom: 32, maxWidth: 580 }}>
        Cada pedido es un recibo Lightning. Los sats van directo a tu Lightning
        Address — Wapufy no toca el dinero ni almacena tus invoices más allá de
        este historial local.
      </p>

      <div className="row" style={{ marginBottom: 32 }}>
        <Stat label="Total pedidos" value={totals.count.toString()} />
        <Stat label="Pagados" value={totals.paid.toString()} />
        <Stat label="Sats recibidos" value={`⚡ ${totals.totalSats}`} mono />
      </div>

      {orders.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <p className="muted" style={{ fontSize: 15 }}>
            Todavía no hay pedidos. Compartí tu tienda{" "}
            <Link href="/store/lacrypta" style={{ color: "var(--primary)" }}>
              /store/lacrypta
            </Link>{" "}
            para que entren las primeras ventas.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 32, display: "flex", gap: 10 }}>
        <Link href="/dashboard" className="btn btn-outline">
          ← Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const isPaid = order.status === "paid";
  const hasBuyer = !!(order.buyerName?.trim() || order.buyerNpub?.trim());
  const hasNote = !!order.buyerNote?.trim();
  const [open, setOpen] = useState(false);

  return (
    <div
      className="card"
      style={{
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 20,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 10,
            background: isPaid
              ? "linear-gradient(135deg, rgba(0,255,157,0.18), rgba(0,255,157,0.08))"
              : "rgba(255,255,255,0.04)",
            border: isPaid
              ? "1px solid rgba(0,255,157,0.3)"
              : "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}
        >
          {isPaid ? "✓" : "⏳"}
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {order.productName}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {/* Lightning shows invoice prefix; Wapu has no invoice. */}
            {order.paymentMethod !== "wapu" && (
              <>
                <span>{shortInvoice(order.invoice)}</span>
                <span>·</span>
              </>
            )}
            <span>{fmtTime(order.createdAt)}</span>
            {order.paymentMethod === "wapu" && order.wapuReceiver ? (
              <>
                <span>·</span>
                <span>🤖 → @{order.wapuReceiver}</span>
              </>
            ) : order.lnAddress ? (
              <>
                <span>·</span>
                <span>⚡ → {order.lnAddress}</span>
              </>
            ) : null}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--bitcoin)",
              marginBottom: 4,
            }}
          >
            ⚡ {order.amountSats}
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: isPaid ? "#00ff9d" : "#fbbf24",
            }}
          >
            {isPaid ? "Pagado" : "Pendiente"}
          </div>
        </div>
      </div>

      {/* Buyer chip (always visible if any data) */}
      {hasBuyer && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            background: "rgba(0,255,157,0.06)",
            border: "1px solid rgba(0,255,157,0.18)",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 14 }}>👤</span>
          {order.buyerName?.trim() && (
            <span style={{ color: "var(--text)", fontWeight: 700 }}>
              {order.buyerName.trim()}
            </span>
          )}
          {order.buyerNpub?.trim() && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-secondary)",
                fontSize: 11,
                wordBreak: "break-all",
              }}
              title={order.buyerNpub}
            >
              🔑 {order.buyerNpub.slice(0, 16)}…{order.buyerNpub.slice(-10)}
            </span>
          )}
        </div>
      )}

      {/* Detail toggle + actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(hasNote || order.invoice || order.paidAt) && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="btn btn-outline"
            style={{ fontSize: 12, padding: "6px 12px" }}
          >
            {open ? "▴ Ocultar detalle" : "▾ Ver detalle"}
          </button>
        )}
        {isPaid && (
          <button
            onClick={() => downloadReceipt(order)}
            className="btn btn-outline"
            style={{
              fontSize: 12,
              padding: "6px 12px",
              borderColor: "rgba(247,147,26,0.4)",
              color: "var(--bitcoin)",
            }}
          >
            📄 Descargar recibo
          </button>
        )}
      </div>

      {/* Expanded detail */}
      {open && (
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            fontSize: 13,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {hasNote && (
            <div
              style={{
                padding: "10px 12px",
                background: "rgba(247,147,26,0.08)",
                borderLeft: "3px solid var(--bitcoin)",
                borderRadius: 4,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              📝 <strong>Nota del cliente:</strong>{" "}
              <span style={{ color: "var(--text-secondary)" }}>
                {order.buyerNote!.trim()}
              </span>
            </div>
          )}
          <DetailRow
            label="ID de orden"
            value={order.id}
            mono
          />
          {order.paymentMethod && (
            <DetailRow
              label="Método"
              value={
                order.paymentMethod === "wapu"
                  ? "Wapu (transferencia interna USDT)"
                  : "Lightning Network"
              }
            />
          )}
          {/* Receiver per rail: Wapu shows @usertag, Lightning shows ln address. */}
          {order.paymentMethod === "wapu" && order.wapuReceiver && (
            <DetailRow label="Wapu" value={`@${order.wapuReceiver}`} mono />
          )}
          {order.paymentMethod !== "wapu" && order.lnAddress && (
            <DetailRow label="Lightning Address" value={order.lnAddress} mono />
          )}
          {/* Invoice only exists on Lightning orders. */}
          {order.paymentMethod !== "wapu" && order.invoice && (
            <DetailRow
              label="Invoice"
              value={`${order.invoice.slice(0, 28)}…${order.invoice.slice(-12)}`}
              mono
            />
          )}
          {order.paidAt && (
            <DetailRow
              label="Confirmado"
              value={new Date(order.paidAt).toLocaleString("es-AR")}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Stat({
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
      className="feature-card"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          color: "var(--muted)",
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: mono ? "var(--font-mono)" : "var(--font-display)",
          fontSize: mono ? 22 : 28,
          fontWeight: 700,
          color: mono ? "var(--bitcoin)" : "var(--text)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DetailRow({
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
        gap: 12,
        fontSize: 12,
      }}
    >
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span
        style={{
          color: "var(--text)",
          fontFamily: mono ? "var(--font-mono)" : undefined,
          textAlign: "right",
          wordBreak: "break-all",
          maxWidth: "70%",
        }}
      >
        {value}
      </span>
    </div>
  );
}
