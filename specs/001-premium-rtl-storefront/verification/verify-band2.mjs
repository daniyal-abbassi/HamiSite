import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const browser = await chromium.launch({
  headless: true,
  executablePath: "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
});
const out = {};

async function open(width) {
  const page = await browser.newPage({ viewport: { width, height: 840 } });
  page.setDefaultNavigationTimeout(120000);
  return page;
}

// 1. /shop tiles: labels, counts, and whether a tile's number is its destination's number.
{
  const page = await open(390);
  await page.goto(BASE + "/shop", { waitUntil: "commit" });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1600);
  out.tiles = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href^="/categories/"]')].filter((a) => a.closest("section"));
    return links.slice(0, 8).map((a) => ({
      label: a.textContent?.trim().replace(/\s+/g, " "),
      href: a.getAttribute("href"),
    }));
  });
  const mobileTile = out.tiles.find((t) => t.href?.includes(encodeURIComponent("موبایل-و-تبلت")));
  out.mobileTile = mobileTile ?? null;
  await page.close();
}

// 2. the sidebar facet: label number vs result total.
{
  const page = await open(1280);
  await page.goto(BASE + "/shop", { waitUntil: "commit" });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1600);
  out.sidebar = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("aside button[aria-pressed]")];
    return buttons
      .map((b) => ({ text: b.textContent?.trim().replace(/\s+/g, " "), pressed: b.getAttribute("aria-pressed") }))
      .slice(0, 24);
  });
  const target = `?category=${encodeURIComponent("موبایل-و-تبلت")}`;
  await page.goto(BASE + "/shop" + target, { waitUntil: "commit" });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1600);
  out.facetResult = {
    url: target,
    total: (await page.locator("text=/\\d+ محصول/").first().textContent().catch(() => null))?.trim(),
    chips: await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => b.textContent?.trim()).filter((t) => t && /×|پاک کردن/.test(t))),
    cards: await page.locator("article").count(),
  };
  await page.close();
}

// 3. a destination with both controls applied.
{
  const page = await open(390);
  const url = BASE + "/categories/" + encodeURIComponent("پاور-بانک") + "?sort=price-asc&obtainable=1";
  await page.goto(url, { waitUntil: "commit" });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1600);
  out.powerbankFiltered = {
    heading: (await page.locator("h1").first().textContent())?.trim(),
    countLine: (await page.locator("header p").nth(1).textContent().catch(() => null))?.trim().replace(/\s+/g, " "),
    firstCard: (await page.locator("article").first().textContent().catch(() => null))?.trim().replace(/\s+/g, " ").slice(0, 120),
    controls: await page.evaluate(() =>
      [...document.querySelectorAll('[role="group"] button, [role="group"] a')].map((n) => ({
        text: n.textContent?.trim(),
        pressed: n.getAttribute("aria-pressed"),
      })),
    ),
  };
  await page.close();
}

// 4. chrome at three widths: the dial tab and the header link.
for (const width of [360, 768, 1440]) {
  const page = await open(width);
  await page.goto(BASE + "/shop", { waitUntil: "commit" });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1400);
  out[`chrome_${width}`] = await page.evaluate((vw) => {
    const dock = document.querySelector('nav[aria-label="ناوبری سریع فروشگاه"]');
    const dockItems = dock ? [...dock.querySelectorAll("a")] : [];
    const boxes = dockItems.map((a) => {
      const r = a.getBoundingClientRect();
      return { label: a.textContent?.trim(), w: Math.round(r.width), h: Math.round(r.height) };
    });
    const dial = document.querySelector('a[href^="tel:"]');
    const headerDial = [...document.querySelectorAll("header a[href^='tel:']")].map((a) => ({
      visible: getComputedStyle(a).display !== "none",
      text: a.textContent?.trim(),
    }));
    return {
      dockVisible: !!dock && getComputedStyle(dock).display !== "none",
      dockItems: boxes,
      dockWrapped: new Set(boxes.map((b) => b.label)).size !== boxes.length,
      dockOverflowX: dock ? Math.round(dock.getBoundingClientRect().right - vw) : null,
      anyDial: !!dial,
      headerDial,
    };
  }, width);
  await page.close();
}

fs.writeFileSync(new URL("./verify-result.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 4200));
await browser.close();
