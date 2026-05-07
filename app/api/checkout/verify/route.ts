import { NextResponse } from "next/server";
import { verifyInvoice } from "@/lib/wapu";

/**
 * GET /api/checkout/verify?url=<verify_url>
 * Proxies the LNURL-verify call to avoid CORS issues from the browser.
 * Only allows verify URLs on Wapu hosts to avoid SSRF abuse.
 */
const ALLOWED_HOSTS = ["wapu.app", "getalby.com"];

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

    const allowed = ALLOWED_HOSTS.some(
      (h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`)
    );
    if (!allowed) {
      return NextResponse.json(
        { error: `host ${parsed.hostname} not allowed` },
        { status: 400 }
      );
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
