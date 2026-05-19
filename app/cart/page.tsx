"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { nip19 } from "nostr-tools";
import { useCart } from "../components/CartProvider";
import CheckoutPanel from "../components/CheckoutPanel";
import { loadShipping, saveShipping, ShippingInfo } from "@/lib/cart";
import { loadSettings } from "@/lib/settings";
// window.nostr is already typed globally by AuthProvider.tsx — we only call
// .getPublicKey() here so the existing declaration is enough.

export default function CartPage() {
  const { items, count, totalSats, setQty, remove, clear } = useCart();
  const [shipping, setShipping] = useState<ShippingInfo>({
    name: "",
    address: "",
    city: "",
    pickup: false,
    npub: "",
  });
  const [phase, setPhase] = useState<"cart" | "shipping" | "pay">("cart");
  const [errors, setErrors] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [nostrBusy, setNostrBusy] = useState(false);
  const [nostrError, setNostrError] = useState<string | null>(null);

  async function fillFromNostrExtension() {
    setNostrError(null);
    if (typeof window === "undefined" || !window.nostr) {
      setNostrError(
        "No detectamos una extensión Nostr instalada (Alby, nos2x, Flamingo…). Instalá una y volvé a intentar."
      );
      return;
    }
    setNostrBusy(true);
    try {
      const pubkeyHex = await window.nostr.getPublicKey();
      const npub = nip19.npubEncode(pubkeyHex);
      setShipping((s) => ({ ...s, npub }));
      setErrors(null);
    } catch (e: any) {
      setNostrError(
        e?.message ?? "No pudimos leer tu npub. ¿Rechazaste el permiso?"
      );
    } finally {
      setNostrBusy(false);
    }
  }

  useEffect(() => {
    setShipping(loadShipping());
    setHydrated(true);
  }, []);

  const settings = useMemo(() => (hydrated ? loadSettings() : null), [hydrated]);

  const summaryName = useMemo(() => {
    if (items.length === 1) return `${items[0].name}${items[0].qty > 1 ? ` ×${items[0].qty}` : ""}`;
    return `Pedido (${count} ítems)`;
  }, [items, count]);

  function goShipping() {
    if (!items.length) return;
    setPhase("shipping");
  }

  function goPay() {
    setErrors(null);
    if (shipping.pickup) {
      // Pickup mode: at least one of name or npub is required so the admin
      // can identify / contact the buyer.
      const nameClean = shipping.name?.trim() ?? "";
      const npubClean = shipping.npub?.trim() ?? "";
      if (!nameClean && !npubClean) {
        setErrors("Completá al menos uno: nombre o npub");
        return;
      }
      if (
        npubClean &&
        !npubClean.startsWith("npub1") &&
        !npubClean.startsWith("nprofile")
      ) {
        setErrors("El npub debe empezar con npub1… — o dejalo vacío y poné solo nombre");
        return;
      }
    } else {
      if (!shipping.name.trim()) {
        setErrors("Falta el nombre del comprador");
        return;
      }
      if (!shipping.address.trim()) {
        setErrors("Falta la dirección de envío");
        return;
      }
      if (!shipping.city.trim()) {
        setErrors("Falta la ciudad");
        return;
      }
    }
    saveShipping(shipping);
    setPhase("pay");
  }

  if (!hydrated) {
    return (
      <div className="page-wrap">
        <p className="muted">Cargando carrito…</p>
      </div>
    );
  }

  return (
    <div className="page-wrap theme-crypta" style={{ maxWidth: 880 }}>
      <span className="tag-pill">🛒 Carrito</span>
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
        {phase === "cart"
          ? "Tu carrito"
          : phase === "shipping"
          ? "Datos de envío"
          : "Pagar"}
      </h1>

      {!items.length && phase === "cart" && (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <p className="muted" style={{ fontSize: 15, marginBottom: 16 }}>
            Tu carrito está vacío. Agregá productos desde la tienda.
          </p>
          <Link href="/store/lacrypta" className="btn btn-primary">
            Ir a la tienda →
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <>
          {/* Stepper */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 24,
              fontSize: 12,
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            <Step active={phase === "cart"} done={phase !== "cart"} num={1}>
              Carrito
            </Step>
            <Step
              active={phase === "shipping"}
              done={phase === "pay"}
              num={2}
            >
              Envío
            </Step>
            <Step active={phase === "pay"} done={false} num={3}>
              Pago
            </Step>
          </div>

          {phase === "cart" && (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="card"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "70px 1fr auto",
                      gap: 16,
                      alignItems: "center",
                      padding: 14,
                    }}
                  >
                    <img
                      src={it.img}
                      alt={it.name}
                      style={{
                        width: 70,
                        height: 70,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        {it.name}
                      </div>
                      {it.subtitle && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--muted)",
                            fontStyle: "italic",
                            marginBottom: 8,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {it.subtitle}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <QtyBtn onClick={() => setQty(it.id, it.qty - 1)}>−</QtyBtn>
                        <span
                          style={{
                            minWidth: 28,
                            textAlign: "center",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 600,
                          }}
                        >
                          {it.qty}
                        </span>
                        <QtyBtn onClick={() => setQty(it.id, it.qty + 1)}>+</QtyBtn>
                        <button
                          onClick={() => remove(it.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#f87171",
                            fontSize: 12,
                            marginLeft: 8,
                            cursor: "pointer",
                          }}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          color: "var(--bitcoin)",
                        }}
                      >
                        ⚡ {it.price * it.qty}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        {it.price} sats c/u
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                    Total ({count} ítems)
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 26,
                      fontWeight: 700,
                      color: "var(--bitcoin)",
                    }}
                  >
                    ⚡ {totalSats.toLocaleString("es-AR")} sats
                  </div>
                </div>
                <button className="btn btn-primary" onClick={goShipping}>
                  Continuar →
                </button>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btn-outline"
                  onClick={() =>
                    confirm("¿Vaciar el carrito?") && clear()
                  }
                  style={{
                    borderColor: "rgba(248,113,113,0.3)",
                    color: "#f87171",
                  }}
                >
                  Vaciar carrito
                </button>
                <Link href="/store/lacrypta" className="btn btn-outline">
                  ← Seguir comprando
                </Link>
              </div>
            </>
          )}

          {phase === "shipping" && (
            <>
              {/* ── Pickup / Delivery toggle ──────────────────────────── */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  padding: 4,
                  marginBottom: 20,
                }}
              >
                <ToggleTab
                  active={!shipping.pickup}
                  onClick={() => setShipping({ ...shipping, pickup: false })}
                >
                  📦 Envío a domicilio
                </ToggleTab>
                <ToggleTab
                  active={!!shipping.pickup}
                  onClick={() => setShipping({ ...shipping, pickup: true })}
                >
                  🫂 Retiro en LaCrypta
                </ToggleTab>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>

                {shipping.pickup ? (
                  /* ── Pickup form: nombre o npub, sin KYC ─────────────── */
                  <>
                    <div
                      style={{
                        background: "linear-gradient(135deg, rgba(0,255,157,0.06), rgba(153,69,255,0.06))",
                        border: "1px solid rgba(0,255,157,0.18)",
                        borderRadius: 12,
                        padding: "14px 16px",
                        marginBottom: 20,
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: "var(--primary)" }}>
                        ⚡ Sin KYC — identificate con nombre o npub
                      </div>
                      <p className="muted" style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                        Coordinás el retiro directo con el admin. Completá{" "}
                        <strong style={{ color: "var(--text)" }}>al menos uno</strong> de
                        los dos campos — no hace falta dirección ni email.
                      </p>
                    </div>

                    <Field label="Nombre">
                      <input
                        className="wapu-input"
                        value={shipping.name}
                        onChange={(e) =>
                          setShipping({ ...shipping, name: e.target.value })
                        }
                        placeholder="Cómo te llamamos"
                      />
                    </Field>

                    <Field label="Tu npub Nostr">
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          className="wapu-input"
                          value={shipping.npub ?? ""}
                          onChange={(e) =>
                            setShipping({ ...shipping, npub: e.target.value.trim() })
                          }
                          placeholder="npub1..."
                          spellCheck={false}
                          autoComplete="off"
                          style={{ flex: 1, minWidth: 0 }}
                        />
                        <button
                          type="button"
                          onClick={fillFromNostrExtension}
                          disabled={nostrBusy}
                          className="btn btn-outline"
                          style={{
                            padding: "0 14px",
                            whiteSpace: "nowrap",
                            cursor: nostrBusy ? "wait" : "pointer",
                            borderColor: "rgba(153,69,255,0.4)",
                            color: "var(--lightning, #9945ff)",
                          }}
                          title="Pide tu npub a la extensión NIP-07 (Alby, nos2x, Flamingo…)"
                        >
                          {nostrBusy ? "🔑 …" : "🔑 Usar mi extensión"}
                        </button>
                      </div>
                      {nostrError ? (
                        <span style={{ fontSize: 11, color: "#fca5a5", marginTop: 6, display: "block" }}>
                          {nostrError}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 5, display: "block" }}>
                          Click en "Usar mi extensión" para que Alby / nos2x / Flamingo te firme la identificación, o pegá el npub manualmente.
                        </span>
                      )}
                    </Field>

                    <Field label="Notas para el retiro (opcional)">
                      <textarea
                        className="wapu-input"
                        rows={2}
                        value={shipping.notes ?? ""}
                        onChange={(e) =>
                          setShipping({ ...shipping, notes: e.target.value })
                        }
                        placeholder="Horario preferido, etc."
                      />
                    </Field>
                  </>
                ) : (
                  /* ── Delivery form: campos normales ─────────────────── */
                  <>
                    <Field label="Nombre del comprador *">
                      <input
                        className="wapu-input"
                        value={shipping.name}
                        onChange={(e) =>
                          setShipping({ ...shipping, name: e.target.value })
                        }
                        placeholder="Tu nombre"
                      />
                    </Field>
                    <Field label="Email (opcional, para recibo)">
                      <input
                        className="wapu-input"
                        type="email"
                        value={shipping.email ?? ""}
                        onChange={(e) =>
                          setShipping({ ...shipping, email: e.target.value })
                        }
                        placeholder="email@ejemplo.com"
                      />
                    </Field>
                    <Field label="Dirección de envío *">
                      <input
                        className="wapu-input"
                        value={shipping.address}
                        onChange={(e) =>
                          setShipping({ ...shipping, address: e.target.value })
                        }
                        placeholder="Calle, número, piso"
                      />
                    </Field>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr",
                        gap: 12,
                      }}
                    >
                      <Field label="Ciudad *">
                        <input
                          className="wapu-input"
                          value={shipping.city}
                          onChange={(e) =>
                            setShipping({ ...shipping, city: e.target.value })
                          }
                          placeholder="Buenos Aires"
                        />
                      </Field>
                      <Field label="CP">
                        <input
                          className="wapu-input"
                          value={shipping.postalCode ?? ""}
                          onChange={(e) =>
                            setShipping({ ...shipping, postalCode: e.target.value })
                          }
                          placeholder="1414"
                        />
                      </Field>
                    </div>
                    <Field label="Teléfono / contacto (opcional)">
                      <input
                        className="wapu-input"
                        value={shipping.phone ?? ""}
                        onChange={(e) =>
                          setShipping({ ...shipping, phone: e.target.value })
                        }
                        placeholder="+54 11 ..."
                      />
                    </Field>
                    <Field label="Tu npub Nostr (opcional)">
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          className="wapu-input"
                          value={shipping.npub ?? ""}
                          onChange={(e) =>
                            setShipping({ ...shipping, npub: e.target.value.trim() })
                          }
                          placeholder="npub1… (para asociar tu pedido sin KYC)"
                          spellCheck={false}
                          autoComplete="off"
                          style={{ flex: 1, minWidth: 0 }}
                        />
                        <button
                          type="button"
                          onClick={fillFromNostrExtension}
                          disabled={nostrBusy}
                          className="btn btn-outline"
                          style={{
                            padding: "0 14px",
                            whiteSpace: "nowrap",
                            cursor: nostrBusy ? "wait" : "pointer",
                            borderColor: "rgba(153,69,255,0.4)",
                            color: "var(--lightning, #9945ff)",
                          }}
                          title="Pide tu npub a la extensión NIP-07"
                        >
                          {nostrBusy ? "🔑 …" : "🔑 Extensión"}
                        </button>
                      </div>
                      {nostrError && (
                        <span style={{ fontSize: 11, color: "#fca5a5", marginTop: 6, display: "block" }}>
                          {nostrError}
                        </span>
                      )}
                    </Field>
                    <Field label="Notas del envío (opcional)">
                      <textarea
                        className="wapu-input"
                        rows={2}
                        value={shipping.notes ?? ""}
                        onChange={(e) =>
                          setShipping({ ...shipping, notes: e.target.value })
                        }
                        placeholder="Horarios, indicaciones, etc."
                      />
                    </Field>
                  </>
                )}

                {errors && (
                  <p
                    style={{
                      color: "#f87171",
                      fontSize: 13,
                      background: "rgba(248,113,113,0.08)",
                      padding: 10,
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  >
                    {errors}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setPhase("cart")}
                >
                  ← Volver
                </button>
                <button className="btn btn-primary" onClick={goPay}>
                  Pagar ⚡ {totalSats} sats →
                </button>
              </div>
            </>
          )}

          {phase === "pay" && (
            <>
              <div
                className="card"
                style={{ marginBottom: 16, padding: 18 }}
              >
                {shipping.pickup ? (
                  <>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>
                      🫂 Retiro en LaCrypta — sin KYC
                    </div>
                    {shipping.name?.trim() && (
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        {shipping.name.trim()}
                      </div>
                    )}
                    {shipping.npub?.trim() && (
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          color: "var(--primary)",
                          wordBreak: "break-all",
                          marginBottom: 4,
                        }}
                      >
                        {shipping.npub.trim()}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      {shipping.npub?.trim()
                        ? "El admin te contacta por Nostr DM para coordinar"
                        : "Coordiná el retiro con el admin en el local"}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>
                      📦 Enviar a
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>
                      {shipping.name}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {shipping.address}, {shipping.city}
                      {shipping.postalCode ? ` (${shipping.postalCode})` : ""}
                    </div>
                    {shipping.phone && (
                      <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        📞 {shipping.phone}
                      </div>
                    )}
                  </>
                )}
                <button
                  onClick={() => setPhase("shipping")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--primary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginTop: 10,
                    padding: 0,
                  }}
                >
                  ✎ Editar
                </button>
              </div>

              <CheckoutPanel
                amountSats={totalSats}
                productName={summaryName}
                lnAddress={settings?.lightningAddress}
                wapuUsername={settings?.wapuUsername}
                buyerNpub={shipping.npub?.trim() || undefined}
                buyerName={shipping.name?.trim() || undefined}
              />

              <button
                className="btn btn-outline"
                onClick={() => setPhase("shipping")}
                style={{ marginTop: 16 }}
              >
                ← Volver a envío
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

function QtyBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 6,
        color: "var(--text)",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

function Step({
  active,
  done,
  num,
  children,
}: {
  active: boolean;
  done: boolean;
  num: number;
  children: React.ReactNode;
}) {
  const color = active ? "var(--primary)" : done ? "var(--text-secondary)" : "var(--muted)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color,
        fontWeight: active ? 700 : 500,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: `1px solid ${color}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
        }}
      >
        {done ? "✓" : num}
      </span>
      {children}
    </span>
  );
}

function ToggleTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 14px",
        borderRadius: 8,
        background: active ? "var(--primary)" : "transparent",
        color: active ? "#000" : "var(--text-secondary)",
        border: "none",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {children}
    </button>
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
    <label style={{ display: "block", marginBottom: 14 }}>
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
