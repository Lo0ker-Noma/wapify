"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { useCart } from "./CartProvider";

export default function Navbar() {
  const { pubkey, profile, login, loading } = useAuth();
  const { count } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    setBusy(true);
    try {
      await login();
      router.push("/store/lacrypta");
    } catch (e: any) {
      // Fallback to login page when extension is missing or user cancels
      router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  const avatarLabel = profile?.display_name ?? profile?.name ?? "N";

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          wapufy<span className="dot">.</span>
        </Link>
        <div className="nav-links">
          <a href="/#build">Build</a>
          <a href="/#sell">Sell</a>
          <a href="/#market">Market</a>
          <a href="/#manage">Manage</a>
          <a href="/#pricing">Pricing</a>
          <Link href="/store/lacrypta">Demo</Link>
          <Link
            href="/cart"
            aria-label="Carrito"
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 16,
            }}
          >
            🛒
            {count > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  background: "var(--primary)",
                  color: "#000",
                  fontSize: 10,
                  fontWeight: 700,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 100,
                  padding: "0 5px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid var(--black)",
                }}
              >
                {count}
              </span>
            )}
          </Link>
          {pubkey ? (
            <Link
              href="/dashboard"
              aria-label="Mi dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid var(--primary)",
                boxShadow: "0 0 16px var(--primary-glow)",
                background:
                  "linear-gradient(135deg, var(--primary), var(--lightning))",
              }}
            >
              {profile?.picture ? (
                <img
                  src={profile.picture}
                  alt={avatarLabel}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#000",
                  }}
                >
                  {avatarLabel[0]?.toUpperCase()}
                </span>
              )}
            </Link>
          ) : (
            <button
              onClick={handleLogin}
              disabled={busy || loading}
              className="btn btn-primary btn-nav"
              style={{ cursor: busy || loading ? "wait" : "pointer" }}
            >
              {busy || loading ? "Esperando…" : "Registrarse o acceder"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
