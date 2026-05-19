"use client";

import { nip19 } from "nostr-tools";
import type { Order } from "./orders";
import { publishEvent, DEFAULT_RELAYS, type PublishResult } from "./nostr-pub";

// Most NIP-07 extensions (Alby, nos2x, Flamingo) expose a nip04 surface even
// though the global Window typing in AuthProvider doesn't include it. We
// cast to a wider type at the call site instead of re-declaring globally
// (which would conflict with AuthProvider's narrower declaration).
type Nip07WithNip04 = {
  getPublicKey: () => Promise<string>;
  signEvent: (event: any) => Promise<any>;
  nip04?: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string>;
    decrypt?: (pubkey: string, ciphertext: string) => Promise<string>;
  };
};

/**
 * Decode an npub (or accept a hex pubkey) into hex.
 */
export function npubToHex(input: string): string {
  const trimmed = input.trim();
  if (/^[0-9a-f]{64}$/i.test(trimmed)) return trimmed.toLowerCase();
  try {
    const dec = nip19.decode(trimmed);
    if (dec.type === "npub") return dec.data as string;
    if (dec.type === "nprofile") return (dec.data as any).pubkey as string;
  } catch {
    // fall through
  }
  throw new Error(`No es un npub válido: ${trimmed.slice(0, 24)}…`);
}

/**
 * Build the plain-text content for a receipt DM. Compact, human-readable,
 * includes a checksum-ish order id at the end.
 */
export function buildReceiptDmContent(order: Order, storeName = "LaCrypta"): string {
  const lines: string[] = [];
  lines.push(`✓ Recibo de compra · ${storeName}`);
  lines.push("");
  lines.push(`Producto: ${order.productName}`);
  lines.push(`Monto: ⚡ ${order.amountSats.toLocaleString("es-AR")} sats`);
  lines.push(
    `Método: ${order.paymentMethod === "wapu" ? "Wapu (USDT)" : "Lightning"}`
  );
  if (order.paymentMethod !== "wapu" && order.lnAddress) {
    lines.push(`Cobrado por: ${order.lnAddress}`);
  }
  if (order.paymentMethod === "wapu" && order.wapuReceiver) {
    lines.push(`Cobrado por: @${order.wapuReceiver}`);
  }
  if (order.paidAt) {
    lines.push(`Pagado: ${new Date(order.paidAt).toLocaleString("es-AR")}`);
  }
  if (order.buyerName?.trim()) {
    lines.push(`A nombre de: ${order.buyerName.trim()}`);
  }
  if (order.buyerNote?.trim()) {
    lines.push("");
    lines.push(`Nota tuya: ${order.buyerNote.trim()}`);
  }
  lines.push("");
  lines.push(`Order ID: ${order.id}`);
  lines.push("");
  lines.push("— Enviado vía Wapufy · Nostr DM (NIP-04)");
  return lines.join("\n");
}

/**
 * Encrypt + sign + publish a kind:4 DM from the admin (via window.nostr)
 * to the buyer's npub, with the receipt as the message body.
 *
 * Throws if no NIP-07 extension is available, the extension can't encrypt,
 * or the buyer's npub can't be decoded. The caller is responsible for
 * letting the user know about the publish result count.
 */
export async function sendReceiptDm(
  order: Order,
  storeName?: string
): Promise<{ event: any; results: PublishResult[]; recipientHex: string }> {
  if (typeof window === "undefined" || !window.nostr) {
    throw new Error(
      "No hay extensión Nostr (NIP-07) instalada en este navegador."
    );
  }
  const nostr = window.nostr as unknown as Nip07WithNip04;
  if (!nostr.nip04?.encrypt) {
    throw new Error(
      "Tu extensión Nostr no expone nip04.encrypt. Probá con Alby, nos2x o Flamingo."
    );
  }
  if (!order.buyerNpub?.trim()) {
    throw new Error("Esta orden no tiene un npub de comprador asociado.");
  }

  const recipientHex = npubToHex(order.buyerNpub.trim());
  const plain = buildReceiptDmContent(order, storeName);
  const ciphertext = await nostr.nip04.encrypt(recipientHex, plain);

  const sender = await nostr.getPublicKey();
  const unsigned = {
    kind: 4,
    pubkey: sender,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["p", recipientHex]],
    content: ciphertext,
  };

  const event = await nostr.signEvent(unsigned);
  const results = await publishEvent(event, DEFAULT_RELAYS);

  return { event, results, recipientHex };
}
