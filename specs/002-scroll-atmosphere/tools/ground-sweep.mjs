/**
 * Feature 002 — T015 (the sweep), T012 (is the ground actually calmer?) and T016 (diff vs baseline).
 *
 * Steps the homepage from top to bottom and, at each position, records:
 *   - the tone the progression resolved (`--hami-ground`), for monotonic direction and seam size;
 *   - the rendered gutter colours on both sides, with the layer ON and with it OFF.
 *
 * That second pair is the point. FR-005 says the result "MUST read as calmer than the existing
 * decorative glow field it follows", and FR-018 says the new layer must reconcile with that field rather
 * than compete with it. Both are about a relationship, and the measurable face of that relationship is
 * the **left-right asymmetry** the existing per-section lighting produces (`app/globals.css:193-214`
 * alternates the glow side by side). If the tint genuinely subdues that alternation, the mean
 * start-vs-end luminance gap shrinks with the layer on. If it merely adds another layer of colour, the
 * gap stays or grows — and the feature is doing the thing the request complained about.
 *
 * Usage: PLAYWRIGHT_PATH=/path/to/node_modules/playwright node specs/002-scroll-atmosphere/tools/ground-sweep.mjs
 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const loadChromium = () => {
  for (const id of [process.env.PLAYWRIGHT_PATH, "playwright"].filter(Boolean)) {
    try {
      const mod = require(id);
      if (mod?.chromium) return mod;
    } catch {
      /* next candidate */
    }
  }
  throw new Error("Playwright not resolvable. Set PLAYWRIGHT_PATH to a local playwright module directory.");
};
const { chromium } = loadChromium();

const URL = process.env.HAMI_URL || "http://localhost:3000/";
const STEPS = Number(process.env.STEPS || 21);
const WIDTH = Number(process.env.WIDTH || 360);

const lum = (hex) => {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(v.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

/** The same bare-atmosphere predicate the baseline uses, but applied to a GRID rather than one point.
 *
 * The first version sampled a single probe per side and got a usable answer at only 10 of 21 positions —
 * too sparse to carry a gate verdict, and it was reporting reversals of a 10-point series. So: test a
 * grid across the whole viewport, keep every point that is bare atmosphere, and take the median. That
 * turns "one lucky gutter pixel" into a distribution, and lets asymmetry be measured as left-half median
 * versus right-half median.
 */
const bareGrid = () => {
  const paints = (el) => {
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor;
    const opaque = bg && bg !== "transparent" && !/, 0\)$/.test(bg);
    return opaque || (cs.backgroundImage && cs.backgroundImage !== "none");
  };
  const isBare = (x, y) => {
    let el = document.elementFromPoint(x, y);
    if (!el) return false;
    while (el && el !== document.body) {
      const structural =
        el.tagName === "MAIN" || el.tagName === "SECTION" || el.tagName === "HEADER" || el.tagName === "FOOTER" ||
        el === document.documentElement ||
        el.classList?.contains("site-shell") || el.classList?.contains("noir-stars") || el.classList?.contains("gradient-blur");
      if (!structural || paints(el)) return false;
      el = el.parentElement;
    }
    return el === document.body;
  };
  const points = [];
  for (let y = 40; y < innerHeight - 20; y += 40) {
    for (let x = 6; x < innerWidth - 6; x += 12) {
      if (isBare(x, y)) points.push({ x, y });
    }
  }
  return { points, half: Math.round(innerWidth / 2) };
};

async function sampleGrid(scratch, shot, grid) {
  if (grid.points.length === 0) return null;
  return scratch.evaluate(
    async ({ dataUrl, points, half }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const lumOf = (r, g, b) => {
        const f = (v) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const left = [];
      const right = [];
      const all = [];
      const bytes = [];
      const leftB = [];
      const rightB = [];
      for (const p of points) {
        const [r, g, b] = ctx.getImageData(p.x, p.y, 1, 1).data;
        const l = lumOf(r, g, b);
        // A linear-lightness proxy. WCAG luminance is *not* linear in the bytes a
        // compositor actually blends, and in this deep-dark range the gamma curve
        // has a slope of 1/12.92 per byte — so a 1-byte difference near black is
        // worth more luminance than a 4-byte one at mid-grey. Reporting only the
        // luminance series would make an alpha blend look like it amplified the
        // field when the bytes say it shrank it. Both are recorded on purpose.
        const by = (r + g + b) / 3;
        all.push(l);
        bytes.push(by);
        (p.x < half ? left : right).push(l);
        (p.x < half ? leftB : rightB).push(by);
      }
      const median = (xs) => (xs.length ? xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)] : null);
      return {
        samples: all.length,
        median: median(all),
        left: median(left),
        right: median(right),
        byteMedian: median(bytes),
        byteLeft: median(leftB),
        byteRight: median(rightB),
      };
    },
    { dataUrl: `data:image/png;base64,${shot.toString("base64")}`, points: grid.points, half: grid.half },
  );
}

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const scratch = await browser.newPage();
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });
  await page.goto(URL, { waitUntil: "load", timeout: 180000 });
  await page.waitForSelector(".hami-page-ground", { timeout: 120000 });
  await page.waitForTimeout(3000);

  const sweep = async (layerVisible, opacity, glowsOff = false) => {
    await page.evaluate(
      ({ visible, opacity, glowsOff }) => {
        const el = document.querySelector(".hami-page-ground");
        el.style.display = visible ? "" : "none";
        el.style.opacity = visible && opacity != null ? String(opacity) : "";
        // The decisive control. The per-section radial glows live on `main >
        // section::before/::after`, and `main` is z-10 while the ground layer is
        // z-0 — so the glows paint *above* the new layer. If they are the source
        // of the left/right alternation, no opacity on a layer beneath them can
        // subdue it, and FR-005 is a stacking problem rather than a tuning one.
        let tag = document.getElementById("probe-glows-off");
        if (glowsOff && !tag) {
          tag = document.createElement("style");
          tag.id = "probe-glows-off";
          tag.textContent = "main > section::before, main > section::after { display: none !important; }";
          document.head.appendChild(tag);
        } else if (!glowsOff && tag) {
          tag.remove();
        }
      },
      { visible: layerVisible, opacity: opacity ?? null, glowsOff },
    );
    await page.waitForTimeout(300);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const rows = [];
    for (let i = 0; i < STEPS; i += 1) {
      const y = Math.round((max * i) / (STEPS - 1));
      await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
      await page.waitForTimeout(420);
      const grid = await page.evaluate(bareGrid);
      const declared = await page.evaluate(() => document.querySelector('.hami-page-ground').style.getPropertyValue("--hami-ground"));
      const shot = await page.screenshot();
      const sampled = await sampleGrid(scratch, shot, grid);
      rows.push({
        progress: +(y / max).toFixed(4),
        y,
        declared: declared.toLowerCase(),
        declaredLum: +lum(declared || "#000000").toFixed(5),
        ...(sampled ?? {
          samples: 0,
          median: null,
          left: null,
          right: null,
          byteMedian: null,
          byteLeft: null,
          byteRight: null,
        }),
      });
    }
    return rows;
  };

  const OPACITIES = (process.env.OPACITIES || "0.35,0.5,0.85").split(",").map(Number);
  const passes = [{ label: "off", opacity: null }];
  for (const opacity of OPACITIES) passes.push({ label: `a${opacity}`, opacity });
  passes.push({ label: "glowsOff", opacity: null, glowsOff: true });
  passes.push({ label: "glowsOff+a", opacity: 0.5, glowsOff: true });
  const results = {};
  for (const p of passes) {
    results[p.label] = await sweep(p.opacity != null, p.opacity ?? null, !!p.glowsOff);
  }
  await page.evaluate(() => {
    const el = document.querySelector(".hami-page-ground");
    el.style.display = "";
    el.style.opacity = "";
  });

  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const reversals = (series) => {
    const s = series.filter((v) => v != null);
    let rev = 0;
    let prev = 0;
    for (let i = 1; i < s.length; i += 1) {
      const d = s[i] - s[i - 1];
      if (Math.abs(d) < 1e-5) continue;
      const dir = Math.sign(d);
      if (prev && dir !== prev) rev += 1;
      prev = dir;
    }
    return { reversals: rev, points: s.length, range: +(Math.max(...s) - Math.min(...s)).toFixed(5) };
  };
  const absDiff = (rows, a, b) =>
    mean(rows.map((r) => (r[a] != null && r[b] != null ? Math.abs(r[a] - r[b]) : null)).filter((v) => v != null));

  const analyse = (rows) => ({
    barePixelSamples: rows.reduce((acc, r) => acc + r.samples, 0),
    renderedLuminance: reversals(rows.map((r) => r.median)),
    renderedLightness: reversals(rows.map((r) => r.byteMedian)),
    asymmetryLuminance: +absDiff(rows, "left", "right").toFixed(5),
    asymmetryLightness: +absDiff(rows, "byteLeft", "byteRight").toFixed(4),
  });

  const analysed = {};
  for (const p of passes) analysed[p.label] = analyse(results[p.label]);

  // Direction and seam size on the declared tone (independent of the layer).
  const withLayer = results[passes[1]?.label ?? "off"];
  const lums = withLayer.map((r) => r.declaredLum);
  const rises = lums.filter((v, i) => i > 0 && v > lums[i - 1] + 1e-6).length;
  const steps = lums.slice(1).map((v, i) => Math.abs(v - lums[i]));
  const maxStep = Math.max(...steps);
  const meanStep = mean(steps);

  const base = analysed.off;
  const report = {
    width: WIDTH,
    steps: STEPS,
    direction: { risingSteps: rises, of: lums.length - 1, first: withLayer[0].declared, last: withLayer.at(-1).declared },
    seams: { maxStepLuminance: +maxStep.toFixed(5), meanStepLuminance: +meanStep.toFixed(5), ratio: +(maxStep / meanStep).toFixed(2) },
    passes: analysed,
    deltaAgainstNoLayer: Object.fromEntries(
      passes.filter((p) => p.opacity != null && !p.glowsOff).map((p) => {
        const a = analysed[p.label];
        return [
          p.label,
          {
            lightnessReversals: `${a.renderedLightness.reversals - base.renderedLightness.reversals >= 0 ? "+" : ""}${a.renderedLightness.reversals - base.renderedLightness.reversals}`,
            lightnessRange: `${(((a.renderedLightness.range - base.renderedLightness.range) / base.renderedLightness.range) * 100).toFixed(1)}%`,
            asymmetryLightness: `${(((a.asymmetryLightness - base.asymmetryLightness) / base.asymmetryLightness) * 100).toFixed(1)}%`,
            luminanceReversals: `${a.renderedLuminance.reversals - base.renderedLuminance.reversals >= 0 ? "+" : ""}${a.renderedLuminance.reversals - base.renderedLuminance.reversals}`,
            luminanceRange: `${(((a.renderedLuminance.range - base.renderedLuminance.range) / base.renderedLuminance.range) * 100).toFixed(1)}%`,
          },
        ];
      }),
    ),
    rows: results,
  };
  writeFileSync(join(process.cwd(), "specs/002-scroll-atmosphere/notes/ground-sweep.json"), JSON.stringify(report, null, 1));

  console.log(`declared direction  : ${rises} of ${lums.length - 1} steps rise — ${withLayer[0].declared} → ${withLayer.at(-1).declared}`);
  console.log(`seams               : max step ${maxStep.toFixed(5)} vs mean ${meanStep.toFixed(5)} (${(maxStep / meanStep).toFixed(2)}×)`);
  console.log("");
  console.log("pass    samples  lightness range  revs  |  asym(L*)  asym(lum)  revs(lum)");
  for (const p of passes) {
    const a = analysed[p.label];
    console.log(
      [
        p.label.padEnd(6),
        String(a.barePixelSamples).padStart(6),
        String(a.renderedLightness.range).padStart(12),
        String(a.renderedLightness.reversals).padStart(5),
        "  |  ",
        String(a.asymmetryLightness).padStart(8),
        String(a.asymmetryLuminance).padStart(10),
        String(a.renderedLuminance.reversals).padStart(9),
      ].join(""),
    );
  }

  await browser.close();
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
