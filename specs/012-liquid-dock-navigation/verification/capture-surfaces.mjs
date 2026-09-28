// 012 T031-T034 — capture the four shop surfaces' accessibility tree and geometry,
// before and after the marker is wired, so SC-010 (zero accessible-name changes)
// and the geometry budget can be diffed rather than eyeballed.
//
// Usage:
//   node specs/012-liquid-dock-navigation/verification/capture-surfaces.mjs <out.json>
//
// Reads only. Run it before editing (a11y-before.json) and after (a11y-after.json),
// then diff. Also emits the per-surface geometry this feature must not move.
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const OUT = process.argv[2] ?? "specs/012-liquid-dock-navigation/verification/a11y-before.json";
const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const BASE = process.env.HAMI_BASE ?? "http://localhost:3000";

const ROUTES = {
  shopUnfiltered: `${BASE}/shop`,
  shopCategoryActive: `${BASE}/shop?category=` + encodeURIComponent("موبایل-و-تبلت"),
  shopBrandApple: `${BASE}/shop?brand=` + encodeURIComponent("اپل"),
  productGallery: `${BASE}/shop/` + encodeURIComponent("گوشی-موبایل-سامسونگ-مدل-galaxy-a36-دو-سیم-کارت-ظرفیت-128-گیگابایت-و-رم-8-گیگابایت-ویتنام"),
  productThreeGroups: `${BASE}/shop/` + encodeURIComponent("اپل-آیدی"),
};

// The surface probes. Each returns JSON for one surface on the current page.
const PROBES = {
  categoryTiles(page) {
    return page.evaluate(() => {
      const section = document.querySelector("section[aria-label='دسته‌بندی‌های فروشگاه']");
      if (!section) return { present: false };
      const row = section.querySelector(":scope > div");
      const items = [...row.querySelectorAll(":scope > a")];
      const cs = getComputedStyle(row);
      return {
        present: true,
        groupTag: row.tagName,
        groupClass: row.className,
        ariaSnapshot: null, // filled below via ariaSnapshot()
        group: {
          rect: row.getBoundingClientRect().toJSON(),
          display: cs.display,
          flexWrap: cs.flexWrap,
          gap: cs.gap,
          overflow: cs.overflowX,
          paddingBottom: cs.paddingBottom,
        },
        items: items.map((a) => ({
          href: a.getAttribute("href"),
          text: a.textContent.replace(/\s+/g, " ").trim(),
          ariaCurrent: a.getAttribute("aria-current"),
          ariaLabel: a.getAttribute("aria-label"),
          offsetLeft: a.offsetLeft,
          offsetTop: a.offsetTop,
          offsetWidth: a.offsetWidth,
          offsetHeight: a.offsetHeight,
          rect: a.getBoundingClientRect().toJSON(),
          borderRadius: getComputedStyle(a).borderRadius,
          justifyContent: getComputedStyle(a).justifyContent,
          minWidth: getComputedStyle(a).minWidth,
          whiteSpace: getComputedStyle(a).whiteSpace,
          transition: getComputedStyle(a).transition,
        })),
      };
    });
  },

  pagination(page) {
    return page.evaluate(() => {
      const nav = document.querySelector("nav[aria-label='صفحه‌بندی محصولات']");
      if (!nav) return { present: false };
      const buttons = [...nav.querySelectorAll("button")];
      const cs = getComputedStyle(nav);
      return {
        present: true,
        groupClass: nav.className,
        group: {
          rect: nav.getBoundingClientRect().toJSON(),
          display: cs.display,
          flexWrap: cs.flexWrap,
          gap: cs.gap,
        },
        buttons: buttons.map((b) => ({
          text: b.textContent.replace(/\s+/g, " ").trim(),
          ariaCurrent: b.getAttribute("aria-current"),
          ariaLabel: b.getAttribute("aria-label"),
          ariaPressed: b.getAttribute("aria-pressed"),
          disabled: b.disabled,
          offsetLeft: b.offsetLeft,
          offsetWidth: b.offsetWidth,
          offsetHeight: b.offsetHeight,
          rect: b.getBoundingClientRect().toJSON(),
          borderRadius: getComputedStyle(b).borderRadius,
        })),
      };
    });
  },

  gallery(page) {
    return page.evaluate(() => {
      const group = document.querySelector("[role='group'][aria-label='نمای دیگر این محصول']");
      if (!group) return { present: false };
      const items = [...group.querySelectorAll("button")];
      const cs = getComputedStyle(group);
      return {
        present: true,
        groupClass: group.className,
        group: {
          rect: group.getBoundingClientRect().toJSON(),
          display: cs.display,
          flexWrap: cs.flexWrap,
          gap: cs.gap,
          alignItems: cs.alignItems,
        },
        // The counter lives outside the marker's row now (the component renders only
        // its items), so it is read from the wrapper.
        counterText: group.parentElement?.querySelector(":scope > span:last-child")?.textContent.trim() ?? null,
        items: items.map((b) => ({
          ariaPressed: b.getAttribute("aria-pressed"),
          ariaLabel: b.getAttribute("aria-label"),
          offsetLeft: b.offsetLeft,
          offsetTop: b.offsetTop,
          offsetWidth: b.offsetWidth,
          offsetHeight: b.offsetHeight,
          rect: b.getBoundingClientRect().toJSON(),
          borderRadius: getComputedStyle(b).borderRadius,
        })),
      };
    });
  },

  variantChips(page) {
    return page.evaluate(() => {
      // The chip rows are the marker's groups that contain buttons. Matched on the
      // module's own group class plus [data-ls-item] children (the marker itself is
      // a <span> child of the row, so "all children are buttons" would miss them).
      const rows = [...document.querySelectorAll('div[class*="liquid-selection_group"]')].filter(
        (d) =>
          !d.hasAttribute("role") &&
          d.querySelectorAll(":scope > [data-ls-item]").length > 0 &&
          d.querySelector(":scope > [data-ls-item]").tagName === "BUTTON",
      );
      return {
        present: rows.length > 0,
        groups: rows.map((row) => {
          const label = row.previousElementSibling?.textContent.trim() ?? null;
          const cs = getComputedStyle(row);
          return {
            label,
            groupClass: row.className,
            group: {
              rect: row.getBoundingClientRect().toJSON(),
              display: cs.display,
              flexWrap: cs.flexWrap,
              gap: cs.gap,
            },
            items: [...row.querySelectorAll("button")].map((b) => ({
              text: b.textContent.replace(/\s+/g, " ").trim(),
              ariaPressed: b.getAttribute("aria-pressed"),
              ariaLabel: b.getAttribute("aria-label"),
              offsetLeft: b.offsetLeft,
              offsetTop: b.offsetTop,
              offsetWidth: b.offsetWidth,
              offsetHeight: b.offsetHeight,
              rect: b.getBoundingClientRect().toJSON(),
              borderRadius: getComputedStyle(b).borderRadius,
            })),
          };
        }),
      };
    });
  },
};

const VIEWPORTS = [
  { name: "360", width: 360, height: 740 },
  { name: "1280", width: 1280, height: 800 },
];

// Which probe runs on which route.
const PLAN = [
  { route: "shopUnfiltered", surfaces: ["categoryTiles", "pagination"] },
  { route: "shopCategoryActive", surfaces: ["categoryTiles", "pagination"] },
  { route: "shopBrandApple", surfaces: ["pagination"] },
  { route: "productGallery", surfaces: ["gallery", "variantChips"] },
  { route: "productThreeGroups", surfaces: ["gallery", "variantChips"] },
];

const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
const result = { capturedAt: new Date().toISOString(), routes: {} };

for (const { route, surfaces } of PLAN) {
  result.routes[route] = {};
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(ROUTES[route], { waitUntil: "networkidle" });
    await page.waitForTimeout(150);
    const entry = { viewport: vp, hydration: null, surfaces: {} };
    entry.hydration = await page.evaluate(() => {
      const probe = (el) => (el ? Object.keys(el).some((k) => k.startsWith("__reactFiber") || k.startsWith("__reactContainer")) : false);
      return {
        reactFiberPresent: probe(document.querySelector("h1")) || probe(document.body),
        bodyChildren: document.body.children.length,
      };
    });
    for (const surface of surfaces) {
      const probe = await PROBES[surface](page);
      // The browser's own accessibility tree for the same region, where it exists.
      if (probe.present) {
        try {
          const handle =
            surface === "categoryTiles"
              ? page.locator("section[aria-label='دسته‌بندی‌های فروشگاه']")
              : surface === "pagination"
                ? page.locator("nav[aria-label='صفحه‌بندی محصولات']")
                : surface === "gallery"
                  ? page.locator("[role='group'][aria-label='نمای دیگر این محصول']")
                  : page.locator("div.flex.flex-wrap").filter({ has: page.locator("[data-ls-item]") }).first();
          probe.ariaSnapshot = (await handle.ariaSnapshot()) ?? null;
        } catch {
          probe.ariaSnapshot = null;
        }
      }
      entry.surfaces[surface] = probe;
    }
    result.routes[route][vp.name] = entry;
    await page.close();
  }
}

await browser.close();
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(`wrote ${OUT}`);
console.log(JSON.stringify(
  Object.fromEntries(
    Object.entries(result.routes).map(([r, v]) => [
      r,
      Object.fromEntries(
        Object.entries(v).map(([vp, e]) => [
          vp,
          Object.fromEntries(Object.entries(e.surfaces).map(([s, p]) => [s, p.present ? `${p.items?.length ?? p.groups?.length ?? 0} items` : "ABSENT"])),
        ]),
      ),
    ]),
  ),
  null, 2,
));
