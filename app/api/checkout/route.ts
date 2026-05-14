import { NextResponse } from "next/server";
import { generateSecretKey, finalizeEvent } from "nostr-tools/pure";
import { arsToSats, getLnurlpInvoice, lightningAddress } from "@/lib/wapu";
import {
  fetchLnurlpInvoice,
  fetchLnurlpMetadata,
  isLightningAddress,
  ZAP_RELAYS,
} from "@/lib/lnurl";

/**
 * POST /api/checkout
 * body: {
 *   amount_sats?: number,
 *   amount_ars?: number,            // alt: convert via Wapu rates
 *   seller?: string,                // Lightning Address OR Wapu username
 *   product_id?: string,
 * }
 *
 * If the seller's LNURL provider advertises allowsNostr (NIP-57), we attach
 * a signed zap request to the LNURL callback. The wallet will then publish
 * a kind:9735 zap receipt to our relays when paid, so the client can detect
 * the payment in real time without polling.
 */

/** Build & sign a kind:9734 zap request for the given invoice request. */
function buildZapRequest(opts: {
  amountMsat: number;
  recipientHex: string;
  comment: string;
  relays: string[];
}) {
  const sk = generateSecretKey();
  const event = finalizeEvent(
    {
      kind: 9734,
      created_at: Math.floor(Date.now() / 1000),
      content: opts.comment,
      tags: [
        ["relays", ...opts.relays],
        ["amount", String(opts.amountMsat)],
        ["p", opts.recipientHex],
      ],
    },
    sk
  );
  return event;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const amountSatsRaw = Number(body.amount_sats);
    const amountArs = Number(body.amount_ars);
    const productName = String(body.product_id ?? body.product_name ?? "");

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
    let nip57: boolean = false;

    if (isLightningAddress(sellerRaw)) {
      // Generic LNURL-pay flow (works with WoS, Alby, Strike, …).
      // Pre-flight the metadata to know if we can attach a zap request.
      let zapReq: object | null = null;
      try {
        const meta = await fetchLnurlpMetadata(sellerRaw);
        if (meta.allowsNostr && meta.nostrPubkey) {
          zapReq = buildZapRequest({
            amountMsat,
            recipientHex: meta.nostrPubkey,
            comment: productName ? `Wapufy: ${productName}` : "Wapufy purchase",
            relays: ZAP_RELAYS,
          });
          nip57 = true;
        }
      } catch (e) {
        console.warn("[checkout] LNURL metadata pre-flight failed", e);
      }

      const inv = await fetchLnurlpInvoice(sellerRaw, amountMsat, zapReq);
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
      nip57,
    });
  } catch (e: any) {
    console.error("[checkout] error", e);
    return NextResponse.json(
      { error: e?.message ?? "checkout error" },
      { status: 500 }
    );
  }
}
