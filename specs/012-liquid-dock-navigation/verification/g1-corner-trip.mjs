// 012-VERIFY-B · G1 — the wrap-around (corner) trip, measured for the first time.
//
// `flex-wrap: wrap` landed on the shared `.group` after the render gate last ran, and the probe page
// that exercised it was retired. planTrip() returns `corner` for a marker leaving one row and arriving
// at the start of the next; that branch has never been watched execute in a browser.
//
// This builds the measurement on a real surface: the product gallery (product 40, 30 thumbs) wraps
// 4-per-row at 360px. The marker is walked to the LAST item of row one (index 3), then the FIRST item
// of row two (index 4) is clicked — the wrap-around trip. The marker's path is sampled with in-page
// rAF. Two legs (drop to row two, THEN cross) means the corner was taken; one leg (x and y changing
// together) means it was not.
//
//   HAMI_BASE=http://localhost:3000 node specs/012-liquid-dock-navigation/verification/g1-corner-trip.mjs
import { writeFileSync } from "node:fs";
import {
  launch,
  hydratedGoto,
  waitForScrollSettle,
  trustedClick,
  installSampler,
  readSamples,
  markerState,
  PRODUCT_GAL,
} from "./surf-b-gate-lib.mjs";

const SEL = "[role='group'][aria-label='نمای دیگر این محصول']";
const OUT = "specs/012-liquid-dock-navigation/verification/g1-corner-trip.json";

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 360, height: 740 } });
await hydratedGoto(page, PRODUCT_GAL, `${SEL} > button[data-ls-item]`);
await waitForScrollSettle(page);

// 0. confirm the surface genuinely wraps at 360px
const rows = await page.evaluate((s) => {
  const r = {};
  for (const b of document.querySelectorAll(s + " > button[data-ls-item]")) {
    const k = Math.round(b.getBoundingClientRect().y);
    r[k] = (r[k] || 0) + 1;
  }
  return r;
}, SEL);
const rowTops = Object.keys(rows).map(Number).sort((a, b) => a - b);
console.log("gallery rows at 360px:", JSON.stringify(rows), `(${rowTops.length} rows)`);

// 1. walk the marker to the LAST item of row one (index 3)
await trustedClick(page, `${SEL} > button[data-ls-item]:nth-of-type(4)`);
await page.waitForTimeout(900);
await waitForScrollSettle(page);
const before = await markerState(page, SEL);
const idx3 = await page.evaluate((s) => {
  const b = [...document.querySelectorAll(s + " > button[data-ls-item]")][3];
  const r = b.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width };
}, SEL);
console.log("marker parked on index 3 (last of row 1):", JSON.stringify(before.markerRect), "thumb:", JSON.stringify(idx3));

// 2. sample the wrap-around trip: index 3 -> index 4 (first of row two)
await installSampler(page, SEL);
await trustedClick(page, `${SEL} > button[data-ls-item]:nth-of-type(5)`);
await page.waitForTimeout(1100);
const samples = await readSamples(page);
const after = await markerState(page, SEL);
const idx4 = await page.evaluate((s) => {
  const b = [...document.querySelectorAll(s + " > button[data-ls-item]")][4];
  const r = b.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width };
}, SEL);

const startX = before.markerRect.x;
const finalX = after.markerRect.x;
const finalY = after.markerRect.y;
const idx4x = idx4.x;

// the drop leg ends when y first reaches the resting row; the cross leg ends when x first reaches it
const yFirst = samples.find((s) => Math.abs(s.y - finalY) < 2);
const xFirst = samples.find((s) => Math.abs(s.x - finalX) < 2);
const dropMs = yFirst ? yFirst.t : null;
const crossMs = xFirst ? xFirst.t : null;
const yFirstX = yFirst ? yFirst.x : null;
const crossedBeforeDrop = xFirst && yFirst ? xFirst.t < yFirst.t : null;
const dropThenCross = yFirst && xFirst ? yFirst.t < xFirst.t : false;

// count legs: a leg is a run where one axis moves while the other is ~still
let legs = 0;
let prev = null;
for (const s of samples) {
  if (s.opacity === 0) continue;
  if (prev) {
    const yMoved = Math.abs(s.y - prev.y) > 1;
    const xMoved = Math.abs(s.x - prev.x) > 1;
    if (yMoved !== xMoved) legs += 1; // exactly one axis moving = a leg boundary
  }
  prev = s;
}

const pressed = await page.evaluate((s) => {
  const buttons = [...document.querySelectorAll(s + " > button[data-ls-item]")];
  return buttons.findIndex((b) => b.getAttribute("aria-pressed") === "true");
}, SEL);

const verdict = {
  surface: "product 40 gallery, 30 thumbs, 4-per-row at 360px",
  rows: rowTops.length,
  trip: "index 3 (last of row 1) -> index 4 (first of row 2)",
  samples: samples.length,
  startX: Math.round(startX * 100) / 100,
  finalX: Math.round(finalX * 100) / 100,
  finalY: Math.round(finalY * 100) / 100,
  targetThumbX: Math.round(idx4x * 100) / 100,
  dropLegEndsAtMs: dropMs,
  crossLegEndsAtMs: crossMs,
  xWhenDropFinished: yFirstX,
  crossedBeforeDrop,
  dropThenCross,
  legBoundaries: legs,
  pressedIndex: pressed,
  cornerTaken: Boolean(dropThenCross && Math.abs(yFirstX - finalX) > 20 && pressed === 4),
};

console.log(JSON.stringify(verdict, null, 2));
writeFileSync(OUT, JSON.stringify({ ...verdict, samples }, null, 2));
console.log(`\nwrote ${OUT}`);
await browser.close();
process.exit(verdict.cornerTaken ? 0 : 1);
