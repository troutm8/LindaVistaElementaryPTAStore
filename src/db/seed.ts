import { getDb } from "./client";
import { products, variants } from "./schema";
import { SEED_PRODUCTS } from "./seed-data";

async function main() {
  const holder = await getDb();
  const db = holder.db;
  const existing = await db.select({ id: products.id }).from(products).limit(1);
  if (existing.length > 0) {
    console.log("catalog already seeded; run `pnpm db:reset` to start over");
    await holder.close();
    return;
  }
  let sort = 0;
  for (const p of SEED_PRODUCTS) {
    const [row] = await db
      .insert(products)
      .values({
        slug: p.slug,
        name: p.name,
        description: p.description,
        category: p.category,
        priceCents: p.priceCents,
        image: `/products/${p.slug}.svg`,
        sortOrder: sort++,
      })
      .returning({ id: products.id });
    const sizes = p.sizes ?? [null];
    const colors = p.colors ?? [null];
    for (const color of colors) {
      for (const size of sizes) {
        await db.insert(variants).values({
          productId: row.id,
          size,
          color,
          stock: p.stock ?? 25,
        });
      }
    }
  }
  console.log(`seeded ${SEED_PRODUCTS.length} products (${holder.kind})`);
  await holder.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
