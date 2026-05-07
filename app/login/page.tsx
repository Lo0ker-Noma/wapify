"use client";

import { useState } from "react";

declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: {
        kind: number;
        created_at: number;
        tags: string[][];
        content: string;
      }) => Promise<{
        id: string;
        pubkey: string;
        kind: number;
        created_at: number;
        tags: string[][];
        content: string;
        sig: string;
      }>;
    };
  }
}

export default function LoginPage() {
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleNostrLogin() {
    setError(null);
    setLoading(true);
    try {
      if (typeof window === "undefined" || !window.nostr) {
        throw new Error(
          "No se encontró extensión NIP-07. Instalá Alby, nos2x o Flamingo."
        );
      }
      const pk = await window.nostr.getPublicKey();
      const challenge = await window.nostr.signEvent({
        kind: 22242,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["relay", "wapufy.app"],
          ["challenge", `wapufy-login-${Date.now()}`],
        ],
        content: "Wapufy login",
      });
      console.log("Signed challenge", challenge);
      setPubkey(pk);
    } catch (e: any) {
      setError(e?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
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
      <p
        className="muted"
        style={{ fontSize: 17, marginBottom: 32, maxWidth: 520 }}
      >
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
              onClick={handleNostrLogin}
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
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 600,
                marginBottom: 12,
                color: "var(--primary)",
              }}
            >
              ✓ Conectado
            </h3>
            <p style={{ marginBottom: 8, fontSize: 14 }}>
              <strong>npub:</strong>
            </p>
            <code style={{ wordBreak: "break-all", display: "block", padding: 12, marginBottom: 20 }}>
              {pubkey}
            </code>
            <p className="muted" style={{ fontSize: 14 }}>
              Próximo paso: el backend verifica la firma del challenge y
              devuelve una cookie de sesión. (TODO en este MVP.)
            </p>
          </>
        )}
      </div>

      <p
        className="muted"
        style={{ marginTop: 24, fontSize: 13, textAlign: "center" }}
      >
        ¿Sin extensión? Próximamente soportamos{" "}
        <a
          href="https://nips.nostr.com/46"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--primary)" }}
        >
          NIP-46
        </a>{" "}
        (remote signer) y nsec bunker para móviles.
      </p>
    </div>
  );
}
