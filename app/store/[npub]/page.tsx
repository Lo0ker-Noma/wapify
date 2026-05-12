"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import { useAuth } from "@/app/components/AuthProvider";
import ProductDetailModal from "@/app/components/ProductDetailModal";
import {
  Product,
  loadProductsWithServerSync,
  saveProducts,
  resetProducts,
  getDefaultProducts,
} from "@/lib/products";
import { loadSettings } from "@/lib/settings";
import {
  StoreMeta,
  loadStoreMeta,
  loadStoreMetaWithServerSync,
  saveStoreMeta,
  DEFAULT_META,
} from "@/lib/store-meta";

export default function StorePage() {
  const params = useParams<{ npub: string }>();
  const slug = params.npub;
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<StoreMeta | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editingMeta, setEditingMeta] = useState(false);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    Promise.all([
      loadProductsWithServerSync(slug),
      loadStoreMetaWithServerSync(slug),
    ]).then(([p, m]) => {
      setProducts(p);
      setMeta(m);
      setHydrated(true);
    });
  }, [slug]);

  const settings = useMemo(() => (hydrated ? loadSettings() : null), [hydrated]);
  const lnParam = settings?.lightningAddress ?? "";
  const wapuParam = settings?.wapuUsername ?? "";

  if (hydrated && !meta && !DEFAULT_META[slug]) {
    notFound();
  }

  const isCrypta = slug === "lacrypta";
  const canEdit = isAdmin && slug === "lacrypta";

  function updateProduct(updated: Product) {
    const next = products.map((p) => (p.id === updated.id ? updated : p));
    setProducts(next);
    saveProducts(slug, next);
  }

  function removeProduct(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
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

  function saveMetaEdit(next: StoreMeta) {
    setMeta(next);
    saveStoreMeta(slug, next);
    setEditingMeta(false);
  }

  if (!hydrated || !meta) {
    return (
      <div className="page-wrap">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  return (
    <div className={`page-wrap ${isCrypta ? `theme-${settings?.theme ?? "crypta"}` : ""}`}>
      {isCrypta ? (
        <div className="crypta-hero" style={{ position: "relative" }}>
          {meta.logo ? (
            <img
              src={meta.logo}
              alt={meta.name}
              style={{
                maxHeight: 64,
                width: "auto",
                marginBottom: 18,
                borderRadius: 8,
                display: "block",
              }}
            />
          ) : (
            <span className="crypta-logo">▲ LACRYPTA</span>
          )}
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
            {meta.heroTitle ?? meta.name}
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "var(--text-secondary)",
              maxWidth: 560,
              marginBottom: 18,
            }}
          >
            {meta.heroSubtitle ?? meta.bio}
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
            {meta.heroKicker}
          </p>
          {canEdit && (
            <button
              onClick={() => setEditingMeta(true)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "rgba(0,0,0,0.6)",
                border: "1px solid var(--primary)",
                color: "var(--primary)",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                backdropFilter: "blur(8px)",
              }}
            >
              ✎ Editar título
            </button>
          )}
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
            {meta.name}
          </h1>
          <p className="muted" style={{ fontSize: 17, marginBottom: 48, maxWidth: 640 }}>
            {meta.bio}
          </p>
        </>
      )}

      {isCrypta && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            marginBottom: 24,
            maxWidth: 720,
          }}
        >
          <p className="muted" style={{ fontSize: 15, margin: 0, flex: 1 }}>
            {meta.bio}
          </p>
          {canEdit && (
            <button
              onClick={() => setEditingMeta(true)}
              style={{
                background: "transparent",
                border: "1px solid var(--primary)",
                color: "var(--primary)",
                padding: "6px 10px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              ✎ Descripción
            </button>
          )}
        </div>
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
          <Link href="/dashboard" className="btn btn-outline">
            ◧ Dashboard
          </Link>
          <Link href="/settings" className="btn btn-outline">
            ⚙ Settings
          </Link>
        </div>
      )}

      <div className="row">
        {products.map((p) => (
          <div
            key={p.id}
            className="feature-card"
            onClick={() => setViewing(p)}
            style={{
              position: "relative",
              cursor: "pointer",
              transition: "transform .2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(p);
                  }}
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
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={(e) => {
                e.stopPropagation();
                setViewing(p);
              }}
            >
              Ver y comprar ⚡
            </button>
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeProduct(p.id);
                }}
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
        ))}
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
        <ProductModal
          product={editing}
          siblings={products.filter((p) => p.id !== editing.id)}
          onClose={() => setEditing(null)}
          onSave={(p) => {
            updateProduct(p);
            setEditing(null);
          }}
        />
      )}

      {editingMeta && (
        <MetaModal
          meta={meta}
          onClose={() => setEditingMeta(false)}
          onSave={saveMetaEdit}
        />
      )}

      {viewing && (
        <ProductDetailModal
          product={viewing}
          lnAddress={lnParam}
          wapuUsername={wapuParam}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}

function ProductModal({
  product,
  siblings,
  onClose,
  onSave,
}: {
  product: Product;
  siblings: Product[];
  onClose: () => void;
  onSave: (p: Product) => void;
}) {
  const [draft, setDraft] = useState<Product>(product);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI prompt builder state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiBackground, setAiBackground] = useState<"white" | "black" | "transparent" | "lifestyle">("white");
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [promptCopied, setPromptCopied] = useState(false);

  async function handleFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setDraft((d) => ({ ...d, img: blob.url }));
    } catch (e: any) {
      const msg = e?.message ?? "Error subiendo imagen";
      if (msg.includes("client token")) {
        setUploadError(
          "Vercel Blob no está configurado. En el Vercel Dashboard: Storage → Create Database → Blob → conectalo al proyecto. Eso seteo BLOB_READ_WRITE_TOKEN automáticamente."
        );
      } else {
        setUploadError(msg);
      }
    } finally {
      setUploading(false);
    }
  }

  const BG_DESCRIPTIONS: Record<typeof aiBackground, string> = {
    white: "pure clean white seamless background with a soft natural shadow underneath the product, e-commerce hero shot style",
    black: "deep matte black seamless background with dramatic single-source rim lighting, high contrast, premium / minimalist mood",
    transparent: "fully transparent background (PNG cutout), no shadow, clean hard edges around the product",
    lifestyle: "natural lifestyle setting with shallow depth of field, warm golden-hour lighting, magazine-quality composition where the product is clearly the foreground subject",
  };

  function buildPrompt(): string {
    const title = draft.name?.trim() || "the product";
    const subtitle = draft.subtitle?.trim();
    const bgDesc = BG_DESCRIPTIONS[aiBackground];

    // Catalog style summary: short list of sibling product titles + subtitles
    // so the AI service knows what other items live in this store.
    const catalogItems = siblings
      .slice(0, 6)
      .map((s) => {
        const sub = s.subtitle?.trim();
        return sub ? `- ${s.name} — ${sub}` : `- ${s.name}`;
      });

    const refUrls = siblings
      .map((s) => s.img)
      .filter((u) => u && /^https:\/\//.test(u) && !u.includes("placehold.co"))
      .slice(0, 4);

    const lines: string[] = [];
    lines.push(`Professional e-commerce product photograph of: ${title}.`);
    if (subtitle) lines.push(`Product details: ${subtitle}`);
    lines.push("");
    lines.push("Composition & lighting:");
    lines.push(`- ${bgDesc}.`);
    lines.push("- Square 1:1 framing, product centered, crisp focus.");
    lines.push("- No text, no watermark, no logo overlays, no extra props.");
    lines.push("- The product is the only subject — preserve its real identity, shape, materials, colors and branding exactly.");

    if (catalogItems.length > 0) {
      lines.push("");
      lines.push(`Catalog cohesion — this photo belongs to a store that also sells:`);
      catalogItems.forEach((it) => lines.push(it));
      lines.push("Match the same lighting setup, color grading, mood and framing language used in those other items so the catalog feels consistent.");
    }

    if (refUrls.length > 0) {
      lines.push("");
      lines.push("Reference photos for the visual style (paste these into your AI service if it accepts image references):");
      refUrls.forEach((u) => lines.push(u));
    }

    return lines.join("\n");
  }

  function generateAndCopy() {
    const text = buildPrompt();
    setGeneratedPrompt(text);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => {
          setPromptCopied(true);
          setTimeout(() => setPromptCopied(false), 2000);
        },
        () => { /* clipboard refused — user can still copy manually */ }
      );
    }
  }

  return (
    <ModalShell onClose={onClose} title="Editar producto">
      <Field label="Título">
        <input
          className="wapu-input"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </Field>
      <Field label="Subtítulo / eslogan">
        <input
          className="wapu-input"
          value={draft.subtitle ?? ""}
          onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
        />
      </Field>
      <Field label="Imagen">
        <input
          className="wapu-input"
          value={draft.img}
          onChange={(e) => setDraft({ ...draft, img: e.target.value })}
          placeholder="URL pública o subí un archivo"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn btn-outline"
            style={{ cursor: uploading ? "wait" : "pointer" }}
          >
            {uploading ? "Subiendo…" : "📷 Subir foto"}
          </button>
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            className="btn btn-outline"
            style={{
              borderColor: aiOpen ? "var(--primary)" : "rgba(0,255,157,0.4)",
              color: aiOpen ? "var(--primary)" : undefined,
              background: aiOpen ? "rgba(0,255,157,0.06)" : undefined,
            }}
          >
            ✨ Prompt para IA
          </button>
        </div>
        {uploadError && (
          <p style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>
            {uploadError}
          </p>
        )}

        {/* ── AI prompt builder panel ──────────────────────────── */}
        {aiOpen && (
          <div
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 10,
              background: "rgba(0,255,157,0.04)",
              border: "1px solid rgba(0,255,157,0.20)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", marginBottom: 8, letterSpacing: 0.5 }}>
              ✨ PROMPT PARA IA DE IMAGEN
            </div>
            <p className="muted" style={{ fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>
              Generamos un prompt listo para pegar en ChatGPT, Midjourney, DALL·E, Leonardo, etc. Usa el contexto de:
            </p>
            <ul style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12, paddingLeft: 18, lineHeight: 1.6 }}>
              <li><strong style={{ color: "var(--text)" }}>Título:</strong> {draft.name || <em>(vacío)</em>}</li>
              <li><strong style={{ color: "var(--text)" }}>Subtítulo:</strong> {draft.subtitle || <em>(vacío — completalo arriba para mejor prompt)</em>}</li>
              <li>
                <strong style={{ color: "var(--text)" }}>Look & feel:</strong>{" "}
                {(() => {
                  const named = Math.min(siblings.length, 6);
                  const refs = siblings.filter(
                    (s) => s.img && /^https:\/\//.test(s.img) && !s.img.includes("placehold.co")
                  ).slice(0, 4).length;
                  if (named === 0) return "primer producto del catálogo (sin referencias todavía)";
                  return `${named} producto${named === 1 ? "" : "s"} del catálogo${refs > 0 ? ` + ${refs} URL${refs === 1 ? "" : "s"} de referencia visual` : ""}`;
                })()}
              </li>
            </ul>

            <p className="muted" style={{ fontSize: 12, marginBottom: 8, lineHeight: 1.5 }}>
              Fondo del prompt:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
              {(["white", "black", "transparent", "lifestyle"] as const).map((bg) => {
                const labels: Record<typeof bg, string> = {
                  white: "Blanco",
                  black: "Negro",
                  transparent: "Sin fondo",
                  lifestyle: "Lifestyle",
                };
                const active = aiBackground === bg;
                return (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setAiBackground(bg)}
                    style={{
                      padding: "8px 6px",
                      borderRadius: 6,
                      border: `1px solid ${active ? "var(--primary)" : "rgba(255,255,255,0.1)"}`,
                      background: active ? "var(--primary)" : "transparent",
                      color: active ? "#000" : "var(--text-secondary)",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {labels[bg]}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={generateAndCopy}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              {promptCopied ? "✓ Copiado al portapapeles" : "📋 Generar prompt y copiar"}
            </button>

            {generatedPrompt && (
              <>
                <textarea
                  readOnly
                  value={generatedPrompt}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    padding: 10,
                    minHeight: 180,
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    background: "rgba(0,0,0,0.5)",
                    color: "var(--text)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    lineHeight: 1.5,
                    resize: "vertical",
                  }}
                />
                <p className="muted" style={{ fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
                  Pegalo en tu servicio favorito (ChatGPT, Midjourney, DALL·E, Leonardo, Stable Diffusion…),
                  generá la imagen, descargala, y subila acá con <strong style={{ color: "var(--text)" }}>📷 Subir foto</strong>.
                </p>
              </>
            )}
          </div>
        )}
      </Field>
      <Field label="Precio (sats)">
        <input
          className="wapu-input"
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
          className="wapu-input"
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

      <ModalActions onCancel={onClose} onSave={() => onSave(draft)} />
    </ModalShell>
  );
}

function MetaModal({
  meta,
  onClose,
  onSave,
}: {
  meta: StoreMeta;
  onClose: () => void;
  onSave: (m: StoreMeta) => void;
}) {
  const [draft, setDraft] = useState<StoreMeta>(meta);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setDraft((d) => ({ ...d, logo: blob.url }));
    } catch (e: any) {
      const msg = e?.message ?? "Error subiendo logo";
      if (msg.includes("client token")) {
        setUploadError(
          "Vercel Blob no está configurado. En el Vercel Dashboard: Storage → Create Database → Blob → conectalo al proyecto."
        );
      } else {
        setUploadError(msg);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title="Editar título de tienda">
      <Field label="Logo de la tienda">
        {draft.logo && (
          <img
            src={draft.logo}
            alt="logo"
            style={{
              maxHeight: 72,
              width: "auto",
              borderRadius: 8,
              marginBottom: 10,
              display: "block",
            }}
          />
        )}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml,image/avif"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleLogoFile(f);
            if (logoInputRef.current) logoInputRef.current.value = "";
          }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploading}
            className="btn btn-outline"
            style={{ flex: 1, cursor: uploading ? "wait" : "pointer" }}
          >
            {uploading ? "Subiendo…" : draft.logo ? "📷 Cambiar logo" : "📷 Subir logo"}
          </button>
          {draft.logo && (
            <button
              type="button"
              onClick={() => setDraft({ ...draft, logo: "" })}
              className="btn btn-outline"
              style={{ borderColor: "rgba(248,113,113,0.4)", color: "#f87171" }}
            >
              Quitar
            </button>
          )}
        </div>
        <input
          className="wapu-input"
          value={draft.logo ?? ""}
          onChange={(e) => setDraft({ ...draft, logo: e.target.value })}
          placeholder="o pegá una URL"
          style={{ marginTop: 8 }}
        />
        {uploadError && (
          <p style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>
            {uploadError}
          </p>
        )}
      </Field>

      <Field label="Nombre / título principal">
        <input
          className="wapu-input"
          value={draft.heroTitle ?? draft.name}
          onChange={(e) => setDraft({ ...draft, heroTitle: e.target.value })}
        />
      </Field>
      <Field label="Subtítulo (descripción corta)">
        <input
          className="wapu-input"
          value={draft.heroSubtitle ?? ""}
          onChange={(e) => setDraft({ ...draft, heroSubtitle: e.target.value })}
        />
      </Field>
      <Field label="Kicker (línea mono superior)">
        <input
          className="wapu-input"
          value={draft.heroKicker ?? ""}
          onChange={(e) => setDraft({ ...draft, heroKicker: e.target.value })}
        />
      </Field>
      <Field label="Bio / descripción larga">
        <textarea
          className="wapu-input"
          rows={3}
          value={draft.bio}
          onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
        />
      </Field>
      <Field label="Nombre interno de tienda">
        <input
          className="wapu-input"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </Field>

      <ModalActions onCancel={onClose} onSave={() => onSave(draft)} />
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
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
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            marginBottom: 20,
          }}
        >
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

function ModalActions({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
      <button className="btn btn-outline" onClick={onCancel} style={{ flex: 1 }}>
        Cancelar
      </button>
      <button className="btn btn-primary" onClick={onSave} style={{ flex: 1 }}>
        Guardar
      </button>
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
      {children}
    </label>
  );
}
