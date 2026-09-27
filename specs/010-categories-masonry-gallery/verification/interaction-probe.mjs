/**
 * Q4 + Q5 + Q8 probe — names without an interaction, nine same-window destinations, and the keyboard/AT path.
 *
 *   node specs/010-categories-masonry-gallery/verification/interaction-probe.mjs
 *
 * Q5 is checked by actually pressing all nine tiles and reading where the browser landed, because a mistyped
 * Persian slug resolves to nothing silently — the failure feature 004 already paid for. Q8 counts real tab stops:
 * the carousel this replaces exposed exactly one panel per visit through a roving tabindex, so "nine stops" is an
 * improvement that has to be measured to be believed.
 */

import { chromium } from '/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs';

const APP_URL = process.env.PROBE_URL ?? 'http://localhost:3000/';
const EXE = '/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const SLUGS = {
  'گوشی موبایل': 'موبایل-و-تبلت',
  'هدفون و ایرپاد': 'هدفون-ایرپاد-و-هندزفری',
  'شارژر و کابل': 'آداپتور-کابل-و-شارژر',
  'ساعت هوشمند': 'ساعت-و-مچ-بند-هوشمند',
  'پاوربانک': 'پاور-بانک',
  'لوازم کامپیوتر': 'تجهیزات-کامپیوتر-و-لبتاب',
  'سیم‌کارت': 'سیمکارت',
  'شارژر فندکی': 'شارژر-فندکی',
  'خدمات آنلاین': 'خدمات-آنلاین',
};

const browser = await chromium.launch({ headless: true, executablePath: EXE });
const results = [];
const record = (name, pass, detail) => {
  results.push({ check: name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  ${detail}`);
};

const gotoChapter = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('.cat-masonry');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 96, behavior: 'instant' });
  });

/* ---- Q4 — no name is behind an interaction, at either width ----------------- */
for (const width of [360, 1280]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(APP_URL, { waitUntil: 'load' });
  await page.waitForTimeout(2600);
  await gotoChapter(page);
  await page.waitForTimeout(1600);

  const atRest = await page.evaluate(() =>
    [...document.querySelectorAll('.cat-card')].map((card) => {
      const label = card.querySelector('.cat-card__label');
      const r = label.getBoundingClientRect();
      const s = getComputedStyle(label);
      return { text: label.textContent, opacity: +s.opacity, visible: r.width > 0 && r.height > 0, tracking: s.letterSpacing, transform: s.textTransform };
    }),
  );
  const allReadable = atRest.every((l) => l.opacity === 1 && l.visible);
  record(
    `Q4 all nine names visible with no interaction @${width}`,
    allReadable && atRest.length === 9,
    `${atRest.filter((l) => l.opacity === 1 && l.visible).length}/9 readable at rest`,
  );
  const noTracking = atRest.every((l) => l.tracking === '0px' || l.tracking === 'normal');
  const noCase = atRest.every((l) => l.transform === 'none');
  record(`Q4/FR-006 no letter-spacing or case on the labels @${width}`, noTracking && noCase,
    `tracking values: ${[...new Set(atRest.map((l) => l.tracking))].join('|')}, text-transform: ${[...new Set(atRest.map((l) => l.transform))].join('|')}`);

  // Hover one tile and confirm the name's presence is unchanged — only its colour may move.
  const first = atRest[0];
  await page.hover('.cat-card');
  await page.waitForTimeout(400);
  const afterHover = await page.evaluate(() => {
    const label = document.querySelector('.cat-card .cat-card__label');
    const s = getComputedStyle(label);
    return { opacity: +s.opacity, visible: label.getBoundingClientRect().height > 0, color: s.color };
  });
  record(`Q4 hovering changes no name's presence @${width}`,
    afterHover.opacity === first.opacity && afterHover.visible === first.visible,
    `opacity ${first.opacity} → ${afterHover.opacity}`);
  await ctx.close();
}

/* ---- Q5 — nine presses, same window, back returns --------------------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(APP_URL, { waitUntil: 'load' });
  await page.waitForTimeout(2600);
  await gotoChapter(page);
  await page.waitForTimeout(1600);

  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll('.cat-card')].map((a) => ({ href: a.getAttribute('href'), label: a.querySelector('.cat-card__label').textContent })),
  );
  const landed = [];
  for (let i = 0; i < hrefs.length; i += 1) {
    await page.goto(APP_URL, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    await gotoChapter(page);
    await page.waitForTimeout(1800);
    // `waitForURL`, not `waitForLoadState`: Next navigates client-side, so there is no load event to wait for
    // and reading `page.url()` immediately reports the page still being left. The first draft of this check
    // "failed" for exactly that reason, not because the links were wrong.
    const expected = `/categories/${decodeURIComponent(hrefs[i].href.replace('/categories/', ''))}`;
    const target = page.waitForURL((u) => decodeURIComponent(u.pathname) === expected, { timeout: 8000 });
    await page.locator('.cat-card').nth(i).click();
    let url = null;
    try {
      await target;
      url = decodeURIComponent(new URL(page.url()).pathname);
    } catch {
      url = decodeURIComponent(new URL(page.url()).pathname);
    }
    landed.push({ label: hrefs[i].label, url, ok: url === expected });
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const backOk = decodeURIComponent(new URL(page.url()).pathname) === '/';
    landed.push({ label: `${hrefs[i].label} :: back`, url: page.url(), ok: backOk });
  }
  const bad = landed.filter((l) => !l.ok);
  record('Q5 nine presses land on their own listing, same window, back returns',
    bad.length === 0 && ctx.pages().length === 1,
    `${landed.filter((l) => l.ok).length}/${landed.length} ok (9 presses + 9 backs), ${ctx.pages().length} page(s) open (1 = no new window)`);
  if (bad.length) console.log('   misses:', JSON.stringify(bad, null, 2));
  await ctx.close();
}

/* ---- Q8 — tab stops, focus ring, and the announcement ----------------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(APP_URL, { waitUntil: 'load' });
  await page.waitForTimeout(2600);
  await gotoChapter(page);
  await page.waitForTimeout(1600);

  // Focus the tile before the chapter's own first link, then walk forward. Tabbing from the document start
  // cannot work as a measurement: there are more than fourteen focusable elements above this chapter.
  await page.evaluate(() => {
    const items = document.querySelectorAll('#categories a');
    items[0].previousElementSibling?.focus?.();
    items[0].focus();
  });
  const stops = [];
  for (let i = 0; i < 14; i += 1) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      return {
        inChapter: !!el.closest('#categories'),
        text: (el.textContent || '').trim().slice(0, 22),
      };
    });
    if (!info) break;
    if (!info.inChapter) break;
    stops.push(info);
  }
  record('Q8 ten tab stops in the chapter, in DOM order',
    stops.length === 9 && stops[0].text.startsWith('گوشی') && stops[8].text.startsWith('خدمات'),
    `${stops.length} stops after the first tile, ending "${stops[stops.length - 1]?.text}" (9 tiles + the view-all link ahead of them = 10 in the chapter)`);

  const ring = await page.evaluate(() => {
    const a = document.querySelectorAll('.cat-card')[0];
    a.focus();
    return getComputedStyle(a).outlineWidth;
  });
  record('Q8 focus ring is drawn', parseFloat(ring) >= 2, `outline-width ${ring} on a focused tile`);

  const semantics = await page.evaluate(() => ({
    ul: document.querySelector('.cat-masonry')?.getAttribute('role'),
    items: document.querySelectorAll('.cat-masonry > li').length,
    links: document.querySelectorAll('.cat-masonry a.cat-card').length,
    roleDesc: document.querySelectorAll('#categories [aria-roledescription]').length,
    describedby: document.querySelectorAll('.cat-card[aria-describedby]').length,
    counts: document.querySelectorAll('.cat-card__count').length,
    dir: getComputedStyle(document.querySelector('.cat-masonry')).direction,
    firstColX: Math.round(document.querySelectorAll('.cat-masonry__item')[0].getBoundingClientRect().x),
    secondColX: Math.round(document.querySelectorAll('.cat-masonry__item')[1].getBoundingClientRect().x),
  }));
  record('Q8 announces as a list, never a carousel',
    semantics.ul === 'list' && semantics.items === 9 && semantics.links === 9 && semantics.roleDesc === 0,
    `role=${semantics.ul}, ${semantics.items} li, ${semantics.links} links, aria-roledescription count ${semantics.roleDesc}`);
  record('Q8 six counts, each inside its link via aria-describedby',
    semantics.counts === 6 && semantics.describedby === 6,
    `${semantics.counts} counts, ${semantics.describedby} links referencing one`);
  record('Q8 RTL: the arrangement reads from the right',
    semantics.dir === 'rtl' && semantics.firstColX > semantics.secondColX,
    `direction ${semantics.dir}, tile 1 at x=${semantics.firstColX}, tile 2 at x=${semantics.secondColX}`);

  // Scoped to the chapter on purpose. One `aria-roledescription="carousel"` does survive on this page, in
  // NewArrivals' rail — which *is* a carousel, so announcing it as one is truthful. The categories claim was
  // never "no carousel exists on the homepage", it is "the departments are not described as one".
  const leftover = await page.evaluate(() =>
    document.querySelectorAll('#categories [aria-roledescription], [aria-roledescription="slide"]').length);
  record('Q8 no carousel/slide roledescription in the chapter', leftover === 0, `${leftover} found inside #categories`);
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
