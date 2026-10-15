import Link from "next/link";
import { formatCents } from "@/lib/money";
import type { ProductWithVariants } from "@/lib/catalog";

export function ProductCard({ product }: { product: ProductWithVariants }) {
  const inStock = product.variants.some((v) => v.stock > 0);
  return (
    <Link
      href={`/item/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-semibold leading-snug group-hover:text-brand">{product.name}</h3>
        <p className="text-sm text-slate-500 line-clamp-2">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-bold text-brand">{formatCents(product.priceCents)}</span>
          {!inStock && <span className="text-xs font-semibold text-red-600">Sold out</span>}
        </div>
      </div>
    </Link>
  );
}
