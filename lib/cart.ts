"use client";

export type CartItem = {
  id: string;
  name: string;
  subtitle?: string;
  img: string;
  price: number; // sats
  qty: number;
};

const KEY = "wapufy:cart";

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as CartItem[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wapufy:cart-changed"));
  }
}

export function addToCart(item: Omit<CartItem, "qty">, qty = 1): CartItem[] {
  const items = loadCart();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], qty: items[idx].qty + qty };
  } else {
    items.push({ ...item, qty });
  }
  saveCart(items);
  return items;
}

export function setQty(id: string, qty: number): CartItem[] {
  const items = loadCart()
    .map((i) => (i.id === id ? { ...i, qty: Math.max(0, qty) } : i))
    .filter((i) => i.qty > 0);
  saveCart(items);
  return items;
}

export function removeItem(id: string): CartItem[] {
  const items = loadCart().filter((i) => i.id !== id);
  saveCart(items);
  return items;
}

export function clearCart(): void {
  saveCart([]);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((acc, i) => acc + i.price * i.qty, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((acc, i) => acc + i.qty, 0);
}

export type ShippingInfo = {
  name: string;
  email?: string;
  address: string;
  city: string;
  postalCode?: string;
  phone?: string;
  notes?: string;
};

const SHIPPING_KEY = "wapufy:shipping";

export function loadShipping(): ShippingInfo {
  if (typeof window === "undefined")
    return { name: "", address: "", city: "" };
  try {
    const raw = window.localStorage.getItem(SHIPPING_KEY);
    if (!raw) return { name: "", address: "", city: "" };
    return JSON.parse(raw) as ShippingInfo;
  } catch {
    return { name: "", address: "", city: "" };
  }
}

export function saveShipping(info: ShippingInfo): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SHIPPING_KEY, JSON.stringify(info));
}
