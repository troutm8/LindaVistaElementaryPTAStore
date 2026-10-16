import { NextResponse } from "next/server";
import { expireAbandonedCheckouts } from "@/lib/orders";

export const dynamic = "force-dynamic";

const ONE_DAY = 24 * 60 * 60 * 1000;

/**
 * Called daily by Vercel Cron (see vercel.json). Vercel sends `Authorization: Bearer <CRON_SECRET>`.
 * Without CRON_SECRET the route is open in development and refused in production.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  }
  const result = await expireAbandonedCheckouts(ONE_DAY);
  console.log("expire-pending", result);
  return NextResponse.json(result);
}
