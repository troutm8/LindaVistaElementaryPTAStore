import Link from "next/link";
import clsx from "clsx";
import { listCatalogForAdmin } from "@/lib/catalog";
import { formatCents } from "@/lib/money";
import { updateStock } from "./actions";

export const dynamic = "force-dynamic";

/** Edit on-hand counts. Zero shows "Sold out" in the store; the checkout refuses to oversell. */
export default async function StockPage() {
  const catalog = await listCatalogForAdmin();
  const soldOut = catalog.flatMap((p) => p.variants).filter((v) => v.active && v.stock <= 0).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Stock</h1>
          <p className="text-sm text-slate-500">
            Counts on hand. Change a number and press Save. {soldOut > 0 ? `${soldOut} sold out.` : "Nothing is sold out."}
          </p>
        </div>
        <Link href="/admin" className="text-sm text-brand underline">← Back to board</Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {catalog.map((p) => (
          <section key={p.id} className={clsx("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", !p.active && "opacity-60")}>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="font-bold">{p.name}{!p.active && <span className="ml-2 text-xs font-normal text-slate-500">(hidden from store)</span>}</h2>
              <span className="text-sm text-slate-500">{formatCents(p.priceCents)}</span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {p.variants.map((v) => (
                  <tr key={v.id} className="border-t border-slate-100">
                    <td className="py-1.5 pr-2">{[v.color, v.size].filter(Boolean).join(" · ") || "One size"}</td>
                    <td className="py-1.5 pr-2 text-right">
                      {v.stock <= 0 ? <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Sold out</span>
                        : v.stock <= 5 ? <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Low</span> : null}
                    </td>
                    <td className="py-1.5">
                      <form action={updateStock} className="flex items-center justify-end gap-2">
                        <input type="hidden" name="id" value={v.id} />
                        <input
                          type="number" name="stock" defaultValue={v.stock} min={0} max={10000} step={1}
                          aria-label={`Stock for ${p.name} ${[v.color, v.size].filter(Boolean).join(" ")}`}
                          className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right"
                        />
                        <button type="submit" className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold hover:border-brand">Save</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
}
