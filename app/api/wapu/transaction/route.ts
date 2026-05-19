import { NextResponse } from "next/server";
import { wapuGetTransaction } from "@/lib/wapu";

/**
 * GET /api/wapu/transaction?id=<uuid>&token=<jwt>
 * Polled by the client to detect when a transfer completes.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const token = searchParams.get("token");
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
    if (!token) return NextResponse.json({ error: "missing token" }, { status: 401 });
    const tx = await wapuGetTransaction(token, id);
    return NextResponse.json(tx, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    const msg = e?.message ?? "tx lookup error";
    const isAuth = /jwt|token|signature|expir|unauthor/i.test(msg);
    return NextResponse.json(
      { error: msg },
      { status: isAuth ? 401 : 502 }
    );
  }
}
