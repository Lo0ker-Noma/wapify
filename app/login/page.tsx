"use client";

import { useState } from "react";
import { SimplePool } from "nostr-tools/pool";
import { nip19 } from "nostr-tools";

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

const RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://nos.lol",
  "wss://relay.nostr.band",
];

type Profile = {
  name?: string;
  display_name?: string;
  picture?: string;
  about?: string;
  nip05?: string;
  lud16?: string;
  banner?: string;
};

export default function LoginPage() {
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [npub, setNpub] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
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
      await window.nostr.signEvent({
        kind: 22242,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["relay", "wapufy.app"],
          ["challenge", `wapufy-login-${Date.now()}`],
        ],
        content: "Wapufy login",
      });

      setPubkey(pk);
      setNpub(nip19.npubEncode(pk));

      // Fetch kind:0 metadata across multiple relays
      const pool = new SimplePool();
      try {
        const event = await pool.get(RELAYS, { kinds: [0], authors: [pk] });
        if (event?.content) {
          try {
            const parsed = JSON.parse(event.content) as Profile;
            setProfile(parsed);
          } catch {
            // ignore malformed metadata
          }
        }
      } finally {
        pool.close(RELAYS);
      }
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
                    overflow: "hidden",
                    textOverflow: "ellipsis",
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

            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  marginBottom: 6,
                }}
              >
                npub
              </div>
              <code
                style={{
                  wordBreak: "break-all",
                  display: "block",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-secondary)",
                }}
              >
                {npub}
              </code>
            </div>

            {profile?.lud16 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "var(--primary)",
                  marginBottom: 8,
                }}
              >
                ⚡ <strong>{profile.lud16}</strong>
              </div>
            )}

            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
              Próximo paso: el backend verifica la firma del challenge y
              devuelve una cookie de sesión.
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
