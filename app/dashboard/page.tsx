"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import { Product, loadProducts } from "@/lib/products";
import { loadSettings, StoreSettings } from "@/lib/settings";
import { loadOrders, Order } from "@/lib/orders";

export default function DashboardPage() {
  const { pubkey, isAdmin, profile, loading, logout } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!pubkey || !isAdmin) {
      router.replace("/login");
      return;
    }
    setProducts(loadProducts("lacrypta"));
    setSettings(loadSettings());
    setOrders(loadOrders());
  }, [pubkey, isAdmin, loading, router]);

  function handleLogout() {
    logout();
    router.replace("/");
  }

  if (!pubkey || !isAdmin) {
    return (
      <div className="page-wrap">
        <p className="muted">Verificando sesión…</p>
      </div>
    );
  }

  const paid = orders.filter((o) => o.status === "paid");
  const totalSatsRecv = paid.reduce((acc, o) => acc + o.amountSats, 0);

  return (
    <div className="page-wrap theme-crypta">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {profile?.picture && (
          <img
            src={profile.picture}
            alt="avatar"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: "2px solid var(--primary)",
              boxShadow: "0 0 20px var(--primary-glow)",
              objectFit: "cover",
            }}
          />
        )}
        <div>
          <span className="tag-pill" style={{ marginBottom: 8, display: "inline-block" }}>
            ★ Admin · LaCrypta
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(36px, 5vw, 52px)",
              fontWeight: 700,
              letterSpacing: "-1.5px",
              lineHeight: 1.05,
            }}
          >
            Hola, {profile?.display_name ?? profile?.name ?? "admin"}
          </h1>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 16, marginBottom: 32, maxWidth: 640 }}>
        Panel de tu tienda. Editá productos y el título, configurá tu cobro
        Lightning, revisá pedidos.
      </p>

      <div className="row" style={{ marginBottom: 32 }}>
        <Stat label="Productos" value={products.length.toString()} />
        <Stat label="Pedidos pagados" value={paid.length.toString()} />
        <Stat label="Sats recibidos" value={`⚡ ${totalSatsRecv}`} mono />
      </div>

      <div className="row" style={{ marginBottom: 32 }}>
        <ActionCard
          icon="◇"
          title="Mi tienda"
          desc="Storefront público. Editá título y productos in-place."
          href="/store/lacrypta"
          cta="Abrir tienda →"
        />
        <ActionCard
          icon="📑"
          title="Pedidos"
          desc="Historial de invoices Lightning recibidos en tu Lightning Address."
          href="/pedidos"
          cta={`Ver ${orders.length} pedido${orders.length === 1 ? "" : "s"} →`}
        />
        <ActionCard
          icon="⚙"
          title="Settings"
          desc="Configurá tu Lightning Address, usuario Wapu y métodos de cobro."
          href="/settings"
          cta="Configurar →"
        />
      </div>

      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 32,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            Cobro actual
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--primary)",
              fontSize: 14,
            }}
          >
            ⚡ {settings?.lightningAddress ?? "—"}
          </div>
        </div>
        <Link href="/settings" className="btn btn-outline">
          Cambiar
        </Link>
      </div>

      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 16,
          letterSpacing: "-0.5px",
        }}
      >
        Productos en catálogo
      </h2>
      <div className="row" style={{ marginBottom: 40 }}>
        {products.map((p) => (
          <Link
            key={p.id}
            href="/store/lacrypta"
            className="feature-card"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <img
              src={p.img}
              alt={p.name}
              style={{
                width: "100%",
                aspectRatio: "1/1",
                objectFit: "cover",
                borderRadius: 10,
                marginBottom: 12,
              }}
            />
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
              {p.name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: "var(--primary)",
              }}
            >
              ⚡ {p.price} sats
            </div>
          </Link>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          paddingTop: 20,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={handleLogout}
          className="btn btn-outline"
          style={{ borderColor: "rgba(248,113,113,0.4)", color: "#f87171" }}
        >
          ⏏ Cerrar sesión
        </button>
      </div>
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
          fontSize: mono ? 24 : 28,
          fontWeight: 700,
          color: "var(--text)",
          wordBreak: "break-all",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  desc,
  href,
  cta,
}: {
  icon: string;
  title: string;
  desc: string;
  href: string;
  cta: string;
}) {
  return (
    <Link href={href} className="feature-card" style={{ textDecoration: "none" }}>
      <div
        style={{
          fontSize: 28,
          marginBottom: 8,
          color: "var(--primary)",
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 8,
          color: "var(--text)",
        }}
      >
        {title}
      </h3>
      <p
        className="muted"
        style={{ fontSize: 14, marginBottom: 14, lineHeight: 1.5 }}
      >
        {desc}
      </p>
      <span style={{ color: "var(--primary)", fontSize: 13, fontWeight: 600 }}>
        {cta}
      </span>
    </Link>
  );
}
