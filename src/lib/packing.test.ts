import { describe, expect, it } from "vitest";
import { groupByDestination, NO_TEACHER_GROUP, OFFICE_GROUP, pullList } from "./packing";
import type { OrderWithItems } from "./orders";

function order(id: number, pickupMethod: "office" | "student", teacher: string, items: [string, string | null, string | null, number][]): OrderWithItems {
  return {
    id, publicId: `p${id}`, status: "paid", email: "", customerName: `Fam ${id}`, phone: "", studentName: "", teacher, pickupMethod, notes: "",
    subtotalCents: 0, totalCents: 0, paymentProvider: "demo", providerOrderId: null, providerPaymentId: null,
    createdAt: new Date(), paidAt: null, packedAt: null, readyAt: null, pickedUpAt: null, cancelledAt: null, providerRefundId: null, refundedCents: 0, cancelReason: "",
    items: items.map(([productName, color, size, qty], i) => ({ id: id * 10 + i, orderId: id, variantId: null, productName, color, size, qty, unitPriceCents: 0 })),
  };
}

describe("packing", () => {
  it("totals quantities per variant across orders", () => {
    const list = pullList([
      order(1, "office", "", [["Tee", "Blue", "YS", 1], ["Pencils", null, null, 2]]),
      order(2, "student", "Ms. A", [["Tee", "Blue", "YS", 2], ["Tee", "Blue", "YM", 1]]),
    ]);
    expect(list).toEqual([
      { productName: "Pencils", color: null, size: null, qty: 2 },
      { productName: "Tee", color: "Blue", size: "YM", qty: 1 },
      { productName: "Tee", color: "Blue", size: "YS", qty: 3 },
    ]);
  });
  it("groups office first, teachers alphabetically, missing teacher last", () => {
    const groups = groupByDestination([
      order(1, "student", "Mr. Zed", []),
      order(2, "student", "", []),
      order(3, "office", "Ms. Ignored", []),
      order(4, "student", "Ms. Alpha", []),
      order(5, "student", "Mr. Zed ", []),
    ]);
    expect(groups.map((g) => [g.title, g.orders.map((o) => o.id)])).toEqual([
      [OFFICE_GROUP, [3]],
      ["Mr. Zed", [1, 5]],
      ["Ms. Alpha", [4]],
      [NO_TEACHER_GROUP, [2]],
    ]);
  });
});
