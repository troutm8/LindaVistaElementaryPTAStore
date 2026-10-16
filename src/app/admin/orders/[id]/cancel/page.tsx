import Link from "next/link";
import { notFound } from "next/navigation";
import { CANCELLABLE, getOrderById, orderNumber, refundPlan, STATUS_LABELS } from "@/lib/orders";
import { formatCents } from "@/lib/money";
import { cancelOrderAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

/** Two-step cancel: show exactly what will happen to the money and the stock, then confirm. */
export default async function CancelPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const order = await getOrderById(Number(id));
  if (!order) notFound();
  const num = orderNumber(order.id);
  const plan = refundPlan(order);
  const canCancel = CANCELLABLE.includes(order.status);

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/admin" className="text-sm text-brand underline">← Back to board</Link>
      <h1 className="mt-4 text-2xl font-bold">Cancel {num}?</h1>
      <p className="mt-1 text-slate-600">
        {order.customerName} · {order.studentName} · {formatCents(order.totalCents)} · currently <strong>{STATUS_LABELS[order.status]}</strong>
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700"><strong>Not cancelled.</strong> {error}</p>}

      {!canCancel ? (
        <p className="mt-6 rounded-lg bg-slate-100 p-4 text-slate-700">
          {order.status === "cancelled" ? "This order is already cancelled." : "Picked-up orders can't be cancelled here. Refund it from the Square dashboard if needed."}
        </p>
      ) : (
        <>
          <ul className="mt-6 space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <li>
              <strong>Money:</strong>{" "}
              {plan.squareRefundCents > 0
                ? `${formatCents(plan.squareRefundCents)} will be refunded to the parent's card through Square. This cannot be undone.`
                : order.paymentProvider === "demo"
                  ? "Demo order, no real payment was taken. Nothing to refund."
                  : "Nothing left to refund."}
            </li>
            <li><strong>Stock:</strong> {order.items.map((it) => `${it.qty} × ${it.productName} ${[it.color, it.size].filter(Boolean).join(" ")}`.trim()).join(", ")} goes back on the shelf.</li>
            <li><strong>Parent:</strong> {order.email} gets a cancellation email{plan.squareRefundCents > 0 ? " with the refund amount" : ""}.</li>
          </ul>

          <form action={cancelOrderAction} className="mt-6 flex flex-col gap-4">
            <input type="hidden" name="id" value={order.id} />
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-700">Reason (goes in the email to the parent, optional)</span>
              <textarea name="reason" rows={2} maxLength={500} placeholder="e.g. Sold out of youth small; sorry!" className="rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700">
                {plan.squareRefundCents > 0 ? `Refund ${formatCents(plan.squareRefundCents)} and cancel` : "Cancel order"}
              </button>
              <Link href="/admin" className="text-sm text-slate-600 underline">Keep the order</Link>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
