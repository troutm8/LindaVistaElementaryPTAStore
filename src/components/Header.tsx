"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export function Header() {
  const { count, hydrated } = useCart();
  return (
    <header className="no-print border-b-4 border-brand-dark bg-brand text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white shadow-md ring-2 ring-brand-sky">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/eagle.png" alt="Linda Vista eagle" className="size-12 object-contain" />
          </span>
          <span>
            <span className="block text-lg font-extrabold leading-tight tracking-tight">Linda Vista PTA Store</span>
            <span className="block text-xs text-brand-sky">Order online · pick up at school</span>
          </span>
        </Link>
        <Link href="/cart" className="relative rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white hover:text-brand-dark">
          Cart
          {hydrated && count > 0 && (
            <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand-dark">{count}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
