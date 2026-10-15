import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByPublicId, markPaid, orderNumber, PICKUP_LABELS, STATUS_LABELS } from "@/lib/orders";
import { formatCents } from "@/lib/money";
import { squareEnabled } from "@/lib/env";
import { squareOrderPaid } from "@/lib/square";
import { ClearCart } from "@/components/ClearCart";
import type { OrderStatus } from "@/db/schema";

export const dynamic = "force-dynamic";

const STEPS: OrderStatus[] = ["paid", "packed", "ready", "picked_up"];

export default async function OrderPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  let order = await getOrderByPublicId(publicId);
  if (!order) notFound();

  // Fallback for environments where the webhook can't reach us (local dev):
  // ask Square directly whether its order has been paid.
  if (order.status === "pending" && order.paymentProvider === "square" && order.providerOrderId && squareEnabled()) {
    const { paid, paymentId } = await squareOrderPaid(order.providerOrderId);
    if (paid) order = (await markPaid(order.id, paymentId)) ?? (await getOrderByPublicId(publicId))!;
  }

  const num = orderNumber(order.id);
  const stepIndex = STEPS.indexOf(order.status);

  return (
    <div className="mx-auto max-w-2xl">
      {order.status !== "pending" && <ClearCart />}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {order.status === "pending" ? (
          <>
            <h1 className="text-2xl font-bold">Waiting for payment</h1>
            <p className="mt-2 text-slate-600">We haven&apos;t heard back from Square yet. Refresh in a moment, or check your email for a receipt.</p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Order {num}</p>
            <h1 className="mt-1 text-2xl font-bold">Thanks, {order.customerName}!</h1>
            <p className="mt-2 text-slate-600">
              A PTA volunteer will pack your order. {order.pickupMethod === "office" ? "We'll email you when your bag is at the front office." : `We'll send it home with ${order.studentName}.`}
            </p>
          </>
        )}

        {stepIndex >= 0 && (
          <ol className="mt-6 grid grid-cols-4 gap-2 text-center text-xs">
            {STEPS.map((s, i) => (
              <li key={s} className={i <= stepIndex ? "font-semibold text-brand" : "text-slate-400"}>
                <div className={`mx-auto mb-1 h-2 rounded-full ${i <= stepIndex ? "bg-brand" : "bg-slate-200"}`} />
                {STATUS_LABELS[s]}
              </li>
            ))}
          </ol>
        )}
        {order.status === "cancelled" && <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">This order was cancelled. Contact the PTA if that&apos;s a surprise.</p>}

        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-slate-500">Delivery</dt><dd>{PICKUP_LABELS[order.pickupMethod]}</dd>
          <dt className="text-slate-500">Student</dt><dd>{order.studentName}{order.teacher && ` · ${order.teacher}`}</dd>
          <dt className="text-slate-500">Email</dt><dd>{order.email}</dd>
        </dl>

        <ul className="mt-6 divide-y divide-slate-100 border-t border-slate-200 text-sm">
          {order.items.map((it) => (
            <li key={it.id} className="flex justify-between py-2">
              <span>{it.qty} × {it.productName} <span className="text-slate-500">{[it.color, it.size].filter(Boolean).join(" ")}</span></span>
              <span>{formatCents(it.unitPriceCents * it.qty)}</span>
            </li>
          ))}
          <li className="flex justify-between py-2 font-bold"><span>Total</span><span>{formatCents(order.totalCents)}</span></li>
        </ul>
        {order.paymentProvider === "demo" && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Demo mode: no real payment was taken. Connect Square to take real orders.</p>
        )}
      </div>
      <Link href="/" className="mt-6 inline-block text-sm font-semibold text-brand underline">Back to store</Link>
    </div>
  );
}
