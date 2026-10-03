/* True mid-flight proof for T029 — the header pills, a two-slot jump.
 *
 * Why this is roundabout: a page.screenshot() is a CDP round-trip and the flight
 * is ~620ms, so the pixels come back after the marker has landed. Screencast
 * frames are pushed as they are produced, so one can be selected by timestamp —
 * but the flight does not start at the click, because a dev-mode client
 * navigation only hands the group its new `value` once the route commits, which
 * measured here is 600-900ms in. Two passes that guessed an offset produced a
 * "midflight" PNG that was really at rest.
 *
 * So the page is asked instead of guessed: sample every animation frame, remember
 * the one that stretched the marker furthest, and match a screencast frame to
 * that exact instant. The authoritative numbers stay in surf-a-t029.mjs's rAF
 * sample; this file only makes the picture honest.
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const GROUP = 'nav[aria-label="ناوبری اصلی"] [role="menubar"]';
const DIR = "specs/012-liquid-dock-navigation/verification";

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
for (const route of ["/partners", "/shop", "/"]) {
  await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle" });
}
await page.evaluate(() => document.fonts?.ready);
await page.waitForTimeout(1800);

const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on("Page.screencastFrame", async (f) => {
  frames.push({ t: f.metadata.timestamp, data: f.data });
  await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send("Page.enable");
await cdp.send("Page.startScreencast", { format: "png", quality: 100, maxWidth: 1280, maxHeight: 900, everyNthFrame: 1 });

const target = await page.evaluate((sel) => {
  const links = [...document.querySelectorAll(`${sel} [role="menuitem"]`)];
  const t = links[links.length - 1]; // «همکاری عمده», two slots away in RTL
  const r = t.getBoundingClientRect();
  return { text: t.innerText.trim(), cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
}, GROUP);

// Record the peak-stretch frame, in the same epoch the screencast uses.
await page.evaluate(
  (sel) => {
    const t0 = performance.now();
    const origin = performance.timeOrigin;
    window.__peak = { epochS: null, scaleX: 1, spanMs: null };
    const tick = () => {
      const m = document.querySelector(`${sel} span[aria-hidden="true"]`);
      if (m) {
        const n = getComputedStyle(m).transform.match(/matrix\(([^)]+)\)/);
        const sx = n ? parseFloat(n[1].split(",")[0]) : 1;
        if (sx > window.__peak.scaleX) {
          // `performance.now()` is already measured from `timeOrigin`; adding the
          // local `t0` as well puts the epoch out by the page's own age, which is
          // how the first pass landed a frame 8.2s away from the one it wanted.
          window.__peak = { epochS: (origin + performance.now()) / 1000, scaleX: sx, spanMs: performance.now() - t0 };
        }
      }
      if (performance.now() - t0 < 2600) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },
  GROUP,
);

await page.mouse.click(target.cx, target.cy);
await page.waitForTimeout(2800);

const peak = await page.evaluate(() => window.__peak);
await cdp.send("Page.stopScreencast");
await cdp.detach().catch(() => {});

console.log(`clicked «${target.text}» — ${frames.length} frames; peak scaleX ${peak.scaleX?.toFixed(3)} at +${peak.spanMs?.toFixed(0)}ms after the click`);

if (!peak.epochS || !frames.length) {
  console.log("no peak recorded or no frame captured — the rAF sample in surf-a-t029.mjs remains the travel proof");
  await browser.close();
  process.exit(0);
}

const best = frames.reduce((a, b) => (Math.abs(b.t - peak.epochS) < Math.abs(a.t - peak.epochS) ? b : a));
const file = `${DIR}/surf-a-pills-1280-midflight.png`;
writeFileSync(file, Buffer.from(best.data, "base64"));
console.log(`wrote ${file} (frame ${Math.round((best.t - peak.epochS) * 1000)}ms from the peak sample)`);
await browser.close();
