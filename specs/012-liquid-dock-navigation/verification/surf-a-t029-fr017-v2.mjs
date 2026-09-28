/* T029 follow-up: the `null` branch (FR-017). v2.
 *
 * PillNav computes `current = items.some(i => i.href === route) ? route : null`, so on a nested route
 * (/shop/<slug>) and on /cart there is no pill for the marker to rest under. The claim is that the
 * marker is then ABSENT — not defaulted to «خانه», which is the bug the port's own header says it was
 * moved into the layout to fix.
 *
 * v1 of this file reported a FAIL that was its own bug, not the surface's: its card selector matched
 * nothing, no click happened, and it then asserted "nested route" while still sitting on /shop — where
 * the marker resting under «فروشگاه» is exactly right. v2 DERIVES the nested route from the page's own
 * anchors and refuses to score a case it did not actually reach.
 *
 * Read-only navigation; writes only into this directory.
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const DIR = "specs/012-liquid-dock-navigation/verification";
const GROUP = 'nav[aria-label="ناوبری اصلی"] [role="menubar"]';

const read = (sel) => {
  /* There are TWO groups matching this selector at 1280: the header pills and the
     mobile dock, which is `md:hidden` but still in the document. querySelector
     returns the dock, whose marker is a legitimate 0-width hidden shape — so the
     first pass of this file reported "marker absent" on the home page and would
     have called a working surface broken. Pick the one that actually paints. */
  const candidates = [...document.querySelectorAll(sel)];
  const visible = candidates.filter((g) => g.getBoundingClientRect().width > 1);
  const group = visible.length === 1 ? visible[0] : null;
  if (!group) return { error: "pill group not uniquely visible", groups: candidates.length, visible: visible.length };
  const marker = group.querySelector('span[aria-hidden="true"]');
  const r = marker.getBoundingClientRect();
  const cs = getComputedStyle(marker);
  return {
    route: location.pathname,
    groupsMatched: candidates.length, visibleGroups: visible.length,
    markedPills: [...group.querySelectorAll("[role=menuitem]")].filter((a) => a.getAttribute("aria-current")).map((a) => a.innerText.trim()),
    markerOpacity: cs.opacity,
    markerVisibility: cs.visibility,
    markerRect: { x: +r.x.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
    paints: cs.opacity !== "0" && cs.visibility !== "hidden" && r.width > 0.5,
  };
};

const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const out = {};

/* `networkidle` never arrives on /cart in dev — the page keeps a request open. Land the document,
   wait for the pill group, then let the flight window close. */
/* v2's first pass scored `/` as a FAIL on a fixed 1400ms wait. surf-a-t029-parktrace.mjs
   shows why that is wrong here: the port parks the marker ~5s after a cold dev-mode home
   load (hydration, not the animation), and it is never `placed="1"` with a zero width. So
   wait for placement, not for a stopwatch — otherwise the harness reports a working surface
   as broken, which is worse than reporting nothing. */
const settle = async () => {
  await page
    .waitForFunction(
      (sel) => {
        const g = [...document.querySelectorAll(sel)].find((x) => x.getBoundingClientRect().width > 1);
        if (!g) return false;
        const m = g.querySelector('span[aria-hidden="true"]');
        const placed = g.dataset.lsPlaced === "1";
        const painted = m.getBoundingClientRect().width > 1 || g.querySelector('[aria-current="page"]') === null;
        return placed && painted;
      },
      GROUP,
      { timeout: 30000 },
    )
    .catch(() => {});
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(900);
};
const goto = async (route) => {
  await page.goto(`http://localhost:3000${route}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await settle();
};

await goto("/shop");

// Derive a real product URL from the page rather than guessing a selector shape.
const nested = await page.evaluate(() => {
  const anchors = [...document.querySelectorAll("a[href]")];
  const el = anchors.find((a) => /^\/shop\/[^?]+$/.test(a.getAttribute("href") || "") || /^\/product\/.+/.test(a.getAttribute("href") || ""));
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { href: el.getAttribute("href"), cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
});
out.nestedRouteFound = nested?.href ?? null;

if (nested) {
  await goto(nested.href); // warm it, so a dev compile is not mistaken for a missing marker
  await goto("/shop");
  const fresh = await page.evaluate((h) => {
    const el = [...document.querySelectorAll("a[href]")].find((a) => a.getAttribute("href") === h);
    const r = el.getBoundingClientRect();
    return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
  }, nested.href);
  await page.mouse.click(fresh.cx, fresh.cy); // a trusted click, the way a shopper arrives
  await settle();
  out.viaTrustedClickOnCard = await page.evaluate(read, GROUP);
  out.viaTrustedClickOnCard.reachedNested = out.viaTrustedClickOnCard.route === nested.href;
  await page.screenshot({ path: `${DIR}/surf-a-pills-1280-nested-route.png`, clip: { x: 700, y: 10, width: 570, height: 90 } });
}

/* A direct load of the nested route tests the SAME branch as the click — `items.some(...)`
   is false, so `value` is null — and unlike the click it does not depend on a card's hit
   area surviving a dev-mode hover panel. The click-versus-load distinction matters for
   TRAVEL, which is measured in surf-a-t029.mjs; for a resting state on an unmatched route,
   a load is the stronger control because nothing animated on the way there. */
if (nested) {
  await goto(nested.href);
  out.onNestedRoute = await page.evaluate(read, GROUP);
  /* `location.pathname` comes back percent-encoded for a Persian slug while the
     href in the markup is raw UTF-8, so a raw === compares two spellings of the
     same route and reports a successful load as a failure. */
  out.onNestedRoute.isNested =
    out.onNestedRoute.route === nested.href ||
    (() => { try { return decodeURIComponent(out.onNestedRoute.route) === nested.href; } catch { return false; } })();
}

await goto("/cart");
out.onCart = await page.evaluate(read, GROUP);

await goto("/");
out.onHome = await page.evaluate(read, GROUP);

writeFileSync(`${DIR}/surf-a-t029-fr017.json`, JSON.stringify(out, null, 2));

const checks = [];
if (out.viaTrustedClickOnCard) {
  const v = out.viaTrustedClickOnCard;
  checks.push({
    name: `nested route ${v.route}: marker absent, nothing marked`,
    skip: !v.reachedNested,
    ok: v.reachedNested && v.paints === false && v.markedPills.length === 0,
    detail: `reached=${v.reachedNested} paints=${v.paints} marked=${JSON.stringify(v.markedPills)} rect=${JSON.stringify(v.markerRect)}`,
  });
} else {
  checks.push({ name: "nested route", skip: true, ok: false, detail: "no product link found on /shop — case not exercised, so it is not a pass either" });
}
if (out.onNestedRoute) {
  const v = out.onNestedRoute;
  checks.push({ name: `nested route ${v.route}: marker absent, nothing marked`, ok: v.isNested && v.paints === false && v.markedPills.length === 0, detail: `isNested=${v.isNested} paints=${v.paints} marked=${JSON.stringify(v.markedPills)}` });
}
checks.push({ name: "/cart: marker absent, nothing marked", ok: out.onCart.paints === false && out.onCart.markedPills.length === 0, detail: `paints=${out.onCart.paints} marked=${JSON.stringify(out.onCart.markedPills)}` });
checks.push({ name: "/ home: marker present, exactly one pill marked", ok: out.onHome.paints === true && out.onHome.markedPills.length === 1, detail: `paints=${out.onHome.paints} marked=${JSON.stringify(out.onHome.markedPills)}` });

let fail = 0;
let ran = 0;
for (const c of checks) {
  if (c.skip) { console.log(`SKIP  ${c.name} — ${c.detail}`); continue; }
  ran++;
  if (!c.ok) fail++;
  console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name} — ${c.detail}`);
}
console.log(`\n${ran - fail}/${ran} scored (${checks.length - ran} skipped) — ${DIR}/surf-a-t029-fr017.json`);
await browser.close();
if (fail) process.exitCode = 1;
