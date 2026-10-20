// 039 T003 — verify the browser measurement capabilities the performance contract
// requires BEFORE any baseline capture, and record what is unsupported.
//
// Checks: fixed viewport/DSF framing, 4x CPU slowdown, 1.6Mbps/750Kbps/150ms network
// throttling (applied, not merely requested), screenshot export at 390/1280, trace
// export (CDP raw + Playwright zip), and real interactivity (hydration) after the
// production server start.
//
// Usage: node specs/039-storefront-performance/verification/probe-capabilities.mjs
// Writes: /tmp/opencode/probe-039/ (raw artifacts) + evidence/probe-*.png (size views)
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const OUT = "/tmp/opencode/probe-039";
const EVIDENCE = "specs/039-storefront-performance/evidence";
mkdirSync(OUT, { recursive: true });

// Largest built chunk on disk — a real same-origin asset big enough that 1.6 Mbps
// produces a multi-second transfer, so throttle effectiveness is measurable.
const chunkDir = ".next/static/chunks";
const biggest = readdirSync(chunkDir)
  .filter((f) => f.endsWith(".js"))
  .map((f) => ({ f, size: statSync(join(chunkDir, f)).size }))
  .sort((a, b) => b.size - a.size)[0];
const CHUNK_URL = `/_next/static/chunks/${biggest.f}`;

const pngSize = (buf) => ({ width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) });
const results = {};

// The machine exports http_proxy/https_proxy/all_proxy -> 127.0.0.1:10808, which
// Chromium honours for localhost too and which would poison every timing. Strip them
// for the browser process and force direct connections.
const browserEnv = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => !/^(http|https|ftp|all|no)_proxy$/i.test(k)),
);
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  env: browserEnv,
  args: ["--no-proxy-server", "--disable-dev-shm-usage"],
});
results.browser = { version: browser.version(), channel: "chrome", headless: true };

async function newPage(width, height, dsf) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dsf,
    reducedMotion: "no-preference",
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  return { ctx, page, cdp };
}

// ---------------------------------------------------------------- A. framing
{
  const { ctx, page, cdp } = await newPage(390, 844, 3);
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  results.framing = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    dpr: window.devicePixelRatio,
    scrollbarGutter: window.innerWidth - document.documentElement.clientWidth,
  }));
  results.framing.requested = { width: 390, height: 844, dsf: 3 };

  // ------------------------------------------------------------ B. CPU slowdown
  // A fixed, deterministic workload run unthrottled and at rate 4. If throttling is
  // genuinely applied the same work takes ~4x longer.
  const workload = () => {
    const t0 = performance.now();
    let acc = 0;
    for (let i = 0; i < 3_000_000; i++) acc += Math.sqrt(i) % 7;
    return { ms: performance.now() - t0, acc: Math.round(acc) };
  };
  const warm = await page.evaluate(workload);
  const free = await page.evaluate(workload);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const slow = await page.evaluate(workload);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  results.cpuSlowdown = {
    requested: 4,
    workload_ms_unthrottled: +free.ms.toFixed(1),
    workload_ms_at_4x: +slow.ms.toFixed(1),
    observed_ratio: +(slow.ms / free.ms).toFixed(2),
    same_result: (warm.acc === free.acc && free.acc === slow.acc),
  };

  // ------------------------------------------------------- C. network throttling
  const dl = 1600, ul = 750, latency = 150; // kbps, kbps, ms (contract §Timing protocol)
  const bytesPerSec = (kb) => (kb * 1024) / 8;
  // Wire bytes come from CDP Network.loadingFinished.encodedDataLength rather than
  // resource timing: the server gzips these chunks, so decoded byte counts overstate
  // transfer ~3.5x, and resource entries proved unreliable to read immediately.
  const netLog = new Map();
  let wire = [];
  cdp.on("Network.requestWillBeSent", (e) => netLog.set(e.requestId, e.request.url));
  cdp.on("Network.loadingFinished", (e) => {
    const url = netLog.get(e.requestId);
    if (url) wire.push({ url, bytes: e.encodedDataLength });
  });
  const measureFetch = (url) =>
    page.evaluate(async (u) => {
      const full = `${u}?probe=${Math.random()}`;
      const t0 = performance.now();
      const res = await fetch(full, { cache: "no-store" });
      const buf = await res.arrayBuffer();
      return {
        ms: performance.now() - t0,
        decoded_bytes: buf.byteLength,
        status: res.status,
        content_encoding: res.headers.get("content-encoding"),
      };
    }, url);

  const measureWire = async (url, fragment) => {
    wire = []; // reset BEFORE the request; loadingFinished fires while it is in flight
    const r = await measureFetch(url);
    await page.waitForTimeout(250);
    return {
      ...r,
      wire_bytes: wire.filter((w) => w.url.includes(fragment)).reduce((n, w) => n + w.bytes, 0),
    };
  };
  const SMALL = "/_next/static/chunks/webpack-3d1de3020ae597f1.js";

  await cdp.send("Network.enable");
  const freeBig = await measureWire(CHUNK_URL, "dc07ed8c");
  const freeSmall = await measureWire(SMALL, "webpack-");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency,
    downloadThroughput: bytesPerSec(dl),
    uploadThroughput: bytesPerSec(ul),
    connectionType: "cellular4g",
  });
  await page.goto(BASE, { waitUntil: "domcontentloaded" }); // conditions apply to new requests
  const slowBig = await measureWire(CHUNK_URL, "dc07ed8c");
  const slowSmall = await measureWire(SMALL, "webpack-");
  const mbps = (r) => (r.wire_bytes && r.ms ? +((r.wire_bytes * 8) / r.ms / 1000).toFixed(2) : null);
  results.networkThrottle = {
    requested: { download_kbps: dl, upload_kbps: ul, latency_ms: latency },
    asset: { url: CHUNK_URL, on_disk_bytes: biggest.size },
    wire: {
      big_unthrottled: { bytes: freeBig.wire_bytes, ms: +freeBig.ms.toFixed(0), mbps: mbps(freeBig) },
      big_throttled: { bytes: slowBig.wire_bytes, ms: +slowBig.ms.toFixed(0), mbps: mbps(slowBig) },
      small_unthrottled: { bytes: freeSmall.wire_bytes, ms: +freeSmall.ms.toFixed(0) },
      small_throttled: { bytes: slowSmall.wire_bytes, ms: +slowSmall.ms.toFixed(0) },
    },
    decoded_ms: {
      big_unthrottled: +freeBig.ms.toFixed(0),
      big_throttled: +slowBig.ms.toFixed(0),
    },
    content_encoding: slowBig.content_encoding,
    note: "wire_bytes from CDP Network.loadingFinished.encodedDataLength (gzip transfer size)",
  };

  // ------------------------------------------------------------- D. screenshots
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
  });
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  const m = await page.screenshot({ path: join(EVIDENCE, "probe-390x844.png"), fullPage: false });
  results.screenshotMobile = { path: `${EVIDENCE}/probe-390x844.png`, ...pngSize(m) };

  const { page: dp } = await newPage(1280, 800, 1);
  await dp.goto(BASE, { waitUntil: "domcontentloaded" });
  const d = await dp.screenshot({ path: join(EVIDENCE, "probe-1280x800.png"), fullPage: false });
  results.screenshotDesktop = { path: `${EVIDENCE}/probe-1280x800.png`, ...pngSize(d) };

  // ------------------------------------------------------------- E. trace export
  // E1: raw DevTools-format trace (openable in the Chrome performance panel).
  const events = [];
  cdp.on("Tracing.dataCollected", (e) => { if (e?.value) events.push(...e.value); });
  const tracingDone = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve));
  await cdp.send("Tracing.start", {
    categories: "-*,devtools.timeline,blink.user_timing,loading",
    transferMode: "ReportEvents",
  });
  await page.goto(BASE, { waitUntil: "load" });
  await cdp.send("Tracing.end");
  await tracingDone;
  const traceTxt = JSON.stringify({ traceEvents: events });
  writeFileSync(join(OUT, "trace-cdp.json"), traceTxt);
  let cdpEvents = null;
  try { cdpEvents = JSON.parse(traceTxt).traceEvents.length; } catch {}
  results.traceCdp = {
    path: `${OUT}/trace-cdp.json`,
    bytes: statSync(join(OUT, "trace-cdp.json")).size,
    parsed_events: cdpEvents,
  };

  // E2: Playwright trace zip (screenshots + snapshots + network).
  await ctx.tracing.start({ screenshots: true, snapshots: true, sources: false });
  await page.goto(`${BASE}/shop`, { waitUntil: "domcontentloaded" });
  const zipPath = join(OUT, "trace-playwright.zip");
  await ctx.tracing.stop({ path: zipPath });
  results.tracePlaywright = { path: zipPath, bytes: statSync(zipPath).size };

  // --------------------------------------------------- F. hydration / interactivity
  // A marker survives only if a later click is handled by React (client-side nav),
  // not a full document reload.
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForSelector('button[aria-label="سبد خرید"]', { timeout: 15000 });
  await page.evaluate(() => { window.__probeMarker = "set"; });
  const t0 = Date.now();
  await page.click('button[aria-label="سبد خرید"]', { timeout: 10000 });
  const drawer = await page.waitForSelector('dialog[aria-label="سبد خرید"]', { timeout: 10000 });
  const drawerMs = Date.now() - t0;
  const dialogVisible = await drawer.isVisible();
  const closeBtn = await page.$('button[aria-label="بستن سبد خرید"]');
  if (closeBtn) await closeBtn.click();
  await page.waitForSelector('dialog[aria-label="سبد خرید"]', { state: "detached", timeout: 5000 }).catch(() => {});
  results.hydration = {
    cartDrawerOpened: dialogVisible,
    open_to_visible_ms_untrottled: drawerMs,
    markerSurvived: (await page.evaluate(() => window.__probeMarker)) === "set",
    drawerClosedOnEscapeOrButton: !(await page.$('dialog[aria-label="سبد خرید"]')),
  };

  // Client-side navigation control (the same check on a link, proving the router).
  const shopLink = await page.$('a[href="/shop"]');
  if (shopLink) {
    await page.evaluate(() => { window.__probeNav = "set"; });
    await shopLink.click();
    await page.waitForURL((u) => u.pathname === "/shop", { timeout: 15000 }).catch(() => {});
    results.hydration.routerClientSide = (await page.evaluate(() => window.__probeNav)) === "set";
  }

  await ctx.close();
}

// ---------------------------------------------- G. remaining emulation controls
{
  const { ctx, page } = await newPage(390, 844, 3);
  const rctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    reducedMotion: "reduce",
  });
  const rm = await rctx.newPage();
  await rm.goto(BASE, { waitUntil: "domcontentloaded" });
  results.emulation = {
    reducedMotion_emulated:
      await rm.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches),
    reducedMotion_requested: "reduce",
    reducedMotionControl_false_in_primary_context: await page.evaluate(() =>
      matchMedia("(prefers-reduced-motion: reduce)").matches),
  };
  await rctx.close();
  await ctx.close();
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const mp = await mctx.newPage();
  await mp.goto(BASE, { waitUntil: "domcontentloaded" });
  results.emulation.mobileEmulation = await mp.evaluate(() => ({
    maxTouchPoints: navigator.maxTouchPoints,
    ontouchstart: "ontouchstart" in window,
    ua_is_mobile: /Android|iPhone|Mobile/i.test(navigator.userAgent),
  }));
  await mctx.close();
  await ctx.close();
}

writeFileSync(join(OUT, "probe-results.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
