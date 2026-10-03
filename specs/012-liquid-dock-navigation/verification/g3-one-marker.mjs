// 012-VERIFY-B · G3 — FR-033: at most one marker animating at any instant, across all surfaces.
//
// The shared component keeps a single global `inFlight`: starting a trip retires whoever was mid-flight.
// That has never been asserted in a browser. This measures it on the homepage, whose two marked groups
// are the header pills and the featured tabs, and counts simultaneously animating markers from in-page
// rAF samples (each marker's position relative to its group, so a scrolling page or a translating fixed
// header does not read as animation). Also the killed-halfway case — a second click landing mid-flight.
//
//   HAMI_BASE=http://localhost:3000 node specs/012-liquid-dock-navigation/verification/g3-one-marker.mjs
import { writeFileSync } from "node:fs";
import { launch, hydratedGoto, waitForScrollSettle, trustedClick, BASE } from "./surf-b-gate-lib.mjs";

const HOME = BASE;
const OUT = "specs/012-liquid-dock-navigation/verification/g3-one-marker.json";
const PILL_SEL = "nav[aria-label='ناوبری اصلی'] > div[class*='liquid-selection_group']";
const TAB_SEL = "[role='tablist']";

async function sampleAll(page, ms) {
  await page.evaluate((ms) => {
    window.__all = [];
    const t0 = performance.now();
    const tick = () => {
      const markers = [...document.querySelectorAll('span[class*="liquid-selection_marker"]')];
      window.__all.push(
        markers.map((m) => {
          const r = m.getBoundingClientRect();
          const g = m.parentElement;
          const gr = g.getBoundingClientRect();
          const gid = g.getAttribute("role") === "tablist" ? "featured-tabs"
            : g.getAttribute("aria-label")?.includes("ناوبری اصلی") ? "pills"
            : g.getAttribute("aria-label")?.includes("سریع") ? "dock"
            : (g.className || "").slice(0, 40);
          return { g: gid, x: r.x - gr.x, y: r.y - gr.y, w: r.width, h: r.height, o: Number(getComputedStyle(m).opacity) };
        }),
      );
      if (performance.now() - t0 < ms) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, ms);
}

async function readAll(page) {
  return page.evaluate(() => window.__all ?? []);
}

// Max simultaneously animating markers across the whole sample: for each consecutive pair, count the
// markers that changed position (and are visible). Returns the max and the instant it happened.
function maxSimultaneouslyAnimating(samples) {
  let max = 0;
  let maxAt = null;
  for (let i = 1; i < samples.length; i++) {
    const prev = new Map(samples[i - 1].map((m, idx) => [idx, m]));
    const cur = samples[i];
    let animating = 0;
    const moving = [];
    cur.forEach((m, idx) => {
      const p = prev.get(idx);
      if (!p) return; // appeared this frame — parked, not animating
      const moved = Math.abs(p.x - m.x) > 0.5 || Math.abs(p.y - m.y) > 0.5 ||
        Math.abs(p.w - m.w) > 0.5 || Math.abs(p.h - m.h) > 0.5;
      const visible = m.o > 0 && m.w > 0;
      if (moved && visible) {
        animating++;
        moving.push(m.g);
      }
    });
    if (animating > max) {
      max = animating;
      maxAt = { frame: i, moving };
    }
  }
  return { max, maxAt };
}

function movedFrames(samples, gid) {
  let n = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1].find((m) => m.g === gid);
    const b = samples[i].find((m) => m.g === gid);
    if (a && b && (Math.abs(a.x - b.x) > 0.5 || Math.abs(a.y - b.y) > 0.5 || Math.abs(a.w - b.w) > 0.5)) n++;
  }
  return n;
}

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await hydratedGoto(page, HOME, `${TAB_SEL} > button[data-ls-item]`);
await waitForScrollSettle(page);

// Finding: can the homepage's two marked groups be on screen together? The header auto-hides on
// scroll-down; the featured tabs sit far below. Measure both at the top and after a scroll.
const visibility = await page.evaluate(() => {
  const pr = document.querySelector("nav[aria-label='ناوبری اصلی']")?.getBoundingClientRect();
  const tr = document.querySelector("[role='tablist']")?.getBoundingClientRect();
  return {
    atTop: {
      pillsVisible: Boolean(pr && pr.top < innerHeight && pr.bottom > 0),
      tabsVisible: Boolean(tr && tr.top < innerHeight && tr.bottom > 0),
      tabsTop: tr ? Math.round(tr.top) : null,
    },
  };
});
await page.evaluate(() => window.scrollTo({ top: 300, behavior: "instant" }));
await waitForScrollSettle(page);
await page.waitForTimeout(500); // the header's hide transition is 300ms — let it finish
visibility.afterScroll = await page.evaluate(() => {
  const pr = document.querySelector("nav[aria-label='ناوبری اصلی']")?.getBoundingClientRect();
  const tr = document.querySelector("[role='tablist']")?.getBoundingClientRect();
  return {
    pillsVisible: Boolean(pr && pr.top < innerHeight && pr.bottom > 0),
    tabsVisible: Boolean(tr && tr.top < innerHeight && tr.bottom > 0),
  };
});
console.log("visibility finding:", JSON.stringify(visibility));

// --- Case A: change selection in one group while the other is mid-flight ---
// featured tab (in-place trip) -> scroll up to reveal the header (tab marker keeps travelling) -> pill
// (navigation trip). The pill's trip must retire the tab's. Count simultaneously animating markers.
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await waitForScrollSettle(page);
await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ behavior: "instant", block: "center" }), TAB_SEL);
await waitForScrollSettle(page);
await page.waitForTimeout(300);
await sampleAll(page, 3000);
await trustedClick(page, `${TAB_SEL} > button[data-ls-item]:nth-of-type(2)`);
await page.waitForTimeout(200);
await page.evaluate(() => window.scrollBy({ top: -140, behavior: "instant" }));
await waitForScrollSettle(page);
await page.waitForTimeout(150);
await trustedClick(page, `${PILL_SEL} > a[data-ls-item]:nth-of-type(2)`);
await page.waitForTimeout(1800);
const urlAfterPill = await page.evaluate(() => location.href);
const samplesA = await readAll(page);
const caseA = maxSimultaneouslyAnimating(samplesA);
console.log("Case A (two groups):", JSON.stringify(caseA),
  "pills-moved-frames:", movedFrames(samplesA, "pills"),
  "tabs-moved-frames:", movedFrames(samplesA, "featured-tabs"),
  "urlAfterPill:", urlAfterPill);

// --- Case B (killed halfway): two clicks inside the featured tabs, the second lands mid-flight ---
await hydratedGoto(page, HOME, `${TAB_SEL} > button[data-ls-item]`);
await waitForScrollSettle(page);
await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ behavior: "instant", block: "center" }), TAB_SEL);
await waitForScrollSettle(page);
await page.waitForTimeout(300);
await sampleAll(page, 2200);
await trustedClick(page, `${TAB_SEL} > button[data-ls-item]:nth-of-type(2)`);
await page.waitForTimeout(140);
await trustedClick(page, `${TAB_SEL} > button[data-ls-item]:nth-of-type(3)`);
await page.waitForTimeout(1600);
const samplesB = await readAll(page);
const caseB = maxSimultaneouslyAnimating(samplesB);
console.log("Case B (killed halfway):", JSON.stringify(caseB));

const verdict = {
  visibilityFinding: visibility,
  caseA_twoGroups: caseA,
  caseB_killedHalfway: caseB,
  pass: caseA.max <= 1 && caseB.max <= 1,
};
console.log(JSON.stringify(verdict, null, 2));
writeFileSync(OUT, JSON.stringify({ ...verdict, samplesA, samplesB }, null, 2));
console.log(`\nwrote ${OUT}`);
await browser.close();
process.exit(verdict.pass ? 0 : 1);
