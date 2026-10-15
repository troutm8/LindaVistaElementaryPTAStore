import { baseUrl, emailEnabled } from "./env";
import { formatCents } from "./money";
import type { OrderWithItems } from "./orders";

// Imported lazily to avoid a circular import at module load (orders.ts imports this file).
async function labels() {
  const m = await import("./orders");
  return { orderNumber: m.orderNumber, PICKUP_LABELS: m.PICKUP_LABELS };
}

type Mail = { to: string; subject: string; html: string; text: string };

async function send(mail: Mail): Promise<void> {
  if (!emailEnabled()) {
    console.log(`\n[email: not sent, RESEND_API_KEY unset]\nTo: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n`);
    return;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? "Linda Vista PTA Store <onboarding@resend.dev>";
  const { error } = await resend.emails.send({ from, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text });
  if (error) console.error("resend error", error);
}

function itemLines(order: OrderWithItems): string[] {
  return order.items.map(
    (it) => `${it.qty} × ${[it.productName, it.color, it.size].filter(Boolean).join(" ")} — ${formatCents(it.unitPriceCents * it.qty)}`,
  );
}

export async function sendReceiptEmail(order: OrderWithItems): Promise<void> {
  const { orderNumber, PICKUP_LABELS } = await labels();
  const num = orderNumber(order.id);
  const link = `${baseUrl()}/order/${order.publicId}`;
  const lines = itemLines(order);
  const text = [
    `Thanks for supporting the Linda Vista PTA, ${order.customerName}!`,
    ``,
    `Order ${num}`,
    ...lines,
    `Total: ${formatCents(order.totalCents)}`,
    ``,
    `Delivery: ${PICKUP_LABELS[order.pickupMethod]}`,
    `Student: ${order.studentName}${order.teacher ? ` (${order.teacher})` : ""}`,
    ``,
    `A PTA volunteer will pack your order. We'll email you again when it's ready.`,
    `Track it here: ${link}`,
  ].join("\n");
  await send({
    to: order.email,
    subject: `Linda Vista PTA Store: order ${num} received`,
    text,
    html: `<p>Thanks for supporting the Linda Vista PTA, ${esc(order.customerName)}!</p>
<p><strong>Order ${num}</strong></p>
<ul>${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
<p><strong>Total: ${formatCents(order.totalCents)}</strong></p>
<p>Delivery: ${esc(PICKUP_LABELS[order.pickupMethod])}<br/>Student: ${esc(order.studentName)}${order.teacher ? ` (${esc(order.teacher)})` : ""}</p>
<p>A PTA volunteer will pack your order. We'll email you again when it's ready.</p>
<p><a href="${link}">Track your order</a></p>`,
  });
}

export async function sendOrderReadyEmail(order: OrderWithItems): Promise<void> {
  const { orderNumber } = await labels();
  const num = orderNumber(order.id);
  const link = `${baseUrl()}/order/${order.publicId}`;
  const where =
    order.pickupMethod === "office"
      ? `Your bag is at the Linda Vista front office with "${order.customerName}" on it. Pick it up any school day during office hours.`
      : `Your bag is on its way home with ${order.studentName}. Check the backpack!`;
  const text = [`Good news, ${order.customerName}: order ${num} is ready.`, ``, where, ``, `Order details: ${link}`].join("\n");
  await send({
    to: order.email,
    subject: `Linda Vista PTA Store: order ${num} is ready`,
    text,
    html: `<p>Good news, ${esc(order.customerName)}: <strong>order ${num} is ready.</strong></p><p>${esc(where)}</p><p><a href="${link}">Order details</a></p>`,
  });
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
