import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Wapufy — Tu tienda online con Nostr y pagos P2P",
  description:
    "Vendé sin permiso. La alternativa a Shopify para LATAM: login con tu npub (NIP-07), pagos P2P con Wapu, sin cuotas mensuales.",
  metadataBase: new URL("https://wapufy.vercel.app"),
  openGraph: {
    title: "Wapufy — Tu tienda online con Nostr",
    description:
      "Vendé sin permiso. Login con Nostr, pagos P2P con Wapu, sin cuotas.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
