import { NextResponse } from "next/server";

const WAPU_BASE = process.env.WAPU_API_BASE ?? "https://be-stage.wapu.app";

/**
 * POST /api/wapu/magic-link   body: { email }
 * Triggers Wapu to send a passwordless login email. The buyer pastes
 * the temp_password from that email back into /api/wapu/login.
 */
export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email) {
      return NextResponse.json({ error: "email requerido" }, { status: 400 });
    }
    const upstream = await fetch(`${WAPU_BASE}/users/send-login-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
      cache: "no-store",
    });
    const body = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        { error: body.error ?? `Wapu respondió ${upstream.status}`, base: WAPU_BASE },
        { status: upstream.status }
      );
    }
    return NextResponse.json({ ok: true, ...body });
  } catch (e: any) {
    return NextResponse.json(
      { error: `No se pudo enviar el email (${e?.message ?? "network error"})`, base: WAPU_BASE },
      { status: 502 }
    );
  }
}
