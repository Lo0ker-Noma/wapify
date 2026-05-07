"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import {
  loadSettings,
  saveSettings,
  StoreSettings,
  DEFAULT_SETTINGS,
} from "@/lib/settings";
import { isLightningAddress } from "@/lib/lnurl";

export default function SettingsPage() {
  const { pubkey, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

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
    <div className="page-wrap theme-crypta" style={{ maxWidth: 720 }}>
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
