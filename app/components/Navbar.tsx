"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { useCart } from "./CartProvider";

export default function Navbar() {
  const { pubkey, profile, login, loading } = useAuth();
  const { count } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  async function handleLogin() {
    setBusy(true);
    setMenuOpen(false);
    try {
      await login();
      router.push("/store/lacrypta");
    } catch {
      router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  const avatarLabel = profile?.display_name ?? profile?.name ?? "N";

  const navLinks = (
    <>
      <a href="/#build" onClick={() => setMenuOpen(false)}>Build</a>
      <a href="/#sell" onClick={() => setMenuOpen(false)}>Sell</a>
      <a href="/#market" onClick={() => setMenuOpen(false)}>Market</a>
      <a href="/#manage" onClick={() => setMenuOpen(false)}>Manage</a>
      <a href="/#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
      <Link href="/store/lacrypta" onClick={() => setMenuOpen(false)}>Demo</Link>
    </>
  );

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <Link href="/" className="nav-logo">
            wapufy<span className="dot">.</span>
          </Link>

          {/* Desktop links */}
          <div className="nav-links">
            {navLinks}

            {/* Cart icon */}
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

            {/* Avatar or login */}
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
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#000" }}>
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

          {/* Mobile right side: cart + hamburger */}
          <div className="nav-mobile-actions">
            <Link
              href="/cart"
              aria-label="Carrito"
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: 18,
              }}
            >
              🛒
              {count > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
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

            <button
              className="nav-hamburger"
              aria-label="Menú"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className={`ham-line ${menuOpen ? "open" : ""}`} />
              <span className={`ham-line ${menuOpen ? "open" : ""}`} />
              <span className={`ham-line ${menuOpen ? "open" : ""}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <div
          className="mobile-drawer"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="mobile-drawer-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-drawer-links">
              {navLinks}
            </div>
            <div className="mobile-drawer-actions">
              {pubkey ? (
                <Link
                  href="/dashboard"
                  className="btn btn-outline"
                  style={{ width: "100%", textAlign: "center" }}
                  onClick={() => setMenuOpen(false)}
                >
                  ◧ Dashboard
                </Link>
              ) : (
                <button
                  onClick={handleLogin}
                  disabled={busy || loading}
                  className="btn btn-primary"
                  style={{ width: "100%", cursor: busy || loading ? "wait" : "pointer" }}
                >
                  {busy || loading ? "Esperando…" : "⚡ Registrarse o acceder"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
