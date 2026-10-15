import Link from "next/link";
import clsx from "clsx";
import type { OrderStatus } from "@/db/schema";
import { listOrders, NEXT_STATUS, orderNumber, PICKUP_LABELS, STATUS_LABELS, type OrderWithItems } from "@/lib/orders";
import { formatCents } from "@/lib/money";
import { changeStatus } from "./actions";

export const dynamic = "force-dynamic";

const TABS: { key: OrderStatus; title: string }[] = [
  { key: "paid", title: "To pack" },
  { key: "packed", title: "Packed" },
  { key: "ready", title: "Ready for pickup" },
  { key: "picked_up", title: "Done" },
  { key: "cancelled", title: "Cancelled" },
];

const ACTION_LABELS: Record<OrderStatus, string> = {
  pending: "",
  paid: "Back to “to pack”",
  packed: "Mark packed",
  ready: "Mark ready (emails family)",
  picked_up: "Mark picked up",
  cancelled: "Cancel order",
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const all = await listOrders();
  const active = (TABS.find((t) => t.key === tab) ?? TABS[0]).key;
  const shown = all.filter((o) => o.status === active);
  const counts = Object.fromEntries(TABS.map((t) => [t.key, all.filter((o) => o.status === t.key).length]));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Volunteer board</h1>
          <p className="text-sm text-slate-500">Pack the order, print the label, bag it, mark it ready. The family gets an email at “ready”.</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Link href="/admin/packing" className="font-semibold text-brand underline">Packing list</Link>
          <Link href="/admin/stock" className="font-semibold text-brand underline">Stock</Link>
          <a href="/admin/export/orders.csv" className="font-semibold text-brand underline">Orders CSV</a>
          <a href="/admin/export/items.csv" className="font-semibold text-brand underline">Items CSV</a>
          <Link href="/" className="text-slate-600 underline">View store</Link>
        </div>
      </div>

      <nav className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin?tab=${t.key}`}
            className={clsx("rounded-full px-4 py-2 text-sm font-semibold", t.key === active ? "bg-brand text-white" : "bg-white text-slate-700 border border-slate-300 hover:border-brand")}
          >
            {t.title} <span className="ml-1 opacity-70">{counts[t.key]}</span>
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">Nothing here right now.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {shown.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: OrderWithItems }) {
  const next = NEXT_STATUS[order.status] ?? [];
  const when = order.paidAt ?? order.createdAt;
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold">{orderNumber(order.id)} · {order.customerName}</div>
          <div className="text-sm text-slate-600">
            Student: <strong>{order.studentName}</strong>{order.teacher && ` · ${order.teacher}`}
          </div>
          <div className="text-sm text-slate-600">{PICKUP_LABELS[order.pickupMethod]}</div>
          <div className="text-xs text-slate-400">{when.toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" })} · {order.email}{order.phone && ` · ${order.phone}`}</div>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{STATUS_LABELS[order.status]}</span>
      </div>

      <ul className="rounded-lg bg-slate-50 p-3 text-sm">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between py-0.5">
            <span><strong>{it.qty} ×</strong> {it.productName} <span className="text-slate-500">{[it.color, it.size].filter(Boolean).join(" ")}</span></span>
            <span className="text-slate-500">{formatCents(it.unitPriceCents * it.qty)}</span>
          </li>
        ))}
        <li className="mt-1 flex justify-between border-t border-slate-200 pt-1 font-semibold"><span>Total</span><span>{formatCents(order.totalCents)}</span></li>
      </ul>
      {order.notes && <p className="text-sm text-amber-800"><strong>Note:</strong> {order.notes}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {next.map((to) => (
          <form key={to} action={changeStatus}>
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="to" value={to} />
            <button
              type="submit"
              className={clsx(
                "rounded-lg px-3 py-1.5 text-sm font-semibold",
                to === "cancelled" ? "text-red-700 hover:bg-red-50" : isForward(order.status, to) ? "bg-brand text-white hover:bg-brand-dark" : "border border-slate-300 bg-white hover:border-brand",
              )}
            >
              {ACTION_LABELS[to]}
            </button>
          </form>
        ))}
        <Link href={`/admin/orders/${order.id}/label`} className="ml-auto text-sm font-semibold text-brand underline">Print label</Link>
      </div>
    </li>
  );
}

const ORDERED: OrderStatus[] = ["pending", "paid", "packed", "ready", "picked_up"];
function isForward(from: OrderStatus, to: OrderStatus): boolean {
  return ORDERED.indexOf(to) > ORDERED.indexOf(from);
}
