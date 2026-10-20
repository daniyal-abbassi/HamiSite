// 039 T004 — capture paired public-route samples under the frozen profile.
//
// Route set, viewport, throttling and cache policy come from
// specs/039-storefront-performance/evidence/manifest.json and
// specs/039-storefront-performance/contracts/performance-validation.md.
//
// Content-ready time is navigation start -> the route's *real* content becoming
// visibly usable, measured in-page (not a placeholder, not a skeleton, not a
// missing image). LCP and CLS are recorded separately because the principal
// content is not always the largest painted element.
//
// Usage:
//   node specs/039-storefront-performance/verification/capture-public.mjs --phase baseline
//   node specs/039-storefront-performance/verification/capture-public.mjs --phase baseline --samples 1 --routes home   # smoke
//
// Artifact policy (keeps evidence honest without committing 40 full-page PNGs):
//   * every sample is written to the JSON with its full timing fields
//   * mobile screenshot: first fresh sample and last returning sample per route
//   * desktop screenshot: first fresh sample per route (1280x800, for T025)
//   * trace: first fresh sample and last returning sample per route
//   Samples without their own artifact carry `artifact_policy` naming the group
//   artifact they share.
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { mkdirSync, writeFileSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";

const FEATURE = "specs/039-storefront-performance";
const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, arr) => (a.startsWith("--") ? [[a.slice(2), arr[i + 1]?.startsWith("--") ? true : arr[i + 1] ?? true]] : [])),
);
const PHASE = args.phase === "final" ? "final" : "baseline";
const SAMPLES = Number(args.samples ?? 5);
const ONLY = args.routes ? String(args.routes).split(",") : null;
const BASE = "http://127.0.0.1:3000";
const OUTDIR = args.outdir ? String(args.outdir) : `${FEATURE}/evidence/${PHASE}`;
const TRACEDIR = join(OUTDIR, "traces");
mkdirSync(OUTDIR, { recursive: true });
mkdirSync(TRACEDIR, { recursive: true });

// Frozen route samples — manifest.json §routes.
const ROUTES = [
  {
    key: "home",
    url: `${BASE}/`,
    kind: "productCard",
    principal_content_selector: "article.product-card (first visible home rail card)",
    usable_condition: "a real product card is visible with a loaded principal image and rendered Toman price",
  },
  {
    key: "shop",
    url: `${BASE}/shop`,
    kind: "productCard",
    principal_content_selector: ".shop-product-grid article.product-card",
    usable_condition: "a real product card is visible with a loaded principal image and rendered Toman price",
  },
  {
    key: "category",
    url: `${BASE}/categories/${encodeURIComponent("تجهیزات-کامپیوتر-و-لبتاب")}`,
    kind: "productCard",
    principal_content_selector: "category listing article.product-card",
    usable_condition: "a real product card is visible with a loaded principal image and rendered Toman price",
    frozen_ids: { category_id: 318, slug: "تجهیزات-کامپیوتر-و-لبتاب", main_product_count: 4 },
  },
  {
    key: "product",
    url: `${BASE}/shop/${encodeURIComponent("گوشی-موبایل-شیائومی-مدل-poco-x7-pro-دو-سیم-کارت-ظرفیت-512-گیگابایت-و-رم-12-گیگابایت-گلوبال")}`,
    kind: "productDetail",
    principal_content_selector: "ProductGallery principal image + h1 title + TomanPrice block",
    usable_condition: "principal image loaded (naturalWidth>0), title and price text visible",
    frozen_ids: { product_id: 1832, variants: 3, images: 6 },
  },
];

const PROFILE = {
  profile_id: "prof-mobile-4x-2026-10-15",
  viewport: { width: 390, height: 844, device_scale_factor: 3 },
  desktop_visual_viewport: { width: 1280, height: 800, device_scale_factor: 1 },
  cpu_slowdown: 4,
  network: { download_kbps: 1600, upload_kbps: 750, latency_ms: 150 },
  browser_cache_policy: "fresh = new context (empty HTTP cache); returning = same context, cache warm, same session",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Machine contention is recorded per sample: this box runs the owner's desktop
// apps, and an un-noted load spike is indistinguishable from a slow build.
const loadavg = () => {
  const [one, five] = readFileSync("/proc/loadavg", "utf8").split(" ");
  return { load_1m: +one, load_5m: +five };
};
const clsFromShifts = (shifts) => {
  let max = 0, cur = 0, firstT = 0, lastT = 0;
  for (const s of [...shifts].sort((a, b) => a.t - b.t)) {
    if (cur === 0 || s.t - lastT > 1000 || s.t - firstT > 5000) { cur = s.v; firstT = s.t; }
    else cur += s.v;
    lastT = s.t;
    if (cur > max) max = cur;
  }
  return max;
};

// In-page probe: LCP + CLS observers, and the content-ready predicate for this
// route kind. Real content means a product card with a loaded image and a
// rendered Toman price — the skeleton grid (aria-busy) can never satisfy it.
const INIT = (kind) => {
  window.__perf = { ready: null, lcp: null, shifts: [], errors: [] };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };
  const predicate = () => {
    if (kind === "productDetail") {
      const h1 = document.querySelector("h1");
      const price = [...document.querySelectorAll(".toman-price")].some(
        (e) => visible(e) && /تومان/.test(e.textContent || ""),
      );
      const imgs = [...document.querySelectorAll("img")].filter(
        (i) => visible(i) && i.naturalWidth > 0 && (i.currentSrc || i.src || "").length > 0,
      );
      const big = imgs.sort(
        (a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight,
      )[0];
      return !!(h1 && price && big && big.naturalWidth >= 200);
    }
    const cards = [...document.querySelectorAll("article.product-card")].filter(visible);
    return cards.some((c) => {
      const img = c.querySelector("img");
      const price = c.querySelector(".toman-price");
      return img && img.naturalWidth > 0 && price && /تومان/.test(price.textContent || "");
    });
  };
  let done = false, last = 0;
  const check = () => {
    if (done) return;
    const now = performance.now();
    if (now - last >= 40) {
      last = now;
      if (predicate()) {
        done = true;
        window.__perf.ready = now;
        return;
      }
    }
    requestAnimationFrame(check);
  };
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__perf.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (!e.hadRecentInput) window.__perf.shifts.push({ t: e.startTime, v: e.value });
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch {}
  window.addEventListener("error", (e) => window.__perf.errors.push(String(e.message).slice(0, 200)), true);
  window.addEventListener("unhandledrejection", (e) => window.__perf.errors.push(`unhandled: ${String(e.reason).slice(0, 120)}`));
  requestAnimationFrame(check);
};

const browserEnv = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => !/^(http|https|ftp|all|no)_proxy$/i.test(k)),
);
const browser = await chromium.launch({
  channel: "chrome", headless: true, env: browserEnv, args: ["--no-proxy-server", "--disable-dev-shm-usage"],
});

async function applyProfile(cdp, { network = true, cpu = true } = {}) {
  await cdp.send("Network.enable");
  if (cpu) await cdp.send("Emulation.setCPUThrottlingRate", { rate: PROFILE.cpu_slowdown });
  if (network) {
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: PROFILE.network.latency_ms,
      downloadThroughput: (PROFILE.network.download_kbps * 1024) / 8,
      uploadThroughput: PROFILE.network.upload_kbps * 1024 / 8,
      connectionType: "cellular4g",
    });
  }
}

// ---------------------------------------------------------------- smoke mode
if (args.smoke) {
  const results = [];
  for (const route of ROUTES) {
    const ctx = await browser.newContext({ viewport: PROFILE.viewport, deviceScaleFactor: 3 });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await applyProfile(cdp);
    await page.addInitScript(INIT, route.kind);
    const t0 = Date.now();
    await page.goto(route.url, { waitUntil: "domcontentloaded" });
    let ready = null;
    try {
      await page.waitForFunction(() => window.__perf && window.__perf.ready !== null, null, { timeout: 45000 });
      ready = await page.evaluate(() => window.__perf.ready);
    } catch { ready = null; }
    const detail = await page.evaluate(() => ({
      cards: document.querySelectorAll("article.product-card").length,
      visibleCards: [...document.querySelectorAll("article.product-card")].filter(
        (c) => c.getBoundingClientRect().width > 0).length,
      loadedImgs: [...document.querySelectorAll("img")].filter((i) => i.naturalWidth > 0).length,
      h1: document.querySelector("h1")?.textContent?.slice(0, 40) ?? null,
      prices: document.querySelectorAll(".toman-price").length,
    }));
    results.push({ route: route.key, content_ready_ms: ready == null ? null : Math.round(ready), wall_ms: Date.now() - t0, detail });
    console.log(JSON.stringify(results.at(-1), null, 1));
    await ctx.close();
  }
  await browser.close();
  process.exit(results.every((r) => r.content_ready_ms != null) ? 0 : 1);
}

// --------------------------------------------------------------- sample pass
const samples = [];
const routeList = ONLY ? ROUTES.filter((r) => ONLY.includes(r.key)) : ROUTES;

async function capture(route, { ctx, page, cdp, visit, rep, withArtifacts, net }) {
  // The init script and CDP listeners are registered ONCE per page by the caller.
  // Registering them per repetition would stack N observers, and every layout-shift
  // observer pushes into the same array — that inflated returning CLS by exactly
  // rep-count (1x..5x) before this fix. Only the per-sample buffers are reset here.
  const { finished, failed } = net;
  finished.clear();
  failed.length = 0;

  const t0 = Date.now();
  await page.goto(route.url, { waitUntil: "domcontentloaded" });
  let ready = null, timedOut = false;
  try {
    await page.waitForFunction(() => window.__perf && window.__perf.ready !== null, null, { timeout: 45000 });
    ready = await page.evaluate(() => window.__perf.ready);
  } catch {
    timedOut = true;
  }
  // let CLS/LCP settle after the content is usable (contract: end observation
  // once visible content has settled)
  await sleep(1200);
  const perf = await page.evaluate(() => ({
    lcp: window.__perf.lcp,
    shifts: window.__perf.shifts,
    errors: window.__perf.errors,
  }));
  const finalPath = new URL(page.url()).pathname;
  const expectedPath = new URL(route.url).pathname;
  const landedWrong = decodeURIComponent(finalPath) !== decodeURIComponent(expectedPath);

  const id = `${route.key}-${visit}-r${rep}`;
  const shot = join(OUTDIR, `${id}.png`);
  let shotPath = null;
  if (withArtifacts.shot) {
    await page.screenshot({ path: shot });
    shotPath = shot;
  }
  let tracePath = null;
  if (withArtifacts.trace) {
    tracePath = join(TRACEDIR, `${id}.zip`);
    await ctx.tracing.stop({ path: tracePath });
  }

  const invalid = timedOut || landedWrong;
  samples.push({
    sample_id: id,
    profile_id: PROFILE.profile_id,
    route_key: route.key,
    exact_url: route.url,
    access: "public",
    visit_state: visit,
    repetition: rep,
    principal_content_selector: route.principal_content_selector,
    usable_condition: route.usable_condition,
    content_ready_ms: ready == null ? null : Math.round(ready),
    lcp_ms: perf.lcp == null ? null : Math.round(perf.lcp),
    cls: +clsFromShifts(perf.shifts).toFixed(4),
    wall_ms: Date.now() - t0,
    request_failures: failed,
    transfer_bytes_total: [...finished.values()].reduce((a, b) => a + b, 0),
    in_page_errors: perf.errors,
    trace_path: tracePath,
    screenshot_path: shotPath,
    verification_status: invalid ? "invalid" : "valid",
    limitation_reason: timedOut
      ? "content-ready predicate did not become true within 45s"
      : landedWrong
        ? `navigated to ${finalPath}, expected ${expectedPath}`
        : null,
    artifact_policy: shotPath || tracePath ? null : "shares the group artifact: mobile screenshot + trace on the first fresh and last returning sample of this route",
    machine_load: loadavg(),
    captured_at: new Date().toISOString(),
  });
  console.log(`  ${id}: content=${ready == null ? "TIMEOUT" : Math.round(ready)}ms lcp=${perf.lcp == null ? "-" : Math.round(perf.lcp)}ms cls=${clsFromShifts(perf.shifts).toFixed(3)} bytes=${[...finished.values()].reduce((a, b) => a + b, 0)}${invalid ? " INVALID" : ""}`);
}

// One init script + one pair of network listeners per page. The maps are cleared
// per sample by capture().
async function preparePage(page, cdp, kind) {
  await page.addInitScript(INIT, kind);
  const net = { finished: new Map(), failed: [] };
  cdp.on("Network.loadingFinished", (e) => net.finished.set(e.requestId, e.encodedDataLength));
  cdp.on("Network.loadingFailed", (e) => net.failed.push({ requestId: e.requestId, error: e.errorText, blocked: e.blockedReason ?? null }));
  return net;
}

// warm-up per the manifest's warm-state policy: one throwaway visit per route
// before the first counted sample, so route caches are at the same maturity in
// baseline and final.
console.log("warm-up (not counted)");
for (const route of routeList) {
  const ctx = await browser.newContext({ viewport: PROFILE.viewport, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.goto(route.url, { waitUntil: "load" }).catch(() => {});
  console.log(`  warmed ${route.key}`);
  await ctx.close();
}

for (const route of routeList) {
  console.log(`${route.key}: fresh`);
  for (let rep = 1; rep <= SAMPLES; rep++) {
    const ctx = await browser.newContext({ viewport: PROFILE.viewport, deviceScaleFactor: 3 });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await applyProfile(cdp);
    const net = await preparePage(page, cdp, route.kind);
    if (rep === 1) await ctx.tracing.start({ screenshots: true, snapshots: false });
    await capture(route, { ctx, page, cdp, visit: "fresh", rep, withArtifacts: { shot: rep === 1, trace: rep === 1 }, net });
    await ctx.close();
    await sleep(1500); // serialize: one measurement stream at a time
  }

  console.log(`${route.key}: returning (cache warm, same session)`);
  const ctx = await browser.newContext({ viewport: PROFILE.viewport, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await applyProfile(cdp);
  const net = await preparePage(page, cdp, route.kind);
  await page.goto(route.url, { waitUntil: "load" }).catch(() => {}); // warm the HTTP cache, not counted
  for (let rep = 1; rep <= SAMPLES; rep++) {
    if (rep === SAMPLES) await ctx.tracing.start({ screenshots: true, snapshots: false });
    await capture(route, { ctx, page, cdp, visit: "returning", rep, withArtifacts: { shot: rep === SAMPLES, trace: rep === SAMPLES }, net });
    await sleep(1500);
  }
  await ctx.close();
}

// desktop visual pass (1280x800, no CPU/network judgement applied to timing)
console.log("desktop visual captures");
for (const route of routeList) {
  const ctx = await browser.newContext({ viewport: PROFILE.desktop_visual_viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(route.url, { waitUntil: "load" }).catch(() => {});
  await sleep(1500);
  const p = join(OUTDIR, `${route.key}-desktop-1280.png`);
  await page.screenshot({ path: p });
  console.log(`  ${p} (${statSync(p).size} bytes)`);
  await ctx.close();
}

await browser.close();

const out = {
  phase: PHASE,
  profile: PROFILE,
  base_url: BASE,
  server_build_id: (await import("node:fs")).readFileSync(".next/BUILD_ID", "utf8").trim(),
  captured_at: new Date().toISOString(),
  git_head: (await import("node:child_process")).execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
  samples_expected: routeList.length * SAMPLES * 2,
  samples,
};
const outFile = args.out ? String(args.out) : `${FEATURE}/evidence/${PHASE}-public.json`;
writeFileSync(outFile, JSON.stringify(out, null, 2));
const valid = samples.filter((s) => s.verification_status === "valid");
console.log(`\nwrote ${outFile}: ${valid.length}/${samples.length} valid`);
