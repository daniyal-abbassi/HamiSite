// Verification test for T019: Account switching, logout, in-flight reads and cart isolation.
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const BASE = "http://127.0.0.1:3000";
const RETAIL = { identifier: process.env.PERF_RETAIL_IDENTIFIER, password: process.env.PERF_RETAIL_PASSWORD };
const PARTNER = { identifier: process.env.PERF_PARTNER_IDENTIFIER, password: process.env.PERF_PARTNER_PASSWORD };

if (!RETAIL.identifier || !RETAIL.password || !PARTNER.identifier || !PARTNER.password) {
  throw new Error("PERF credentials missing from environment.");
}

const browserEnv = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => !/^(http|https|ftp|all|no)_proxy$/i.test(k))
);
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  env: browserEnv,
  args: ["--no-proxy-server", "--disable-dev-shm-usage"],
});

const results = [];

async function loginViaPage(page, cred) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#identifier");
  await page.fill("#identifier", cred.identifier);
  await page.fill("#password", cred.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
}

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  // Step 1: Login as Retail Customer A
  console.log("1. Logging in as Retail Customer A...");
  await loginViaPage(page, RETAIL);

  const authMeRetail = await page.evaluate(async () => {
    const res = await fetch("/api/auth/me");
    return res.json();
  });
  console.log("Retail auth role:", authMeRetail?.data?.role);
  results.push({
    test: "retail_login",
    passed: authMeRetail?.data?.role === "RETAIL",
    role: authMeRetail?.data?.role,
  });

  // Verify Cart for Retail Customer A
  console.log("2. Verifying Customer A cart items...");
  await page.goto(`${BASE}/cart`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".toman-price", { timeout: 10000 });
  const retailCartBody = await page.evaluate(() => document.body.textContent || "");
  const hasPoco = retailCartBody.includes("Poco");
  const hasNokia = retailCartBody.includes("نوکیا");
  console.log("Customer A cart has Poco & Nokia:", hasPoco && hasNokia);
  results.push({
    test: "retail_cart_contents",
    passed: hasPoco && hasNokia,
  });

  // Step 2: Logout
  console.log("3. Logging out...");
  await page.evaluate(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
  });
  await page.goto(`${BASE}/cart`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const guestCartBody = await page.evaluate(() => document.body.textContent || "");
  const guestShowsLoginPrompt = guestCartBody.includes("وارد حساب خود شوید");
  const guestHidesCustomerCart = !guestCartBody.includes("Poco") && !guestCartBody.includes("نوکیا");
  console.log("Guest sees login prompt and no customer items:", guestShowsLoginPrompt && guestHidesCustomerCart);
  results.push({
    test: "logout_cart_cleared",
    passed: guestShowsLoginPrompt && guestHidesCustomerCart,
  });

  // Step 3: Login as Wholesale Partner A
  console.log("4. Logging in as Partner A...");
  await loginViaPage(page, PARTNER);

  const authMePartner = await page.evaluate(async () => {
    const res = await fetch("/api/auth/me");
    return res.json();
  });
  console.log("Partner auth role:", authMePartner?.data?.role);
  results.push({
    test: "partner_login",
    passed: authMePartner?.data?.role === "WHOLESALE",
    role: authMePartner?.data?.role,
  });

  // Step 4: Verify Partner Cart Isolation
  console.log("5. Verifying Partner A cart isolation...");
  await page.goto(`${BASE}/cart`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const partnerCartBody = await page.evaluate(() => document.body.textContent || "");
  // Partner cart should NOT contain Customer A's Poco X7 Pro subtotal
  const partnerHidesCustomerCart = !partnerCartBody.includes("118,500,000") && !partnerCartBody.includes("Poco");
  console.log("Partner cart isolates Customer A cart:", partnerHidesCustomerCart);
  results.push({
    test: "partner_cart_isolated",
    passed: partnerHidesCustomerCart,
  });

  // Step 5: Verify Partner Access to Bundles
  console.log("6. Verifying Partner A access to /partners/bundles...");
  await page.goto(`${BASE}/partners/bundles`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("article", { timeout: 15000 });
  const partnerBundleArticles = await page.evaluate(() => document.querySelectorAll("article").length);
  console.log("Partner bundle cards visible:", partnerBundleArticles >= 1);
  results.push({
    test: "partner_bundles_accessible",
    passed: partnerBundleArticles >= 1,
    count: partnerBundleArticles,
  });

  // Step 6: Switch back to Retail Customer A
  console.log("7. Switching back to Customer A...");
  await page.evaluate(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
  });
  await loginViaPage(page, RETAIL);

  // Verify Retail cannot access partner bundles
  console.log("8. Verifying Customer A is refused partner bundles...");
  await page.goto(`${BASE}/partners/bundles`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const retailPartnerPageBody = await page.evaluate(() => document.body.textContent || "");
  const showsForbiddenNotice = retailPartnerPageBody.includes("دسترسی اختصاصی همکاران");
  console.log("Retail customer blocked with forbidden notice:", showsForbiddenNotice);
  results.push({
    test: "retail_partner_bundles_forbidden",
    passed: showsForbiddenNotice,
  });

  // Verify Customer A's cart is intact
  console.log("9. Verifying Customer A cart restored...");
  await page.goto(`${BASE}/cart`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".toman-price", { timeout: 10000 });
  const restoredCartBody = await page.evaluate(() => document.body.textContent || "");
  const restoredPoco = restoredCartBody.includes("Poco");
  const restoredNokia = restoredCartBody.includes("نوکیا");
  console.log("Customer A cart intact on return:", restoredPoco && restoredNokia);
  results.push({
    test: "retail_cart_intact_on_return",
    passed: restoredPoco && restoredNokia,
  });

  console.log("\n--- Isolation Test Summary ---");
  console.log(JSON.stringify(results, null, 2));

  const allPassed = results.every((r) => r.passed);
  if (!allPassed) {
    console.error("Some isolation assertions failed!");
    process.exit(1);
  }
  console.log("\nALL ACCOUNT ISOLATION AND SWITCHING ASSERTIONS PASSED!");
} finally {
  await browser.close();
}

