/*
 * T059's instrument, and the only honest way to grade it: the behaviour is a click
 * handler, the suite has no DOM harness, and a test that imported the component would
 * assert a mock of a browser event rather than what a thumb does.
 *
 * It presses a panel that is NOT the active one, once, and asks whether the shopper
 * ended up somewhere else. Two answers are possible and only one is the intent:
 * `/categories/…` (navigated) or `/` (still on the homepage).
 *
 * Playwright does the hit-testing, not this script. Two earlier versions failed here in
 * ways that looked like findings: one clicked the first non-active panel with
 * `force: true`, which on the bent arc aims at a panel that another has rotated over,
 * and one hand-computed getBoundingClientRect and skipped panels whose centre sat off
 * screen — which silently graded a page it had not scrolled, printed "no reachable
 * panel", and blamed the shop for the probe. Letting the driver scroll the element into
 * view and refuse to click what is covered is both simpler and the same test a thumb
 * gets. Exit 2 means the probe itself learned nothing.
 *
 *   node specs/001-premium-rtl-storefront/verification/panel-press-navigates.mjs
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const decode = (u) => {
  try {
    return decodeURIComponent(u);
  } catch {
    return u;
  }
};

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME ?? "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
});
const page = await browser.newPage({ viewport: { width: 390, height: 840 } });
page.setDefaultNavigationTimeout(120000);

const home = async () => {
  await page.goto(`${BASE}/`, { waitUntil: "commit" });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2200);
};
await home();

const panels = page.locator('a.cat-panel[data-active="false"]');
const count = await panels.count();
const attempts = [];

for (let i = 0; i < count; i += 1) {
  const panel = panels.nth(i);
  const href = decode((await panel.getAttribute("href")) ?? "");
  try {
    await panel.click({ timeout: 5000 });
  } catch {
    attempts.push({ i, href, here: "not clickable — something covers its centre" });
    continue;
  }
  await page.waitForTimeout(1800);
  const here = decode(page.url().replace(BASE, "") || "/");
  attempts.push({ i, href, here });
  if (here.startsWith("/categories/")) {
    console.log(`PASS — one press on panel #${i} (${href}) → ${here}`);
    console.log(`  panels tried before it worked: ${attempts.length - 1}`);
    await browser.close();
    process.exit(0);
  }
  await home();
}

const clickable = attempts.filter((a) => !a.here.startsWith("not clickable"));
console.log(`FAIL — ${clickable.length} of ${count} non-active panels pressed, none navigated:`);
for (const a of attempts) console.log(`  #${a.i} ${a.href} → ${a.here}`);
if (clickable.length === 0) {
  console.log("  nothing was clickable at all: the probe learned nothing, not the shop");
  await browser.close();
  process.exit(2);
}
await browser.close();
process.exit(1);
