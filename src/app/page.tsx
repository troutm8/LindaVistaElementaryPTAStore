import { groupByCategory, listProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const groups = groupByCategory(await listProducts());
  return (
    <div className="flex flex-col gap-10">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-dark to-brand p-8 text-white sm:pr-56">
        <h1 className="text-3xl font-extrabold">Spirit wear, supplies, and more</h1>
        <p className="mt-2 max-w-2xl text-brand-sky">
          Can&apos;t make it to the store in the morning? Order here and a PTA volunteer will pack your bag. Pick it up at the
          front office or have it sent home in your student&apos;s backpack.
        </p>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-white/80">Go Eagles!</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/eagle.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -bottom-6 -right-4 hidden w-56 drop-shadow-xl sm:block"
        />
      </section>
      {groups.map((g) => (
        <section key={g.category}>
          <h2 className="mb-4 text-xl font-bold text-slate-800">{g.category}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {g.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
