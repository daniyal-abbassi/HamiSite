// 039 T007 — decompose one route's content-ready time into milestones and bytes.
//
// Answers the question a single number cannot: is a slow route late because the
// card markup arrives late (server/streaming), because the principal image is
// still in flight (image delivery), or because nothing is interactive yet
// (client work)? Records when the card DOM appears, when a real price renders,
// when the first principal image decodes, and which requests actually preceded
// content-ready. Read-only: it measures, it never patches.
//
// Usage:
//   node specs/039-storefront-performance/verification/diagnose-route.mjs --route home --visit fresh --reps 3
//   node specs/039-storefront-performance/verification/diagnose-route.mjs --route home --visit returning --reps 3
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { mkdirSync, writeFileSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, arr) => (a.startsWith("--") ? [[a.slice(2), arr[i + 1]?.startsWith("--") ? true : arr[i + 1] ?? true]] : [])),
);
const ROUTE = String(args.route ?? "home");
const VISIT = args.visit === "returning" ? "returning" : "fresh";
const REPS = Number(args.reps ?? 3);
const BASE = "http://127.0.0.1:3000";
const URLs = {
  home: `${BASE}/`,
  shop: `${BASE}/shop`,
  category: `${BASE}/categories/${encodeURIComponent("تجهیزات-کامپیوتر-و-لبتاب")}`,
  product: `${BASE}/shop/${encodeURIComponent("گوشی-موبایل-شیائومی-مدل-poco-x7-pro-دو-سیم-کارت-ظرفیت-512-گیگابایت-و-رم-12-گیگابایت-گلوبال")}`,
};
const KIND = ROUTE === "product" ? "productDetail" : "productCard";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync("/tmp/opencode/diag", { recursive: true });

const MILESTONES = (kind) => {
  window.__m = { card_dom: null, price_text: null, image_decoded: null, dcl: null, load: null, hydration_proxy: null };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };
  const cards = () => [...document.querySelectorAll("article.product-card")].filter(visible);
  const hasPrice = () => cards().some((c) => {
    const p = c.querySelector(".toman-price");
    return p && /تومان/.test(p.textContent || "");
  });
  const imgLoaded = () => {
    if (kind === "productDetail") {
      const imgs = [...document.querySelectorAll("img")].filter((i) => visible(i) && i.naturalWidth > 0);
      return imgs.some((i) => i.naturalWidth >= 200);
    }
    return cards().some((c) => {
      const img = c.querySelector("img");
      return img && img.naturalWidth > 0;
    });
  };
  let last = 0;
  const tick = () => {
    const now = performance.now();
    if (now - last >= 30) {
      last = now;
      if (window.__m.card_dom == null && (kind === "productDetail" ? document.querySelector("h1") : cards().length)) window.__m.card_dom = now;
      if (window.__m.price_text == null && hasPrice()) window.__m.price_text = now;
      if (window.__m.image_decoded == null && imgLoaded()) window.__m.image_decoded = now;
    }
    if (window.__m.image_decoded == null || window.__m.price_text == null || window.__m.card_dom == null) requestAnimationFrame(tick);
  };
  document.addEventListener("DOMContentLoaded", () => { window.__m.dcl = performance.now(); });
  window.addEventListener("load", () => { window.__m.load = performance.now(); });
  requestAnimationFrame(tick);
  // Interactivity probe: the header cart button only responds once React has
  // attached, but a single click before attachment proves nothing. Retry until
  // the drawer actually opens, and record when it first worked.
  let tries = 0;
  const probe = () => {
    const btn = document.querySelector('button[aria-label="سبد خرید"]');
    if (!btn) return retry();
    const t = performance.now();
    btn.click();
    requestAnimationFrame(() => {
      const dialog = document.querySelector('dialog[aria-label="سبد خرید"]');
      if (dialog) {
        window.__m.hydration_proxy = t;
        document.querySelector('button[aria-label="بستن سبد خرید"]')?.click();
      } else retry();
    });
  };
  const retry = () => {
    if (window.__m.hydration_proxy != null || ++tries > 60) return;
    setTimeout(probe, 250);
  };
  setTimeout(probe, 400);
  // hydration proxy: the header cart button only responds once React has attached.
  // Detected by dispatching a benign click and seeing whether state changes.
  setTimeout(() => {
    const btn = document.querySelector('button[aria-label="سبد خرید"]');
    if (!btn) return;
    const t = performance.now();
    btn.click();
    requestAnimationFrame(() => {
      const open = !!document.querySelector('dialog[aria-label="سبد خرید"]');
      window.__m.hydration_proxy = open ? t : null;
      if (open) document.querySelector('button[aria-label="بستن سبد خرید"]')?.click();
    });
  }, 0);
};

const browserEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(http|https|ftp|all|no)_proxy$/i.test(k)));
const browser = await chromium.launch({ channel: "chrome", headless: true, env: browserEnv, args: ["--no-proxy-server", "--disable-dev-shm-usage"] });

async function profile(cdp) {
  await cdp.send("Network.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false, latency: 150, downloadThroughput: (1600 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
  });
}

async function makeCtx() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await profile(cdp);
  return { ctx, page, cdp };
}

const runs = [];
let warm = { ctx: null, page: null, cdp: null };
if (VISIT === "returning") {
  warm = await makeCtx();
  await warm.page.goto(URLs[ROUTE], { waitUntil: "load" }).catch(() => {});
}

for (let rep = 1; rep <= REPS; rep++) {
  let ctx, page, cdp;
  if (VISIT === "returning") ({ ctx, page, cdp } = warm);
  else ({ ctx, page, cdp } = await makeCtx());

  const reqs = new Map();
  const t0 = Date.now();
  cdp.on("Network.requestWillBeSent", (e) => reqs.set(e.requestId, { url: e.request.url, type: e.type, start: e.wallTime * 1000, bytes: 0, end: null }));
  cdp.on("Network.loadingFinished", (e) => {
    const r = reqs.get(e.requestId);
    if (r) { r.bytes = e.encodedDataLength; r.end = Date.now(); }
  });
  const navStart = Date.now();
  await page.addInitScript(MILESTONES, KIND);
  await page.goto(URLs[ROUTE], { waitUntil: "domcontentloaded" });
  let ready = null;
  await page.waitForFunction(() => window.__m && window.__m.image_decoded !== null, null, { timeout: 45000 }).catch(() => {});
  ready = await page.evaluate(() => window.__m.image_decoded);
  await sleep(1500);
  const m = await page.evaluate(() => window.__m);
  // Server vs transfer: the Document's own resource timing separates time to
  // first byte (server render) from download, which a total cannot.
  const doc = await page.evaluate(() => {
    const e = performance.getEntriesByType("navigation")[0];
    const d = performance.getEntriesByType("resource").find((r) => r.initiatorType === "navigation");
    const source = e ?? d;
    return source
      ? {
          ttfb_ms: Math.round(source.responseStart - source.requestStart),
          download_ms: Math.round(source.responseEnd - source.responseStart),
          response_end_ms: Math.round(source.responseEnd),
          dom_interactive_ms: source.domInteractive ? Math.round(source.domInteractive) : null,
          transfer_kb: Math.round((source.transferSize ?? 0) / 1024),
        }
      : null;
  });
  const perf = await page.evaluate(() => ({
    resource_entries: performance.getEntriesByType("resource").length,
    resources: performance.getEntriesByType("resource").map((e) => ({ name: e.name, type: e.initiatorType, transfer: e.transferSize, decoded: e.decodedBodySize, dur: e.duration, end: e.responseEnd })).slice(0, 400),
  }));

  // Only requests that completed before content-ready can have delayed it.
  const before = [...reqs.values()].filter((r) => r.end && ready != null && r.end - navStart <= ready);
  const byBytes = [...before].sort((a, b) => b.bytes - a.bytes).slice(0, 8).map((r) => ({ url: r.url.replace(BASE, "").slice(0, 90), type: r.type, kb: Math.round(r.bytes / 1024) }));
  const imgReqs = before.filter((r) => r.type === "Image" || /\.(png|jpe?g|webp|avif|svg)(\?|$)/i.test(r.url) || r.url.includes("/_next/image"));
  const nextImage = before.filter((r) => r.url.includes("/_next/image")).length;
  const jsReqs = before.filter((r) => r.type === "Script" || /\.js(\?|$)/.test(r.url));

  runs.push({
    rep,
    content_ready_ms: ready == null ? null : Math.round(ready),
    milestones: {
      card_dom_ms: m.card_dom == null ? null : Math.round(m.card_dom),
      price_text_ms: m.price_text == null ? null : Math.round(m.price_text),
      image_decoded_ms: m.image_decoded == null ? null : Math.round(m.image_decoded),
      dcl_ms: m.dcl == null ? null : Math.round(m.dcl),
      load_ms: m.load == null ? null : Math.round(m.load),
      hydration_proxy_ms: m.hydration_proxy == null ? null : Math.round(m.hydration_proxy),
    },
    bytes_before_ready: {
      total_kb: Math.round(before.reduce((a, r) => a + r.bytes, 0) / 1024),
      requests: before.length,
      image_kb: Math.round(imgReqs.reduce((a, r) => a + r.bytes, 0) / 1024),
      image_requests: imgReqs.length,
      next_image_requests: nextImage,
      js_kb: Math.round(jsReqs.reduce((a, r) => a + r.bytes, 0) / 1024),
      js_requests: jsReqs.length,
    },
    latest_requests_before_ready: [...before].sort((a, b) => b.end - a.end).slice(0, 5).map((r) => ({ url: r.url.replace(BASE, "").slice(0, 80), type: r.type, finished_at_ms: r.end - navStart, kb: Math.round(r.bytes / 1024) })),
    largest_requests_before_ready: byBytes,
    resource_entries_in_page: perf.resource_entries,
    document: doc,
    wall_ms: Date.now() - t0,
  });
  console.log(JSON.stringify(runs.at(-1), null, 1));
  if (VISIT === "fresh") await ctx.close();
  await sleep(1200);
}
if (warm.ctx) await warm.ctx.close();
await browser.close();
const out = { route: ROUTE, visit: VISIT, reps: REPS, captured_at: new Date().toISOString(), runs };
writeFileSync(`/tmp/opencode/diag/${ROUTE}-${VISIT}.json`, JSON.stringify(out, null, 2));
