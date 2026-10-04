/* Verify the retained word-level heading arrival at phone and desktop widths. */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME ?? "/snap/bin/chromium";
const WIDTHS = [360, 1280];
const HEADING_IDS = ["store-experience-title", "trust-title", "final-conversion-title"];
const browser = await chromium.launch({ executablePath: CHROME });
const report = { widths: {}, reducedMotion: null, noJs: null };
let failed = false;

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForFunction(() => document.querySelectorAll(".heading-arrival").length === 3);
  await page.waitForFunction(() => [...document.querySelectorAll(".heading-arrival")].every((h) =>
    h.classList.contains("heading-arrival--armed") || h.classList.contains("heading-arrival--settled"),
  ));
  // Let the out-of-view fade finish before testing its armed state.
  await page.waitForTimeout(900);
  const armed = await page.locator(".heading-arrival").evaluateAll((headings) => headings.map((heading) => ({
    id: heading.id,
    phase: heading.classList.contains("heading-arrival--armed") ? "armed" : "settled",
    emptyWordSpans: [...heading.querySelectorAll(".heading-arrival__word")].filter((word) => !word.textContent?.trim()).length,
    hiddenWords: [...heading.querySelectorAll(".heading-arrival__word")].filter((word) => getComputedStyle(word).opacity === "0").length,
  })));
  if (armed.length !== 3 || armed.some((heading) => heading.phase !== "armed" || heading.emptyWordSpans || heading.hiddenWords === 0)) failed = true;

  const sequence = [];
  for (const id of HEADING_IDS) {
    const heading = page.locator(`#${id}`);
    await heading.scrollIntoViewIfNeeded();
    await page.waitForFunction((headingId) => document.getElementById(headingId)?.classList.contains("heading-arrival--settled"), id);
    // Seven words can take 270ms to start and 550ms to finish.
    await page.waitForTimeout(900);
    const settled = await heading.evaluate((node) => {
      const words = [...node.querySelectorAll(".heading-arrival__word")];
      return {
        text: (node.textContent ?? "").replace(/\s+/g, " ").trim(),
        phase: node.classList.contains("heading-arrival--settled") ? "settled" : "other",
        emptyWordSpans: words.filter((word) => !word.textContent?.trim()).length,
        hiddenWords: words.filter((word) => getComputedStyle(word).opacity === "0").length,
        unfinishedTransitions: words.filter((word) => getComputedStyle(word).opacity !== "1" || getComputedStyle(word).filter !== "blur(0px)" || !/^0px(?: 0px)?$/.test(getComputedStyle(word).translate)).length,
        hasNonzeroLetterSpacing: words.some((word) => parseFloat(getComputedStyle(word).letterSpacing) !== 0 && getComputedStyle(word).letterSpacing !== "normal"),
        wordCount: words.length,
      };
    });
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(250);
    await heading.scrollIntoViewIfNeeded();
    const replayed = await heading.evaluate((node) => node.classList.contains("heading-arrival--settled"));
    sequence.push({ id, ...settled, remainsSettledAfterReturn: replayed });
    if (settled.phase !== "settled" || settled.emptyWordSpans || settled.hiddenWords || settled.unfinishedTransitions || settled.hasNonzeroLetterSpacing || !replayed) failed = true;
  }
  report.widths[width] = { armed, sequence };
  await page.close();
}

const reduced = await browser.newPage({ viewport: { width: 360, height: 800 }, reducedMotion: "reduce" });
await reduced.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
await reduced.waitForTimeout(700);
report.reducedMotion = await reduced.locator(".heading-arrival").evaluateAll((headings) => headings.map((heading) => ({
  id: heading.id,
  content: (heading.textContent ?? "").replace(/\s+/g, " ").trim(),
  hiddenWords: [...heading.querySelectorAll(".heading-arrival__word")].filter((word) => getComputedStyle(word).opacity === "0").length,
}))).catch(() => []);
if (report.reducedMotion.length !== 3 || report.reducedMotion.some((heading) => !heading.content || heading.hiddenWords)) failed = true;

const noJs = await browser.newPage({ viewport: { width: 360, height: 800 }, javaScriptEnabled: false });
await noJs.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
report.noJs = await noJs.locator(".heading-arrival").evaluateAll((headings) => headings.map((heading) => ({
  id: heading.id,
  content: (heading.textContent ?? "").replace(/\s+/g, " ").trim(),
  hiddenWords: [...heading.querySelectorAll(".heading-arrival__word")].filter((word) => getComputedStyle(word).opacity === "0").length,
  emptyWordSpans: [...heading.querySelectorAll(".heading-arrival__word")].filter((word) => !word.textContent?.trim()).length,
}))).catch(() => []);
if (report.noJs.length !== 3 || report.noJs.some((heading) => !heading.content || heading.hiddenWords || heading.emptyWordSpans)) failed = true;

await browser.close();
console.log(JSON.stringify({ ...report, result: failed ? "FAIL" : "PASS" }, null, 2));
process.exit(failed ? 1 : 0);
