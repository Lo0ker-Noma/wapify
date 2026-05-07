import { NextResponse } from "next/server";
import { arsToSats, getLnurlpInvoice, lightningAddress } from "@/lib/wapu";
import { fetchLnurlpInvoice, isLightningAddress } from "@/lib/lnurl";

/**
 * POST /api/checkout
 * body: {
 *   amount_sats?: number,
 *   amount_ars?: number,            // alt: convert via Wapu rates
 *   seller?: string,                // Lightning Address OR Wapu username
 *   product_id?: string,
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const amountSatsRaw = Number(body.amount_sats);
    const amountArs = Number(body.amount_ars);

    // Accept either a full Lightning Address (e.g. user@walletofsatoshi.com)
    // or a Wapu username (legacy).
    const sellerRaw: string =
      body.seller ||
      body.seller_username ||
      process.env.DEFAULT_LIGHTNING_ADDRESS ||
      "savvyutensil489@walletofsatoshi.com";

    let amountSat: number;
    if (Number.isFinite(amountSatsRaw) && amountSatsRaw > 0) {
      amountSat = Math.floor(amountSatsRaw);
    } else if (Number.isFinite(amountArs) && amountArs > 0) {
      amountSat = await arsToSats(amountArs);
    } else {
      return NextResponse.json(
        { error: "amount_sats or amount_ars must be a positive number" },
        { status: 400 }
      );
    }

    if (amountSat < 1) {
      return NextResponse.json(
        { error: "Amount too small to generate a Lightning invoice" },
        { status: 400 }
      );
    }
    const amountMsat = amountSat * 1000;

    let pr: string;
    let verify: string | null = null;
    let lnAddress: string;

    if (isLightningAddress(sellerRaw)) {
      // Generic LNURL-pay flow (works with WoS, Alby, Strike, …)
      const inv = await fetchLnurlpInvoice(sellerRaw, amountMsat);
      pr = inv.pr;
      verify = inv.verify ?? null;
      lnAddress = sellerRaw;
    } else {
      // Treat as a Wapu username
      const inv = await getLnurlpInvoice(sellerRaw, amountMsat);
      pr = inv.pr;
      verify = inv.verify ?? null;
      lnAddress = lightningAddress(sellerRaw);
    }

    return NextResponse.json({
      invoice: pr,
      verify_url: verify ?? "",
      amount_sat: amountSat,
      amount_msat: amountMsat,
      ln_address: lnAddress,
      seller_username: sellerRaw,
    });
  } catch (e: any) {
    console.error("[checkout] error", e);
    return NextResponse.json(
      { error: e?.message ?? "checkout error" },
      { status: 500 }
    );
  }
}
