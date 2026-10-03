import { beforeEach } from "vitest";
import { resetDb } from "./helpers/db";

/**
 * The backend suite's setup: truncate every table before each test, so each one starts from
 * a known-empty database.
 *
 * **`resetDb()` deletes every row of nineteen tables.** This file is registered in
 * `vitest.config.ts` under `setupFiles`, which applies to *every* test file in the project
 * — not only the ones that need a database. With no `.env.test` in this checkout,
 * `DATABASE_URL` resolves from `.env`, and that is the development database. So the
 * hazard was never only `npm test`; this ran for a single-file frontend run too:
 *
 *     npx vitest run tests/unit/brand-deck.test.ts     # truncated hami_site_api
 *
 * Frontend and pure-arithmetic suites have their own config, `vitest.frontend.config.ts`,
 * which does not load this file. This guard is for the path that still does: a bare
 * `npx vitest run`, a forgotten `-e .env.test`, or a new test file added to the backend
 * suite by someone who has not read this comment.
 *
 * The rule it enforces: **only a throwaway database may be truncated.** A database whose
 * name contains `test` is a throwaway. The development database is not, so this throws
 * before `resetDb()` is ever called — a loud, immediate failure instead of a silent
 * truncation. The cost is that the backend suite cannot run until a test database exists,
 * which is already the documented intent: `package.json`'s `test` script is
 * `dotenv -e .env.test -- vitest run`, and no `.env.test` is present. It fails closed.
 *
 * The two ways to satisfy the guard:
 *   1. `DATABASE_URL` names a database containing `test` — the intended path. Create
 *      `.env.test` pointing at it and `npm test` works as written.
 *   2. `HAMI_ALLOW_DB_RESET=1`, for a throwaway database under some other name. Refuse to
 *      set this against a database whose contents you cannot afford to lose.
 *
 * No secret is printed here: only the database *name*, which is the last path segment.
 */

/** The database's name — the last path segment of `DATABASE_URL`, query string dropped. */
function databaseName(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return "";
  try {
    // Verified against this project's own URL shape, including `?schema=public` and the
    // `prisma://` scheme. An unparseable value yields "", which fails the guard below.
    return decodeURIComponent(new URL(url).pathname).replace(/^\//, "");
  } catch {
    return "";
  }
}

const database = databaseName();

if (!/test/i.test(database) && process.env.HAMI_ALLOW_DB_RESET !== "1") {
  throw new Error(
    `Refusing to reset the database named "${database || "(unparseable or unset)"}".\n\n` +
      `tests/setup.ts calls resetDb(), which deletes every row of nineteen tables, and it\n` +
      `runs for every test file in this project. That is only safe against a throwaway\n` +
      `database.\n\n` +
      `  - Frontend / pure-data unit tests need no database. Run them with:\n` +
      `      npm run test:unit\n` +
      `    or: npx vitest run --config vitest.frontend.config.ts tests/unit/<file>.test.ts\n` +
      `  - Backend / API tests need one. Point DATABASE_URL at a database whose name\n` +
      `    contains "test" — create .env.test and npm test picks it up:\n` +
      `      echo 'DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/hami_site_api_test?schema=public' > .env.test\n` +
      `      npx prisma db push --skip-generate      # schema only, does not drop data\n` +
      `  - If your throwaway database is named something else, set HAMI_ALLOW_DB_RESET=1.\n\n` +
      `Nothing has been deleted. This threw before the first deleteMany.`,
  );
}

beforeEach(async () => {
  await resetDb();
});
