"use server";

import { revalidatePath } from "next/cache";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { NEXT_STATUS, getOrderById, setStatus } from "@/lib/orders";

export async function changeStatus(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const to = String(formData.get("to")) as OrderStatus;
  if (!Number.isInteger(id) || !ORDER_STATUSES.includes(to)) return;
  const order = await getOrderById(id);
  if (!order) return;
  const allowed = NEXT_STATUS[order.status] ?? [];
  if (!allowed.includes(to)) return;
  await setStatus(id, to);
  revalidatePath("/admin");
}

export async function cancelOrderAction(formData: FormData): Promise<void> {
  const { redirect } = await import("next/navigation");
  const { cancelOrder } = await import("@/lib/orders");
  const id = Number(formData.get("id"));
  const reason = String(formData.get("reason") ?? "");
  if (!Number.isInteger(id)) return;
  try {
    await cancelOrder(id, reason);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not cancel";
    redirect(`/admin/orders/${id}/cancel?error=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/admin");
  redirect("/admin?tab=cancelled");
}

/** Move every listed order to `to`, skipping any whose current status does not allow it. */
export async function bulkStatusAction(formData: FormData): Promise<void> {
  const { redirect } = await import("next/navigation");
  const to = String(formData.get("to")) as OrderStatus;
  const ids = String(formData.get("ids") ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const back = String(formData.get("back") ?? "/admin");
  if (!ORDER_STATUSES.includes(to) || ids.length === 0) return;
  for (const id of ids) {
    const order = await getOrderById(id);
    if (!order) continue;
    if (!(NEXT_STATUS[order.status] ?? []).includes(to)) continue;
    await setStatus(id, to);
  }
  revalidatePath("/admin");
  revalidatePath("/admin/packing");
  redirect(back.startsWith("/admin") ? back : "/admin");
}
