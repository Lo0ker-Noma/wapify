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
      // Challenge style (NIP-42-ish): firmamos un evento ephemero con timestamp
      const challenge = await window.nostr.signEvent({
        kind: 22242,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["relay", "wapify.app"],
          ["challenge", `wapify-login-${Date.now()}`],
        ],
        content: "Wapify login",
      });
      // TODO: POST challenge → /api/auth/nostr/verify para obtener cookie de sesión
      console.log("Signed challenge", challenge);
      setPubkey(pk);
    } catch (e: any) {
      setError(e?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>Login</h1>
      <p className="muted">
        Wapify usa <strong>Nostr (NIP-07)</strong>. Tu npub es tu identidad —
        nada de emails ni contraseñas.
      </p>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        {!pubkey ? (
          <>
            <h3 style={{ marginTop: 0 }}>Conectar extensión Nostr</h3>
            <p className="muted">
              Necesitas una extensión NIP-07 instalada (Alby, nos2x, Flamingo).
              Wapify pedirá tu pubkey y una firma de challenge.
            </p>
            <button onClick={handleNostrLogin} disabled={loading}>
              {loading ? "Esperando firma…" : "Login con Nostr"}
            </button>
            {error && (
              <p style={{ color: "#f87171", marginTop: "1rem" }}>{error}</p>
            )}
          </>
        ) : (
          <>
            <h3 style={{ marginTop: 0 }}>✅ Conectado</h3>
            <p>
              <strong>npub:</strong>{" "}
              <code style={{ wordBreak: "break-all" }}>{pubkey}</code>
            </p>
            <p className="muted">
              Próximo paso: el backend verificará la firma del challenge y
              devolverá una cookie de sesión.
            </p>
          </>
        )}
      </div>

      <p className="muted" style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
        ¿Sin extensión? Pronto soportaremos NIP-46 (remote signer) y nsec
        bunker para móviles.
      </p>
    </main>
  );
}
