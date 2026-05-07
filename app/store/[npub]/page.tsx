import { notFound } from "next/navigation";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  subtitle?: string;
  price: number; // in sats
  img: string;
  tag?: string;
};

type Store = {
  name: string;
  bio: string;
  seller_username?: string;
  theme?: "crypta";
  hero?: { kicker: string; title: string; subtitle: string };
  products: Product[];
};

const MOCK_STORES: Record<string, Store> = {
  demo: {
    name: "Tienda Demo",
    bio: "Productos mock para probar el flow Wapu Lightning. El pago va a la Lightning Address del vendedor configurada en WAPU_DEMO_SELLER.",
    products: [
      {
        id: "p1",
        name: "Yerba mate orgánica 500g",
        price: 4,
        img: "https://placehold.co/600x600/0a0a0a/dc4d8a/png?text=Yerba",
      },
      {
        id: "p2",
        name: "Mate de calabaza",
        price: 7,
        img: "https://placehold.co/600x600/0a0a0a/9945ff/png?text=Mate",
      },
      {
        id: "p3",
        name: "Bombilla de alpaca",
        price: 5,
        img: "https://placehold.co/600x600/0a0a0a/dc4d8a/png?text=Bombilla",
      },
    ],
  },
  lacrypta: {
    name: "LaCrypta Apparel HDMP",
    bio: "Drop oficial de la comunidad. Hecho en Argentina, pagado en Lightning. Sin custodia, sin intermediarios — Hodl & wear.",
    theme: "crypta",
    hero: {
      kicker: "DROP 001 · HODL DON'T MISS PURPOSE",
      title: "Apparel HDMP",
      subtitle: "La línea de ropa de la comunidad LaCrypta. Cada pieza es un manifiesto.",
    },
    products: [
      {
        id: "yerba-hdmp",
        name: "Yerba Mate HDMP",
        subtitle: "Yerba mate con palo para tener el pito parado.",
        price: 8,
        img: "https://placehold.co/600x600/000000/00ff9d/png?text=YERBA+HDMP",
        tag: "★ Más vendida",
      },
      {
        id: "hoodie-crypta",
        name: "Hoodie LaCrypta Black",
        subtitle: "Algodón pesado, capucha forrada. Made in AR.",
        price: 7,
        img: "https://placehold.co/600x600/000000/00ff9d/png?text=HOODIE",
      },
      {
        id: "cap-hdmp",
        name: "Gorra HDMP Verde",
        subtitle: "Bordado verde Nostr sobre negro.",
        price: 5,
        img: "https://placehold.co/600x600/000000/00ff9d/png?text=CAP",
      },
      {
        id: "stickers",
        name: "Sticker Pack (10u)",
        subtitle: "Pack troquelado, vinilo resistente al agua.",
        price: 3,
        img: "https://placehold.co/600x600/000000/9945ff/png?text=STICKERS",
      },
      {
        id: "tote-hodl",
        name: "Tote 'HODL' Crudo",
        subtitle: "Para llevar tus seeds y la merca a la feria.",
        price: 4,
        img: "https://placehold.co/600x600/000000/00ff9d/png?text=TOTE",
      },
      {
        id: "mug-lightning",
        name: "Taza ⚡ Lightning",
        subtitle: "Cerámica, 350ml, asa anti-quema-dedos.",
        price: 5,
        img: "https://placehold.co/600x600/000000/9945ff/png?text=MUG",
      },
      {
        id: "spray-antikukas",
        name: "Spray de Pimienta Antikukas",
        subtitle: "Perfecto para que no te suen la billetera.",
        price: 6,
        img: "https://placehold.co/600x600/000000/00ff9d/png?text=ANTIKUKAS",
        tag: "🌶 Defensa P2P",
      },
    ],
  },
};

export default function StorePage({
  params,
}: {
  params: { npub: string };
}) {
  const store = MOCK_STORES[params.npub];
  if (!store) notFound();

  const isCrypta = store.theme === "crypta";

  return (
    <div className={`page-wrap ${isCrypta ? "theme-crypta" : ""}`}>
      {isCrypta && store.hero ? (
        <div className="crypta-hero">
          <span className="crypta-logo">▲ LACRYPTA</span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(44px, 7vw, 72px)",
              fontWeight: 700,
              letterSpacing: "-2px",
              lineHeight: 1.02,
              marginBottom: 16,
            }}
          >
            {store.hero.title}
          </h1>
          <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 560, marginBottom: 18 }}>
            {store.hero.subtitle}
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: 2,
              color: "var(--primary)",
              opacity: 0.8,
            }}
          >
            {store.hero.kicker}
          </p>
        </div>
      ) : (
        <>
          <span className="tag-pill">@{params.npub}</span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(40px, 6vw, 64px)",
              fontWeight: 700,
              letterSpacing: "-1.5px",
              lineHeight: 1.05,
              marginBottom: 12,
            }}
          >
            {store.name}
          </h1>
          <p className="muted" style={{ fontSize: 17, marginBottom: 48, maxWidth: 640 }}>
            {store.bio}
          </p>
        </>
      )}

      {isCrypta && (
        <p className="muted" style={{ fontSize: 15, marginBottom: 40, maxWidth: 640 }}>
          {store.bio}
        </p>
      )}

      <div className="row">
        {store.products.map((p) => {
          const checkoutUrl = `/checkout?sats=${p.price}&product=${encodeURIComponent(
            p.name
          )}${store.seller_username ? `&seller=${store.seller_username}` : ""}`;
          return (
            <div key={p.id} className="feature-card">
              <div style={{ position: "relative" }}>
                <img
                  src={p.img}
                  alt={p.name}
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                    borderRadius: 12,
                    marginBottom: 16,
                  }}
                />
                {p.tag && (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      padding: "4px 10px",
                      background: "var(--primary)",
                      color: "#000",
                      borderRadius: 100,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                    }}
                  >
                    {p.tag}
                  </span>
                )}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: p.subtitle ? 4 : 6,
                }}
              >
                {p.name}
              </h3>
              {p.subtitle && (
                <p
                  className="muted"
                  style={{
                    fontSize: 13,
                    fontStyle: "italic",
                    marginBottom: 10,
                    lineHeight: 1.4,
                  }}
                >
                  {p.subtitle}
                </p>
              )}
              <p
                style={{
                  fontSize: 15,
                  marginBottom: 16,
                  fontFamily: "var(--font-mono)",
                  color: "var(--primary)",
                  fontWeight: 600,
                }}
              >
                ⚡ {p.price.toLocaleString("es-AR")} sats
              </p>
              <Link href={checkoutUrl} className="btn btn-primary btn-block">
                Comprar con Wapu ⚡
              </Link>
            </div>
          );
        })}
      </div>

      <div
        className="card"
        style={{
          marginTop: 48,
          background: isCrypta
            ? "linear-gradient(135deg, rgba(0,255,157,0.06), rgba(153,69,255,0.06))"
            : "linear-gradient(135deg, rgba(220,77,138,0.06), rgba(153,69,255,0.06))",
          textAlign: "center",
        }}
      >
        <p className="muted" style={{ fontSize: 14, margin: 0 }}>
          ⚡ Checkout via Lightning Address de Wapu — el invoice se genera en{" "}
          <code>/lnurlp/{"<seller>"}/callback</code> y se confirma por polling
          al verify URL. Sin webhooks, sin custodia de Wapufy.
        </p>
      </div>
    </div>
  );
}
