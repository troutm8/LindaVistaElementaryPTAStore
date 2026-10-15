import { NextResponse } from "next/server";
import { getOrderByProviderOrderId, markPaid } from "@/lib/orders";
import { verifyWebhook } from "@/lib/square";

/**
 * Square calls this on payment events. Subscribe to `payment.created` and
 * `payment.updated` in the Developer Console and point them at
 * <NEXT_PUBLIC_BASE_URL>/api/square/webhook. This is the production path that
 * marks a Square order paid; the order page has a polling fallback for local dev.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const ok = await verifyWebhook(raw, req.headers.get("x-square-hmacsha256-signature"));
  if (!ok) return NextResponse.json({ error: "bad signature" }, { status: 401 });

  // Square's webhook bodies are raw snake_case JSON, not SDK-shaped objects.
  type PaymentEvent = { type?: string; data?: { object?: { payment?: { id?: string; status?: string; order_id?: string } } } };
  const event = JSON.parse(raw) as PaymentEvent;
  if (event.type === "payment.created" || event.type === "payment.updated") {
    const payment = event.data?.object?.payment;
    if (payment?.status === "COMPLETED" && payment.order_id) {
      const order = await getOrderByProviderOrderId(payment.order_id);
      if (order) await markPaid(order.id, payment.id ?? null);
    }
  }
  return NextResponse.json({ received: true });
}
