/*
 * Feature 007 scope amendment: measure the normal-flow composed band, not the retired pin experiment.
 *
 *   node specs/007-motion-assembly-band/verification/no-pin-foundation.mjs
 *   BASE_URL=http://localhost:3000 node specs/007-motion-assembly-band/verification/no-pin-foundation.mjs
 *
 * Reports band dimensions at 360/390/1280, section/anchor integrity, horizontal overflow, prohibited pin
 * artifacts, no-JS content, and reduced-motion first paint. Historical content-before screenshots are not
 * inputs here; see scope-amendment-no-pin.md for that unavailable evidence.
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME ?? "/snap/bin/chromium";
const WIDTHS = [360, 390, 1280];
const CONTROL = process.argv.includes("--negative-control");
const progressionSource = readFileSync(new URL("../../../lib/atmosphere/progression.ts", import.meta.url), "utf8");
const declaredIds = (name) => {
  const match = progressionSource.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const;`));
  if (!match) throw new Error(`Could not read ${name} from lib/atmosphere/progression.ts`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
};
const homepageSections = declaredIds("HOMEPAGE_SECTIONS");
const subtreeAnchors = declaredIds("SUBTREE_ANCHORS");
const unanchoredSections = declaredIds("UNANCHORED_SECTIONS");
const expectedAnchors = homepageSections.filter((id) => !subtreeAnchors.includes(id));
const expectedRenderedSections = [...expectedAnchors, ...unanchoredSections];
const browser = await chromium.launch({ executablePath: CHROME });
const report = { base: BASE, widths: {}, noJs: null, reducedMotion: null };
let failed = false;
let controlDetected = false;

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForSelector("section.assembly-band", { timeout: 30_000 });
  await page.waitForTimeout(500);
  if (CONTROL && width === WIDTHS[0]) await page.locator("#featured").evaluate((node) => node.remove());
  const measured = await page.evaluate(() => {
    const band = document.querySelector("section.assembly-band");
    const rect = band.getBoundingClientRect();
    const sectionIds = [...document.querySelectorAll("main section")].map((node) => node.id || null);
    const actions = [...band.querySelectorAll(".assembly-band__actions a")].map((a) => ({
      text: (a.textContent ?? "").trim().replace(/\s+/g, " "),
      href: a.getAttribute("href"),
      rect: (() => {
        const r = a.getBoundingClientRect();
        return { x: Math.round(r.x), right: Math.round(r.right), width: Math.round(r.width), bottom: Math.round(r.bottom) };
      })(),
    }));
    return {
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      height: Math.round(rect.height),
      position: getComputedStyle(band).position,
      animationName: getComputedStyle(band).animationName,
      stickyDescendants: [...band.querySelectorAll("*")].filter((node) => getComputedStyle(node).position === "sticky").length,
      sectionIds,
      storeExperienceIdCount: document.querySelectorAll("#store-experience").length,
      bandSettledIdCount: document.querySelectorAll("#band-settled").length,
      headings: ["store-experience-title", "trust-title", "final-conversion-title"].map((id) => {
        const h = document.getElementById(id);
        return { id, found: Boolean(h), text: (h?.textContent ?? "").trim().replace(/\s+/g, " "), wordUnits: h?.querySelectorAll(".heading-arrival__word").length ?? 0 };
      }),
      actions,
      forbiddenPinArtifacts: document.querySelectorAll(".assembly-band__track, .assembly-band__shell, [data-band-track], [data-pin-spacer]").length,
    };
  });
  report.widths[width] = measured;
  const actualSections = measured.sectionIds.filter((id) => id !== null);
  const actualAnchors = actualSections.filter((id) => expectedAnchors.includes(id));
  const missingSections = expectedRenderedSections.filter((id) => !actualSections.includes(id));
  const unexpectedSections = actualSections.filter((id) => !expectedRenderedSections.includes(id));
  const duplicateSections = actualSections.filter((id, index) => actualSections.indexOf(id) !== index);
  const anchorOrderValid = actualAnchors.join("|") === expectedAnchors.join("|");
  measured.driftGuard = { missingSections, unexpectedSections, duplicateSections, anchorOrderValid };
  const drift = missingSections.length > 0 || unexpectedSections.length > 0 || duplicateSections.length > 0 || !anchorOrderValid;
  if (CONTROL && width === WIDTHS[0]) controlDetected = drift;
  if (!CONTROL && drift) failed = true;
  if (measured.documentWidth !== width) failed = true;
  if (measured.position === "sticky" || measured.stickyDescendants !== 0 || measured.animationName !== "none" || measured.forbiddenPinArtifacts !== 0) failed = true;
  if (measured.storeExperienceIdCount !== 1 || measured.bandSettledIdCount !== 1 || measured.headings.some((h) => !h.found)) failed = true;
  if (width === 360 && measured.height > 2400) failed = true;
  if (measured.actions.length !== 3 || !measured.actions.some((a) => a.href?.startsWith("tel:")) || !measured.actions.some((a) => a.href === "/shop")) failed = true;
  await page.close();
}

const noJs = await browser.newPage({ viewport: { width: 360, height: 800 }, javaScriptEnabled: false });
await noJs.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
report.noJs = await noJs.locator("section.assembly-band").evaluate((band) => ({
  headings: ["store-experience-title", "trust-title", "final-conversion-title"].map((id) => Boolean(document.getElementById(id))),
  links: [...band.querySelectorAll(".assembly-band__actions a")].map((a) => a.getAttribute("href")),
  words: [...band.querySelectorAll("h2")].map((h) => (h.textContent ?? "").trim().replace(/\s+/g, " ")),
}));
if (report.noJs.headings.some((found) => !found) || !report.noJs.links.includes("/shop") || !report.noJs.links.some((href) => href?.startsWith("tel:"))) failed = true;

const reduced = await browser.newPage({ viewport: { width: 360, height: 800 }, reducedMotion: "reduce" });
await reduced.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
await reduced.waitForTimeout(300);
report.reducedMotion = await reduced.evaluate(() => [...document.querySelectorAll(".heading-arrival")].map((h) => ({
  id: h.id,
  className: h.className,
  content: (h.textContent ?? "").trim().replace(/\s+/g, " "),
  hiddenWords: [...h.querySelectorAll(".heading-arrival__word")].filter((word) => getComputedStyle(word).opacity === "0").length,
  words: [...h.querySelectorAll(".heading-arrival__word")].map((word) => ({ opacity: getComputedStyle(word).opacity, filter: getComputedStyle(word).filter, translate: getComputedStyle(word).translate })),
})));
if (report.reducedMotion.length !== 3 || report.reducedMotion.some((h) => h.hiddenWords !== 0)) failed = true;

await browser.close();
if (CONTROL && !controlDetected) failed = true;
console.log(JSON.stringify({ ...report, negativeControlDetected: CONTROL ? controlDetected : undefined, result: failed ? "FAIL" : "PASS" }, null, 2));
process.exit(failed ? 1 : 0);
