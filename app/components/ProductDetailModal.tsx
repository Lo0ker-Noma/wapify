"use client";

import { useEffect } from "react";
import { Product } from "@/lib/products";
import CheckoutPanel from "./CheckoutPanel";

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

            <CheckoutPanel
              amountSats={product.price}
              productName={product.name}
              lnAddress={lnAddress}
              wapuUsername={wapuUsername}
              compact
            />
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
