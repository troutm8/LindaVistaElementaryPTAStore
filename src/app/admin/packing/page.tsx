import Link from "next/link";
import clsx from "clsx";
import { listOrders, orderNumber } from "@/lib/orders";
import { groupByDestination, pullList } from "@/lib/packing";
import { PrintButton } from "@/components/PrintButton";
import { bulkStatusAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const MODES = {
  pack: { title: "To pack", status: "paid", next: "packed", bulk: "Mark all packed", blurb: "Orders that are paid and waiting. Pull the stock, bag each order, then mark them packed." },
  deliver: { title: "To deliver", status: "packed", next: "ready", bulk: "Mark all ready (emails families)", blurb: "Bags that are packed. Walk them to each classroom or the office, then mark them ready." },
} as const;
type Mode = keyof typeof MODES;

/** Printable packing sheet: a pull list of totals, then every bag grouped by where it goes. */
export default async function PackingPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode: rawMode } = await searchParams;
  const mode: Mode = rawMode === "deliver" ? "deliver" : "pack";
  const all = await listOrders();
  const shown = all.filter((o) => o.status === MODES[mode].status).sort((a, b) => a.id - b.id);
  const totals = pullList(shown);
  const groups = groupByDestination(shown);
  const today = new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "full" });

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Packing list</h1>
          <p className="text-sm text-slate-500">{MODES[mode].blurb}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin" className="text-sm text-brand underline">← Back to board</Link>
          <PrintButton />
          {shown.length > 0 && (
            <form action={bulkStatusAction}>
              <input type="hidden" name="to" value={MODES[mode].next} />
              <input type="hidden" name="ids" value={shown.map((o) => o.id).join(",")} />
              <input type="hidden" name="back" value={`/admin/packing?mode=${mode}`} />
              <button type="submit" className="rounded-lg border border-brand bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light">
                {MODES[mode].bulk} · {shown.length}
              </button>
            </form>
          )}
        </div>
      </div>

      <nav className="no-print mb-6 flex gap-2">
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <Link
            key={m}
            href={`/admin/packing?mode=${m}`}
            className={clsx("rounded-full px-4 py-2 text-sm font-semibold", m === mode ? "bg-brand text-white" : "border border-slate-300 bg-white text-slate-700 hover:border-brand")}
          >
            {MODES[m].title} <span className="ml-1 opacity-70">{all.filter((o) => o.status === MODES[m].status).length}</span>
          </Link>
        ))}
      </nav>

      <div className="mb-6 flex items-baseline justify-between border-b-2 border-slate-900 pb-2">
        <h2 className="text-xl font-black">{MODES[mode].title} · {shown.length} {shown.length === 1 ? "bag" : "bags"}</h2>
        <span className="text-sm text-slate-600">{today}</span>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">Nothing to {mode === "pack" ? "pack" : "deliver"} right now.</p>
      ) : (
        <>
          {mode === "pack" && (
            <section className="mb-8">
              <h3 className="mb-2 font-bold uppercase tracking-wide text-slate-700">Pull from stock</h3>
              <table className="w-full max-w-lg text-sm">
                <tbody>
                  {totals.map((t) => (
                    <tr key={`${t.productName}|${t.color}|${t.size}`} className="border-b border-slate-200">
                      <td className="py-1 pr-3 text-right font-bold tabular-nums">{t.qty} ×</td>
                      <td className="py-1">{t.productName} <span className="text-slate-500">{[t.color, t.size].filter(Boolean).join(" ")}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {groups.map((g) => (
            <section key={g.title} className="mb-8 break-inside-avoid">
              <h3 className="mb-2 rounded-lg bg-slate-900 px-3 py-1.5 font-bold text-white">
                {g.title} <span className="font-normal opacity-70">· {g.orders.length}</span>
              </h3>
              <ul className="divide-y divide-slate-200">
                {g.orders.map((o) => (
                  <li key={o.id} className="flex gap-3 py-2">
                    <span aria-hidden className="mt-0.5 inline-block size-5 shrink-0 rounded border-2 border-slate-400" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold">
                        <span className="font-mono text-slate-600">{orderNumber(o.id)}</span> · {o.customerName}
                        <span className="font-normal text-slate-600"> for {o.studentName}</span>
                      </div>
                      <div className="text-sm">
                        {o.items.map((it) => `${it.qty} × ${it.productName} ${[it.color, it.size].filter(Boolean).join(" ")}`.trim()).join(" · ")}
                      </div>
                      {o.notes && <div className="text-sm text-amber-800">Note: {o.notes}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
