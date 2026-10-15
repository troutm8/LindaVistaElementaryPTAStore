import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { products, variants, type Product, type Variant } from "@/db/schema";

export type ProductWithVariants = Product & { variants: Variant[] };

export async function listProducts(): Promise<ProductWithVariants[]> {
  const d = await db();
  const ps = await d.select().from(products).where(eq(products.active, true)).orderBy(asc(products.sortOrder), asc(products.id));
  const vs = await d.select().from(variants).where(eq(variants.active, true)).orderBy(asc(variants.id));
  const byProduct = new Map<number, Variant[]>();
  for (const v of vs) byProduct.set(v.productId, [...(byProduct.get(v.productId) ?? []), v]);
  return ps.map((p) => ({ ...p, variants: byProduct.get(p.id) ?? [] }));
}

export async function getProduct(slug: string): Promise<ProductWithVariants | null> {
  const d = await db();
  const [p] = await d.select().from(products).where(eq(products.slug, slug));
  if (!p || !p.active) return null;
  const vs = await d.select().from(variants).where(eq(variants.productId, p.id)).orderBy(asc(variants.id));
  return { ...p, variants: vs.filter((v) => v.active) };
}

/** Group products by category, preserving first-seen category order. */
export function groupByCategory<T extends { category: string }>(items: T[]): { category: string; items: T[] }[] {
  const out: { category: string; items: T[] }[] = [];
  for (const it of items) {
    let g = out.find((x) => x.category === it.category);
    if (!g) {
      g = { category: it.category, items: [] };
      out.push(g);
    }
    g.items.push(it);
  }
  return out;
}
