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
