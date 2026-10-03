/* Two focused questions the main gate could not answer cleanly:
 *   Q1 does the nav's px-2 apply — to the probe, and to the REAL dock?
 *   Q2 does the marker animate, sampled from inside the page with rAF rather than
 *      through a Playwright round-trip that is slower than the trip itself. */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
const page = await (await browser.newContext({ viewport: { width: 360, height: 640 } })).newPage();

await page.goto("http://localhost:3000/zz-ls-probe", { waitUntil: "networkidle" });
await page.waitForSelector("#probe-dock a");

/* ---- Q1: padding, on both navs ---- */
const pad = await page.evaluate(() => {
  const read = (el) =>
    el
      ? {
          cls: [...el.classList].filter((c) => /^p/.test(c)).join(","),
          paddingLeft: getComputedStyle(el).paddingLeft,
          paddingRight: getComputedStyle(el).paddingRight,
          paddingInline: getComputedStyle(el).paddingInlineStart,
          offsetW: el.offsetWidth,
          clientW: el.clientWidth,
        }
      : null;
  const probe = document.querySelector("#probe-nav");
  const real = document.querySelector('nav[aria-label="ناوبری سریع فروشگاه"]:not(#probe-nav)');
  // Which rules actually matched the probe nav?
  const matched = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const r of rules) {
      if (!r.selectorText || !r.style) continue;
      if (!r.style.paddingLeft && !r.style.paddingInline) continue;
      try {
        if (probe.matches(r.selectorText)) matched.push(`${r.selectorText} → ${r.style.paddingLeft || r.style.paddingInline}`);
      } catch {
        /* ignore unmatchable selectors */
      }
    }
  }
  return { probe: read(probe), real: read(real), matched };
});
console.log("Q1 probe nav:", JSON.stringify(pad.probe));
console.log("Q1 real  nav:", JSON.stringify(pad.real));
console.log("Q1 rules matching the probe nav that set padding:");
for (const m of pad.matched) console.log("   ", m);

/* ---- Q2: rAF-sampled trip inside the page ---- */
const trip = await page.evaluate(async () => {
  const group = document.querySelector("#probe-motion > div");
  const marker = group.querySelector("span[class*='marker']");
  const target = group.querySelector('button[data-ls-item="account"]');
  const frames = [];
  let stop = false;
  const t0 = performance.now();
  const tick = () => {
    if (stop) return;
    const r = marker.getBoundingClientRect();
    const cs = getComputedStyle(marker);
    frames.push({
      t: Math.round(performance.now() - t0),
      left: Math.round(r.left * 10) / 10,
      w: Math.round(r.width * 10) / 10,
      tf: cs.transform === "none" ? "" : cs.transform,
      wc: cs.willChange,
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  // Sample a while BEFORE the click: the first frames after a cold click were
  // being swallowed, and a trip that starts at t=0 cannot be seen from t=329.
  await new Promise((res) => setTimeout(res, 200));
  const mark = frames.length;
  target.click();
  await new Promise((res) => setTimeout(res, 1400));
  stop = true;
  return { frames, mark, placedAttr: group.hasAttribute("data-ls-placed") };
});
const distinctLeft = new Set(trip.frames.map((f) => f.left)).size;
const distinctWidth = new Set(trip.frames.map((f) => f.w)).size;
const withTransform = trip.frames.filter((f) => f.tf && f.tf !== "none").length;
console.log(`\nQ2 frames=${trip.frames.length} clicked at frame ${trip.mark} distinctLeft=${distinctLeft} distinctWidth=${distinctWidth} framesWithTransform=${withTransform} data-ls-placed=${trip.placedAttr}`);
console.log("   t / left / width / willChange / transform");
for (const f of trip.frames.slice(trip.mark - 2, trip.mark + 24)) {
  const sc = f.tf ? f.tf.replace(/^matrix\(([^,]+),[^,]+,[^,]+,([^,]+),/, "scale($1,$2) ") : "";
  console.log(`   ${String(f.t).padStart(4)}  ${String(f.left).padStart(6)}  ${String(f.w).padStart(5)}  ${String(f.wc).padEnd(9)} ${sc}`);
}
await browser.close();
