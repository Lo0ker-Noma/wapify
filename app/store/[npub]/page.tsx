"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthProvider";
import {
  Product,
  loadProducts,
  saveProducts,
  resetProducts,
  getDefaultProducts,
} from "@/lib/products";
import { loadSettings } from "@/lib/settings";

type StoreMeta = {
  name: string;
  bio: string;
  theme?: "crypta";
  hero?: { kicker: string; title: string; subtitle: string };
};

const STORE_META: Record<string, StoreMeta> = {
  demo: {
    name: "Tienda Demo",
    bio: "Productos mock para probar el flow Wapu Lightning. El pago va a la Lightning Address configurada en Settings.",
  },
  lacrypta: {
    name: "LaCrypta Apparel HDMP",
    bio: "Drop oficial de la comunidad. Hecho en Argentina, pagado en Lightning. Sin custodia, sin intermediarios — Hodl & wear.",
    theme: "crypta",
    hero: {
      kicker: "DROP 001 · HODL DON'T MISS PURPOSE",
      title: "Apparel HDMP",
      subtitle:
        "La línea de ropa de la comunidad LaCrypta. Cada pieza es un manifiesto.",
    },
  },
};

export default function StorePage() {
  const params = useParams<{ npub: string }>();
  const slug = params.npub;
  const meta = STORE_META[slug];
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProducts(loadProducts(slug));
    setHydrated(true);
  }, [slug]);

  const settings = useMemo(() => (hydrated ? loadSettings() : null), [hydrated]);
  const sellerParam = settings?.lightningAddress ?? "";

  if (!meta) {
    notFound();
  }

  const isCrypta = meta!.theme === "crypta";
  const canEdit = isAdmin && slug === "lacrypta";

  function updateProduct(updated: Product) {
    const next = products.map((p) => (p.id === updated.id ? updated : p));
    setProducts(next);
    saveProducts(slug, next);
  }

  function removeProduct(id: string) {
    const next = products.filter((p) => p.id !== id);
    setProducts(next);
    saveProducts(slug, next);
  }

  function addProduct() {
    const id = `new-${Date.now()}`;
    const np: Product = {
      id,
      name: "Nuevo producto",
      subtitle: "",
      price: 5,
      img: "https://placehold.co/600x600/000000/00ff9d/png?text=NEW",
    };
    const next = [...products, np];
    setProducts(next);
    saveProducts(slug, next);
    setEditing(np);
  }

  function resetAll() {
    if (!confirm("¿Restaurar productos por defecto? Se pierden tus cambios.")) return;
    resetProducts(slug);
    setProducts(getDefaultProducts(slug));
  }

  return (
    <div className={`page-wrap ${isCrypta ? "theme-crypta" : ""}`}>
      {isCrypta && meta!.hero ? (
        <div className="crypta-hero">
          <span className="crypta-logo">▲ LACRYPTA</span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(44px, 7vw, 72px)",
              fontWeight: 700,
              letterSpacing: "-2px",
              lineHeight: 1.02,
              marginBottom: 16,
            }}
          >
            {meta!.hero.title}
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "var(--text-secondary)",
              maxWidth: 560,
              marginBottom: 18,
            }}
          >
            {meta!.hero.subtitle}
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: 2,
              color: "var(--primary)",
              opacity: 0.8,
            }}
          >
            {meta!.hero.kicker}
          </p>
        </div>
      ) : (
        <>
          <span className="tag-pill">@{slug}</span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(40px, 6vw, 64px)",
              fontWeight: 700,
              letterSpacing: "-1.5px",
              lineHeight: 1.05,
              marginBottom: 12,
            }}
          >
            {meta!.name}
          </h1>
          <p className="muted" style={{ fontSize: 17, marginBottom: 48, maxWidth: 640 }}>
            {meta!.bio}
          </p>
        </>
      )}

      {isCrypta && (
        <p className="muted" style={{ fontSize: 15, marginBottom: 24, maxWidth: 640 }}>
          {meta!.bio}
        </p>
      )}

      {canEdit && (
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <button className="btn btn-primary" onClick={addProduct}>
            + Agregar producto
          </button>
          <button className="btn btn-outline" onClick={resetAll}>
            ↺ Restaurar por defecto
          </button>
          <Link href="/settings" className="btn btn-outline">
            ⚙ Settings
          </Link>
        </div>
      )}

      <div className="row">
        {products.map((p) => {
          const checkoutUrl = `/checkout?sats=${p.price}&product=${encodeURIComponent(
            p.name
          )}${sellerParam ? `&seller=${encodeURIComponent(sellerParam)}` : ""}`;
          return (
            <div key={p.id} className="feature-card" style={{ position: "relative" }}>
              <div style={{ position: "relative" }}>
                <img
                  src={p.img}
                  alt={p.name}
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                    borderRadius: 12,
                    marginBottom: 16,
                  }}
                />
                {p.tag && (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      padding: "4px 10px",
                      background: "var(--primary)",
                      color: "#000",
                      borderRadius: 100,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                    }}
                  >
                    {p.tag}
                  </span>
                )}
                {canEdit && (
                  <button
                    onClick={() => setEditing(p)}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      background: "rgba(0,0,0,0.7)",
                      border: "1px solid var(--primary)",
                      color: "var(--primary)",
                      padding: "6px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    ✎ Editar
                  </button>
                )}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: p.subtitle ? 4 : 6,
                }}
              >
                {p.name}
              </h3>
              {p.subtitle && (
                <p
                  className="muted"
                  style={{
                    fontSize: 13,
                    fontStyle: "italic",
                    marginBottom: 10,
                    lineHeight: 1.4,
                  }}
                >
                  {p.subtitle}
                </p>
              )}
              <p
                style={{
                  fontSize: 15,
                  marginBottom: 16,
                  fontFamily: "var(--font-mono)",
                  color: "var(--primary)",
                  fontWeight: 600,
                }}
              >
                ⚡ {p.price.toLocaleString("es-AR")} sats
              </p>
              <Link href={checkoutUrl} className="btn btn-primary btn-block">
                Comprar con Wapu ⚡
              </Link>
              {canEdit && (
                <button
                  onClick={() => removeProduct(p.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#f87171",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    marginTop: 10,
                    width: "100%",
                  }}
                >
                  Eliminar producto
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="card"
        style={{
          marginTop: 48,
          background: isCrypta
            ? "linear-gradient(135deg, rgba(0,255,157,0.06), rgba(153,69,255,0.06))"
            : "linear-gradient(135deg, rgba(220,77,138,0.06), rgba(153,69,255,0.06))",
          textAlign: "center",
        }}
      >
        <p className="muted" style={{ fontSize: 14, margin: 0 }}>
          ⚡ Pagos vía Lightning Address — sin webhooks, sin custodia. El invoice
          se genera contra el LNURL-pay del vendedor configurado en Settings.
        </p>
      </div>

      {editing && (
        <EditModal
          product={editing}
          onClose={() => setEditing(null)}
          onSave={(p) => {
            updateProduct(p);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditModal({
  product,
  onClose,
  onSave,
}: {
  product: Product;
  onClose: () => void;
  onSave: (p: Product) => void;
}) {
  const [draft, setDraft] = useState<Product>(product);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--dark-gray)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 28,
          width: "100%",
          maxWidth: 480,
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            marginBottom: 20,
          }}
        >
          Editar producto
        </h3>

        <Field label="Título">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </Field>
        <Field label="Subtítulo / eslogan">
          <input
            value={draft.subtitle ?? ""}
            onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
          />
        </Field>
        <Field label="URL de imagen">
          <input
            value={draft.img}
            onChange={(e) => setDraft({ ...draft, img: e.target.value })}
          />
        </Field>
        <Field label="Precio (sats)">
          <input
            type="number"
            min={1}
            value={draft.price}
            onChange={(e) =>
              setDraft({ ...draft, price: Number(e.target.value) || 0 })
            }
          />
        </Field>
        <Field label="Tag (opcional)">
          <input
            value={draft.tag ?? ""}
            onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
            placeholder="Ej: ★ Más vendida"
          />
        </Field>

        {draft.img && (
          <img
            src={draft.img}
            alt="preview"
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              objectFit: "cover",
              borderRadius: 10,
              marginTop: 8,
              marginBottom: 16,
            }}
          />
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button
            className="btn btn-outline"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onSave(draft)}
            style={{ flex: 1 }}
          >
            Guardar
          </button>
        </div>
      </div>
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
    <label style={{ display: "block", marginBottom: 14 }}>
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
      <span className="form-input-wrap">{children}</span>
    </label>
  );
}
