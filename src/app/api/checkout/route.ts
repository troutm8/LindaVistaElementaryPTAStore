import { NextResponse } from "next/server";
import { z } from "zod";
import { PICKUP_METHODS } from "@/db/schema";
import { squareEnabled } from "@/lib/env";
import { attachProviderOrder, createPendingOrder, markPaid, priceLines } from "@/lib/orders";
import { createPaymentLink } from "@/lib/square";

const Body = z.object({
  customerName: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: z.string().trim().max(40).default(""),
  studentName: z.string().trim().min(1, "Student name is required").max(120),
  teacher: z.string().trim().max(120).default(""),
  pickupMethod: z.enum(PICKUP_METHODS),
  notes: z.string().trim().max(500).default(""),
  lines: z.array(z.object({ variantId: z.number().int().positive(), qty: z.number().int().min(1).max(20) })).min(1, "Cart is empty").max(50),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const input = parsed.data;
  try {
    const priced = await priceLines(input.lines);
    if (squareEnabled()) {
      const order = await createPendingOrder(input, priced, "square");
      const { url, squareOrderId } = await createPaymentLink(order);
      await attachProviderOrder(order.id, squareOrderId);
      return NextResponse.json({ url });
    }
    // Demo mode: no payment processor configured. Mark paid immediately so the
    // rest of the flow (receipt, admin board, pickup email) can be exercised.
    const order = await createPendingOrder(input, priced, "demo");
    await markPaid(order.id);
    return NextResponse.json({ url: `/order/${order.publicId}?placed=1` });
  } catch (err) {
    console.error("checkout failed", err);
    const msg = err instanceof Error ? err.message : "Could not start checkout";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
