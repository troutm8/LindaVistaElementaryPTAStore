"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart";
import { formatCents } from "@/lib/money";

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutForm />
    </Suspense>
  );
}

function CheckoutForm() {
  const { lines, subtotalCents, hydrated } = useCart();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickup, setPickup] = useState<"office" | "student">("office");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      customerName: fd.get("customerName"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      studentName: fd.get("studentName"),
      teacher: fd.get("teacher"),
      pickupMethod: fd.get("pickupMethod"),
      notes: fd.get("notes"),
      lines: lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
    };
    const res = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
      setBusy(false);
      return;
    }
    // Cart is cleared on the order page once we know it went through.
    window.location.href = json.url;
  }

  if (!hydrated) return null;
  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Nothing to check out</h1>
        <Link href="/" className="mt-4 inline-block font-semibold text-brand underline">Browse the store</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_320px]">
      <form onSubmit={submit} className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Checkout</h1>
        {params.get("cancelled") && <p className="rounded-lg bg-amber-50 p-3 text-amber-800">Payment was cancelled. Your cart is still here.</p>}

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 font-semibold">Your info</legend>
          <Field name="customerName" label="Your name" required autoComplete="name" />
          <Field name="email" label="Email" type="email" required autoComplete="email" hint="Receipt and pickup notice go here" />
          <Field name="phone" label="Phone (optional)" type="tel" autoComplete="tel" />
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 font-semibold">Student</legend>
          <Field name="studentName" label="Student name" required hint="Goes on the bag so we can find it" />
          <Field name="teacher" label="Teacher / room" placeholder="e.g. Ms. Garcia, Rm 12" />
        </fieldset>

        <fieldset>
          <legend className="mb-2 font-semibold">How would you like to get your order?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Radio name="pickupMethod" value="office" checked={pickup === "office"} onChange={() => setPickup("office")} title="Pick up at the front office" body="We'll email you when your bag is waiting. Pick it up during office hours." />
            <Radio name="pickupMethod" value="student" checked={pickup === "student"} onChange={() => setPickup("student")} title="Send home with my student" body="We'll hand the bag to your student's teacher to send home in the backpack." />
          </div>
        </fieldset>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-700">Notes for the volunteers (optional)</span>
          <textarea name="notes" rows={2} className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>

        {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:bg-slate-300">
          {busy ? "One moment…" : `Continue to payment · ${formatCents(subtotalCents)}`}
        </button>
      </form>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Order summary</h2>
        <ul className="divide-y divide-slate-100 text-sm">
          {lines.map((l) => (
            <li key={l.variantId} className="flex justify-between py-2">
              <span>{l.qty} × {l.productName} <span className="text-slate-500">{[l.color, l.size].filter(Boolean).join(" ")}</span></span>
              <span>{formatCents(l.unitPriceCents * l.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold">
          <span>Total</span><span>{formatCents(subtotalCents)}</span>
        </div>
        <Link href="/cart" className="mt-3 block text-sm text-brand underline">Edit cart</Link>
      </aside>
    </div>
  );
}

function Field({ name, label, hint, ...rest }: { name: string; label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input name={name} {...rest} className="rounded-lg border border-slate-300 px-3 py-2" />
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function Radio({ title, body, ...rest }: { title: string; body: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${rest.checked ? "border-brand bg-blue-50" : "border-slate-300 bg-white"}`}>
      <input type="radio" {...rest} className="mt-1" />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-slate-600">{body}</span>
      </span>
    </label>
  );
}
