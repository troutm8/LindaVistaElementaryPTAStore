import { describe, expect, it } from "vitest";
import { formatCents, sumCents } from "./money";

describe("money", () => {
  it("formats cents as dollars", () => {
    expect(formatCents(1500)).toBe("$15.00");
    expect(formatCents(5)).toBe("$0.05");
  });
  it("sums line items", () => {
    expect(sumCents([{ unitPriceCents: 1500, qty: 2 }, { unitPriceCents: 300, qty: 1 }])).toBe(3300);
    expect(sumCents([])).toBe(0);
  });
});
