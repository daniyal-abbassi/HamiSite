/* T030 blocker evidence: does the frozen port manage tab order at all?
 *
 * Walks the page with real Tab keypresses and records which controls receive
 * focus, for two groups on the same page:
 *
 *   - the featured tabs, still the hand-rolled tablist with its roving tabindex
 *     (one stop for the pair) — the behaviour T030 must preserve;
 *   - the mobile dock, already wired to LiquidSelection — the port's own output.
 *
 * If every item of a LiquidSelection group is its own stop while the hand-rolled
 * tablist has exactly one, the port cannot express a roving tabindex and the
 * blocker is measured rather than argued from source.
 *
 * Read-only; keyboard focus only. No clicks, no navigation, no writes.
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const DIR = "specs/012-liquid-dock-navigation/verification";

const describe = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const group = el.closest('[role="tablist"], [role="menubar"]');
  return {
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute("role"),
    text: (el.innerText || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 28),
    tabindex: el.getAttribute("tabindex"),
    inGroup: group ? group.getAttribute("role") : null,
    groupLabel: group ? (group.getAttribute("aria-label") || group.closest("nav")?.getAttribute("aria-label") || "") : "",
  };
};

const audit = () => {
  const out = {};
  const tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    out.featuredTabs = {
      items: tabs.length,
      stopsDeclared: tabs.filter((t) => t.tabIndex >= 0).length,
      tabindexes: tabs.map((t) => t.getAttribute("tabindex")),
      ids: tabs.map((t) => t.id || null),
      ariaControls: tabs.map((t) => t.getAttribute("aria-controls")),
    };
  }
  // Any LiquidSelection-rendered group: the port writes no tabindex/id of its own.
  const portGroups = [...document.querySelectorAll("div.group, div[class*='_group_']")];
  out.portGroups = portGroups.map((g) => {
    const items = [...g.children].filter((c) => /^(A|BUTTON)$/.test(c.tagName));
    return {
      role: g.getAttribute("role"),
      itemTag: items[0]?.tagName.toLowerCase(),
      items: items.length,
      stopsDeclared: items.filter((c) => c.tabIndex >= 0).length,
      tabindexes: items.map((c) => c.getAttribute("tabindex")),
      ids: items.map((c) => c.id || null),
      ariaControls: items.map((c) => c.getAttribute("aria-controls")),
    };
  });
  return out;
};

const browser = await chromium.launch({ executablePath: EXE });
const result = {};

for (const [name, width] of [["360", 360], ["1280", 1280]]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(1500);

  result[`width${width}`] = { declared: await page.evaluate(audit) };

  // Real keyboard walk.
  await page.evaluate(() => document.body.focus());
  const seen = [];
  for (let i = 0; i < 70; i++) {
    await page.keyboard.press("Tab");
    const d = await page.evaluate(describe);
    if (!d) continue;
    const key = `${d.tag}|${d.text}`;
    if (seen.some((s) => s.key === key)) break; // wrapped
    seen.push({ key, ...d });
  }
  result[`width${width}`].tabWalk = seen;
  result[`width${width}`].tabWalkLength = seen.length;
  await page.close();
}

writeFileSync(`${DIR}/surf-a-t030-tabstops.json`, JSON.stringify(result, null, 2));

for (const [k, v] of Object.entries(result)) {
  console.log(`\n=== ${k}`);
  console.log("declared:", JSON.stringify(v.declared, null, 1));
  const dockStops = v.tabWalk.filter((s) => s.inGroup === "menubar" || s.role === "tab");
  console.log(`tab walk: ${v.tabWalkLength} stops total; nav/tab-group stops = ${dockStops.length}`);
  for (const s of dockStops) console.log(`   ${s.role || s.tag} «${s.text}» tabindex=${s.tabindex} group=${s.groupLabel}`);
}
await browser.close();
