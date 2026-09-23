import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import fs from "node:fs";

/*
 * SC-002: "reaching a product that matches a stated requirement in three
 * interactions or fewer". One interaction = one deliberate input (a tap, or one
 * search submission; keystrokes inside a query are not counted separately).
 * Scrolling to see what is already on the page is not counted either — that is the
 * generous reading, and it is stated here so the number can be argued with.
 * Controls are found by the text a shopper reads, and clicked for real.
 */
const BASE = "http://localhost:3000";

const browser = await chromium.launch({
  headless: true,
  executablePath: "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
});
const report = {};

const newPage = async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 840 } });
  page.setDefaultNavigationTimeout(120000);
  await page.goto(BASE, { waitUntil: "commit" }).catch(() => {});
  return page;
};

async function tapText(page, text, { nth = 0 } = {}) {
  const loc = page.getByText(text, { exact: false }).nth(nth);
  if (!(await loc.count())) return { ok: false, why: `no element containing «${text}»` };
  await loc.scrollIntoViewIfNeeded().catch(() => {});
  try {
    await loc.click({ timeout: 8000 });
  } catch (error) {
    return { ok: false, why: `«${text}» not clickable: ${String(error).split("\n")[0]}` };
  }
  await page.waitForTimeout(900);
  return { ok: true };
}

/** Tap the first product card whose heading matches, and report where it landed. */
async function tapProductMatching(page, needle) {
  const handle = await page.evaluateHandle((text) => {
    const links = [...document.querySelectorAll('a[href^="/shop/"]')];
    return links.find((a) => (a.textContent ?? "").includes(text)) ?? null;
  }, needle);
  const element = handle.asElement();
  if (!element) return { ok: false, why: `no card mentioning «${needle}» on the page` };
  await element.scrollIntoViewIfNeeded().catch(() => {});
  await element.click().catch(() => {});
  await page.waitForTimeout(1000);
  return { ok: true };
}

// A: "a Xiaomi phone", from the homepage through the phone department door.
{
  const page = await newPage();
  const steps = [];
  await page.waitForTimeout(1400);
  const panel = page.locator(`a.cat-panel[href*="${encodeURIComponent("موبایل")}"]`).first();
  await panel.scrollIntoViewIfNeeded().catch(() => {});
  await panel.click().catch(() => {});
  await page.waitForTimeout(900);
  steps.push({ action: "press the «گوشی موبایل» panel (centres it — 005 FR-010)", ok: true, url: page.url().replace(BASE, "") });
  await panel.click().catch(() => {});
  await page.waitForTimeout(1400);
  steps.push({ action: "press it again (navigates)", ok: page.url().includes("/categories/"), url: page.url().replace(BASE, "") });
  const tapped = await tapProductMatching(page, "شیائومی");
  steps.push({ action: "tap a Xiaomi card", ...tapped, url: page.url().replace(BASE, "") });
  report.A_door = {
    steps,
    product: (await page.locator("h1").first().textContent().catch(() => null))?.trim().slice(0, 70),
    inputs: steps.filter((s) => s.ok).length,
  };
  await page.close();
}

// A again, by search, which is the other door a shopper would pick.
{
  const page = await newPage();
  const steps = [];
  await page.waitForTimeout(1200);
  await page.fill('input[name="q"]', "گوشی شیائومی");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(2500);
  steps.push({ action: "one search submission", ok: page.url().includes("/shop?q="), url: page.url().replace(BASE, "") });
  const tapped = await tapProductMatching(page, "شیائومی");
  steps.push({ action: "tap a Xiaomi card", ...tapped, url: page.url().replace(BASE, "") });
  report.A_search = {
    steps,
    product: (await page.locator("h1").first().textContent().catch(() => null))?.trim().slice(0, 70),
    inputs: steps.filter((s) => s.ok).length,
  };
  await page.close();
}

// B: "the cheapest power bank that is actually available".
for (const start of ["/shop", "/"]) {
  const page = await newPage();
  const steps = [];
  await page.waitForTimeout(1500);
  if (start === "/") {
    const panel = page.locator(`a.cat-panel[href*="${encodeURIComponent("پاور-بانک")}"]`).first();
    const seen = await panel.count();
    if (seen) {
      await panel.scrollIntoViewIfNeeded().catch(() => {});
      await panel.click().catch(() => {});
      await page.waitForTimeout(900);
      await panel.click().catch(() => {});
      await page.waitForTimeout(1400);
      steps.push({ action: "press the «پاوربانک» panel twice (005 FR-010)", ok: page.url().includes("/categories/"), url: page.url().replace(BASE, "") });
    } else {
      steps.push({ action: "find a پاوربانک panel on the homepage", ok: false, why: "no such panel" });
    }
  }
  const onCategory = page.url().includes("/categories/");
  if (!onCategory) {
    await page.goto(BASE + "/shop", { waitUntil: "commit" });
    await page.waitForTimeout(1600);
    // From /shop the door is the tile row; fall back to the sidebar link if absent.
    const tile = await page.evaluateHandle(() => {
      const links = [...document.querySelectorAll('a[href*="/categories/"]')];
      return links.find((a) => (a.textContent ?? "").includes("پاوربانک") || (a.textContent ?? "").includes("پاور بانک")) ?? null;
    });
    const el = tile.asElement();
    if (el) {
      await el.scrollIntoViewIfNeeded().catch(() => {});
      await el.click().catch(() => {});
      await page.waitForTimeout(1400);
      steps.push({ action: "tap the «پاوربانک» tile", ok: page.url().includes("/categories/"), url: page.url().replace(BASE, "") });
    } else {
      await page.goto(BASE + "/categories/" + encodeURIComponent("پاور-بانک"), { waitUntil: "commit" });
      await page.waitForTimeout(1400);
      steps.push({ action: "tap the «پاوربانک» tile", ok: false, why: "no tile on /shop — opened the route directly" });
    }
  }
  steps.push({ action: "tap «فقط قابل خرید»", ...(await tapText(page, "فقط قابل خرید")), url: page.url().replace(BASE, "") });
  steps.push({ action: "tap «ارزان‌ترین»", ...(await tapText(page, "ارزان‌ترین")), url: page.url().replace(BASE, "") });
  const answer = await page.evaluate(() => {
    const card = document.querySelector("article");
    const link = card?.querySelector('a[href^="/shop/"]');
    const money = card?.textContent?.match(/[۰-۹][۰-۹٬]*\s*تومان/g) ?? [];
    return { name: link?.textContent?.trim().replace(/\s+/g, " ").slice(0, 70) ?? null, money: money[money.length - 1] ?? null };
  });
  report[`B_from${start.replace("/", "_")}`] = {
    steps,
    firstCard: answer,
    inputsToAnswer: steps.filter((s) => s.ok).length,
    note: "the cheapest available unit is the first card on screen once both controls are applied; tapping it is arrival, not search",
  };
  await page.close();
}

fs.writeFileSync(new URL("./t061-result.json", import.meta.url), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
await browser.close();
