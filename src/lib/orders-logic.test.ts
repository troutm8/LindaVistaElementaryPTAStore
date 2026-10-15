import { describe, expect, it } from "vitest";
import { mergeLines, orderNumber } from "./orders";

describe("orders", () => {
  it("formats order numbers", () => {
    expect(orderNumber(1)).toBe("LV-0001");
    expect(orderNumber(12345)).toBe("LV-12345");
  });
  it("merges duplicate variants and caps at 20", () => {
    expect(mergeLines([{ variantId: 1, qty: 15 }, { variantId: 2, qty: 1 }, { variantId: 1, qty: 15 }])).toEqual([
      { variantId: 1, qty: 20 },
      { variantId: 2, qty: 1 },
    ]);
  });
});
