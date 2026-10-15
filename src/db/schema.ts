import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull(),
  priceCents: integer("price_cents").notNull(),
  image: text("image").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const variants = pgTable("variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  size: text("size"),
  color: text("color"),
  stock: integer("stock").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "packed",
  "ready",
  "picked_up",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_PROVIDERS = ["demo", "square"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PICKUP_METHODS = ["office", "student"] as const;
export type PickupMethod = (typeof PICKUP_METHODS)[number];

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  publicId: text("public_id").notNull().unique(),
  status: text("status").$type<OrderStatus>().notNull().default("pending"),
  email: text("email").notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull().default(""),
  studentName: text("student_name").notNull(),
  teacher: text("teacher").notNull().default(""),
  pickupMethod: text("pickup_method").$type<PickupMethod>().notNull(),
  notes: text("notes").notNull().default(""),
  subtotalCents: integer("subtotal_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  paymentProvider: text("payment_provider").$type<PaymentProvider>().notNull().default("demo"),
  /** Square order id (the order Square created for the payment link). */
  providerOrderId: text("provider_order_id"),
  /** Square payment id, once paid. */
  providerPaymentId: text("provider_payment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  packedAt: timestamp("packed_at", { withTimezone: true }),
  readyAt: timestamp("ready_at", { withTimezone: true }),
  pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  variantId: integer("variant_id").references(() => variants.id),
  productName: text("product_name").notNull(),
  size: text("size"),
  color: text("color"),
  qty: integer("qty").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
});

export type Product = typeof products.$inferSelect;
export type Variant = typeof variants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
