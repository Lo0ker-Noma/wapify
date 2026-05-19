"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import ExportModal from "../components/ExportModal";
import { Product, loadProductsWithServerSync, saveProducts } from "@/lib/products";
import { publishAllProductsAsNip99 } from "@/lib/nostr-products";
import { loadSettings, StoreSettings } from "@/lib/settings";
import { loadOrders, Order } from "@/lib/orders";
import { loadStoreMeta, StoreMeta } from "@/lib/store-meta";

export default function DashboardPage() {
  const { pubkey, npub, isAdmin, profile, loading, logout } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<StoreMeta | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [nip99Busy, setNip99Busy] = useState(false);
  const [nip99Status, setNip99Status] = useState<string | null>(null);
  const [nip99Error, setNip99Error] = useState<string | null>(null);
  const [nip99Published, setNip99Published] = useState(false);

  async function handlePublishAllToNostr() {
    setNip99Busy(true);
    setNip99Status("Firmando primer producto…");
    setNip99Error(null);
    try {
      const results = await publishAllProductsAsNip99(
        products,
        "lacrypta",
        "LaCrypta",
        (done, total, last) => {
          const accepted = last?.results.filter((r) => r.ok).length ?? 0;
          const totalR = last?.results.length ?? 0;
          setNip99Status(
            `${done}/${total} — "${last?.product.name}" → ${accepted}/${totalR} relays`
          );
        }
      );
      const okCount = results.filter((r) => r.results.some((x) => x.ok)).length;
      setNip99Status(
        `✓ ${okCount}/${results.length} productos publicados como NIP-99 (kind:30402). Descubribles en relays Damus, Primal, Nostr.band, nos.lol.`
      );
      setNip99Published(okCount > 0);
    } catch (e: any) {
      setNip99Error(e?.message ?? "Error publicando productos");
      setNip99Status(null);
    } finally {
      setNip99Busy(false);
    }
  }
  const [newProduct, setNewProduct] = useState({ name: "", subtitle: "", price: "", img: "", tag: "" });

  useEffect(() => {
    if (loading) return;
    if (!pubkey || !isAdmin) {
      router.replace("/login");
      return;
    }
    loadProductsWithServerSync("lacrypta").then(setProducts);
    setSettings(loadSettings());
    setOrders(loadOrders());
    setMeta(loadStoreMeta("lacrypta"));
  }, [pubkey, isAdmin, loading, router]);

  function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    const price = parseInt(newProduct.price, 10);
    if (!newProduct.name || isNaN(price) || price <= 0) return;
    const product: Product = {
      id: `manual-${Date.now()}`,
      name: newProduct.name.trim(),
      subtitle: newProduct.subtitle.trim() || undefined,
      price,
      img: newProduct.img.trim() || `https://placehold.co/600x600/000000/00ff9d/png?text=${encodeURIComponent(newProduct.name.trim())}`,
      tag: newProduct.tag.trim() || undefined,
    };
    const updated = [...products, product];
    saveProducts("lacrypta", updated);
    setProducts(updated);
    setNewProduct({ name: "", subtitle: "", price: "", img: "", tag: "" });
    setShowAddProduct(false);
  }

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
    <div className={`page-wrap theme-${settings?.theme ?? "crypta"}`}>
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
          background:
            "linear-gradient(135deg, rgba(0,255,157,0.08), rgba(153,69,255,0.06))",
          borderColor: "rgba(0,255,157,0.2)",
        }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: "var(--primary)",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            ⤓ Embed / Export
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Llevá tu tienda a cualquier sitio
          </div>
          <p
            className="muted"
            style={{ fontSize: 13, margin: 0, maxWidth: 480, lineHeight: 1.5 }}
          >
            Exportá un snippet HTML que renderiza la tienda en cualquier web —
            WordPress, Notion, Webflow, tu landing — y los pagos siguen
            llegándote por Lightning.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowExport(true)}
          disabled={!products.length || !settings || !meta}
        >
          Exportar tienda →
        </button>
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

      {/* ── N1: Publish all products as NIP-99 events ───────────────── */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          padding: 18,
          background:
            "linear-gradient(135deg, rgba(153,69,255,0.08), rgba(0,255,157,0.05))",
          border: "1px solid rgba(153,69,255,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                color: "#bf9bff",
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              ⚜ NIP-99 · Classified Listings
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 17,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Publicá tu catálogo en la red Nostr
            </div>
            <p className="muted" style={{ fontSize: 13, margin: 0, lineHeight: 1.5, maxWidth: 480 }}>
              Cada producto se firma con tu npub (NIP-07) y se publica como{" "}
              <code style={{ fontSize: 11 }}>kind:30402</code> en 4 relays
              públicos. Cualquier cliente Nostr (Plebeian Market, nostree.me,
              Damus, Primal) lo va a poder descubrir <strong>sin pedirnos permiso</strong>.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handlePublishAllToNostr}
            disabled={nip99Busy || products.length === 0}
            style={{
              minWidth: 180,
              cursor: nip99Busy ? "wait" : "pointer",
            }}
          >
            {nip99Busy
              ? "Publicando…"
              : `⚜ Publicar ${products.length} productos`}
          </button>
        </div>
        {nip99Status && (
          <div
            style={{
              marginTop: 12,
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(0,255,157,0.06)",
              border: "1px solid rgba(0,255,157,0.25)",
              fontSize: 12,
              color: "var(--primary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {nip99Status}
          </div>
        )}
        {nip99Error && (
          <div
            style={{
              marginTop: 12,
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(248,113,113,0.06)",
              border: "1px solid rgba(248,113,113,0.3)",
              fontSize: 12,
              color: "#fca5a5",
            }}
          >
            ❌ {nip99Error}
          </div>
        )}
        {/* Where your published listings can be seen */}
        {(nip99Published || products.length > 0) && npub && (
          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                color: "var(--muted)",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              📡 Dónde ver tus listings
            </div>
            <p className="muted" style={{ fontSize: 12, margin: "0 0 10px", lineHeight: 1.5 }}>
              Clientes generalistas (Damus, Primal) <strong>no</strong> muestran NIP-99
              en tu feed — son un kind especializado. Estos explorers sí los indexan:
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a
                href={`https://nostr.band/${npub}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ fontSize: 11, padding: "5px 10px" }}
              >
                🔎 Nostr.band (tu perfil)
              </a>
              <a
                href={`https://nostr.band/?q=kind:30402+by:${npub}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ fontSize: 11, padding: "5px 10px" }}
              >
                ⚜ Solo tus kind:30402
              </a>
              <a
                href="https://plebeian.market"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ fontSize: 11, padding: "5px 10px" }}
              >
                🛍 Plebeian Market
              </a>
              <a
                href="https://shopstr.store"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ fontSize: 11, padding: "5px 10px" }}
              >
                🛒 Shopstr
              </a>
              <a
                href={`https://nostree.me/${npub}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ fontSize: 11, padding: "5px 10px" }}
              >
                🌳 Nostree
              </a>
            </div>
            <p
              className="muted"
              style={{ fontSize: 11, margin: "10px 0 0", lineHeight: 1.5, fontStyle: "italic" }}
            >
              Después de publicar, Nostr.band suele tardar 1-3 min en re-indexar.
              Plebeian Market y Shopstr pueden tardar más porque crawlean en batches.
            </p>
          </div>
        )}
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
                color: "var(--bitcoin)",
              }}
            >
              ⚡ {p.price} sats
            </div>
          </Link>
        ))}
        <button
          onClick={() => setShowAddProduct(true)}
          className="feature-card"
          style={{
            background: "rgba(0,255,157,0.04)",
            border: "2px dashed rgba(0,255,157,0.25)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: "pointer",
            minHeight: 180,
            color: "var(--primary)",
            transition: "border-color 0.2s, background 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,157,0.6)";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,255,157,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,157,0.25)";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,255,157,0.04)";
          }}
        >
          <div style={{ fontSize: 36, lineHeight: 1, fontWeight: 300 }}>+</div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5 }}>
            Agregar producto
          </div>
        </button>
      </div>

      {showAddProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddProduct(false); }}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: 480, padding: 32, position: "relative" }}
          >
            <button
              onClick={() => setShowAddProduct(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                color: "var(--muted)",
                fontSize: 20,
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 24,
              }}
            >
              Nuevo producto
            </h3>
            <form onSubmit={handleAddProduct} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>
                  Nombre *
                </span>
                <input
                  className="wapu-input"
                  placeholder="Hoodie Nostr"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>
                  Descripción
                </span>
                <input
                  className="wapu-input"
                  placeholder="Descripción breve…"
                  value={newProduct.subtitle}
                  onChange={(e) => setNewProduct((p) => ({ ...p, subtitle: e.target.value }))}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>
                  Precio (sats) *
                </span>
                <input
                  className="wapu-input"
                  type="number"
                  min={1}
                  placeholder="1000"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                  required
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>
                  URL de imagen
                </span>
                <input
                  className="wapu-input"
                  placeholder="https://… (opcional)"
                  value={newProduct.img}
                  onChange={(e) => setNewProduct((p) => ({ ...p, img: e.target.value }))}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>
                  Etiqueta
                </span>
                <input
                  className="wapu-input"
                  placeholder="★ Nuevo (opcional)"
                  value={newProduct.tag}
                  onChange={(e) => setNewProduct((p) => ({ ...p, tag: e.target.value }))}
                />
              </label>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Agregar producto
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddProduct(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {showExport && settings && meta && (
        <ExportModal
          products={products}
          settings={settings}
          meta={meta}
          baseUrl={
            typeof window !== "undefined"
              ? window.location.origin
              : "https://wapify.vercel.app"
          }
          onClose={() => setShowExport(false)}
        />
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
          fontSize: mono ? 24 : 28,
          fontWeight: 700,
          color: mono ? "var(--bitcoin)" : "var(--text)",
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
