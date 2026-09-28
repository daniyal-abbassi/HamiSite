/* Geometry probe for the two surfaces owned by 012-SURF-A: the desktop header
 * pill row and the home featured tabs. Measures slot boxes, the marker's resting
 * box, and whether the marker stays inside its group.
 *
 * Read-only.   node specs/012-liquid-dock-navigation/verification/surf-a-geometry.mjs <label>
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const label = process.argv[2] ?? "before";
const out = `specs/012-liquid-dock-navigation/verification/surf-a-geometry-${label}.json`;

const measure = () => {
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
  };
  const contains = (outer, inner) =>
    inner.x >= outer.x - 0.6 && inner.right <= outer.right + 0.6 &&
    inner.y >= outer.y - 0.6 && inner.bottom <= outer.bottom + 0.6;

  const markerOf = (group) =>
    [...group.children].find((c) => c.tagName === "SPAN" && c.getAttribute("aria-hidden") === "true" && /_marker_/.test(String(c.className)));

  const groups = [];
  // header pill menubar
  const pillBar = document.querySelector('nav[aria-label="ناوبری اصلی"] [role="menubar"]');
  if (pillBar) {
    // Descendants, not children: before the wiring the links sit inside
    // `<li role="none">`, after it they are the group's own children.
    const items = [...pillBar.querySelectorAll('[role="menuitem"]')];
    groups.push({
      name: "header-pills",
      group: box(pillBar),
      visible: getComputedStyle(pillBar).display,
      childTags: [...pillBar.children].map((c) => `${c.tagName.toLowerCase()}[${c.getAttribute("role")}]`),
      items: items.map((el) => ({ text: el.innerText.trim().replace(/\s+/g, " "), current: el.getAttribute("aria-current"), box: box(el) })),
      marker: markerOf(pillBar) ? { box: box(markerOf(pillBar)), insideGroup: contains(pillBar.getBoundingClientRect(), markerOf(pillBar).getBoundingClientRect()), insideSlot: (() => { const act = pillBar.querySelector('[aria-current="page"]'); return act ? contains(act.getBoundingClientRect(), markerOf(pillBar).getBoundingClientRect()) : null; })() } : null,
      wrapperPx: box(pillBar.parentElement),
    });
  }
  const tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    const items = [...tablist.children].filter((c) => c.getAttribute("role") === "tab");
    groups.push({
      name: "featured-tabs",
      group: box(tablist),
      visible: getComputedStyle(tablist).display,
      items: items.map((el) => ({ text: el.innerText.trim(), selected: el.getAttribute("aria-selected"), box: box(el) })),
      marker: markerOf(tablist) ? { box: box(markerOf(tablist)), insideGroup: contains(tablist.getBoundingClientRect(), markerOf(tablist).getBoundingClientRect()) } : null,
    });
  }
  return {
    groups,
    scrollY: window.scrollY,
    docW: document.documentElement.clientWidth,
    // The mechanisms that must NOT survive the substitution: PillNav's rising
    // circle spans, its duplicate hover label, and the framer-motion layoutId
    // fill on the featured tabs. Each is counted site-wide.
    legacy: {
      hoverCircles: document.querySelectorAll(".hover-circle").length,
      pillLabelHover: document.querySelectorAll(".pill-label-hover").length,
      pillLabels: document.querySelectorAll(".pill-label").length,
      featuredLayoutFill: document.querySelectorAll('[data-layout-id="featured-tab-fill"], .motion-safe').length,
      lsMarkers: document.querySelectorAll('span[class*="_marker_"]').length,
      willChangeMarkers: [...document.querySelectorAll('span[class*="_marker_"]')].filter(
        (el) => getComputedStyle(el).willChange !== "auto",
      ).length,
    },
  };
};

const browser = await chromium.launch({ executablePath: EXE });
const results = {};
for (const width of [1280, 360]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(400);
  results[`${width}px`] = await page.evaluate(measure);
  await page.close();
}
writeFileSync(out, JSON.stringify(results, null, 2));
console.log(`wrote ${out}`);
for (const [w, r] of Object.entries(results)) {
  console.log(`\n== ${w} (docW ${r.docW})`);
  for (const g of r.groups) console.log(JSON.stringify(g, null, 1));
}
await browser.close();
