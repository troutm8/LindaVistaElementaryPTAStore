import { describe, expect, it } from "vitest";
import { itemsCsv, ordersCsv } from "./export";
import type { OrderWithItems } from "./orders";

const order: OrderWithItems = {
  id: 7, publicId: "abc", status: "paid", email: "p@example.com", customerName: "Smith, Jane", phone: "", studentName: "Sam", teacher: "Ms. A",
  pickupMethod: "student", notes: 'says "thanks"', subtotalCents: 2100, totalCents: 2100, paymentProvider: "square",
  providerOrderId: "sq_o", providerPaymentId: "sq_p", createdAt: new Date("2026-10-15T21:00:00Z"), paidAt: new Date("2026-10-15T21:05:00Z"),
  packedAt: null, readyAt: null, pickedUpAt: null,
  items: [
    { id: 1, orderId: 7, variantId: 1, productName: "Tee", color: "Blue", size: "YS", qty: 1, unitPriceCents: 1500 },
    { id: 2, orderId: 7, variantId: 2, productName: "Pencils", color: null, size: null, qty: 2, unitPriceCents: 300 },
  ],
};

describe("export", () => {
  it("writes one row per order with quoted fields", () => {
    const lines = ordersCsv([order]).trim().split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[0].startsWith("order,status,placed,paid,")).toBe(true);
    expect(lines[1]).toBe(
      'LV-0007,paid,2026-10-15 14:00,2026-10-15 14:05,,,,"Smith, Jane",p@example.com,,Sam,Ms. A,Send home with student,1 x Tee Blue YS; 2 x Pencils,21.00,21.00,square,sq_o,sq_p,"says ""thanks"""',
    );
  });
  it("writes one row per line item", () => {
    const lines = itemsCsv([order]).trim().split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[2]).toBe("LV-0007,paid,2026-10-15 14:05,\"Smith, Jane\",Sam,Ms. A,Send home with student,Pencils,,,2,3.00,6.00");
  });
});
