# Quickstart: Validate the Backend Security Review

**Feature:** [spec.md](spec.md) | **Review contract:** [security-review.md](contracts/security-review.md) | **Research:** [research.md](research.md)

Use a local or isolated nonproduction checkout. This is a review and validation guide for the later implementation phase; it does not claim the review has already found or fixed a vulnerability.

## 1. Install and identify the selected guidance

From the repository root, follow the command on the [FarsiUI Backend Security listing](https://farsiui.ir/skills/backend-security):

```bash
npx farsiui@latest add backend-security
```

Select the project/Codex target if prompted. Check that `.agents/skills/backend-security/SKILL.md` and its companion `references/` files are present. Record the upstream source, skill revision or file digest, installation date, and any missing file in the review report. `.agents/skills/` is Git-ignored, so a clean checkout must repeat this step. Read the installed guide and its review checklist before auditing; consult topic references only for boundaries found in this app.

## 2. Establish a safe test target

`vitest.config.ts` loads `tests/setup.ts`, which clears 19 tables **before each test**. Do not run `npm test`, bare `vitest`, `db:test:reset`, `db:fresh`, or `db:seed` against the development catalog. Do not set `HAMI_ALLOW_DB_RESET=1` to bypass the guard. Verify the target without printing credentials:

```bash
node <<'NODE'
const fs = require('node:fs');
const dotenv = require('dotenv');
const devEnv = dotenv.parse(fs.readFileSync('.env'));
const testEnv = dotenv.parse(fs.readFileSync('.env.test'));
const dev = devEnv.DATABASE_URL;
const test = testEnv.DATABASE_URL;
if (!dev || !test) throw new Error('Both database URLs must exist');
const a = new URL(dev);
const b = new URL(test);
const dbName = decodeURIComponent(b.pathname.slice(1));
if (!/test/i.test(dbName)) throw new Error('Test database name must contain test');
const sameTarget = a.host === b.host && a.pathname === b.pathname &&
  a.searchParams.get('schema') === b.searchParams.get('schema');
if (sameTarget) throw new Error('Development and test database targets are identical');
if (process.env.HAMI_ALLOW_DB_RESET === '1' || testEnv.HAMI_ALLOW_DB_RESET === '1') {
  throw new Error('Reset guard override is set');
}
console.log('Disposable test target is distinct; inspect ownership before allowing table resets.');
NODE
```

The preflight compares targets but cannot prove that the test database has no valuable data. Confirm that it is disposable before running destructive integration tests. If `.env.test` is absent, malformed, inaccessible, or points to a shared target, stop database-backed validation and report it as unverified. Do not print URL values in the report.

## 3. Record the baseline inventory

Inventory the current `app/api/**/route.ts` files, `middleware.ts`, the server helpers listed in [plan.md](plan.md), and the corresponding tests. Group operations under the categories in the [review contract](contracts/security-review.md). For each route chosen for detailed review, trace identity, supplied record identifiers, body/query/file/provider inputs, permission decision, state change or outbound request, and error/log output. Record source evidence separately from reproduced behavior.

Use isolated customer A, customer B, staff, and guest identities. For each protected object, compare a legitimate request with a cross-account or lesser-role request and inspect protected state after both. For payment, use the existing fake gateway or an approved sandbox; test invalid, repeated, and competing results without a real charge. For uploads and outbound requests, use safe fixtures and local fakes where practical. Do not include live tokens, document contents, or personal information in saved evidence.

## 4. Run focused regression checks

Pure unit checks do not use the database reset setup:

```bash
npx vitest run --config vitest.frontend.config.ts tests/unit/auth.test.ts tests/unit/payment-zarinpal.test.ts
npm run typecheck
```

Only after step 2 confirms a disposable test target, run database-backed route checks. These commands delete rows from that test target before each case:

```bash
npm test -- tests/api/auth.test.ts tests/api/addresses.test.ts tests/api/orders.test.ts
npm test -- tests/api/pay.test.ts tests/api/payments-callback.test.ts
npm test -- tests/api/admin-users.test.ts tests/api/admin-catalog-images.test.ts
```

Add focused cases only for a confirmed boundary or a correction. Verify an authorized case, a denied case, relevant malformed/replay/concurrent cases, and persisted state. Do not change tests merely to bless an unsafe implementation. If an isolated database or suitable identities are unavailable, run only pure checks and label the others unverified.

## 5. Verify corrections and hand off

Repeat each failing observation under comparable conditions after a correction. Preserve the response envelope and intended authenticated/payment journey, or document a security-required contract change. Record every finding and repeated result using [data-model.md](data-model.md) and [the review contract](contracts/security-review.md); create Beads follow-ups for remaining confirmed work.

For code changes, run focused tests and `npm run typecheck`. Stop any running Next server **before** `npm run build`; restart it afterward. If a server response or page behavior changed, verify the affected path in a browser and confirm a referenced `/_next/static/` client chunk loads. Do not infer a working client from an HTML 200 alone. Do not run a build over a running server's `.next` directory.

Record which provider, production, rate-limit, concurrency, or authenticated scenarios could not be exercised. A local pass is not a production penetration test and does not establish that every possible attack has been ruled out.
