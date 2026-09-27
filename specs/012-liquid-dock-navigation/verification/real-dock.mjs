/* 012 — does the REAL bottom bar on the live site actually show the marker,
 * and does it travel? This is the question the owner asked when he saw nothing.
 * Measures components/layout/MobileDock.tsx as rendered on /, not the probe. */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
const page = await (await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForSelector('nav[aria-label="ناوبری سریع فروشگاه"] a', { timeout: 20000 });

const NAV = 'nav[aria-label="ناوبری سریع فروشگاه"]';
const state = await page.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="ناوبری سریع فروشگاه"]');
  const marker = nav.querySelector("span[class*='marker']");
  const items = [...nav.querySelectorAll("a")];
  const cs = marker ? getComputedStyle(marker) : null;
  return {
    navHeight: Math.round(nav.getBoundingClientRect().height * 100) / 100,
    navBottom: parseFloat(getComputedStyle(nav).bottom),
    itemCount: items.length,
    itemTexts: items.map((a) => a.textContent?.trim()),
    markerExists: Boolean(marker),
    markerRect: marker ? { left: Math.round(marker.getBoundingClientRect().left), width: Math.round(marker.getBoundingClientRect().width) } : null,
    markerBg: cs?.backgroundColor,
    markerBackdrop: cs?.backdropFilter || cs?.webkitBackdropFilter,
    markerShadow: cs ? cs.boxShadow.slice(0, 90) : null,
    activeText: nav.querySelector("[class*='itemActive']")?.textContent?.trim() ?? null,
    ariaCurrent: items.filter((a) => a.getAttribute("aria-current") === "page").map((a) => a.textContent?.trim()),
  };
});
console.log("REAL DOCK STATE:", JSON.stringify(state, null, 2));
console.log(errors.length ? `page errors: ${errors.slice(0, 2).join(" | ")}` : "no page errors");

const ok = {
  "marker element exists in the real bar": state.markerExists,
  "five destinations still there": state.itemCount === 5,
  "home is the active one": state.activeText === "خانه",
  "aria-current survived the wiring": state.ariaCurrent.length === 1 && state.ariaCurrent[0] === "خانه",
  "outer height still 62px": state.navHeight === 62,
  "bottom inset still 12px": state.navBottom === 12,
};
for (const [k, v] of Object.entries(ok)) console.log(`${v ? "PASS" : "FAIL"}  ${k}`);

/* Now the thing he could not see: does it actually travel on the real bar?
 * A TRUSTED pointer event is required — Next's Link ignores untrusted clicks,
 * so el.click() navigates nothing and the trip never starts. That mistake cost
 * one false "it does not work" reading of this test. */
const tap = await page.evaluate((s) => {
  const a = document.querySelectorAll(`${s} a`)[1]; // «فروشگاه», one slot away
  const r = a.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}, NAV);
await page.evaluate((s) => {
  window.__f = [];
  const m = document.querySelector(`${s} span[class*='marker']`);
  const t0 = performance.now();
  const tick = () => {
    const r = m.getBoundingClientRect();
    const g = /matrix\(([^,]+),[^,]+,[^,]+,([^,]+)/.exec(getComputedStyle(m).transform);
    window.__f.push({ t: Math.round(performance.now() - t0), left: Math.round(r.left * 10) / 10, w: Math.round(r.width * 10) / 10, sx: g ? Number(g[1]) : 1 });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}, NAV);
await page.mouse.click(tap.x, tap.y);
await page.waitForTimeout(1200);
const trip = await page.evaluate(() => ({ frames: window.__f, url: location.pathname }));
const distinct = new Set(trip.frames.map((f) => f.left)).size;
const peak = Math.max(...trip.frames.map((f) => f.sx));
console.log(`\nTRIP ${state.url ?? "/"} → ${trip.url}  frames=${trip.frames.length} distinctLeft=${distinct} peakScaleX=${peak.toFixed(3)}`);
console.log("   " + trip.frames.filter((_, i) => i % 2 === 0).map((f) => `${f.t}:${f.left}(w${f.w} sx${f.sx.toFixed(2)})`).join("  ").slice(0, 900));
check("real bar navigates on a tap", trip.url === "/shop", `${trip.url}`);
check("real bar's marker travels", distinct >= 6, `${distinct} distinct positions across ${trip.frames.length} frames`);
check("real bar's marker stretches", peak > 1.1, `peak scaleX ${peak.toFixed(3)}`);
try { await page.screenshot({ path: "specs/012-liquid-dock-navigation/verification/real-dock.png", timeout: 8000 }); } catch { console.log("screenshot skipped"); }
const failed = results.filter((r) => !r.pass);
console.log(`\n${failed.length === 0 ? "ALL PASS" : `${failed.length} FAILED`} — real bar`);
for (const f of failed) console.log(`  - ${f.id}: ${f.detail}`);
await browser.close();
