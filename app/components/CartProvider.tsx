"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  CartItem,
  addToCart as add,
  loadCart,
  removeItem as remove,
  setQty as setQ,
  clearCart as clr,
  cartCount,
  cartTotal,
} from "@/lib/cart";

type Ctx = {
  items: CartItem[];
  count: number;
  totalSats: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadCart());
    function onChange() {
      setItems(loadCart());
    }
    window.addEventListener("wapufy:cart-changed", onChange);
    return () => window.removeEventListener("wapufy:cart-changed", onChange);
  }, []);

  const value: Ctx = {
    items,
    count: cartCount(items),
    totalSats: cartTotal(items),
    add: useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
      setItems(add(item, qty));
    }, []),
    setQty: useCallback((id: string, qty: number) => {
      setItems(setQ(id, qty));
    }, []),
    remove: useCallback((id: string) => {
      setItems(remove(id));
    }, []),
    clear: useCallback(() => {
      clr();
      setItems([]);
    }, []),
  };

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart(): Ctx {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
