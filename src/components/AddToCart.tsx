"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useCart } from "@/lib/cart";
import type { ProductWithVariants } from "@/lib/catalog";
import { formatCents } from "@/lib/money";

export function AddToCart({ product }: { product: ProductWithVariants }) {
  const { add } = useCart();
  const router = useRouter();
  const colors = useMemo(() => [...new Set(product.variants.map((v) => v.color).filter((c): c is string => !!c))], [product]);
  const sizes = useMemo(() => [...new Set(product.variants.map((v) => v.size).filter((s): s is string => !!s))], [product]);
  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = product.variants.find((v) => (v.color ?? null) === color && (v.size ?? null) === size);
  const stockFor = (c: string | null, s: string | null) => product.variants.find((v) => (v.color ?? null) === c && (v.size ?? null) === s)?.stock ?? 0;

  function submit() {
    if (!variant) return;
    add({ variantId: variant.id, productSlug: product.slug, productName: product.name, size: variant.size, color: variant.color, unitPriceCents: product.priceCents, image: product.image }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      {colors.length > 0 && (
        <Picker label="Color" options={colors} value={color} onChange={setColor} disabled={(c) => sizes.length === 0 && stockFor(c, null) <= 0} />
      )}
      {sizes.length > 0 && (
        <Picker label="Size" options={sizes} value={size} onChange={setSize} disabled={(s) => stockFor(color, s) <= 0} />
      )}
      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-slate-700" htmlFor="qty">Quantity</label>
        <input
          id="qty"
          type="number"
          min={1}
          max={20}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          className="w-20 rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={!variant || variant.stock <= 0}
          className="rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {variant && variant.stock <= 0 ? "Sold out" : `Add to cart · ${formatCents(product.priceCents * qty)}`}
        </button>
        {added && (
          <button type="button" onClick={() => router.push("/cart")} className="text-sm font-semibold text-brand underline">
            Added! View cart →
          </button>
        )}
      </div>
      {variant && variant.stock > 0 && variant.stock <= 5 && <p className="text-sm text-amber-700">Only {variant.stock} left.</p>}
    </div>
  );
}

function Picker({ label, options, value, onChange, disabled }: { label: string; options: string[]; value: string | null; onChange: (v: string) => void; disabled: (v: string) => boolean }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-slate-700">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const off = disabled(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={clsx(
                "rounded-lg border px-4 py-2 text-sm font-medium",
                value === o ? "border-brand bg-brand text-white" : "border-slate-300 bg-white hover:border-brand",
                off && "line-through opacity-40",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
