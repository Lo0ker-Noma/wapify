import { NextResponse } from "next/server";
import { satsToArs, getRates } from "@/lib/wapu";

/**
 * GET /api/rates?sats=N → returns the ARS equivalent of N sats via Wapu rates.
 * GET /api/rates       → returns the raw rate table.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const satsParam = searchParams.get("sats");
    if (satsParam !== null) {
      const sats = Number(satsParam);
      if (!Number.isFinite(sats) || sats < 0) {
        return NextResponse.json({ error: "invalid sats" }, { status: 400 });
      }
      const ars = await satsToArs(sats);
      return NextResponse.json(
        { sats, ars },
        { headers: { "Cache-Control": "public, max-age=30" } }
      );
    }
    const rates = await getRates();
    return NextResponse.json(rates, {
      headers: { "Cache-Control": "public, max-age=30" },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "rates error" },
      { status: 502 }
    );
  }
}
