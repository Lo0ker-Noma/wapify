import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="nav-logo" style={{ marginBottom: 14 }}>
              wapufy<span className="dot">.</span>
            </div>
            <p className="muted" style={{ fontSize: 14, maxWidth: 320 }}>
              eCommerce soberano para LATAM. Tu identidad en Nostr, tus pagos
              en Wapu, tu tienda en Wapufy.
            </p>
          </div>
          <div>
            <h4>Producto</h4>
            <Link href="/store/lacrypta">Tienda demo</Link>
            <Link href="/login">Login Nostr</Link>
            <a href="#features">Features</a>
            <a href="#comparison">vs Shopify</a>
          </div>
          <div>
            <h4>Stack</h4>
            <a href="https://nips.nostr.com/7" target="_blank" rel="noopener noreferrer">
              NIP-07
            </a>
            <a href="https://wapu.com.ar" target="_blank" rel="noopener noreferrer">
              Wapu
            </a>
            <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">
              Next.js
            </a>
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
              Supabase
            </a>
          </div>
          <div>
            <h4>La Cripta</h4>
            <a href="https://lacrypta.dev" target="_blank" rel="noopener noreferrer">
              lacrypta.dev
            </a>
            <a
              href="https://github.com/lacrypta/hackathons-2026"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hackathons 2026
            </a>
            <a
              href="https://github.com/Lo0ker-Noma/wapify"
              target="_blank"
              rel="noopener noreferrer"
            >
              Repo Wapufy
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            Hecho para <strong style={{ color: "var(--primary)" }}>La Cripta Commerce Hackaton 2026</strong>
          </span>
          <span>© 2026 Wapufy · MIT</span>
        </div>
      </div>
    </footer>
  );
}
