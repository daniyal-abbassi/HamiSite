/* 002 T031 — contract A5 / FR-025: "a hidden or backgrounded document runs nothing, and is already
 * correct on return."
 *
 * WHAT THIS INSTRUMENT CAN AND CANNOT DO, SAID UP FRONT. This Chromium build has no tab occlusion:
 * `bringToFront()` on a second tab leaves the first at visibilityState "visible", and neither
 * `Emulation.setVisibilityStateOverride` (the command does not exist) nor
 * `Page.setWebLifecycleState: frozen` (accepted, then ignored) changes that. A real "switch tab"
 * therefore cannot be scripted here, and this script does not pretend otherwise. It measures the
 * three properties that make A5 true and names the one it cannot:
 *
 *   1. RUNS NOTHING. useAtmosphereGround.ts writes the colour only inside a requestAnimationFrame
 *      scheduled by scroll / resize / orientationchange / reduced-motion-change — events a hidden
 *      document stops receiving. If instead it polled on a timer, it would keep writing while
 *      hidden and no browser could save it. So sit at one position with no input for two seconds
 *      and count writes to the element's style attribute. Zero is the proof of the mechanism; a
 *      non-zero count is exactly the bug A5 is about.
 *   2. ALREADY CORRECT ON RETURN. The hook's `visibilitychange` handler runs measure() then write().
 *      Inject a colour no stage of the progression can produce, dispatch the real event, and require
 *      the page to come back with the colour it shows when it scrolls to that position normally.
 *   3. NOTHING TO CATCH UP TO. The layer carries no transition, so "correct" cannot mean "converging".
 *
 * The unclosed gap — that Chromium suspends rAF for a backgrounded tab — is platform behaviour.
 * Close it by hand with a real tab switch, or re-run with --headed where a window can be obscured.
 *
 * Usage: node specs/002-scroll-atmosphere/tools/hidden-document.mjs [--base URL] [--headed]
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > -1 ? process.argv[i + 1] : d;
};
const BASE = arg("--base", "http://localhost:3000");
const HEADED = process.argv.includes("--headed");

const read = () => {
  const el = document.querySelector(".hami-page-ground");
  if (!el) return null;
  const cs = getComputedStyle(el);
  return {
    prop: el.style.getPropertyValue("--hami-ground") || null,
    color: cs.backgroundColor,
    scrollY: Math.round(window.scrollY),
    visibility: document.visibilityState,
    transition: `${cs.transitionProperty} ${cs.transitionDuration}`,
  };
};

const browser = await chromium.launch({ executablePath: EXE, headless: !HEADED, args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 360, height: 640 } });
const page = await context.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1800); // past the hook's 1500ms late-content re-measure

const doc = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, vh: innerHeight }));

// Six seconds, with a timestamp on every write, because the shape of the count is the answer.
// A single write early on is React committing its inline style during hydration; a write in the
// back half would be a timer, and a timer is what keeps running in a hidden tab.
const idle = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const el = document.querySelector(".hami-page-ground");
      const t0 = performance.now();
      const at = [];
      const obs = new MutationObserver(() => {
        at.push(Math.round(performance.now() - t0));
      });
      obs.observe(el, { attributes: true, attributeFilter: ["style"] });
      setTimeout(() => {
        obs.disconnect();
        resolve({ at, late: at.filter((ms) => ms > 3000).length });
      }, 6000);
    }),
);

console.log(`mode: ${HEADED ? "headed" : "headless"}`);
console.log(`1 idle at one position, 6s:     ${idle.late === 0 ? "PASS" : "FAIL"} — ${idle.at.length} colour write(s) at [${idle.at.join(", ")}]ms, ${idle.late} after the 3s mark`);
console.log("   (a timer-driven effect writes here, and would keep writing in a hidden tab)");

const yMid = Math.round((doc.h - doc.vh) * 0.55);
await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), yMid);
await page.waitForTimeout(700);
const scrolledThere = await page.evaluate(read);

await page.evaluate(() => {
  document.querySelector(".hami-page-ground").style.setProperty("--hami-ground", "rgb(1, 2, 3)");
});
await page.evaluate(() => {
  document.dispatchEvent(new Event("visibilitychange"));
});
await page.waitForTimeout(150);
const afterReturn = await page.evaluate(read);
console.log(`2 visibilitychange on return:   ${afterReturn.color === scrolledThere.color ? "PASS" : "FAIL"} — injected rgb(1,2,3), came back ${afterReturn.color}; scrolling here gives ${scrolledThere.color}`);
console.log(`3 nothing to catch up to:       ${/0s|none/.test(afterReturn.transition) ? "PASS" : "FAIL"} — computed transition "${afterReturn.transition}"`);

const other = await context.newPage();
await other.goto(`${BASE}/shop`, { waitUntil: "domcontentloaded" });
await other.bringToFront();
await page.waitForTimeout(500);
const occluded = await page.evaluate(() => document.visibilityState);
console.log(`\nreal tab occlusion:             ${occluded === "hidden" ? "AVAILABLE — repeat check 1 while hidden" : "NOT AVAILABLE in this build"} ("${occluded}" after another tab was brought to front)`);
if (occluded !== "hidden" && !HEADED) {
  console.log("   → the platform half of A5 stays unobserved. Checks 1-3 are the mechanism; a human tab switch, or --headed, closes the rest.");
}

const ok = idle.late === 0 && afterReturn.color === scrolledThere.color && /0s|none/.test(afterReturn.transition);
console.log(ok ? "\nPASS on the mechanism — the platform half is named above and still open." : "\nFAIL — see the lines above.");
await browser.close();
process.exit(ok ? 0 : 1);
