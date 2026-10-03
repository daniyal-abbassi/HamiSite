/* Pre/post accessible-name + attribute snapshot for the two surfaces owned by
 * 012-SURF-A (header pills, featured tabs). SC-010 / FR-047 diff target.
 *
 * Read-only: it never clicks, never navigates, never writes outside
 * specs/012-liquid-dock-navigation/verification/.
 *
 *   node specs/012-liquid-dock-navigation/verification/surf-a-a11y.mjs before
 *   node specs/012-liquid-dock-navigation/verification/surf-a-a11y.mjs after
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const tag = process.argv[2] ?? "before";
const out = `specs/012-liquid-dock-navigation/verification/surf-a-a11y-${tag}.json`;

const pick = () => {
  const name = (el) => el.innerText?.trim().replace(/\s+/g, " ") || "";
  const read = (el) => ({
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute("role"),
    text: name(el),
    ariaLabel: el.getAttribute("aria-label"),
    ariaCurrent: el.getAttribute("aria-current"),
    ariaSelected: el.getAttribute("aria-selected"),
    ariaPressed: el.getAttribute("aria-pressed"),
    ariaControls: el.getAttribute("aria-controls"),
    ariaLabelledby: el.getAttribute("aria-labelledby"),
    tabindex: el.getAttribute("tabindex"),
    id: el.id || undefined,
    href: el.getAttribute("href") || undefined,
  });

  return {
    // The desktop header pill row.
    pills: [...document.querySelectorAll('nav[aria-label="ناوبری اصلی"] a')].map(read),
    pillNavRoles: [...document.querySelectorAll('[role="menubar"], [role="menuitem"]')].map((el) => ({
      role: el.getAttribute("role"),
      text: name(el),
    })),
    // The one true tablist in the app.
    tablist: [...document.querySelectorAll('[role="tablist"]')].map((el) => ({
      ...read(el),
      children: [...el.children].map(read),
    })),
    tabpanels: [...document.querySelectorAll('[role="tabpanel"]')].map(read),
    // Every travelling marker currently in the document, by class suffix from the CSS module.
    markers: [...document.querySelectorAll('span[aria-hidden="true"]')]
      .filter((el) => /_marker_/.test(el.className))
      .map((el) => ({
        className: String(el.className),
        style: el.getAttribute("style"),
        offsetParent: el.offsetParent === null ? "null" : "set",
        rect: (() => {
          const r = el.getBoundingClientRect();
          return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
        })(),
      })),
  };
};

const browser = await chromium.launch({ executablePath: EXE });
const results = {};

for (const width of [1280, 360]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);
  results[`${width}px`] = await page.evaluate(pick);
  await page.close();
}

writeFileSync(out, JSON.stringify(results, null, 2));
console.log(`wrote ${out}`);
for (const [w, r] of Object.entries(results)) {
  console.log(
    `${w}: pills=${r.pills.length} menubarRoles=${r.pillNavRoles.length} tablists=${r.tablist.length} ` +
      `tabs=${r.tablist[0]?.children.length ?? 0} panels=${r.tabpanels.length} markers=${r.markers.length}`,
  );
}
await browser.close();
