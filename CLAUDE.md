# Linda Vista PTA Store — working notes

An online front for the Linda Vista Elementary PTA's in-person school store. Parents order
online; a volunteer packs a bag; the family picks it up at the front office or it goes home
in the student's backpack. Next.js 15 App Router, Postgres via Drizzle, Square hosted checkout (payment links). The PTA already runs its in-person store on Square, so online sales land in the same account.

- Live: https://linda-vista-pta-store.vercel.app (Vercel project `linda-vista-pta-store`,
  Neon database `lvpta-db`). Pushing to `main` deploys.
- What it does and how to run it: [README.md](README.md).
- Why it is built this way and what has been done so far: [docs/PLAN.md](docs/PLAN.md).
  **Append to the build log at the end of that file when you finish a piece of work.**

## Setting up a machine

```bash
npm install -g pnpm@10 --registry=https://registry.npmjs.org
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev                      # http://localhost:3000
```

Things that will otherwise cost you time:

- **pnpm must be 10.** The repo carries its own `.npmrc` pointing at the public registry; the
  `--registry` flag on the global install matters only on a machine whose `~/.npmrc` points
  at a private registry.
- **PGlite is single-process.** With no `DATABASE_URL`, the database is `.data/pglite` and
  exactly one process may open it. Stop `pnpm dev` before running `db:*` scripts.
- **Port 3000 may be taken** by another Next app on this machine. `PORT=3077 pnpm dev` works;
  set `NEXT_PUBLIC_BASE_URL` to match so email links and Square redirects are right.
- **`vercel env pull` writes `.env.local` with the production `DATABASE_URL`.** Next.js loads
  it, so `pnpm dev` would then read and write the live Neon database while the `db:*` scripts
  (which read `.env`, not `.env.local`) keep using PGlite. Delete `.env.local` after pulling
  unless you mean to point local dev at production.
- **`pnpm start` is production mode.** With no `ADMIN_PASSWORD`, `/admin` returns 503 there
  and is open in `pnpm dev`. That is deliberate.
- **Every integration is optional** and the app degrades to a demo: no Square token → fake
  payment that marks the order paid at once; no Resend key → emails print to the console;
  no `DATABASE_URL` → PGlite. See `.env.example`.
- **Square money is `bigint`** in the SDK (`amount: BigInt(cents)`). Webhook bodies are raw
  snake_case JSON, not SDK-shaped camelCase.

## Commands

```bash
pnpm dev | build | start
pnpm typecheck                # tsc --noEmit
pnpm test                     # vitest: cart logic, money, order helpers (no database)
pnpm smoke                    # HTTP checks against the live site (SMOKE_URL overrides; ADMIN_PASSWORD adds the login check)
pnpm db:generate              # new migration from src/db/schema.ts
pnpm db:migrate               # apply drizzle/ migrations
pnpm db:seed                  # placeholder catalog from src/db/seed-data.ts (no-op if seeded)
pnpm db:reset                 # wipe PGlite, migrate, seed
```

## Layout

- `src/app/` pages: `/` catalog, `/item/[slug]`, `/cart`, `/checkout`, `/order/[publicId]`,
  `/admin` volunteer board, `/admin/orders/[id]/label` printable bag label.
- `src/app/api/checkout` creates the order and starts payment; `src/app/api/square/webhook`
  marks it paid. `src/lib/square.ts` wraps the SDK. `src/middleware.ts` is basic auth for
  `/admin`.
- `src/lib/orders.ts` is the order lifecycle (pending → paid → packed → ready → picked_up).
  Only `markPaid` makes an order real; it is idempotent and decrements stock.
- `src/lib/cart-logic.ts` is pure and tested; `src/lib/cart.tsx` is the React provider
  backed by `localStorage`.
- Placeholder product images are generated SVGs in `public/products/`. `public/eagle.png`
  is the school's mascot logo from lindavista.arusd.org; `src/app/icon.png` is the same file
  serving as favicon. Colors are the `brand*` tokens in `src/app/globals.css`.

## Rules of the road

- Never trust prices or stock from the browser; `priceLines` re-reads them from the database.
- Never mark an order paid from a browser redirect alone. The webhook, or a server-side
  `orders.get` against Square, is the source of truth.
- The order page URL uses the random `publicId`, never the sequential id.
