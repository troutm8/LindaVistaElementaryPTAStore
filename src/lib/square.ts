import { SquareClient, SquareEnvironment, WebhooksHelper } from "square";
import { baseUrl } from "./env";
import type { OrderWithItems } from "./orders";
import { orderNumber } from "./orders";

let client: SquareClient | null = null;

export function square(): SquareClient {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) throw new Error("SQUARE_ACCESS_TOKEN is not set");
  if (!client) {
    client = new SquareClient({
      token,
      environment: process.env.SQUARE_ENVIRONMENT === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    });
  }
  return client;
}

function locationId(): string {
  const id = process.env.SQUARE_LOCATION_ID;
  if (!id) throw new Error("SQUARE_LOCATION_ID is not set");
  return id;
}

/**
 * Create a Square-hosted checkout page (a "payment link") for a pending order.
 * Square creates its own Order object; we store its id so the webhook and the
 * return page can find ours. Our order number rides along as reference_id.
 */
export async function createPaymentLink(order: OrderWithItems): Promise<{ url: string; squareOrderId: string }> {
  const res = await square().checkout.paymentLinks.create({
    idempotencyKey: `lvpta-order-${order.id}-${order.publicId}`,
    description: `Linda Vista PTA Store order ${orderNumber(order.id)}`,
    order: {
      locationId: locationId(),
      referenceId: orderNumber(order.id),
      lineItems: order.items.map((it) => ({
        name: it.productName,
        variationName: [it.color, it.size].filter(Boolean).join(" ") || undefined,
        quantity: String(it.qty),
        basePriceMoney: { amount: BigInt(it.unitPriceCents), currency: "USD" },
      })),
      metadata: { lvptaOrderId: String(order.id), student: order.studentName.slice(0, 250) },
    },
    checkoutOptions: {
      redirectUrl: `${baseUrl()}/order/${order.publicId}?return=square`,
      askForShippingAddress: false,
      allowTipping: false,
    },
    prePopulatedData: { buyerEmail: order.email, buyerPhoneNumber: order.phone || undefined },
  });
  const link = res.paymentLink;
  if (!link?.url || !link.orderId) {
    throw new Error(`Square did not return a payment link: ${JSON.stringify(res.errors ?? res)}`);
  }
  return { url: link.url, squareOrderId: link.orderId };
}

/** Ask Square whether its order has been fully paid. Used when the webhook hasn't arrived (local dev). */
export async function squareOrderPaid(squareOrderId: string): Promise<{ paid: boolean; paymentId: string | null }> {
  const res = await square().orders.get({ orderId: squareOrderId });
  const o = res.order;
  if (!o) return { paid: false, paymentId: null };
  const due = o.netAmountDueMoney?.amount;
  const tenders = o.tenders ?? [];
  const paid = o.state === "COMPLETED" || (tenders.length > 0 && due != null && due === BigInt(0));
  return { paid, paymentId: tenders[0]?.paymentId ?? null };
}

/** Verify Square's HMAC on a webhook body. The URL must match the one registered in the Developer Console exactly. */
export async function verifyWebhook(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!key || !signatureHeader) return false;
  const notificationUrl = process.env.SQUARE_WEBHOOK_URL ?? `${baseUrl()}/api/square/webhook`;
  return WebhooksHelper.verifySignature({ requestBody: rawBody, signatureHeader, signatureKey: key, notificationUrl });
}

/**
 * Refund a Square payment, in full or in part. Sandbox and production behave the same.
 * Square may return PENDING in production; it settles to COMPLETED on its own and we
 * do not block cancellation on that.
 */
export async function refundPayment(input: { paymentId: string; amountCents: number; reason: string; idempotencyKey: string }): Promise<{ refundId: string; status: string }> {
  const res = await square().refunds.refundPayment({
    idempotencyKey: input.idempotencyKey,
    paymentId: input.paymentId,
    amountMoney: { amount: BigInt(input.amountCents), currency: "USD" },
    reason: input.reason.slice(0, 192) || undefined,
  });
  const refund = res.refund;
  if (!refund?.id || refund.status === "REJECTED" || refund.status === "FAILED") {
    throw new Error(`Square refund failed: ${JSON.stringify(res.errors ?? refund?.status ?? res)}`);
  }
  return { refundId: refund.id, status: refund.status ?? "PENDING" };
}
