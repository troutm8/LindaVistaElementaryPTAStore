import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Linda Vista PTA Store",
  description: "Spirit wear and school supplies from the Linda Vista Elementary PTA. Order online, pick up at school.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <CartProvider>
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 bg-white px-4 py-8">{children}</main>
          <footer className="no-print border-t border-brand-light bg-brand-light/50 py-6 text-center text-sm text-slate-600">
            <div className="flex items-center justify-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/eagle.png" alt="" aria-hidden className="size-8 object-contain" />
              <span>Linda Vista Elementary PTA · Every purchase supports our students.</span>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
