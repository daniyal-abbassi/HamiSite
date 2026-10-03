/**
 * Feature 002 — T001 baseline capture.
 *
 * Records the homepage ground BEFORE any atmosphere work, because FR-005, contract clause P8 and SC-001
 * are all comparisons against today and cannot be reconstructed later from memory.
 *
 * Three things are captured at each of ten evenly spaced scroll positions, at 360px and 1280px:
 *   1. a screenshot, for the visual comparison in T016/T017;
 *   2. the rendered ground PIXEL in both side gutters — the ground is body + body::before + a
 *      per-section ::before, none of which is readable as a colour from any single element, so the only
 *      honest measurement is the composited pixel;
 *   3. the declared background of every layer that paints it, so a later change can be attributed.
 *
 * The pixel is read by handing the PNG back to a scratch page and sampling it with a 2D canvas, which
 * avoids adding an image-decoding dependency (see notes/dependency-ceiling.md).
 *
 * Trap recorded in quickstart.md and honoured here: getBoundingClientRect() of a FIXED layer is
 * viewport-relative, so the ground's own box is never used as a position reference.
 *
 * Usage:
 *   PLAYWRIGHT_PATH=/path/to/node_modules/playwright \
 *     node specs/002-scroll-atmosphere/tools/baseline-capture.mjs
 *
 * Playwright is deliberately NOT a dependency of this app — see
 * ../notes/dependency-ceiling.md, which records the thirteen-package ceiling. These capture tools are
 * feature instrumentation, not product code, so they resolve a local Playwright from the environment
 * and fail with instructions rather than quietly adding a package.
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);

async function loadChromium() {
  const candidates = [process.env.PLAYWRIGHT_PATH, "playwright"].filter(Boolean);
  for (const id of candidates) {
    try {
      // createRequire, not import(): Node ESM will not resolve a bare directory through a file:// URL,
      // and PLAYWRIGHT_PATH points at a playwright package directory.
      const mod = require(id);
      if (mod?.chromium) return mod;
    } catch {
      /* try the next candidate */
    }
  }
  throw new Error(
    "Playwright not resolvable. Set PLAYWRIGHT_PATH to a local playwright module directory.\n" +
      "  PLAYWRIGHT_PATH=/path/to/node_modules/playwright node specs/002-scroll-atmosphere/tools/baseline-capture.mjs",
  );
}

const { chromium } = await loadChromium();

const FEATURE = path.resolve(import.meta.dirname, "..");
const OUT = path.join(FEATURE, "baseline");
const POSITIONS = 10;
const WIDTHS = [360, 1280];
const URL = process.env.HAMI_URL || "http://localhost:3000/";

/**
 * Probe points are SEARCHED for, not assumed.
 *
 * The first two versions used fixed x positions. At 360px the gutter is bare ground and that worked;
 * at 1280px the content column is centred but several bands are full-bleed (the featured tray, the
 * brand ticker, the white wave), so a viewport-edge probe returned a constant #0b0204 — the bare body
 * colour with every glow missed — and at one position returned #faf4e6, a cream card pixel recorded as
 * if it were the environment. A reference that can contain a content pixel is worse than no reference,
 * because T016's diff and T017's judgement both read from it.
 *
 * So: walk candidate points and accept only one where the hit-tested element IS the page structure
 * itself (body / .site-shell / main / a <section>) rather than anything inside a content column. That
 * is bare ground by construction, and the chosen coordinates are recorded so the later sweep samples
 * the same method rather than the same pixels.
 */
const probePoints = () => {
  // Declared inside the function: page.evaluate serialises only the function it is handed, so any
  // helper it needs would not exist in the page otherwise.
  const paints = (el) => {
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor;
    const opaque = bg && bg !== "transparent" && !/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)$/.test(bg);
    return opaque || (cs.backgroundImage && cs.backgroundImage !== "none");
  };
  /**
   * Bare atmosphere means: the hit-tested point sits on page structure, and nothing between it and
   * <body> paints a surface of its own. A <section> whose glow comes from ::before still passes —
   * pseudos are not in the hit-test chain, and that glow IS the atmosphere. A section that paints its
   * own background (the light "paper" chapter, a cream tray) does not, because recording its colour
   * would put a surface pixel into a series meant to track one thing.
   */
  const isBare = (x, y) => {
    let el = document.elementFromPoint(x, y);
    if (!el) return false;
    while (el && el !== document.body) {
      const structural =
        el === document.documentElement ||
        el.tagName === "MAIN" ||
        el.tagName === "SECTION" ||
        el.tagName === "HEADER" ||
        el.tagName === "FOOTER" ||
        el.classList?.contains("site-shell") ||
        el.classList?.contains("noir-stars") ||
        el.classList?.contains("gradient-blur");
      if (!structural) return false;
      if (paints(el)) return false;
      el = el.parentElement;
    }
    return el === document.body;
  };
  const describe = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const cs = el ? getComputedStyle(el) : null;
    return {
      x,
      y,
      bare: true,
      // Recorded so a reader can see what each colour actually came from. The predicate below is
      // strict, but a section lit by its own ::before pseudo passes — legitimately, since that glow
      // is atmosphere — and the series is only comparable if the reader can tell the two apart.
      on: el ? `${el.tagName.toLowerCase()}${typeof el.className === "string" && el.className ? `.${el.className.split(" ")[0]}` : ""}` : null,
      onBackground: cs ? cs.backgroundColor : null,
    };
  };
  const ys = [0.35, 0.5, 0.65, 0.2, 0.8].map((f) => Math.round(innerHeight * f));
  const find = (from, to, step) => {
    for (const y of ys) {
      for (let x = from; step > 0 ? x < to : x > to; x += step) {
        if (isBare(x, y)) return describe(x, y);
      }
    }
    return null;
  };
  return [
    { name: "start-gutter", ...find(6, Math.round(innerWidth / 2), 6) },
    { name: "end-gutter", ...find(innerWidth - 7, Math.round(innerWidth / 2), -6) },
  ].map((p) => ({ ...p, bare: p.x != null }));
};

const groundRecord = () => {
  const layers = [];
  const body = getComputedStyle(document.body);
  layers.push({ layer: "body", backgroundColor: body.backgroundColor, backgroundImage: body.backgroundImage });
  const before = getComputedStyle(document.body, "::before");
  layers.push({ layer: "body::before", position: before.position, backgroundImage: before.backgroundImage });
  for (const [i, section] of [...document.querySelectorAll("main > section")].entries()) {
    const id = section.id || `section-${i}`;
    const b = getComputedStyle(section, "::before");
    const a = getComputedStyle(section, "::after");
    layers.push({ layer: `main > section#${id}::before`, position: b.position, inset: b.inset, backgroundImage: b.backgroundImage });
    layers.push({ layer: `main > section#${id}::after`, position: a.position, backgroundImage: a.backgroundImage });
  }
  return {
    scrollY: window.scrollY,
    docHeight: document.documentElement.scrollHeight,
    sectionOrder: [...document.querySelectorAll("main > section")].map((s) => s.id || "(anonymous)"),
    layers,
  };
};

async function samplePixels(page, pngBuffer, points) {
  const usable = points.filter((p) => p.bare);
  if (usable.length === 0) return { note: "no bare atmosphere point at this position" };
  return page.evaluate(
    async ({ dataUrl, points }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      return Object.fromEntries(
        points.map((p) => {
          if (!p.bare) return [p.name, null];
          const [r, g, b] = ctx.getImageData(p.x, p.y, 1, 1).data;
          return [p.name, `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`];
        }),
      );
    },
    { dataUrl: `data:image/png;base64,${pngBuffer.toString("base64")}`, points: usable },
  );
}

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const scratch = await browser.newPage();
  const report = {};

  for (const width of WIDTHS) {
    const dir = path.join(OUT, `${width}px`);
    fs.mkdirSync(dir, { recursive: true });
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(URL, { waitUntil: "load", timeout: 180000 });
    await page.waitForSelector("main > section", { timeout: 120000 });
    await page.waitForTimeout(3000); // let the scroll-reveal and fonts settle before sampling

    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const frames = [];

    for (let i = 0; i < POSITIONS; i += 1) {
      const y = Math.round((max * i) / (POSITIONS - 1));
      await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
      await page.waitForTimeout(900);

      const shot = await page.screenshot();
      const file = `pos-${String(i).padStart(2, "0")}-y${y}.png`;
      fs.writeFileSync(path.join(dir, file), shot);

      const points = await page.evaluate(probePoints);
      const pixels = await samplePixels(scratch, shot, points);
      const ground = await page.evaluate(groundRecord);
      frames.push({ file, scrollY: y, progress: +(y / max).toFixed(4), points, pixels, ground });
      console.log(`${width}px pos-${i} y=${y}`, JSON.stringify(pixels));
    }

    report[`${width}px`] = { docHeight: frames.at(-1).ground.docHeight, sectionOrder: frames[0].ground.sectionOrder, frames };
    await page.close();
  }

  fs.writeFileSync(path.join(OUT, "ground-record.json"), JSON.stringify(report, null, 1));
  await browser.close();
  console.log(`\nbaseline written to ${OUT}`);
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
