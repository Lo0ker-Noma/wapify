"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function UserMenu() {
  const { pubkey, profile, npub, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!pubkey) return null;

  const label = profile?.display_name ?? profile?.name ?? "Nostr";
  const shortNpub = npub ? `${npub.slice(0, 10)}…${npub.slice(-4)}` : "";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        style={{
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.12)",
          padding: "4px 12px 4px 4px",
          borderRadius: 100,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          color: "var(--text)",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {profile?.picture ? (
          <img
            src={profile.picture}
            alt={label}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              objectFit: "cover",
              border: "1.5px solid var(--primary)",
            }}
          />
        ) : (
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, var(--primary), var(--lightning))",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              color: "#000",
              fontWeight: 700,
            }}
          >
            {label[0]?.toUpperCase()}
          </span>
        )}
        <span
          style={{
            maxWidth: 100,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
        <span style={{ opacity: 0.5, fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            background: "var(--dark-gray)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            minWidth: 240,
            padding: 8,
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            zIndex: 1100,
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 6,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
              {label}
            </div>
            {profile?.nip05 && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--primary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {profile.nip05}
              </div>
            )}
            <div
              style={{
                fontSize: 10,
                color: "var(--muted)",
                fontFamily: "var(--font-mono)",
                marginTop: 4,
              }}
            >
              {shortNpub}
            </div>
            {isAdmin && (
              <div
                style={{
                  display: "inline-block",
                  marginTop: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  padding: "2px 8px",
                  borderRadius: 100,
                  background: "rgba(0,255,157,0.12)",
                  color: "#00ff9d",
                  border: "1px solid rgba(0,255,157,0.25)",
                }}
              >
                ★ Admin · LaCrypta
              </div>
            )}
          </div>

          {isAdmin && (
            <>
              <MenuLink href="/dashboard" icon="◧" onClick={() => setOpen(false)}>
                Dashboard
              </MenuLink>
              <MenuLink
                href="/store/lacrypta"
                icon="◇"
                onClick={() => setOpen(false)}
              >
                Mi tienda
              </MenuLink>
              <MenuLink href="/settings" icon="⚙" onClick={() => setOpen(false)}>
                Settings
              </MenuLink>
              <div
                style={{
                  height: 1,
                  background: "rgba(255,255,255,0.06)",
                  margin: "6px 4px",
                }}
              />
            </>
          )}

          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            style={{
              width: "100%",
              textAlign: "left",
              background: "transparent",
              border: "none",
              padding: "10px 12px",
              borderRadius: 8,
              color: "#f87171",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ⏏ Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 8,
        color: "var(--text)",
        fontSize: 13,
        fontWeight: 500,
        textDecoration: "none",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ color: "var(--primary)", width: 16 }}>{icon}</span>
      {children}
    </Link>
  );
}
