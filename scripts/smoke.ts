/**
 * Post-deploy smoke test. Hits a running store over HTTP and checks that the
 * pages, the database, the checkout API, and the admin lock all respond.
 * Creates no orders and changes nothing.
 *
 *   pnpm smoke                                  # against the Vercel URL
 *   SMOKE_URL=http://localhost:3077 pnpm smoke  # against a local dev server
 *   ADMIN_PASSWORD=... pnpm smoke               # also checks that the password opens /admin
 */

const base = (process.env.SMOKE_URL ?? "https://linda-vista-pta-store.vercel.app").replace(/\/$/, "");
const adminPassword = process.env.ADMIN_PASSWORD;

type Check = { name: string; run: () => Promise<string | void> };

async function get(path: string, init?: RequestInit) {
  const res = await fetch(base + path, { redirect: "manual", ...init });
  return { res, body: await res.text() };
}

function expect(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const checks: Check[] = [
  {
    name: "home page renders the catalog",
    run: async () => {
      const { res, body } = await get("/");
      expect(res.status === 200, `status ${res.status}`);
      expect(body.includes("Spirit wear"), "hero heading missing");
      expect(body.includes("/item/"), "no product links (database empty or unreachable?)");
    },
  },
  {
    name: "product page reads from the database",
    run: async () => {
      const { res, body } = await get("/item/spirit-tee-youth");
      expect(res.status === 200, `status ${res.status}`);
      expect(body.includes("Add to cart") || body.includes("Add to bag"), "add-to-cart button missing");
    },
  },
  {
    name: "unknown product returns 404",
    run: async () => {
      const { res } = await get("/item/does-not-exist");
      expect(res.status === 404, `status ${res.status}`);
    },
  },
  {
    name: "cart and checkout pages load",
    run: async () => {
      for (const path of ["/cart", "/checkout"]) {
        const { res } = await get(path);
        expect(res.status === 200, `${path} status ${res.status}`);
      }
    },
  },
  {
    name: "checkout API validates input",
    run: async () => {
      const { res, body } = await get("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      expect(res.status === 400, `status ${res.status}`);
      expect(body.includes("error"), "no error message in body");
    },
  },
  {
    name: "Square webhook rejects unsigned posts",
    run: async () => {
      const { res } = await get("/api/square/webhook", { method: "POST", body: "{}" });
      expect(res.status === 401, `status ${res.status}`);
    },
  },
  {
    name: "admin board is locked",
    run: async () => {
      const { res } = await get("/admin");
      expect(res.status === 401, `status ${res.status} (503 means ADMIN_PASSWORD is unset in production)`);
    },
  },
  {
    name: "admin board opens with the password",
    run: async () => {
      if (!adminPassword) return "skipped (set ADMIN_PASSWORD to check)";
      const auth = "Basic " + Buffer.from(`volunteer:${adminPassword}`).toString("base64");
      const { res, body } = await get("/admin", { headers: { authorization: auth } });
      expect(res.status === 200, `status ${res.status}`);
      expect(body.includes("Orders") || body.includes("LV-"), "board content missing");
    },
  },
];

async function main() {
  console.log(`Smoke test against ${base}\n`);
  let failed = 0;
  for (const check of checks) {
    const started = Date.now();
    try {
      const note = await check.run();
      const ms = Date.now() - started;
      console.log(`  ok    ${check.name}${note ? ` — ${note}` : ""} (${ms}ms)`);
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  FAIL  ${check.name}: ${msg}`);
    }
  }
  console.log(`\n${checks.length - failed}/${checks.length} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
