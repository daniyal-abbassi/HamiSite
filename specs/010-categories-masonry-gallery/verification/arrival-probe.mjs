/**
 * Q6 + Q7 probe — the arrival's four promises, checked in one browser session.
 *
 *   node specs/010-categories-masonry-gallery/verification/arrival-probe.mjs
 *
 * Every check is a claim about a *path* to the finished state, not about how the motion looks:
 *   1. it plays, once, and does not replay when the shopper scrolls away and back (FR-009);
 *   2. reduced motion never creates a tween at all (FR-010);
 *   3. blocking the arrival's chunk leaves the chapter composed, not empty (FR-011) — the clause that
 *      distinguishes `gsap.from()` from `gsap.to()` starting at a CSS-hidden state;
 *   4. nothing below the chapter moves while it arranges itself (FR-022 / SC-007).
 *
 * Playwright is borrowed from pixel-bridge on purpose: adding it to package.json for a test script would put a
 * browser dependency inside a Next.js app that does not use it.
 */

import { chromium } from '/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs';

const URL = process.env.PROBE_URL ?? 'http://localhost:3000/';
const EXE = '/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';

const browser = await chromium.launch({ headless: true, executablePath: EXE });
const results = [];
const record = (name, pass, detail) => {
  results.push({ check: name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  ${detail}`);
};

/** `behavior: "instant"` is required — globals.css sets `scroll-behavior: smooth`, so a normal scroll animates. */
async function gotoChapter(page) {
  await page.evaluate(() => {
    const el = document.querySelector('.cat-masonry');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 96, behavior: 'instant' });
  });
}

const opacitySample = () =>
  [...document.querySelectorAll('.cat-masonry__item')].map((e) => +getComputedStyle(e).opacity);

/* ---- 1. plays, and only once ------------------------------------------------ */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  const before = await page.evaluate(opacitySample);
  await gotoChapter(page);
  // Sample across the whole wave. A mid-flight value below 1 is the arrival; the tail must reach 1.
  const seen = [];
  for (let i = 0; i < 14; i += 1) {
    seen.push(await page.evaluate(opacitySample));
    await page.waitForTimeout(120);
  }
  const minDuring = Math.min(...seen.flat());
  await page.waitForTimeout(1500);
  const settled = await page.evaluate(opacitySample);

  // Scroll far away, then back, and sample immediately: nothing may be mid-flight a second time.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(400);
  await gotoChapter(page);
  const afterReturn = await page.evaluate(opacitySample);

  record(
    'Q6a arrival plays on first view',
    minDuring < 0.5 && settled.every((o) => o === 1),
    `min ${minDuring.toFixed(2)} during, all 1 after: ${settled.every((o) => o === 1)}`,
  );
  record(
    'Q6a no replay on scroll away and back',
    afterReturn.every((o) => o === 1),
    `returned opacities all 1: ${afterReturn.every((o) => o === 1)}`,
  );
  record('Q6a tiles were visible before the trigger', before.every((o) => o === 1), `${before.join(',')}`);
  await ctx.close();
}

/* ---- 2. reduced motion ------------------------------------------------------ */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await gotoChapter(page);
  const during = await page.evaluate(opacitySample);
  await page.waitForTimeout(300);
  const later = await page.evaluate(opacitySample);
  const inline = await page.evaluate(
    () => document.querySelectorAll('.cat-masonry__item[style]').length,
  );
  record(
    'Q6b reduced motion shows the finished arrangement',
    during.every((o) => o === 1) && later.every((o) => o === 1) && inline === 0,
    `all 1 immediately: ${during.every((o) => o === 1)}, tiles carrying inline styles: ${inline}`,
  );
  await ctx.close();
}

/* ---- 3. the arrival cannot run, by two different paths ---------------------- */
{
  // 3a. The chunk never arrives. Blocking by component name does not work — in dev Next bundles
  //     `CategoryArrival` into the route's own chunk, so the first draft of this check aborted nothing and
  //     "passed" while the animation ran. The URL below is the real thing a CDN failure looks like.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.route('**/_next/static/chunks/app/**', (route) => route.abort());
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await gotoChapter(page);
  await page.waitForTimeout(600);
  const state = await page.evaluate(() => ({
    opacities: [...document.querySelectorAll('.cat-masonry__item')].map((e) => +getComputedStyle(e).opacity),
    tiles: document.querySelectorAll('.cat-card').length,
    labels: [...document.querySelectorAll('.cat-card__label')].map((l) => l.textContent).length,
    bottoms: [...new Set([...document.querySelectorAll('.cat-card')].map((c) => Math.round(c.getBoundingClientRect().height)))].sort((a, b) => a - b),
    hydrated: Object.keys(document.querySelector('.cat-card') || {}).some((k) => k.startsWith('__react')),
  }));
  record(
    'Q6c1 chunk blocked — composition still renders',
    state.tiles === 9 && state.labels === 9 && state.opacities.every((o) => o === 1) && state.bottoms.length === 3,
    `${state.tiles} tiles, ${state.labels} labels, all visible: ${state.opacities.every((o) => o === 1)}, distinct heights ${state.bottoms.join('/')}, hydrated: ${state.hydrated}`,
  );
  await ctx.close();

  // 3b. The arrival ran to completion. `clearProps` must have handed the DOM back: nine tiles, no inline
  //     styles left on any of them, so the settled node is byte-for-byte what the server sent and nothing
  //     lingers to fight the hover transition or a later re-render.
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page2 = await ctx2.newPage();
  await page2.addInitScript(() => {
    window.IntersectionObserver = class {
      constructor(cb) { this._cb = cb; }
      observe(el) { if (!el.querySelector('.cat-masonry')) return; setTimeout(() => this._cb([{ isIntersecting: true }]), 0); }
      disconnect() {}
    };
  });
  await page2.goto(URL, { waitUntil: 'load' });
  await page2.waitForTimeout(1500);
  await gotoChapter(page2);
  await page2.waitForTimeout(2000);
  const state2 = await page2.evaluate(() => ({
    opacities: [...document.querySelectorAll('.cat-masonry__item')].map((e) => +getComputedStyle(e).opacity),
    inline: document.querySelectorAll('.cat-masonry__item[style]').length,
  }));
  record(
    'Q6c2 arrival ran and cleared after itself',
    state2.opacities.every((o) => o === 1) && state2.inline === 0,
    `all visible: ${state2.opacities.every((o) => o === 1)}, tiles left carrying inline styles: ${state2.inline} (clearProps)`,
  );
  await ctx2.close();
}

/* ---- 4. nothing below moves ------------------------------------------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const anchor = () =>
    page.evaluate(() => {
      const el = document.querySelector('#brands');
      return el ? Math.round(el.getBoundingClientRect().top + scrollY) : -1;
    });
  const before = await anchor();
  await gotoChapter(page);
  const during = await anchor();
  await page.waitForTimeout(2200);
  const after = await anchor();
  record(
    'Q6d/SC-007 zero layout shift from the arrival',
    before === during && during === after,
    `#brands document top: ${before} / ${during} / ${after}`,
  );
  await ctx.close();
}

/* ---- 5. Q7 blur concurrency, counted rather than eyeballed ------------------ */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await gotoChapter(page);
  // Sample the blur density tightly across the whole wave. This measures what actually painted, not what the
  // constants imply — the bound is only a guarantee if the browser agrees with the arithmetic.
  const densities = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const out = [];
        let n = 0;
        let prev = null;
        const id = setInterval(() => {
          const filters = [...document.querySelectorAll('.cat-card__art')].map(
            (e) => getComputedStyle(e).filter,
          );
          out.push({
            // Carrying: has any blur at all right now. Animating: its blur value moved since the last sample,
            // i.e. it is the element forcing a re-blur this frame. These are different quantities and the first
            // draft of this probe conflated them.
            carrying: filters.filter((f) => f !== 'none').length,
            animating: prev === null ? 0 : filters.filter((f, i) => f !== prev[i]).length,
            labels: [...document.querySelectorAll('.cat-card__label')].filter(
              (e) => getComputedStyle(e).filter !== 'none',
            ).length,
          });
          prev = filters;
          if (++n >= 30) {
            clearInterval(id);
            resolve(out);
          }
        }, 50);
      }),
  );
  const peakAnimating = Math.max(...densities.map((d) => d.animating));
  const peakCarrying = Math.max(...densities.map((d) => d.carrying));
  const labelsEverBlurred = Math.max(...densities.map((d) => d.labels));
  record(
    'Q7 at most three tiles carry a blur at once',
    peakCarrying <= 3,
    `peak carrying a filter: ${peakCarrying} (bound ceil(0.32/0.12) = 3); peak changing between samples: ${peakAnimating}`,
  );
  record('Q7 the label is never blurred', labelsEverBlurred === 0, `labels with a filter at any sample: ${labelsEverBlurred}`);
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
