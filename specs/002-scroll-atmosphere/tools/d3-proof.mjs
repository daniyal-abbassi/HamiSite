/**
 * Feature 002 — T009. Proof that the ground layer escapes the transform trap, not an assumption that
 * it does.
 *
 * research.md D3: a transformed ancestor becomes the containing block for `position: fixed`
 * descendants. Every homepage section is wrapped in `Reveal`, which animates
 * `transform: translateY(26px)` before it is visible. A ground layer mounted inside `<main>` would
 * therefore stop being viewport-anchored exactly when a section is mid-reveal — and a static screenshot
 * would not show it.
 *
 * So this proves three things, in order:
 *   1. the trap is real on this page — a fixed probe placed inside a transformed `Reveal` is captured by
 *      it and does NOT fill the viewport;
 *   2. `.hami-page-ground`, mounted in the layout, DOES fill the viewport, while that same transform is
 *      applied, and stays put across a scroll;
 *   3. the colour it carries is the colour the pure module says it should be at that position.
 *
 * Without (1) the test would pass on a page where fixed positioning was never at risk, which is not the
 * same as showing the placement was necessary.
 *
 * Usage: PLAYWRIGHT_PATH=/path/to/node_modules/playwright node specs/002-scroll-atmosphere/tools/d3-proof.mjs
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const loadChromium = () => {
  for (const id of [process.env.PLAYWRIGHT_PATH, "playwright"].filter(Boolean)) {
    try {
      const mod = require(id);
      if (mod?.chromium) return mod;
    } catch {
      /* next candidate */
    }
  }
  throw new Error("Playwright not resolvable. Set PLAYWRIGHT_PATH to a local playwright module directory.");
};

const { chromium } = loadChromium();
const URL = process.env.HAMI_URL || "http://localhost:3000/";

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  await page.goto(URL, { waitUntil: "load", timeout: 180000 });
  await page.waitForSelector(".hami-page-ground", { timeout: 120000 });
  await page.waitForTimeout(2500);

  const viewport = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));

  // ---- 1. the trap is real -------------------------------------------------
  const trap = await page.evaluate(() => {
    const reveal = [...document.querySelectorAll(".reveal")].find((el) => {
      const t = getComputedStyle(el).transform;
      return t && t !== "none" && !el.classList.contains("reveal--visible");
    });
    if (!reveal) return { found: false };
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed; inset:0; pointer-events:none;";
    reveal.appendChild(probe);
    const r = probe.getBoundingClientRect();
    const owner = getComputedStyle(reveal).transform;
    probe.remove();
    return {
      found: true,
      transform: owner.slice(0, 40),
      probe: { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) },
    };
  });
  check(
    "a transformed Reveal ancestor captures position:fixed",
    trap.found && (trap.probe.w < viewport.w - 2 || trap.probe.h < viewport.h - 2),
    trap.found ? `ancestor ${trap.transform} → probe ${trap.probe.w}×${trap.probe.h} (viewport ${viewport.w}×${viewport.h})` : "no transformed .reveal found",
  );

  // ---- 2. the ground is not captured --------------------------------------
  const groundRect = async () =>
    page.evaluate(() => {
      const el = document.querySelector(".hami-page-ground");
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left), top: Math.round(r.top) };
    });

  const atTop = await groundRect();
  check(
    ".hami-page-ground fills the viewport while that transform is applied",
    atTop.w === viewport.w && atTop.h === viewport.h && atTop.left === 0 && atTop.top === 0,
    JSON.stringify(atTop),
  );

  await page.evaluate(() => window.scrollTo({ top: 4200, behavior: "instant" }));
  await page.waitForTimeout(700);
  const afterScroll = await groundRect();
  check(
    "and stays viewport-anchored after a 4200px scroll",
    afterScroll.top === 0 && afterScroll.left === 0 && afterScroll.w === viewport.w,
    JSON.stringify(afterScroll),
  );

  // ---- 3. the colour is the module's, at that position ---------------------
  const observed = await page.evaluate(
    async () => {
      const root = document.documentElement;
      const scrollable = root.scrollHeight - innerHeight;
      const p = Math.min(1, Math.max(0, scrollY / scrollable));
      return { progress: p, applied: getComputedStyle(document.querySelector(".hami-page-ground")).backgroundColor };
    },
  );
  const expected = await page.evaluate(async (p) => {
    // The module is TypeScript, so compare against the value the hook itself wrote rather than
    // re-deriving it here; the unit test is what pins the function's output.
    const el = document.documentElement;
    return { declared: el.style.getPropertyValue("--hami-ground"), p };
  }, observed.progress);

  const rgbToHex = (rgb) => {
    const m = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
    return m ? `#${m.slice(1, 4).map((v) => Number(v).toString(16).padStart(2, "0")).join("")}` : rgb;
  };
  check(
    "the painted colour is the value the progression module resolved",
    Boolean(expected.declared) && rgbToHex(observed.applied) === expected.declared.toLowerCase(),
    `painted ${rgbToHex(observed.applied)} vs declared ${expected.declared}`,
  );

  const changed = await page.evaluate(async () => {
    const first = document.querySelector('.hami-page-ground').style.getPropertyValue("--hami-ground");
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return { first, last: document.querySelector('.hami-page-ground').style.getPropertyValue("--hami-ground") };
  });
  check(
    "the ground actually changes between the top and the bottom",
    changed.first !== changed.last,
    `${changed.first} → ${changed.last}`,
  );

  await browser.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
