#!/usr/bin/env node
/**
 * viewport.mjs — exact-width screenshots and measurements.
 *
 * browser-use cannot resize a viewport, so the widths this project is designed at (360 first, then 768 and 1280)
 * have to come from a real browser driven by script. Playwright and its chromium are already installed for
 * pixel-bridge; borrowing them avoids adding a dependency to the app for the sake of a measurement tool.
 *
 * Two things this file must never get wrong:
 *   1. It scrolls with `behavior: "instant"`. `app/globals.css` sets `scroll-behavior: smooth`, so a default
 *      `scrollIntoView` animates and every rect measured right after it is measured mid-animation.
 *   2. `--out` is resolved to an absolute path. The pixel-bridge MCP learned this the hard way: a relative path
 *      is written against the *server's* cwd, not the caller's.
 *
 * Usage:
 *   node tools/shots/viewport.mjs --width 360 --out specs/…/verification/masonry@360.png
 *   node tools/shots/viewport.mjs --width 360 --scroll-to .cat-masonry --json '…expression…' --out …
 *   node tools/shots/viewport.mjs --width 360 --no-js --out /tmp/nojs.png
 */

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs';

function arg(flags) {
  for (const f of flags) {
    const i = process.argv.indexOf(f);
    if (i !== -1 && process.argv[i + 1] !== undefined) return process.argv[i + 1];
  }
  return undefined;
}

const width = Number(arg(['--width']) ?? 360);
const height = Number(arg(['--height']) ?? 800);
const url = arg(['--url']) ?? 'http://localhost:3000/';
const out = arg(['--out']) ?? '/tmp/viewport.png';
const scrollTo = arg(['--scroll-to']);
const expression = arg(['--json']);
const deviceScaleFactor = Number(arg(['--dsf']) ?? 1);
const settleMs = Number(arg(['--settle']) ?? 2500);
const executablePath =
  arg(['--executable-path']) ??
  process.env.PLAYWRIGHT_CHROMIUM_PATH ??
  '/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';

if (!Number.isFinite(width) || !Number.isFinite(height)) {
  console.error('viewport.mjs: --width and --height must be numbers');
  process.exit(2);
}

const absOut = path.isAbsolute(out) ? out : path.resolve(process.cwd(), out);

// `chromium.launch()` without an explicit executable resolves Playwright's own bundled build; the path above is
// only a fallback for when the bundled revision is missing, which is what happens after a pixel-bridge update.
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor,
  reducedMotion: process.argv.includes('--reduced-motion') ? 'reduce' : 'no-preference',
  // `--no-js` is contract Q3's second half: a section whose layout is computed by script renders an empty box
  // here, and no amount of reading the source can prove otherwise.
  javaScriptEnabled: !process.argv.includes('--no-js'),
});
const page = await context.newPage();

// `--block <substring>` aborts the request whose URL contains the substring, which is how Q6(c) proves the
// end state is reachable when the arrival's chunk never arrives.
const blocked = arg(['--block']);
if (blocked) {
  await page.route('**/*', (route) =>
    route.request().url().includes(blocked) ? route.abort() : route.continue(),
  );
}

const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));

const noJs = process.argv.includes('--no-js');
await page.goto(url, { waitUntil: 'domcontentloaded' });
if (!noJs) {
  await page.waitForLoadState('networkidle').catch(() => undefined);
}
await page.waitForTimeout(settleMs);

const result = {
  width,
  height,
  url,
  javaScriptEnabled: !noJs,
  scrollY: noJs ? null : await page.evaluate(() => Math.round(scrollY)),
};

if (scrollTo && !noJs) {
  // `behavior: "instant"` is not a preference: `app/globals.css` sets `scroll-behavior: smooth`, so a default
  // scroll animates and every rect measured right after it is measured mid-flight. With scripting off there is
  // nothing to scroll from and `evaluate` would throw — the screenshot is the proof in that mode.
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 96, behavior: 'instant' });
  }, scrollTo);
  await page.waitForTimeout(400);
}

if (expression && !noJs) {
  // `--json` is evaluated in the page as an expression, so it may be a bare object literal or an IIFE. Passing a
  // compiled `new Function(...)` handle instead does not work: Playwright stringifies it in the wrong scope and
  // `document` is not defined. This is a local measurement harness driven by an operator's own command line, not
  // a service accepting arguments — the trust boundary is the person typing the flag.
  result.json = await page.evaluate(`(function () { return (${expression}); })()`);
}

mkdirSync(path.dirname(absOut), { recursive: true });
await page.screenshot({ path: absOut, fullPage: !scrollTo });
result.out = absOut;
result.errors = problems;

await browser.close();
console.log(JSON.stringify(result, null, 2));
if (problems.length) process.exitCode = 1;
