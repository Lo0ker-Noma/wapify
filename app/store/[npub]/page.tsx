import { notFound } from "next/navigation";
import Link from "next/link";

const MOCK_STORES: Record<
  string,
  {
    name: string;
    bio: string;
    seller_username?: string;
    products: { id: string; name: string; price: number; img: string }[];
  }
> = {
  demo: {
    name: "Tienda Demo",
    bio: "Productos mock para probar el flow Wapu Lightning. El pago va a la Lightning Address del vendedor configurada en WAPU_DEMO_SELLER.",
    products: [
      {
        id: "p1",
        name: "Yerba mate orgánica 500g",
        price: 4500,
        img: "https://placehold.co/600x600/0a0a0a/00ff9d/png?text=Yerba",
      },
      {
        id: "p2",
        name: "Mate de calabaza",
        price: 12000,
        img: "https://placehold.co/600x600/0a0a0a/9945ff/png?text=Mate",
      },
      {
        id: "p3",
        name: "Bombilla de alpaca",
        price: 8500,
        img: "https://placehold.co/600x600/0a0a0a/00ff9d/png?text=Bombilla",
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

  return (
    <div className="page-wrap">
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

      <div className="row">
        {store.products.map((p) => {
          const checkoutUrl = `/checkout?amount=${p.price}&product=${encodeURIComponent(
            p.name
          )}${store.seller_username ? `&seller=${store.seller_username}` : ""}`;
          return (
            <div key={p.id} className="feature-card">
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
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                {p.name}
              </h3>
              <p
                className="muted"
                style={{ fontSize: 14, marginBottom: 16 }}
              >
                ${p.price.toLocaleString("es-AR")} ARS
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
          background:
            "linear-gradient(135deg, rgba(0,255,157,0.06), rgba(153,69,255,0.06))",
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
