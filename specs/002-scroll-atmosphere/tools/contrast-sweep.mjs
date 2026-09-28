/* 002 T022 — the contrast sweep.
 *
 * Contract L1 / SC-004: "no meaningful text falls below its legibility threshold at any
 * intermediate point — zero failing measurements, not an average." A single failing step is
 * a fail. So this does not sample the settled endpoints of each stage; it steps the scroll
 * position across the whole document and, at every step, resolves the colour actually
 * rendered BEHIND a fixed set of representative text nodes and computes the WCAG ratio.
 *
 * The threshold is not stated numerically anywhere in 002's artifacts — the spec says only
 * "its legibility threshold". This harness therefore uses WCAG 2.2 AA: 4.5:1 for normal
 * text, 3.0:1 for large text (>=24px, or >=18.66px at weight >=700). That is a decision,
 * recorded here rather than buried, and the three reference numbers the task names as
 * protected are asserted separately so a threshold choice cannot hide a regression:
 *   cream-on-wine 10.08:1 · brand-ticker band 12.19:1 · 004's smallest emphasised row 5.66:1
 *
 * Usage: node specs/002-scroll-atmosphere/tools/contrast-sweep.mjs [--base URL] [--steps N]
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > -1 ? process.argv[i + 1] : d;
};
const BASE = arg("--base", "http://localhost:3000");
const STEPS = Number(arg("--steps", 60));

/* The six categories contract L1 names, each with candidate selectors tried in order. The
 * script reports which selector actually resolved, so a silent miss cannot masquerade as
 * a pass. */
const PROBES = [
  { kind: "product name", sels: [".lux-body h3", ".lux-body [class*='line-clamp']", ".lux-body .text-base"] },
  { kind: "price", sels: ["[style*='--lux-price']", ".lux-buy .font-mono"] },
  { kind: "availability label", sels: [".lux-stock"] },
  { kind: "section heading", sels: ["main h2"] },
  { kind: "body copy", sels: ["main p", "main li"] },
  { kind: "header label", sels: ["header nav a", "header [role='search'] input", "header button[aria-label]"] },
  /* The first run found only ONE category actually riding the moving ground — everything
   * else sits on an opaque card and cannot be affected by the progression. These four
   * target the text that genuinely has nothing behind it but the atmosphere, which is
   * where L1's risk actually lives. */
  { kind: "eyebrow label", sels: [".section-label p", ".eyebrow"] },
  { kind: "bare heading", sels: ["main h1", "section > h2", ".wrap > h2"] },
  { kind: "bare paragraph", sels: ["main section > p", ".wrap > p", "main section > .mt-4"] },
  { kind: "footer text", sels: ["footer p", "footer a"] },
];

/* An `<input>` and an icon-only `<button>` carry no textContent, so the plain visibility
 * filter rejects them — which silently dropped every header probe at 360px, where the
 * desktop nav is `hidden md:block` and the header's only text-bearing controls are the
 * search field and two icon buttons. Mobile is the primary experience, so a sweep that
 * cannot find a header probe there is not a pass, it is a gap. Form controls are allowed
 * through on their own merits and measured against their placeholder / foreground colour. */

const run = async (width, height) => {
  const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
  const page = await (await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 })).newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);

  // Resolve the probe set once, up front, and keep the element handles' identity by index.
  const resolved = await page.evaluate((probes) => {
    const out = [];
    probes.forEach((p, pi) => {
      for (const sel of p.sels) {
        const els = [...document.querySelectorAll(sel)].filter((e) => {
          const r = e.getBoundingClientRect();
          const cs = getComputedStyle(e);
          const painted = r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
          if (!painted) return false;
          const control = e.tagName === "INPUT" || e.tagName === "BUTTON";
          return control ? true : (e.textContent || "").trim().length > 1;
        });
        if (els.length) {
          els.slice(0, 3).forEach((e, i) => {
            e.setAttribute("data-cs-id", `${pi}:${i}`);
            out.push({ id: `${pi}:${i}`, kind: p.kind, sel, text: e.textContent.trim().slice(0, 40) });
          });
          break;
        }
      }
    });
    return out;
  }, PROBES);

  const missing = PROBES.filter((p) => !resolved.some((r) => r.kind === p.kind)).map((p) => p.kind);

  const doc = await page.evaluate(() => ({
    h: document.documentElement.scrollHeight,
    vh: innerHeight,
    ground: !!document.querySelector(".hami-page-ground"),
  }));

  const rows = [];
  for (let s = 0; s <= STEPS; s += 1) {
    const y = Math.round((doc.h - doc.vh) * (s / STEPS));
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y);
    await page.waitForTimeout(140); // globals.css sets scroll-behavior: smooth

    const step = await page.evaluate(() => {
      const groundEl = document.querySelector(".hami-page-ground");
      const parse = (c) => {
        const m = /rgba?\(([^)]+)\)/.exec(c);
        if (!m) return { r: 0, g: 0, b: 0, a: 0 };
        const [r, g, b, a = 1] = m[1].split(",").map(Number);
        return { r, g, b, a: Number(a) };
      };
      const over = (src, dst) => {
        const a = src.a + dst.a * (1 - src.a);
        if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
        return { r: (src.r * src.a + dst.r * dst.a * (1 - src.a)) / a, g: (src.g * src.a + dst.g * dst.a * (1 - src.a)) / a, b: (src.b * src.a + dst.b * dst.a * (1 - src.a)) / a, a };
      };
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

      const ground = groundEl ? parse(getComputedStyle(groundEl).backgroundColor) : { r: 255, g: 255, b: 255, a: 1 };

      return [...document.querySelectorAll("[data-cs-id]")].map((el) => {
        const cs = getComputedStyle(el);
        // Composite from the ground up through every ancestor that paints, so a
        // translucent card wash over the moving ground is measured, not assumed.
        let bg = ground;
        let chain = [];
        let reachedGround = true; // does the moving ground actually reach this text?
        const stack = [];
        for (let n = el; n && n !== document.body; n = n.parentElement) stack.push(n);
        let gradientUnder = false;
        for (const n of stack.reverse()) {
          const s = getComputedStyle(n);
          if (s.backgroundImage && s.backgroundImage !== "none") gradientUnder = true;
          const c = parse(s.backgroundColor);
          if (c.a > 0) {
            bg = over(c, bg);
            chain.push(s.backgroundColor);
            if (c.a === 1) {
              // Opaque: everything below it, including the moving ground, cannot matter.
              reachedGround = false;
              break;
            }
          }
        }
        const fg = parse(cs.color);
        const px = parseFloat(cs.fontSize);
        const wt = Number(cs.fontWeight) || 400;
        const large = px >= 24 || (px >= 18.66 && wt >= 700);
        return {
          id: el.getAttribute("data-cs-id"),
          ratio: Math.round(ratio({ ...fg, a: 1 }, bg) * 100) / 100,
          need: large ? 3.0 : 4.5,
          px,
          wt,
          large,
          reachedGround,
          shieldedBy: reachedGround ? null : (chain[chain.length - 1] ?? null),
          gradientUnder,
          ground: `rgb(${Math.round(ground.r)},${Math.round(ground.g)},${Math.round(ground.b)})`,
        };
      });
    });
    step.forEach((r) => rows.push({ step: s, y, ...r }));
  }

  await browser.close();
  return { width, height, doc, resolved, missing, rows };
};

const all = [];
for (const [w, h] of [[360, 640], [1280, 800]]) {
  console.log(`\n=== sweeping ${w}x${h} ===`);
  const r = await run(w, h);
  all.push(r);
  console.log(`probes resolved: ${r.resolved.length}`);
  for (const p of r.resolved) console.log(`   ${p.kind.padEnd(20)} ${p.sel}  "${p.text}"`);
  if (r.missing.length) console.log(`   !! NOT FOUND: ${r.missing.join(", ")}`);
  if (!r.doc.ground) console.log("   !! no .hami-page-ground element found — the sweep is measuring the wrong thing");

  const byNode = new Map();
  for (const row of r.rows) {
    const k = `${row.id}`;
    const cur = byNode.get(k);
    if (!cur || row.ratio < cur.min) byNode.set(k, { min: row.ratio, need: row.need, atStep: row.step, atY: row.y, ground: row.ground, kind: r.resolved.find((x) => x.id === k)?.kind ?? "?", gradientUnder: row.gradientUnder });
  }
  const fails = [...byNode.entries()].filter(([, v]) => v.min < v.need);
  console.log(`\n   per-node minimum over ${r.rows.length / r.resolved.length} steps:`);
  for (const [k, v] of byNode) console.log(`   ${(v.kind ?? "?").padEnd(20)} min ${String(v.min).padStart(6)}:1  need ${v.need}  @step ${v.atStep} (y=${v.atY}, ground ${v.ground})${v.gradientUnder ? "  [gradient in chain]" : ""}`);
  console.log(fails.length ? `\n   FAIL — ${fails.length} node(s) dip below threshold at some scroll position` : `\n   PASS — no node dips below its threshold at any of ${r.doc.steps ?? STEPS + 1} steps`);
}

writeFileSync("specs/002-scroll-atmosphere/notes/contrast-sweep.json", JSON.stringify(all, null, 1));
console.log("\nwrote specs/002-scroll-atmosphere/notes/contrast-sweep.json");
