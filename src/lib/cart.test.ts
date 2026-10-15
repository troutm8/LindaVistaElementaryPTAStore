import { describe, expect, it } from "vitest";
import { cartAdd, cartSetQty, type CartLine } from "./cart-logic";

const base = { productSlug: "x", productName: "X", size: null, color: null, unitPriceCents: 100, image: "" };

describe("cart logic", () => {
  it("adds a new line", () => {
    expect(cartAdd([], { ...base, variantId: 1 }, 2)).toEqual([{ ...base, variantId: 1, qty: 2 }]);
  });
  it("merges into an existing line and caps at 20", () => {
    const existing: CartLine[] = [{ ...base, variantId: 1, qty: 19 }];
    expect(cartAdd(existing, { ...base, variantId: 1 }, 5)[0].qty).toBe(20);
  });
  it("removes a line when qty drops to zero", () => {
    const existing: CartLine[] = [{ ...base, variantId: 1, qty: 1 }, { ...base, variantId: 2, qty: 3 }];
    expect(cartSetQty(existing, 1, 0).map((l) => l.variantId)).toEqual([2]);
  });
});
