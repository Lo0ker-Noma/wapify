import { NextResponse } from "next/server";
import { arsToSats, getLnurlpInvoice, lightningAddress } from "@/lib/wapu";

/**
 * POST /api/checkout
 * body: {
 *   amount_ars: number,
 *   seller_username?: string  // defaults to env WAPU_DEMO_SELLER
 *   product_id?: string,      // for logging / future order persistence
 * }
 * response: {
 *   invoice: string,            // bolt11 — encode this as a QR
 *   verify_url: string,         // poll this to detect payment
 *   amount_sat: number,
 *   amount_msat: number,
 *   ln_address: string,
 *   seller_username: string,
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const amountArs = Number(body.amount_ars);
    const sellerUsername =
      body.seller_username ||
      process.env.WAPU_DEMO_SELLER ||
      "lacrypta"; // safe public-looking fallback for the demo

    if (!Number.isFinite(amountArs) || amountArs <= 0) {
      return NextResponse.json(
        { error: "amount_ars must be a positive number" },
        { status: 400 }
      );
    }

    // Convert ARS → SAT using Wapu's current rates
    const amountSat = await arsToSats(amountArs);
    if (amountSat < 1) {
      return NextResponse.json(
        { error: "Amount too small to generate a Lightning invoice" },
        { status: 400 }
      );
    }
    const amountMsat = amountSat * 1000;

    // Ask Wapu's LNURL-pay endpoint for an invoice
    const invoice = await getLnurlpInvoice(sellerUsername, amountMsat);

    return NextResponse.json({
      invoice: invoice.pr,
      verify_url: invoice.verify,
      amount_sat: amountSat,
      amount_msat: amountMsat,
      ln_address: lightningAddress(sellerUsername),
      seller_username: sellerUsername,
    });
  } catch (e: any) {
    console.error("[checkout] error", e);
    return NextResponse.json(
      { error: e?.message ?? "checkout error" },
      { status: 500 }
    );
  }
}
