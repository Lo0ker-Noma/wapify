/**
 * WapuPay client — Lightning Address based checkout.
 *
 * Wapufy uses Wapu's LNURL-pay flow:
 * 1. Resolve seller's Lightning Address `<username>@wapu.app` → metadata
 * 2. Request invoice for an amount → bolt11 + verify URL
 * 3. Poll verify URL until paid
 *
 * No auth required for the LNURL-pay flow (it's public on the seller side).
 * Reference: https://wapu.shiafu.com/ (OpenAPI spec)
 */

const WAPU_BASE = process.env.WAPU_API_BASE ?? "https://be-stage.wapu.app";

export type LnurlpMetadata = {
  callback: string;
  maxSendable: number;
  minSendable: number;
  metadata: string;
  tag: "payRequest";
  allowsNostr?: boolean;
  nostrPubkey?: string;
  status?: "OK" | "ERROR";
};

export type LnurlpInvoice = {
  pr: string; // bolt11 invoice
  routes: unknown[];
  status: "OK" | "ERROR";
  successAction?: { tag: string; message?: string };
  verify: string; // URL to poll for payment status
};

export type WapuRates = {
  rates: Array<{ pair: string; buy: number; sell: number }>;
};

/**
 * Fetch LNURL-pay metadata for a Wapu username.
 * GET /.well-known/lnurlp/{username}
 */
export async function getLnurlpMetadata(username: string): Promise<LnurlpMetadata> {
  const res = await fetch(
    `${WAPU_BASE}/.well-known/lnurlp/${encodeURIComponent(username)}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error(`Wapu LNURL-pay metadata failed (${res.status})`);
  }
  return res.json();
}

/**
 * Request a Lightning invoice from a Wapu user's LNURL callback.
 * GET /lnurlp/{username}/callback?amount=<msats>
 */
export async function getLnurlpInvoice(
  username: string,
  amountMsat: number
): Promise<LnurlpInvoice> {
  const url = `${WAPU_BASE}/lnurlp/${encodeURIComponent(username)}/callback?amount=${amountMsat}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Wapu invoice generation failed (${res.status})`);
  }
  const data = (await res.json()) as LnurlpInvoice;
  if (data.status && data.status !== "OK") {
    throw new Error("Wapu returned non-OK invoice status");
  }
  return data;
}

/**
 * Verify payment status by calling the verify URL returned in the invoice.
 * The verify URL is part of LUD-21 spec. Returns { settled: boolean }.
 */
export async function verifyInvoice(
  verifyUrl: string
): Promise<{ settled: boolean; preimage?: string | null; pr?: string | null }> {
  const res = await fetch(verifyUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Verify failed (${res.status})`);
  }
  const data = await res.json();
  return {
    settled: Boolean(data.settled),
    preimage: data.preimage ?? null,
    pr: data.pr ?? null,
  };
}

/**
 * Get current exchange rates from Wapu (public, no auth).
 * GET /exchange_rates
 */
export async function getRates(): Promise<WapuRates> {
  const res = await fetch(`${WAPU_BASE}/exchange_rates`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Wapu rates failed (${res.status})`);
  return res.json();
}

/**
 * Convert ARS to satoshis using current Wapu rates.
 * ARS → USDT (sell rate, since the buyer pays USDT) → USD ≈ USDT
 * USD → BTC (sell rate) → SAT (×1e8)
 */
export async function arsToSats(amountArs: number): Promise<number> {
  const { rates } = await getRates();
  const usdtArs = rates.find((r) => r.pair === "USDT/ARS");
  const btcUsd = rates.find((r) => r.pair === "BTC/USD");
  if (!usdtArs || !btcUsd) {
    throw new Error("Missing required Wapu rate pairs (USDT/ARS, BTC/USD)");
  }
  const usdt = amountArs / usdtArs.sell;
  const btc = usdt / btcUsd.sell;
  return Math.round(btc * 1e8);
}

/**
 * Convert satoshis back to ARS using current Wapu rates.
 * Used by the buyer-side checkout preview ("X sats ≈ Y ARS").
 * Symmetric round-trip of arsToSats (same sell rates).
 */
export async function satsToArs(amountSats: number): Promise<number> {
  const { rates } = await getRates();
  const usdtArs = rates.find((r) => r.pair === "USDT/ARS");
  const btcUsd = rates.find((r) => r.pair === "BTC/USD");
  if (!usdtArs || !btcUsd) {
    throw new Error("Missing required Wapu rate pairs (USDT/ARS, BTC/USD)");
  }
  const btc = amountSats / 1e8;
  const usdt = btc * btcUsd.sell;
  return usdt * usdtArs.sell;
}

/**
 * Convert satoshis to USDT (≈USD) using current Wapu rates.
 * Used by the native Wapu inner-transfer flow which takes amounts in USDT.
 */
export async function satsToUsdt(amountSats: number): Promise<number> {
  const { rates } = await getRates();
  const btcUsd = rates.find((r) => r.pair === "BTC/USD");
  if (!btcUsd) throw new Error("Missing BTC/USD rate");
  const btc = amountSats / 1e8;
  return btc * btcUsd.sell;
}

// ─────────────────────────────────────────────────────────────────────────────
// Wapu native payment API (used by /api/wapu/* proxies)
// ─────────────────────────────────────────────────────────────────────────────

export type WapuLoginResponse = { access_token: string };
export type WapuTransaction = {
  transaction_id: string;
  status: "Pending" | "Completed" | "Taken" | "Canceled" | "UserPending" | "Rejected";
  type: string;
  payment_amount: number;
  payment_currency: string;
  currency_taken?: string;
  total_amount_taken?: number;
  receiver_name?: string | null;
  username?: string;
  created_at?: string;
  updated_at?: string;
};

export async function wapuLogin(email: string, password: string): Promise<WapuLoginResponse> {
  const res = await fetch(`${WAPU_BASE}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Wapu login failed (${res.status})`);
  }
  return res.json();
}

export async function wapuInnerTransfer(
  accessToken: string,
  amountUsdt: number,
  receiverUsername: string
): Promise<WapuTransaction> {
  // Wapu's inner_transfer is multipart/form-data
  const form = new FormData();
  form.append("amount", String(amountUsdt));
  form.append("currency", "USDT");
  form.append("receiver_username", receiverUsername);
  const res = await fetch(`${WAPU_BASE}/transactions/inner_transfer`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Wapu transfer failed (${res.status})`);
  }
  return res.json();
}

export async function wapuGetTransaction(
  accessToken: string,
  id: string
): Promise<WapuTransaction> {
  const res = await fetch(`${WAPU_BASE}/transactions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Wapu tx lookup failed (${res.status})`);
  }
  return res.json();
}

/**
 * Build the public Lightning Address for a Wapu user (used in QR / display).
 * Note: the actual @wapu.app domain is used by their LNURL infra, even if
 * the API host is be-stage.wapu.app or be-prod.wapu.app.
 */
export function lightningAddress(username: string): string {
  return `${username}@wapu.app`;
}
