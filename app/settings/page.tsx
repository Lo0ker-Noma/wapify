"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import {
  loadSettings,
  saveSettings,
  StoreSettings,
  StoreTheme,
  DEFAULT_SETTINGS,
} from "@/lib/settings";
import { isLightningAddress } from "@/lib/lnurl";

type ThemePreset = {
  id: StoreTheme;
  name: string;
  tagline: string;
  swatch: [string, string, string];
};

const THEME_PRESETS: ThemePreset[] = [
  {
    id: "crypta",
    name: "LaCrypta · Nostr",
    tagline: "Verde matrix · violeta P2P",
    swatch: ["#00ff9d", "#9945ff", "#0a0a0a"],
  },
  {
    id: "wapu",
    name: "Wapu · Hot",
    tagline: "Rosa eléctrico · vibe ARS↔BTC",
    swatch: ["#dc4d8a", "#9945ff", "#1a0d14"],
  },
  {
    id: "earth",
    name: "Terroso · Yerbatero",
    tagline: "Tierra, cerámica, mate amargo",
    swatch: ["#d49567", "#a86032", "#1a120c"],
  },
];

const WAPU_DEFAULT_BASES = [
  { value: "https://be-stage.wapu.app", label: "Staging (be-stage.wapu.app)" },
  { value: "https://be-prod.wapu.app", label: "Production (be-prod.wapu.app)" },
];

export default function SettingsPage() {
  const { pubkey, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!pubkey || !isAdmin) {
      router.replace("/login");
      return;
    }
    setSettings(loadSettings());
    setHydrated(true);
  }, [pubkey, isAdmin, loading, router]);

  if (!pubkey || !isAdmin || !hydrated) {
    return (
      <div className="page-wrap">
        <p className="muted">Verificando sesión…</p>
      </div>
    );
  }

  function handleSave() {
    setError(null);
    if (!isLightningAddress(settings.lightningAddress)) {
      setError("Lightning Address inválida (formato: usuario@dominio)");
      return;
    }
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className={`page-wrap theme-${settings.theme ?? "crypta"}`} style={{ maxWidth: 720 }}>
      <span className="tag-pill">⚙ Settings · Admin</span>
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
        Configuración de pagos
      </h1>
      <p className="muted" style={{ fontSize: 16, marginBottom: 32, maxWidth: 560 }}>
        Definí dónde reciben tus sats. Todos los checkouts de tu tienda van a usar
        esta Lightning Address (LNURL-pay). Para fallback en ARS, configurá tu
        usuario de Wapu.
      </p>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          ⚡ Lightning Address
        </h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          Cualquier proveedor LUD-16 sirve: Wallet of Satoshi, Alby, Strike, Wapu, etc.
        </p>
        <Field label="Tu Lightning Address">
          <input
            className="wapu-input"
            value={settings.lightningAddress}
            onChange={(e) =>
              setSettings({ ...settings, lightningAddress: e.target.value.trim() })
            }
            placeholder="usuario@walletofsatoshi.com"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <Field label="Usuario Wapu (fallback ARS)">
          <input
            className="wapu-input"
            value={settings.wapuUsername}
            onChange={(e) =>
              setSettings({ ...settings, wapuUsername: e.target.value.trim() })
            }
            placeholder="lacrypta"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>

        {error && (
          <p
            style={{
              color: "#f87171",
              fontSize: 13,
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.2)",
              padding: 10,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? "✓ Guardado" : "Guardar cambios"}
          </button>
          <Link href="/dashboard" className="btn btn-outline">
            Volver al Dashboard
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          🤖 Integración Wapu (sponsor)
        </h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          Wapu es el sponsor del hackathon y procesa pagos ARS↔crypto. La API
          Key te da acceso server-to-server (rate limit 60 req/60s).{" "}
          <a
            href="https://wapu.shiafu.com/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--primary)" }}
          >
            Docs API
          </a>
          {" · "}
          <a
            href="https://github.com/wapu-app/wapu-cli"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--primary)" }}
          >
            wapu-cli
          </a>
          .
        </p>

        <Field label="Endpoint Wapu">
          <select
            className="wapu-input"
            value={settings.wapuApiBase ?? WAPU_DEFAULT_BASES[0].value}
            onChange={(e) =>
              setSettings({ ...settings, wapuApiBase: e.target.value })
            }
            style={{ appearance: "auto" as any }}
          >
            {WAPU_DEFAULT_BASES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="API Key (X-API-Key) — opcional">
          <div style={{ display: "flex", gap: 6 }}>
            <input
              className="wapu-input"
              type={showApiKey ? "text" : "password"}
              value={settings.wapuApiKey ?? ""}
              onChange={(e) =>
                setSettings({ ...settings, wapuApiKey: e.target.value.trim() })
              }
              placeholder="Generala con POST /users/api-token o vía wapu-cli"
              autoComplete="off"
              spellCheck={false}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setShowApiKey((v) => !v)}
              className="btn btn-outline"
              style={{ padding: "0 14px" }}
            >
              {showApiKey ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          <p
            className="muted"
            style={{ fontSize: 12, marginTop: 8, lineHeight: 1.5 }}
          >
            Sólo necesaria para flows server-to-server (crear transacciones,
            consultar saldo, etc). El checkout LNURL-pay público no la requiere.
            La API Key se guarda en localStorage de tu device — nunca sale a un
            servidor de terceros.
          </p>
        </Field>
      </div>

      {/* ── Theme picker ───────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          🎨 Look & feel de la tienda
        </h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          Elegí el rollo visual que querés para tu storefront. El cambio se aplica
          en vivo: el dashboard y la tienda van a usar la paleta seleccionada.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          {THEME_PRESETS.map((t) => {
            const active = (settings.theme ?? "crypta") === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  const next = { ...settings, theme: t.id };
                  setSettings(next);
                  saveSettings(next);
                }}
                style={{
                  textAlign: "left",
                  background: active
                    ? "linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))"
                    : "rgba(255,255,255,0.02)",
                  border: `1.5px solid ${active ? "var(--primary)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 12,
                  padding: 14,
                  cursor: "pointer",
                  transition: "border-color 0.2s, transform 0.15s",
                  boxShadow: active ? "0 0 24px var(--primary-glow)" : "none",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }}
              >
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 100,
                      background: "var(--primary)",
                      color: "#000",
                      letterSpacing: 0.5,
                    }}
                  >
                    ACTIVO
                  </span>
                )}
                <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                  {t.swatch.map((c, i) => (
                    <span
                      key={i}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: c,
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    />
                  ))}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                  {t.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
                  {t.tagline}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Grid density picker ────────────────────────────────── */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: "var(--muted)",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Tamaño de la cuadrícula
          </div>
          <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
            Cuántos productos mostrar por fila en la tienda.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            {(["sm", "md", "lg"] as const).map((size) => {
              const active = (settings.gridSize ?? "md") === size;
              const labels: Record<typeof size, { name: string; desc: string }> = {
                sm: { name: "Pequeña", desc: "Más por fila" },
                md: { name: "Mediana", desc: "Equilibrada" },
                lg: { name: "Grande", desc: "Pocos por fila" },
              };
              // Number of cells in the preview grid
              const previewCols = size === "sm" ? 4 : size === "md" ? 3 : 2;
              const cells = previewCols * previewCols;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    const next = { ...settings, gridSize: size };
                    setSettings(next);
                    saveSettings(next);
                  }}
                  style={{
                    background: active
                      ? "linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))"
                      : "rgba(255,255,255,0.02)",
                    border: `1.5px solid ${active ? "var(--primary)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 12,
                    padding: 14,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "border-color 0.2s, transform 0.15s",
                    boxShadow: active ? "0 0 16px var(--primary-glow)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                >
                  {/* Grid preview icon */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${previewCols}, 1fr)`,
                      gap: 3,
                      width: 56,
                      height: 56,
                      margin: "0 auto 10px",
                    }}
                  >
                    {Array.from({ length: cells }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          background: active ? "var(--primary)" : "var(--text-secondary)",
                          opacity: active ? 0.85 : 0.35,
                          borderRadius: 2,
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                    {labels[size].name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {labels[size].desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── AI prompt builder info ─────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          ✨ Prompts de IA para fotos de producto
        </h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
          Al editar un producto, vas a ver el botón{" "}
          <strong style={{ color: "var(--text)" }}>✨ Prompt para IA</strong>. Genera un
          prompt listo para pegar en{" "}
          <strong style={{ color: "var(--text)" }}>ChatGPT, Midjourney, DALL·E, Leonardo, Stable Diffusion</strong> —
          tu servicio favorito.
        </p>
        <p className="muted" style={{ fontSize: 13, marginBottom: 4, lineHeight: 1.6 }}>
          El prompt arma automáticamente:
        </p>
        <ul style={{ fontSize: 13, color: "var(--text-secondary)", paddingLeft: 20, lineHeight: 1.7 }}>
          <li>Título y subtítulo del producto</li>
          <li>Fondo elegido (blanco, negro, transparente o lifestyle)</li>
          <li>Listado del resto de productos del catálogo + sus descripciones (para cohesión visual)</li>
          <li>URLs de fotos de referencia de tus otros productos</li>
        </ul>
        <p
          className="muted"
          style={{ fontSize: 12, marginTop: 12, lineHeight: 1.5, fontStyle: "italic" }}
        >
          Después generás la imagen donde quieras, la descargás y la subís con el botón "📷 Subir foto".
        </p>
      </div>

      <div
        className="card"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,255,157,0.06), rgba(153,69,255,0.04))",
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          ¿Cómo funcionan los pagos?
        </h3>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
          Cuando alguien compra en tu tienda, Wapufy resuelve tu Lightning Address
          vía LNURL-pay (LUD-16) y genera un invoice por el monto en sats. El
          comprador escanea el QR y los sats van directo a tu wallet — sin
          custodia, sin webhooks, sin intermediarios.
        </p>
      </div>

      {/* ── Save & back to store ─────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 32,
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          flexWrap: "wrap",
        }}
      >
        <button
          className="btn btn-primary"
          onClick={() => {
            // Theme, grid size and OpenAI key auto-save. Lightning Address /
            // Wapu fields still need an explicit save with validation.
            if (!isLightningAddress(settings.lightningAddress)) {
              setError("Lightning Address inválida (formato: usuario@dominio)");
              return;
            }
            setError(null);
            saveSettings(settings);
            router.push("/store/lacrypta");
          }}
          style={{ flex: 1, minWidth: 200, fontSize: 15, padding: "14px 20px" }}
        >
          💾 Save & volver a la tienda
        </button>
        <Link
          href="/dashboard"
          className="btn btn-outline"
          style={{ minWidth: 140 }}
        >
          ← Dashboard
        </Link>
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 10, textAlign: "center" }}>
        Tu tema, cuadrícula y demás cambios ya se guardaron automáticamente al tocarlos. Este
        botón sólo valida los datos de pago y te lleva a la tienda editable.
      </p>
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
    <label style={{ display: "block", marginBottom: 16 }}>
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
