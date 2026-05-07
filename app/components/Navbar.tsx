import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          wapufy<span className="dot">.</span>
        </Link>
        <div className="nav-links">
          <a href="/#build">Build</a>
          <a href="/#sell">Sell</a>
          <a href="/#market">Market</a>
          <a href="/#manage">Manage</a>
          <a href="/#pricing">Pricing</a>
          <Link href="/store/demo">Demo</Link>
          <Link href="/login" className="btn btn-primary btn-nav">
            Empezar gratis
          </Link>
        </div>
      </div>
    </nav>
  );
}
