import Link from "next/link";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="container">
          <div className="hero-inner">
            <span className="hero-badge">
              <span className="pulse" />
              La Cripta Commerce Hackaton · 2026
            </span>
            <h1>
              Vendé sin permiso.
              <br />
              <span className="highlight">Sin cuotas.</span> Sin fronteras.
            </h1>
            <p className="lead">
              Wapufy es la plataforma eCommerce soberana para LATAM. Cloná los
              servicios de Shopify pero con identidad <strong>Nostr</strong>{" "}
              (login con tu npub, NIP-07) y pagos <strong>P2P con Wapu</strong>.
              Sin intermediarios, sin abonos, sin custodia.
            </p>
            <div className="hero-ctas">
              <Link href="/login" className="btn btn-primary btn-large">
                Crear mi tienda con Nostr →
              </Link>
              <Link href="/store/demo" className="btn btn-outline btn-large">
                Ver tienda demo
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <div className="num accent">&lt; 5 min</div>
                <div className="label">Setup completo</div>
              </div>
              <div className="stat">
                <div className="num">$0</div>
                <div className="label">Cuota mensual</div>
              </div>
              <div className="stat">
                <div className="num">P2P</div>
                <div className="label">Pago directo via Wapu</div>
              </div>
              <div className="stat">
                <div className="num accent">npub</div>
                <div className="label">Tu identidad, tu llave</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="container">
          <span className="section-tag">Lo que necesitás · y nada más</span>
          <h2>Todo lo de Shopify, ninguno de sus dolores.</h2>
          <p className="section-lead">
            Tomamos el playbook de Shopify (catálogo, carrito, checkout,
            órdenes, webhooks) y lo reescribimos sobre Nostr y Wapu. Vos sos
            dueño de tu identidad, de tu data, y de cada peso que entra.
          </p>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="icon">🔑</div>
              <h3>Login con Nostr</h3>
              <p>
                Conectás tu extensión NIP-07 (Alby, nos2x). Tu npub es tu
                cuenta. Sin emails, sin passwords, sin verificación 2FA por SMS.
              </p>
            </div>
            <div className="feature-card">
              <div className="icon">⚡</div>
              <h3>Pagos P2P con Wapu</h3>
              <p>
                Cobrás directo a tu wallet vía Wapu. Sin aggregator que retenga
                fondos, sin chargebacks, sin reservas de saldo.
              </p>
            </div>
            <div className="feature-card">
              <div className="icon">🛒</div>
              <h3>Catálogo y carrito</h3>
              <p>
                Subí productos, fotos, stock, variantes. Carrito persistente,
                checkout en una pantalla. Mobile-first porque LATAM es mobile.
              </p>
            </div>
            <div className="feature-card">
              <div className="icon">🪝</div>
              <h3>Webhooks firmados</h3>
              <p>
                Confirmación de pago vuelve a tu tienda como evento firmado.
                Marcamos la orden, descontamos stock, notificamos al cliente.
              </p>
            </div>
            <div className="feature-card">
              <div className="icon">🌐</div>
              <h3>Tienda en /@npub</h3>
              <p>
                Tu storefront público vive en una URL atada a tu npub. Tu
                identidad en Nostr es la URL, el branding y la prueba de que
                sos vos.
              </p>
            </div>
            <div className="feature-card">
              <div className="icon">📊</div>
              <h3>Dashboard sin humo</h3>
              <p>
                Ventas hoy, pendientes de envío, top productos. Lo justo para
                operar sin morirte en analytics que no leés.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CODE SHOWCASE */}
      <section className="section" id="stack">
        <div className="container">
          <div className="split">
            <div>
              <span className="section-tag">Open source · soberano</span>
              <h2>Tu identidad firma. Wapu cobra. Punto.</h2>
              <p className="section-lead">
                El login es una firma de challenge con tu llave Nostr. El
                checkout es una llamada a la API de Wapu. Cero magia, cero
                custodia, cero registros internos.
              </p>
              <Link href="/login" className="btn btn-primary">
                Probar el flow →
              </Link>
            </div>
            <pre className="split-art">
              <code>
                {`// 1. Login: tu npub firma un challenge
const pk = await window.nostr.getPublicKey()
await window.nostr.signEvent({ kind: 22242, ... })

// 2. Checkout: Wapufy pide invoice a Wapu
//    GET /lnurlp/<seller>/callback?amount=<msats>
const r = await fetch("/api/checkout", {
  method: "POST",
  body: JSON.stringify({ amount_ars: 4500 })
})
const { invoice, verify_url } = await r.json()

// 3. Cliente paga → polling al verify URL
const { settled } = await fetch(verify_url).then(r => r.json())

// Sin webhooks. Sin custodia. Sin permiso.`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="section" id="comparison">
        <div className="container">
          <span className="section-tag">vs el resto del mundo</span>
          <h2>Shopify no es para vos. Wapufy sí.</h2>
          <p className="section-lead">
            Shopify es excelente si tenés tarjeta gringa, sociedad anónima y
            ganas de pagar USD 29 al mes. Wapufy es para el resto.
          </p>
          <div className="comparison">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Shopify</th>
                  <th>Tiendanube</th>
                  <th>Wapufy</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Cuota mensual</td>
                  <td>USD 29-299</td>
                  <td>ARS / mes</td>
                  <td className="us">$0</td>
                </tr>
                <tr>
                  <td>Comisión por venta</td>
                  <td>2.2 % + USD 0.30</td>
                  <td>~3 %</td>
                  <td className="us">Solo lo que cobra Wapu</td>
                </tr>
                <tr>
                  <td>Setup time</td>
                  <td>20+ min</td>
                  <td>15 min</td>
                  <td className="us">&lt; 5 min</td>
                </tr>
                <tr>
                  <td>Login</td>
                  <td>Email + password</td>
                  <td>Email + password</td>
                  <td className="us">Nostr (NIP-07)</td>
                </tr>
                <tr>
                  <td>Pagos P2P</td>
                  <td>No</td>
                  <td>No</td>
                  <td className="us">Nativo via Wapu</td>
                </tr>
                <tr>
                  <td>Custodia de fondos</td>
                  <td>Sí (3-7 días)</td>
                  <td>Sí</td>
                  <td className="us">No, directo a tu wallet</td>
                </tr>
                <tr>
                  <td>Vendor lock-in</td>
                  <td>Alto</td>
                  <td>Medio</td>
                  <td className="us">Cero · open source</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="cta-band">
            <span className="section-tag">Empezá ahora</span>
            <h2>
              Tu tienda en Wapufy en{" "}
              <span className="gradient-text">5 minutos</span>.
            </h2>
            <p className="section-lead">
              Sin tarjeta. Sin contrato. Sin permiso. Solo tu npub y ganas de
              vender.
            </p>
            <div
              className="hero-ctas"
              style={{ justifyContent: "center", marginBottom: 0 }}
            >
              <Link href="/login" className="btn btn-primary btn-large">
                Conectar Nostr y crear tienda →
              </Link>
              <Link href="/store/demo" className="btn btn-outline btn-large">
                Ver demo primero
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
