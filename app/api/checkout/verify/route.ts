import { NextResponse } from "next/server";
import { verifyInvoice } from "@/lib/wapu";

/**
 * GET /api/checkout/verify?url=<verify_url>
 * Proxies the LUD-21 verify call to avoid CORS issues from the browser.
 * Accepts any HTTPS URL — the verify_url always comes from our own
 * /api/checkout response (generated from the provider's LNURL callback),
 * so it's trusted. We only block non-HTTPS to prevent HTTP downgrade.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const verifyUrl = searchParams.get("url");
    if (!verifyUrl) {
      return NextResponse.json({ error: "missing url" }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(verifyUrl);
    } catch {
      return NextResponse.json({ error: "invalid url" }, { status: 400 });
    }

    // Only allow HTTPS to prevent downgrade attacks
    if (parsed.protocol !== "https:") {
      return NextResponse.json({ error: "only https verify URLs allowed" }, { status: 400 });
    }

    // Block loopback/private IPs to prevent SSRF
    const hostname = parsed.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.")
    ) {
      return NextResponse.json({ error: "private hosts not allowed" }, { status: 400 });
    }

    const result = await verifyInvoice(verifyUrl);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "verify error" },
      { status: 500 }
    );
  }
}
