// Verification test for T022: Partner bundle correctness, prices, and role-based gating.
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const BASE = "http://127.0.0.1:3000";
const RETAIL = { identifier: process.env.PERF_RETAIL_IDENTIFIER, password: process.env.PERF_RETAIL_PASSWORD };
const PARTNER = { identifier: process.env.PERF_PARTNER_IDENTIFIER, password: process.env.PERF_PARTNER_PASSWORD };

if (!PARTNER.identifier || !PARTNER.password || !RETAIL.identifier || !RETAIL.password) {
  throw new Error("PERF credentials missing.");
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

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  // 1. Guest Access Verification
  await page.goto(`${BASE}/partners/bundles`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const guestBody = await page.evaluate(() => document.body.textContent || "");
  const guestBlocked = guestBody.includes("ورود به پنل همکاران");
  results.push({
    test: "guest_blocked_from_partner_bundles",
    passed: guestBlocked,
  });

  // 2. Retail Customer Access Verification
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#identifier");
  await page.fill("#identifier", RETAIL.identifier);
  await page.fill("#password", RETAIL.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });

  await page.goto(`${BASE}/partners/bundles`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const retailBody = await page.evaluate(() => document.body.textContent || "");
  const retailBlocked = retailBody.includes("دسترسی اختصاصی همکاران");
  results.push({
    test: "retail_customer_blocked_from_partner_bundles",
    passed: retailBlocked,
  });

  // 3. Wholesale Partner Access Verification
  await page.evaluate(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
  });
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#identifier");
  await page.fill("#identifier", PARTNER.identifier);
  await page.fill("#password", PARTNER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });

  await page.goto(`${BASE}/partners/bundles`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("article", { timeout: 15000 });

  const partnerDetails = await page.evaluate(() => {
    const articles = [...document.querySelectorAll("article")];
    const toEnDigits = (s) => (s || "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[^\d]/g, "");
    const bundles = articles.map((a) => {
      const title = a.querySelector("h3")?.textContent?.trim() || "";
      const priceText = a.querySelector(".toman-price")?.textContent || "";
      const price = toEnDigits(priceText);
      const isSoldOut = a.querySelector("button:disabled")?.textContent?.includes("اتمام") || false;
      return { title, price, isSoldOut };
    });
    return {
      count: articles.length,
      bundles,
    };
  });

  console.log("Partner bundles found:", partnerDetails);
  results.push({
    test: "partner_bundles_render_with_prices",
    passed: partnerDetails.count >= 1 && partnerDetails.bundles.every((b) => b.title.length > 0 && b.price.length > 0),
    count: partnerDetails.count,
    bundles: partnerDetails.bundles,
  });

  console.log("\n--- Partner Correctness Summary ---");
  console.log(JSON.stringify(results, null, 2));

  const allPassed = results.every((r) => r.passed);
  if (!allPassed) {
    console.error("Partner correctness assertions failed!");
    process.exit(1);
  }
  console.log("\nALL PARTNER CORRECTNESS ASSERTIONS PASSED!");
} finally {
  await browser.close();
}

