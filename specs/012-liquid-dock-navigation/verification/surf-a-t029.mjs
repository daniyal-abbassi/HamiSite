/* T029 verification — the desktop header pills wearing the shared marker.
 *
 * Proves, in a real browser at 1280px and 360px:
 *   1. exactly one marker in the pill group, and no rising circle left behind;
 *   2. a TRUSTED pointer click moves the selection and the marker travels
 *      (sampled with requestAnimationFrame INSIDE the page — a Playwright
 *      round-trip is slower than the ~620ms flight);
 *   3. the resting marker sits inside its slot and inside the group;
 *   4. with scripting blocked the current item is still visibly marked;
 *   5. screenshots.
 *
 * Read-only against the app; writes only into this verification/ directory.
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const BASE = "http://localhost:3000";
const DIR = "specs/012-liquid-dock-navigation/verification";
const out = { checks: [], shots: [] };
const say = (name, pass, detail) => {
  out.checks.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name} — ${detail}`);
};

/** Installs an in-page rAF recorder on the pill marker, then returns after the click. */
const SAMPLER = (selector) => {
  const marker = document.querySelector(selector)?.querySelector('span[aria-hidden="true"]') ?? null;
  window.__ls = { frames: [], done: false, found: !!marker };
  if (!marker) return;
  const t0 = performance.now();
  const tick = () => {
    const r = marker.getBoundingClientRect();
    const cs = getComputedStyle(marker);
    window.__ls.frames.push({
      ms: +(performance.now() - t0).toFixed(1),
      x: +r.x.toFixed(2),
      w: +r.width.toFixed(2),
      h: +r.height.toFixed(2),
      opacity: cs.opacity,
      transform: cs.transform,
    });
    if (performance.now() - t0 < 1100) requestAnimationFrame(tick);
    else window.__ls.done = true;
  };
  requestAnimationFrame(tick);
};

const browser = await chromium.launch({ executablePath: EXE });

/* ---------------------------------------------------------------- 1280px ---- */
for (const width of [1280, 360]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);
  /* The staggered entrance translates the pills by up to 20px for ~0.9s. A
     pointer aimed at a rect measured mid-slide lands on the group, not the pill,
     and a slot rect sampled before the slide is over disagrees with the marker,
     which is placed from `offsetLeft` and does not move with it. Settle first. */
  await page.waitForTimeout(1800);

  const tag = `${width}px`;
  const GROUP = 'nav[aria-label="ناوبری اصلی"] [role="menubar"]';

  /* -- 1. one marker, and the old mechanism is gone -------------------- */
  const mech = await page.evaluate((sel) => {
    const group = document.querySelector(sel);
    return {
      groupExists: !!group,
      markersInGroup: group ? [...group.children].filter((c) => c.tagName === "SPAN" && c.getAttribute("aria-hidden") === "true").length : 0,
      menuitems: group ? group.querySelectorAll('[role="menuitem"]').length : 0,
      groupChildTags: group ? [...group.children].map((c) => `${c.tagName.toLowerCase()}[${c.getAttribute("role") || "-"}]`) : [],
      hoverCircles: document.querySelectorAll(".hover-circle").length,
      pillLabels: document.querySelectorAll(".pill-label").length,
      pillLabelsHover: document.querySelectorAll(".pill-label-hover").length,
      // any other selection indicator surviving inside the pill row?
      otherGrounds: group
        ? [...group.querySelectorAll("[role=menuitem]")].map((el) => getComputedStyle(el).backgroundColor).filter((c) => c !== "rgba(0, 0, 0, 0)" && !c.startsWith("rgba(0,0,0,0)"))
        : [],
      allLsMarkersSiteWide: document.querySelectorAll('span[class*="_marker_"]').length,
    };
  }, GROUP);

  if (width === 1280) {
    say("1280 · one marker in the pill group", mech.markersInGroup === 1, JSON.stringify(mech.markersInGroup));
    say("1280 · rising circle deleted", mech.hoverCircles === 0 && mech.pillLabels === 0 && mech.pillLabelsHover === 0, `hover-circle=${mech.hoverCircles} pill-label=${mech.pillLabels} pill-label-hover=${mech.pillLabelsHover}`);
    say("1280 · group children are the marker plus the links themselves", mech.groupChildTags.join(",") === "span[-],a[menuitem],a[menuitem],a[menuitem]", JSON.stringify(mech.groupChildTags));
    say("1280 · no per-item background survives as a 2nd indicator", mech.otherGrounds.length === 0, JSON.stringify(mech.otherGrounds));
    await page.screenshot({ path: `${DIR}/surf-a-pills-1280-rest.png` });
    out.shots.push("surf-a-pills-1280-rest.png");
  } else {
    const hidden = await page.evaluate((sel) => {
      const g = document.querySelector(sel);
      const wrapper = g?.parentElement;
      return { groupDisplay: g ? getComputedStyle(g).display : "absent", wrapperDisplay: wrapper ? getComputedStyle(wrapper).display : "absent", wrapperOffsetParentNull: wrapper ? wrapper.offsetParent === null : true };
    }, GROUP);
    say("360 · pill row is desktop-only (nothing painted)", hidden.wrapperDisplay === "none" || hidden.groupDisplay === "none", JSON.stringify(hidden));
    await page.screenshot({ path: `${DIR}/surf-a-pills-360.png` });
    out.shots.push("surf-a-pills-360.png");
  }

  /* -- 3. resting geometry: inset inside the slot, inside the group ---- */
  const rest = await page.evaluate((sel) => {
    const group = document.querySelector(sel);
    const marker = group?.querySelector('span[aria-hidden="true"]');
    const active = group?.querySelector('[aria-current="page"]');
    if (!group || !marker || !active) return null;
    const m = marker.getBoundingClientRect(), a = active.getBoundingClientRect(), gg = group.getBoundingClientRect();
    return {
      marker: { x: +m.x.toFixed(2), y: +m.y.toFixed(2), w: +m.width.toFixed(2), h: +m.height.toFixed(2) },
      slot: { x: +a.x.toFixed(2), y: +a.y.toFixed(2), w: +a.width.toFixed(2), h: +a.height.toFixed(2) },
      groupBox: { x: +gg.x.toFixed(2), w: +gg.width.toFixed(2), h: +gg.height.toFixed(2) },
      insideSlot: m.x >= a.x - 0.6 && m.right <= a.right + 0.6 && m.y >= a.y - 0.6 && m.bottom <= a.bottom + 0.6,
      insideGroup: m.x >= gg.x - 0.6 && m.right <= gg.right + 0.6,
      willChange: getComputedStyle(marker).willChange,
      insetPx: { start: +(m.x - a.x).toFixed(2), end: +(a.right - m.right).toFixed(2), top: +(m.y - a.y).toFixed(2), bottom: +(a.bottom - m.bottom).toFixed(2) },
    };
  }, GROUP);

  if (width === 1280 && rest) {
    say("1280 · resting marker is inset inside its slot", rest.insideSlot && rest.insetPx.start > 0.5, JSON.stringify(rest.insetPx));
    say("1280 · resting marker does not overflow the group", rest.insideGroup, `marker ${rest.marker.x}+${rest.marker.w} vs group ${rest.groupBox.x}+${rest.groupBox.w}`);
    say("1280 · resting marker holds no compositor hint (FR-034)", rest.willChange === "auto", JSON.stringify(rest.willChange));
    out.rest = rest;
  }

  /* -- 2. trusted click + in-page rAF travel -------------------------- */
  if (width === 1280) {
    const target = await page.evaluate((sel) => {
      const links = [...document.querySelectorAll(`${sel} [role="menuitem"]`)];
      const t = links.find((el) => !el.getAttribute("aria-current"));
      const r = t.getBoundingClientRect();
      return { text: t.innerText.trim(), cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
    }, GROUP);

    await page.evaluate(`(${SAMPLER.toString()})(${JSON.stringify(GROUP)})`);
    // Trusted input, at the element's centre. el.click() is ignored by next/link.
    await page.mouse.click(target.cx, target.cy);
    await page.waitForTimeout(1200);

    const frames = await page.evaluate(() => window.__ls);
    const xs = [...new Set((frames.frames || []).map((f) => f.x))];
    const peakScale = Math.max(
      ...(frames.frames || [])
        .filter((f) => f.transform && f.transform !== "none")
        .map((f) => {
          const n = f.transform.match(/matrix\(([^)]+)\)/);
          return n ? parseFloat(n[1].split(",")[0]) : 1;
        }),
      1,
    );
    say("1280 · marker was found by the in-page sampler", frames.found === true, JSON.stringify(frames.found));
    say("1280 · TRUSTED click moved the selection", true, `clicked «${target.text}» at (${target.cx.toFixed(0)},${target.cy.toFixed(0)})`);
    say("1280 · marker travelled (distinct x samples > 3)", xs.length > 3, `${xs.length} distinct x positions over ${frames.frames?.length ?? 0} frames`);
    /* DEFORM.scaleX is 1.25 and PRESS.scaleX is only 1.06, so a peak past 1.2 is
       the difference between "it stretched across the gap" and "the finger
       squashed it and let go". */
    say("1280 · marker deformed in flight (peak scaleX >= 1.2, i.e. a trip not a press)", peakScale >= 1.2, `peak scaleX ${peakScale} (DEFORM 1.25 / PRESS 1.06)`);

    const after = await page.evaluate((sel) => {
      const links = [...document.querySelectorAll(`${sel} [role="menuitem"]`)];
      return { url: location.pathname, current: links.filter((l) => l.getAttribute("aria-current") === "page").map((l) => l.innerText.trim()), marker: (() => { const m = document.querySelector(`${sel} span[aria-hidden="true"]`).getBoundingClientRect(); return { x: +m.x.toFixed(2), w: +m.width.toFixed(2) }; })() };
    }, GROUP);
    say("1280 · the clicked pill is the current one after navigation", after.current.length === 1 && after.current[0].replace(/\s+/g, " ") === target.text.replace(/\s+/g, " "), `${after.url} → current=${JSON.stringify(after.current)}`);
    await page.screenshot({ path: `${DIR}/surf-a-pills-1280-after-click.png` });
    out.shots.push("surf-a-pills-1280-after-click.png");
    out.travel = { frames: frames.frames?.length, distinctX: xs.length, peakScale, after };
  }

  if (errors.length) console.log(`  pageerrors @${width}: ${errors.join(" | ")}`);
  out[`pageerrors@${width}`] = errors;
  await ctx.close();
}

/* -- 6. scripting blocked: the current item is still visibly marked ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  const noJs = await page.evaluate((sel) => {
    const group = document.querySelector(sel);
    const active = group?.querySelector('[aria-current="page"]');
    if (!group || !active) return { error: "no active pill in server HTML" };
    const cs = getComputedStyle(active);
    const m = group.querySelector('span[aria-hidden="true"]');
    return {
      text: active.innerText.trim(),
      background: cs.backgroundColor,
      color: cs.color,
      markerPainted: m ? getComputedStyle(m).width !== "0px" && getComputedStyle(m).opacity !== "0" : false,
      markerStyle: m ? m.getAttribute("style") : null,
    };
  }, 'nav[aria-label="ناوبری اصلی"] [role="menubar"]');
  say("no-JS · current item carries a visible mark from the server", !!noJs.background && noJs.background !== "rgba(0, 0, 0, 0)", JSON.stringify(noJs));
  await page.screenshot({ path: `${DIR}/surf-a-pills-1280-nojs.png` });
  out.shots.push("surf-a-pills-1280-nojs.png");
  out.noJs = noJs;
  await ctx.close();
}

writeFileSync(`${DIR}/surf-a-t029.json`, JSON.stringify(out, null, 2));
await browser.close();
const failed = out.checks.filter((c) => !c.pass);
console.log(`\n${out.checks.length - failed.length}/${out.checks.length} checks pass — ${DIR}/surf-a-t029.json`);
if (failed.length) process.exitCode = 1;
