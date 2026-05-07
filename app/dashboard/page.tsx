"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import { Product, loadProducts } from "@/lib/products";
import { loadSettings, StoreSettings } from "@/lib/settings";

export default function DashboardPage() {
  const { pubkey, isAdmin, profile, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!pubkey || !isAdmin) {
      router.replace("/login");
      return;
    }
    setProducts(loadProducts("lacrypta"));
    setSettings(loadSettings());
  }, [pubkey, isAdmin, loading, router]);

  if (!pubkey || !isAdmin) {
    return (
      <div className="page-wrap">
        <p className="muted">Verificando sesión…</p>
      </div>
    );
  }

  const totalSats = products.reduce((acc, p) => acc + p.price, 0);

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
              width: 56,
              height: 56,
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
        Panel de tu tienda LaCrypta Apparel HDMP. Editá productos, configurá tus
        métodos de cobro y revisá el estado de tu storefront.
      </p>

      <div className="row" style={{ marginBottom: 40 }}>
        <Stat label="Productos activos" value={products.length.toString()} />
        <Stat label="Total catálogo" value={`⚡ ${totalSats} sats`} />
        <Stat
          label="Lightning Address"
          value={settings?.lightningAddress ?? "—"}
          mono
        />
      </div>

      <div className="row" style={{ marginBottom: 40 }}>
        <ActionCard
          title="Mi tienda"
          desc="Ver storefront público y editar productos in-place."
          href="/store/lacrypta"
          cta="Abrir tienda →"
        />
        <ActionCard
          title="Settings"
          desc="Configurá tu Lightning Address y tu Wapu username para recibir pagos."
          href="/settings"
          cta="Configurar →"
        />
        <ActionCard
          title="Identidad Nostr"
          desc="Tu npub es tu cuenta. Editá tu kind:0 desde tu cliente Nostr (Damus, Amethyst…)."
          href="/login"
          cta="Ver perfil"
        />
      </div>

      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          fontWeight: 700,
          marginBottom: 16,
          letterSpacing: "-0.5px",
        }}
      >
        Productos
      </h2>
      <div className="row">
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
      style={{
        background: "rgba(255,255,255,0.02)",
      }}
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
          fontSize: mono ? 15 : 28,
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
  title,
  desc,
  href,
  cta,
}: {
  title: string;
  desc: string;
  href: string;
  cta: string;
}) {
  return (
    <Link href={href} className="feature-card" style={{ textDecoration: "none" }}>
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
