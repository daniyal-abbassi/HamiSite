/*
 * T008 — SC-001's length, and the pin the band only works if it actually holds.
 *
 * SC-001 is not "shorter is nice": the band must come in at ≤ 2,400px at 360px against the 2,961px it replaces,
 * and spec.md:199-200 says a band that lands at 2,900px has met the letter of "no worse" and failed the decision.
 * So the length is measured, not reasoned about, and it is measured against the thing a shopper travels — the
 * section's rendered height at 360px, in the settled state, after layout has stopped moving.
 *
 * The second assertion is why this script does not stop at a number. The composition is a sticky shell inside a
 * taller scrolling track, and a shell only behaves like one if it genuinely pins: `top` has to hold at 0 for the
 * whole window in which the beats are supposed to play. The known failure is arithmetic rather than visual — a
 * shell with `min-height: 100svh` inside a section that measures taller than a viewport never pins at 360,
 * because there is no scroll distance left over for it to stick through. That reads as "the animation is broken"
 * while every individual number looks correct, so it gets its own boolean here.
 *
 * Both numbers are printed whether or not they pass, and `100svh` is resolved rather than assumed: on a mobile
 * browser the small viewport is not `innerHeight`, and the pin window depends on which of the two the CSS used.
 *
 *   node specs/007-motion-assembly-band/verification/band-length.mjs
 *   BASE_URL=http://localhost:3000 node …/band-length.mjs
 *
 * Exit 0 when height ≤ 2,400px and the shell pins; 1 when either fails; 2 when the harness could not answer.
 *
 * Expected red today, on both counts: there is no band on the page to measure, because T012 is still open. The
 * three sections it replaces are measured instead and printed as the denominator, so a run today still produces
 * the SC-001 control number rather than an error.
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const VW = Number(process.env.VIEWPORT_W ?? 360);
const MAX_HEIGHT = Number(process.env.MAX_HEIGHT ?? 2400);
const BAND_SELECTOR = "section.assembly-band";
const SHELL_SELECTOR = "section.assembly-band .assembly-band__shell";
/** The three sections the band replaces — SC-001's denominator, and today's only geometry. */
const LEGACY = ["store-experience", "trust", "final-conversion"];

const broken = (msg) => {
  console.log(`\nHARNESS COULD NOT ANSWER — ${msg}`);
  process.exit(2);
};

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: VW, height: 800 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.setDefaultTimeout(120_000);

try {
  /**
   * `domcontentloaded`, not `load`. On `next dev` the homepage's subresources (per-route compile, fonts, the
   * product imagery) do not finish inside Playwright's default navigation budget — a bare curl of `/` measured
   * 31.6s on this box while this script was writing itself, and a `load` wait blew past 120s and exited 2 with
   * "could not answer". The geometry needs the document laid out, which is what `domcontentloaded` plus the
   * settle below actually guarantees; waiting for every image byte would only make the measurement flakier.
   */
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 240_000 });
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
} catch (e) {
  broken(`could not load ${BASE}/: ${e.message}. Is the dev server up?`);
}
await page.waitForTimeout(3_000);

/**
 * The homepage runs Lenis smooth scrolling, so a programmatic `scrollTo()` is eased like any other input and
 * takes about a second to arrive. Sampling during the glide measures a position between the two requested ones,
 * which is how a pin test can report a shell that never pins on a page that pins perfectly. Poll for a stable
 * `scrollY` before every reading.
 */
const settle = (budgetMs = 3_000) =>
  page.evaluate(
    async (budget) => {
      const t0 = performance.now();
      let last = scrollY;
      let stable = 0;
      while (performance.now() - t0 < budget) {
        await new Promise((r) => requestAnimationFrame(r));
        if (Math.abs(scrollY - last) < 0.5) stable += 1;
        else stable = 0;
        last = scrollY;
        if (stable >= 4) return { ms: Math.round(performance.now() - t0), settled: true };
      }
      return { ms: Math.round(performance.now() - t0), settled: false };
    },
    budgetMs,
  );

const support = await page.evaluate(() => ({
  viewTimeline: CSS.supports("animation-timeline", "view()"),
  scrollTimeline: CSS.supports("animation-timeline", "scroll()"),
  ua: navigator.userAgent,
}));

const geometry = await page.evaluate(
  ({ bandSel, shellSel, legacy }) => {
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:-9999px;height:100svh;width:1px";
    document.body.appendChild(probe);
    const svh = probe.getBoundingClientRect().height;
    probe.remove();

    const band = document.querySelector(bandSel);
    const shell = document.querySelector(shellSel);
    const legacyTotal = legacy.reduce((sum, id) => {
      const el = document.getElementById(id);
      return sum + (el ? el.getBoundingClientRect().height : 0);
    }, 0);
    return {
      innerHeight: window.innerHeight,
      svh100: svh,
      bandFound: Boolean(band),
      shellFound: Boolean(shell),
      bandHeight: band ? band.getBoundingClientRect().height : null,
      bandTop: band ? band.getBoundingClientRect().top + scrollY : null,
      shellHeight: shell ? shell.getBoundingClientRect().height : null,
      shellPosition: shell ? getComputedStyle(shell).position : null,
      legacyFound: legacy.filter((id) => document.getElementById(id)),
      legacyTotal,
    };
  },
  { bandSel: BAND_SELECTOR, shellSel: SHELL_SELECTOR, legacy: LEGACY },
);

let pin = null;
if (geometry.bandFound && geometry.shellFound) {
  const travel = geometry.bandHeight - geometry.shellHeight;
  const samples = 9;
  const tops = [];
  for (let i = 0; i <= samples; i += 1) {
    const frac = i / samples;
    await page.evaluate((y) => scrollTo(0, y), geometry.bandTop + travel * frac);
    const s = await settle();
    const top = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? el.getBoundingClientRect().top : null;
    }, SHELL_SELECTOR);
    tops.push({ frac: Math.round(frac * 100), top: top === null ? null : Number(top.toFixed(1)), moved: !s.settled });
  }
  pin = { travel, tops };
}

await browser.close();

console.log(`${BASE} at ${VW}×${geometry.innerHeight} (100svh resolves to ${geometry.svh100}px)`);
console.log(`engine: ${support.ua.match(/Chrome\/[\d.]+/)?.[0] ?? "unknown"}  CSS.supports animation-timeline: view() → ${support.viewTimeline}  scroll() → ${support.scrollTimeline}`);
console.log("");

if (!geometry.bandFound) {
  console.log(`band section:      ABSENT (${BAND_SELECTOR} matches nothing)`);
  console.log(`sticky shell:      ${geometry.shellFound ? "present" : "ABSENT"}`);
  console.log(`replaced sections: ${geometry.legacyFound.join(", ") || "none found"} — together ${Math.round(geometry.legacyTotal)}px at ${VW}px`);
  console.log(`SC-001 denominator printed above; spec.md:20 says 2,961px at 360.`);
  console.log(`\nheight ≤ ${MAX_HEIGHT}px:  FAIL — no band to measure`);
  console.log(`pin:                   FAIL — no shell to hold position`);
  console.log(`\nFAIL — no AssemblyBand on the page (T012 open: app/(main)/page.tsx still mounts the three sections). Both counts fail because there is nothing to measure, which is the expected red.`);
  process.exit(1);
}

console.log(`band section:      ${Math.round(geometry.bandHeight)}px`);
console.log(`sticky shell:      ${Math.round(geometry.shellHeight)}px  (position: ${geometry.shellPosition})`);
console.log(`pin travel:        ${pin ? Math.round(pin.travel) : "?"}px of scroll in which the shell must hold top:0`);
if (pin) {
  for (const t of pin.tops) {
    console.log(`  ${String(t.frac).padStart(3)}%  shell top ${t.top}px${t.moved ? "  [still moving]" : ""}`);
  }
}

const TOLERANCE = 1.5;
const pinned =
  pin !== null &&
  pin.travel > 0 &&
  pin.tops.every((t) => t.top !== null && Math.abs(t.top) <= TOLERANCE && !t.moved);
const withinLength = geometry.bandHeight <= MAX_HEIGHT;

console.log(`\nheight ≤ ${MAX_HEIGHT}px:  ${withinLength ? "PASS" : "FAIL"} — ${Math.round(geometry.bandHeight)}px, ${Math.max(0, Math.round(geometry.bandHeight - MAX_HEIGHT))}px over`);
console.log(`pin (top holds at 0): ${pinned ? "PASS" : "FAIL"}${pin === null ? " — shell not measurable" : ""}`);

const failed = !withinLength || !pinned;
console.log(`\n${failed ? "FAIL" : "PASS"} — SC-001 length within budget and the shell actually pins at ${VW}px`);
process.exit(failed ? 1 : 0);
