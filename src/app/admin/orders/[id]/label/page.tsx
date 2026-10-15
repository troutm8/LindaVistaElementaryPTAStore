import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById, orderNumber, PICKUP_LABELS } from "@/lib/orders";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

/** A bag label: big family name, student + teacher, order number, contents. Print it, tape it on. */
export default async function LabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(Number(id));
  if (!order) notFound();
  return (
    <div className="mx-auto max-w-md">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/admin" className="text-sm text-brand underline">← Back to board</Link>
        <PrintButton />
      </div>
      <div className="rounded-2xl border-4 border-dashed border-slate-400 bg-white p-8">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/eagle.png" alt="" aria-hidden className="size-8 object-contain" />
          Linda Vista PTA Store
        </div>
        <div className="mt-2 text-4xl font-black">{order.customerName}</div>
        <div className="mt-1 text-xl">
          for <strong>{order.studentName}</strong>{order.teacher && <span className="text-slate-600"> · {order.teacher}</span>}
        </div>
        <div className="mt-3 inline-block rounded-lg bg-slate-900 px-3 py-1 font-mono text-lg font-bold text-white">{orderNumber(order.id)}</div>
        {order.pickupMethod === "student" ? (
          <div className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-lg font-bold">
            Walk to: {order.teacher || "teacher not given — check with office"}
          </div>
        ) : (
          <div className="mt-3 text-base font-semibold">{PICKUP_LABELS[order.pickupMethod]}</div>
        )}
        <ul className="mt-4 border-t border-slate-300 pt-3 text-lg">
          {order.items.map((it) => (
            <li key={it.id}>{it.qty} × {it.productName} {[it.color, it.size].filter(Boolean).join(" ")}</li>
          ))}
        </ul>
        {order.notes && <p className="mt-3 text-sm text-slate-600">Note: {order.notes}</p>}
      </div>
    </div>
  );
}
