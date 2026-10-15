export type CartLine = {
  variantId: number;
  productSlug: string;
  productName: string;
  size: string | null;
  color: string | null;
  unitPriceCents: number;
  image: string;
  qty: number;
};

export const MAX_QTY = 20;

export function cartAdd(lines: CartLine[], line: Omit<CartLine, "qty">, qty: number): CartLine[] {
  const i = lines.findIndex((l) => l.variantId === line.variantId);
  if (i === -1) return [...lines, { ...line, qty: Math.min(MAX_QTY, qty) }];
  const next = [...lines];
  next[i] = { ...next[i], qty: Math.min(MAX_QTY, next[i].qty + qty) };
  return next;
}

export function cartSetQty(lines: CartLine[], variantId: number, qty: number): CartLine[] {
  if (qty <= 0) return lines.filter((l) => l.variantId !== variantId);
  return lines.map((l) => (l.variantId === variantId ? { ...l, qty: Math.min(MAX_QTY, qty) } : l));
}
