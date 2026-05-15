"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/products";
import CheckoutPanel from "./CheckoutPanel";
import { useCart } from "./CartProvider";
import { useAuth } from "./AuthProvider";

export default function ProductDetailModal({
  product,
  lnAddress,
  wapuUsername,
  onClose,
}: {
  product: Product;
  lnAddress?: string;
  wapuUsername?: string;
  onClose: () => void;
}) {
  const { add } = useCart();
  const router = useRouter();
  const { npub, profile } = useAuth();
  const [mode, setMode] = useState<"buy" | "added">("buy");
  const [showCheckout, setShowCheckout] = useState(false);
  const [identStep, setIdentStep] = useState(true); // identification before checkout
  const [buyerNpub, setBuyerNpub] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerError, setBuyerError] = useState<string | null>(null);

  // Auto-fill from logged-in Nostr identity
  useEffect(() => {
    if (npub) setBuyerNpub(npub);
    const fromProfile =
      (profile as any)?.display_name ?? (profile as any)?.name ?? "";
    if (fromProfile) setBuyerName(fromProfile);
  }, [npub, profile]);

  function handleAdd() {
    add(
      {
        id: product.id,
        name: product.name,
        subtitle: product.subtitle,
        img: product.img,
        price: product.price,
      },
      1
    );
    setMode("added");
    setTimeout(() => setMode("buy"), 1500);
  }
  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backdropFilter: "blur(10px)",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--dark-gray)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          width: "100%",
          maxWidth: 880,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            width: 36,
            height: 36,
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "50%",
            color: "var(--text)",
            fontSize: 20,
            cursor: "pointer",
            zIndex: 2,
            backdropFilter: "blur(8px)",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div className="pdm-grid">
          <div className="pdm-image-col">
            <img
              src={product.img}
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            {product.tag && (
              <span
                style={{
                  position: "absolute",
                  top: 14,
                  left: 14,
                  padding: "5px 12px",
                  background: "var(--primary)",
                  color: "#000",
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                {product.tag}
              </span>
            )}
          </div>

          <div className="pdm-content-col">
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(22px, 3vw, 30px)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.5px",
                marginBottom: 8,
              }}
            >
              {product.name}
            </h2>
            {product.subtitle && (
              <p
                className="muted"
                style={{
                  fontSize: 14,
                  fontStyle: "italic",
                  marginBottom: 14,
                  lineHeight: 1.5,
                }}
              >
                {product.subtitle}
              </p>
            )}
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--primary)",
                marginBottom: 18,
              }}
            >
              ⚡ {product.price.toLocaleString("es-AR")} sats
            </div>

            {!showCheckout ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  className="btn btn-primary btn-block"
                  onClick={handleAdd}
                  style={{ fontSize: 15, padding: "14px 18px" }}
                >
                  {mode === "added" ? "✓ Agregado al carrito" : "🛒 Agregar al carrito"}
                </button>
                <button
                  className="btn btn-outline btn-block"
                  onClick={() => {
                    add(
                      {
                        id: product.id,
                        name: product.name,
                        subtitle: product.subtitle,
                        img: product.img,
                        price: product.price,
                      },
                      1
                    );
                    onClose();
                    router.push("/cart");
                  }}
                >
                  Comprar ahora →
                </button>
                <button
                  className="btn btn-outline btn-block"
                  onClick={() => setShowCheckout(true)}
                  style={{ borderStyle: "dashed", fontSize: 13 }}
                >
                  Pago directo (sin envío)
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowCheckout(false);
                    setIdentStep(true);
                    setBuyerError(null);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    cursor: "pointer",
                    marginBottom: 8,
                    padding: 0,
                  }}
                >
                  ← Volver
                </button>

                {identStep ? (
                  <div
                    style={{
                      padding: 16,
                      background: "linear-gradient(135deg, rgba(0,255,157,0.05), rgba(153,69,255,0.04))",
                      border: "1px solid rgba(0,255,157,0.18)",
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                        color: "var(--primary)",
                        fontWeight: 700,
                        marginBottom: 6,
                      }}
                    >
                      🔑 Identificate (sin KYC)
                    </div>
                    <p className="muted" style={{ fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>
                      Tu pedido queda asociado a tu npub Nostr. El admin te puede
                      contactar por DM Nostr si necesita coordinar algo.
                    </p>

                    <p
                      className="muted"
                      style={{
                        fontSize: 11,
                        margin: "0 0 10px",
                        fontStyle: "italic",
                      }}
                    >
                      Completá <strong style={{ color: "var(--text)" }}>al menos uno</strong> de los dos campos.
                    </p>

                    <label style={{ display: "block", marginBottom: 10 }}>
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 1.2,
                          color: "var(--muted)",
                          fontWeight: 600,
                          marginBottom: 5,
                        }}
                      >
                        Nombre
                      </span>
                      <input
                        className="wapu-input"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Cómo te llamamos"
                      />
                    </label>

                    <label style={{ display: "block", marginBottom: 6 }}>
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 1.2,
                          color: "var(--muted)",
                          fontWeight: 600,
                          marginBottom: 5,
                        }}
                      >
                        Tu npub
                      </span>
                      <input
                        className="wapu-input"
                        value={buyerNpub}
                        onChange={(e) => setBuyerNpub(e.target.value.trim())}
                        placeholder="npub1…"
                        spellCheck={false}
                        autoComplete="off"
                      />
                      {npub && buyerNpub === npub && (
                        <span style={{ fontSize: 11, color: "var(--primary)", marginTop: 4, display: "block" }}>
                          ✓ Auto-cargado desde tu sesión Nostr
                        </span>
                      )}
                    </label>

                    {buyerError && (
                      <p style={{ color: "#f87171", fontSize: 12, margin: "8px 0 0" }}>
                        {buyerError}
                      </p>
                    )}

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: "100%", marginTop: 14 }}
                      onClick={() => {
                        const npubClean = buyerNpub.trim();
                        const nameClean = buyerName.trim();
                        if (!npubClean && !nameClean) {
                          setBuyerError("Ingresá tu nombre o tu npub para identificar el pedido");
                          return;
                        }
                        if (
                          npubClean &&
                          !npubClean.startsWith("npub1") &&
                          !npubClean.startsWith("nprofile")
                        ) {
                          setBuyerError(
                            "El npub debe empezar con npub1… — o dejalo vacío y completá solo el nombre"
                          );
                          return;
                        }
                        setBuyerError(null);
                        setIdentStep(false);
                      }}
                    >
                      Continuar al pago →
                    </button>
                  </div>
                ) : (
                  <CheckoutPanel
                    amountSats={product.price}
                    productName={product.name}
                    lnAddress={lnAddress}
                    wapuUsername={wapuUsername}
                    buyerNpub={buyerNpub.trim()}
                    buyerName={buyerName.trim() || undefined}
                    compact
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .pdm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          flex: 1;
          min-height: 0;
        }
        .pdm-image-col {
          position: relative;
          background: #000;
          aspect-ratio: 1 / 1;
          overflow: hidden;
        }
        .pdm-content-col {
          padding: 28px;
          overflow-y: auto;
          max-height: 92vh;
        }
        @media (max-width: 720px) {
          .pdm-grid {
            grid-template-columns: 1fr;
          }
          .pdm-image-col {
            aspect-ratio: 16 / 10;
          }
          .pdm-content-col {
            padding: 20px;
            max-height: none;
          }
        }
      `}</style>
    </div>
  );
}
