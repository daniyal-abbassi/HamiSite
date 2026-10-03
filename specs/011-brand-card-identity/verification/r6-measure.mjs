#!/usr/bin/env node
/**
 * 011 T024 (R6) — re-measure contrast in the browser, six ways, at 360 and 1280.
 * The arithmetic in the unit test proves the base ground once; this reads what the
 * page actually paints (the rendered background is a two-stop gradient; the label
 * sits on its top stop) and reports the WCAG ratio of the rendered cream label and
 * the champagne accent against it.
 *
 *   node specs/011-brand-card-identity/verification/r6-measure.mjs
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const browser = await chromium.launch({ executablePath: EXE });

const oklchToLinear = (L, C, H) => {
  const h = (H * Math.PI) / 180, a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [
    Math.max(0, Math.min(1, 4.0767416688 * l - 3.3077115913 * m + 0.2315030823 * s)),
    Math.max(0, Math.min(1, -1.2684380053 * l + 2.6097574011 * m - 0.3413537970 * s)),
    Math.max(0, Math.min(1, -0.0041960866 * l - 0.7034186147 * m + 1.7076147010 * s)),
  ];
};

for (const width of [360, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: width === 360 ? 640 : 800 } });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const rows = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("#brands [data-deck-card]")];
    return cards.map((c) => {
      const ground = c.style.getPropertyValue("--card-ground").trim();
      const label = c.querySelector(".brand-deck__label");
      const line = c.querySelector(".brand-deck__line");
      const cs = (el) => (el ? getComputedStyle(el).color : null);
      return { ground, labelColor: cs(label), lineColor: cs(line), placement: c.getAttribute("data-hue-placement") };
    });
  });
  const lum = (t) => 0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2];
  const linFromCss = (s) => {
    const m = /oklch\(\s*([\d.]+) ([\d.]+) ([\d.]+)\s*\)/.exec(s);
    return oklchToLinear(+m[1], +m[2], +m[3]);
  };
  const parseCssColor = (s) => {
    const m = /rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,]+([\d.]+))?\)/.exec(s);
    const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const a = m[4] === undefined ? 1 : +m[4];
    // composite over the ground's top stop; ground computed below by caller
    return [f(+m[1]), f(+m[2]), f(+m[3]), a];
  };
  console.log(`\n### ${width}px`);
  for (const r of rows) {
    // The painted gradient's top stop = ground L + 0.011 (the stylesheet's derivation).
    const mm = /oklch\(\s*([\d.]+) ([\d.]+) ([\d.]+)\s*\)/.exec(r.ground);
    const top = oklchToLinear(+mm[1] + 0.011, +mm[2], +mm[3]);
    const topLum = lum(top);
    const over = (fg) => {
      const [r_, g_, b_, a] = fg;
      const c = [r_ * a + top[0] * (1 - a), g_ * a + top[1] * (1 - a), b_ * a + top[2] * (1 - a)];
      const lo = Math.max(topLum, lum(c)), hi = Math.min(topLum, lum(c));
      void hi;
      return ((Math.max(topLum, lum(c)) + 0.05) / (Math.min(topLum, lum(c)) + 0.05)).toFixed(2);
    };
    console.log(`${r.placement.padEnd(7)} label ${over(parseCssColor(r.labelColor))}  line ${r.lineColor ? over(parseCssColor(r.lineColor)) : "-"}`);
    void linFromCss;
  }
  await page.close();
}
await browser.close();
