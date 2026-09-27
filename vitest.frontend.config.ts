import { configDefaults, defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Frontend unit tests — the pure-data and pure-arithmetic suites that touch no database.
 *
 * **This file exists for one reason: the absence of `setupFiles`.** `vitest.config.ts:16`
 * registers `./tests/setup.ts`, and that file calls `resetDb()` in a `beforeEach`.
 * `resetDb()` (`tests/helpers/db.ts`) deletes every row of nineteen tables through
 * `lib/prisma`, and `setupFiles` applies to *every* test file — not only the ones that
 * need a database. There is no `.env.test` in this checkout, so `DATABASE_URL` resolves
 * from `.env`, which points at the development database. A single-file run was therefore
 * enough to truncate the dev database before the first assertion:
 *
 *     npx vitest run tests/unit/brand-deck.test.ts     # wiped hami_site_api
 *
 * Not just bare `npm test`. The hazard was described that way for too long.
 *
 * So: same project, same alias, same JSX handling — and no `setupFiles`. Nothing in this
 * config can reach a database, because nothing here opens a connection.
 *
 * Run it with either of:
 *
 *     npm run test:unit
 *     npx vitest run --config vitest.frontend.config.ts tests/unit/brand-deck.test.ts
 *
 * The three files in `exclude` below genuinely need the database (they import `prisma`
 * and call `tests/helpers/seed.ts`), so they stay with the backend suite in
 * `vitest.config.ts`, where the reset is legitimate. They are listed one by one rather
 * than filtered by a name pattern, so a new database-backed unit test fails to be noticed
 * here instead of silently running without its seed.
 *
 * `tests/setup.ts` also refuses to reset a database that is not named like a test
 * database, so the unsafe path fails loudly instead of quietly truncating. That guard is
 * the reason a bare `npx vitest run` is survivable; this config is the reason you do not
 * have to think about it at all.
 */
export default defineConfig({
  // Same reason as vitest.config.ts:8 — tsconfig's `jsx: "preserve"` leaves JSX
  // untransformed, and several suites here import .tsx modules.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    exclude: [
      ...configDefaults.exclude,
      // Database-backed. Verified by grepping tests/unit for `prisma` and `helpers/seed`.
      "tests/unit/orders.test.ts",
      "tests/unit/productHistory.test.ts",
      "tests/unit/withAuth.test.ts",
    ],
    // No `setupFiles` key. Do not add one. See the note above.
    fileParallelism: false,
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
