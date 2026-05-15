import { NextResponse } from "next/server";
import { wapuLogin } from "@/lib/wapu";

/**
 * POST /api/wapu/login   body: { email, password }
 * Returns { access_token } from Wapu staging. The token is sent back to the
 * client and stored in sessionStorage — subsequent transfer/lookup calls
 * include it in the body and we forward as Bearer to Wapu.
 */
export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password required" },
        { status: 400 }
      );
    }
    const result = await wapuLogin(email, password);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "login error" },
      { status: 401 }
    );
  }
}
