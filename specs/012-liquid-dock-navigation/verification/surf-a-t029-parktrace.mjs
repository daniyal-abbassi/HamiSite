/* Does the header pill marker ever park on a cold home load, or only late?
 *
 * A second probe reported the resting marker at 0px wide on `/` while the first
 * reported 57px on the same route. Those cannot both be the steady state, so this
 * samples the marker over time instead of once, and records `data-ls-placed` —
 * the port's own "has the client placed me yet" flag — alongside it.
 *
 *   data-ls-placed absent + width 0  -> the layout effect had not run yet: a slow
 *                                       hydration in dev, and the honest-degradation
 *                                       ground (`.group:not([data-ls-placed])
 *                                       .itemActive`) is what the shopper sees.
 *   data-ls-placed="1" + width 0     -> a real defect: parked nowhere.
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const DIR = "specs/012-liquid-dock-navigation/verification";
const GROUP = 'nav[aria-label="ناوبری اصلی"] [role="menubar"]';

const browser = await chromium.launch({ executablePath: EXE });

for (const [label, preset] of [["cold", true], ["warm", false]]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const t0 = Date.now();
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  /* "cold" starts sampling immediately, so it includes hydration. "warm" gives
     the route a few seconds to settle first, which is the state every other
     probe in this directory measured in. */
  if (!preset) await page.waitForTimeout(6000);
  const trace = await page.evaluate(
    async ([sel, start]) => {
      const rows = [];
      for (let i = 0; i < 60; i++) {
        const group = [...document.querySelectorAll(sel)].find((g) => g.getBoundingClientRect().width > 1);
        if (group) {
          const m = group.querySelector('span[aria-hidden="true"]');
          const r = m.getBoundingClientRect();
          rows.push({
            ms: Date.now() - start,
            w: +r.width.toFixed(1),
            h: +r.height.toFixed(1),
            x: +r.x.toFixed(1),
            placed: group.dataset.lsPlaced ?? null,
            opacity: getComputedStyle(m).opacity,
            activeGround: group.querySelector('[aria-current="page"]')
              ? getComputedStyle(group.querySelector('[aria-current="page"]')).backgroundColor
              : null,
          });
        } else {
          rows.push({ ms: Date.now() - start, groupVisible: false });
        }
        await new Promise((res) => setTimeout(res, 200));
      }
      return rows;
    },
    [GROUP, t0],
  );

  const firstParked = trace.find((r) => r.w > 1);
  const placedAt = trace.find((r) => r.placed === "1");
  console.log(`\n${label} home load:`);
  console.log(`  samples: ${trace.length}, first with a painted marker: ${firstParked ? firstParked.ms + "ms (w=" + firstParked.w + ")" : "NEVER in 12s"}`);
  console.log(`  first with data-ls-placed="1": ${placedAt ? placedAt.ms + "ms" : "NEVER"}`);
  console.log(`  marker width 0 while placed="1": ${trace.some((r) => r.placed === "1" && r.w <= 1) ? "YES — defect" : "no"}`);
  console.log(`  tail: ${JSON.stringify(trace.slice(-3))}`);
  writeFileSync(`${DIR}/surf-a-t029-parktrace-${label}.json`, JSON.stringify(trace, null, 2));
  await page.close();
}
await browser.close();
