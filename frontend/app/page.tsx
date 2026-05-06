import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <span className="badge">⚡ La Cripta Commerce Hackaton 2026</span>
      <h1>Wapufy</h1>
      <p className="muted" style={{ fontSize: "1.15rem", maxWidth: 640 }}>
        Un clon de Shopify pensado para LATAM: catálogo, carrito, checkout y
        órdenes, con pagos P2P integrados via <strong>Wapu</strong> y login
        nativo con tu perfil de <strong>Nostr (NIP-07)</strong>.
      </p>

      <div className="row" style={{ marginTop: "1.5rem" }}>
        <Link href="/login"><button>Login con Nostr</button></Link>
        <Link href="/store/demo"><button className="secondary">Ver tienda demo</button></Link>
      </div>

      <h2>Stack</h2>
      <div className="row">
        <div className="card">
          <h3>Identidad</h3>
          <p className="muted">
            NIP-07 (window.nostr) → npub como user_id. Sin emails, sin
            passwords. Profile vía kind:0 en relays públicos.
          </p>
        </div>
        <div className="card">
          <h3>Pagos</h3>
          <p className="muted">
            Checkout que llama a la API de Wapu. Webhook firmado vuelve a
            <code>/api/webhooks/wapu</code> y marca la orden como pagada.
          </p>
        </div>
        <div className="card">
          <h3>Tienda</h3>
          <p className="muted">
            Catálogo CRUD, carrito client-side, checkout, dashboard de órdenes.
            URL pública en <code>/@npub</code>.
          </p>
        </div>
      </div>

      <h2>Roadmap MVP</h2>
      <ul className="muted">
        <li>Login Nostr (NIP-07) ⏳</li>
        <li>CRUD productos ⏳</li>
        <li>Checkout + Wapu API ⏳</li>
        <li>Webhook handler ⏳</li>
        <li>Tienda pública /@npub ⏳</li>
      </ul>
    </main>
  );
}
