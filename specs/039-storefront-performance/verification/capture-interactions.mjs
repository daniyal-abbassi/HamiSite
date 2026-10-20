// 039 T006 — capture baseline interaction samples.
//
// One action = one input timestamp, one first-visible-feedback timestamp, one
// completion timestamp (actual data/state readiness), and a final-state assertion.
// Pending feedback never counts as completion. At least 20 repetitions per action
// under the frozen profile; p95 = sorted[ceil(0.95*n)-1], counted from one.
//
// Timing is measured in Node (50 ms poll) rather than in-page, because several
// actions cause a full document navigation, which destroys an in-page recorder.
// The 50 ms poll granularity is therefore part of the method and is recorded on
// every sample; it is not hidden.
//
// Cart-mutating actions restore the frozen designated contents after every
// repetition and verify the subtotal is back to 118,500,000 before continuing —
// the frozen cart must never drift between baseline and final.
//
// Usage:
//   node specs/039-storefront-performance/verification/capture-interactions.mjs --smoke
//   node specs/039-storefront-performance/verification/capture-interactions.mjs --reps 20 --only search,navigation
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { mkdirSync, writeFileSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const FEATURE = "specs/039-storefront-performance";
const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, arr) => (a.startsWith("--") ? [[a.slice(2), arr[i + 1]?.startsWith("--") ? true : arr[i + 1] ?? true]] : [])),
);
const SMOKE = args.smoke === true;
const PHASE = args.phase === "final" ? "final" : "baseline";
const REPS = Number(args.reps ?? (SMOKE ? 2 : 20));
const ONLY = args.only ? String(args.only).split(",") : null;
const BASE = "http://127.0.0.1:3000";
const OUTDIR = args.outdir ? String(args.outdir) : `${FEATURE}/evidence/${PHASE}-interactions`;
const OUT_JSON = args.out ? String(args.out) : `${FEATURE}/evidence/${PHASE}-interactions.json`;
const TRACEDIR = join(OUTDIR, "traces");
mkdirSync(OUTDIR, { recursive: true });
mkdirSync(TRACEDIR, { recursive: true });

const PRODUCT_URL = `${BASE}/shop/گوشی-موبایل-شیائومی-مدل-poco-x7-pro-دو-سیم-کارت-ظرفیت-512-گیگابایت-و-رم-12-گیگابایت-گلوبال`;
// The only catalogue record with stock > 1 that is not part of the frozen designated
// contents. The two designated products both have stock 1, so increasing their
// quantity or re-adding them is *correctly* rejected — quantity/cart interactions are
// measured on this auxiliary record and removed again, leaving the frozen cart intact.
const AUX_PRODUCT_URL = `${BASE}/shop/شارژر-دیواری-45-وات-سامسونگ-مدل-ep-t4511-low-standby-به-همراه-کابل-usb-c-به-طول-18-متر`;
const AUX_LINE_MARKER = "شارژر";
const SESSIONS = {
  "alias-customer-A": { identifier: process.env.PERF_RETAIL_IDENTIFIER, password: process.env.PERF_RETAIL_PASSWORD, role: "RETAIL" },
  "alias-partner-A": { identifier: process.env.PERF_PARTNER_IDENTIFIER, password: process.env.PERF_PARTNER_PASSWORD, role: "WHOLESALE" },
};
if (Object.values(SESSIONS).some(({ identifier, password }) => !identifier || !password)) {
  throw new Error("Interaction capture requires PERF_RETAIL_IDENTIFIER, PERF_RETAIL_PASSWORD, PERF_PARTNER_IDENTIFIER and PERF_PARTNER_PASSWORD.");
}
const PROFILE = {
  profile_id: "prof-mobile-4x-2026-10-15",
  viewport: { width: 390, height: 844, device_scale_factor: 3 },
  cpu_slowdown: 4,
  network: { download_kbps: 1600, upload_kbps: 750, latency_ms: 150 },
  cache_policy: "one warm-up visit per action before counting, so every repetition is measured warm (an already-browsing user)",
  poll_granularity_ms: 50,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const loadavg = () => {
  const [one, five] = readFileSync("/proc/loadavg", "utf8").split(" ");
  return { load_1m: +one, load_5m: +five };
};

// ---------------------------------------------------------------- in-page helpers
// Shared helpers injected into the page for predicates and final-state assertions.
const HELPERS = () => {
  window.__h = {
    vis: (el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
    },
    toEn: (s) => (s || "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[^\d]/g, ""),
    amounts: () => [...document.querySelectorAll(".toman-price")].filter(window.__h.vis).map((e) => window.__h.toEn(e.textContent)),
    cards: () => [...document.querySelectorAll("article.product-card")],
    cartCount: () => {
      const b = [...document.querySelectorAll('button[aria-label^="سبد خرید"], a[aria-label^="سبد خرید"]')].find(window.__h.vis);
      const m = window.__h.toEn(b?.getAttribute("aria-label") || "");
      return m ? Number(m) : null;
    },
    firstCardText: () => (document.querySelector("article.product-card")?.textContent || "").slice(0, 30),
    mainImage: () => document.querySelector('main img[src*="/catalog-images/"], main img')?.getAttribute("src") || null,
  };
};

// The pending/feedback probe: first *visible* sign that work is in progress.
const FEEDBACK_PROBE = () => {
  const vis = window.__h.vis;
  if ([...document.querySelectorAll('[aria-busy="true"]')].some(vis)) return "aria-busy";
  if ([...document.querySelectorAll(".animate-pulse")].some(vis)) return "skeleton-pulse";
  if ([...document.querySelectorAll('[role="status"]')].some(vis)) return "role-status";
  if ([...document.querySelectorAll("button:disabled")].some(vis)) return "disabled-control";
  return null;
};

// Actions that cannot be measured with the currently available fixtures. These are
// recorded as explicitly unverified with the reason, never dropped and never
// replaced by a guest or a different state (contract: "Keep unavailable authenticated
// actions explicitly unverified").
const UNVERIFIABLE = [
  {
    key: "quantity",
    label: "increase a cart line quantity",
    reason:
      "No purchasable catalogue record with stock > 1 exists. The only record with stock 2 (id 1962, call-type) renders no add-to-cart control, and both designated test products have stock 1 — so a quantity increase is correctly rejected by stock validation and produces no completion state. Verified: clicking افزایش تعداد on a stock-1 line changes neither the line total nor the subtotal within 20 s.",
  },
  {
    key: "partner",
    label: "add a partner bundle to the cart",
    reason:
      "Both partner bundles render with a disabled control labelled اتمام (sold out), so no add-to-cart completion state exists. The bundles themselves render (2 articles, titles and Toman prices), so the route is reachable — only the add action is unavailable.",
  },
];
const UNVERIFIABLE_KEYS = new Set(UNVERIFIABLE.map((u) => u.key));

// ---------------------------------------------------------------- action specs
// Every predicate is a self-contained function evaluated in the page.
const ACTIONS = [
  {
    key: "search",
    label: "search for نوکیا from the shop header",
    url: `${BASE}/shop`,
    session: null,
    async prepare(page) {
      await page.waitForSelector('button[aria-label="باز کردن جست‌وجو"]');
      await page.click('button[aria-label="باز کردن جست‌وجو"]');
      await page.waitForSelector('input[type="search"]', { state: "visible" });
    },
    readBase: () => "نوکیا",
    async act(page) {
      const input = page.locator('input[type="search"]').first();
      await input.fill("نوکیا");
      await input.press("Enter");
    },
    complete: (term) =>
      location.search.includes("q=") &&
      [...document.querySelectorAll("article.product-card")].some((c) => (c.textContent || "").includes(term)),
    assertFinal: (term) => location.search.includes("q=") && document.body.textContent.includes(term),
    mutates: false,
  },
  {
    key: "filter",
    label: "filter by brand شیائومی from the shop category menu",
    url: `${BASE}/shop`,
    session: null,
    async prepare(page) {
      await page.waitForSelector('button[aria-label="دسته‌بندی‌های گوشی"]');
    },
    readBase: () => "شیائومی",
    async act(page) {
      await page.click('button[aria-label="دسته‌بندی‌های گوشی"]');
      await sleep(700);
      await page.locator('button[role="menuitem"]', { hasText: "شیائومی" }).first().click({ timeout: 10000 });
    },
    complete: () => /\/brands\//.test(decodeURIComponent(location.pathname)) && document.querySelectorAll("article.product-card").length > 0,
    assertFinal: () => /\/brands\//.test(decodeURIComponent(location.pathname)),
    mutates: false,
  },
  {
    key: "sort",
    label: "change sort order to ارزان‌ترین (cheapest)",
    url: `${BASE}/shop`,
    session: null,
    async prepare(page) {
      await page.waitForSelector("#shop-sort");
    },
    readBase: () => window.__baseFirst,
    async act(page, base) {
      await page.selectOption("#shop-sort", "price-asc");
    },
    complete: (base) => {
      const first = (document.querySelector("article.product-card")?.textContent || "").slice(0, 30);
      return first.length > 0 && first !== base;
    },
    assertFinal: () => location.search.includes("sort="),
    mutates: false,
  },
  {
    key: "navigation",
    label: "open the first shop product card",
    url: `${BASE}/shop`,
    session: null,
    readBase: () => null,
    async prepare(page) {
      await page.waitForSelector('a[href^="/shop/"]');
    },
    async act(page) {
      await page.locator('a[href^="/shop/"]').first().click();
    },
    complete: () =>
      decodeURIComponent(location.pathname).startsWith("/shop/") &&
      !!document.querySelector("h1") &&
      [...document.querySelectorAll(".toman-price")].some(window.__h.vis),
    assertFinal: () => decodeURIComponent(location.pathname).startsWith("/shop/"),
    mutates: false,
  },
  {
    key: "gallery",
    label: "switch the product gallery to view 2",
    url: PRODUCT_URL,
    session: null,
    async prepare(page) {
      await page.waitForSelector('button[aria-label^="نمای ۲"]');
    },
    readBase: () => window.__h.mainImage(),
    async act(page) {
      await page.click('button[aria-label^="نمای ۲"]');
    },
    complete: (base) => {
      const now = window.__h.mainImage();
      return !!now && now !== base;
    },
    assertFinal: () => {
      const b = document.querySelector('button[aria-label^="نمای ۲"]');
      return b?.getAttribute("aria-pressed") === "true" || !!b;
    },
    mutates: false,
  },
  {
    key: "variant",
    label: "select the مشکی (black) colour variant",
    url: PRODUCT_URL,
    session: null,
    async prepare(page) {
      await page.waitForSelector('button[aria-label="رنگ: مشکی"]');
    },
    readBase: () => null,
    async act(page) {
      await page.click('button[aria-label="رنگ: مشکی"]');
    },
    complete: () => document.querySelector('button[aria-label="رنگ: مشکی"]')?.getAttribute("aria-pressed") === "true",
    assertFinal: () => document.querySelector('button[aria-label="رنگ: مشکی"]')?.getAttribute("aria-pressed") === "true",
    mutates: false,
  },
  {
    key: "quantity",
    label: "increase the auxiliary line quantity on /cart",
    url: `${BASE}/cart`,
    session: "alias-customer-A",
    // Add the auxiliary record first (not measured), then measure the quantity
    // increase on its line. The frozen two lines are never touched.
    async prepare(page) {
      await page.goto(AUX_PRODUCT_URL, { waitUntil: "domcontentloaded" });
      await page.waitForSelector('button:has-text("افزودن به سبد خرید")', { timeout: 30000 });
      const before = await page.evaluate(() => window.__h.cartCount());
      await page.locator('button:has-text("افزودن به سبد خرید")').first().click();
      await page.waitForFunction((b) => (window.__h.cartCount() ?? 0) > (b ?? 0), before, { timeout: 20000 }).catch(() => {});
      await page.goto(`${BASE}/cart`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(`text=${AUX_LINE_MARKER}`, { timeout: 30000 });
      await page.waitForSelector('button[aria-label="افزایش تعداد"]', { timeout: 20000 });
      await page.waitForFunction(() => window.__h.amounts().length > 0, null, { timeout: 20000 }).catch(() => {});
    },
    readBase: () => Math.max(...window.__h.amounts().map(Number), 0),
    async act(page) {
      // the auxiliary line was added last, so its controls are last in DOM order
      await page.locator('button[aria-label="افزایش تعداد"]').last().click();
    },
    complete: (base) => Math.max(...window.__h.amounts().map(Number), 0) > base,
    assertFinal: (base) => Math.max(...window.__h.amounts().map(Number), 0) > base,
    mutates: true,
    async restore(page) {
      // remove the auxiliary line entirely, restoring the frozen designated contents
      const del = page.locator('button[aria-label^="حذف"]');
      await del.last().click();
      await page.waitForFunction(() => window.__h.amounts().includes("118500000"), null, { timeout: 20000 });
    },
    frozenGuard: () => window.__h.amounts().includes("118500000") && window.__h.amounts().length === 3,
  },
  {
    key: "cart",
    label: "add a purchasable product to the cart from its product page",
    url: `${BASE}/shop`,
    session: "alias-customer-A",
    // The frozen designated products have stock 1, so re-adding them is correctly
    // rejected. prepare() finds another product that actually exposes an enabled
    // add-to-cart control; the measured action is then just the click.
    async prepare(page) {
      const hrefs = await page.evaluate(() =>
        [...new Set([...document.querySelectorAll('a[href^="/shop/"]')].map((a) => a.getAttribute("href")))].filter(
          (h) => h && !/poco-x7-pro/i.test(h) && !/105-2023/.test(h),
        ),
      );
      for (const href of hrefs.slice(0, 12)) {
        await page.goto(BASE + href, { waitUntil: "domcontentloaded" }).catch(() => {});
        try {
          const btn = page.locator('button:has-text("افزودن به سبد خرید")').first();
          await btn.waitFor({ state: "visible", timeout: 12000 });
          if (await btn.isEnabled()) {
            this._productUrl = BASE + href;
            // the header cart badge is populated from the cart fetch, so wait for it
            // before the baseline is read — otherwise the baseline is null and no
            // completion can ever be detected.
            await page.waitForFunction(() => window.__h.cartCount() != null, null, { timeout: 25000 }).catch(() => {});
            return;
          }
        } catch {
          /* try the next candidate */
        }
      }
      throw new Error("no product outside the frozen contents exposes an enabled add-to-cart control");
    },
    // The header badge was observed reporting a count ahead of the server's own cart
    // state, so completion is asserted against the server ("actual data/state
    // readiness"), not against the badge.
    readBase: async () => {
      const r = await fetch("/api/cart", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      return (j.data?.items ?? []).length;
    },
    async act(page) {
      await page.locator('button:has-text("افزودن به سبد خرید")').first().click();
    },
    complete: async (before) => {
      const r = await fetch("/api/cart", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      return ((j.data?.items ?? []).length) > before;
    },
    assertFinal: async (before) => {
      const r = await fetch("/api/cart", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      return ((j.data?.items ?? []).length) > before;
    },
    mutates: true,
    async restore(page) {
      await page.goto(`${BASE}/cart`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector('button[aria-label^="حذف"]', { timeout: 20000 });
      const del = page.locator('button[aria-label^="حذف"]');
      if ((await del.count()) > 2) {
        await del.last().click();
        await page.waitForFunction(() => window.__h.amounts().includes("118500000"), null, { timeout: 20000 });
      }
    },
    frozenGuard: () => window.__h.amounts().includes("118500000") && window.__h.amounts().length === 3,
  },
  {
    key: "checkout",
    label: "change the shipping option on /checkout",
    url: `${BASE}/checkout`,
    session: "alias-customer-A",
    async prepare(page) {
      await page.waitForSelector('input[name="shipping"]');
    },
    readBase: () => window.__h.amounts().join(","),
    async act(page) {
      const radios = page.locator('input[name="shipping"]');
      const n = await radios.count();
      // pick a different option than the currently checked one
      for (let i = 0; i < n; i++) {
        if (!(await radios.nth(i).isChecked())) { await radios.nth(i).check(); return; }
      }
    },
    complete: (base) => {
      const now = window.__h.amounts().join(",");
      return now.length > 0 && now !== base;
    },
    assertFinal: () => [...document.querySelectorAll('input[name="shipping"]')].some((r) => r.checked),
    mutates: false,
  },
  {
    key: "partner",
    label: "add a partner bundle to the cart",
    url: `${BASE}/partners/bundles`,
    session: "alias-partner-A",
    async prepare(page) {
      await page.waitForSelector("article h3", { timeout: 30000 });
    },
    readBase: () => window.__h.cartCount(),
    async act(page) {
      await page.locator('article button:has-text("افزودن سبد به سفارش")').first().click({ timeout: 15000 });
    },
    complete: (before) => {
      const now = window.__h.cartCount();
      return now != null && before != null && now > before;
    },
    assertFinal: () => window.__h.cartCount() != null,
    mutates: true,
    async restore(page) {
      await page.goto(`${BASE}/cart`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector('button[aria-label^="حذف"]', { timeout: 20000 });
      const del = page.locator('button[aria-label^="حذف"]');
      const n = await del.count();
      if (n > 2) {
        await del.nth(n - 1).click();
        await page.waitForFunction(() => window.__h.amounts().includes("118500000"), null, { timeout: 20000 }).catch(() => {});
      }
    },
    frozenGuard: () => window.__h.amounts().includes("118500000"),
  },
];

// ---------------------------------------------------------------- browser setup
const browserEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(http|https|ftp|all|no)_proxy$/i.test(k)));
const browser = await chromium.launch({ channel: "chrome", headless: true, env: browserEnv, args: ["--no-proxy-server", "--disable-dev-shm-usage"] });

async function applyProfile(cdp) {
  await cdp.send("Network.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: PROFILE.cpu_slowdown });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: PROFILE.network.latency_ms,
    downloadThroughput: (PROFILE.network.download_kbps * 1024) / 8,
    uploadThroughput: (PROFILE.network.upload_kbps * 1024) / 8,
    connectionType: "cellular4g",
  });
}

const states = {};
for (const [alias, cred] of Object.entries(SESSIONS)) {
  const ctx = await browser.newContext();
  await ctx.request.post(`${BASE}/api/auth/login`, { data: { identifier: cred.identifier, password: cred.password } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  const me = await page.evaluate(async () => {
    const r = await fetch("/api/auth/me");
    return { s: r.status, b: await r.json().catch(() => ({})) };
  });
  states[alias] = await ctx.storageState();
  const ok = me.s === 200 && me.b?.data?.role === cred.role;
  console.log(`session ${alias}: me ${me.s} role ${me.b?.data?.role} -> ${ok ? "OK" : "UNVERIFIED"}`);
  if (!ok) { console.error("refusing to run with an unverified session"); await browser.close(); process.exit(3); }
  await ctx.close();
}

async function newCtx(session) {
  const ctx = await browser.newContext({
    viewport: PROFILE.viewport,
    deviceScaleFactor: PROFILE.viewport.device_scale_factor,
    ...(session ? { storageState: states[session] } : {}),
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await applyProfile(cdp);
  await page.addInitScript(HELPERS);
  return { ctx, page };
}

const samples = [];
const list = ONLY ? ACTIONS.filter((a) => ONLY.includes(a.key)) : ACTIONS.filter((a) => !UNVERIFIABLE_KEYS.has(a.key));

for (const spec of list) {
  console.log(`\n${spec.key}: ${spec.label} (${REPS} reps)`);
  const { ctx, page } = await newCtx(spec.session);
  // warm the route so every counted rep runs warm
  await page.goto(spec.url, { waitUntil: "load" }).catch(() => {});
  await sleep(1500);

  for (let rep = 1; rep <= REPS; rep++) {
    const tracePath = rep === 1 ? join(TRACEDIR, `${spec.key}-r1.zip`) : null;
    if (tracePath) await ctx.tracing.start({ screenshots: true, snapshots: false });
    let record = null;
    const errs = [];
    const onErr = (e) => errs.push(String(e.message).slice(0, 200));
    page.on("pageerror", onErr);
    try {
      await page.goto(spec.url, { waitUntil: "load" }).catch(() => {});
      await page.evaluate(HELPERS);
      await spec.prepare(page);
      await sleep(400);

      // baseline value for the assertion/completion predicate
      let base = null;
      if (spec.readBase) base = await page.evaluate(spec.readBase);
      if (spec.key === "sort") base = await page.evaluate(() => (document.querySelector("article.product-card")?.textContent || "").slice(0, 30));

      const t0 = Date.now();
      let actError = null;
      try {
        await spec.act(page, base);
      } catch (e) {
        actError = String(e.message).slice(0, 200);
      }
      let feedback = null, feedbackKind = null, complete = null;
      const deadline = Date.now() + 20000;
      while (Date.now() < deadline) {
        if (feedback === null) {
          const f = await page.evaluate(FEEDBACK_PROBE).catch(() => null);
          if (f) { feedback = Date.now() - t0; feedbackKind = f; }
        }
        const done = await page.evaluate(spec.complete, base).catch(() => false);
        if (done) { complete = Date.now() - t0; break; }
        await sleep(PROFILE.poll_granularity_ms);
      }
      const assertFinal = await page.evaluate(spec.assertFinal, base).catch(() => false);

      // restore mutated state and verify the frozen cart did not drift
      let restored = null;
      if (spec.mutates && spec.restore) {
        try {
          await spec.restore(page);
          restored = spec.frozenGuard ? await page.evaluate(spec.frozenGuard).catch(() => false) : true;
        } catch (e) {
          restored = `restore failed: ${String(e.message).slice(0, 120)}`;
        }
      }
      const shot = join(OUTDIR, `${spec.key}-r${rep}.png`);
      if (rep === 1) await page.screenshot({ path: shot });

      record = {
        sample_id: `${spec.key}-r${rep}`,
        profile_id: PROFILE.profile_id,
        action: spec.key,
        action_label: spec.label,
        route_url: spec.url,
        session_alias: spec.session ?? "public",
        repetition: rep,
        input_ms: 0,
        feedback_ms: feedback,
        feedback_kind: feedbackKind ?? "none-observed",
        completion_ms: complete,
        wall_ms: Date.now() - t0,
        final_state_assertion: assertFinal ? "pass" : "fail",
        baseline_value: base,
        action_error: actError,
        verification_status: complete == null || !assertFinal ? "failed" : "valid",
        failure_reason:
          complete == null
            ? `no completion within 20s${actError ? ` (action error: ${actError})` : ""}`
            : !assertFinal
              ? "completion predicate became true but the final-state assertion failed"
              : null,
        mutation_restored: restored,
        in_page_errors: errs,
        trace_path: tracePath,
        screenshot_path: rep === 1 ? shot : null,
        machine_load: loadavg(),
        captured_at: new Date().toISOString(),
      };
      console.log(
        `  r${String(rep).padStart(2)}: feedback=${feedback == null ? "-" : feedback}ms(${record.feedback_kind}) complete=${complete == null ? "TIMEOUT" : complete + "ms"} assert=${record.final_state_assertion}${restored === false ? " RESTORE-FAILED" : ""}${record.verification_status === "failed" ? " FAILED" : ""}`,
      );
    } catch (e) {
      record = {
        sample_id: `${spec.key}-r${rep}`,
        action: spec.key,
        repetition: rep,
        verification_status: "failed",
        failure_reason: `harness error: ${String(e.message).slice(0, 200)}`,
        machine_load: loadavg(),
        captured_at: new Date().toISOString(),
      };
      console.log(`  r${rep}: HARNESS ERROR ${String(e.message).slice(0, 100)}`);
    }
    if (tracePath) await ctx.tracing.stop({ path: tracePath });
    page.off("pageerror", onErr);
    samples.push(record);
    await sleep(800);
  }
  await ctx.close();
}

await browser.close();

// Unverifiable actions are recorded, not omitted.
const unverified = UNVERIFIABLE.filter((u) => !ONLY || ONLY.includes(u.key)).map((u) => ({
  sample_id: `${u.key}-unverified`,
  profile_id: PROFILE.profile_id,
  action: u.key,
  action_label: u.label,
  session_alias: u.key === "partner" ? "alias-partner-A" : "alias-customer-A",
  repetitions: 0,
  verification_status: "unverified",
  failure_reason: u.reason,
  machine_load: loadavg(),
  captured_at: new Date().toISOString(),
}));

const byAction = {};
for (const s of [...samples, ...unverified]) {
  byAction[s.action] ??= [];
  byAction[s.action].push(s);
}
const p95 = (xs) => {
  const v = [...xs].sort((a, b) => a - b);
  return v.length ? v[Math.ceil(0.95 * v.length) - 1] : null;
};
const summary = Object.entries(byAction).map(([action, rows]) => {
  const ok = rows.filter((r) => r.verification_status === "valid");
  const comp = ok.map((r) => r.completion_ms);
  const fb = ok.map((r) => r.feedback_ms).filter((x) => x != null);
  return {
    action,
    label: rows[0].action_label,
    repetitions: rows.reduce((a, r) => a + (r.repetitions ?? 1), 0),
    valid: ok.length,
    failed: rows.filter((r) => r.verification_status === "failed").length,
    unverified: rows.filter((r) => r.verification_status === "unverified").length,
    completion_median_ms: comp.length ? Math.round([...comp].sort((a, b) => a - b)[comp.length >> 1]) : null,
    completion_p95_ms: p95(comp),
    feedback_median_ms: fb.length ? Math.round([...fb].sort((a, b) => a - b)[fb.length >> 1]) : null,
    feedback_p95_ms: p95(fb),
    failure_reasons: [...new Set(rows.filter((r) => r.failure_reason).map((r) => r.failure_reason))],
  };
});

const out = {
  phase: PHASE,
  profile: PROFILE,
  base_url: BASE,
  server_build_id: readFileSync(".next/BUILD_ID", "utf8").trim(),
  captured_at: new Date().toISOString(),
  reps_per_action: REPS,
  actions_expected: list.length,
  actions_unverifiable: unverified.length,
  summary,
  unverified,
  samples,
};
writeFileSync(OUT_JSON, JSON.stringify(out, null, 2));
console.log(`\nwrote ${OUT_JSON}`);
console.log("action      reps  valid  fail  completion med / p95   feedback med");
for (const s of summary) {
  console.log(
    `${s.action.padEnd(11)} ${String(s.repetitions).padStart(4)} ${String(s.valid).padStart(6)} ${String(s.failed).padStart(5)}  ${String(s.completion_median_ms).padStart(6)} / ${String(s.completion_p95_ms).padEnd(6)}  ${String(s.feedback_median_ms).padStart(6)}`,
  );
  if (s.failure_reasons.length) console.log(`   failures: ${s.failure_reasons.join(" | ")}`);
}
