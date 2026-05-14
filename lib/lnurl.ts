/**
 * Generic Lightning Address (LUD-16) resolver.
 * Supports any LNURL-pay endpoint, not just Wapu — e.g. Wallet of Satoshi.
 */

export type LnurlpMetadata = {
  callback: string;
  minSendable: number;
  maxSendable: number;
  metadata: string;
  tag: "payRequest";
  allowsNostr?: boolean;
  nostrPubkey?: string;
  status?: "OK" | "ERROR";
};

export type LnurlpInvoice = {
  pr: string;
  routes?: unknown[];
  status?: "OK" | "ERROR";
  successAction?: { tag: string; message?: string };
  verify?: string | null;
};

export function isLightningAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function parseLightningAddress(address: string): { user: string; domain: string } {
  const [user, domain] = address.split("@");
  if (!user || !domain) throw new Error(`invalid Lightning Address: ${address}`);
  return { user, domain };
}

export async function fetchLnurlpMetadata(address: string): Promise<LnurlpMetadata> {
  const { user, domain } = parseLightningAddress(address);
  const url = `https://${domain}/.well-known/lnurlp/${encodeURIComponent(user)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`LNURL-pay metadata failed (${res.status}) for ${address}`);
  const data = (await res.json()) as LnurlpMetadata;
  if (data.tag !== "payRequest") throw new Error("endpoint is not a LNURL payRequest");
  return data;
}

/**
 * Public relays we both publish zap requests TO and listen for receipts ON.
 * Keep in sync with the RELAYS list in CheckoutPanel.tsx so the receipt we
 * subscribe to is on the same relay set the wallet was told to publish to.
 */
export const ZAP_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
  "wss://relay.primal.net",
];

export async function fetchLnurlpInvoice(
  address: string,
  amountMsat: number,
  /** Optional NIP-57 signed zap request to attach as ?nostr=…  */
  zapRequest?: object | null
): Promise<LnurlpInvoice & { allowsNostr?: boolean }> {
  const meta = await fetchLnurlpMetadata(address);
  if (amountMsat < meta.minSendable) {
    throw new Error(
      `amount ${amountMsat} msat below LNURL min ${meta.minSendable} msat`
    );
  }
  if (amountMsat > meta.maxSendable) {
    throw new Error(
      `amount ${amountMsat} msat above LNURL max ${meta.maxSendable} msat`
    );
  }

  const params = new URLSearchParams({ amount: String(amountMsat) });
  // NIP-57: when the provider supports zaps, attach the signed zap request so
  // the wallet publishes a kind:9735 receipt when paid.
  if (zapRequest && meta.allowsNostr && meta.nostrPubkey) {
    params.set("nostr", JSON.stringify(zapRequest));
  }
  const sep = meta.callback.includes("?") ? "&" : "?";
  const url = `${meta.callback}${sep}${params.toString()}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`invoice generation failed (${res.status}) for ${address}`);
  const data = (await res.json()) as LnurlpInvoice;
  if (!data.pr) throw new Error("LNURL response missing 'pr' (bolt11)");
  if (data.status && data.status !== "OK") throw new Error("LNURL returned non-OK status");
  return { ...data, allowsNostr: meta.allowsNostr };
}
