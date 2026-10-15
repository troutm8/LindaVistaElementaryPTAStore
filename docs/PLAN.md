# Linda Vista Elementary PTA Store — plan

Draft, 2026-10-15. Open questions are at the bottom; the build log goes at the end.

## What it is

An online version of the PTA's in-person school store (t-shirts, hoodies, pencils, spirit
wear). A parent who can't come to the store in person browses the catalog, adds items to a
cart, pays online, and a PTA volunteer later pulls the items, bags them with the family's
name on the bag, and leaves the bag in the front office for pickup.

Phase 1 is a **mockup** for the PTA board: a working site with a fake catalog and Stripe in
test mode, so the board can click through the whole flow end to end without any real money
moving. Phase 2 turns it into the real store once the board says yes.

## The order lifecycle

```
 browse → cart → checkout (pay) → PAID → PACKED → READY FOR PICKUP → PICKED UP
                                    │                  │
                                    └─ email: receipt  └─ email: "your bag is in the office"
```

- **Paid.** Stripe confirms payment. We record the order, send a receipt with an order
  number, and the order appears on the volunteer's packing list.
- **Packed.** A volunteer pulled the items and bagged them. Bag label = family name, student
  name + teacher, order number, contents.
- **Ready for pickup.** Bag is in the front office. Customer gets an email (and optionally a
  text) saying so, with office hours.
- **Picked up.** Office staff or a volunteer marks it done. Closes the loop so nobody wonders
  whether a bag is still sitting there.

Optional second delivery method worth asking the board about: **send home with student**.
Many PTAs put the bag in the student's backpack via the teacher instead of using the office.
Same lifecycle, different final step, and it cuts the office out of the loop entirely.

## Pages

| Page | Who | What |
|---|---|---|
| `/` | parents | Catalog grid: photo, name, price, sizes/colors. Grouped by category. |
| `/item/[slug]` | parents | One product: size/color picker, quantity, add to cart. |
| `/cart` | parents | Line items, edit quantities, "Check out" button. |
| checkout | parents | Stripe-hosted page. Collects card, email, name. We pass student name + teacher and pickup method as custom fields. |
| `/order/[id]` | parents | Confirmation + current status. Linked from the receipt email. |
| `/admin` | volunteers | Password-protected. Orders by status, packing list, one-click status changes, printable bag labels. |
| `/admin/inventory` | volunteers | Edit stock counts, hide sold-out sizes. (Phase 2.) |

## Tech stack

Chosen to cost $0 for the mockup, stay near $0 in production, and be handed off to a
non-developer volunteer with nothing to babysit.

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript + Tailwind 4 | Same stack as the volleyball dashboard; server-rendered, one deploy. |
| Hosting | Vercel hobby tier | Free, git-push deploys, preview URL per branch for showing the board. |
| Payments | **Square hosted checkout** (Checkout API payment links) | The PTA's in-person store already runs on Square, so online sales land in the same account and the treasurer sees one deposit stream and one set of reports. No card data touches our code. Sandbox gives a full demo with test card `4111 1111 1111 1111`. |
| Catalog | Phase 1: a seed file in the database. Phase 2 option: sync from the Square Catalog so the POS and the website share items, prices and stock. | Volunteers already manage items in Square for the in-person store; a sync means one place to edit. |
| Orders DB | Phase 1: Vercel Postgres / Neon free tier via Drizzle. (PGlite locally, same as volleyball.) | We need our own order row because Square has no notion of "packed" or "ready for pickup". |
| Order creation | Square webhook `payment.updated` (status `COMPLETED`), with a server-side `orders.get` fallback when the parent returns | The only trustworthy signal that money moved. Never create a paid order from the browser redirect alone. |
| Auth / Admin | Phase 1: shared password in an env var. Phase 2: Google sign-in with an allowlist of PTA emails (Auth.js). | Phase 1 is a demo; don't over-build it. |
| Email | Resend (free tier, 3k/mo) | Receipt on Paid, notification on Ready. React Email templates. |
| Images | `/public` for the mockup; Vercel Blob or Stripe product images later. | |

Deliberately **not** in the plan: a customer account system, saved carts across devices,
shipping, coupons. Parents buy a hoodie twice a year; guest checkout is right.

### The honest alternative: Square Online

Now that we know the PTA is on Square, the hosted alternative is Square Online (free plan,
same processing fees). It does pickup orders out of the box, including the "ready for pickup"
email, and it uses the same catalog as the in-person register. What it does not do is the
"send home with student" flow, the student/teacher fields on the bag label, or a volunteer
packing board tuned to how the PTA actually works. Recommendation stays: show the board the
custom mockup, and if they would rather trade those features for zero maintenance, Square
Online is a one-afternoon fallback that still lands money in the same account.

## Data model (phase 1)

```
products        id, slug, name, description, category, price_cents, image, active
variants        id, product_id, size, color, sku, stock, active
orders          id (short, human-readable e.g. LV-0142), stripe_session_id, email,
                customer_name, student_name, teacher, phone, pickup_method,
                status (paid|packed|ready|picked_up|cancelled), total_cents,
                paid_at, packed_at, ready_at, picked_up_at, notes
order_items     order_id, variant_id, name_snapshot, size, color, qty, unit_price_cents
```

Cart lives in `localStorage` only; it is not an order until Stripe says so.

## Phase 1 — mockup (target: one working session)

1. Scaffold: Next.js, Tailwind, Drizzle + PGlite, same `CLAUDE.md` conventions as volleyball.
2. Seed catalog: ~10 products with placeholder images (shirt S–XL in two colors, hoodie,
   pencils, water bottle, spirit sticker, etc.). Ask the PTA president for real photos/prices.
3. Catalog, product, and cart pages.
4. Stripe Checkout in test mode; custom fields for student name, teacher, pickup method.
5. Webhook → order row → confirmation page.
6. `/admin`: orders grouped by status, status buttons, printable bag label.
7. Receipt and "ready" emails (Resend test mode, or log to console for the demo).
8. Deploy to Vercel. Hand the board a URL and the test card number.

## Phase 2 — production (after the board approves)

- Connect the PTA's production Square account (OAuth or a personal access token from the
  treasurer's Square developer app) and register the webhook.
- Decide whether the catalog syncs from Square's Catalog API; real photos. (Stock editing on
  the board is done; a catalog editor is not.)
- Google sign-in for `/admin` with allowlisted PTA emails.
- Real Postgres (Neon), Resend domain verified, custom domain (e.g. `store.lvpta.org`).
- Sales tax: ask the treasurer. California PTAs selling merchandise generally need a seller's
  permit and to collect tax on physical goods; Square can apply a tax to the order.
- Processing fees: decide whether the PTA eats the Square online rate or offers "cover the
  fee" at checkout.
- Hand-off doc for the volunteer who runs it: how to add a product, how to pack, how to refund.

## Decisions so far

- 2026-10-15: Stack approved as above (Tom).
- 2026-10-15: Both delivery methods: front-office pickup **and** send home with student.
- 2026-10-15: Known products so far: shirts, hoodies, pencils. Rest of the catalog is
  placeholder until the PTA reviews the mockup and supplies the real list (well before
  go-live).
- 2026-10-15: **Payment processor is Square** (what the in-person store uses). Stripe removed.
- 2026-10-15: Send-home orders are walked to the teacher's classroom (mailboxes are too
  small), so the bag label headlines the teacher and room.

## Open questions for the PTA president / treasurer

1. Who holds the PTA's Square login, and will they create a developer application for the
   store (needed for the access token and webhook)? Sandbox needs nothing from them.
2. Does the office actually want to hold bags? Is there a shelf, and what hours?
3. Sales tax and seller's permit status.
4. Who will own this after launch, and how comfortable are they with the Square dashboard?
5. Real product list, prices, sizes, and photos. School colors for the site.
6. Should the website's catalog be the Square catalog (one place to edit, shared stock)?

---

## Build log

### 2026-10-15 — phase 1 mockup built and verified

Scaffolded the whole phase 1 list in one session. Everything runs in demo mode with no
external accounts: PGlite database, fake payment, emails logged to the console, admin open
in dev.

- Schema (`products`, `variants`, `orders`, `order_items`), Drizzle migration, seed of 10
  placeholder products with generated SVG images.
- Storefront: catalog grouped by category, product page with color/size picker and
  sold-out handling, localStorage cart, checkout form collecting parent, student, teacher,
  delivery method (office or send-home), and notes.
- Orders: `/api/checkout` validates with zod, re-prices from the database, creates a
  pending order, then either starts a Stripe Checkout Session or (demo mode) marks it paid.
  Stripe webhook plus a server-side `sessions.retrieve` fallback on the order page.
  `markPaid` is idempotent, decrements stock, sends the receipt.
- Volunteer board at `/admin`: tabs by status, order cards, status buttons via server
  actions, "ready" sends the pickup email. Printable bag label. Basic-auth middleware.
- Tests: cart logic, money formatting, order number, duplicate-line merging. Typecheck and
  production build clean.
- Verified in Chrome: add to cart → checkout → confirmation page → admin → packed → ready →
  email in log → customer page shows "Ready for pickup" → label page.

Deviations and findings:

- Stripe Checkout custom fields are limited, so the checkout form is ours and only the
  payment step is hosted by Stripe. Cleaner for the volunteers too.
- Caught a bug in testing: two cart lines for the same variant each passed the stock check
  separately. `mergeLines` now collapses them before pricing.
- `useSearchParams` on the checkout page needs a Suspense boundary or the build fails.

Not done yet (phase 2): Resend domain, Neon database, Vercel deploy, Google sign-in for
admin, inventory editing UI, real catalog and photos, school colors.

### 2026-10-15 — switched payments from Stripe to Square

Tom confirmed the PTA's in-person store runs on Square. Replaced Stripe with the Square
Node SDK (`square@46`, payment links via `client.checkout.paymentLinks.create`).

- `src/lib/square.ts`: client, `createPaymentLink` (our order id in `referenceId` and
  metadata, redirect back to `/order/[publicId]`), `squareOrderPaid` (`orders.get`, paid when
  state is `COMPLETED` or net due is 0 with a tender), `verifyWebhook` (SDK `WebhooksHelper`).
- `/api/square/webhook` handles `payment.created` / `payment.updated` with status
  `COMPLETED`, finds our order by the stored Square order id, calls `markPaid`.
- Order columns renamed to `provider_order_id` / `provider_payment_id`; migration regenerated
  from scratch since nothing is deployed.
- Bag label for send-home orders now headlines "Walk to: <teacher, room>".
- Verified in demo mode: build, typecheck, tests, a demo order, unsigned webhook → 401.
  **Not yet verified against a Square sandbox** (needs sandbox credentials in `.env`).

Gotchas learned from the docs and forums: the Square sandbox may not append `orderId` /
`transactionId` to the redirect URL, which is why the redirect carries our own `publicId`
and we look Square's order up by the id we stored. The webhook notification URL must match
the registered one exactly or signature verification fails; `SQUARE_WEBHOOK_URL` overrides it.

### 2026-10-15 — school colors and the eagle

Tom: school colors are blue and white, mascot is an eagle. The eagle is the school's own
logo image on https://lindavista.arusd.org/ (`LindaVista-Transparent.png`, 500×500 with
transparency), saved as `public/eagle.png` and as the favicon at `src/app/icon.png`.

- Palette is now four tokens in `globals.css`: `brand` (#2a6fb5, sampled from the eagle),
  `brand-dark`, `brand-light`, `brand-sky`. All navy/gold classes renamed to these.
- Eagle appears in a white circle at the top left of the header on every page, large in the
  home-page hero ("Go Eagles!"), small in the footer and on the printed bag label.
- Placeholder product swatches regenerated in blues so the catalog reads blue-and-white;
  placeholder colors renamed Royal Blue / White / Heather Gray.

Open: confirm with the PTA that the school is fine with the PTA store using the school's
eagle (it is the school's logo, not the PTA's).

### 2026-10-15 — first production deploy

Live at https://linda-vista-pta-store.vercel.app (Vercel project `linda-vista-pta-store`
under Tom's account, region sfo1, GitHub repo connected so pushes to `main` deploy).

- Database: Neon free tier via the Vercel marketplace (resource `lvpta-db`, region pdx1).
  `DATABASE_URL` and the other Neon variables are injected into all Vercel environments.
- Build command runs `db:migrate` and `db:seed` before `next build`, so the schema and the
  placeholder catalog set themselves up; seed is a no-op once products exist.
- Env set in Vercel: `ADMIN_PASSWORD` (production and preview), `NEXT_PUBLIC_BASE_URL`,
  `SQUARE_ENVIRONMENT=sandbox`. No Square token yet, so the live site runs demo checkout.
- Verified: home and product pages 200, `/admin` 401 without password and 200 with it,
  a sample demo order (LV-0001, "Sample Parent") created and shown on the board.
- The Neon install also drops agent-skill files (`.agents/`, `.claude/`, `skills-lock.json`)
  into the repo; removed, they are not part of the project.

Next: Square sandbox credentials in Vercel to exercise the real checkout; Resend key for real
emails; custom domain if the PTA has one.

### 2026-10-15 — smoke test for the deployed site

Tom sent the URL to the PTA and is waiting on feedback. Decided to hold off on page-level and
API tests until the design settles, but added one guard for the "deploy broke" case:
`scripts/smoke.ts` (`pnpm smoke`), eight HTTP checks against the Vercel URL by default.

- Home renders the catalog with product links (proves the database is reachable and seeded).
- Product page 200, unknown slug 404, cart and checkout 200.
- `POST /api/checkout` with `{}` → 400 (route alive, zod validation working, no order created).
- `POST /api/square/webhook` unsigned → 401.
- `/admin` → 401; with `ADMIN_PASSWORD` set in the shell, also checks the login gives 200.
- `SMOKE_URL` overrides the target. Exit code 1 on any failure, so it can gate CI later.

All eight pass against production. Not wired into CI or Vercel yet; run it by hand after a
deploy until the catalog and checkout shape are final.

### 2026-10-15 — Square sandbox checkout verified end to end

Tom created the Square developer app and supplied the sandbox access token. Set in Vercel
(production + preview): `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID` (looked up via
`GET /v2/locations`, the Default Test Account), and `SQUARE_WEBHOOK_SIGNATURE_KEY`. The
webhook subscription was created through Square's Webhook Subscriptions API rather than
the dashboard: `payment.created` + `payment.updated` → `/api/square/webhook`, API version
2025-01-23.

Test run on the live site, order LV-0002 ($15, one youth tee, send-home):

- `POST /api/checkout` returned a `sandbox.square.link` URL; the Square order carried
  `reference_id` LV-0002 and our metadata.
- In sandbox, a payment link opens Square's "Checkout API Sandbox Testing Panel" instead of
  a card form. One click simulates the payment; no test card is needed. The real hosted
  checkout page only appears in production.
- Square redirected to `/order/<publicId>?return=square` as designed.
- The `payment.updated` webhook arrived with a valid signature and `markPaid` ran: the order
  was "Paid, not packed" on the board before anyone opened the order page, so the polling
  fallback was not what did it.

Gotchas: Vercel env changes need `vercel redeploy <url>` to take effect. The board hides
unpaid (abandoned) checkouts by design; worth a tab or a nightly cleanup later.

### 2026-10-15 — CI and volunteer tools

While waiting on the PTA's feedback, the work that does not depend on the catalog:

- **CI**: GitHub Actions runs typecheck, vitest, and `next build` against a fresh PGlite
  database on every push to `main` and every PR. The smoke test stays manual since it hits
  production.
- **Packing list** (`/admin/packing`): "To pack" shows paid orders with a pull list (total
  quantity per variant) and then each bag grouped by destination: front office first, then
  teachers alphabetically, then send-home orders with no teacher. "To deliver" is the same
  layout for packed orders. Printable, with a checkbox per bag. Logic in `src/lib/packing.ts`.
- **Stock editor** (`/admin/stock`): every variant with its count, Sold out / Low badges, a
  number input and Save per row. Server action clamps to 0..10000.
- **CSV exports** (`/admin/export/orders.csv`, `items.csv`): one row per order (with Square
  order and payment ids, for reconciliation) and one row per line item (for "how many youth
  smalls"). Status is the raw key (`paid`, `packed`...) so it filters cleanly in a sheet.
  Timestamps are Pacific, `YYYY-MM-DD HH:MM`.
- **Bug fixed**: the board rendered times in the server's timezone (UTC on Vercel), so a 2:38 PM
  order showed as 9:38 PM. All volunteer-facing times now pass `timeZone: "America/Los_Angeles"`.
- Smoke test now also checks packing, stock, and the CSV header behind the password.

Verified locally in Chrome with four demo orders across two teachers and the office. 14 unit
tests pass.

Not done on purpose: bulk "mark all packed" on the packing list, a catalog/product editor,
and showing abandoned (unpaid) checkouts on the board. Revisit after feedback.

