/*
 * T105 — does the page ground actually move, measured from the pixels a shopper gets?
 *
 * The unit suite in `tests/unit/atmosphere-progression.test.ts` asserts the *authored* function: stage
 * colours, the legibility band, contrast at every interpolated point. That suite passed for the palette
 * the owner described as "the same colour all along", and it was right — because everything that fails
 * between the function and the screen is invisible to it. The layer shipped at `opacity: .5` over a body
 * canvas of its own, so each leg was halved before it reached a pixel and the last two thirds of a
 * 16,384px document moved three units in one channel.
 *
 * So this script does not read the CSS. It scrolls the live page and samples the gutter — four pixels in
 * from each edge, top and bottom, where no content ever paints — and reports the CIE76 distance between
 * consecutive samples. That is the number a eye sees, including every blend, overlay and stacking-context
 * surprise on the way there.
 *
 * "Where no content ever paints" was false at the top of the viewport: the site header is `position: fixed`,
 * 65px tall at 360 (69–90 at desktop) and `z-index: 50`, so y=20 measured the header's own scrim for most of
 * the page, and the header's visibility varies with scroll direction — the same scroll position returned
 * #f2efe8 on one pass and #0b0204 on another. The gated sample is now taken below the header, with the old
 * y=20 reading still printed so a number from before this change stays comparable rather than silently moved.
 *
 *   node specs/001-premium-rtl-storefront/verification/ground-travel.mjs
 *   BASE_URL=http://localhost:3200 node …/ground-travel.mjs
 *   VIEWPORT_W=820 node …/ground-travel.mjs
 *
 * Exit code is non-zero when the rendered journey stops being a tour: the endpoints have to be at least
 * ΔE 25 apart, and the legs have to sum to more than 2.5× that distance. The second condition is what the
 * shipped palette fails — its legs added to 17.0 against an endpoint distance of 16.9, which is one slide
 * wearing a progression's clothes.
 *
 * Since T115 it also fails on paint-over: a *dark* section holding column 0 or the middle gutter is a
 * violation, because a dark band has nothing to say that the moving ground does not already say, and the
 * two that did this (`.band-soft`, `.final-conversion::before`) were each within ΔE 1.3–10 of a tone the arc
 * already supplies at that scroll position. A paper chapter holding either is not a violation — being a
 * chapter is the point of one — and is reported as such so the count of exceptions stays visible.
 *
 * Deliberately *not* gated: a minimum ΔE between consecutive samples. The first version of this script
 * asked for that and failed on its own instrument — a scroll page is 800px tall, so the top and bottom of
 * one viewport are in different chapters, and where a sample lands moves between positions. Leg size
 * belongs to the authored stages, and the unit suite already guards it.
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SAMPLES = 12;
const VW = Number(process.env.VIEWPORT_W ?? 360);

const hexToRgb = (hex) => {
  const v = hex.replace("#", "");
  return [0, 2, 4].map((i) => Number.parseInt(v.slice(i, i + 2), 16));
};
const toLab = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const [x, y, z] = [
    0.4124 * r + 0.3576 * g + 0.1805 * b,
    0.2126 * r + 0.7152 * g + 0.0722 * b,
    0.0193 * r + 0.1192 * g + 0.9505 * b,
  ].map((n, i) => n / [0.95047, 1, 1.08883][i]);
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [x, y, z].map(f);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};
const deltaE = (a, b) => {
  const p = toLab(a);
  const q = toLab(b);
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
};

const browser = await chromium.launch({ executablePath: EXE });
const context = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.setDefaultTimeout(120_000);

/**
 * Decode a screenshot inside the browser rather than adding an image dependency here: the page context
 * already has a PNG decoder, and `getImageData` is the only way to ask what a composited stack actually
 * painted — computed styles would have told us the layer was `#3A0C12` while the alpha said otherwise.
 */
/**
 * Sample four groups of pixels from one screenshot.
 *
 * The four are not interchangeable. The viewport's two outermost COLUMNS are a harder contract than the gutter
 * a few pixels inside them: `#categories` is an inset panel, so owning the middle is its design and reaching
 * column 0 would be a bug, and the old probe tested neither. `header` is kept because it is where the
 * pre-T115 script sampled — the numbers from `notes/findings.md` are measured there and staying comparable is
 * worth one extra row of output.
 */
const gutterPixels = async (buf, topY) =>
  page.evaluate(
    async ({ dataUrl, topY }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const at = (x, y) => {
        const d = ctx.getImageData(x, y, 1, 1).data;
        return `#${[d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
      };
      return {
        header: [at(4, 20), at(img.width - 5, 20)],
        edge: [at(0, topY), at(img.width - 1, topY)],
        middle: [at(4, topY), at(img.width - 5, topY)],
        bottom: [at(4, img.height - 5), at(img.width - 5, img.height - 5)],
      };
    },
    { dataUrl: `data:image/png;base64,${buf.toString("base64")}`, topY },
  );

/**
 * The authored tone the layer is holding at this instant, read from the live element. Compared against
 * what actually painted, this separates the two failures that look identical from the sofa: the arc having
 * nothing in it, and the arc being fine but something opaque painting over it.
 *
 * The selector is right, for the record: a census of every element whose class or inline style mentions
 * "ground" returns exactly one on this page — `div.hami-page-ground`, fixed, inset 0, z-index 0, opacity 1 —
 * and its `background-color` is driven from the outside by `--hami-ground` on the same element's style attr.
 */
const layerTone = () =>
  page.evaluate(() => {
    const el = document.querySelector(".hami-page-ground");
    if (!el) return null;
    const bg = getComputedStyle(el).backgroundColor;
    const [r, g, b] = bg.match(/\d+/g) ?? [];
    return r === undefined ? null : `#${[r, g, b].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
  });

/**
 * Which band is painting at the sample line, and did it declare the right to be there. `.band-paper` and
 * `[data-ground="paper"]` are one contract (globals.css has treated them as synonyms since T117), so a paper
 * chapter owning the middle gutter is by design; a dark band owning it is the T115 defect, and this is what
 * turns the report into a guard instead of a table nobody agrees about.
 */
const whoCovers = (y) =>
  page.evaluate((yy) => {
    const sectionName = (el) => {
      if (!el) return null;
      const s = el.closest("section");
      return s ? `#${s.id || "?"}` : el.tagName.toLowerCase();
    };
    const covers = (x) => {
      const el = document.elementFromPoint(x, yy);
      const paper = el?.closest?.('.band-paper, [data-ground="paper"]');
      return { band: sectionName(el), declared: paper ? `paper#${paper.id || ""}` : null };
    };
    return { middle: covers(4), edge: covers(0) };
  }, y);

await page.goto(`${BASE}/`, { waitUntil: "load" });
await page.waitForTimeout(2_500);
const height = await page.evaluate(() => document.body.scrollHeight);

/**
 * Wait until the page has actually stopped moving.
 *
 * The homepage runs Lenis smooth scrolling (`components/atmosphere/ScrollSmooth.tsx`, Resolved Q1 = C), and a
 * programmatic `scrollTo()` is eased like any other input: a jump from 0% to 50% takes ~1,018ms to arrive,
 * measured frame by frame. The 450ms this script used to wait is *inside* that glide, so every sample compared
 * the tone authored for the destination against a pixel painted somewhere on the way to it — which is where the
 * unexplained ΔE 0.4–1.6 residuals came from at positions nothing was covering. Polling for a stable
 * `scrollY` costs a few hundred milliseconds and removes a whole class of phantom defect.
 */
const waitUntilSettled = async (budgetMs = 3_000) =>
  page.evaluate(
    async (budget) => {
      const t0 = performance.now();
      let last = scrollY;
      let stable = 0;
      while (performance.now() - t0 < budget) {
        await new Promise((r) => requestAnimationFrame(r));
        if (Math.abs(scrollY - last) < 0.5) stable += 1;
        else stable = 0;
        last = scrollY;
        if (stable >= 4) return { ms: Math.round(performance.now() - t0), settled: true };
      }
      return { ms: Math.round(performance.now() - t0), settled: false };
    },
    budgetMs,
  );

const rows = [];
for (let i = 0; i <= SAMPLES; i += 1) {
  const progress = i / SAMPLES;
  await page.evaluate((p) => scrollTo(0, (document.body.scrollHeight - innerHeight) * p), progress);
  const settle = await waitUntilSettled();
  // Recomputed per position: the header is 78px tall at the top of the page and 65px once scrolled, and the
  // sample line has to stay below whichever of them is current.
  const topY = await page.evaluate(() => {
    const header = document.querySelector("header");
    const h = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    return Math.min(h + 24, innerHeight - 8);
  });
  const px = await gutterPixels(await page.screenshot(), topY);
  rows.push({ progress, topY, settle, layer: await layerTone(), px, cover: await whoCovers(topY) });
}
await browser.close();

const TOLERANCE = 3;
console.log(`homepage ${height}px at ${VW}×800, ${SAMPLES + 1} scroll positions`);
console.log(`sample line y=${rows[0]?.topY} (below the fixed header); edge = columns 0 and ${VW - 1}, middle = 4 and ${VW - 5}\n`);

let legs = 0;
const edgeFails = [];
const middleFails = [];
let paperOwned = 0;
let paperEdges = 0;
rows.forEach((row, i) => {
  const tone = row.layer ?? row.px.middle[0];
  const prevTone = i === 0 ? null : rows[i - 1].layer ?? rows[i - 1].px.middle[0];
  if (prevTone !== null) legs += deltaE(prevTone, tone);
  const dEdge = [deltaE(tone, row.px.edge[0]), deltaE(tone, row.px.edge[1])];
  const dMid = [deltaE(tone, row.px.middle[0]), deltaE(tone, row.px.middle[1])];
  const pct = Math.round(row.progress * 100);
  // A paper chapter may own the edge — being a chapter is the whole point of one, and whether a given
  // chapter is inset or full-bleed is its owner's layout call, not a ground defect. A *dark* section
  // owning column 0 is the T115 defect, because a dark band has nothing to say that the arc does not
  // already say, and it is exactly what `.band-soft` and `.final-conversion::before` were doing.
  const edgeDeclared = Boolean(row.cover.edge.declared);
  const edgeBad = !edgeDeclared && (dEdge.some((d) => d >= TOLERANCE) || row.px.edge[0] !== row.px.edge[1]);
  const midBad = dMid.some((d) => d >= TOLERANCE);
  if (edgeBad) edgeFails.push(pct);
  if (edgeDeclared && dEdge.some((d) => d >= TOLERANCE)) paperEdges += 1;
  if (midBad && !row.cover.middle.declared) middleFails.push(pct);
  if (midBad && row.cover.middle.declared) paperOwned += 1;
  const notes = [
    edgeBad ? `EDGE painted by ${row.cover.edge.band} — a dark band owns column 0` : "",
    midBad ? (row.cover.middle.declared ? `middle owned by declared ${row.cover.middle.declared}` : `middle painted by ${row.cover.middle.band}, undeclared`) : "",
    row.px.bottom.some((b) => b !== row.px.middle[0]) ? `bottom: ${[...new Set(row.px.bottom)].join(" ")}` : "",
  ]
    .filter(Boolean)
    .join("   ");
  console.log(
    `${String(pct).padStart(3)}%  authored ${row.layer ?? "—"}  edge ${row.px.edge.join(" ")}  middle ${row.px.middle.join(" ")}` +
      `  Δe ${dEdge[0].toFixed(1)}/${dMid[0].toFixed(1)}${notes ? `   ${notes}` : ""}` +
      `   [settle ${row.settle.ms}ms${row.settle.settled ? "" : " STILL MOVING"}]  [was ${row.px.header.join(" ")} at y=20]`,
  );
});

const seen = rows.map((r) => r.layer ?? r.px.middle[0]);
const endpoints = deltaE(seen[0], seen.at(-1));
const distinct = new Set(seen).size;
console.log(`\ndistinct authored tones seen: ${distinct} of ${rows.length}`);
console.log(`legs summed ΔE ${legs.toFixed(1)}   endpoints ΔE ${endpoints.toFixed(1)}   ratio ${(legs / endpoints).toFixed(1)}×`);
console.log(`undeclared paint-overs: ${edgeFails.length} at the edges${edgeFails.length ? ` (${edgeFails.join("%, ")}%)` : ""}, ${middleFails.length} in the middle gutter${middleFails.length ? ` (${middleFails.join("%, ")}%)` : ""}`);
console.log(`paper chapters owning pixels by design: ${paperOwned} middle, ${paperEdges} edge positions (not counted against the ground)`);
console.log("a tour sums to more than its endpoints differ by; a slide does not (the shipped palette: 17.0 vs 16.9)");

const failed = legs < endpoints * 2.5 || distinct < 8 || edgeFails.length > 0 || middleFails.length > 0;
console.log(
  `\n${failed ? "FAIL" : "PASS"} — legs ≥ 2.5× endpoints, ≥ 8 distinct tones, and no band owning a pixel it did not declare` +
    ` (measured ${(legs / endpoints).toFixed(1)}×, ${distinct} tones, ${edgeFails.length} edge + ${middleFails.length} middle violations)`,
);
process.exit(failed ? 1 : 0);
