import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
const FA = /[۰-۹]/;
const b = await chromium.launch({ headless: true, executablePath: "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome" });
const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultNavigationTimeout(120000);
for (const url of [
  "/shop?category=" + encodeURIComponent("موبایل-و-تبلت"),
  "/shop?category=" + encodeURIComponent("پاور-بانک"),
  "/shop?category=" + encodeURIComponent("موبایل"),
  "/categories/" + encodeURIComponent("موبایل-و-تبلت"),
  "/categories/" + encodeURIComponent("پاور-بانک"),
]) {
  await page.goto("http://localhost:3000" + url, { waitUntil: "commit" });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1800);
  const read = await page.evaluate(() => {
    const aside = document.querySelector("aside");
    const hits = [...document.querySelectorAll("p,span,b,h1")]
      .filter((n) => n.children.length === 0 && /محصول/.test(n.textContent ?? ""))
      .map((n) => ({ in: n.closest("aside") ? "aside" : n.closest("header") ? "header" : "body", t: n.textContent.trim().replace(/\s+/g, " ").slice(0, 60) }));
    const cards = document.querySelectorAll("main article").length;
    const pager = [...document.querySelectorAll("nav,button")].some((n) => /صفحه/.test(n.textContent ?? ""));
    return { hits: hits.slice(0, 6), cards, pager };
  });
  console.log("\n" + decodeURIComponent(url));
  for (const h of read.hits) console.log("   ", h.in.padEnd(7), h.t);
  console.log("    cards:", read.cards, "pager:", read.pager);
}
await b.close();
