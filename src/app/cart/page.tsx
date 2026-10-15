"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatCents } from "@/lib/money";

export default function CartPage() {
  const { lines, setQty, remove, subtotalCents, hydrated } = useCart();
  if (!hydrated) return null;
  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/" className="mt-4 inline-block font-semibold text-brand underline">Browse the store</Link>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Your cart</h1>
      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {lines.map((l) => (
          <li key={l.variantId} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.image} alt="" className="size-16 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 basis-40">
              <Link href={`/item/${l.productSlug}`} className="font-semibold hover:text-brand">{l.productName}</Link>
              <div className="text-sm text-slate-500">{[l.color, l.size].filter(Boolean).join(" · ")}</div>
            </div>
            {/* On a phone this group wraps onto its own line under the name. */}
            <div className="ml-auto flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <span className="sm:sr-only">Qty</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={l.qty}
                  onChange={(e) => setQty(l.variantId, Number(e.target.value) || 0)}
                  className="w-16 rounded-lg border border-slate-300 px-2 py-2 text-center"
                  aria-label={`Quantity of ${l.productName}`}
                />
              </label>
              <div className="w-20 text-right font-semibold">{formatCents(l.unitPriceCents * l.qty)}</div>
              <button type="button" onClick={() => remove(l.variantId)} className="rounded-lg px-2 py-2 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove">✕</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="text-lg">Subtotal <span className="font-bold">{formatCents(subtotalCents)}</span></div>
        <Link href="/checkout" className="block w-full rounded-lg bg-brand px-6 py-3 text-center font-semibold text-white hover:bg-brand-dark sm:w-auto">Check out</Link>
      </div>
    </div>
  );
}
