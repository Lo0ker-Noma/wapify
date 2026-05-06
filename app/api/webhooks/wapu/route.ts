import { NextResponse } from "next/server";

// Stub del webhook handler de Wapu.
// TODO: validar firma con WAPU_WEBHOOK_SECRET, buscar la orden, marcarla
// pagada en Supabase, descontar stock, disparar email al vendedor.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  console.log("[wapu-webhook] received:", body);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    status: "wapu webhook endpoint ready",
    next_step: "POST con payload firmado de Wapu",
  });
}
