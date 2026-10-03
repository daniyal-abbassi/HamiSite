/* T030 verification — the home featured tabs wearing the shared marker.
 *
 * This is the app's only true role="tablist", so the bar is higher than the other
 * surfaces: the marker may arrive, but the tab semantics are load-bearing and were
 * all hand-rolled before this. Every check below compares against a real keyboard
 * or a real pointer, not against the source.
 *
 *   1. one marker, and the framer-motion `layoutId` fill it replaced is gone;
 *   2. a TRUSTED click swaps the panel and the marker travels, sampled with
 *      requestAnimationFrame INSIDE the page;
 *   3. the roving tabindex still gives the whole set exactly ONE Tab stop, proven
 *      by walking the page with real Tab keypresses, not by reading attributes;
 *   4. arrow keys still move the selection, and focus follows onto the tab now
 *      selected;
 *   5. the tabpanel's aria-labelledby still RESOLVES — the element exists and its
 *      text is the selected tab's label;
 *   6. the resting marker is inset inside its slot and inside the group;
 *   7. with scripting blocked the selected tab is still visibly marked.
 *
 * Read-only against the app; writes only into this directory.
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const BASE = "http://localhost:3000";
const DIR = "specs/012-liquid-dock-navigation/verification";
const TABLIST = '[role="tablist"]';

const out = { checks: [], shots: [] };
const say = (name, pass, detail) => {
  out.checks.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name} — ${detail}`);
};

/* Wait for hydration, not a stopwatch: the port parks the marker on a layout
   effect and on this box a cold dev load hydrates seconds later. Must be a plain
   boolean-returning function — a Promise object is always truthy, which would
   make Playwright resolve the wait on the very first poll. */
const SETTLE = (sel) => {
  const g = document.querySelector(sel);
  return !!g && g.dataset.lsPlaced === "1";
};

const browser = await chromium.launch({ executablePath: EXE });

for (const width of [1280, 360]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(SETTLE, TABLIST, { timeout: 60000 }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(1200);
  const tag = `${width}px`;

  /* -- 1. one marker, old indicator gone ------------------------------ */
  const mech = await page.evaluate((sel) => {
    const g = document.querySelector(sel);
    if (!g) return { error: "no tablist" };
    const kids = [...g.children];
    return {
      childTags: kids.map((c) => `${c.tagName.toLowerCase()}[${c.getAttribute("role") || "-"}]`),
      markers: kids.filter((c) => c.tagName === "SPAN" && c.getAttribute("aria-hidden") === "true").length,
      tabs: kids.filter((c) => c.getAttribute("role") === "tab").length,
      // the framer-motion fill it replaced: a gradient layer inside a tab
      gradientFills: g.querySelectorAll('[class*="bg-gradient"], [style*="linear-gradient"]').length,
      layoutIds: document.querySelectorAll('[data-layout-id]').length,
      groupLabel: g.getAttribute("aria-label"),
      // per-tab identity the port now carries for us
      ids: [...g.querySelectorAll('[role="tab"]')].map((t) => t.id || null),
      tabindexes: [...g.querySelectorAll('[role="tab"]')].map((t) => t.getAttribute("tabindex")),
      ariaSelected: [...g.querySelectorAll('[role="tab"]')].map((t) => t.getAttribute("aria-selected")),
      ariaControls: [...g.querySelectorAll('[role="tab"]')].map((t) => t.getAttribute("aria-controls")),
      stops: [...g.querySelectorAll('[role="tab"]')].filter((t) => t.tabIndex >= 0).length,
      panel: (() => {
        const p = document.querySelector('[role="tabpanel"]');
        const by = p?.getAttribute("aria-labelledby");
        const target = by ? document.getElementById(by) : null;
        const selected = g.querySelector('[aria-selected="true"]');
        return {
          exists: !!p,
          labelledby: by,
          resolves: !!target,
          labelMatchesSelectedTab: !!target && !!selected && target.innerText.trim() === selected.innerText.trim(),
        };
      })(),
    };
  }, TABLIST);

  say(`${tag} · one marker in the tablist`, mech.markers === 1, JSON.stringify(mech.markers));
  say(`${tag} · tablist children are marker + 2 tabs`, mech.childTags?.join(",") === "span[-],button[tab],button[tab]", JSON.stringify(mech.childTags));
  say(`${tag} · the layoutId fill it replaced is deleted`, mech.gradientFills === 0 && mech.layoutIds === 0, `gradientFills=${mech.gradientFills} layoutIds=${mech.layoutIds}`);
  say(`${tag} · roving tabindex preserved (one stop, 0/-1)`, mech.stops === 1 && JSON.stringify(mech.tabindexes) === '["0","-1"]', `tabindexes=${JSON.stringify(mech.tabindexes)} stops=${mech.stops}`);
  say(`${tag} · per-tab id preserved`, mech.ids?.join(",") === "featured-tab-newest,featured-tab-special", JSON.stringify(mech.ids));
  say(`${tag} · aria-controls preserved on both tabs`, JSON.stringify(mech.ariaControls) === '["featured-panel","featured-panel"]', JSON.stringify(mech.ariaControls));
  say(`${tag} · aria-selected on both tabs, exactly one true`, JSON.stringify(mech.ariaSelected) === '["true","false"]', JSON.stringify(mech.ariaSelected));
  say(`${tag} · tabpanel aria-labelledby resolves to the selected tab`, mech.panel?.resolves && mech.panel?.labelMatchesSelectedTab, JSON.stringify(mech.panel));

  /* -- 6. resting geometry ------------------------------------------- */
  const rest = await page.evaluate((sel) => {
    const g = document.querySelector(sel);
    const m = g.querySelector('span[aria-hidden="true"]');
    const a = g.querySelector('[aria-selected="true"]');
    const mm = m.getBoundingClientRect(), aa = a.getBoundingClientRect(), gg = g.getBoundingClientRect();
    return {
      inset: { start: +(mm.x - aa.x).toFixed(2), end: +(aa.right - mm.right).toFixed(2), top: +(mm.y - aa.y).toFixed(2), bottom: +(aa.bottom - mm.bottom).toFixed(2) },
      insideSlot: mm.x >= aa.x - 0.6 && mm.right <= aa.right + 0.6 && mm.y >= aa.y - 0.6 && mm.bottom <= aa.bottom + 0.6,
      insideGroup: mm.x >= gg.x - 0.6 && mm.right <= gg.right + 0.6,
      willChange: getComputedStyle(m).willChange,
      marker: { w: +mm.width.toFixed(2), h: +mm.height.toFixed(2) },
      slot: { w: +aa.width.toFixed(2), h: +aa.height.toFixed(2) },
    };
  }, TABLIST);
  say(`${tag} · resting marker inset inside its slot`, rest.insideSlot && rest.inset.start > 0.5, JSON.stringify(rest.inset));
  say(`${tag} · resting marker inside the group`, rest.insideGroup, `marker w=${rest.marker.w} in slot w=${rest.slot.w}`);
  say(`${tag} · no compositor hint at rest (FR-034)`, rest.willChange === "auto", JSON.stringify(rest.willChange));

  /* -- 3. real keyboard walk: exactly one Tab stop for the set -------- */
  await page.evaluate(() => document.body.focus());
  const walk = [];
  for (let i = 0; i < 90; i++) {
    await page.keyboard.press("Tab");
    const hit = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const g = el.closest('[role="tablist"]');
      return { inTablist: !!g, text: (el.innerText || "").trim().slice(0, 20), tabindex: el.getAttribute("tabindex") };
    });
    if (hit?.inTablist) walk.push(hit);
    if (walk.length >= 3) break;
  }
  say(`${tag} · real Tab walk lands on exactly ONE tab of the set`, walk.length === 1, `${walk.length} tablist stops: ${JSON.stringify(walk.map((w) => w.text))}`);

  /* -- 4. arrow keys move the selection and focus follows ------------- */
  const arrow = await page.evaluate((sel) => {
    const g = document.querySelector(sel);
    const activeTab = g.querySelector('[aria-selected="true"]');
    activeTab.focus();
    return { before: activeTab.innerText.trim(), focused: document.activeElement.innerText.trim() };
  }, TABLIST);
  await page.keyboard.press("ArrowLeft"); // RTL: forward
  await page.waitForTimeout(900);
  const afterArrow = await page.evaluate((sel) => {
    const g = document.querySelector(sel);
    const selected = g.querySelector('[aria-selected="true"]');
    const p = document.querySelector('[role="tabpanel"]');
    const by = p?.getAttribute("aria-labelledby");
    return {
      after: selected?.innerText.trim(),
      focusIsSelectedTab: document.activeElement === selected,
      focusText: (document.activeElement?.innerText || "").trim(),
      panelLabelledBy: by,
      panelLabelResolves: !!document.getElementById(by || ""),
      panelNameMatches: (() => {
        const t = document.getElementById(by || "");
        return !!t && !!selected && t.innerText.trim() === selected.innerText.trim();
      })(),
      // the roving tabindex has to follow the selection, not stay on the old tab
      tabindexes: [...g.querySelectorAll('[role="tab"]')].map((t) => t.getAttribute("tabindex")),
    };
  }, TABLIST);
  say(`${tag} · ArrowLeft moves the selection (RTL forward)`, arrow.before !== afterArrow.after, `${arrow.before} → ${afterArrow.after}`);
  say(`${tag} · focus follows onto the newly selected tab`, afterArrow.focusIsSelectedTab, `focus=${JSON.stringify(afterArrow.focusText)}`);
  say(`${tag} · panel aria-labelledby follows and still resolves`, afterArrow.panelLabelResolves && afterArrow.panelNameMatches, `labelledby=${afterArrow.panelLabelledBy} resolves=${afterArrow.panelLabelResolves} matches=${afterArrow.panelNameMatches}`);
  say(`${tag} · roving tabindex tracks the new selection`, JSON.stringify(afterArrow.tabindexes) === '["-1","0"]', JSON.stringify(afterArrow.tabindexes));

  /* -- 2. trusted click + in-page rAF travel -------------------------- */
  await page.evaluate((sel) => {
    const g = document.querySelector(sel);
    g.scrollIntoView({ block: "center" });
  }, TABLIST);
  await page.waitForTimeout(400);

  const target = await page.evaluate((sel) => {
    const tabs = [...document.querySelectorAll(`${sel} [role="tab"]`)];
    const t = tabs.find((x) => x.getAttribute("aria-selected") !== "true");
    const r = t.getBoundingClientRect();
    return { text: t.innerText.trim(), cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
  }, TABLIST);

  await page.evaluate((sel) => {
    const marker = document.querySelector(`${sel} span[aria-hidden="true"]`);
    window.__ls = { frames: [], found: !!marker };
    const t0 = performance.now();
    const tick = () => {
      const r = marker.getBoundingClientRect();
      /* Read the transform GSAP wrote, not the box it produces.
         The box is a trap here: the glide tweens `width` toward the next slot AT
         THE SAME TIME as the squash scales it, and these two tabs are 111.58 and
         113.23 px wide — so the base width shrinks while scaleX grows and the
         rendered box barely moves. Two earlier passes read that as "no
         deformation" and were wrong: the inline transform at 1280px peaks at
         `scale(1.2499, 0.7801) skewX(7.9969)`, which is DEFORM exactly.
         Skew is the discriminator — a press has none at all. */
      const tf = marker.style.transform || "";
      const sx = tf.match(/scale\(\s*([-\d.]+)/);
      const sk = tf.match(/skewX?\(\s*([-\d.]+)/);
      window.__ls.frames.push({
        ms: +(performance.now() - t0).toFixed(1),
        x: +r.x.toFixed(2),
        w: +r.width.toFixed(2),
        scaleX: sx ? parseFloat(sx[1]) : 1,
        skew: sk ? parseFloat(sk[1]) : 0,
      });
      if (performance.now() - t0 < 2000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, TABLIST);

  await page.mouse.click(target.cx, target.cy);
  await page.waitForTimeout(2000);

  const frames = await page.evaluate(() => window.__ls);
  const xs = [...new Set((frames.frames || []).map((f) => f.x))];
  const peak = Math.max(1, ...(frames.frames || []).map((f) => f.scaleX));
  const peakSkew = Math.max(0, ...(frames.frames || []).map((f) => Math.abs(f.skew)));
  say(`${tag} · marker found by the in-page sampler`, frames.found === true, JSON.stringify(frames.found));
  say(`${tag} · marker travelled (distinct x > 3)`, xs.length > 3, `${xs.length} distinct x over ${frames.frames?.length ?? 0} frames`);
  /* DEFORM is `scaleX 1.25, scaleY 0.78, skew 8°`; PRESS is `1.06, 0.86` and has NO
     skew at all. So a lean is the one signal that cannot come from anything except a
     trip, and unlike a width threshold it does not depend on which side of the apex a
     frame happens to land. */
  say(`${tag} · body leaned into the travel (|skewX| ≥ 7 = DEFORM, never a press)`, peakSkew >= 7, `peak |skewX| ${peakSkew.toFixed(2)}° · peak scaleX ${peak} (DEFORM 8°/1.25, PRESS 0°/1.06)`);

  const clicked = await page.evaluate((sel) => {
    const g = document.querySelector(sel);
    const s = g.querySelector('[aria-selected="true"]');
    const p = document.querySelector("[role=tabpanel]");
    return { selected: s?.innerText.trim(), labelledby: p?.getAttribute("aria-labelledby"), railItems: document.querySelectorAll('[role="tabpanel"] article, [role="tabpanel"] [data-product-card]').length };
  }, TABLIST);
  say(`${tag} · trusted click swapped the selected tab`, clicked.selected === target.text, `clicked «${target.text}» → selected «${clicked.selected}», panel labelled by ${clicked.labelledby}`);

  const shot = `${DIR}/surf-a-tabs-${tag.replace("px", "")}.png`;
  await page.screenshot({ path: shot, clip: await page.evaluate((sel) => { const g = document.querySelector(sel).parentElement.getBoundingClientRect(); return { x: Math.max(0, g.x - 12), y: Math.max(0, g.y - 12), width: g.width + 24, height: g.height + 24 }; }, TABLIST) });
  out.shots.push(shot);
  out[`state@${tag}`] = { mech, rest, walk, arrow, afterArrow, travel: { distinctX: xs.length, peak, clicked } };
  out[`pageerrors@${tag}`] = errors;
  await ctx.close();
}

/* -- 7. scripting blocked ------------------------------------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  const noJs = await page.evaluate((sel) => {
    const g = document.querySelector(sel);
    const s = g?.querySelector('[aria-selected="true"]');
    if (!s) return { error: "no selected tab in server HTML" };
    const cs = getComputedStyle(s);
    return { text: s.innerText.trim(), background: cs.backgroundColor, markerPainted: (() => { const m = g.querySelector('span[aria-hidden="true"]'); return m ? getComputedStyle(m).width !== "0px" : false; })() };
  }, TABLIST);
  say("no-JS · selected tab visibly marked from the server", !!noJs.background && noJs.background !== "rgba(0, 0, 0, 0)", JSON.stringify(noJs));
  await page.screenshot({ path: `${DIR}/surf-a-tabs-1280-nojs.png` });
  out.shots.push("surf-a-tabs-1280-nojs.png");
  out.noJs = noJs;
  await ctx.close();
}

writeFileSync(`${DIR}/surf-a-t030.json`, JSON.stringify(out, null, 2));
await browser.close();
const failed = out.checks.filter((c) => !c.pass);
console.log(`\n${out.checks.length - failed.length}/${out.checks.length} checks pass — ${DIR}/surf-a-t030.json`);
if (failed.length) { console.log("FAILED:"); for (const f of failed) console.log("  " + f.name); process.exitCode = 1; }
