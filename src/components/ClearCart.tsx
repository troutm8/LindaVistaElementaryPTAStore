"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/** Rendered on a confirmed order page so the cart empties once we know payment went through. */
export function ClearCart() {
  const { clear, hydrated } = useCart();
  useEffect(() => {
    if (hydrated) clear();
  }, [hydrated, clear]);
  return null;
}
