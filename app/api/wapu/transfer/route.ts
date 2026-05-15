import { NextResponse } from "next/server";
import { satsToUsdt, wapuInnerTransfer } from "@/lib/wapu";

/**
 * POST /api/wapu/transfer
 * body: { accessToken, amountSats, receiverUsername }
 *
 * Converts sats → USDT via current Wapu rates and triggers
 * /transactions/inner_transfer on the buyer's account.
 */
export async function POST(req: Request) {
  try {
    const { accessToken, amountSats, receiverUsername } = (await req.json()) as {
      accessToken?: string;
      amountSats?: number;
      receiverUsername?: string;
    };
    if (!accessToken) {
      return NextResponse.json({ error: "missing accessToken" }, { status: 401 });
    }
    if (!Number.isFinite(amountSats) || (amountSats as number) <= 0) {
      return NextResponse.json({ error: "amountSats required" }, { status: 400 });
    }
    if (!receiverUsername) {
      return NextResponse.json({ error: "receiverUsername required" }, { status: 400 });
    }

    const amountUsdt = await satsToUsdt(amountSats as number);
    // Wapu min transfer is ~0.01 USDT — round up to keep above the floor
    const amountUsdtRounded = Math.max(0.01, Math.round(amountUsdt * 100) / 100);

    const tx = await wapuInnerTransfer(
      accessToken,
      amountUsdtRounded,
      receiverUsername
    );
    return NextResponse.json({ transaction: tx, amountUsdt: amountUsdtRounded });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "transfer error" },
      { status: 502 }
    );
  }
}
