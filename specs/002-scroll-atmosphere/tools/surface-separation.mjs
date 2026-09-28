/* 002 T024 (contract L2) and T025 (contract L3) — the two surfaces the moving ground can reach
 * but the contrast sweep could not measure.
 *
 *   L2  "The fixed header stays legible and visually distinct over every ground tone, in each
 *       of its own appearance states."
 *   L3  "Product imagery keeps clear separation from the ground throughout. Edges do not bleed
 *       into the background at any intermediate tone."
 *
 * Why this is not the same job as contrast-sweep.mjs: that harness composites CSS colours. CSS
 * colours are enough for text, and for the header it is the right instrument — but a product
 * photo is not CSS. `frame-bleed` puts the photograph's own white at the card's top corners
 * (app/globals.css:726-732), so the pixel that meets the ground is a pixel of the photo, and the
 * only honest way to measure it is to look at the rendered pixels. This script screenshots each
 * step and reads them back through an offscreen canvas inside the page, which needs no image
 * decoder on the Node side.
 *
 * Thresholds are decisions, recorded here rather than buried:
 *   - Header text: WCAG 2.2 AA, 4.5:1 normal / 3.0:1 large, same rule as contrast-sweep.mjs.
 *   - Image edge: WCAG 2.2 SC 1.4.11 (Non-text Contrast), 3.0:1 — the standard for "an edge a
 *     shopper must be able to see". Text rules would be the wrong bar for a boundary.
 *
 * Usage: node specs/002-scroll-atmosphere/tools/surface-separation.mjs [--base URL] [--steps N]
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > -1 ? process.argv[i + 1] : d;
};
const BASE = arg("--base", "http://localhost:3000");
const STEPS = Number(arg("--steps", 24));
const DSF = 2;
const TEXT_FLOOR = 4.5;
const TEXT_FLOOR_LARGE = 3.0;
const EDGE_FLOOR = 3.0;

const run = async (width, height) => {
  const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
  const page = await (await browser.newContext({ viewport: { width, height }, deviceScaleFactor: DSF })).newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // Lenis (components/atmosphere/ScrollSmooth.tsx) is mounted on any precision-pointer device and
  // eases the document scroll. A programmatic scrollTo therefore does not land on the requested
  // offset for several hundred ms, and a reading taken at a fixed wait measures a tone the shopper
  // is not looking at. Settle by polling the real scrollY instead, and say out loud which scroller
  // was in play so the number can be re-interpreted later.
  const lenisActive = await page.evaluate(() => /(^|\s)lenis(\s|-)/.test(document.documentElement.className));
  const settle = async (target) => {
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), target);
    let last = -1;
    for (let i = 0; i < 24; i += 1) {
      await page.waitForTimeout(110);
      const now = await page.evaluate(() => window.scrollY);
      if (Math.abs(now - target) < 2 || (last >= 0 && Math.abs(now - last) < 0.6)) return now;
      last = now;
    }
    return page.evaluate(() => window.scrollY);
  };

  // Tag the header's text-bearing nodes once. Controls without textContent (the search input,
  // the icon buttons) are included on purpose: at 360px they are the header's only content, and
  // an instrument that finds no probe there has measured nothing.
  const headerNodes = await page.evaluate(() => {
    const header = document.querySelector("header");
    if (!header) return [];
    const out = [];
    [...header.querySelectorAll("a, button, input, span, b, p")].forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width < 2 || r.height < 2 || cs.visibility === "hidden" || cs.display === "none") return;
      const isControl = el.tagName === "INPUT" || el.tagName === "BUTTON";
      const label = (el.textContent || "").trim() || el.getAttribute("aria-label") || el.placeholder || "";
      if (!isControl && label.length < 2) return;
      if (el.querySelector("a, button, input, span, b, p")) return; // keep leaves, avoid double-counting
      const id = `h${i}`;
      el.setAttribute("data-ss-h", id);
      out.push({ id, tag: el.tagName, label: label.slice(0, 30) });
    });
    return out;
  });

  const doc = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, vh: innerHeight }));

  const headerRows = [];
  const edgeRows = [];
  let unreadable = 0;
  const statesSeen = new Map();

  for (let s = 0; s <= STEPS; s += 1) {
    const target = Math.round((doc.h - doc.vh) * (s / STEPS));
    // The header's own two visible states are not both reachable by going down the page: the pill
    // only exists while scrollY <= 20 (Header.tsx:68), so over every other tone the bar is the only
    // state a shopper can be shown. And the bar hides itself on downward motion (line 52), so a
    // monotonic walk would report "hidden" almost everywhere and never test the bar at all. Nudge
    // up 14px after arriving: that is what a real shopper does, it re-reveals the header, and it
    // leaves the tone essentially where it was.
    let y = await settle(target);
    if (target > 40) y = await settle(target - 14);

    // Screenshot first, then read geometry: a screenshot after a second evaluate risks the DOM
    // moving under it, and the whole point is that these pixels and these boxes agree.
    // This Playwright build returns the raw PNG as a Buffer even when encoding: "base64" is asked
    // for, so convert explicitly — String(buffer) utf8-renders the binary into garbage that the
    // browser then reports as an undecodable image.
    const shot = Buffer.from(await page.screenshot({ type: "png" })).toString("base64");

    const geom = await page.evaluate(() => {
      const parse = (c) => {
        const m = /rgba?\(([^)]+)\)/.exec(c || "");
        if (!m) return null;
        const [r, g, b, a = 1] = m[1].split(",").map(Number);
        return { r, g, b, a: Number(a) };
      };
      const over = (src, dst) => {
        const a = src.a + dst.a * (1 - src.a);
        if (a === 0) return dst;
        return {
          r: (src.r * src.a + dst.r * dst.a * (1 - src.a)) / a,
          g: (src.g * src.a + dst.g * dst.a * (1 - src.a)) / a,
          b: (src.b * src.a + dst.b * dst.a * (1 - src.a)) / a,
          a,
        };
      };
      const groundEl = document.querySelector(".hami-page-ground");
      const ground = groundEl ? parse(getComputedStyle(groundEl).backgroundColor) : null;

      const header = document.querySelector("header");
      const nav = header && header.querySelector("nav");
      // Which appearance state is actually on screen? The bar sets an opaque background on
      // <header>; the pill sets one on <nav>. Reading the computed colours rather than the class
      // names means the instrument cannot be fooled by a class rename.
      let state = "unknown";
      if (header) {
        const hr = header.getBoundingClientRect();
        if (hr.bottom <= 1) state = "hidden";
        else if ((parse(getComputedStyle(header).backgroundColor) || { a: 0 }).a === 1) state = "solid bar";
        else if ((parse(getComputedStyle(nav || document.createElement("i")).backgroundColor) || { a: 0 }).a === 1) state = "pill";
      }

      // Composite the header chain for each probe and report whether the moving ground reaches it.
      const probes = [...document.querySelectorAll("[data-ss-h]")].map((el) => {
        let bg = ground || { r: 255, g: 255, b: 255, a: 1 };
        let reachedGround = true;
        const stack = [];
        for (let n = el; n && n !== document.documentElement; n = n.parentElement) stack.push(n);
        for (const n of stack.reverse()) {
          const c = parse(getComputedStyle(n).backgroundColor);
          if (c && c.a > 0) {
            bg = over(c, bg);
            if (c.a === 1) {
              reachedGround = false;
              break;
            }
          }
        }
        const cs = getComputedStyle(el);
        const px = parseFloat(cs.fontSize);
        const wt = Number(cs.fontWeight) || 400;
        const r = el.getBoundingClientRect();
        return {
          id: el.getAttribute("data-ss-h"),
          color: parse(cs.color) || { r: 0, g: 0, b: 0, a: 1 },
          bg,
          large: px >= 24 || (px >= 18.66 && wt >= 700),
          px,
          wt,
          reachedGround,
          box: { x: r.left, y: r.top, w: r.width, h: r.height },
        };
      });

      // Product image stages: the card is the thing whose edge must not dissolve. Take the box of
      // each stage that is comfortably inside the viewport, plus the card frame colour behind it.
      const stages = [...document.querySelectorAll(".lux-stage")]
        .map((el) => {
          const r = el.getBoundingClientRect();
          // Require 80px of clearance above: the header is fixed and up to ~64px tall, and a pixel
          // sampled 3px above the stage would otherwise be champagne hairline on obsidian, not the
          // ground-vs-photograph boundary contract L3 is about.
          // L3 is about the edge that meets the ground, and on the homepage the stage is taller
          // than it is wide in some frames, so demanding the whole box be on screen found nothing
          // at 1280x800. Require only a settled top edge with header clearance.
          if (r.top < 80 || r.top > innerHeight - 110 || r.width < 40) return null;
          const card = el.closest(".lux-card");
          const img = el.querySelector("img");
          return {
            box: { x: r.left, y: r.top, w: r.width, h: r.height },
            cardBg: card ? parse(getComputedStyle(card).backgroundColor) : null,
            frame: card ? (card.className.match(/frame-(\w+)/) || [, "?"])[1] : "?",
            imgComplete: !!img && img.complete && img.naturalWidth > 0,
            painted: (() => {
              // The featured rail is a horizontal scroller with overflow hidden. Cards that have
              // been scrolled sideways out of it still report a rect inside the viewport, and their
              // rect sits over whatever IS painted there — which is how a real 8.55:1 edge and a
              // fake 1.01:1 "card vs ground" came out of the same step. Ask the browser who is
              // actually on top before trusting a box.
              const hit = document.elementFromPoint(r.left + r.width / 2, Math.min(r.top + 4, innerHeight - 2));
              return !!hit && (hit === el || el.contains(hit) || hit.closest(".lux-stage") === el);
            })(),
          };
        })
        .filter((st) => st && st.painted);

      return { state, probes, stages, ground, groundPresent: !!ground };
    });

    if (!geom.groundPresent) {
      console.log("   !! no .hami-page-ground colour — the atmosphere is not painting; this run proves nothing");
    }
    statesSeen.set(geom.state, (statesSeen.get(geom.state) || 0) + 1);

    for (const p of geom.probes) {
      if (geom.state === "hidden") continue; // no header on screen, so nothing for L2 to hold
      const lum = ({ r, g, b }) => {
        const f = (v) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const ratio = (a, b) => {
        const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
        return (x + 0.05) / (y + 0.05);
      };
      headerRows.push({
        step: s,
        y,
        state: geom.state,
        id: p.id,
        ratio: Math.round(ratio(p.color, p.bg) * 100) / 100,
        need: p.large ? TEXT_FLOOR_LARGE : TEXT_FLOOR,
        reachedGround: p.reachedGround,
        ground: geom.ground ? `${Math.round(geom.ground.r)},${Math.round(geom.ground.g)},${Math.round(geom.ground.b)}` : null,
      });
    }

    if (geom.stages.length) {
      // Read the rendered pixels on either side of each stage's top edge, inside the page itself:
      // the screenshot is handed back as a data URL, drawn to a canvas, and sampled.
      const samples = await page.evaluate(
        async ({ b64, stages }) => {
          const bin = atob(b64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
          const bmp = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
          const cv = document.createElement("canvas");
          cv.width = bmp.width;
          cv.height = bmp.height;
          const ctx = cv.getContext("2d");
          ctx.drawImage(bmp, 0, 0);
          // Derive the device scale from the bitmap rather than trusting the context option: this
          // build ignores deviceScaleFactor for screenshots, and sampling at ×2 on a ×1 image reads
          // outside the canvas, where getImageData returns transparent black and every edge looks
          // like a perfect 1:1 tie.
          const scale = bmp.width / window.innerWidth;
          const px = (cx, cy) => {
            const d = ctx.getImageData(Math.round(cx * scale), Math.round(cy * scale), 1, 1).data;
            // A transparent read is "the instrument could not see this", not "the pixel is black".
            return d[3] === 0 ? null : { r: d[0], g: d[1], b: d[2] };
          };
          return stages.map((st) => {
            const midX = st.box.x + st.box.w / 2;
            const sideY = Math.min(st.box.y + st.box.h / 2, innerHeight - 24);
            return {
              frame: st.frame,
              inside: px(midX, st.box.y + 3),
              above: px(midX, st.box.y - 3),
              insideLeft: px(st.box.x + 3, sideY),
              outsideLeft: px(Math.max(st.box.x - 3, 1), sideY),
            };
          });
        },
        { b64: shot, stages: geom.stages },
      );
      const lum = ({ r, g, b }) => {
        const f = (v) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const ratio = (a, b) => {
        const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
        return (x + 0.05) / (y + 0.05);
      };
      samples.forEach((sm, i) => {
        const row = { step: s, y, stage: i, frame: sm.frame, inside: sm.inside, above: sm.above };
        // Each edge is scored on its own pair. Requiring all four pixels meant a stage whose left
        // edge sat at x=0 (the rail starts flush with the viewport in RTL) threw away a perfectly
        // good top-edge measurement.
        row.topEdge = sm.inside && sm.above ? Math.round(ratio(sm.inside, sm.above) * 100) / 100 : null;
        row.sideEdge = sm.insideLeft && sm.outsideLeft ? Math.round(ratio(sm.insideLeft, sm.outsideLeft) * 100) / 100 : null;
        if (row.topEdge === null && row.sideEdge === null) {
          unreadable += 1;
          return;
        }
        edgeRows.push(row);
      });
    }
  }

  await browser.close();

  const headerWorst = new Map();
  for (const row of headerRows) {
    const k = `${row.state}|${row.id}`;
    const cur = headerWorst.get(k);
    if (!cur || row.ratio < cur.min) headerWorst.set(k, { min: row.ratio, need: row.need, atY: row.y, ground: row.ground, reachedGround: row.reachedGround, id: row.id });
  }
  const headerFails = [...headerWorst.values()].filter((v) => v.min < v.need);

  const edgeVals = (r) => [r.topEdge, r.sideEdge].filter((v) => v !== null);
  const edgeValsOf = (r) => [r.topEdge, r.sideEdge].filter((v) => v !== null);
  const edgeMin = edgeRows.length ? Math.min(...edgeRows.flatMap(edgeVals)) : null;
  const edgeFails = edgeRows.filter((r) => edgeVals(r).some((v) => v < EDGE_FLOOR));

  return {
    width,
    height,
    lenisActive,
    doc,
    states: Object.fromEntries(statesSeen),
    headerNodes,
    headerWorst: [...headerWorst.entries()],
    headerFails,
    edgeSamples: edgeRows.length,
    edgeUnreadable: unreadable,
    edgeMin,
    edgeFails,
    worstEdge: edgeRows.slice().sort((a, b) => Math.min(...edgeValsOf(a)) - Math.min(...edgeValsOf(b))).slice(0, 5),
  };
};

const results = [];
let ok = true;
for (const [w, h] of [[360, 640], [1280, 800]]) {
  console.log(`\n=== ${w}x${h}, ${STEPS + 1} steps ===`);
  const r = await run(w, h);
  results.push(r);
  console.log(`scroller: ${r.lenisActive ? "Lenis eased (pointer: fine) — steps settled by polling scrollY" : "native"}`);
  console.log(`header states seen across the walk: ${JSON.stringify(r.states)}`);
  console.log(`header probes tagged: ${r.headerNodes.length}`);
  for (const [k, v] of r.headerWorst) {
    const [state] = k.split("|");
    console.log(
      `  ${(state + " " + (r.headerNodes.find((n) => n.id === v.id)?.label || "")).padEnd(34)} min ${String(v.min).padStart(6)}:1 ` +
        `need ${v.need} @y=${v.atY} (ground ${v.ground})${v.reachedGround ? "  [ground reaches this text]" : "  [shielded by an opaque layer]"}`,
    );
  }
  const visibleStates = Object.keys(r.states).filter((k) => k !== "hidden");
  const l2 = r.headerFails.length === 0 && r.headerWorst.length > 0 && visibleStates.length >= 2;
  if (!l2) ok = false;
  console.log(
    `L2 header legible in each state:  ${l2 ? "PASS" : "FAIL"} — ${r.headerWorst.length} state/probe pairs ` +
      `across [${visibleStates.join(", ") || "none"}], ${r.headerFails.length} below threshold` +
      (visibleStates.length < 2 ? "  ← only one appearance state was reached, which is a gap, not a pass" : ""),
  );

  if (r.edgeSamples === 0) {
    console.log("L3 image edge separation:         NOT MEASURED — no product stage sat fully inside the viewport at any step");
    ok = false;
  } else {
    const l3 = r.edgeFails.length === 0;
    if (!l3) ok = false;
    console.log(`L3 image edge separation:         ${l3 ? "PASS" : "FAIL"} — ${r.edgeSamples} stage reads, worst ${r.edgeMin}:1 (floor ${EDGE_FLOOR}:1, SC 1.4.11)` + (r.edgeUnreadable ? ` — ${r.edgeUnreadable} stage(s) the canvas could not read at all, excluded` : ""));
    for (const e of r.worstEdge) {
      console.log(
        `     worst: step ${e.step} y=${e.y} frame-${e.frame} top ${e.topEdge ?? "-"}:1 side ${e.sideEdge ?? "-"}:1 ` +
          `inside rgb(${e.inside.r},${e.inside.g},${e.inside.b}) outside rgb(${e.above.r},${e.above.g},${e.above.b})`,
      );
    }
  }
}

writeFileSync("specs/002-scroll-atmosphere/notes/surface-separation.json", JSON.stringify(results, null, 1));
console.log(ok ? "\nPASS — L2 and L3 hold across the walk." : "\nFAIL or GAP — see the lines above; a NOT MEASURED is not a pass.");
process.exit(ok ? 0 : 1);
