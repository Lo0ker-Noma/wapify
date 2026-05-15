"use client";

export type OrderStatus = "pending" | "paid" | "failed";

export type Order = {
  id: string;
  productName: string;
  amountSats: number;
  invoice: string; // bolt11 (empty for Wapu inner_transfer)
  verifyUrl: string;
  lnAddress: string;
  status: OrderStatus;
  createdAt: number;
  paidAt?: number;
  /** Optional Nostr identity of the buyer — captured at checkout */
  buyerNpub?: string;
  buyerName?: string;
};

const KEY = "wapufy:orders";
const SEED_KEY = "wapufy:orders:seeded";

const SEED: Order[] = [
  {
    id: "seed-1",
    productName: "Yerba Mate HDMP",
    amountSats: 8,
    invoice: "lnbc8n1pjxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    verifyUrl: "",
    lnAddress: "savvyutensil489@walletofsatoshi.com",
    status: "paid",
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    paidAt: Date.now() - 1000 * 60 * 60 * 6 + 1000 * 60 * 2,
  },
  {
    id: "seed-2",
    productName: "Spray de Pimienta Antikukas",
    amountSats: 6,
    invoice: "lnbc6n1pjyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
    verifyUrl: "",
    lnAddress: "savvyutensil489@walletofsatoshi.com",
    status: "paid",
    createdAt: Date.now() - 1000 * 60 * 90,
    paidAt: Date.now() - 1000 * 60 * 88,
  },
  {
    id: "seed-3",
    productName: "Sticker Pack (10u)",
    amountSats: 3,
    invoice: "lnbc3n1pjzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
    verifyUrl: "",
    lnAddress: "savvyutensil489@walletofsatoshi.com",
    status: "pending",
    createdAt: Date.now() - 1000 * 60 * 4,
  },
];

export function loadOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    // Seed once for the demo so /pedidos has content
    if (!window.localStorage.getItem(SEED_KEY)) {
      window.localStorage.setItem(KEY, JSON.stringify(SEED));
      window.localStorage.setItem(SEED_KEY, "1");
    }
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Order[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveOrders(arr: Order[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(arr));
}

export function recordOrder(o: Omit<Order, "id" | "createdAt" | "status"> & { status?: OrderStatus }): Order {
  const order: Order = {
    id: `o-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    status: o.status ?? "pending",
    productName: o.productName,
    amountSats: o.amountSats,
    invoice: o.invoice,
    verifyUrl: o.verifyUrl,
    lnAddress: o.lnAddress,
    buyerNpub: o.buyerNpub,
    buyerName: o.buyerName,
  };
  const all = loadOrders();
  saveOrders([order, ...all]);
  return order;
}

export function markOrderPaid(id: string): void {
  const all = loadOrders().map((o) =>
    o.id === id ? { ...o, status: "paid" as const, paidAt: Date.now() } : o
  );
  saveOrders(all);
}

export function clearOrders(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(SEED_KEY);
}
