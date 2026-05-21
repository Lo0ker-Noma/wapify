import type { Metadata } from "next";
import { DEFAULT_META } from "@/lib/store-meta";
import StorePageClient from "./StorePageClient";

type Props = { params: { npub: string } };

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://wapify-seven.vercel.app";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.npub;
  const base = DEFAULT_META[slug] ?? { name: slug, bio: "Tienda en Wapufy." };
  let meta = base;

  // Best-effort server-side meta fetch so OG tags reflect current store data.
  try {
    const res = await fetch(
      `${SITE_URL}/api/store-data?slug=${encodeURIComponent(slug)}&kind=meta`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.name) meta = { ...base, ...json.data };
    }
  } catch {
    /* fall back to defaults */
  }

  const title = `${meta.heroTitle ?? meta.name} · Wapufy`;
  const description =
    meta.heroSubtitle ?? meta.bio ?? "Pagá con Lightning. Sin intermediarios.";
  const storeUrl = `${SITE_URL}/store/${slug}`;
  const ogImage = `${SITE_URL}/store/${slug}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: storeUrl,
      type: "website",
      siteName: "Wapufy",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function StorePage({ params }: Props) {
  return <StorePageClient slug={params.npub} />;
}
