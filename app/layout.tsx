import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wapufy — Shopify + Wapu, login con Nostr",
  description:
    "eCommerce minimalista para LATAM. Pagos P2P con Wapu, login con tu npub via NIP-07.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
