// 012 T031/T033/T034 (+ FR-046 evidence) — interaction verification for the shop
// surfaces in a real browser. A typecheck is not proof: every check below runs
// against the rendered page at 1280px AND 360px.
//
//   HAMI_BASE=http://localhost:3015 node specs/012-liquid-dock-navigation/verification/verify-surfaces.mjs
//
// What it proves, per surface:
//   1. one marker per group, no second indicator surviving (no per-item active
//      background/border left behind beside the marker);
//   2. a TRUSTED pointer click (page.mouse.click at the element centre — el.click()
//      is ignored by Next <Link>) moves the selection;
//   3. the flight is sampled with requestAnimationFrame INSIDE the page (a
//      round-trip is slower than the ~620ms flight);
//   4. the marker rests inside its group's bounds, inside its slot;
//   5. accessible names identical to the pre-wiring capture (a11y-before.json),
//      and exactly one item current/pressed — SC-010;
//   6. with scripting blocked the current item is still marked (the port's
//      :not([data-ls-placed]) tint) and the marker paints nothing;
//   7. screenshots into this directory.
//
// Job 5 (the wrapped group, FR-045) is re-proven here for the first time: the
// gallery's thumbnails and the نوع chips genuinely wrap at 360px, and the
// marker reaches a second-row slot via the `corner` path — sampled, not argued.
// The click target is the LAST thumbnail, which sits on the last row AND in a
// different column from the resting thumb, so the corner trip changes both axes
// and the drop-then-cross order is visible in the samples.
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const BASE = process.env.HAMI_BASE ?? "http://localhost:3000";
const OUT = "specs/012-liquid-dock-navigation/verification/surf-b-interaction.json";
const SHOTS = "specs/012-liquid-dock-navigation/verification";
const BEFORE = JSON.parse(readFileSync("specs/012-liquid-dock-navigation/verification/a11y-before.json", "utf8"));

const PRODUCT_GAL = `${BASE}/shop/` + encodeURIComponent("گوشی-موبایل-سامسونگ-مدل-galaxy-a36-دو-سیم-کارت-ظرفیت-128-گیگابایت-و-رم-8-گیگابایت-ویتنام");
const PRODUCT_3 = `${BASE}/shop/` + encodeURIComponent("اپل-آیدی");
const SHOP_CAT = `${BASE}/shop?category=` + encodeURIComponent("موبایل-و-تبلت");

const results = { ranAt: new Date().toISOString(), checks: [], screenshots: [] };
function check(name, pass, detail = "") {
  results.checks.push({ name, pass: Boolean(pass), detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

// Install the in-page rAF sampler on the marker inside a given group element.
async function installSampler(page, groupSelector) {
  await page.evaluate((sel) => {
    const group = document.querySelector(sel);
    const marker = group.querySelector('span[class*="liquid-selection_marker"]');
    window.__lsSamples = [];
    const t0 = performance.now();
    const tick = () => {
      const r = marker.getBoundingClientRect();
      window.__lsSamples.push({
        t: Math.round(performance.now() - t0),
        x: Math.round(r.x * 100) / 100,
        y: Math.round(r.y * 100) / 100,
        w: Math.round(r.width * 100) / 100,
        h: Math.round(r.height * 100) / 100,
        opacity: Number(getComputedStyle(marker).opacity),
      });
      if (performance.now() - t0 < 1600) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, groupSelector);
}

async function readSamples(page) {
  return page.evaluate(() => window.__lsSamples);
}

// Trusted pointer click at an element's centre, after an instant scroll into view.
// The element is found by a CSS selector; pass `byText` to match on text content
// instead (Playwright's :text-is is not valid inside document.querySelector).
// The position is re-measured until it is stable: product images loading shift the
// page, and a button that moves between the mousedown and the mouseup is not
// clicked at all — the flakiness this surface has already produced once.
async function trustedClick(page, selector, byText = null) {
  const measure = () =>
    page.evaluate(
      ({ sel, byText }) => {
        const el = byText != null
          ? [...document.querySelectorAll(sel)].find((n) => n.textContent.trim() === byText)
          : document.querySelector(sel);
        if (!el) return null;
        el.scrollIntoView({ behavior: "instant", block: "center" });
        const r = el.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      },
      { sel: selector, byText },
    );

  let point = await measure();
  if (!point) return false;
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(200);
    const again = await measure();
    if (!again) return false;
    if (Math.abs(again.x - point.x) < 1 && Math.abs(again.y - point.y) < 1) {
      point = again;
      break;
    }
    point = again;
  }
  await page.mouse.move(2, 2); // never let the pointer rest on the element being measured
  await page.mouse.click(point.x, point.y);
  return true;
}

async function markerState(page, groupSelector) {
  return page.evaluate((sel) => {
    const group = document.querySelector(sel);
    const marker = group.querySelector('span[class*="liquid-selection_marker"]');
    const gr = group.getBoundingClientRect();
    const mr = marker.getBoundingClientRect();
    return {
      groupRect: { x: gr.x, y: gr.y, w: gr.width, h: gr.height },
      markerRect: { x: mr.x, y: mr.y, w: mr.width, h: mr.height },
      markerOpacity: Number(getComputedStyle(marker).opacity),
    };
  }, groupSelector);
}

// Wait until the marker inside the group has actually been parked (width > 0).
async function waitForMarker(page, groupSelector, timeout = 4000) {
  await page.waitForFunction(
    (sel) => {
      const group = document.querySelector(sel);
      const marker = group?.querySelector('span[class*="liquid-selection_marker"]');
      return marker && marker.getBoundingClientRect().width > 0;
    },
    groupSelector,
    { timeout },
  );
}

const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });

// Load a page and wait until React has actually hydrated (a fiber on the h1),
// reloading if the dev server served a stale chunk set mid-recompile — the
// documented trap in CLAUDE.md, and the difference between a 200 and a page.
async function hydratedGoto(page, url, selector, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    try {
      await page.waitForSelector(selector, { timeout: 20000, state: "attached" });
      await page.waitForFunction(() => {
        const el = document.querySelector("h1") ?? document.body.firstElementChild;
        return el && Object.keys(el).some((k) => k.startsWith("__reactFiber") || k.startsWith("__reactContainer"));
      }, { timeout: 15000 });
      await page.waitForTimeout(300);
      return;
    } catch {
      console.log(`  (hydration not ready on attempt ${i + 1}, reloading)`);
    }
  }
  throw new Error(`page never hydrated: ${url}`);
}

// ============================================================ CategoryTiles (T031)
for (const vp of [{ w: 1280, h: 800, name: "1280" }, { w: 360, h: 740, name: "360" }]) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  await hydratedGoto(page, SHOP_CAT, "section[aria-label='دسته‌بندی‌های فروشگاه'] a");
  const sel = "section[aria-label='دسته‌بندی‌های فروشگاه'] > div";
  await waitForMarker(page, sel);
  await page.waitForTimeout(200);

  const state = await markerState(page, sel);
  const tiles = await page.evaluate((s) => {
    const group = document.querySelector(s);
    return [...group.querySelectorAll(":scope > a")].map((a) => ({
      text: a.textContent.replace(/\s+/g, " ").trim(),
      ariaCurrent: a.getAttribute("aria-current"),
      borderColor: getComputedStyle(a).borderTopColor,
    }));
  }, sel);

  const active = tiles.find((t) => t.ariaCurrent === "true");
  check(`tiles ${vp.name}: exactly one marker, parked inside the group`, state.markerOpacity === 1 && state.markerRect.w > 0 &&
    state.markerRect.x >= state.groupRect.x - 1 && state.markerRect.x + state.markerRect.w <= state.groupRect.x + state.groupRect.w + 1 &&
    state.markerRect.y >= state.groupRect.y - 1 && state.markerRect.y + state.markerRect.h <= state.groupRect.y + state.groupRect.h + 1,
    `marker ${JSON.stringify(state.markerRect)} in group ${JSON.stringify(state.groupRect)}`);
  check(`tiles ${vp.name}: active tile carries aria-current=true (as before)`, Boolean(active), active?.text ?? "none");
  const activeBox = await page.evaluate((s) => {
    const a = [...document.querySelectorAll(s + " > a")].find((x) => x.getAttribute("aria-current"));
    if (!a) return null;
    const r = a.getBoundingClientRect();
    return { x: r.x, w: r.width };
  }, sel);
  const markerCentre = state.markerRect.x + state.markerRect.w / 2;
  check(`tiles ${vp.name}: marker rests under the active tile`, activeBox && markerCentre >= activeBox.x && markerCentre <= activeBox.x + activeBox.w,
    `marker centre ${Math.round(markerCentre)} in tile [${activeBox && Math.round(activeBox.x)}, ${activeBox && Math.round(activeBox.x + activeBox.w)}]`);
  const borders = new Set(tiles.map((t) => t.borderColor));
  check(`tiles ${vp.name}: no per-tile active border survives (one border colour)`, borders.size === 1, [...borders].join(","));
  const beforeTiles = BEFORE.routes.shopCategoryActive[vp.name].surfaces.categoryTiles;
  const namesBefore = beforeTiles.items.map((i) => i.text).join(",");
  const namesAfter = tiles.map((t) => t.text).join(",");
  check(`tiles ${vp.name}: accessible names identical to before`, namesBefore === namesAfter);

  await page.screenshot({ path: `${SHOTS}/surf-b-tiles-${vp.name}.png` });
  results.screenshots.push(`surf-b-tiles-${vp.name}.png`);

  // 6. scripting blocked: current tile still marked, marker paints nothing
  const noJs = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, javaScriptEnabled: false });
  await noJs.goto(SHOP_CAT, { waitUntil: "domcontentloaded" });
  // attached, not visible: with JS blocked the stylesheet may not have applied
  // when the selector first resolves, and "visible" would race it.
  await noJs.waitForSelector("section[aria-label='دسته‌بندی‌های فروشگاه'] a", { timeout: 30000, state: "attached" });
  await noJs.waitForTimeout(800);
  const noJsState = await noJs.evaluate((s) => {
    const group = document.querySelector(s);
    const active = [...group.querySelectorAll(":scope > a")].find((a) => a.getAttribute("aria-current"));
    const marker = group.querySelector('span[class*="liquid-selection_marker"]');
    return {
      activeText: active?.textContent.replace(/\s+/g, " ").trim() ?? null,
      activeBackground: active ? getComputedStyle(active).backgroundColor : null,
      markerWidth: marker ? getComputedStyle(marker).width : null,
    };
  }, sel);
  check(`tiles ${vp.name}: with JS blocked the current tile is still marked`, noJsState.activeText === active?.text && noJsState.activeBackground !== "rgba(0, 0, 0, 0)",
    `${noJsState.activeText} bg=${noJsState.activeBackground}`);
  check(`tiles ${vp.name}: with JS blocked the marker paints nothing`, noJsState.markerWidth === "0px", `marker width=${noJsState.markerWidth}`);
  await noJs.screenshot({ path: `${SHOTS}/surf-b-tiles-${vp.name}-nojs.png` });
  results.screenshots.push(`surf-b-tiles-${vp.name}-nojs.png`);
  await noJs.close();

  if (vp.name === "360") {
    const rows = await page.evaluate((s) => {
      const tops = new Set([...document.querySelectorAll(s + " > a")].map((a) => Math.round(a.getBoundingClientRect().y)));
      const group = document.querySelector(s);
      return { rows: tops.size, scrollW: group.scrollWidth, clientW: group.clientWidth };
    }, sel);
    check(`tiles 360: the row does NOT wrap (one line, overflow-x scrolls)`, rows.rows === 1 && rows.scrollW > rows.clientW, `rows=${rows.rows} scrollW=${rows.scrollW} clientW=${rows.clientW}`);
  }
  await page.close();
}

// ============================================================ ProductGallery (T033)
for (const vp of [{ w: 1280, h: 800, name: "1280" }, { w: 360, h: 740, name: "360" }]) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  await hydratedGoto(page, PRODUCT_GAL, "[role='group'][aria-label='نمای دیگر این محصول'] button");
  const sel = "[role='group'][aria-label='نمای دیگر این محصول']";
  await waitForMarker(page, sel);

  const wrap = await page.evaluate((s) => {
    const rows = {};
    for (const b of document.querySelectorAll(s + " > button[data-ls-item]")) {
      const k = Math.round(b.getBoundingClientRect().y);
      rows[k] = (rows[k] || 0) + 1;
    }
    return rows;
  }, sel);
  const rowCount = Object.keys(wrap).length;
  check(`gallery ${vp.name}: thumbnails genuinely wrap onto more than one row`, rowCount > 1, `${rowCount} rows: ${JSON.stringify(wrap)}`);

  // the LAST thumbnail: last row AND a different column from the resting thumb,
  // so a corner trip changes both axes and drop-then-cross is provable.
  const targetIndex = await page.evaluate((s) => document.querySelectorAll(s + " > button[data-ls-item]").length - 1, sel);

  await installSampler(page, sel);
  const clicked = await trustedClick(page, `${sel} > button[data-ls-item]:nth-of-type(${targetIndex + 1})`);
  await page.waitForTimeout(1000);
  const samples = await readSamples(page);
  const state = await markerState(page, sel);

  const pressed = await page.evaluate((s) => {
    const buttons = [...document.querySelectorAll(s + " > button[data-ls-item]")];
    return buttons.findIndex((b) => b.getAttribute("aria-pressed") === "true");
  }, sel);
  check(`gallery ${vp.name}: trusted click moved the selection to the last thumb`, pressed === targetIndex, `aria-pressed index=${pressed}, clicked=${targetIndex}`);

  const restingW = state.markerRect.w;
  const movedX = new Set(samples.map((s) => s.x)).size;
  const movedY = new Set(samples.map((s) => s.y)).size;
  const peakW = Math.max(...samples.map((s) => s.w));
  check(`gallery ${vp.name}: flight sampled in-page (${samples.length} samples), marker travelled`, samples.length > 5 && movedX > 2 && movedY > 2,
    `${movedX} distinct x, ${movedY} distinct y, peak w=${Math.round(peakW)} vs resting ${Math.round(restingW)}`);

  // Job 5 / FR-045: the corner path — the marker's y reached the resting row while
  // its x was still near the start (the drop leg finishes before the cross leg).
  // The target is the marker's OWN resting y (the slot's y plus its inset), which
  // is where the drop leg ends.
  const startX = samples.find((s) => s.opacity > 0)?.x ?? samples[0].x;
  const finalX = samples[samples.length - 1].x;
  const restingY = state.markerRect.y;
  const yFirst = samples.find((s) => Math.abs(s.y - restingY) < 2);
  check(`gallery ${vp.name}: corner path — the marker dropped to the target row before crossing`, Boolean(yFirst) && Math.abs(yFirst.x - finalX) > 20,
    `y arrived at x=${yFirst?.x} (start ${Math.round(startX)}), final x=${Math.round(finalX)}`);

  const insideGroup = state.markerRect.x >= state.groupRect.x - 1 && state.markerRect.x + state.markerRect.w <= state.groupRect.x + state.groupRect.w + 1 &&
    state.markerRect.y >= state.groupRect.y - 1 && state.markerRect.y + state.markerRect.h <= state.groupRect.y + state.groupRect.h + 1;
  check(`gallery ${vp.name}: marker rests inside the group`, insideGroup);
  const slot = await page.evaluate(({ s, idx }) => {
    const buttons = [...document.querySelectorAll(s + " > button[data-ls-item]")];
    const r = buttons[idx].getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  }, { s: sel, idx: targetIndex }).catch(() => null);
  check(`gallery ${vp.name}: marker rests inside the clicked slot`, slot &&
    state.markerRect.x >= slot.x - 1 && state.markerRect.x + state.markerRect.w <= slot.x + slot.w + 1 &&
    state.markerRect.y >= slot.y - 1 && state.markerRect.y + state.markerRect.h <= slot.y + slot.h + 1,
    `marker ${JSON.stringify(state.markerRect)} in slot ${JSON.stringify(slot)}`);

  await page.mouse.move(2, 2); // the pointer's :hover would legitimately restyle the clicked thumb
  await page.waitForTimeout(200);
  const borders = await page.evaluate((s) => new Set([...document.querySelectorAll(s + " > button[data-ls-item]")].map((b) => getComputedStyle(b).borderTopColor)).size, sel);
  check(`gallery ${vp.name}: no per-thumb active border survives`, borders === 1);

  const beforeGal = BEFORE.routes.productGallery[vp.name].surfaces.gallery;
  const labelsBefore = beforeGal.items.map((i) => i.ariaLabel).join(",");
  const labelsAfter = await page.evaluate((s) => [...document.querySelectorAll(s + " > button[data-ls-item]")].map((b) => b.getAttribute("aria-label")).join(","), sel);
  const pressedCount = await page.evaluate((s) => [...document.querySelectorAll(s + " > button[data-ls-item]")].filter((b) => b.getAttribute("aria-pressed") === "true").length, sel);
  check(`gallery ${vp.name}: accessible names identical to before, exactly one pressed`, labelsBefore === labelsAfter && pressedCount === 1);

  await page.screenshot({ path: `${SHOTS}/surf-b-gallery-${vp.name}.png` });
  results.screenshots.push(`surf-b-gallery-${vp.name}.png`);

  const noJs = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, javaScriptEnabled: false });
  await noJs.goto(PRODUCT_GAL, { waitUntil: "domcontentloaded" });
  await noJs.waitForSelector("[role='group'][aria-label='نمای دیگر این محصول'] button", { timeout: 30000, state: "attached" });
  await noJs.waitForTimeout(800);
  const noJsState = await noJs.evaluate((s) => {
    const group = document.querySelector(s);
    const pressed = [...group.querySelectorAll(":scope > button")].find((b) => b.getAttribute("aria-pressed") === "true");
    const marker = group.querySelector('span[class*="liquid-selection_marker"]');
    return { pressedText: pressed?.getAttribute("aria-label") ?? null, pressedBg: pressed ? getComputedStyle(pressed).backgroundColor : null, markerWidth: marker ? getComputedStyle(marker).width : null };
  }, sel);
  check(`gallery ${vp.name}: with JS blocked the current thumb is still marked`, noJsState.pressedText === "نمای ۱ از ۳۰" && noJsState.pressedBg !== "rgba(0, 0, 0, 0)", `${noJsState.pressedText} bg=${noJsState.pressedBg}`);
  check(`gallery ${vp.name}: with JS blocked the marker paints nothing`, noJsState.markerWidth === "0px", `marker width=${noJsState.markerWidth}`);
  await noJs.close();
  await page.close();
}

// ============================================================ ProductDetail (T034)
for (const vp of [{ w: 1280, h: 800, name: "1280" }, { w: 360, h: 740, name: "360" }]) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  await hydratedGoto(page, PRODUCT_3, "div[class*='liquid-selection_group'] > button[data-ls-item]");
  const groupEls = "[data-ls-test-group]";
  await page.evaluate(() => {
    [...document.querySelectorAll("div[class*='liquid-selection_group']")]
      .filter((d) => d.querySelector(":scope > button[data-ls-item]"))
      .forEach((d, i) => d.setAttribute("data-ls-test-group", String(i)));
  });
  await page.waitForTimeout(200);

  const groups = await page.evaluate(() => {
    return [...document.querySelectorAll("[data-ls-test-group]")]
      .map((d) => ({
        i: Number(d.getAttribute("data-ls-test-group")),
        label: d.previousElementSibling?.textContent.trim() ?? null,
        items: d.querySelectorAll(":scope > button[data-ls-item]").length,
        rows: new Set([...d.querySelectorAll(":scope > button[data-ls-item]")].map((b) => Math.round(b.getBoundingClientRect().y))).size,
      }));
  });
  check(`detail ${vp.name}: three independent option groups, each with its own marker`, groups.length === 3 && groups.every((g) => g.items > 1), groups.map((g) => `${g.label}:${g.items}`).join(" | "));
  const wrapped = groups.filter((g) => g.rows > 1).map((g) => g.label);
  if (vp.name === "360") {
    check(`detail 360: at least one group wraps (نوع)`, wrapped.length > 0, `wrapping: ${wrapped.join(",")}`);
  } else {
    check(`detail 1280: groups on one row each at this width (nothing to wrap)`, wrapped.length === 0, `rows: ${groups.map((g) => g.rows).join("/")}`);
  }

  const g2 = "[data-ls-test-group='1']";
  // sample all three markers across the click: only the clicked group may animate
  await page.evaluate(() => {
    window.__lsAll = { 0: [], 1: [], 2: [] };
    const t0 = performance.now();
    const tick = () => {
      for (const i of [0, 1, 2]) {
        const group = document.querySelector(`[data-ls-test-group='${i}']`);
        const marker = group?.querySelector('span[class*="liquid-selection_marker"]');
        if (!marker) continue;
        const r = marker.getBoundingClientRect();
        window.__lsAll[i].push({ x: Math.round(r.x * 100) / 100, y: Math.round(r.y * 100) / 100, w: Math.round(r.width * 100) / 100, opacity: Number(getComputedStyle(marker).opacity) });
      }
      if (performance.now() - t0 < 1600) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await trustedClick(page, `${g2} > button[data-ls-item]:nth-of-type(2)`);
  await page.waitForTimeout(1000);
  const all = await page.evaluate(() => window.__lsAll);

  const animated = { 0: new Set(all[0].map((s) => s.x)).size, 1: new Set(all[1].map((s) => s.x)).size, 2: new Set(all[2].map((s) => s.x)).size };
  check(`detail ${vp.name}: only the clicked group's marker animated (FR-033)`, animated[1] > 2 && animated[0] <= 2 && animated[2] <= 2,
    `distinct x per group: ${animated[0]}/${animated[1]}/${animated[2]}`);

  const pressedInG2 = await page.evaluate((s) => {
    const buttons = [...document.querySelectorAll(s + " > button[data-ls-item]")];
    return buttons.findIndex((b) => b.getAttribute("aria-pressed") === "true");
  }, g2);
  check(`detail ${vp.name}: trusted click moved the selection in the second group`, pressedInG2 === 1, `aria-pressed index=${pressedInG2}`);

  const beforeChips = BEFORE.routes.productThreeGroups[vp.name].surfaces.variantChips;
  const labelsBefore = beforeChips.groups.flatMap((g) => g.items.map((i) => i.ariaLabel)).join(",");
  const labelsAfter = await page.evaluate(() => {
    return [...document.querySelectorAll("[data-ls-test-group]")]
      .flatMap((d) => [...d.querySelectorAll(":scope > button[data-ls-item]")].map((b) => b.getAttribute("aria-label"))).join(",");
  });
  const pressedCounts = await page.evaluate(() => {
    return [...document.querySelectorAll("[data-ls-test-group]")].map((d) => [...d.querySelectorAll(":scope > button[data-ls-item]")].filter((b) => b.getAttribute("aria-pressed") === "true").length);
  });
  check(`detail ${vp.name}: accessible names identical to before, one pressed per group`, labelsBefore === labelsAfter && pressedCounts.every((c) => c === 1), `pressed per group: ${pressedCounts.join("/")}`);

  await page.mouse.move(2, 2);
  await page.waitForTimeout(200);
  const chipBorders = await page.evaluate(() => {
    return new Set([...document.querySelectorAll("[data-ls-test-group]")]
      .flatMap((d) => [...d.querySelectorAll(":scope > button[data-ls-item]")].map((b) => getComputedStyle(b).borderTopColor))).size;
  });
  check(`detail ${vp.name}: no per-chip active border survives`, chipBorders === 1);

  await page.screenshot({ path: `${SHOTS}/surf-b-chips-${vp.name}.png` });
  results.screenshots.push(`surf-b-chips-${vp.name}.png`);

  // Job 5 on the chips: the wrapping group's second-row chip, reached via the corner path
  const g3 = "[data-ls-test-group='2']";
  const g3info = await page.evaluate((s) => {
    const buttons = [...document.querySelectorAll(s + " > button[data-ls-item]")];
    const rows = new Set(buttons.map((b) => Math.round(b.getBoundingClientRect().y)));
    return { count: buttons.length, rows: rows.size };
  }, g3);
  if (g3info.rows > 1) {
    await page.evaluate(() => {
      window.__lsAll = { 2: [] };
      const t0 = performance.now();
      const tick = () => {
        const group = document.querySelector("[data-ls-test-group='2']");
        const marker = group?.querySelector('span[class*="liquid-selection_marker"]');
        if (!marker) return;
        const r = marker.getBoundingClientRect();
        window.__lsAll[2].push({ x: Math.round(r.x * 100) / 100, y: Math.round(r.y * 100) / 100, opacity: Number(getComputedStyle(marker).opacity) });
        if (performance.now() - t0 < 1600) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await trustedClick(page, `${g3} > button[data-ls-item]:nth-of-type(${g3info.count})`);
    await page.waitForTimeout(1000);
    const s3 = (await page.evaluate(() => window.__lsAll))[2];
    const targetY3 = await page.evaluate((s) => {
      const buttons = [...document.querySelectorAll(s + " > button[data-ls-item]")];
      return Math.round(buttons[buttons.length - 1].getBoundingClientRect().y);
    }, g3);
    const finalX3 = s3[s3.length - 1].x;
    const yFirst3 = s3.find((s) => Math.abs(s.y - targetY3) < 2);
    check(`detail ${vp.name}: second-row نوع chip reached via the corner path`, Boolean(yFirst3) && Math.abs(yFirst3.x - finalX3) > 10,
      `y arrived at x=${yFirst3?.x}, final x=${finalX3}`);
  }

  const noJs = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, javaScriptEnabled: false });
  await noJs.goto(PRODUCT_3, { waitUntil: "domcontentloaded" });
  await noJs.waitForSelector("div[class*='liquid-selection_group'] > button[data-ls-item]", { timeout: 30000, state: "attached" });
  await noJs.waitForTimeout(800);
  const noJsState = await noJs.evaluate(() => {
    const els = [...document.querySelectorAll("div[class*='liquid-selection_group']")].filter((d) => d.querySelector(":scope > button[data-ls-item]"));
    const pressed = [...els[0].querySelectorAll(":scope > button")].find((b) => b.getAttribute("aria-pressed") === "true");
    const marker = els[0].querySelector('span[class*="liquid-selection_marker"]');
    return { pressedText: pressed?.getAttribute("aria-label") ?? null, pressedBg: pressed ? getComputedStyle(pressed).backgroundColor : null, markerWidth: marker ? getComputedStyle(marker).width : null };
  });
  check(`detail ${vp.name}: with JS blocked the current chip is still marked`, noJsState.pressedText === "دامنه: جیمیل" && noJsState.pressedBg !== "rgba(0, 0, 0, 0)", `${noJsState.pressedText} bg=${noJsState.pressedBg}`);
  check(`detail ${vp.name}: with JS blocked the marker paints nothing`, noJsState.markerWidth === "0px", `marker width=${noJsState.markerWidth}`);
  await noJs.close();
  await page.close();
}

// ============================================================ Pagination jump (FR-046 evidence, read-only)
for (const vp of [{ w: 1280, h: 800, name: "1280" }, { w: 360, h: 740, name: "360" }]) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  await hydratedGoto(page, `${BASE}/shop`, "nav[aria-label='صفحه‌بندی محصولات'] button");
  const sel = "nav[aria-label='صفحه‌بندی محصولات'] > div[class*='liquid-selection_group']";
  await waitForMarker(page, sel);
  // The pagination is the last thing on a long page: every product image that
  // finishes loading shifts it. Wait for the images before trusting a position.
  await page.waitForFunction(() => [...document.images].every((img) => img.complete), { timeout: 20000 }).catch(() => {});

  // jump 1 -> 16 through the window: 5, 7, 9, 11, 13, 15, 16. Each leg polls
  // for arrival and is retried: a misclicked leg (the page shifts under a
  // loading image) is a test artefact, not a product behaviour.
  const path = ["۵", "۷", "۹", "۱۱", "۱۳", "۱۵", "۱۶"];
  let flew = false;
  for (const label of path) {
    let arrived = false;
    for (let attempt = 0; attempt < 4 && !arrived; attempt++) {
      await page.evaluate((s) => {
        window.__lsOne = [];
        const t0 = performance.now();
        const tick = () => {
          const group = document.querySelector(s);
          const marker = group?.querySelector('span[class*="liquid-selection_marker"]');
          if (!marker) return;
          const r = marker.getBoundingClientRect();
          window.__lsOne.push({ w: Math.round(r.width * 100) / 100, x: Math.round(r.x * 100) / 100 });
          // wide enough to outlast the click's layout-settle and catch the flight
          if (performance.now() - t0 < 3000) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, sel);
      const ok = await trustedClick(page, `${sel} > button`, label);
      if (!ok) break;
      // poll for the arrival up to 4s — a dev-server route commit can be slow
      const deadline = Date.now() + 4000;
      while (Date.now() < deadline && !arrived) {
        arrived = await page.evaluate(({ s, want }) => {
          const current = [...document.querySelectorAll(s + " > button")].find((b) => b.getAttribute("aria-current") === "page");
          return current?.textContent.trim() === want;
        }, { s: sel, want: label });
        if (!arrived) await page.waitForTimeout(250);
      }
      const s = await page.evaluate(() => window.__lsOne);
      const peakW = Math.max(...s.map((x) => x.w), 0);
      const restW = (await markerState(page, sel)).markerRect.w;
      if (s.length > 3 && peakW > restW * 1.05) flew = true; // a squash mid-flight = a real trip, not a suppressed arrival
    }
    if (!arrived) break;
  }
  const arrived = await page.evaluate((s) => {
    const current = [...document.querySelectorAll(s + " > button")].find((b) => b.getAttribute("aria-current") === "page");
    const marker = document.querySelector(s + ' span[class*="liquid-selection_marker"]');
    const mr = marker.getBoundingClientRect();
    const cr = current.getBoundingClientRect();
    return {
      current: current?.textContent.trim() ?? null,
      markerInside: mr.x >= cr.x - 1 && mr.x + mr.width <= cr.x + cr.width + 1 && mr.y >= cr.y - 1 && mr.y + mr.height <= cr.y + cr.height + 1,
    };
  }, sel);
  check(`pagination ${vp.name}: jump 1 -> last page (16) arrives, marker resting on it`, arrived.current === "۱۶" && arrived.markerInside, `current=${arrived.current} inside=${arrived.markerInside}`);
  check(`pagination ${vp.name}: every leg of the jump travelled (none suppressed)`, flew);
  await page.screenshot({ path: `${SHOTS}/surf-b-pagination-${vp.name}.png` });
  results.screenshots.push(`surf-b-pagination-${vp.name}.png`);
  await page.close();
}

await browser.close();
writeFileSync(OUT, JSON.stringify(results, null, 2));
const fails = results.checks.filter((c) => !c.pass);
console.log(`\n${results.checks.length - fails.length}/${results.checks.length} checks passed`);
if (fails.length) {
  console.log("FAILURES:");
  for (const f of fails) console.log(" - " + f.name + (f.detail ? "  — " + f.detail : ""));
  process.exit(1);
}
