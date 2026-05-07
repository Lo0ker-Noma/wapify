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
              Cualquiera, en cualquier lugar,
              <br />
              <span className="highlight">puede vender</span> en LATAM.
            </h1>
            <p className="lead">
              Wapufy es la plataforma de eCommerce para construir, vender y
              hacer crecer tu negocio sin permiso. Identidad{" "}
              <strong>Nostr</strong>, pagos <strong>Lightning</strong> con Wapu,
              cero cuotas mensuales.
            </p>

            <form
              className="email-signup"
              action="/login"
              method="get"
              style={{ marginTop: 8 }}
            >
              <input
                type="email"
                name="email"
                placeholder="tucorreo@ejemplo.com"
                aria-label="Email"
              />
              <button type="submit" className="btn btn-primary">
                Empezar gratis
              </button>
            </form>
            <p className="email-signup-note">
              Sin tarjeta · Sin contrato · Login con Nostr en 30 segundos
            </p>

            <div className="hero-stats" style={{ marginTop: 56 }}>
              <div className="stat">
                <div className="num accent">$0</div>
                <div className="label">Cuota mensual</div>
              </div>
              <div className="stat">
                <div className="num">&lt; 5 min</div>
                <div className="label">Setup completo</div>
              </div>
              <div className="stat">
                <div className="num accent">P2P</div>
                <div className="label">Pagos directos via Wapu</div>
              </div>
              <div className="stat">
                <div className="num">npub</div>
                <div className="label">Tu identidad, tu llave</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS BAR */}
      <section className="logos-bar">
        <div className="container">
          <p className="logos-label">Construido sobre los pilares abiertos de internet</p>
          <div className="logos-row">
            <span className="logo-item"><span className="glyph">⚡</span> Lightning</span>
            <span className="logo-item"><span className="glyph">🔐</span> Nostr</span>
            <span className="logo-item"><span className="glyph">₿</span> Bitcoin</span>
            <span className="logo-item"><span className="glyph">🅦</span> Wapu</span>
            <span className="logo-item"><span className="glyph">▲</span> Vercel</span>
            <span className="logo-item"><span className="glyph">◈</span> La Cripta</span>
          </div>
        </div>
      </section>

      {/* CATEGORY: BUILD */}
      <section className="container" id="build">
        <div className="service-category">
          <div>
            <div className="service-eyebrow">Build</div>
            <h2>Tu tienda online, lista en minutos.</h2>
            <p className="lead">
              Subí productos, configurá tu marca y publicá en una URL pública
              atada a tu npub. Sin themes, sin plugins, sin tocar código.
            </p>
            <ul className="service-bullets">
              <li>Catálogo con fotos, stock, variantes y precios en ARS</li>
              <li>Tu storefront en <code>/@npub</code>, indexable y compartible</li>
              <li>Brand kit: logo, colores, hero, redes sociales</li>
              <li>Mobile-first — porque LATAM compra desde el celular</li>
            </ul>
            <Link href="/store/demo" className="btn btn-primary">
              Ver storefront demo →
            </Link>
          </div>
          <div className="service-visual">
            <div className="mock-window">
              <div className="bar"><span /><span /><span /></div>
              <div className="body">
                <div className="title">@lookerlabs · Yerbas y mates</div>
                <div className="row-line"><span>Yerba mate orgánica</span><span className="accent">$4.500</span></div>
                <div className="row-line"><span>Mate de calabaza</span><span className="accent">$12.000</span></div>
                <div className="row-line"><span>Bombilla alpaca</span><span className="accent">$8.500</span></div>
                <div className="row-line"><span>Set degustación</span><span className="accent">$25.000</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* CATEGORY: SELL */}
        <div className="service-category reverse" id="sell">
          <div>
            <div className="service-eyebrow">Sell</div>
            <h2>Cobrás Lightning. Sin tarjeta. Sin chargeback.</h2>
            <p className="lead">
              Cada producto tiene un botón <strong>"Comprar con Wapu ⚡"</strong>{" "}
              que genera un invoice Lightning en tiempo real, firmado por la
              Lightning Address del vendedor.
            </p>
            <ul className="service-bullets">
              <li>Checkout en una pantalla con QR + deep link a wallets</li>
              <li>Conversión ARS → SAT automática con rates en vivo de Wapu</li>
              <li>Confirmación on-chain por polling al verify URL (LUD-21)</li>
              <li>Sin custodia: los sats van directo a tu wallet Wapu</li>
            </ul>
            <Link href="/checkout?amount=4500&product=Yerba+demo" className="btn btn-primary">
              Probar el checkout →
            </Link>
          </div>
          <div className="service-visual">
            <div className="mock-window">
              <div className="bar"><span /><span /><span /></div>
              <div className="body">
                <div className="title accent" style={{ color: "var(--primary)" }}>⚡ 4.500 sats</div>
                <div style={{ marginTop: 12, color: "var(--muted)" }}>lookerlabs@wapu.app</div>
                <div style={{
                  marginTop: 16,
                  padding: 12,
                  background: "rgba(0,255,157,0.05)",
                  border: "1px solid rgba(0,255,157,0.2)",
                  borderRadius: 8,
                  fontSize: 11,
                  wordBreak: "break-all"
                }}>
                  lnbc45u1p5xy...0re5r8fs8tnsay4zg7
                </div>
                <div style={{ marginTop: 12, color: "var(--primary)", fontSize: 11 }}>● Esperando pago…</div>
              </div>
            </div>
          </div>
        </div>

        {/* CATEGORY: MARKET */}
        <div className="service-category" id="market">
          <div>
            <div className="service-eyebrow">Market</div>
            <h2>Tu identidad Nostr es tu canal de marketing.</h2>
            <p className="lead">
              Tu kind:0 es tu perfil. Tus zaps son tu engagement. Posteás un
              producto en Nostr y cualquier cliente te zapea, comenta o
              comparte sin pasar por un algoritmo.
            </p>
            <ul className="service-bullets">
              <li>Auto-publicación de productos como kind:30402 (NIP-99)</li>
              <li>Zaps directos al producto via Lightning Address</li>
              <li>Reviews verificadas por firma del comprador</li>
              <li>Sin Meta Ads, sin Google Ads — soberanía marketing</li>
            </ul>
            <a
              href="https://nips.nostr.com/99"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              Leer NIP-99 →
            </a>
          </div>
          <div className="service-visual">
            <div className="mock-window">
              <div className="bar"><span /><span /><span /></div>
              <div className="body">
                <div className="title">npub1abc…xyz · 3.2K seguidores</div>
                <div style={{ color: "var(--text-secondary)", marginTop: 8 }}>
                  💬 "Nuevo lote de yerba orgánica recién llegado de Misiones — 4.500 ARS, envío a todo el país."
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 16, color: "var(--muted)", fontSize: 11 }}>
                  <span>⚡ 142 zaps</span>
                  <span>💬 23 replies</span>
                  <span>🔁 18 reposts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CATEGORY: MANAGE */}
        <div className="service-category reverse" id="manage">
          <div>
            <div className="service-eyebrow">Manage</div>
            <h2>Un dashboard. Sin humo. Sin métricas que no leés.</h2>
            <p className="lead">
              Ventas hoy. Órdenes pendientes. Top productos. Stock bajo. Lo
              justo para operar con cabeza fresca, sin ahogarte en analytics.
            </p>
            <ul className="service-bullets">
              <li>Vista en tiempo real de pagos confirmados</li>
              <li>Cola de envíos con un click "marcar enviado"</li>
              <li>Reports CSV exportables para tu contador</li>
              <li>Alertas por Telegram/Nostr cuando entra una venta</li>
            </ul>
            <Link href="/login" className="btn btn-primary">
              Crear mi tienda →
            </Link>
          </div>
          <div className="service-visual">
            <div className="mock-window">
              <div className="bar"><span /><span /><span /></div>
              <div className="body">
                <div className="title">Hoy</div>
                <div className="row-line"><span>Ventas</span><span className="accent">$87.300</span></div>
                <div className="row-line"><span>Órdenes</span><span className="accent">12</span></div>
                <div className="row-line"><span>Pendientes envío</span><span style={{ color: "var(--bitcoin)" }}>3</span></div>
                <div className="row-line"><span>Stock bajo</span><span style={{ color: "var(--lightning)" }}>2 SKUs</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section">
        <div className="container">
          <span className="section-tag">Vendedores reales · LATAM</span>
          <h2>Hechas para gente que vende, no para PMs gringos.</h2>
          <p className="section-lead">
            Nuestro target son vendedores argentinos, brasileros, mexicanos,
            colombianos. Gente que cobra en pesos y que está harta de pagar
            29 USD/mes para que un dashboard les hable en inglés.
          </p>
          <div className="testimonials">
            <div className="testimonial-card">
              <p className="testimonial-quote">
                "Vendo yerba desde mi casa en Misiones. Cobré mi primer Lightning a las 2 horas de abrir Wapufy. Setup en serio en 5 minutos."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">M</div>
                <div>
                  <div className="testimonial-name">Mariana — Yerbas del Sur</div>
                  <div className="testimonial-role">Misiones, Argentina</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-quote">
                "Pasé de Tiendanube + MercadoPago a Wapufy + Wapu. Cero retenciones, cero días de hold. La plata entra y la veo."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">D</div>
                <div>
                  <div className="testimonial-name">Diego — Bombillas Patagonia</div>
                  <div className="testimonial-role">Bariloche, Argentina</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-quote">
                "Mi npub es mi marca. Subo un producto y mis followers de Nostr lo zapean. Ningún algoritmo me lo entierra."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">L</div>
                <div>
                  <div className="testimonial-name">Lucía — Tejidos Andinos</div>
                  <div className="testimonial-role">Córdoba, Argentina</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing">
        <div className="container">
          <div className="pricing-band">
            <div>
              <span className="section-tag">Pricing</span>
              <h2>Tan barato que duele.</h2>
              <p className="section-lead">
                Wapufy es <strong>$0/mes</strong>. Sin trial, sin truco, sin
                upgrade. Solo pagás la fee del invoice de Lightning (lo que
                cobre tu wallet o Wapu — típicamente menos de 1%).
              </p>
              <Link href="/login" className="btn btn-primary btn-large">
                Empezar gratis →
              </Link>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="pricing-amount">$0</div>
              <div className="pricing-amount-sub">/mes · para siempre</div>
              <div style={{ marginTop: 24, fontSize: 13, color: "var(--text-secondary)", maxWidth: 320, marginLeft: "auto" }}>
                Comparado con Shopify Basic: <strong style={{ color: "var(--text)" }}>USD 29/mes + 2.2% por venta</strong>. Wapufy te ahorra USD 348/año fijo, antes de las comisiones.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESOURCES */}
      <section className="section">
        <div className="container">
          <span className="section-tag">Recursos · open source</span>
          <h2>Aprendé construyendo. Forkeá, modificá, apropiate.</h2>
          <p className="section-lead">
            Wapufy es MIT. Todo lo que ves está en GitHub: el frontend, los
            endpoints de checkout, el adapter Wapu. Sumate, abrí issues,
            mandá PRs.
          </p>
          <div className="resources">
            <a
              href="https://github.com/Lo0ker-Noma/wapify"
              target="_blank"
              rel="noopener noreferrer"
              className="resource-card"
            >
              <div className="resource-tag">GitHub</div>
              <h3>Código fuente</h3>
              <p>
                Next.js 14, App Router, integración LNURL-pay, login NIP-07.
                Forkeá y deployá tu propio Wapufy en 90 segundos.
              </p>
              <span className="resource-link">Ver repo →</span>
            </a>
            <a
              href="https://wapu.shiafu.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="resource-card"
            >
              <div className="resource-tag">Wapu API</div>
              <h3>OpenAPI spec</h3>
              <p>
                Documentación completa de WapuPay: auth, transacciones, LNURL,
                Lightning Address. Es lo que Wapufy consume para cobrar.
              </p>
              <span className="resource-link">Leer docs →</span>
            </a>
            <a
              href="https://nips.nostr.com/7"
              target="_blank"
              rel="noopener noreferrer"
              className="resource-card"
            >
              <div className="resource-tag">Nostr</div>
              <h3>NIP-07: window.nostr</h3>
              <p>
                El estándar que Wapufy usa para el login. Tu extensión firma un
                challenge y listo — sin emails, sin passwords.
              </p>
              <span className="resource-link">Leer NIP →</span>
            </a>
            <a
              href="https://lacrypta.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="resource-card"
            >
              <div className="resource-tag">La Cripta</div>
              <h3>Hackaton 2026</h3>
              <p>
                Wapufy nace en el Commerce Hackaton de La Cripta. Mirá los
                otros proyectos, sumate a la comunidad, ganate sats.
              </p>
              <span className="resource-link">Visitar lacrypta.dev →</span>
            </a>
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
                <tr><td>Cuota mensual</td><td>USD 29-299</td><td>ARS / mes</td><td className="us">$0</td></tr>
                <tr><td>Comisión por venta</td><td>2.2% + USD 0.30</td><td>~3%</td><td className="us">Solo fee Lightning</td></tr>
                <tr><td>Setup time</td><td>20+ min</td><td>15 min</td><td className="us">&lt; 5 min</td></tr>
                <tr><td>Login</td><td>Email + password</td><td>Email + password</td><td className="us">Nostr (NIP-07)</td></tr>
                <tr><td>Pagos P2P</td><td>No</td><td>No</td><td className="us">Nativo via Wapu</td></tr>
                <tr><td>Custodia de fondos</td><td>Sí (3-7 días)</td><td>Sí</td><td className="us">No, directo a tu wallet</td></tr>
                <tr><td>Vendor lock-in</td><td>Alto</td><td>Medio</td><td className="us">Cero · open source</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
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
