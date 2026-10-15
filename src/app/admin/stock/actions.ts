"use server";

import { revalidatePath } from "next/cache";
import { setVariantStock } from "@/lib/catalog";

export async function updateStock(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const stock = Number(formData.get("stock"));
  if (!Number.isInteger(id) || !Number.isInteger(stock) || stock < 0 || stock > 10000) return;
  await setVariantStock(id, stock);
  revalidatePath("/admin/stock");
}
