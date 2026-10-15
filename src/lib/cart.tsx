"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cartAdd, cartSetQty, type CartLine } from "./cart-logic";

export type { CartLine };

type CartApi = {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (variantId: number, qty: number) => void;
  remove: (variantId: number) => void;
  clear: () => void;
  hydrated: boolean;
};

const KEY = "lvpta-cart-v1";
const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, hydrated]);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => setLines((ls) => cartAdd(ls, line, qty)), []);
  const setQty = useCallback((variantId: number, qty: number) => setLines((ls) => cartSetQty(ls, variantId, qty)), []);
  const remove = useCallback((variantId: number) => setLines((ls) => cartSetQty(ls, variantId, 0)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartApi>(
    () => ({
      lines,
      count: lines.reduce((a, l) => a + l.qty, 0),
      subtotalCents: lines.reduce((a, l) => a + l.unitPriceCents * l.qty, 0),
      add,
      setQty,
      remove,
      clear,
      hydrated,
    }),
    [lines, add, setQty, remove, clear, hydrated],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
