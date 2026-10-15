import { dollars, sheetTime, toCsv } from "./csv";
import { listOrders, orderNumber, PICKUP_LABELS, type OrderWithItems } from "./orders";

const variantLabel = (it: { color: string | null; size: string | null }) => [it.color, it.size].filter(Boolean).join(" ");

/** One row per order. For reconciling against Square and the bank. */
export function ordersCsv(orders: OrderWithItems[]): string {
  const header = [
    "order", "status", "placed", "paid", "packed", "ready", "picked_up", "customer", "email", "phone", "student", "teacher",
    "delivery", "items", "subtotal", "total", "payment", "square_order_id", "square_payment_id", "notes",
  ];
  const rows = orders.map((o) => [
    orderNumber(o.id), o.status, sheetTime(o.createdAt), sheetTime(o.paidAt), sheetTime(o.packedAt), sheetTime(o.readyAt), sheetTime(o.pickedUpAt),
    o.customerName, o.email, o.phone, o.studentName, o.teacher, PICKUP_LABELS[o.pickupMethod],
    o.items.map((it) => `${it.qty} x ${it.productName} ${variantLabel(it)}`.trim()).join("; "),
    dollars(o.subtotalCents), dollars(o.totalCents), o.paymentProvider, o.providerOrderId, o.providerPaymentId, o.notes,
  ]);
  return toCsv([header, ...rows]);
}

/** One row per line item. For "how many youth smalls did we sell". */
export function itemsCsv(orders: OrderWithItems[]): string {
  const header = ["order", "status", "paid", "customer", "student", "teacher", "delivery", "product", "color", "size", "qty", "unit_price", "line_total"];
  const rows = orders.flatMap((o) =>
    o.items.map((it) => [
      orderNumber(o.id), o.status, sheetTime(o.paidAt), o.customerName, o.studentName, o.teacher, PICKUP_LABELS[o.pickupMethod],
      it.productName, it.color, it.size, it.qty, dollars(it.unitPriceCents), dollars(it.unitPriceCents * it.qty),
    ]),
  );
  return toCsv([header, ...rows]);
}

export async function exportResponse(kind: "orders" | "items"): Promise<Response> {
  const orders = (await listOrders()).sort((a, b) => a.id - b.id);
  const body = kind === "orders" ? ordersCsv(orders) : itemsCsv(orders);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="lv-pta-${kind}-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
