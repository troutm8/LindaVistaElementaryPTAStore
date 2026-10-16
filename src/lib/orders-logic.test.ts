import { describe, expect, it } from "vitest";
import { mergeLines, orderNumber, refundPlan } from "./orders";

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
  it("refunds through Square only when Square was paid, and restocks anything past pending", () => {
    const base = { status: "paid" as const, paymentProvider: "square" as const, providerPaymentId: "pay_1", totalCents: 1500, refundedCents: 0 };
    expect(refundPlan(base)).toEqual({ squareRefundCents: 1500, restock: true });
    expect(refundPlan({ ...base, status: "ready" })).toEqual({ squareRefundCents: 1500, restock: true });
    expect(refundPlan({ ...base, paymentProvider: "demo", providerPaymentId: null })).toEqual({ squareRefundCents: 0, restock: true });
    expect(refundPlan({ ...base, status: "pending" })).toEqual({ squareRefundCents: 0, restock: false });
    expect(refundPlan({ ...base, refundedCents: 1500 })).toEqual({ squareRefundCents: 0, restock: true });
    expect(refundPlan({ ...base, providerPaymentId: null })).toEqual({ squareRefundCents: 0, restock: true });
  });
});
