import { NextResponse } from "next/server";

/**
 * GET /api/btc-price
 * Returns live BTC/USD and BTC/ARS prices from CoinGecko (free tier).
 * Cached 60 s at the CDN edge.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,ars",
      { next: { revalidate: 60 } }
    );
    if (!r.ok) throw new Error(`CoinGecko HTTP ${r.status}`);
    const json = await r.json();
    const usd: number = json?.bitcoin?.usd ?? 0;
    const ars: number = json?.bitcoin?.ars ?? 0;
    return NextResponse.json(
      { usd, ars },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
