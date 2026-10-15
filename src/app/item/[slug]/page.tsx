import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/catalog";
import { formatCents } from "@/lib/money";
import { AddToCart } from "@/components/AddToCart";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return (
    <div>
      <Link href="/" className="text-sm text-slate-500 hover:text-brand">← Back to store</Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className="w-full rounded-2xl border border-slate-200" />
        <div className="flex flex-col gap-4">
          <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">{product.category}</span>
          <h1 className="text-3xl font-extrabold">{product.name}</h1>
          <p className="text-2xl font-bold text-brand">{formatCents(product.priceCents)}</p>
          <p className="text-slate-600">{product.description}</p>
          <AddToCart product={product} />
        </div>
      </div>
    </div>
  );
}
