import type { OrderWithItems } from "./orders";

export const OFFICE_GROUP = "Front office pickup";
export const NO_TEACHER_GROUP = "Send home — teacher not given";

export type PullLine = { productName: string; color: string | null; size: string | null; qty: number };

/** Total quantity of each variant across the given orders, so a volunteer can pull stock in one pass. */
export function pullList(orders: OrderWithItems[]): PullLine[] {
  const map = new Map<string, PullLine>();
  for (const o of orders) {
    for (const it of o.items) {
      const key = `${it.productName}|${it.color ?? ""}|${it.size ?? ""}`;
      const line = map.get(key) ?? { productName: it.productName, color: it.color, size: it.size, qty: 0 };
      line.qty += it.qty;
      map.set(key, line);
    }
  }
  return [...map.values()].sort((a, b) => a.productName.localeCompare(b.productName) || (a.color ?? "").localeCompare(b.color ?? "") || (a.size ?? "").localeCompare(b.size ?? ""));
}

export type Destination = { title: string; orders: OrderWithItems[] };

/**
 * Group orders by where the bag goes: the front office, or a teacher's classroom.
 * Office first, then teachers alphabetically, then send-home orders with no teacher.
 */
export function groupByDestination(orders: OrderWithItems[]): Destination[] {
  const office: OrderWithItems[] = [];
  const noTeacher: OrderWithItems[] = [];
  const byTeacher = new Map<string, OrderWithItems[]>();
  for (const o of orders) {
    if (o.pickupMethod === "office") office.push(o);
    else if (!o.teacher.trim()) noTeacher.push(o);
    else byTeacher.set(o.teacher.trim(), [...(byTeacher.get(o.teacher.trim()) ?? []), o]);
  }
  const out: Destination[] = [];
  if (office.length) out.push({ title: OFFICE_GROUP, orders: office });
  for (const teacher of [...byTeacher.keys()].sort((a, b) => a.localeCompare(b))) {
    out.push({ title: teacher, orders: byTeacher.get(teacher)! });
  }
  if (noTeacher.length) out.push({ title: NO_TEACHER_GROUP, orders: noTeacher });
  return out;
}
