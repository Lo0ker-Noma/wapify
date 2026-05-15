import { NextResponse } from "next/server";

const WAPU_BASE = process.env.WAPU_API_BASE ?? "https://be-stage.wapu.app";

/**
 * POST /api/wapu/login   body: { email, password }
 * Proxies to Wapu /users/login. Surfaces the exact upstream status code
 * and error message so the buyer can tell when the issue is "user not on
 * staging" vs "wrong password" vs "network".
 */
export async function POST(req: Request) {
  try {
    const { email, password, temp_password } = (await req.json()) as {
      email?: string;
      password?: string;
      temp_password?: string;
    };
    if (!email || (!password && !temp_password)) {
      return NextResponse.json(
        { error: "email y password (o temp_password) requeridos", base: WAPU_BASE },
        { status: 400 }
      );
    }

    const payload: Record<string, string> = { email: email.trim() };
    if (temp_password) payload.temp_password = temp_password.trim();
    else if (password) payload.password = password;

    const upstream = await fetch(`${WAPU_BASE}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const body = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: body.error ?? `Wapu respondió ${upstream.status}`,
          status: upstream.status,
          base: WAPU_BASE,
        },
        { status: upstream.status }
      );
    }
    return NextResponse.json(body);
  } catch (e: any) {
    return NextResponse.json(
      {
        error: `No se pudo conectar a Wapu (${e?.message ?? "network error"})`,
        base: WAPU_BASE,
      },
      { status: 502 }
    );
  }
}
