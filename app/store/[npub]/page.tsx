import { notFound } from "next/navigation";

// Mock data — TODO: replace with Supabase fetch by store npub
const MOCK_STORES: Record<
  string,
  { name: string; bio: string; products: { id: string; name: string; price: number; img: string }[] }
> = {
  demo: {
    name: "Tienda Demo",
    bio: "Un par de productos de muestra mientras conectamos Supabase y Wapu.",
    products: [
      { id: "p1", name: "Yerba mate orgánica 500g", price: 4500, img: "https://placehold.co/400x400/18181b/a855f7/png?text=Yerba" },
      { id: "p2", name: "Mate de calabaza", price: 12000, img: "https://placehold.co/400x400/18181b/a855f7/png?text=Mate" },
      { id: "p3", name: "Bombilla de alpaca", price: 8500, img: "https://placehold.co/400x400/18181b/a855f7/png?text=Bombilla" },
    ],
  },
};

export default function StorePage({ params }: { params: { npub: string } }) {
  const store = MOCK_STORES[params.npub];
  if (!store) notFound();

  return (
    <main className="container">
      <span className="badge">@{params.npub}</span>
      <h1>{store.name}</h1>
      <p className="muted">{store.bio}</p>

      <h2>Productos</h2>
      <div className="row">
        {store.products.map((p) => (
          <div key={p.id} className="card">
            <img src={p.img} alt={p.name} style={{ width: "100%", borderRadius: 8 }} />
            <h3 style={{ margin: "0.75rem 0 0.25rem" }}>{p.name}</h3>
            <p className="muted" style={{ margin: 0 }}>
              ${p.price.toLocaleString("es-AR")} ARS
            </p>
            <button style={{ marginTop: "0.75rem", width: "100%" }}>
              Agregar al carrito
            </button>
          </div>
        ))}
      </div>

      <p className="muted" style={{ marginTop: "2rem", fontSize: "0.9rem" }}>
        Checkout via Wapu — TODO: integrar API real cuando tengamos credenciales.
      </p>
    </main>
  );
}
