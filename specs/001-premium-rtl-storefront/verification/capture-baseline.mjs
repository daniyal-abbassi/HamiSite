/*
 * T002 — the baseline band 3 is measured against.
 *
 * `audits/05` had to *compute* where the trust row sits at 360px because nothing was
 * captured while a server was listening; that number is now measured. Everything in the
 * manifest is something the browser agrees to, not an inference from a stylesheet: page
 * height, the sections actually mounted, the decoration actually rendered, the
 * letter-spacing actually applied to Persian text.
 *
 *   node specs/001-premium-rtl-storefront/verification/capture-baseline.mjs --tag before
 *   BASE_URL=http://localhost:3200 node …/capture-baseline.mjs --tag before
 *
 * Screenshots go to `../baseline/<surface>@<width>[-<tag>].png` and the manifest to
 * `../baseline/manifest[-<tag>].json`. The tag is in the *file name*, not only the
 * manifest's: the first version of this script wrote `home@360.png` for every run, so
 * capturing the "after" state overwrote the "before" images it existed to compare
 * against — the numbers survived in two manifests, the pictures did not.
 * Run it before touching band 3's styles and again at the checkpoint, so "the strip
 * worked" is a diff rather than an impression.
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = new URL("../baseline/", import.meta.url);
const outDir = path.resolve(OUT.pathname);
const tagIndex = process.argv.indexOf("--tag");
const tag = tagIndex === -1 ? null : process.argv[tagIndex + 1];
if (tagIndex !== -1 && !tag) {
  console.error("--tag needs a value, e.g. --tag before");
  process.exit(2);
}
const suffix = tag ? `-${tag}` : "";
fs.mkdirSync(outDir, { recursive: true });

/** The 12 surfaces `quickstart.md` §4 names. §4 says 13; the list it gives has twelve. */
const SURFACES = [
  ["home", "/"],
  ["shop", "/shop"],
  ["shop-brand", `/shop?brand=${encodeURIComponent("اپل")}`],
  ["pdp-variant", `/shop/${encodeURIComponent("گوشی-موبایل-شیائومی-مدل-poco-x7-pro-دو-سیم-کارت-ظرفیت-512-گیگابایت-و-رم-12-گیگابایت-گلوبال")}`],
  ["pdp-no-image", `/shop/${encodeURIComponent("اپل-آیدی")}`],
  ["cart", "/cart"],
  ["checkout", "/checkout"],
  ["login", "/login"],
  ["register", "/register"],
  ["orders", "/orders"],
  ["partners", "/partners"],
  ["not-found", "/this-page-does-not-exist"],
];

const WIDTHS = [
  { width: 360, height: 800 },
  { width: 1280, height: 900 },
];

const MEASURE = () => {
  const PERSIAN = /[؀-ۿ]/;
  const count = (sel) => document.querySelectorAll(sel).length;
  const backdrop = [...document.querySelectorAll("*")].filter((el) => {
    const value = getComputedStyle(el).backdropFilter || getComputedStyle(el).webkitBackdropFilter;
    return value && value !== "none";
  });
  // FR-057: tracking is what breaks Persian joining, so measure what is applied, not
  // what a stylesheet says — inline styles, utilities and classes all land here.
  const tracked = [];
  for (const el of document.querySelectorAll("body *")) {
    if (!el.textContent || !PERSIAN.test(el.textContent)) continue;
    if (el.children.length) continue; // measure the leaf that actually renders the text
    const style = getComputedStyle(el);
    const spacing = style.letterSpacing;
    if (!spacing || spacing === "normal" || spacing === "0px") continue;
    const px = parseFloat(spacing);
    if (!Number.isFinite(px) || px === 0) continue;
    tracked.push({
      text: el.textContent.trim().slice(0, 28),
      spacing,
      tag: el.tagName.toLowerCase(),
      cls: String(el.className).slice(0, 40),
    });
  }
  const at = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    return Math.round(el.getBoundingClientRect().top + window.scrollY);
  };
  const firstY = (predicate) => {
    for (const el of document.querySelectorAll("body *")) {
      if (predicate(el)) return Math.round(el.getBoundingClientRect().top + window.scrollY);
    }
    return null;
  };
  const bodyBefore = getComputedStyle(document.body, "::before");
  return {
    docHeight: document.documentElement.scrollHeight,
    viewportHeight: innerHeight,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1
      ? `${document.documentElement.scrollWidth}>${innerWidth}`
      : null,
    sections: [...document.querySelectorAll("section")].map((s) => s.id || s.className.split(" ")[0] || "section").slice(0, 30),
    productCards: count('a[href^="/shop/"]'),
    decoration: {
      shinyEdge: count(".shiny-edge"),
      gradText: count(".grad"),
      starfield: count(".noir-stars, .noir-stars i"),
      blur3xl: count('[class*="blur-3xl"]'),
      blur2xl: count('[class*="blur-2xl"]'),
      beam: count(".beam"),
      glow: count(".glow, .cat-corner-glow"),
      backdropElements: backdrop.length,
      backdropSample: backdrop.slice(0, 4).map((el) => String(el.className).split(" ").slice(0, 2).join(".")),
      bodyBeforeImage: bodyBefore.backgroundImage === "none" ? null : bodyBefore.backgroundImage.slice(0, 40),
      ping: count('[class*="animate-ping"]'),
      textStroke: [...document.querySelectorAll("*")].filter((el) => parseFloat(getComputedStyle(el).webkitTextStrokeWidth) > 0).length,
      modernWhiteWave: document.body.innerHTML.includes("ModernWhiteWave") || count("[class*='white-wave']"),
    },
    fold: {
      // FR-014's actual test at 360×800: what is above the fold without scrolling.
      h1: at("h1"),
      heroPrimaryCta: firstY((el) => el.tagName === "A" && /مشاهده محصولات|ورود به فروشگاه|فروشگاه/.test(el.textContent ?? "") && el.closest("section, header")),
      // The first pass matched the hero's own headline, which contains «بیست سال» and
      // «مشهد» — a trust *sentence* is not the trust *row*. Scope to a trust surface.
      trustRow: (() => {
        for (const section of document.querySelectorAll("section")) {
          const id = `${section.id} ${String(section.className)}`;
          if (!/trust|store-experience|proof|why|bento|assurance/i.test(id)) continue;
          const box = section.getBoundingClientRect();
          return Math.round(box.top + window.scrollY);
        }
        return null;
      })(),
      trustTextRow: firstY((el) => /گارانتی|ضمانت/.test(el.textContent ?? "") && el.children.length === 0),
      firstProductCard: at('a[href^="/shop/"]'),
    },
    // What a shopper actually sees without moving: the honest FR-014 check, section by
    // section, rather than one element's offset.
    sectionsAboveFold: [...document.querySelectorAll("section")].map((section) => {
      const box = section.getBoundingClientRect();
      return {
        id: section.id || String(section.className).split(" ").slice(0, 2).join("."),
        top: Math.round(box.top + window.scrollY),
        height: Math.round(box.height),
        visibleWithoutScrolling: box.top < innerHeight && box.bottom > 0,
      };
    }),
    // What is actually in the first viewport, in reading order: the decisive FR-014
    // evidence is not a section's offset but the headings, actions and trust lines a
    // shopper can read without moving.
    foldContents: [...document.querySelectorAll("h1,h2,h3,a[href],button")]
      .map((el) => {
        const box = el.getBoundingClientRect();
        return { tag: el.tagName.toLowerCase(), text: (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 44), top: Math.round(box.top), visible: box.top >= 0 && box.top < innerHeight && box.width > 0 };
      })
      .filter((x) => x.visible && x.text)
      .slice(0, 14),
    persianTracked: { count: tracked.length, sample: tracked.slice(0, 8) },
  };
};

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME ?? "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
});
const manifest = { capturedAt: new Date().toISOString(), base: BASE, mode: tag ?? "current", surfaces: {} };

for (const [key, route] of SURFACES) {
  manifest.surfaces[key] = {};
  for (const { width, height } of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.setDefaultNavigationTimeout(120000);
    let status = null;
    let finalUrl = route;
    try {
      const response = await page.goto(BASE + route, { waitUntil: "commit" });
      status = response?.status() ?? null;
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(width === 360 ? 2600 : 2200);
      finalUrl = page.url().replace(BASE, "") || "/";
      const measured = await page.evaluate(MEASURE);
      const shot = `${key}@${width}${suffix}.png`;
      await page.screenshot({ path: path.join(outDir, shot), fullPage: true });
      const foldShot = `${key}@${width}${suffix}-fold.png`;
      await page.screenshot({ path: path.join(outDir, foldShot), fullPage: false });
      manifest.surfaces[key][`${width}px`] = { route, status, finalUrl, screenshot: shot, ...measured };
      const above = measured.sectionsAboveFold.filter((x) => x.visibleWithoutScrolling).map((x) => x.id);
      if (width === 360 && key === "home") {
        console.log("  home@360 in the first 800px:", measured.foldContents.map((c) => `${c.tag}«${c.text}»@${c.top}`).join(" | "));
      }
      console.log(
        `${key.padEnd(14)} ${String(width).padStart(4)} ${status ?? "-"} h=${String(measured.docHeight).padStart(6)}` +
          ` overflow=${measured.horizontalOverflow ?? "no"} tracked=${String(measured.persianTracked.count).padStart(3)}` +
          ` shiny=${measured.decoration.shinyEdge} grad=${measured.decoration.gradText} blurEl=${measured.decoration.backdropElements}` +
          ` trust@${measured.fold.trustRow ?? "-"} cards@${measured.fold.firstProductCard ?? "-"} aboveFold=[${above.join(",")}]`,
      );
    } catch (error) {
      manifest.surfaces[key][`${width}px`] = { route, status, finalUrl, error: String(error).split("\n")[0] };
      console.log(`${key.padEnd(14)} ${String(width).padStart(4)} FAILED ${String(error).split("\n")[0]}`);
    }
    await page.close();
  }
}

fs.writeFileSync(path.join(outDir, `manifest${suffix}.json`), JSON.stringify(manifest, null, 1) + "\n");
console.log(`\nmanifest${suffix}.json written to ${outDir}`);
await browser.close();
