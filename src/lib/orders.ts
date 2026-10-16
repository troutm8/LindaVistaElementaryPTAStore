import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  orderItems,
  orders,
  variants,
  products,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentProvider,
  type PickupMethod,
} from "@/db/schema";
import { sendCancelledEmail, sendNewOrderNotification, sendOrderReadyEmail, sendReceiptEmail } from "./email";

export type OrderWithItems = Order & { items: OrderItem[] };

/** Human-readable order number shown to customers and on bag labels. */
export function orderNumber(id: number): string {
  return `LV-${String(id).padStart(4, "0")}`;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid, not packed",
  packed: "Packed",
  ready: "Ready for pickup",
  picked_up: "Picked up",
  cancelled: "Cancelled",
};

export const PICKUP_LABELS: Record<PickupMethod, string> = {
  office: "Pick up at the front office",
  student: "Send home with student",
};

/** Which status a volunteer may move an order to next. Cancelling is separate: see `cancelOrder`. */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  paid: ["packed"],
  packed: ["ready", "paid"],
  ready: ["picked_up", "packed"],
  picked_up: ["ready"],
};

/** Statuses a volunteer may cancel from. Picked-up orders are done; pending ones never became real. */
export const CANCELLABLE: OrderStatus[] = ["paid", "packed", "ready"];

/**
 * What cancelling an order means for money and stock. Pure, so it is testable:
 * refund through Square only when Square took a payment; put stock back only if
 * `markPaid` took it out (anything past pending).
 */
export function refundPlan(order: Pick<Order, "status" | "paymentProvider" | "providerPaymentId" | "totalCents" | "refundedCents">): {
  squareRefundCents: number;
  restock: boolean;
} {
  const tookStock = order.status !== "pending" && order.status !== "cancelled";
  const owed = order.totalCents - order.refundedCents;
  const viaSquare = order.paymentProvider === "square" && !!order.providerPaymentId && tookStock && owed > 0;
  return { squareRefundCents: viaSquare ? owed : 0, restock: tookStock };
}

function randomPublicId(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return s;
}

export type NewOrderInput = {
  email: string;
  customerName: string;
  phone: string;
  studentName: string;
  teacher: string;
  pickupMethod: PickupMethod;
  notes: string;
  lines: { variantId: number; qty: number }[];
};

export type PricedLine = {
  variantId: number;
  productName: string;
  size: string | null;
  color: string | null;
  qty: number;
  unitPriceCents: number;
};

/** Collapse repeated variant ids so the stock check sees the true total. */
export function mergeLines(lines: { variantId: number; qty: number }[]): { variantId: number; qty: number }[] {
  const out = new Map<number, number>();
  for (const l of lines) out.set(l.variantId, (out.get(l.variantId) ?? 0) + l.qty);
  return [...out].map(([variantId, qty]) => ({ variantId, qty: Math.max(1, Math.min(20, Math.floor(qty))) }));
}

/** Look up current prices from the database; never trust prices from the browser. */
export async function priceLines(rawLines: { variantId: number; qty: number }[]): Promise<PricedLine[]> {
  const lines = mergeLines(rawLines);
  const ids = lines.map((l) => l.variantId);
  if (ids.length === 0) return [];
  const d = await db();
  const rows = await d
    .select({
      variantId: variants.id,
      size: variants.size,
      color: variants.color,
      stock: variants.stock,
      variantActive: variants.active,
      productName: products.name,
      priceCents: products.priceCents,
      productActive: products.active,
    })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(inArray(variants.id, ids));
  const byId = new Map(rows.map((r) => [r.variantId, r]));
  const out: PricedLine[] = [];
  for (const l of lines) {
    const r = byId.get(l.variantId);
    if (!r || !r.variantActive || !r.productActive) throw new Error(`Item no longer available (variant ${l.variantId})`);
    const qty = Math.max(1, Math.min(20, Math.floor(l.qty)));
    if (r.stock < qty) throw new Error(`Only ${r.stock} left of ${r.productName}${r.size ? ` (${r.size})` : ""}`);
    out.push({ variantId: r.variantId, productName: r.productName, size: r.size, color: r.color, qty, unitPriceCents: r.priceCents });
  }
  return out;
}

/** Create a pending order. It becomes real only when markPaid is called. */
export async function createPendingOrder(input: NewOrderInput, priced: PricedLine[], provider: PaymentProvider): Promise<OrderWithItems> {
  const subtotal = priced.reduce((a, l) => a + l.unitPriceCents * l.qty, 0);
  const d = await db();
  const [row] = await d
    .insert(orders)
    .values({
      publicId: randomPublicId(),
      status: "pending",
      email: input.email,
      customerName: input.customerName,
      phone: input.phone,
      studentName: input.studentName,
      teacher: input.teacher,
      pickupMethod: input.pickupMethod,
      notes: input.notes,
      subtotalCents: subtotal,
      totalCents: subtotal,
      paymentProvider: provider,
    })
    .returning();
  const items = await d
    .insert(orderItems)
    .values(priced.map((l) => ({ orderId: row.id, ...l })))
    .returning();
  return { ...row, items };
}

export async function attachProviderOrder(orderId: number, providerOrderId: string): Promise<void> {
  const d = await db();
  await d.update(orders).set({ providerOrderId }).where(eq(orders.id, orderId));
}

export async function getOrderByProviderOrderId(providerOrderId: string): Promise<OrderWithItems | null> {
  const d = await db();
  const [row] = await d.select().from(orders).where(eq(orders.providerOrderId, providerOrderId));
  if (!row) return null;
  const items = await d.select().from(orderItems).where(eq(orderItems.orderId, row.id));
  return { ...row, items };
}

/** Idempotent: a second call for an already-paid order is a no-op. Decrements stock and sends the receipt. */
export async function markPaid(orderId: number, providerPaymentId?: string | null): Promise<OrderWithItems | null> {
  const d = await db();
  const [updated] = await d
    .update(orders)
    .set({ status: "paid", paidAt: new Date(), providerPaymentId: providerPaymentId ?? null })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning();
  if (!updated) return null;
  const items = await d.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const it of items) {
    if (it.variantId != null) {
      await d
        .update(variants)
        .set({ stock: sql`${variants.stock} - ${it.qty}` })
        .where(eq(variants.id, it.variantId));
    }
  }
  const full = { ...updated, items };
  await sendReceiptEmail(full);
  await sendNewOrderNotification(full);
  return full;
}

/**
 * Cancel an order: refund through Square if Square was paid, put the stock back,
 * mark it cancelled, email the parent. If the Square refund fails the order is
 * left untouched and the error propagates, so a volunteer never sees "cancelled"
 * on an order whose money did not move.
 */
export async function cancelOrder(orderId: number, reason: string): Promise<OrderWithItems> {
  const d = await db();
  const order = await getOrderById(orderId);
  if (!order) throw new Error("Order not found");
  if (order.status === "cancelled") return order;
  if (!CANCELLABLE.includes(order.status)) throw new Error(`Cannot cancel an order that is ${STATUS_LABELS[order.status].toLowerCase()}`);

  const plan = refundPlan(order);
  let refundId: string | null = order.providerRefundId;
  let refunded = order.refundedCents;
  if (plan.squareRefundCents > 0) {
    const { refundPayment } = await import("./square");
    const r = await refundPayment({
      paymentId: order.providerPaymentId!,
      amountCents: plan.squareRefundCents,
      reason: `${orderNumber(order.id)} cancelled${reason ? `: ${reason}` : ""}`,
      idempotencyKey: `lvpta-refund-${order.id}-${order.publicId}`,
    });
    refundId = r.refundId;
    refunded += plan.squareRefundCents;
  }

  if (plan.restock) {
    for (const it of order.items) {
      if (it.variantId != null) {
        await d.update(variants).set({ stock: sql`${variants.stock} + ${it.qty}` }).where(eq(variants.id, it.variantId));
      }
    }
  }
  const [updated] = await d
    .update(orders)
    .set({ status: "cancelled", cancelledAt: new Date(), cancelReason: reason.trim().slice(0, 500), providerRefundId: refundId, refundedCents: refunded })
    .where(eq(orders.id, orderId))
    .returning();
  const full = { ...updated, items: order.items };
  await sendCancelledEmail(full, plan.squareRefundCents);
  return full;
}

export async function setStatus(orderId: number, status: OrderStatus): Promise<void> {
  const d = await db();
  const stamp: Partial<typeof orders.$inferInsert> = { status };
  const now = new Date();
  if (status === "packed") stamp.packedAt = now;
  if (status === "ready") stamp.readyAt = now;
  if (status === "picked_up") stamp.pickedUpAt = now;
  await d.update(orders).set(stamp).where(eq(orders.id, orderId));
  if (status === "ready") {
    const full = await getOrderById(orderId);
    if (full) await sendOrderReadyEmail(full);
  }
}

export async function getOrderById(id: number): Promise<OrderWithItems | null> {
  const d = await db();
  const [row] = await d.select().from(orders).where(eq(orders.id, id));
  if (!row) return null;
  const items = await d.select().from(orderItems).where(eq(orderItems.orderId, id));
  return { ...row, items };
}

export async function getOrderByPublicId(publicId: string): Promise<OrderWithItems | null> {
  const d = await db();
  const [row] = await d.select().from(orders).where(eq(orders.publicId, publicId));
  if (!row) return null;
  const items = await d.select().from(orderItems).where(eq(orderItems.orderId, row.id));
  return { ...row, items };
}

/** All non-pending orders, newest first, for the admin board. */
export async function listOrders(): Promise<OrderWithItems[]> {
  const d = await db();
  const rows = await d
    .select()
    .from(orders)
    .where(inArray(orders.status, ["paid", "packed", "ready", "picked_up", "cancelled"]))
    .orderBy(desc(orders.id));
  if (rows.length === 0) return [];
  const items = await d
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, rows.map((r) => r.id)));
  const byOrder = new Map<number, OrderItem[]>();
  for (const it of items) byOrder.set(it.orderId, [...(byOrder.get(it.orderId) ?? []), it]);
  return rows.map((r) => ({ ...r, items: byOrder.get(r.id) ?? [] }));
}
