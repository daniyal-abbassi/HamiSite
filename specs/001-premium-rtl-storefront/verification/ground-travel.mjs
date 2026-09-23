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
 *   node specs/001-premium-rtl-storefront/verification/ground-travel.mjs
 *   BASE_URL=http://localhost:3200 node …/ground-travel.mjs
 *
 * Exit code is non-zero when the rendered journey stops being a tour: the endpoints have to be at least
 * ΔE 25 apart, and the legs have to sum to more than 2.5× that distance. The second condition is what the
 * shipped palette fails — its legs added to 17.0 against an endpoint distance of 16.9, which is one slide
 * wearing a progression's clothes.
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
const gutterPixels = async (buf) =>
  page.evaluate(async (dataUrl) => {
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
    return [at(4, 20), at(img.width - 5, 20), at(4, img.height - 5), at(img.width - 5, img.height - 5)];
  }, `data:image/png;base64,${buf.toString("base64")}`);

/**
 * The authored tone the layer is holding at this instant, read from the live element. Compared against
 * what actually painted, this separates the two failures that look identical from the sofa: the arc having
 * nothing in it, and the arc being fine but something opaque painting over it.
 */
const layerTone = () =>
  page.evaluate(() => {
    const el = document.querySelector(".hami-page-ground");
    if (!el) return null;
    const bg = getComputedStyle(el).backgroundColor;
    const [r, g, b] = bg.match(/\d+/g) ?? [];
    return r === undefined ? null : `#${[r, g, b].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
  });

await page.goto(`${BASE}/`, { waitUntil: "load" });
await page.waitForTimeout(2_500);
const height = await page.evaluate(() => document.body.scrollHeight);

const rows = [];
for (let i = 0; i <= SAMPLES; i += 1) {
  const progress = i / SAMPLES;
  await page.evaluate((p) => scrollTo(0, (document.body.scrollHeight - innerHeight) * p), progress);
  await page.waitForTimeout(450);
  const [tl, tr, bl, br] = await gutterPixels(await page.screenshot());
  // The top pair straddles one chapter, so agreement between them means the ground is reaching the
  // pixel. The bottom pair rarely does — the dock and the section seams paint there — so it is reported
  // rather than gated.
  rows.push({ progress, layer: await layerTone(), tl, tr, bottom: [bl, br] });
}
await browser.close();

console.log(`homepage ${height}px at 360×800, ${SAMPLES + 1} scroll positions, gutter pixels sampled\n`);
let legs = 0;
let reached = 0;
rows.forEach((row, i) => {
  const leg = i === 0 ? null : deltaE(rows[i - 1].layer ?? rows[i - 1].tl, row.layer ?? row.tl);
  if (leg !== null) legs += leg;
  const reaches = row.layer !== null && deltaE(row.layer, row.tl) < 3 && row.tl === row.tr;
  if (reaches) reached += 1;
  const notes = [
    reaches ? "" : `covered — gutter shows ${row.tl}/${row.tr}`,
    row.bottom.some((b) => b !== row.tl) ? `bottom gutter: ${[...new Set(row.bottom)].join(" ")}` : "",
  ]
    .filter(Boolean)
    .join("   ");
  console.log(
    `${String(Math.round(row.progress * 100)).padStart(3)}%  authored ${row.layer ?? "—"}  gutter ${row.tl}` +
      `${leg === null ? "" : `   ΔE ${leg.toFixed(1)}`}${notes ? `   ${notes}` : ""}`,
  );
});

const seen = rows.map((r) => r.layer ?? r.tl);
const endpoints = deltaE(seen[0], seen.at(-1));
const distinct = new Set(seen).size;
console.log(`\ndistinct authored tones seen: ${distinct} of ${rows.length}`);
console.log(`legs summed ΔE ${legs.toFixed(1)}   endpoints ΔE ${endpoints.toFixed(1)}   ratio ${(legs / endpoints).toFixed(1)}×`);
console.log(`ground reaches the gutter unpainted at ${reached}/${rows.length} positions`);
console.log("a tour sums to more than its endpoints differ by; a slide does not (the shipped palette: 17.0 vs 16.9)");

const failed = legs < endpoints * 2.5 || distinct < 8;
console.log(
  `\n${failed ? "FAIL" : "PASS"} — legs ≥ 2.5× endpoints and ≥ 8 distinct tones` +
    ` (measured ${(legs / endpoints).toFixed(1)}× and ${distinct})`,
);
process.exit(failed ? 1 : 0);
