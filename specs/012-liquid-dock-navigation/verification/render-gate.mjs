/* 012 T009/T010 — the isolated render gate, measured on a real dir="rtl" page.
 *
 *   G1 bar geometry with the module CSS mounted (FR-018 / SC-006)
 *   G2 what Chromium reports for offsetLeft under RTL — the claim the whole
 *      physical-coordinate convention rests on (FR-061)
 *   G3 ONE shape crossing FOUR slots, deforming, resting inside its group (FR-010/011)
 *   G4 reduced motion: right place on the first frame (FR-021 / SC-004)
 *   G5 server HTML: marker already parked before any script runs (FR-067 / FR-020)
 *   G6 the dial item is unmarkable (FR-015 / FR-012a)
 *   G7 a wrapped group reaches a second-line destination (FR-045)
 *
 * Usage: node specs/012-liquid-dock-navigation/verification/render-gate.mjs [base]
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const OUT = "specs/012-liquid-dock-navigation/verification";
const URL_ = `${BASE}/zz-ls-probe`;
const results = [];
const check = (id, pass, detail) => {
  results.push({ id, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${id}  ${detail}`);
};
const markerOf = (group) => `${group} span[class*='marker']`;

/* ---------------- G5: the served HTML, no browser ---------------- */
const html = await (await fetch(URL_)).text();
const markerTag = html.match(/<span[^>]*class="[^"]*marker[^"]*"[^>]*>/)?.[0] ?? null;
const parkedInHtml = markerTag ? /left:\s*80%/.test(markerTag) && /width:\s*20%/.test(markerTag) : false;
check("G5 server park at RTL index 0 = 80% (FR-067)", parkedInHtml, markerTag ? markerTag.slice(0, 170) : "no marker element in server HTML");
check("G5b genuinely RTL Persian", /dir="rtl"/.test(html) && /lang="fa"/.test(html), "dir=rtl and lang=fa in the served document");

const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(URL_, { waitUntil: "networkidle" });
await page.waitForSelector("#probe-dock a", { timeout: 20000 });
check("hydration", (await page.locator("#probe-dock a").count()) === 5, `5 dock anchors; ${errors.length} page errors${errors.length ? ` — ${errors[0].slice(0, 90)}` : ""}`);

/* ---------------- G2: offsetLeft under RTL ---------------- */
const slots = await page.evaluate(() =>
  [...document.querySelectorAll("#probe-dock a")].map((a) => ({
    text: a.textContent?.trim(),
    offsetLeft: a.offsetLeft,
    offsetWidth: a.offsetWidth,
    rectLeft: Math.round(a.getBoundingClientRect().left * 10) / 10,
  })),
);
console.log("\n   slot / offsetLeft / offsetWidth / rect.left");
for (const s of slots) console.log(`   ${String(s.text).padEnd(10)} ${String(s.offsetLeft).padStart(5)} ${String(s.offsetWidth).padStart(6)} ${String(s.rectLeft).padStart(8)}`);
const desc = slots.every((s, i) => i === 0 || s.offsetLeft < slots[i - 1].offsetLeft);
check("G2 RTL offsetLeft descends, physical from left", desc, slots.map((s) => s.offsetLeft).join(", "));
check("G2b equal-width slots", new Set(slots.map((s) => s.offsetWidth)).size === 1, `offsetWidth ${slots[0].offsetWidth}px each`);

/* ---------------- G1: geometry, with the padding question measured not argued ---------------- */
const geo = await page.evaluate((sel) => {
  const nav = document.querySelector("#probe-nav");
  const grp = document.querySelector("#probe-dock > div");
  const item = document.querySelector("#probe-dock a");
  const marker = document.querySelector(sel);
  return {
    navHeight: Math.round(nav.getBoundingClientRect().height * 100) / 100,
    navBottom: parseFloat(getComputedStyle(nav).bottom),
    navOffsetW: nav.offsetWidth,
    navClientW: nav.clientWidth,
    navPadLeftPx: getComputedStyle(nav).paddingLeft,
    groupWidth: Math.round(grp.getBoundingClientRect().width * 100) / 100,
    itemHeight: Math.round(item.getBoundingClientRect().height * 100) / 100,
    itemPadBlock: getComputedStyle(item).paddingBlockStart,
    markerBg: getComputedStyle(marker).backgroundColor,
    markerRadius: getComputedStyle(marker).borderRadius,
  };
}, markerOf("#probe-dock"));
console.log("\n   geometry:", JSON.stringify(geo));
check("G1 outer height 62px (FR-018)", geo.navHeight === 62, `${geo.navHeight}px`);
check("G1b bottom inset 12px (FR-018)", geo.navBottom === 12, `${geo.navBottom}px`);
check("G1c item kept py-1.5", geo.itemPadBlock === "6px", `padding-block-start ${geo.itemPadBlock}, item ${geo.itemHeight}px`);
check("G1d row is 334px (px-2 is voided by globals.css:912 by design)", geo.groupWidth === 334, `padding-left ${geo.navPadLeftPx} — a documented safe-area override, not a regression; group ${geo.groupWidth}px`);
check("G1e longest possible trip clears MAX_TRAVEL_PX", 4 * slots[0].offsetWidth < 320, `4 slots × ${slots[0].offsetWidth}px = ${4 * slots[0].offsetWidth}px vs the 320px ceiling`);

/* ---------------- G3 / G6 / FR-034: the motion group (buttons drive value) ---------------- */
const M = "#probe-motion";
const mk = markerOf(M);
const rest = await page.evaluate((s) => {
  const m = document.querySelector(s).getBoundingClientRect();
  const g = document.querySelector("#probe-motion > div").getBoundingClientRect();
  return { marker: { left: m.left, width: m.width }, group: { left: g.left, right: g.right } };
}, mk);

const domClick = (pg, sel) =>
  pg.evaluate((q) => {
    const el = document.querySelector(q);
    if (!el) throw new Error(`no element for ${q}`);
    el.click();
  }, sel);

// Sample the trip with rAF INSIDE the page. A Playwright round-trip costs more
// than a frame, and the whole flight is 620ms — sampling from outside cannot
// resolve it. This is the instrument that actually answers FR-010/FR-011.
const trip = await page.evaluate(async ([s, sel]) => {
  const marker = document.querySelector(s);
  const frames = [];
  let stop = false;
  const t0 = performance.now();
  const tick = () => {
    if (stop) return;
    const r = marker.getBoundingClientRect();
    const m = /matrix\(([^,]+),[^,]+,[^,]+,([^,]+)/.exec(getComputedStyle(marker).transform);
    frames.push({ t: Math.round(performance.now() - t0), left: Math.round(r.left * 10) / 10, w: Math.round(r.width * 10) / 10, sx: m ? Number(m[1]) : 1, wc: getComputedStyle(marker).willChange });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  await new Promise((r) => setTimeout(r, 150));
  const mark = frames.length;
  document.querySelector(sel).click();
  await new Promise((r) => setTimeout(r, 1200));
  stop = true;
  return { frames: frames.slice(mark), rest: frames[mark - 1] };
}, [mk, `${M} button[data-ls-item="account"]`]);
const samples = trip.frames;
const restW = trip.rest.w;
console.log("\n   rAF trip frames:", samples.length);
console.log("   " + samples.filter((_, i) => i % 2 === 0).map((f) => `${f.t}:${f.left}(${f.w}|sx${f.sx.toFixed(2)})`).join("  ").slice(0, 1000));
const distinct = new Set(samples.map((f) => f.left)).size;
const maxW = Math.max(...samples.map((f) => f.w));
const peakScaleX = Math.max(...samples.map((f) => f.sx));
const inside = samples.every((f) => f.left >= rest.group.left - 1 && f.left + f.w <= rest.group.right + 1);
const landed = await page.evaluate(
  ([s, sel]) => {
    const m = document.querySelector(s).getBoundingClientRect();
    const a = document.querySelector(sel).getBoundingClientRect();
    return { dx: Math.round((m.left - a.left) * 10) / 10, dw: Math.round((m.width - a.width) * 10) / 10 };
  },
  [mk, `${M} button[data-ls-item="account"]`],
);
// Overshoot = it went PAST its resting place and rang back. Travel here is
// right-to-left, so past means a left smaller than the final resting left.
const finalLeft = samples[samples.length - 1].left;
const overshot = Math.min(...samples.map((f) => f.left)) < finalLeft - 0.5;
check("G3 one shape crossed the row", distinct >= 12, `${distinct} distinct x positions across ${samples.length} rAF frames`);
check("G3b stretched then rang back on an elastic", peakScaleX > 1.18 && overshot, `peak scaleX ${peakScaleX.toFixed(3)} (upstream 1.25); rang back from ${Math.min(...samples.map((f)=>f.left))} to rest at ${finalLeft}`);
check("G3c stayed inside the group", inside, `group ${Math.round(rest.group.left)}..${Math.round(rest.group.right)}, ${samples.length} frames`);
check("G3d rested inset-6 inside its slot", Math.abs(landed.dx - 6) <= 1 && Math.abs(landed.dw + 12) <= 1, `dx ${landed.dx}px (want 6) dw ${landed.dw}px (want -12)`);
check("G3e exactly one marker element", (await page.locator(mk).count()) === 1, `${await page.locator(mk).count()} marker(s)`);

const restWC = await page.evaluate((s) => getComputedStyle(document.querySelector(s)).willChange, mk);
check("FR-034 no will-change at rest", restWC === "auto" || restWC === "normal", `will-change = ${restWC}`);

const callMarked = await page.evaluate(() => {
  const a = document.querySelector('#probe-dock a[data-ls-item="call"]');
  return { exists: Boolean(a), marked: a?.getAttribute("data-ls-marked"), ariaCurrent: a?.getAttribute("aria-current") };
});
check("G6 dial item is unmarkable", callMarked.exists && callMarked.marked === "0", JSON.stringify(callMarked));

/* ---------------- G4: reduced motion ---------------- */
const rmCtx = await browser.newContext({ viewport: { width: 360, height: 640 }, reducedMotion: "reduce" });
const rmPage = await rmCtx.newPage();
await rmPage.goto(URL_, { waitUntil: "networkidle" });
await rmPage.waitForSelector("#probe-motion button");
const rmBefore = await rmPage.evaluate((s) => document.querySelector(s).getBoundingClientRect().left, mk);
await domClick(rmPage, `${M} button[data-ls-item="shop"]`);
const rmAfter = await rmPage.evaluate(
  ([s, sel]) => {
    const m = document.querySelector(s);
    return { marker: m.getBoundingClientRect().left, slot: document.querySelector(sel).getBoundingClientRect().left, wc: getComputedStyle(m).willChange };
  },
  [mk, `${M} button[data-ls-item="shop"]`],
);
check(
  "G4 reduced motion lands on frame one",
  Math.abs(rmAfter.marker - (rmAfter.slot + 6)) <= 1 && Math.abs(rmAfter.marker - rmBefore) > 20,
  `${Math.round(rmBefore)} → ${Math.round(rmAfter.marker)} (slot ${Math.round(rmAfter.slot)}), will-change ${rmAfter.wc}`,
);

/* ---------------- G7: a wrapped group reaches a second line ---------------- */
const wrap = await page.evaluate(() => {
  const items = [...document.querySelectorAll("#probe-chips button")];
  return { count: items.length, rows: new Set(items.map((b) => b.offsetTop)).size };
});
if (wrap.rows > 1) {
  const lastId = await page.evaluate(() => {
    const items = [...document.querySelectorAll("#probe-chips button")];
    return items[items.length - 1].getAttribute("data-ls-item");
  });
  await domClick(page, `#probe-chips button[data-ls-item="${lastId}"]`);
  await page.waitForTimeout(900);
  const after = await page.evaluate(
    ([s, sel]) => {
      const m = document.querySelector(s).getBoundingClientRect();
      const a = document.querySelector(sel).getBoundingClientRect();
      return { dy: Math.round((m.top - a.top) * 10) / 10, dx: Math.round((m.left - a.left) * 10) / 10 };
    },
    [markerOf("#probe-chips"), `#probe-chips button[data-ls-item="${lastId}"]`],
  );
  check("G7 wrapped group reached a second-line slot", Math.abs(after.dy) <= 1.5 && Math.abs(after.dx) <= 1.5, `${wrap.rows} rows; marker off by dx ${after.dx} dy ${after.dy}`);
} else {
  check("G7 wrapped group (FR-045 UNMET)", false, `${wrap.count} chips stayed on ${wrap.rows} row — .group is display:flex with NO flex-wrap, so this component cannot produce a wrapped group at all. The corner trip kind exists in the geometry but is unreachable. ProductGallery and the variant chips DO wrap today.`);
}

await page.screenshot({ path: `${OUT}/gate-motion.png`, fullPage: true });

/* ---------------- FR-020: scripting blocked ---------------- */
const noJsCtx = await browser.newContext({ viewport: { width: 360, height: 640 }, javaScriptEnabled: false });
const noJsPage = await noJsCtx.newPage();
await noJsPage.goto(URL_, { waitUntil: "load" });
const noJs = await noJsPage.evaluate(() => {
  const active = document.querySelector("#probe-dock [class*='itemActive']");
  if (!active) return { found: false };
  const marker = document.querySelector("#probe-dock span[class*='marker']");
  return {
    found: true,
    text: active.textContent?.trim(),
    bg: getComputedStyle(active).backgroundColor,
    markerW: marker ? Math.round(marker.getBoundingClientRect().width * 10) / 10 : null,
  };
});
check("FR-020 current item identifiable with JS off", noJs.found && noJs.bg !== "rgba(0, 0, 0, 0)", JSON.stringify(noJs));
await noJsPage.screenshot({ path: `${OUT}/gate-no-js.png` });

await ctx.close();
await browser.close();
const failed = results.filter((r) => !r.pass);
writeFileSync(`${OUT}/render-gate.json`, JSON.stringify({ results, slots, geo, samples }, null, 2));
console.log(`\n${failed.length === 0 ? "ALL PASS" : `${failed.length} FAILED`} — ${results.length} checks → ${OUT}/render-gate.json`);
for (const f of failed) console.log(`  - ${f.id}: ${f.detail}`);
