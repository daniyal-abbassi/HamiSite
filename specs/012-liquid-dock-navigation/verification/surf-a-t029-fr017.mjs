/* T029 follow-up: the `null` branch.
 *
 * PillNav computes `current = items.some(i => i.href === route) ? route : null`, so on a nested route
 * (/shop/<slug>) and on /cart there is no pill for the marker to rest under. The claim is that the
 * marker is then ABSENT, not defaulted to «خانه» — FR-017, the bug the port's own header says it was
 * moved into the layout to fix. Measured here on real pages rather than argued from the source.
 *
 * Read-only navigation; no writes outside this directory.
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const DIR = "specs/012-liquid-dock-navigation/verification";
const GROUP = 'nav[aria-label="ناوبری اصلی"] [role="menubar"]';

const read = (sel) => {
  const group = document.querySelector(sel);
  if (!group) return { error: "no pill group" };
  const marker = group.querySelector('span[aria-hidden="true"]');
  const r = marker.getBoundingClientRect();
  const cs = getComputedStyle(marker);
  return {
    route: location.pathname,
    markedPills: [...group.querySelectorAll("[role=menuitem]")].filter((a) => a.getAttribute("aria-current")).map((a) => a.innerText.trim()),
    markerOpacity: cs.opacity,
    markerVisibility: cs.visibility,
    markerRect: { x: +r.x.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
    // A marker is absent when it paints nothing, whatever box GSAP left on it.
    paints: cs.opacity !== "0" && cs.visibility !== "hidden" && r.width > 0.5,
  };
};

const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const out = {};

/* `networkidle` never arrives on /cart in dev — the page keeps a request open —
   and it is not what this probe needs. Land the document, then wait for the pill
   group to exist and the flight window to close. */
const settle = async () => {
  await page.waitForSelector(GROUP, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(1400);
};
const goto = async (route) => {
  await page.goto(`http://localhost:3000${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle();
};

for (const r of ["/", "/shop", "/cart"]) await goto(r);

// A product page, reached the way a shopper does: trusted click on the first card.
await goto("/shop");
const card = await page.evaluate(() => {
  const a = document.querySelector('main a[href^="/shop/"], a[href^="/product/"], a[href^="/shop?"]') ||
    [...document.querySelectorAll("a")].find((x) => /^\/shop\/.+/.test(x.getAttribute("href") || ""));
  if (!a) return null;
  const r = a.getBoundingClientRect();
  return { href: a.getAttribute("href"), cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
});
if (card) {
  await page.mouse.click(card.cx, card.cy);
  await page.waitForTimeout(1600);
}
out.viaTrustedClickOnCard = await page.evaluate(read, GROUP);
await page.screenshot({ path: `${DIR}/surf-a-pills-1280-nested-route.png`, clip: { x: 700, y: 10, width: 570, height: 90 } });

out.onCart = await (async () => {
  await goto("/cart");
  return page.evaluate(read, GROUP);
})();

out.onHome = await (async () => {
  await goto("/");
  return page.evaluate(read, GROUP);
})();

writeFileSync(`${DIR}/surf-a-t029-fr017.json`, JSON.stringify(out, null, 2));
const checks = [
  ["nested product route: marker absent, nothing marked", out.viaTrustedClickOnCard, false],
  ["/cart: marker absent, nothing marked", out.onCart, false],
  ["/ home: marker present, exactly one pill marked", out.onHome, true],
];
let fail = 0;
for (const [name, v, wantPainted] of checks) {
  const painted = v?.paints;
  const marked = v?.markedPills?.length ?? -1;
  const ok = wantPainted ? painted === true && marked === 1 : painted === false && marked === 0;
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} — paints=${painted} marked=${JSON.stringify(v?.markedPills)} rect=${JSON.stringify(v?.markerRect)}`);
}
console.log(`\n${checks.length - fail}/${checks.length} — ${DIR}/surf-a-t029-fr017.json`);
await browser.close();
if (fail) process.exitCode = 1;
