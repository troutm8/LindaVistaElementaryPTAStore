const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}

export function sumCents(items: { unitPriceCents: number; qty: number }[]): number {
  return items.reduce((acc, it) => acc + it.unitPriceCents * it.qty, 0);
}
