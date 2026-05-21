import { ImageResponse } from "next/og";
import { DEFAULT_META } from "@/lib/store-meta";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { npub: string };
}) {
  const slug = params.npub;
  const base = DEFAULT_META[slug] ?? { name: slug, bio: "Tienda en Wapufy." };
  let meta = base;

  // Try to pull server-persisted meta (best-effort; OG is cached anyway)
  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://wapify-seven.vercel.app";
    const res = await fetch(
      `${siteUrl}/api/store-data?slug=${encodeURIComponent(slug)}&kind=meta`,
      { next: { revalidate: 300 } }
    );
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.name) meta = { ...base, ...json.data };
    }
  } catch {
    // ignore – fall back to defaults
  }

  const title = meta.heroTitle ?? meta.name;
  const subtitle = (meta.heroSubtitle ?? meta.bio ?? "").slice(0, 120);
  const kicker = meta.heroKicker ?? "WAPUFY · TIENDA ONLINE";

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #080808 0%, #0f1a14 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Glow accent */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,255,157,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Kicker */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              background: "#00ff9d",
              width: 40,
              height: 4,
              borderRadius: 2,
            }}
          />
          <span
            style={{
              color: "#00ff9d",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            {kicker}
          </span>
        </div>

        {/* Main text */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div
            style={{
              fontSize: title.length > 20 ? 64 : 80,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.0,
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 26,
                color: "rgba(255,255,255,0.55)",
                maxWidth: 760,
                lineHeight: 1.45,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.10)",
            paddingTop: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#00ff9d",
                letterSpacing: -1,
              }}
            >
              wapufy.
            </span>
            <span
              style={{ color: "rgba(255,255,255,0.3)", fontSize: 17 }}
            >
              Pagos Lightning · Sin intermediarios
            </span>
          </div>
          <div
            style={{
              padding: "12px 28px",
              border: "1px solid rgba(0,255,157,0.45)",
              borderRadius: 100,
              color: "#00ff9d",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            ⚡ Ver tienda
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
