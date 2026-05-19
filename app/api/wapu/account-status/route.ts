import { NextResponse } from "next/server";

const WAPU_BASE = process.env.WAPU_API_BASE ?? "https://be-stage.wapu.app";

/**
 * POST /api/wapu/account-status  body: { email, password }
 * Server-side diagnostic that hits /users/login + /users/home and returns
 * a structured summary of whether the account is ready to PAY (as a buyer)
 * or to RECEIVE (as a seller). Used by /settings → "Verificar mi cuenta
 * Wapu" so the admin can stop guessing what's blocking their payments.
 */
export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      return NextResponse.json(
        { error: "email y contraseña requeridos" },
        { status: 400 }
      );
    }

    // 1) Login
    const loginRes = await fetch(`${WAPU_BASE}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
      cache: "no-store",
    });
    const loginJson = await loginRes.json().catch(() => ({}));
    if (!loginRes.ok || !loginJson.access_token) {
      return NextResponse.json(
        {
          step: "login",
          ok: false,
          error: loginJson.error ?? `Wapu respondió ${loginRes.status}`,
          status: loginRes.status,
          base: WAPU_BASE,
        },
        { status: loginRes.status }
      );
    }

    const token = loginJson.access_token as string;

    // 2) /users/home
    const homeRes = await fetch(`${WAPU_BASE}/users/home`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const home = await homeRes.json().catch(() => ({}));
    if (!homeRes.ok) {
      return NextResponse.json(
        {
          step: "home",
          ok: false,
          error: home.error ?? `Wapu respondió ${homeRes.status}`,
          status: homeRes.status,
        },
        { status: homeRes.status }
      );
    }

    // 3) /users/spending_limit  (best-effort, may not be required for all)
    let spendingLimit: any = null;
    try {
      const slRes = await fetch(`${WAPU_BASE}/users/spending_limit`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (slRes.ok) spendingLimit = await slRes.json();
    } catch { /* optional */ }

    // 4) Build a structured diagnostic
    const usdtBalance = Number(home.usdt_balance ?? 0);
    const combinedBalance = Number(home.combined_balance ?? 0);
    const combinedCurrency = String(home.combined_balance_currency ?? "ARS");
    const isPayer = Boolean(home.is_payer);
    const emailVerified = Boolean(home.email_verified);
    const state = String(home.state ?? "");
    const kycStatus = String(home.kyc_status ?? "");
    const kycTier = Number(home.kyc_tier ?? 0);
    const username = String(home.username ?? "");
    const lightningAddress = String(home.lightning_address ?? "");

    const checks = [
      {
        key: "email_verified",
        label: "Email verificado",
        pass: emailVerified,
        hint: emailVerified ? null : "Verificá tu email desde la app de Wapu",
      },
      {
        key: "state_active",
        label: "Cuenta activa",
        pass: state === "active" || state === "",
        hint: state && state !== "active" ? `Tu cuenta está en estado "${state}"` : null,
      },
      {
        key: "is_payer",
        label: "Habilitada como payer",
        pass: isPayer,
        hint: isPayer ? null : "Wapu no marcó tu cuenta como payer todavía",
      },
      {
        key: "usdt_balance",
        label: "Saldo USDT > 0 (necesario para PAGAR)",
        pass: usdtBalance > 0,
        hint:
          usdtBalance > 0
            ? null
            : "Tu cuenta tiene 0 USDT. Depositá USDT a tu Wapu antes de pagar.",
        value: `${usdtBalance.toFixed(2)} USDT`,
      },
    ];

    const canPay = checks.every((c) => c.pass);
    const canReceive = emailVerified && (state === "active" || state === "");

    return NextResponse.json({
      ok: true,
      base: WAPU_BASE,
      summary: {
        username,
        email,
        lightningAddress,
        usdtBalance,
        combinedBalance,
        combinedCurrency,
        emailVerified,
        state,
        kycStatus,
        kycTier,
        isPayer,
        spendingLimit,
      },
      checks,
      verdict: {
        canPay,
        canReceive,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "diagnostic error", base: WAPU_BASE },
      { status: 502 }
    );
  }
}
