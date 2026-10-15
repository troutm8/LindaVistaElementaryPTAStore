# Linda Vista Elementary PTA Store

Order spirit wear and school supplies online; a PTA volunteer packs the bag; pick it up at the
front office or have it sent home with your student.

Status: **phase 1 mockup**. Everything works end to end in demo mode with no accounts needed.

## Run it

```bash
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev
```

- Store: http://localhost:3000
- Volunteer board: http://localhost:3000/admin (open in dev; set `ADMIN_PASSWORD` to lock it)

Place an order, then go to the board, mark it packed, mark it ready, and watch the
"your bag is ready" email print in the terminal.

## Turning on the real integrations

Copy `.env.example` to `.env` and fill in what you have. Each one is independent.

| Variable | Effect |
|---|---|
| `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID` | Checkout goes through Square's hosted payment page. Sandbox credentials are free from the [Square Developer Console](https://developer.squareup.com/apps); sandbox test card `4111 1111 1111 1111`, any future expiry, CVV `111`, ZIP `94103`. |
| `SQUARE_ENVIRONMENT` | `sandbox` (default) or `production`. |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | Lets Square tell us an order was paid. Subscribe to `payment.created` and `payment.updated` at `<base url>/api/square/webhook`. Without it, the order page asks Square directly when the parent returns, which is enough for local testing. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Sends the receipt and "ready" emails instead of logging them. |
| `DATABASE_URL` | Postgres (Neon, Vercel Postgres) instead of the local PGlite file. |
| `ADMIN_PASSWORD` | Required in production; `/admin` is locked without it. |
| `NEXT_PUBLIC_BASE_URL` | Public URL for links in emails and Square redirects. |

## Deploy

Live at https://linda-vista-pta-store.vercel.app. Pushing to `main` deploys. The build runs
the migration and seed itself, so a fresh database needs no manual step. Set the variables
above in the Vercel project settings.

See [docs/PLAN.md](docs/PLAN.md) for the plan, open questions, and build log.
