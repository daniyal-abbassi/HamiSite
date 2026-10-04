/*
 * T007 — SC-004 and SC-008, counted rather than believed.
 *
 * SC-004 says the served document contains 100% of the band's words *with scripting unavailable* and that the
 * count "matches the settled page exactly". Two different failures wear the same clothes here: a word missing
 * from the server output entirely, and a word present in the server output but erased or rewritten by hydration.
 * Reading only the settled DOM sees the second and misses the first; reading only the HTML sees the first and
 * misses the second. So this script measures both — the markup as served, and the DOM after the page has run —
 * through one extraction rule, and requires the two to agree with each other and with the band's own set. That
 * is a count, not a spot check, which is the difference between "100% holds" and "the three strings I looked at
 * hold".
 *
 * SC-008's pre-change content set was not captured. This harness still checks SC-004 served/hydrated parity;
 * if the historical set is absent, it reports SC-008 as UNAVAILABLE rather than inventing a baseline.
 *
 *   node specs/007-motion-assembly-band/verification/content-parity.mjs
 *   BASE_URL=http://localhost:3000 node …/content-parity.mjs
 *
 * Exit 0 when SC-004 holds and SC-008 has no baseline or passes, 1 when a checkable contract is violated,
 * and 2 when the harness itself could not get an answer.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const EXE = process.env.CHROME ?? "/snap/bin/chromium";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const VW = Number(process.env.VIEWPORT_W ?? 360);
const BAND_SELECTOR = "section.assembly-band";
const BASELINE = join(process.cwd(), "specs/007-motion-assembly-band/baseline/content-before.json");

const wordCount = (strings) =>
  strings.reduce((n, s) => n + s.split(/[\s\u200e\u200f]+/).filter((w) => /\S/.test(w)).length, 0);

const fail = (msg) => {
  console.log(`\nFAIL — ${msg}`);
  process.exit(1);
};
const broken = (msg) => {
  console.log(`\nHARNESS COULD NOT ANSWER — ${msg}`);
  process.exit(2);
};

/**
 * The served markup, taken over HTTP rather than by switching JavaScript off in the browser. A plain fetch
 * never runs page script, so this is exactly "the document as served to a shopper with scripting unavailable" —
 * and it leaves one page context alive so both documents go through the same parser.
 */
let servedHtml;
try {
  servedHtml = await (await fetch(`${BASE}/`)).text();
} catch (e) {
  broken(`GET ${BASE}/ failed: ${e.message}. Is the dev server up?`);
}
if (!/<html/i.test(servedHtml)) {
  broken(`GET ${BASE}/ returned ${servedHtml.length} bytes that are not a document — refusing to parse it`);
}

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: VW, height: 800 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.setDefaultTimeout(120_000);

try {
  await page.goto(`${BASE}/`, { waitUntil: "load" });
} catch (e) {
  broken(`could not load ${BASE}/ in a browser: ${e.message}`);
}
await page.waitForTimeout(3_000);

const bandPresent = await page.evaluate((sel) => Boolean(document.querySelector(sel)), BAND_SELECTOR);

/**
 * Deliberately before the baseline read: `content-before.json` is T005's Phase 1 output and does not exist yet,
 * and a stack trace about a missing file would bury the one fact this run is supposed to establish — that there
 * is no band on the page to measure.
 */
if (!bandPresent) {
  const today = await page.evaluate(() => [...document.querySelectorAll("main section")].map((s) => s.id || "?"));
  console.log(`served document:     ${servedHtml.length} bytes at ${VW}px`);
  console.log(`settled document:    ${await page.evaluate(() => document.documentElement.outerHTML.length)} bytes, scripting enabled`);
  console.log(`band in settled DOM: 0  (${BAND_SELECTOR})`);
  console.log(`sections today:      ${today.join(", ")}`);
  await browser.close();
  fail("SC-004 — the composed band is absent from the hydrated document, so served/hydrated parity cannot be measured.");
}

/**
 * Both documents, one page call, one extraction rule.
 *
 * A string is the trimmed text of any element with no element children — the leaf a shopper actually reads —
 * and an href is every `a[href]` in scope. Whitespace collapses; Persian ZWNJ (U+200C) is preserved rather than
 * split on, because splitting on it would report one compound word as two and move the count without changing
 * anything a shopper can see.
 *
 * If a historical baseline is ever recovered, `baseline/content-before.json` must use this same rule or SC-008
 * subtracts two different notions of "string"; the shape check below catches the obvious ways that goes wrong. The rule lives
 * inside this callback on purpose: Playwright serialises evaluate arguments, so a function defined out there
 * would arrive in the page as nothing at all.
 */
let both;
try {
  both = await page.evaluate(
    ({ html, sel }) => {
      const norm = (s) => s.replace(/\s+/g, " ").trim();
      const extract = (scope) => {
        const strings = new Set();
        const hrefs = new Set();
        for (const el of scope.querySelectorAll("*")) {
          if (el.firstElementChild === null) {
            const t = norm(el.textContent ?? "");
            if (t) strings.add(t);
          }
        }
        for (const a of scope.querySelectorAll("a[href]")) {
          const h = a.getAttribute("href");
          if (h) hrefs.add(h);
        }
        return { strings: [...strings].sort(), hrefs: [...hrefs].sort() };
      };
      const doc = new DOMParser().parseFromString(html, "text/html");
      const servedBand = doc.querySelector(sel);
      return {
        servedInHtml: Boolean(servedBand),
        served: servedBand ? extract(servedBand) : null,
        settled: extract(document.querySelector(sel)),
      };
    },
    { html: servedHtml, sel: BAND_SELECTOR },
  );
} catch (e) {
  await browser.close();
  broken(`extraction failed in the page: ${e.message}`);
}
await browser.close();

if (!both.servedInHtml) {
  fail("SC-004 — the band is in the settled DOM but not in the served HTML, so it is hydration-authored and a no-JS shopper never sees it");
}

const { served, settled } = both;
console.log(`band ${BAND_SELECTOR} at ${VW}px — served vs settled`);
console.log(`  strings  served ${served.strings.length}   settled ${settled.strings.length}`);
console.log(`  hrefs    served ${served.hrefs.length}    settled ${settled.hrefs.length}`);
console.log(`  words    served ${wordCount(served.strings)}   settled ${wordCount(settled.strings)}`);

const sc004 = [];
if (served.strings.join("|") !== settled.strings.join("|")) {
  const onlyServed = served.strings.filter((s) => !settled.strings.includes(s));
  const onlySettled = settled.strings.filter((s) => !served.strings.includes(s));
  sc004.push(`settled DOM lost ${onlyServed.length} served string(s)${onlyServed.length ? `: ${onlyServed.slice(0, 5).map((s) => `"${s}"`).join(" / ")}` : ""}`);
  sc004.push(`settled DOM gained ${onlySettled.length} string(s) the server never sent${onlySettled.length ? `: ${onlySettled.slice(0, 5).map((s) => `"${s}"`).join(" / ")}` : ""}`);
}
if (wordCount(served.strings) !== wordCount(settled.strings)) {
  sc004.push(`word counts differ: ${wordCount(served.strings)} served vs ${wordCount(settled.strings)} settled`);
}
if (served.hrefs.join("|") !== settled.hrefs.join("|")) sc004.push("the link set differs between served and settled");

if (!existsSync(BASELINE)) {
  console.log(`\nSC-004 (no-JS parity): ${sc004.length === 0 ? "PASS" : "FAIL"}`);
  for (const f of sc004) console.log(`  - ${f}`);
  console.log("SC-008 (historical source set difference): UNAVAILABLE — the pre-change content set was never captured; no substitute is fabricated.");
  console.log(`\n${sc004.length === 0 ? "PASS" : "FAIL"} — SC-004 served==settled; SC-008 remains unavailable`);
  process.exit(sc004.length === 0 ? 0 : 1);
}

let baseline;
try {
  baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
} catch (e) {
  broken(`could not parse ${BASELINE}: ${e.message}`);
}
for (const key of ["strings", "hrefs"]) {
  if (!Array.isArray(baseline[key])) {
    broken(`${BASELINE} has no "${key}" array — T005 must record the sorted strings and hrefs from the same extraction rule this file uses`);
  }
}
const before = new Set([...baseline.strings, ...baseline.hrefs]);

const newStrings = settled.strings.filter((s) => !before.has(s));
const newHrefs = settled.hrefs.filter((h) => !before.has(h));

console.log(`\nSC-004 (no-JS parity): ${sc004.length === 0 ? "PASS" : "FAIL"}`);
for (const f of sc004) console.log(`  - ${f}`);
console.log(`SC-008 (no new claim): ${newStrings.length + newHrefs.length === 0 ? "PASS" : "FAIL"}`);
console.log(`  band − content-before = ${newStrings.length} string(s), ${newHrefs.length} href(s)`);
for (const s of newStrings.slice(0, 25)) console.log(`  + "${s}"`);
if (newStrings.length > 25) console.log(`  + …${newStrings.length - 25} more`);
for (const h of newHrefs.slice(0, 10)) console.log(`  + href ${h}`);

const failed = sc004.length > 0 || newStrings.length + newHrefs.length > 0;
console.log(`\n${failed ? "FAIL" : "PASS"} — SC-004 served==settled, and SC-008 band − before = ∅`);
process.exit(failed ? 1 : 0);
