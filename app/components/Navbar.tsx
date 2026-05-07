import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          wapufy<span className="dot">.</span>
        </Link>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#stack">Stack</a>
          <a href="#comparison">vs Shopify</a>
          <Link href="/store/demo">Demo</Link>
          <Link href="/login" className="btn btn-primary btn-nav">
            Login con Nostr
          </Link>
        </div>
      </div>
    </nav>
  );
}
