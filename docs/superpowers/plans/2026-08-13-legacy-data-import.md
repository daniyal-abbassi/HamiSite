# Legacy Data Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the synthetic-only `npm run db:seed` with a script that also
imports real categories, brands, products (+variants+images), customers, and
orders (+items+payments) from the legacy shop's live API
(`hamihamrah-shop.com`), so local dev/testing has realistic data instead of 3
hand-picked demo products.

**Architecture:** A small `prisma/legacy-import/` module: a typed HTTP client
(`client.ts`) for the legacy API's `Authorization: Api-Key` auth + pagination,
pure mapper functions (one file per resource) that translate legacy JSON shapes
into Prisma `*UncheckedCreateInput` objects, and per-resource "apply" functions
that upsert/replace-children using the mappers. `prisma/seed.ts` becomes an
orchestrator that runs the existing synthetic B2B seeding, then the legacy
import phases, in FK dependency order (categories → brands → products →
customers → orders/payments).

**Tech Stack:** TypeScript, Prisma Client, `dotenv`, `bcryptjs` (already a
dependency), Vitest (existing test runner), Node's built-in `fetch`.

**Spec:** `docs/superpowers/specs/2026-08-13-legacy-data-import-design.md`

## Global Constraints

- Legacy API base: `https://hamihamrah-shop.com/api/v4` (from `WEBSITE_URL` in
  `actuall_old_webSite_api_token.txt`, `/api/v4` appended).
- Legacy API auth header: `Authorization: Api-Key <API_TOKEN>` — confirmed live;
  `Bearer`/`Token`/`X-API-KEY` all fail with 401.
- Credentials load from `actuall_old_webSite_api_token.txt` via
  `dotenv.config({ path: "actuall_old_webSite_api_token.txt" })` — this file is
  gitignored (fixed in this plan's Task 0) and must never be read into a
  committed file or logged.
- Every list endpoint returns `{status, data: T[], message, pagination: {page,
  page_size, total_count, total_pages, has_next, has_previous} | null}`.
- Idempotency keys (upsert-by, per spec): Category by `slug`, Brand by derived
  `slug`, Product by `slug`, User by `phoneNumber`, Order by `orderNumber`
  (`` `LEGACY-${legacyOrderId}` ``). Product's images/variants and Order's
  items/payments are deleted-and-recreated under their already-upserted parent
  on every run (documented caveat: this wipes any admin edits made to imported
  products' variants/images since the last import run).
- No schema/migration changes — every mapping uses existing unique fields.

---

## Task 0: Stop tracking the legacy credentials file, verify it's ignored

**Files:**
- Modify: `.gitignore` (already done ahead of this plan — verify, don't redo)

- [ ] **Step 1: Confirm the token file is ignored and untracked**

Run: `git check-ignore -v actuall_old_webSite_api_token.txt && git status --porcelain=v1 -- actuall_old_webSite_api_token.txt`
Expected: the `check-ignore` line prints `.gitignore:<N>:actuall_old_webSite_api_token.txt	actuall_old_webSite_api_token.txt`, and the `status` line prints nothing (file is ignored, not staged/tracked).

- [ ] **Step 2: Commit the .gitignore fix on its own**

```bash
git add .gitignore
git commit -m "chore: gitignore the legacy shop API credentials file"
```

---

## Task 1: Fix `npm run db:seed` (`ts-node` + Node 22's `.ts` module-format detection) — DONE

`prisma/seed.ts` failed with `Unknown file extension ".ts"`, thrown from
Node's own `node:internal/modules/esm/get_format` — **not** from a
tsconfig `module` mismatch as originally suspected. Root-caused live: adding
a `"ts-node": { compilerOptions: {...} }` block to `package.json` (the
standard fix for the Next.js-`esnext`-tsconfig-vs-ts-node conflict) did
**not** change the error at all — proving `ts-node --transpile-only
prisma/seed.ts` (no other flags) never reads that package.json block in this
environment (ts-node 10.9.2 / Node 22.17.0 / npm-script invocation). Passing
the exact same compiler options via the CLI flag `--compiler-options`
instead **did** fix it, immediately and reproducibly. Fix: put
`--compiler-options '{"module":"CommonJS","moduleResolution":"node"}'`
directly in both the `db:seed` script and the `prisma.seed` field (the
latter is what Prisma's own CLI spawns for `prisma db seed` /
`prisma migrate dev`'s auto-seed, independent of `npm run db:seed`) — no
`"ts-node"` package.json block, since it's silently ignored in this setup.

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: a working `npm run db:seed` (no code interface — this is a config-only task).

- [x] **Step 1: Reproduce the failure**

Run: `npm run db:seed 2>&1 | tail -20`
Result: `TypeError: Unknown file extension ".ts"` thrown from
`node:internal/modules/esm/get_format`, confirmed before fixing.

- [x] **Step 2: Confirm the package.json `"ts-node"` block does NOT fix it (ruled out)**

Added `"ts-node": { "esm": false, "compilerOptions": { "module": "CommonJS", "moduleResolution": "node" } }` to `package.json` and re-ran — **identical error, byte-for-byte**. Confirmed via `node prisma/seed.ts` (no ts-node at all) failing the same way, and via `npx ts-node --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' prisma/seed.ts` (CLI flag, no package.json block) **succeeding** — isolating the fix to the CLI flag, not the package.json config surface. The non-functional `"ts-node"` block was removed rather than left in as dead/misleading config.

- [x] **Step 3: Apply the working fix**

In `package.json`:
```json
"db:seed": "ts-node --transpile-only --compiler-options \"{\\\"module\\\":\\\"CommonJS\\\",\\\"moduleResolution\\\":\\\"node\\\"}\" prisma/seed.ts",
```
and:
```json
"prisma": {
  "seed": "ts-node --transpile-only --compiler-options \"{\\\"module\\\":\\\"CommonJS\\\",\\\"moduleResolution\\\":\\\"node\\\"}\" prisma/seed.ts"
},
```
Also added `"dotenv": "^17.4.2"` to `devDependencies` (present transitively in `node_modules` already, but not declared as a direct dependency — needed as a direct import by Task 2's `client.ts`).

- [x] **Step 4: Verify the fix**

Ran `npm run db:seed` twice in a row (idempotency check per the script's own docstring): both runs complete cleanly, printing the "Seed complete." banner, no duplicate-row errors. Ran `npm run typecheck`: only the 2 pre-existing `app/api/products/route.ts:118` errors, nothing new.

- [x] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "fix: unbreak npm run db:seed (ts-node --compiler-options, not the package.json ts-node block)"
git push origin main
```

---

## Task 2: Legacy API client (auth, pagination, bounded concurrency)

**Files:**
- Create: `prisma/legacy-import/client.ts`
- Test: `prisma/legacy-import/client.test.ts`

**Interfaces:**
- Produces:
  - `interface LegacyPagination { page: number; page_size: number; total_count: number; total_pages: number; has_next: boolean; has_previous: boolean }`
  - `interface LegacyListResponse<T> { status: string; data: T[]; message: string; pagination: LegacyPagination | null }`
  - `interface LegacyClientConfig { baseUrl: string; apiToken: string }`
  - `function loadLegacyClientConfig(envFilePath?: string): LegacyClientConfig` — reads `API_TOKEN`/`WEBSITE_URL` via dotenv, throws `Error` if either is missing.
  - `function createLegacyClient(config: LegacyClientConfig): LegacyClient` where
    `interface LegacyClient { fetchJson<T>(path: string, params?: Record<string, string | number>): Promise<T>; fetchAllPages<T>(path: string, params?: Record<string, string | number>, pageSize?: number): Promise<T[]>; }`
  - `async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]>`

- [ ] **Step 1: Write the failing tests**

```typescript
// prisma/legacy-import/client.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLegacyClient, loadLegacyClientConfig, mapWithConcurrency } from "./client";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("loadLegacyClientConfig", () => {
  it("reads API_TOKEN and WEBSITE_URL from the given env file", () => {
    const tmpFile = path.join(os.tmpdir(), `legacy-env-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, "API_TOKEN=abc123\nWEBSITE_URL=https://example.com/\n");

    const config = loadLegacyClientConfig(tmpFile);

    expect(config).toEqual({ baseUrl: "https://example.com/api/v4", apiToken: "abc123" });
    fs.unlinkSync(tmpFile);
  });

  it("throws if API_TOKEN is missing", () => {
    const tmpFile = path.join(os.tmpdir(), `legacy-env-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, "WEBSITE_URL=https://example.com/\n");

    expect(() => loadLegacyClientConfig(tmpFile)).toThrow(/API_TOKEN/);
    fs.unlinkSync(tmpFile);
  });
});

describe("createLegacyClient", () => {
  const config = { baseUrl: "https://example.com/api/v4", apiToken: "abc123" };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the Api-Key auth header and parses JSON", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "success", data: { id: 1 } }),
    });

    const client = createLegacyClient(config);
    const result = await client.fetchJson<{ status: string; data: { id: number } }>("/categories/1/");

    expect(result.data.id).toBe(1);
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://example.com/api/v4/categories/1/");
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Api-Key abc123");
  });

  it("throws on a non-2xx response", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Unauthorized" }),
    });

    const client = createLegacyClient(config);
    await expect(client.fetchJson("/categories/")).rejects.toThrow(/401/);
  });

  it("fetchAllPages loops until has_next is false", async () => {
    const page1 = { status: "success", data: [{ id: 1 }, { id: 2 }], message: "", pagination: { page: 1, page_size: 2, total_count: 3, total_pages: 2, has_next: true, has_previous: false } };
    const page2 = { status: "success", data: [{ id: 3 }], message: "", pagination: { page: 2, page_size: 2, total_count: 3, total_pages: 2, has_next: false, has_previous: true } };
    const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => page1 });
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => page2 });

    const client = createLegacyClient(config);
    const rows = await client.fetchAllPages<{ id: number }>("/brands/", {}, 2);

    expect(rows.map((r) => r.id)).toEqual([1, 2, 3]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("mapWithConcurrency", () => {
  it("runs at most `limit` items concurrently and preserves result order", async () => {
    let active = 0;
    let maxActive = 0;

    const results = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (n) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return n * 10;
    });

    expect(results).toEqual([10, 20, 30, 40, 50]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `dotenv -e .env.test -- vitest run prisma/legacy-import/client.test.ts`
Expected: FAIL — `Cannot find module './client'` (the file doesn't exist yet).

- [ ] **Step 3: Implement the client**

```typescript
// prisma/legacy-import/client.ts
import dotenv from "dotenv";
import fs from "node:fs";

export interface LegacyPagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface LegacyListResponse<T> {
  status: string;
  data: T[];
  message: string;
  pagination: LegacyPagination | null;
}

export interface LegacyClientConfig {
  baseUrl: string;
  apiToken: string;
}

export function loadLegacyClientConfig(envFilePath = "actuall_old_webSite_api_token.txt"): LegacyClientConfig {
  const parsed = dotenv.parse(fs.readFileSync(envFilePath));

  const apiToken = parsed.API_TOKEN;
  if (!apiToken) throw new Error(`Missing API_TOKEN in ${envFilePath}`);

  const websiteUrl = parsed.WEBSITE_URL;
  if (!websiteUrl) throw new Error(`Missing WEBSITE_URL in ${envFilePath}`);

  const baseUrl = `${websiteUrl.replace(/\/$/, "")}/api/v4`;
  return { baseUrl, apiToken };
}

export interface LegacyClient {
  fetchJson<T>(path: string, params?: Record<string, string | number>): Promise<T>;
  fetchAllPages<T>(path: string, params?: Record<string, string | number>, pageSize?: number): Promise<T[]>;
}

export function createLegacyClient(config: LegacyClientConfig): LegacyClient {
  function buildUrl(path: string, params?: Record<string, string | number>): string {
    const url = new URL(`${config.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params ?? {})) {
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  async function fetchJson<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const url = buildUrl(path, params);
    const response = await fetch(url, {
      headers: { Authorization: `Api-Key ${config.apiToken}` },
    });

    if (!response.ok) {
      throw new Error(`Legacy API request failed: ${response.status} ${path}`);
    }

    return (await response.json()) as T;
  }

  async function fetchAllPages<T>(path: string, params: Record<string, string | number> = {}, pageSize = 100): Promise<T[]> {
    const rows: T[] = [];
    let page = 1;

    while (true) {
      const response = await fetchJson<LegacyListResponse<T>>(path, { ...params, page, page_size: pageSize });
      rows.push(...response.data);

      if (!response.pagination?.has_next) break;
      page += 1;
    }

    return rows;
  }

  return { fetchJson, fetchAllPages };
}

export async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await fn(items[currentIndex]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `dotenv -e .env.test -- vitest run prisma/legacy-import/client.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add prisma/legacy-import/client.ts prisma/legacy-import/client.test.ts
git commit -m "feat: add legacy shop API client (auth, pagination, bounded concurrency)"
```

---

## Task 3: Legacy API response types

**Files:**
- Create: `prisma/legacy-import/types.ts`

No test for this task — it's type-only, structural, and every field used by
later tasks' mappers is exercised (and thus type-checked) by those tasks' own
tests.

- [ ] **Step 1: Write the types**

```typescript
// prisma/legacy-import/types.ts

export interface LegacyCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  image_url: string | null;
  icon_url: string | null;
  image_alt: string | null;
  available: boolean;
  categories_menu_show: boolean;
  top_menu_separate_show: boolean;
  order: number;
  level: number;
  seo_title: string | null;
  seo_description: string | null;
}

export interface LegacyBrand {
  id: number;
  name: string;
  image_url: string | null;
  image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

export interface LegacyProductListItem {
  id: number;
}

export interface LegacyProductImage {
  id: number;
  image: string;
  image_alt: string;
  default: boolean;
  order: number;
}

export interface LegacyVariantAttribute {
  id: number;
  name: string;
  value: string;
  order: number;
}

export interface LegacyProductVariant {
  id: number;
  product_id: number;
  price: number;
  compare_at_price: number | null;
  stock: number;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  barcode: string;
  product_identifier: string;
  processing_time: number;
  is_default: boolean;
  image: { id: number; image: string; image_alt: string } | null;
  attributes: LegacyVariantAttribute[];
}

export interface LegacyProductDetail {
  id: number;
  name: string;
  english_name: string | null;
  slug: string;
  description: string | null;
  analysis: string | null;
  main_category: { id: number; name: string };
  other_categories: { id: number; name: string }[];
  brand: { id: number; name: string } | null;
  is_digital: boolean;
  price: number;
  compare_at_price: number | null;
  special_offer: boolean;
  special_offer_end: string | null;
  cost_per_item: number | null;
  batch_size: number;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  barcode: string;
  available: boolean;
  show_price: boolean;
  has_variants: boolean;
  stock: number;
  stock_type: { value: "unlimited" | "limited" | "out_of_stock" | "call"; label: string };
  min_order_quantity: number | null;
  max_order_quantity: number | null;
  guarantee: string | null;
  product_identifier: string;
  processing_time: number;
  seo_title: string | null;
  seo_description: string | null;
  views: number;
  tags: string[];
  images: LegacyProductImage[];
  variants: LegacyProductVariant[];
}

export interface LegacyCustomer {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string;
  national_number: string | null;
  card_number: string | null;
  is_active: boolean;
  verified: boolean;
  receive_newsletters: boolean;
  management_sms_notifications: boolean;
  management_email_notifications: boolean;
  referer: string | null;
  creation_method: string | null;
  date_joined: string;
}

export interface LegacyOrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  variant_id: number | null;
  variant_name: string | null;
  quantity: number;
  price: number;
  compare_at_price: number | null;
  total_price: number;
  weight: number | null;
}

export interface LegacyOrder {
  id: number;
  customer_name: string;
  customer_phone: string;
  status: "processing" | "finished" | "canceled" | string;
  payment_method: string | null;
  payment_status: "pending" | "paid" | string;
  psp: string | null;
  creation_date: string;
  shipping_method_name: string | null;
  final_price: number;
  referer: string | null;
  shipping_tracking_code: string | null;
  shipping_first_name: string | null;
  shipping_last_name: string | null;
  shipping_phone_number: string | null;
  shipping_address: string | null;
  shipping_province: string | null;
  shipping_city: string | null;
  shipping_zip_code: string | null;
  items: LegacyOrderItem[];
}

export interface LegacyOrderPayment {
  id: number;
  mixin_transaction_number: string;
  order_id: number;
  creation_date: string;
  price: number;
  method: string | null;
  method_display: string | null;
  status: "initiated" | "sent" | "completed" | "failed" | string;
  psp: string | null;
  psp_display: string | null;
  transaction_number: string | null;
  card_number: string | null;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no new errors (only the 2 pre-existing `app/api/products/route.ts:118` errors that predate this work).

- [ ] **Step 3: Commit**

```bash
git add prisma/legacy-import/types.ts
git commit -m "feat: add legacy shop API response types"
```

---

## Task 4: Category mapper + apply function

**Files:**
- Create: `prisma/legacy-import/categories.ts`
- Test: `prisma/legacy-import/categories.test.ts`

**Interfaces:**
- Consumes: `LegacyCategory` from Task 3; `PrismaClient` from `@prisma/client`.
- Produces:
  - `function mapLegacyCategory(raw: LegacyCategory, parentId: number | null): Prisma.CategoryUncheckedCreateInput`
  - `async function importCategories(prisma: PrismaClient, rows: LegacyCategory[]): Promise<Map<number, number>>` — returns `Map<legacyCategoryId, ourCategoryId>`.

- [ ] **Step 1: Write the failing test**

```typescript
// prisma/legacy-import/categories.test.ts
import { describe, it, expect } from "vitest";
import { mapLegacyCategory } from "./categories";
import type { LegacyCategory } from "./types";

const raw: LegacyCategory = {
  id: 79,
  name: "گوشی موبایل",
  slug: "گوشی-موبایل",
  description: null,
  parent_id: null,
  image_url: null,
  icon_url: null,
  image_alt: null,
  available: true,
  categories_menu_show: true,
  top_menu_separate_show: false,
  order: 0,
  level: 0,
  seo_title: null,
  seo_description: null,
};

describe("mapLegacyCategory", () => {
  it("maps direct fields and applies the resolved parent id", () => {
    const mapped = mapLegacyCategory(raw, 5);

    expect(mapped).toEqual({
      name: "گوشی موبایل",
      slug: "گوشی-موبایل",
      description: null,
      parentId: 5,
      imageUrl: null,
      iconUrl: null,
      imageAlt: null,
      available: true,
      categoriesMenuShow: true,
      topMenuSeparateShow: false,
      order: 0,
      level: 0,
      seoTitle: null,
      seoDescription: null,
    });
  });

  it("maps a null parent id through unchanged", () => {
    const mapped = mapLegacyCategory(raw, null);
    expect(mapped.parentId).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `dotenv -e .env.test -- vitest run prisma/legacy-import/categories.test.ts`
Expected: FAIL — `Cannot find module './categories'`.

- [ ] **Step 3: Implement**

```typescript
// prisma/legacy-import/categories.ts
import type { Prisma, PrismaClient } from "@prisma/client";
import type { LegacyCategory } from "./types";

export function mapLegacyCategory(raw: LegacyCategory, parentId: number | null): Prisma.CategoryUncheckedCreateInput {
  return {
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    parentId,
    imageUrl: raw.image_url,
    iconUrl: raw.icon_url,
    imageAlt: raw.image_alt,
    available: raw.available,
    categoriesMenuShow: raw.categories_menu_show,
    topMenuSeparateShow: raw.top_menu_separate_show,
    order: raw.order,
    level: raw.level,
    seoTitle: raw.seo_title,
    seoDescription: raw.seo_description,
  };
}

export async function importCategories(prisma: PrismaClient, rows: LegacyCategory[]): Promise<Map<number, number>> {
  const idMap = new Map<number, number>();
  const sorted = [...rows].sort((a, b) => a.level - b.level);

  for (const raw of sorted) {
    const parentId = raw.parent_id !== null ? idMap.get(raw.parent_id) ?? null : null;
    const data = mapLegacyCategory(raw, parentId);

    const category = await prisma.category.upsert({
      where: { slug: raw.slug },
      update: data,
      create: data,
    });

    idMap.set(raw.id, category.id);
  }

  return idMap;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `dotenv -e .env.test -- vitest run prisma/legacy-import/categories.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add prisma/legacy-import/categories.ts prisma/legacy-import/categories.test.ts
git commit -m "feat: add legacy category import (mapper + parent-first upsert)"
```

---

## Task 5: Brand mapper (slug derivation) + apply function

**Files:**
- Create: `prisma/legacy-import/brands.ts`
- Test: `prisma/legacy-import/brands.test.ts`

**Interfaces:**
- Consumes: `LegacyBrand` from Task 3.
- Produces:
  - `function deriveBrandSlug(name: string, legacyId: number, existingSlugs: Set<string>): string`
  - `function mapLegacyBrand(raw: LegacyBrand, slug: string): Prisma.BrandUncheckedCreateInput`
  - `async function importBrands(prisma: PrismaClient, rows: LegacyBrand[]): Promise<Map<number, number>>` — returns `Map<legacyBrandId, ourBrandId>`.

- [ ] **Step 1: Write the failing tests**

```typescript
// prisma/legacy-import/brands.test.ts
import { describe, it, expect } from "vitest";
import { deriveBrandSlug, mapLegacyBrand } from "./brands";
import type { LegacyBrand } from "./types";

describe("deriveBrandSlug", () => {
  it("lowercases and dashes an ASCII name", () => {
    expect(deriveBrandSlug("COMTEL", 40, new Set())).toBe("comtel");
  });

  it("dashes spaces and pipes in a mixed name", () => {
    expect(deriveBrandSlug("اوآک | OAK", 39, new Set())).toBe("اوآک-oak");
  });

  it("appends the legacy id on collision", () => {
    const existing = new Set(["comtel"]);
    expect(deriveBrandSlug("COMTEL", 41, existing)).toBe("comtel-41");
  });
});

describe("mapLegacyBrand", () => {
  const raw: LegacyBrand = {
    id: 40,
    name: "COMTEL",
    image_url: null,
    image_alt: "",
    seo_title: null,
    seo_description: null,
  };

  it("maps direct fields with the given slug", () => {
    expect(mapLegacyBrand(raw, "comtel")).toEqual({
      name: "COMTEL",
      slug: "comtel",
      imageUrl: null,
      imageAlt: "",
      iconUrl: null,
      seoTitle: null,
      seoDescription: null,
      isActive: true,
      order: 0,
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `dotenv -e .env.test -- vitest run prisma/legacy-import/brands.test.ts`
Expected: FAIL — `Cannot find module './brands'`.

- [ ] **Step 3: Implement**

```typescript
// prisma/legacy-import/brands.ts
import type { Prisma, PrismaClient } from "@prisma/client";
import type { LegacyBrand } from "./types";

export function deriveBrandSlug(name: string, legacyId: number, existingSlugs: Set<string>): string {
  const base = name.trim().replace(/[\s|]+/g, "-").toLowerCase();
  return existingSlugs.has(base) ? `${base}-${legacyId}` : base;
}

export function mapLegacyBrand(raw: LegacyBrand, slug: string): Prisma.BrandUncheckedCreateInput {
  return {
    name: raw.name,
    slug,
    imageUrl: raw.image_url,
    imageAlt: raw.image_alt,
    iconUrl: null,
    seoTitle: raw.seo_title,
    seoDescription: raw.seo_description,
    isActive: true,
    order: 0,
  };
}

export async function importBrands(prisma: PrismaClient, rows: LegacyBrand[]): Promise<Map<number, number>> {
  const idMap = new Map<number, number>();
  const usedSlugs = new Set<string>();

  for (const raw of rows) {
    const slug = deriveBrandSlug(raw.name, raw.id, usedSlugs);
    usedSlugs.add(slug);
    const data = mapLegacyBrand(raw, slug);

    const brand = await prisma.brand.upsert({
      where: { slug },
      update: data,
      create: data,
    });

    idMap.set(raw.id, brand.id);
  }

  return idMap;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `dotenv -e .env.test -- vitest run prisma/legacy-import/brands.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add prisma/legacy-import/brands.ts prisma/legacy-import/brands.test.ts
git commit -m "feat: add legacy brand import (derived slug + upsert)"
```

---

## Task 6: Product mapper (product + images + variants) + apply function

**Files:**
- Create: `prisma/legacy-import/products.ts`
- Test: `prisma/legacy-import/products.test.ts`

**Interfaces:**
- Consumes: `LegacyProductDetail` from Task 3; category/brand id maps from Tasks 4–5.
- Produces:
  - `function mapVariantAttributes(attributes: { name: string; value: string }[]): { color: string | null; storage: string | null }`
  - `function normalizeUniqueText(value: string | null | undefined): string | null` — `""`/`null`/`undefined` → `null`.
  - `function mapLegacyProduct(raw: LegacyProductDetail, ctx: { mainCategoryId: number | null; otherCategoryIds: number[]; brandId: number | null }): Prisma.ProductUncheckedCreateInput`
  - `function mapStockType(value: string): StockType`
  - `async function importProduct(prisma: PrismaClient, raw: LegacyProductDetail, categoryIdMap: Map<number, number>, brandIdMap: Map<number, number>): Promise<{ productId: number; variantIdMap: Map<number, number> }>`

- [ ] **Step 1: Write the failing tests**

```typescript
// prisma/legacy-import/products.test.ts
import { describe, it, expect } from "vitest";
import { mapVariantAttributes, normalizeUniqueText, mapStockType, mapLegacyProduct } from "./products";
import { StockType } from "@prisma/client";
import type { LegacyProductDetail } from "./types";

describe("mapVariantAttributes", () => {
  it("maps رنگ to color and leaves storage null when it's the only attribute", () => {
    const result = mapVariantAttributes([{ name: "رنگ", value: "مشکی / Charcoal" }]);
    expect(result).toEqual({ color: "مشکی / Charcoal", storage: null });
  });

  it("joins non-رنگ attributes into storage", () => {
    const result = mapVariantAttributes([
      { name: "رنگ", value: "سفید" },
      { name: "سرور", value: "Vietnam" },
      { name: "نوع", value: "دو سیم‌کارت" },
    ]);
    expect(result).toEqual({ color: "سفید", storage: "سرور: Vietnam | نوع: دو سیم‌کارت" });
  });

  it("returns nulls for no attributes", () => {
    expect(mapVariantAttributes([])).toEqual({ color: null, storage: null });
  });
});

describe("normalizeUniqueText", () => {
  it("turns empty string into null", () => {
    expect(normalizeUniqueText("")).toBeNull();
  });

  it("turns null/undefined into null", () => {
    expect(normalizeUniqueText(null)).toBeNull();
    expect(normalizeUniqueText(undefined)).toBeNull();
  });

  it("passes non-empty strings through", () => {
    expect(normalizeUniqueText("6941234567890")).toBe("6941234567890");
  });
});

describe("mapStockType", () => {
  it("maps all 4 legacy values", () => {
    expect(mapStockType("unlimited")).toBe(StockType.UNLIMITED);
    expect(mapStockType("limited")).toBe(StockType.LIMITED);
    expect(mapStockType("out_of_stock")).toBe(StockType.OUT_OF_STOCK);
    expect(mapStockType("call")).toBe(StockType.CALL);
  });
});

describe("mapLegacyProduct", () => {
  const raw: LegacyProductDetail = {
    id: 384,
    name: "گوشی موبایل سامسونگ",
    english_name: "Galaxy A37",
    slug: "galaxy-a37",
    description: "desc",
    analysis: null,
    main_category: { id: 8, name: "SAMSUNG" },
    other_categories: [{ id: 80, name: "موبایل" }],
    brand: { id: 2, name: "سامسونگ" },
    is_digital: false,
    price: 81300000,
    compare_at_price: 81300000,
    special_offer: false,
    special_offer_end: null,
    cost_per_item: null,
    batch_size: 1,
    length: null,
    width: null,
    height: null,
    weight: null,
    barcode: "",
    available: true,
    show_price: false,
    has_variants: true,
    stock: 0,
    stock_type: { value: "limited", label: "محدود" },
    min_order_quantity: null,
    max_order_quantity: null,
    guarantee: "گارانتی 18 ماهه",
    product_identifier: "",
    processing_time: 0,
    seo_title: "seo title",
    seo_description: "seo desc",
    views: 12,
    tags: [],
    images: [],
    variants: [],
  };

  it("maps direct fields and resolves category/brand ids", () => {
    const mapped = mapLegacyProduct(raw, { mainCategoryId: 100, otherCategoryIds: [101], brandId: 200 });

    expect(mapped.name).toBe("گوشی موبایل سامسونگ");
    expect(mapped.englishName).toBe("Galaxy A37");
    expect(mapped.slug).toBe("galaxy-a37");
    expect(mapped.mainCategoryId).toBe(100);
    expect(mapped.brandId).toBe(200);
    expect(mapped.barcode).toBeNull();
    expect(mapped.productIdentifier).toBeNull();
    expect(mapped.stockType).toBe(StockType.LIMITED);
    expect(mapped.hasVariants).toBe(true);
    expect(mapped.views).toBe(12);
  });

  it("maps a null brand through as null", () => {
    const mapped = mapLegacyProduct({ ...raw, brand: null }, { mainCategoryId: 100, otherCategoryIds: [], brandId: null });
    expect(mapped.brandId).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `dotenv -e .env.test -- vitest run prisma/legacy-import/products.test.ts`
Expected: FAIL — `Cannot find module './products'`.

- [ ] **Step 3: Implement**

```typescript
// prisma/legacy-import/products.ts
import { StockType, type Prisma, type PrismaClient } from "@prisma/client";
import type { LegacyProductDetail, LegacyVariantAttribute } from "./types";

export function normalizeUniqueText(value: string | null | undefined): string | null {
  return value ? value : null;
}

export function mapStockType(value: string): StockType {
  switch (value) {
    case "unlimited":
      return StockType.UNLIMITED;
    case "limited":
      return StockType.LIMITED;
    case "out_of_stock":
      return StockType.OUT_OF_STOCK;
    case "call":
      return StockType.CALL;
    default:
      throw new Error(`Unknown legacy stock_type value: ${value}`);
  }
}

export function mapVariantAttributes(attributes: Pick<LegacyVariantAttribute, "name" | "value">[]): { color: string | null; storage: string | null } {
  const colorAttr = attributes.find((a) => a.name === "رنگ");
  const otherAttrs = attributes.filter((a) => a.name !== "رنگ");

  return {
    color: colorAttr ? colorAttr.value : null,
    storage: otherAttrs.length > 0 ? otherAttrs.map((a) => `${a.name}: ${a.value}`).join(" | ") : null,
  };
}

function round(value: number | null): number | null {
  return value === null ? null : Math.round(value);
}

export function mapLegacyProduct(
  raw: LegacyProductDetail,
  ctx: { mainCategoryId: number | null; otherCategoryIds: number[]; brandId: number | null }
): Prisma.ProductUncheckedCreateInput {
  return {
    name: raw.name,
    englishName: raw.english_name,
    slug: raw.slug,
    description: raw.description,
    analysis: raw.analysis,
    mainCategoryId: ctx.mainCategoryId,
    brandId: ctx.brandId,
    isDigital: raw.is_digital,
    price: raw.price,
    compareAtPrice: raw.compare_at_price,
    specialOffer: raw.special_offer,
    specialOfferEnd: raw.special_offer_end ? new Date(raw.special_offer_end) : null,
    costPerItem: raw.cost_per_item,
    batchSize: raw.batch_size,
    length: round(raw.length),
    width: round(raw.width),
    height: round(raw.height),
    weight: round(raw.weight),
    barcode: normalizeUniqueText(raw.barcode),
    available: raw.available,
    showPrice: raw.show_price,
    hasVariants: raw.has_variants,
    stock: raw.stock,
    stockType: mapStockType(raw.stock_type.value),
    minOrderQuantity: raw.min_order_quantity,
    maxOrderQuantity: raw.max_order_quantity,
    guarantee: raw.guarantee,
    productIdentifier: normalizeUniqueText(raw.product_identifier),
    processingTime: raw.processing_time,
    seoTitle: raw.seo_title,
    seoDescription: raw.seo_description,
    views: raw.views,
  };
}

export async function importProduct(
  prisma: PrismaClient,
  raw: LegacyProductDetail,
  categoryIdMap: Map<number, number>,
  brandIdMap: Map<number, number>
): Promise<{ productId: number; variantIdMap: Map<number, number> }> {
  const mainCategoryId = categoryIdMap.get(raw.main_category.id) ?? null;
  const otherCategoryIds = raw.other_categories.map((c) => categoryIdMap.get(c.id)).filter((id): id is number => id !== undefined);
  const brandId = raw.brand ? brandIdMap.get(raw.brand.id) ?? null : null;

  const data = mapLegacyProduct(raw, { mainCategoryId, otherCategoryIds, brandId });

  const product = await prisma.product.upsert({
    where: { slug: raw.slug },
    update: { ...data, otherCategories: { set: otherCategoryIds.map((id) => ({ id })) } },
    create: { ...data, otherCategories: { connect: otherCategoryIds.map((id) => ({ id })) } },
  });

  // Full replace of images/variants on every run — see spec's Idempotency section.
  await prisma.productVariant.deleteMany({ where: { productId: product.id } });
  await prisma.productImage.deleteMany({ where: { productId: product.id } });

  const legacyImageIdMap = new Map<number, number>();
  for (const image of raw.images) {
    const created = await prisma.productImage.create({
      data: {
        productId: product.id,
        url: image.image,
        altText: image.image_alt,
        isDefault: image.default,
        order: image.order,
      },
    });
    legacyImageIdMap.set(image.id, created.id);
  }

  const variantIdMap = new Map<number, number>();
  for (const variant of raw.variants) {
    const { color, storage } = mapVariantAttributes(variant.attributes);
    const created = await prisma.productVariant.create({
      data: {
        productId: product.id,
        color,
        storage,
        guarantee: raw.guarantee,
        price: variant.price,
        compareAtPrice: variant.compare_at_price,
        stock: variant.stock,
        stockType: variant.stock > 0 ? StockType.LIMITED : StockType.OUT_OF_STOCK,
        barcode: normalizeUniqueText(variant.barcode),
        productIdentifier: normalizeUniqueText(variant.product_identifier),
        isDefault: variant.is_default,
        length: round(variant.length),
        width: round(variant.width),
        height: round(variant.height),
        weight: round(variant.weight),
        processingTime: variant.processing_time,
        imageId: variant.image ? legacyImageIdMap.get(variant.image.id) ?? null : null,
      },
    });
    variantIdMap.set(variant.id, created.id);
  }

  return { productId: product.id, variantIdMap };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `dotenv -e .env.test -- vitest run prisma/legacy-import/products.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add prisma/legacy-import/products.ts prisma/legacy-import/products.test.ts
git commit -m "feat: add legacy product import (product + images + variants, full child replace)"
```

---

## Task 7: Customer mapper + apply function

**Files:**
- Create: `prisma/legacy-import/customers.ts`
- Test: `prisma/legacy-import/customers.test.ts`

**Interfaces:**
- Consumes: `LegacyCustomer` from Task 3.
- Produces:
  - `function normalizePhoneNumber(raw: string): string` — `"09923286434"` → `"+989923286434"`.
  - `function mapLegacyCustomer(raw: LegacyCustomer, passwordHash: string): Prisma.UserUncheckedCreateInput`
  - `const IMPORTED_CUSTOMER_PASSWORD = "Imported@12345"`
  - `async function importCustomers(prisma: PrismaClient, rows: LegacyCustomer[]): Promise<Map<string, number>>` — returns `Map<normalizedPhoneNumber, ourUserId>`.

- [ ] **Step 1: Write the failing tests**

```typescript
// prisma/legacy-import/customers.test.ts
import { describe, it, expect } from "vitest";
import { normalizePhoneNumber, mapLegacyCustomer } from "./customers";
import { Role } from "@prisma/client";
import type { LegacyCustomer } from "./types";

describe("normalizePhoneNumber", () => {
  it("strips a leading 0 and prefixes +98", () => {
    expect(normalizePhoneNumber("09923286434")).toBe("+989923286434");
  });

  it("passes an already-normalized number through unchanged", () => {
    expect(normalizePhoneNumber("+989923286434")).toBe("+989923286434");
  });
});

describe("mapLegacyCustomer", () => {
  const raw: LegacyCustomer = {
    id: 239,
    username: "09923286434",
    first_name: null,
    last_name: null,
    email: null,
    phone_number: "09923286434",
    national_number: null,
    card_number: null,
    is_active: true,
    verified: false,
    receive_newsletters: false,
    management_sms_notifications: false,
    management_email_notifications: false,
    referer: "google",
    creation_method: "website",
    date_joined: "2026-08-01T12:59:22.495122+03:30",
  };

  it("maps to a RETAIL user with a normalized phone number and the given password hash", () => {
    const mapped = mapLegacyCustomer(raw, "hashed-password");

    expect(mapped).toMatchObject({
      role: Role.RETAIL,
      username: "09923286434",
      phoneNumber: "+989923286434",
      passwordHash: "hashed-password",
      email: null,
      isActive: true,
      phoneVerified: false,
      referer: "google",
      creationMethod: "website",
    });
    expect(mapped.createdAt).toEqual(new Date("2026-08-01T12:59:22.495122+03:30"));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `dotenv -e .env.test -- vitest run prisma/legacy-import/customers.test.ts`
Expected: FAIL — `Cannot find module './customers'`.

- [ ] **Step 3: Implement**

```typescript
// prisma/legacy-import/customers.ts
import { Role, type Prisma, type PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { LegacyCustomer } from "./types";

export const IMPORTED_CUSTOMER_PASSWORD = "Imported@12345";

export function normalizePhoneNumber(raw: string): string {
  if (raw.startsWith("+")) return raw;
  return `+98${raw.replace(/^0/, "")}`;
}

export function mapLegacyCustomer(raw: LegacyCustomer, passwordHash: string): Prisma.UserUncheckedCreateInput {
  return {
    role: Role.RETAIL,
    username: raw.username,
    email: raw.email,
    passwordHash,
    firstName: raw.first_name,
    lastName: raw.last_name,
    phoneNumber: normalizePhoneNumber(raw.phone_number),
    phoneVerified: raw.verified,
    nationalNumber: raw.national_number,
    cardNumber: raw.card_number,
    isActive: raw.is_active,
    receiveNewsletters: raw.receive_newsletters,
    managementSmsNotif: raw.management_sms_notifications,
    managementEmailNotif: raw.management_email_notifications,
    referer: raw.referer,
    creationMethod: raw.creation_method,
    createdAt: new Date(raw.date_joined),
  };
}

export async function importCustomers(prisma: PrismaClient, rows: LegacyCustomer[]): Promise<Map<string, number>> {
  const idMap = new Map<string, number>();
  const passwordHash = await bcrypt.hash(IMPORTED_CUSTOMER_PASSWORD, 10);

  for (const raw of rows) {
    const data = mapLegacyCustomer(raw, passwordHash);

    const user = await prisma.user.upsert({
      where: { phoneNumber: data.phoneNumber },
      update: data,
      create: data,
    });

    idMap.set(data.phoneNumber, user.id);
  }

  return idMap;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `dotenv -e .env.test -- vitest run prisma/legacy-import/customers.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add prisma/legacy-import/customers.ts prisma/legacy-import/customers.test.ts
git commit -m "feat: add legacy customer import (RETAIL users, fixed dev password)"
```

---

## Task 8: Order mapper (status/payment mapping, address dedupe) + apply function

**Files:**
- Create: `prisma/legacy-import/orders.ts`
- Test: `prisma/legacy-import/orders.test.ts`

**Interfaces:**
- Consumes: `LegacyOrder`, `LegacyOrderItem`, `LegacyOrderPayment` from Task 3; user id map from Task 7; product/variant id maps from Task 6.
- Produces:
  - `function mapOrderStatus(value: string): OrderStatus`
  - `function mapPaymentStatusFromOrder(value: string): PaymentStatus`
  - `function mapPaymentStatus(value: string): PaymentStatus`
  - `function computeOrderTotals(raw: LegacyOrder): { subtotal: number; shippingPrice: number; totalAmount: number }`
  - `function legacyOrderNumber(legacyOrderId: number): string` — `` `LEGACY-${legacyOrderId}` ``
  - `async function importOrders(prisma: PrismaClient, orders: LegacyOrder[], payments: LegacyOrderPayment[], userIdMap: Map<string, number>, productIdMap: Map<number, number>, variantIdMap: Map<number, number>): Promise<void>`

- [ ] **Step 1: Write the failing tests**

```typescript
// prisma/legacy-import/orders.test.ts
import { describe, it, expect } from "vitest";
import { mapOrderStatus, mapPaymentStatusFromOrder, mapPaymentStatus, computeOrderTotals, legacyOrderNumber } from "./orders";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import type { LegacyOrder } from "./types";

describe("mapOrderStatus", () => {
  it("maps the 3 observed legacy statuses", () => {
    expect(mapOrderStatus("processing")).toBe(OrderStatus.PROCESSING);
    expect(mapOrderStatus("finished")).toBe(OrderStatus.COMPLETED);
    expect(mapOrderStatus("canceled")).toBe(OrderStatus.CANCELED);
  });

  it("throws on an unmapped status", () => {
    expect(() => mapOrderStatus("bogus")).toThrow(/Unknown legacy order status/);
  });
});

describe("mapPaymentStatusFromOrder", () => {
  it("maps the 2 observed legacy order payment_status values", () => {
    expect(mapPaymentStatusFromOrder("pending")).toBe(PaymentStatus.INITIATED);
    expect(mapPaymentStatusFromOrder("paid")).toBe(PaymentStatus.COMPLETED);
  });
});

describe("mapPaymentStatus", () => {
  it("maps all 4 observed legacy order-payment status values", () => {
    expect(mapPaymentStatus("initiated")).toBe(PaymentStatus.INITIATED);
    expect(mapPaymentStatus("sent")).toBe(PaymentStatus.SENT);
    expect(mapPaymentStatus("completed")).toBe(PaymentStatus.COMPLETED);
    expect(mapPaymentStatus("failed")).toBe(PaymentStatus.FAILED);
  });
});

describe("legacyOrderNumber", () => {
  it("prefixes the legacy order id", () => {
    expect(legacyOrderNumber(4641)).toBe("LEGACY-4641");
  });
});

describe("computeOrderTotals", () => {
  const raw: LegacyOrder = {
    id: 4641,
    customer_name: "علی ملایی",
    customer_phone: "09112721836",
    status: "finished",
    payment_method: "online",
    payment_status: "paid",
    psp: "zarinpal",
    creation_date: "2026-07-25T11:11:08.477127+03:30",
    shipping_method_name: "MAH X",
    final_price: 45350000,
    referer: "Torob",
    shipping_tracking_code: "10010058232817",
    shipping_first_name: "علی",
    shipping_last_name: "ملایی",
    shipping_phone_number: "09112721836",
    shipping_address: "Golestan",
    shipping_province: "گلستان",
    shipping_city: "آزاد شهر",
    shipping_zip_code: "4964117418",
    items: [
      { id: 1, product_id: 64, product_name: "Galaxy A16", variant_id: 344, variant_name: "Galaxy A16 - سبز", quantity: 1, price: 45000000, compare_at_price: 45450000, total_price: 45000000, weight: null },
    ],
  };

  it("derives subtotal from items, shippingPrice from the final_price gap", () => {
    expect(computeOrderTotals(raw)).toEqual({ subtotal: 45000000, shippingPrice: 350000, totalAmount: 45350000 });
  });

  it("clamps shippingPrice to 0 when final_price is less than the item subtotal", () => {
    expect(computeOrderTotals({ ...raw, final_price: 44000000 })).toEqual({ subtotal: 45000000, shippingPrice: 0, totalAmount: 44000000 });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `dotenv -e .env.test -- vitest run prisma/legacy-import/orders.test.ts`
Expected: FAIL — `Cannot find module './orders'`.

- [ ] **Step 3: Implement**

```typescript
// prisma/legacy-import/orders.ts
import { OrderStatus, PaymentStatus, B2BPaymentTerm, Role, type PrismaClient } from "@prisma/client";
import type { LegacyOrder, LegacyOrderPayment } from "./types";
import { normalizePhoneNumber, IMPORTED_CUSTOMER_PASSWORD } from "./customers";
import bcrypt from "bcryptjs";

export function mapOrderStatus(value: string): OrderStatus {
  switch (value) {
    case "processing":
      return OrderStatus.PROCESSING;
    case "finished":
      return OrderStatus.COMPLETED;
    case "canceled":
      return OrderStatus.CANCELED;
    default:
      throw new Error(`Unknown legacy order status: ${value}`);
  }
}

export function mapPaymentStatusFromOrder(value: string): PaymentStatus {
  switch (value) {
    case "pending":
      return PaymentStatus.INITIATED;
    case "paid":
      return PaymentStatus.COMPLETED;
    default:
      throw new Error(`Unknown legacy order payment_status: ${value}`);
  }
}

export function mapPaymentStatus(value: string): PaymentStatus {
  switch (value) {
    case "initiated":
      return PaymentStatus.INITIATED;
    case "sent":
      return PaymentStatus.SENT;
    case "completed":
      return PaymentStatus.COMPLETED;
    case "failed":
      return PaymentStatus.FAILED;
    default:
      throw new Error(`Unknown legacy order-payment status: ${value}`);
  }
}

export function legacyOrderNumber(legacyOrderId: number): string {
  return `LEGACY-${legacyOrderId}`;
}

export function computeOrderTotals(raw: LegacyOrder): { subtotal: number; shippingPrice: number; totalAmount: number } {
  const subtotal = raw.items.reduce((sum, item) => sum + item.total_price, 0);
  const totalAmount = raw.final_price;
  const shippingPrice = Math.max(0, totalAmount - subtotal);
  return { subtotal, shippingPrice, totalAmount };
}

async function resolveOrderUserId(prisma: PrismaClient, raw: LegacyOrder, userIdMap: Map<string, number>): Promise<number> {
  const normalizedPhone = normalizePhoneNumber(raw.customer_phone);
  const existing = userIdMap.get(normalizedPhone);
  if (existing) return existing;

  const [firstName, ...rest] = raw.customer_name.split(" ");
  const passwordHash = await bcrypt.hash(IMPORTED_CUSTOMER_PASSWORD, 10);
  const created = await prisma.user.upsert({
    where: { phoneNumber: normalizedPhone },
    update: {},
    create: {
      role: Role.RETAIL,
      username: normalizedPhone,
      phoneNumber: normalizedPhone,
      passwordHash,
      firstName: firstName ?? null,
      lastName: rest.length > 0 ? rest.join(" ") : null,
    },
  });

  userIdMap.set(normalizedPhone, created.id);
  return created.id;
}

async function resolveOrderAddressId(prisma: PrismaClient, raw: LegacyOrder, userId: number): Promise<number | null> {
  if (!raw.shipping_address) return null;

  const existing = await prisma.address.findFirst({ where: { userId, address: raw.shipping_address } });
  if (existing) return existing.id;

  const isFirstForUser = (await prisma.address.count({ where: { userId } })) === 0;

  const created = await prisma.address.create({
    data: {
      userId,
      firstName: raw.shipping_first_name,
      lastName: raw.shipping_last_name,
      phoneNumber: raw.shipping_phone_number,
      province: raw.shipping_province,
      city: raw.shipping_city ?? "",
      address: raw.shipping_address,
      postalCode: raw.shipping_zip_code,
      isDefault: isFirstForUser,
    },
  });

  return created.id;
}

export async function importOrders(
  prisma: PrismaClient,
  orders: LegacyOrder[],
  payments: LegacyOrderPayment[],
  userIdMap: Map<string, number>,
  productIdMap: Map<number, number>,
  variantIdMap: Map<number, number>
): Promise<void> {
  const orderIdMap = new Map<number, number>();

  for (const raw of orders) {
    const userId = await resolveOrderUserId(prisma, raw, userIdMap);
    const addressId = await resolveOrderAddressId(prisma, raw, userId);
    const { subtotal, shippingPrice, totalAmount } = computeOrderTotals(raw);
    const orderNumber = legacyOrderNumber(raw.id);

    const order = await prisma.order.upsert({
      where: { orderNumber },
      update: {
        userId,
        addressId,
        status: mapOrderStatus(raw.status),
        paymentStatus: mapPaymentStatusFromOrder(raw.payment_status),
        paymentMethod: raw.payment_method,
        paymentTerm: B2BPaymentTerm.CASH,
        firstName: raw.shipping_first_name ?? raw.customer_name,
        lastName: raw.shipping_last_name ?? "",
        phone: raw.shipping_phone_number ?? raw.customer_phone,
        province: raw.shipping_province,
        city: raw.shipping_city ?? "",
        addressText: raw.shipping_address ?? "",
        postalCode: raw.shipping_zip_code,
        shippingMethodName: raw.shipping_method_name,
        shippingPrice,
        trackingCode: raw.shipping_tracking_code,
        subtotal,
        totalAmount,
        referer: raw.referer,
      },
      create: {
        orderNumber,
        userId,
        addressId,
        status: mapOrderStatus(raw.status),
        paymentStatus: mapPaymentStatusFromOrder(raw.payment_status),
        paymentMethod: raw.payment_method,
        paymentTerm: B2BPaymentTerm.CASH,
        firstName: raw.shipping_first_name ?? raw.customer_name,
        lastName: raw.shipping_last_name ?? "",
        phone: raw.shipping_phone_number ?? raw.customer_phone,
        province: raw.shipping_province,
        city: raw.shipping_city ?? "",
        addressText: raw.shipping_address ?? "",
        postalCode: raw.shipping_zip_code,
        shippingMethodName: raw.shipping_method_name,
        shippingPrice,
        trackingCode: raw.shipping_tracking_code,
        subtotal,
        totalAmount,
        referer: raw.referer,
        createdAt: new Date(raw.creation_date),
      },
    });

    orderIdMap.set(raw.id, order.id);

    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    for (const item of raw.items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.product_id !== null ? productIdMap.get(item.product_id) ?? null : null,
          variantId: item.variant_id !== null ? variantIdMap.get(item.variant_id) ?? null : null,
          productName: item.product_name,
          variantName: item.variant_name,
          quantity: item.quantity,
          price: item.price,
          compareAtPrice: item.compare_at_price,
          discountAmount: 0,
          lineTotal: item.total_price,
        },
      });
    }
  }

  await importPayments(prisma, payments, orderIdMap, userIdMap, orders);
}

async function importPayments(
  prisma: PrismaClient,
  payments: LegacyOrderPayment[],
  orderIdMap: Map<number, number>,
  userIdMap: Map<string, number>,
  orders: LegacyOrder[]
): Promise<void> {
  const orderById = new Map(orders.map((o) => [o.id, o]));

  for (const raw of payments) {
    const orderId = orderIdMap.get(raw.order_id);
    const legacyOrder = orderById.get(raw.order_id);
    if (!orderId || !legacyOrder) {
      console.warn(`Skipping legacy payment ${raw.id}: no matching imported order for legacy order_id ${raw.order_id}`);
      continue;
    }

    const userId = userIdMap.get(normalizePhoneNumber(legacyOrder.customer_phone));
    if (!userId) {
      console.warn(`Skipping legacy payment ${raw.id}: no matching imported user for order ${raw.order_id}`);
      continue;
    }

    const transactionNumber = `LEGACY-${raw.mixin_transaction_number}`;

    await prisma.payment.upsert({
      where: { transactionNumber },
      update: {
        orderId,
        userId,
        amount: raw.price,
        method: raw.method,
        methodDisplay: raw.method_display,
        psp: raw.psp,
        pspDisplay: raw.psp_display,
        cardNumber: raw.card_number,
        status: mapPaymentStatus(raw.status),
      },
      create: {
        orderId,
        userId,
        transactionNumber,
        authority: null,
        amount: raw.price,
        method: raw.method,
        methodDisplay: raw.method_display,
        psp: raw.psp,
        pspDisplay: raw.psp_display,
        cardNumber: raw.card_number,
        status: mapPaymentStatus(raw.status),
        createdAt: new Date(raw.creation_date),
      },
    });
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `dotenv -e .env.test -- vitest run prisma/legacy-import/orders.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Typecheck the whole `prisma/legacy-import/` module**

Run: `npm run typecheck`
Expected: no new errors beyond the 2 pre-existing `app/api/products/route.ts:118` ones.

- [ ] **Step 6: Commit**

```bash
git add prisma/legacy-import/orders.ts prisma/legacy-import/orders.test.ts
git commit -m "feat: add legacy order import (orders, items, payments, derived addresses)"
```

---

## Task 9: Wire the legacy import into `prisma/seed.ts`, remove the fake catalog, verify against the live dev DB

**Files:**
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `importCategories`, `importBrands`, `importProduct`, `importCustomers`, `importOrders` from Tasks 4–8; `createLegacyClient`, `loadLegacyClientConfig`, `mapWithConcurrency` from Task 2.

- [ ] **Step 1: Remove the synthetic product catalog, keep the synthetic B2B accounts**

In `prisma/seed.ts`:
- Delete the `seedProducts` function (lines ~265–448) and its `buildTiersForBasePrice`/`upsertVariantPriceTiers`/`PriceTierSpec` helpers (lines ~203–263) — the synthetic iPhone/Galaxy/Xiaomi catalog is superseded by the real legacy catalog.
- Delete `seedSampleOrder` and `seedProductHistory` (lines ~499–582) — they depend on the now-removed synthetic products.
- Keep `seedUsers`, `seedBrands`... **rename `seedBrands`'s synthetic call site** — the synthetic `seedBrands`/`seedCategories` functions stay (they seed the 3 demo brands/categories used nowhere else), but note in a comment that the legacy import below seeds the *real* brand/category catalog separately; the two don't collide because they use different, non-overlapping slugs (`apple`/`samsung`/`xiaomi` vs. the legacy shop's derived slugs).
- Keep `seedCoupons` (still useful demo data, references only `brands.apple`/`samsung`/`xiaomi`, unaffected).

- [ ] **Step 2: Add the legacy import phase to `main()`**

Replace the body of `main()` with:

```typescript
async function main() {
  console.log("Seeding users...");
  const { admin, wholesale, retail } = await seedUsers();

  console.log("Seeding demo brands...");
  const brands = await seedBrands();

  console.log("Seeding demo categories...");
  await seedCategories();

  console.log("Seeding coupons...");
  await seedCoupons(brands);

  console.log("\nImporting real catalog/customer/order data from the legacy shop...");
  const config = loadLegacyClientConfig();
  const client = createLegacyClient(config);

  console.log("  categories...");
  const legacyCategories = await client.fetchAllPages<LegacyCategory>("/categories/");
  const categoryIdMap = await importCategories(prisma, legacyCategories);
  console.log(`  ${legacyCategories.length} categories imported.`);

  console.log("  brands...");
  const legacyBrands = await client.fetchAllPages<LegacyBrand>("/brands/");
  const brandIdMap = await importBrands(prisma, legacyBrands);
  console.log(`  ${legacyBrands.length} brands imported.`);

  console.log("  products (this fetches one detail call per product, ~5 at a time)...");
  const legacyProductIds = (await client.fetchAllPages<{ id: number }>("/products/")).map((p) => p.id);
  const productIdMap = new Map<number, number>();
  const variantIdMap = new Map<number, number>();
  await mapWithConcurrency(legacyProductIds, 5, async (id) => {
    const detail = await client.fetchJson<{ data: LegacyProductDetail }>(`/products/${id}/`);
    const { productId, variantIdMap: productVariantIdMap } = await importProduct(prisma, detail.data, categoryIdMap, brandIdMap);
    productIdMap.set(id, productId);
    for (const [legacyVariantId, ourVariantId] of productVariantIdMap) {
      variantIdMap.set(legacyVariantId, ourVariantId);
    }
  });
  console.log(`  ${legacyProductIds.length} products imported.`);

  console.log("  customers...");
  const legacyCustomers = await client.fetchAllPages<LegacyCustomer>("/customers/");
  const userIdMap = await importCustomers(prisma, legacyCustomers);
  console.log(`  ${legacyCustomers.length} customers imported.`);

  console.log("  orders and payments...");
  const legacyOrders = await client.fetchAllPages<LegacyOrder>("/orders/");
  const legacyPayments = await client.fetchAllPages<LegacyOrderPayment>("/order-payments/");
  await importOrders(prisma, legacyOrders, legacyPayments, userIdMap, productIdMap, variantIdMap);
  console.log(`  ${legacyOrders.length} orders and ${legacyPayments.length} payments imported.`);

  console.log("\nSeed complete.");
  console.log("---------------------------------------------------------");
  console.log(`Admin login:      username=admin           password=Admin@12345`);
  console.log(`Agent login:      username=agent.tehran     password=Agent@12345`);
  console.log(`Wholesale login:  username=${wholesale.username}  password=Wholesale@12345`);
  console.log(`Retail login:     username=retail.john_doe  password=Retail@12345`);
  console.log(`Imported customers: any legacy phone number, password=Imported@12345`);
  console.log("---------------------------------------------------------");
}
```

Add the corresponding imports at the top of `prisma/seed.ts`:

```typescript
import { createLegacyClient, loadLegacyClientConfig, mapWithConcurrency } from "./legacy-import/client";
import { importCategories } from "./legacy-import/categories";
import { importBrands } from "./legacy-import/brands";
import { importProduct } from "./legacy-import/products";
import { importCustomers } from "./legacy-import/customers";
import { importOrders } from "./legacy-import/orders";
import type { LegacyCategory, LegacyBrand, LegacyProductDetail, LegacyCustomer, LegacyOrder, LegacyOrderPayment } from "./legacy-import/types";
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no new errors beyond the 2 pre-existing `app/api/products/route.ts:118` ones.

- [ ] **Step 4: Run the full seed against the local dev database**

Run: `npm run db:seed`
Expected: the script runs to completion, printing progress for each phase, ending with the credentials banner. Runtime is a few minutes (dominated by ~178 sequential-in-batches-of-5 product detail HTTP calls to the live legacy API).

- [ ] **Step 5: Verify row counts against the spec's confirmed 2026-08-13 baseline**

Run:
```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  console.log('categories', await prisma.category.count());
  console.log('brands', await prisma.brand.count());
  console.log('products', await prisma.product.count());
  console.log('variants', await prisma.productVariant.count());
  console.log('users', await prisma.user.count());
  console.log('orders', await prisma.order.count());
  console.log('payments', await prisma.payment.count());
  await prisma.\$disconnect();
})();
"
```
Expected: counts in the same ballpark as the spec's baseline (28+3 categories [legacy + 3 demo], 39+3 brands, ~178 products, ~295 variants, 233+4 users [legacy + admin/agent/wholesale/retail demo accounts], ~57 orders, ~106 payments). A large deviation (e.g. 0 products, or products but 0 variants) signals a bug in the import, not real data drift — investigate before proceeding.

- [ ] **Step 6: Run the existing test suite to confirm nothing broke**

Run: `npm test`
Expected: 133/133 passing, same as before this plan (the test suite uses its own isolated `?schema=test` database via `.env.test`, seeded independently by `tests/helpers/seed.ts` — this task does not touch that file, so this is a regression check, not a new-coverage check).

- [ ] **Step 7: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: import real legacy shop catalog/customers/orders into db:seed"
```

---

## Self-Review Notes

- **Spec coverage:** every section of the spec (auth header, pagination,
  categories, brands, products+images+variants, customers, orders+items+
  addresses+payments, idempotency) has a corresponding task and, for the pure
  mapping logic, a test. The Task 0 credentials-exposure fix and Task 1
  `db:seed` breakage are both called out as known follow-ups in the project's
  own memory and are prerequisites for this work to run at all.
- **No placeholders:** every code step contains complete, real
  implementations and real test assertions — no `// TODO` or "similar to
  above" steps.
- **Type consistency:** `Map<number, number>` id maps (category, brand,
  product, variant) and `Map<string, number>` (user, keyed by normalized
  phone) are used with identical shapes across Tasks 4–9; `LegacyClient`'s
  `fetchAllPages`/`fetchJson` signatures from Task 2 are the only entry points
  Task 9's orchestrator calls, matching exactly.
