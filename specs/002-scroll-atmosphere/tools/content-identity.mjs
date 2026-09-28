/* 002 T026 (L4), T029 (A2), T030 (A3), T033 (G1) — one instrument, because all four ask the
 * same question in different clothes: does the page contain the same shop when the atmosphere
 * is taken away, quieted, hidden from assistive technology, or overridden by the OS?
 *
 * The method is feature 004's (T029 names it): snapshot the *content*, not the pixels — section
 * ordinals, headings, product names, prices, availability text, hrefs, and the reading order of
 * every link — then compare runs. If two runs differ by anything, the difference is printed as
 * the actual diff, not a count, because "1 node differs" tells nobody what was lost.
 *
 * Conditions walked:
 *   baseline      — the page as every shopper gets it
 *   reduced       — prefers-reduced-motion: reduce      → A2 "nobody received a lesser page"
 *   ground-off    — .hami-page-ground display:none       → G1 "the ground is never load-bearing"
 *   forced        — forced-colors: active               → L4 "legibility preserved, never compromised"
 *
 * Usage: node specs/002-scroll-atmosphere/tools/content-identity.mjs [--base URL]
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > -1 ? process.argv[i + 1] : d;
};
const BASE = arg("--base", "http://localhost:3000");
const WIDTH = Number(arg("--width", 360));
const HEIGHT = Number(arg("--height", 640));

const snapshotFn = () => {
  /* FlipWords (components/ui/flip-words.tsx) stacks every candidate word in one invisible,
   * aria-hidden cell to reserve the width, then paints the current word on top and cycles it.
   * Under reduced motion the component settles on the first word and stops — documented in its own
   * comment — so the *visible* word legitimately differs between the two runs while the *content*
   * does not. Comparing raw textContent therefore reported "reduced motion changed the headline",
   * which was the instrument reading a motion artefact. The animated word is normalised to a
   * token here and the candidate set is compared in its place: same words on offer, same page. */
  const ROTATOR_TOKEN = "\u2194rotator";
  const rotatorCandidates = new Map();
  const text = (el) => {
    if (!el) return "";
    const grid = el.querySelector?.("span.inline-grid, span[class*='inline-grid']");
    let normalised = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (grid) {
      const cands = [...grid.querySelectorAll("span[aria-hidden='true']")].map((c) => c.textContent.trim()).filter(Boolean);
      if (cands.length) {
        rotatorCandidates.set(grid, [...new Set(cands)].sort());
        for (const c of cands) normalised = normalised.split(c).join("");
        normalised = `${normalised.replace(/\s+/g, " ").trim()} ${ROTATOR_TOKEN}`;
      }
    }
    return normalised.trim();
  };
  const painted = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
  };
  const sections = [...document.querySelectorAll("main section, main > div > section")].map((el, i) => ({
    ordinal: i,
    id: el.id || null,
    heading: text(el.querySelector("h1, h2, h3")) || null,
  }));
  const products = [...document.querySelectorAll(".lux-card")].map((el) => ({
    name: text(el.querySelector("h3, [class*='line-clamp']")),
    price: text(el.querySelector("[class*='lux-buy']")),
    stock: text(el.querySelector(".lux-stock")),
    href: el.querySelector("a")?.getAttribute("href") ?? null,
    frame: (el.className.match(/frame-(\w+)/) || [, null])[1],
  }));
  const links = [...document.querySelectorAll("main a[href]")].map((a) => `${text(a).slice(0, 40)}→${a.getAttribute("href")}`);
  const headings = [...document.querySelectorAll("main h1, main h2, main h3")].map((h) => `${h.tagName}:${text(h)}`);
  const interactive = [...document.querySelectorAll("main button, main input, main [role='tab'], main [aria-selected]")].map((el) => `${el.tagName}:${el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 24) || ""}`);
  return {
    url: location.pathname,
    docHeight: document.documentElement.scrollHeight,
    rotatorWordSets: [...rotatorCandidates.values()].map((v) => v.join("|")),
    sections,
    products,
    links,
    headings,
    interactive,
    // Every visible string in <main>, in reading order. This is the part that catches content that
    // quietly disappeared without taking a heading or a link with it.
    prose: [...document.querySelectorAll("main p, main li, main dt, main dd, main figcaption")]
      .filter(painted)
      .map((el) => text(el).slice(0, 120))
      .filter(Boolean),
  };
};

const a11yFn = () => {
  const g = document.querySelector(".hami-page-ground");
  if (!g) return { present: false };
  const cs = getComputedStyle(g);
  return {
    present: true,
    display: cs.display,
    ariaHidden: g.getAttribute("aria-hidden"),
    role: g.getAttribute("role"),
    hasText: (g.textContent || "").trim().length > 0,
    focusable: !!g.matches(":focus-visible") || g.tabIndex >= 0,
    // Who would a screen reader meet first inside main? If the ground ever became a node with a
    // name, it would appear here.
    firstMainChild: document.querySelector("main")?.firstElementChild?.className ?? null,
  };
};

const walk = async (browser, label, setup) => {
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  if (setup) await setup(page);
  // Settle through the whole document so lazy sections mount and Reveal finishes: a snapshot taken
  // at the top compares only the first screen, and the first screen is the one nobody loses.
  const doc = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, vh: innerHeight }));
  for (let f = 0; f <= 10; f += 1) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round((doc.h - doc.vh) * (f / 10)));
    await page.waitForTimeout(320);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(500);
  const snap = await page.evaluate(snapshotFn);
  const tree = await page.evaluate(a11yFn);
  // The tree itself, over CDP. page.accessibility is gone from this Playwright build, and
  // "we set aria-hidden" is not the same claim as "the accessibility tree contains no node for it" —
  // contract A3 is the second one, so ask the browser what it actually built.
  const cdp = await context.newCDPSession(page);
  await cdp.send("Accessibility.enable");
  const { nodes } = await cdp.send("Accessibility.getFullAXTree");
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: ".hami-page-ground" });
  let groundBackend = null;
  if (nodeId) {
    const { node } = await cdp.send("DOM.describeNode", { nodeId });
    groundBackend = node.backendNodeId;
  }
  const named = nodes.filter((n) => (n.name?.value || "").trim() || (n.description?.value || "").trim());
  const ax = {
    total: nodes.length,
    ignored: nodes.filter((n) => n.ignored).length,
    named: named.length,
    groundNodePresent: groundBackend !== null && nodes.some((n) => n.backendDOMNodeId === groundBackend && !n.ignored),
    groundIgnored: groundBackend !== null ? nodes.filter((n) => n.backendDOMNodeId === groundBackend).map((n) => `${n.role?.value ?? "?"}/${n.ignored ? "ignored" : "IN TREE"}`) : ["no such element"],
    // Any node whose accessible name mentions the ground would be an announcement.
    groundNamed: named.filter((n) => /ground|atmosphere|پس‌زمینه/i.test(`${n.name?.value} ${n.description?.value}`)).map((n) => n.name?.value),
  };
  // Content and geometry hash separately. A2 is about sections, products, prices, links and
  // reading order; document height is A1's subject, and this page's height already moves by design
  // when motion is reduced because 008's brand deck gives up its pin travel (its own C8 gate
  // records 1270px static vs 1511px animated). Folding the two into one hash made 002's harness
  // fail for a decision another feature made and had already been accepted for.
  const content = { ...snap };
  delete content.docHeight;
  const json = JSON.stringify(content);
  await context.close();
  return { label, snap, tree, ax, hash: createHash("sha256").update(json).digest("hex").slice(0, 16) };
};

/* A page that animates a headline is a page whose text snapshot moves between two identical
 * runs. Before blaming a media emulation for a difference, walk the baseline twice and treat any
 * line that also differs run-to-run as unattributable. Without this the instrument reported
 * "reduced motion changed the content" while it was really reading the word rotator mid-cycle —
 * and an instrument that cries wolf here would be ignored the one time it matters. */
const noiseLinesOf = (a, b) => new Set(diff(a, b).map((l) => l.trim().split(":")[0]));

const diff = (a, b) => {
  const out = [];
  const keys = new Set([...Object.keys(a.snap), ...Object.keys(b.snap)].filter((k) => k !== "docHeight"));
  for (const k of keys) {
    const x = JSON.stringify(a.snap[k]);
    const y = JSON.stringify(b.snap[k]);
    if (x === y) continue;
    if (Array.isArray(a.snap[k]) && Array.isArray(b.snap[k])) {
      const A = a.snap[k];
      const B = b.snap[k];
      const sa = new Set(A.map((v) => JSON.stringify(v)));
      const sb = new Set(B.map((v) => JSON.stringify(v)));
      const onlyA = A.filter((v) => !sb.has(JSON.stringify(v))).slice(0, 4);
      const onlyB = B.filter((v) => !sa.has(JSON.stringify(v))).slice(0, 4);
      out.push(`  ${k}: ${A.length} vs ${B.length}` + (onlyA.length ? `\n      only in ${a.label}: ${JSON.stringify(onlyA).slice(0, 240)}` : "") + (onlyB.length ? `\n      only in ${b.label}: ${JSON.stringify(onlyB).slice(0, 240)}` : ""));
    } else {
      out.push(`  ${k}: ${x?.slice(0, 120)} vs ${y?.slice(0, 120)}`);
    }
  }
  return out;
};

const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
const results = [];
let ok = true;

const base = await walk(browser, "baseline", null);
results.push(base);
const base2 = await walk(browser, "baseline repeat", null);
results.push(base2);
const noise = new Set(noiseLinesOf(base, base2));
console.log(`instrument noise floor: ${base2.hash === base.hash ? "none — two identical runs agree" : `two identical runs DIFFER (${base.hash} vs ${base2.hash}); unattributable fields: ${[...noise].join(", ")}`}`);
if (base2.hash !== base.hash) diff(base, base2).forEach((l) => console.log(`  [noise]${l}`));
console.log(`baseline: ${base.snap.sections.length} sections, ${base.snap.products.length} product cards, ${base.snap.links.length} links, ${base.snap.prose.length} prose nodes`);

const reduced = await walk(browser, "reduced motion", (p) => p.emulateMedia({ reducedMotion: "reduce" }));
results.push(reduced);
const forced = await walk(browser, "forced colours", (p) => p.emulateMedia({ forcedColors: "active" }));
results.push(forced);
const groundOff = await walk(browser, "ground hidden", (p) =>
  p.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = ".hami-page-ground{display:none !important}";
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
  }),
);
results.push(groundOff);

console.log(`document height by condition: ${results.map((r) => `${r.label} ${r.snap.docHeight}px`).join(" · ")}`);
console.log("  (height is contract A1's subject, not A2's; the reduced-motion shortfall is 008's brand deck releasing its pin travel, which its own C8 gate records as 1511px animated vs 1270px static)");

const cases = [
  ["A2 reduced motion is content-identical", reduced],
  ["L4 forced colours is content-identical", forced],
  ["G1 ground removed is content-identical", groundOff],
];
for (const [name, other] of cases) {
  const lines = diff(base, other);
  const attributable = lines.filter((l) => !noise.has(l.trim().split(":")[0]));
  const same = attributable.length === 0;
  if (!same) ok = false;
  console.log(
    `${name.padEnd(42)} ${same ? "PASS" : "FAIL"} — ${other.hash}` +
      (same && lines.length ? ` (differs only in fields two identical runs also differ in: ${lines.length} line(s))` : ""),
  );
  attributable.forEach((l) => console.log(l));
}

// A3 — the ground must be invisible to assistive technology, and invisible in a way that is
// checkable rather than asserted.
const a3ok = base.tree.present && base.tree.ariaHidden === "true" && !base.tree.hasText && !base.tree.focusable && base.tree.role !== "img";
if (!a3ok) ok = false;
console.log(`${"A3 ground silent to AT".padEnd(42)} ${a3ok ? "PASS" : "FAIL"} — ${JSON.stringify(base.tree)}`);

// L4's other half: under forced colours the layer must actually step aside.
const l4ok = forced.tree.display === "none";
if (!l4ok) ok = false;
console.log(`${"L4 layer steps aside under forced colours".padEnd(42)} ${l4ok ? "PASS" : "FAIL"} — computed display "${forced.tree.display}"`);

// A3, read off the tree rather than off the attribute.
const a3tree =
  !base.ax.groundNodePresent &&
  base.ax.groundNamed.length === 0 &&
  base.ax.total === groundOff.ax.total &&
  base.ax.named === groundOff.ax.named;
if (!a3tree) ok = false;
console.log(
  `${"A3 tree carries no ground node".padEnd(42)} ${a3tree ? "PASS" : "FAIL"} — ` +
    `baseline ${base.ax.total} nodes / ${base.ax.named} named, ground hidden ${groundOff.ax.total} / ${groundOff.ax.named}, ` +
    `ground node in tree: ${base.ax.groundIgnored.join(", ")}${base.ax.groundNamed.length ? `, named nodes: ${base.ax.groundNamed.join(" | ")}` : ""}`,
);

writeFileSync("specs/002-scroll-atmosphere/notes/content-identity.json", JSON.stringify(results, null, 1));
console.log(ok ? "\nPASS — the shop is the same shop in every condition." : "\nFAIL — a condition changed the content; the diff above names what.");
process.exit(ok ? 0 : 1);
