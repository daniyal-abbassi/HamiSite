/**
 * E2E browser test for the admin dashboard (tests/e2e-admin.mjs).
 * Drives real Chrome via Playwright against the local dev server.
 * Usage: node tests/e2e-admin.mjs [baseUrl]
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3000";
const SHOT_DIR = path.resolve(".e2e-screens");
fs.mkdirSync(SHOT_DIR, { recursive: true });

const results = [];
const consoleErrors = [];
const badResponses = [];

function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOT_DIR, name + ".png"), fullPage: true });
}

async function trackDiagnostics(page, label) {
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`[${label}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => consoleErrors.push(`[${label}] PAGEERROR ${err.message}`));
  page.on("response", (res) => {
    if (res.status() >= 400) badResponses.push(`[${label}] ${res.status()} ${res.url()}`);
  });
}

const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  // ---------- 1) Storefront home renders ----------
  const ctx1 = await browser.newContext({ locale: "fa-IR" });
  const home = await ctx1.newPage();
  await trackDiagnostics(home, "home");
  const res = await home.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  record("home: GET / returns 200", res?.status() === 200, `status=${res?.status()}`);
  await home.waitForTimeout(1500);
  record("home: page has content", (await home.locator("body").innerText()).length > 100);
  await shot(home, "01-home");
  await ctx1.close();

  // ---------- 2) Guest hitting /admin is redirected to login ----------
  const ctx2 = await browser.newContext();
  const guest = await ctx2.newPage();
  await trackDiagnostics(guest, "guest-guard");
  await guest.goto(BASE + "/admin", { waitUntil: "domcontentloaded", timeout: 60000 });
  await guest.waitForURL("**/login?next=/admin", { timeout: 15000 }).catch(() => {});
  record("guard: guest /admin → /login?next=/admin", guest.url().includes("/login?next=/admin"), guest.url());
  await shot(guest, "02-guest-redirect");
  await ctx2.close();

  // ---------- 3) Admin login (wrong password first) ----------
  const ctx3 = await browser.newContext({ locale: "fa-IR" });
  const admin = await ctx3.newPage();
  await trackDiagnostics(admin, "admin");

  // Hydration-tolerant login: in `next dev` the first click can land before
  // React attaches handlers; retry until the login POST actually fires.
  async function uiLogin(page, user, pass, next) {
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.goto(BASE + "/login" + (next ? `?next=${next}` : ""), { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
      await page.waitForTimeout(2000);
      await page.fill("#identifier", user);
      await page.fill("#password", pass);
      const respP = page.waitForResponse((r) => r.url().includes("/api/auth/login"), { timeout: 20000 }).catch(() => null);
      await page.click('button[type="submit"]');
      const resp = await respP;
      if (resp) return resp.status();
    }
    return null;
  }

  const badStatus = await uiLogin(admin, "admin", "WRONG-pass-123", "/admin");
  record("login: wrong password rejected by API (401)", badStatus === 401, `status=${badStatus}`);
  await admin.waitForTimeout(1000);
  const bodyAfterBad = await admin.locator("body").innerText();
  record("login: wrong password shows error", bodyAfterBad.includes("اشتباه"));
  await shot(admin, "03-login-wrong-password");

  // ---------- 4) Admin login (correct) → dashboard ----------
  const okStatus = await uiLogin(admin, "admin", "Admin@12345", "/admin");
  record("login: correct credentials accepted (200)", okStatus === 200, `status=${okStatus}`);
  const summaryResp = admin.waitForResponse((r) => r.url().includes("/api/admin/reports/summary"), { timeout: 60000 }).catch(() => null);
  // pathname predicate (a "**/admin" glob would also match "?next=/admin")
  await admin.waitForURL((u) => u.pathname === "/admin", { timeout: 60000 }).catch(() => {});
  record("login: admin lands on /admin", new URL(admin.url()).pathname === "/admin", admin.url());
  const summary = await summaryResp;
  record("dashboard: calls /api/admin/reports/summary", Boolean(summary), summary ? `status=${summary.status()}` : "no request seen");
  await admin.locator("aside").waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  record("dashboard: AdminSidebar rendered", await admin.locator("aside").isVisible().catch(() => false));
  await admin.waitForTimeout(1200);
  await shot(admin, "04-admin-dashboard");

  // ---------- 5) Sidebar navigation across all admin pages ----------
  const navChecks = [
    { label: "سفارش‌ها", url: "/admin/orders", expect: "DEV-1001", shot: "05-admin-orders" },
    { label: "محصولات", url: "/admin/products", expect: "iPhone 15 Pro", shot: "06-admin-products" },
    { label: "کاربران", url: "/admin/users", expect: "reza", shot: "07-admin-users" },
    { label: "دسته‌بندی‌ها", url: "/admin/categories", expect: "موبایل", shot: "08-admin-categories" },
    { label: "برندها", url: "/admin/brands", expect: "Apple", shot: "09-admin-brands" },
    { label: "کوپن‌ها", url: "/admin/coupons", expect: "آماده‌سازی نشده", shot: "10-admin-coupons" },
  ];

  for (const item of navChecks) {
    await admin.locator(`aside a[href="${item.url}"]`).first().click({ timeout: 10000 }).catch(() => {});
    await admin.waitForURL(`**${item.url}`, { timeout: 15000 }).catch(() => {});
    await admin.waitForTimeout(1500); // let client fetches settle
    const body = await admin.locator("body").innerText();
    const onUrl = new URL(admin.url()).pathname === item.url;
    const contentOk = body.includes(item.expect);
    record(`nav: ${item.url} renders & shows "${item.expect}"`, onUrl && contentOk, `url=${admin.url()}`);
    await shot(admin, item.shot);
  }

  // ---------- 6) Order detail + real status mutation ----------
  await admin.locator('aside a[href="/admin/orders"]').first().click().catch(() => {});
  await admin.waitForURL("**/admin/orders", { timeout: 15000 }).catch(() => {});
  await admin.waitForTimeout(1200);
  const orderLink = admin.locator('a[href*="/admin/orders/"]').first();
  record("orders: rows link to detail page", await orderLink.isVisible().catch(() => false));
  if (await orderLink.isVisible().catch(() => false)) {
    await orderLink.click();
    await admin.waitForURL("**/admin/orders/**", { timeout: 30000 }).catch(() => {});
    await admin.waitForTimeout(2500);
    const detailHasSelect = await admin.locator("#nextStatus").isVisible().catch(() => false);
    record("order detail: status editor visible", detailHasSelect, admin.url());
    if (detailHasSelect) {
      await admin.selectOption("#nextStatus", "PROCESSING");
      await admin.locator('button:has-text("به‌روزرسانی"), button:has-text("ذخیره")').first().click();
      await admin.locator("text=وضعیت سفارش به‌روزرسانی شد").waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
      const saved = (await admin.locator("body").innerText()).includes("وضعیت سفارش به‌روزرسانی شد");
      record("order detail: PATCH status mutation succeeds", saved);
      await shot(admin, "11-order-status-updated");
    }
  }

  // ---------- 7) Fresh context: admin APIs reject unauthenticated calls ----------
  const ctxAnon = await browser.newContext();
  const anonPage = await ctxAnon.newPage();
  await anonPage.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  const anonStatus = await anonPage.evaluate(async () => {
    const r = await fetch("/api/admin/users");
    return r.status;
  }).catch(() => 0);
  record("security: unauthenticated /api/admin/users → 401", anonStatus === 401, `status=${anonStatus}`);
  await ctxAnon.close();

  // ---------- 8) Non-admin (RETAIL) blocked from /admin ----------
  const ctx4 = await browser.newContext({ locale: "fa-IR" });
  const retail = await ctx4.newPage();
  await trackDiagnostics(retail, "retail");
  await retail.goto(BASE + "/login", { waitUntil: "domcontentloaded", timeout: 60000 });
  await retail.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
  await retail.waitForTimeout(2500);
  await retail.fill("#identifier", "reza");
  await retail.fill("#password", "Password@123");
  await retail.click('button[type="submit"]');
  await retail.waitForTimeout(2000);
  if (retail.url().includes("identifier=")) {
    await retail.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
    await retail.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
    await retail.waitForTimeout(2000);
    await retail.fill("#identifier", "reza");
    await retail.fill("#password", "Password@123");
    await retail.click('button[type="submit"]');
    await retail.waitForTimeout(2000);
  }
  await retail.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 }).catch(() => {});
  await retail.goto(BASE + "/admin", { waitUntil: "domcontentloaded", timeout: 60000 });
  await retail.waitForURL((u) => u.pathname === "/", { timeout: 15000 }).catch(() => {});
  record("guard: RETAIL user /admin → redirected to /", new URL(retail.url()).pathname === "/", retail.url());
  const retailApi = await retail.evaluate(async (base) => {
    const r = await fetch(base + "/api/admin/users");
    return r.status;
  }, BASE);
  record("security: RETAIL /api/admin/users → 403", retailApi === 403, `status=${retailApi}`);
  await shot(retail, "12-retail-blocked");
  await ctx4.close();
  await ctx3.close();
} finally {
  await browser.close();
}

// ---------- report ----------
const passed = results.filter((r) => r.pass).length;
const report = { base: BASE, passed, failed: results.length - passed, results, consoleErrors, badResponses };
fs.writeFileSync(path.resolve(".e2e-report.json"), JSON.stringify(report, null, 2));
console.log(`\n=== ${passed}/${results.length} checks passed ===`);
console.log(`Console errors: ${consoleErrors.length}`);
if (badResponses.length) console.log("4xx/5xx responses:\n" + badResponses.join("\n"));
process.exit(report.failed > 0 ? 1 : 0);

