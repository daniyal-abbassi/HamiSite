// 012-VERIFY-B · G2 — is MAX_TRAVEL_PX = 320 bottom-bar arithmetic wrongly applied to the shop?
//
// The constant was derived from the dock (334px row, 66.8px slots, 267.2px longest trip). The shop's
// pagination is not the dock. This measures the real pagination: page-chip counts at the widest and
// narrowest result sets that still paginate, the first-to-last distance, and how often the 320px clamp
// actually engages. If it never engages, no trip is suppressed and there is no "marker stops short of
// the chip it is pointing at" bug on this surface.
//
//   HAMI_BASE=http://localhost:3000 node specs/012-liquid-dock-navigation/verification/g2-max-travel.mjs
import { writeFileSync } from "node:fs";
import { launch, hydratedGoto, waitForScrollSettle, SHOP } from "./surf-b-gate-lib.mjs";

const FILTERS = [
  { key: "unfiltered", q: "" },
  { key: "brand اپل (largest brand)", q: "?brand=" + encodeURIComponent("اپل") },
  { key: "category موبایل و تبلت (largest category)", q: "?category=" + encodeURIComponent("موبایل-و-تبلت") },
  { key: "category هدفون (narrowest that paginates)", q: "?category=" + encodeURIComponent("هدفون-ایرپاد-و-هندزفری") },
];

const browser = await launch();
const out = { maxTravelPx: 320, viewports: {} };

for (const vp of [{ w: 1280, h: 800, name: "1280" }, { w: 360, h: 740, name: "360" }]) {
  out.viewports[vp.name] = [];
  for (const f of FILTERS) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    await hydratedGoto(page, SHOP + f.q, "nav[aria-label='صفحه‌بندی محصولات'] button");
    await waitForScrollSettle(page);
    const m = await page.evaluate(() => {
      const nav = document.querySelector("nav[aria-label='صفحه‌بندی محصولات']");
      if (!nav) return null;
      const group = nav.querySelector("div[class*='liquid-selection_group']");
      const chips = [...group.querySelectorAll(":scope > button")];
      const totalText = document.querySelector("p[aria-live]")?.textContent.trim() ?? null;
      if (chips.length === 0) return { chips: 0, totalText };
      // The marker rests at a chip's offsetLeft (physical, from the group's left). In RTL the first
      // DOM chip is the rightmost (largest offsetLeft); the last is the leftmost. The trip the marker
      // can be asked for is the offsetLeft distance between the two ends of the window.
      const firstOffset = chips[0].offsetLeft;
      const lastOffset = chips[chips.length - 1].offsetLeft;
      return {
        chips: chips.length,
        chipTexts: chips.map((c) => c.textContent.trim()),
        firstOffsetLeft: firstOffset,
        lastOffsetLeft: lastOffset,
        firstToLastPx: Math.abs(firstOffset - lastOffset),
        chipWidth: Math.round(chips[0].getBoundingClientRect().width * 100) / 100,
        totalText,
      };
    });
    out.viewports[vp.name].push({ filter: f.key, ...m });
    await page.close();
  }
}

// The clamp engages when |dx| > 320. The longest possible trip is first-to-last of the 5-chip window.
let maxTrip = 0;
for (const vp of Object.values(out.viewports)) {
  for (const r of vp) {
    if (r.firstToLastPx) maxTrip = Math.max(maxTrip, r.firstToLastPx);
  }
}
out.maxPossibleTripPx = maxTrip;
out.clampEngages = maxTrip > out.maxTravelPx;
out.tripsClamped = 0;
out.verdict = out.clampEngages
  ? "CLAMP ENGAGES — a trip is suppressed; inspect whether the marker stops short of its chip"
  : `clamp never engages: the longest real trip is ${maxTrip}px < ${out.maxTravelPx}px, so no trip is suppressed and the constant is safe for this surface`;

console.log(JSON.stringify(out, null, 2));
writeFileSync("specs/012-liquid-dock-navigation/verification/g2-max-travel.json", JSON.stringify(out, null, 2));
console.log("\nwrote g2-max-travel.json");
await browser.close();
process.exit(out.clampEngages ? 1 : 0);
