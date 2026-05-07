"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";

export default function LoginPage() {
  const { pubkey, npub, profile, isAdmin, loading, login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // After login, send the user to their storefront
  useEffect(() => {
    if (pubkey) router.replace("/store/lacrypta");
  }, [pubkey, router]);

  async function handle() {
    setError(null);
    try {
      await login();
    } catch (e: any) {
      setError(e?.message ?? "Error desconocido");
    }
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 640 }}>
      <span className="tag-pill">🔑 Auth con Nostr · NIP-07</span>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(36px, 6vw, 56px)",
          fontWeight: 700,
          letterSpacing: "-1.5px",
          lineHeight: 1.05,
          marginBottom: 16,
        }}
      >
        Tu npub es tu cuenta.
      </h1>
      <p className="muted" style={{ fontSize: 17, marginBottom: 32, maxWidth: 520 }}>
        Wapufy nunca toca tu llave privada. Solo te pide firmar un challenge
        efímero (kind:22242) para probar que sos vos.
      </p>

      <div className="card">
        {!pubkey ? (
          <>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Conectar extensión Nostr
            </h3>
            <p className="muted" style={{ marginBottom: 24, fontSize: 15 }}>
              Necesitás una extensión NIP-07 instalada{" "}
              <a
                href="https://getalby.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--primary)" }}
              >
                Alby
              </a>
              ,{" "}
              <a
                href="https://github.com/fiatjaf/nos2x"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--primary)" }}
              >
                nos2x
              </a>{" "}
              o Flamingo. Wapufy pedirá tu pubkey y una firma de challenge.
            </p>
            <button
              className="btn btn-primary btn-large btn-block"
              onClick={handle}
              disabled={loading}
            >
              {loading ? "Esperando firma…" : "Login con Nostr →"}
            </button>
            {error && (
              <p
                style={{
                  color: "#f87171",
                  marginTop: 16,
                  fontSize: 14,
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                {error}
              </p>
            )}
          </>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                marginBottom: 20,
              }}
            >
              {profile?.picture ? (
                <img
                  src={profile.picture}
                  alt={profile.display_name ?? profile.name ?? "Avatar"}
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid var(--primary)",
                    boxShadow: "0 0 24px var(--primary-glow)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, var(--primary), var(--lightning))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    fontWeight: 700,
                    color: "#000",
                  }}
                >
                  {(profile?.name ?? "N")[0]?.toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--primary)",
                    fontWeight: 600,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  ✓ Conectado
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 24,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  {profile?.display_name ?? profile?.name ?? "Sin nombre"}
                </h3>
                {profile?.nip05 && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {profile.nip05}
                  </div>
                )}
                {isAdmin && (
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 8,
                      padding: "3px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 100,
                      background: "rgba(0,255,157,0.12)",
                      color: "#00ff9d",
                      border: "1px solid rgba(0,255,157,0.3)",
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    ★ Admin · LaCrypta
                  </span>
                )}
              </div>
            </div>

            {profile?.about && (
              <p
                className="muted"
                style={{ fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}
              >
                {profile.about}
              </p>
            )}

            <code
              style={{
                wordBreak: "break-all",
                display: "block",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                color: "var(--text-secondary)",
                background: "rgba(255,255,255,0.03)",
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              {npub}
            </code>

            {isAdmin ? (
              <Link
                href="/dashboard"
                className="btn btn-primary btn-block"
              >
                Ir al Dashboard →
              </Link>
            ) : (
              <Link href="/store/lacrypta" className="btn btn-outline btn-block">
                Ver tienda demo
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
