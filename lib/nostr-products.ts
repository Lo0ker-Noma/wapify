"use client";

import type { Product } from "./products";
import { publishEvent, DEFAULT_RELAYS, type PublishResult } from "./nostr-pub";

/**
 * NIP-99 Classified Listings — products as Nostr events.
 *
 * Each product is published as a parameterized replaceable event
 * (kind:30402). The "d" tag is the stable product id, so re-publishing
 * the same product updates the event instead of duplicating it. Any
 * Nostr client that indexes kind:30402 (Plebeian Market, nostree.me,
 * generic marketplaces) can discover the store's catalogue without
 * Wapufy publishing anything centrally.
 *
 * Spec: https://github.com/nostr-protocol/nips/blob/master/99.md
 */

type Nip07 = {
  getPublicKey: () => Promise<string>;
  signEvent: (event: any) => Promise<any>;
};

export type PublishProductResult = {
  product: Product;
  eventId: string;
  results: PublishResult[];
};

/**
 * Build an unsigned kind:30402 event for a product.
 *
 * Pricing convention: NIP-99 expects ["price", "<amount>", "<currency>"].
 * We use "BTC" as the currency and amount = sats / 1e8 so the listing is
 * unambiguous across clients. Nothing prevents a client from also showing
 * the sats figure (we put it in the title).
 */
export function buildProductEvent(
  product: Product,
  storeSlug: string,
  storeName: string
): {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
} {
  const btcAmount = product.price / 1e8;
  const priceStr = btcAmount.toFixed(8).replace(/\.?0+$/, "") || "0";

  const tags: string[][] = [
    ["d", `${storeSlug}:${product.id}`],
    ["title", product.name],
    ["price", priceStr, "BTC"],
    ["published_at", String(Math.floor(Date.now() / 1000))],
    ["status", "active"],
    ["t", "wapufy"],
    ["t", storeSlug],
    ["client", "Wapufy"],
  ];

  if (product.subtitle?.trim()) {
    tags.push(["summary", product.subtitle.trim()]);
  }
  if (product.img && /^https?:\/\//.test(product.img) && !product.img.includes("placehold.co")) {
    tags.push(["image", product.img]);
  }
  if (product.tag?.trim()) {
    tags.push(["t", product.tag.trim().toLowerCase().replace(/\s+/g, "-")]);
  }

  // Human-readable content body. Many NIP-99 indexers render this as the
  // listing description.
  const bodyLines: string[] = [];
  bodyLines.push(`# ${product.name}`);
  if (product.subtitle?.trim()) bodyLines.push("", product.subtitle.trim());
  bodyLines.push("");
  bodyLines.push(`**Precio**: ⚡ ${product.price.toLocaleString("es-AR")} sats`);
  bodyLines.push("");
  bodyLines.push(`Tienda: **${storeName}**`);
  bodyLines.push(`Pagás vía Lightning (LNURL-pay) o transferencia interna Wapu.`);
  bodyLines.push("");
  bodyLines.push(`— Publicado vía Wapufy · https://wapify-seven.vercel.app/store/${storeSlug}`);

  return {
    kind: 30402,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: bodyLines.join("\n"),
  };
}

/**
 * Sign one product event via NIP-07 and publish to relays.
 */
export async function publishProductAsNip99(
  product: Product,
  storeSlug: string,
  storeName: string
): Promise<PublishProductResult> {
  if (typeof window === "undefined" || !window.nostr) {
    throw new Error("No hay extensión Nostr (NIP-07) en este navegador.");
  }
  const nostr = window.nostr as unknown as Nip07;

  const unsigned = buildProductEvent(product, storeSlug, storeName);
  const signed = await nostr.signEvent(unsigned);
  const results = await publishEvent(signed, DEFAULT_RELAYS);

  return {
    product,
    eventId: signed.id,
    results,
  };
}

/**
 * Publish a batch sequentially (one signEvent prompt per product — most
 * NIP-07 extensions batch the confirmation UX themselves, and this gives
 * the user a chance to cancel mid-batch).
 */
export async function publishAllProductsAsNip99(
  products: Product[],
  storeSlug: string,
  storeName: string,
  onProgress?: (
    done: number,
    total: number,
    last: PublishProductResult | null
  ) => void
): Promise<PublishProductResult[]> {
  const out: PublishProductResult[] = [];
  for (let i = 0; i < products.length; i++) {
    try {
      const r = await publishProductAsNip99(products[i], storeSlug, storeName);
      out.push(r);
      onProgress?.(i + 1, products.length, r);
    } catch (e: any) {
      // Surface a fake result for the failed product so the UI can show
      // which ones didn't publish.
      out.push({
        product: products[i],
        eventId: "",
        results: [{ relay: "(client)", ok: false, reason: e?.message ?? "sign failed" }],
      });
      onProgress?.(i + 1, products.length, out[out.length - 1]);
    }
  }
  return out;
}
