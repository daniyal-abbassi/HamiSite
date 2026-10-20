// 039 T005 — capture authenticated cart / checkout-review / partner-bundle samples.
//
// Same frozen profile and the same RouteSample constraints as T004. The session is
// an existing seeded fixture account supplied through PERF_* environment variables.
// No account is created and no credential is written into evidence. Fresh visits
// get an empty HTTP cache but keep the session; a
// guest is never substituted for an authenticated row.
//
// Predicates assert the *designated test contents* rendered (products 1832 + 1939
// on the cart, the order-review block on checkout, real bundle cards for partners),
// so "a page loaded" cannot pass as a valid sample. Checkout stops before any
// payment initiation — no submit is ever clicked.
//
// Usage: node specs/039-storefront-performance/verification/capture-authenticated.mjs
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { mkdirSync, writeFileSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const FEATURE = "specs/039-storefront-performance";
const PHASE = process.argv.includes("--final") ? "final" : "baseline";
const SAMPLES = Number((process.argv.find((a) => a.startsWith("--samples=")) ?? "").split("=")[1] ?? 5);
const BASE = "http://127.0.0.1:3000";
const OUTDIR = (process.argv.find((a) => a.startsWith("--outdir=")) ?? "").split("=")[1] || `${FEATURE}/evidence/${PHASE}-authenticated`;
const OUT_JSON = (process.argv.find((a) => a.startsWith("--out=")) ?? "").split("=")[1] || `${FEATURE}/evidence/${PHASE}-authenticated.json`;
const TRACEDIR = join(OUTDIR, "traces");
mkdirSync(OUTDIR, { recursive: true });
mkdirSync(TRACEDIR, { recursive: true });

// Seeded fixtures, verified to log in. Recorded as aliases, never as secrets.
const SESSIONS = {
  "alias-customer-A": { identifier: process.env.PERF_RETAIL_IDENTIFIER, password: process.env.PERF_RETAIL_PASSWORD, role: "RETAIL" },
  "alias-partner-A": { identifier: process.env.PERF_PARTNER_IDENTIFIER, password: process.env.PERF_PARTNER_PASSWORD, role: "WHOLESALE" },
};
if (Object.values(SESSIONS).some(({ identifier, password }) => !identifier || !password)) {
  throw new Error("Authenticated capture requires PERF_RETAIL_IDENTIFIER, PERF_RETAIL_PASSWORD, PERF_PARTNER_IDENTIFIER and PERF_PARTNER_PASSWORD.");
}

const ROUTES = [
  {
    key: "cart",
    url: `${BASE}/cart`,
    kind: "cart",
    session: "alias-customer-A",
    principal_content_selector: "CartPageClient item list with designated test lines + totals",
    usable_condition: "both designated test products visible with quantity controls and Toman totals",
    frozen_ids: { cart_items: "18 (product 1832 @115,000,000), 19 (product 1939 @3,500,000)", subtotal_toman: 118500000 },
  },
  {
    key: "checkout",
    url: `${BASE}/checkout`,
    kind: "checkout",
    session: "alias-customer-A",
    principal_content_selector: "CheckoutClient order review totals + shipping selection",
    usable_condition: "order-review block with totals and shipping radios visible; no payment initiated",
    frozen_ids: { same_cart_as: "cart", stop_before: "payment initiation" },
  },
  {
    key: "partner",
    url: `${BASE}/partners/bundles`,
    kind: "partner",
    session: "alias-partner-A",
    principal_content_selector: "PartnerBundleCard articles in the bundles grid",
    usable_condition: "≥1 real bundle card visible with title and Toman price (authenticated view, not the sign-in card)",
    frozen_ids: { bundle_ids: [1, 2], listed_price_toman: 195264000 },
  },
];

const PROFILE = {
  profile_id: "prof-mobile-4x-2026-10-15",
  viewport: { width: 390, height: 844, device_scale_factor: 3 },
  desktop_visual_viewport: { width: 1280, height: 800, device_scale_factor: 1 },
  cpu_slowdown: 4,
  network: { download_kbps: 1600, upload_kbps: 750, latency_ms: 150 },
  browser_cache_policy: "fresh = new context (empty HTTP cache) + reused session state; returning = same context, cache warm, same session",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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

const INIT = (kind) => {
  window.__perf = { ready: null, lcp: null, shifts: [], errors: [] };
  const visible = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0";
  };
  const text = (el) => el?.textContent ?? "";
  const hasToman = (root) =>
    [...root.querySelectorAll(".toman-price")].some((e) => visible(e) && /تومان/.test(text(e)));
  // Amounts are compared as integers, not strings: the UI renders Persian digits
  // with U+066C separators, which must not be spelled out in the predicate.
  const toEnDigits = (s) => s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[^\d]/g, "");
  const amounts = () =>
    [...document.querySelectorAll(".toman-price")].filter(visible).map((e) => toEnDigits(text(e)));
  const CART_SUBTOTAL = "118500000"; // frozen designated contents, see manifest
  const CART_LINES = ["115000000", "3500000"];
  const predicate = () => {
    const body = text(document.body);
    const amts = amounts();
    if (kind === "cart") {
      const qty = [...document.querySelectorAll('button[aria-label="افزایش تعداد"]')].some(visible);
      const lines = body.includes("Poco") && body.includes("نوکیا");
      // The subtotal proves the *designated* contents rendered, not just any cart.
      const subtotal = amts.includes(CART_SUBTOTAL);
      return qty && lines && subtotal && CART_LINES.every((a) => amts.includes(a));
    }
    if (kind === "checkout") {
      const review = [...document.querySelectorAll("h2")].some((h) => visible(h) && text(h).includes("سفارش شما"));
      const shipping = [...document.querySelectorAll('input[name="shipping"]')].some(visible);
      const address = [...document.querySelectorAll("h2")].some((h) => visible(h) && text(h).includes("اطلاعات تماس"));
      return review && shipping && address && hasToman(document) && amts.includes(CART_SUBTOTAL);
    }
    // partner: real bundle cards, never the sign-in/forbidden card
    const cards = [...document.querySelectorAll("article")].filter(visible);
    const real = cards.filter((c) => c.querySelector("h3") && text(c.querySelector("h3")).trim().length > 3 && hasToman(c));
    return real.length >= 1;
  };
  const evidence = () => {
    const cards = [...document.querySelectorAll("article")].filter(visible);
    return {
      amounts_seen: amounts(),
      bundle_cards_visible: cards.filter((c) => c.querySelector("h3")).length,
      cart_lines_seen: ["Poco", "نوکیا"].filter((n) => text(document.body).includes(n)),
    };
  };
  let done = false, last = 0;
  window.__perf.evidenceNow = evidence; // so a timeout still records what was on screen
  const check = () => {
    if (done) return;
    const now = performance.now();
    if (now - last >= 40) {
      last = now;
      if (predicate()) { done = true; window.__perf.ready = now; window.__perf.evidence = evidence(); return; }
    }
    requestAnimationFrame(check);
  };
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.lcp = e.startTime; })
      .observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.shifts.push({ t: e.startTime, v: e.value });
    }).observe({ type: "layout-shift", buffered: true });
  } catch {}
  window.addEventListener("error", (e) => window.__perf.errors.push(String(e.message).slice(0, 200)), true);
  requestAnimationFrame(check);
};

const browserEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(http|https|ftp|all|no)_proxy$/i.test(k)));
const browser = await chromium.launch({ channel: "chrome", headless: true, env: browserEnv, args: ["--no-proxy-server", "--disable-dev-shm-usage"] });

async function applyProfile(cdp) {
  await cdp.send("Network.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: PROFILE.cpu_slowdown });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: PROFILE.network.latency_ms,
    downloadThroughput: (PROFILE.network.download_kbps * 1024) / 8,
    uploadThroughput: (PROFILE.network.upload_kbps * 1024) / 8,
    connectionType: "cellular4g",
  });
}

// Establish each session once, verify it, and keep the storage state for reuse.
const states = {};
const sessionFacts = {};
for (const [alias, cred] of Object.entries(SESSIONS)) {
  const ctx = await browser.newContext();
  // The session cookie is Secure, so it is only sent from the page context
  // (Chrome treats 127.0.0.1 as a secure context) — never from ctx.request over http.
  const res = await ctx.request.post(`${BASE}/api/auth/login`, { data: { identifier: cred.identifier, password: cred.password } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  const me = await page.evaluate(async () => {
    const x = await fetch("/api/auth/me");
    return { status: x.status, body: await x.json().catch(() => ({})) };
  });
  const role = me.body?.data?.role ?? null;
  sessionFacts[alias] = {
    account_alias: alias,
    login_http: res.status(),
    me_http: me.status,
    role_observed: role,
    verified_authenticated: res.ok() && me.status === 200 && role === cred.role,
  };
  states[alias] = await ctx.storageState();
  await ctx.close();
  console.log(`session ${alias}: login ${res.status()} me ${me.status} role ${role} -> ${sessionFacts[alias].verified_authenticated ? "OK" : "UNVERIFIED"}`);
}
const unauth = Object.values(sessionFacts).some((s) => !s.verified_authenticated);
if (unauth) {
  console.error("A session could not be verified — refusing to capture, since a guest must never replace an authenticated row.");
  await browser.close();
  process.exit(3);
}

const samples = [];
async function capture(route, { ctx, page, cdp, visit, rep, withArtifacts, net }) {
  // Init script + CDP listeners are registered ONCE per page by the caller: doing it
  // per repetition stacks layout-shift observers that all push into the same array,
  // inflating CLS by exactly the repetition count (verified 1x..5x before this fix).
  const { finished, failed } = net;
  finished.clear();
  failed.length = 0;

  const t0 = Date.now();
  await page.goto(route.url, { waitUntil: "domcontentloaded" });
  let ready = null, timedOut = false;
  try {
    await page.waitForFunction(() => window.__perf && window.__perf.ready !== null, null, { timeout: 45000 });
    ready = await page.evaluate(() => window.__perf.ready);
  } catch { timedOut = true; }
  await sleep(1200);
  const perf = await page.evaluate(() => ({
    lcp: window.__perf.lcp,
    shifts: window.__perf.shifts,
    errors: window.__perf.errors,
    evidence: window.__perf.evidence ?? (window.__perf.evidenceNow ? window.__perf.evidenceNow() : null),
  }));
  const finalPath = new URL(page.url()).pathname;
  const expectedPath = new URL(route.url).pathname;
  const landedWrong = decodeURIComponent(finalPath) !== decodeURIComponent(expectedPath);
  // Guard: an authenticated route must not have bounced us to a sign-in surface.
  const bouncedToLogin = /\/login|\/auth/.test(finalPath);

  const id = `${route.key}-${visit}-r${rep}`;
  let shotPath = null, tracePath = null;
  if (withArtifacts.shot) {
    shotPath = join(OUTDIR, `${id}.png`);
    await page.screenshot({ path: shotPath });
  }
  if (withArtifacts.trace) {
    tracePath = join(TRACEDIR, `${id}.zip`);
    await ctx.tracing.stop({ path: tracePath });
  }

  const invalid = timedOut || landedWrong || bouncedToLogin;
  samples.push({
    sample_id: id,
    profile_id: PROFILE.profile_id,
    route_key: route.key,
    exact_url: route.url,
    access: "approved-account",
    session_alias: route.session,
    frozen_ids: route.frozen_ids,
    visit_state: visit,
    repetition: rep,
    principal_content_selector: route.principal_content_selector,
    usable_condition: route.usable_condition,
    content_ready_ms: ready == null ? null : Math.round(ready),
    predicate_evidence: perf.evidence,
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
      : bouncedToLogin
        ? `authenticated route redirected to ${finalPath}`
        : landedWrong
          ? `navigated to ${finalPath}, expected ${expectedPath}`
          : null,
    artifact_policy: shotPath || tracePath ? null : "shares the group artifact: mobile screenshot + trace on the first fresh and last returning sample of this route",
    machine_load: loadavg(),
    captured_at: new Date().toISOString(),
  });
  console.log(`  ${id}: content=${ready == null ? "TIMEOUT" : Math.round(ready)}ms lcp=${perf.lcp == null ? "-" : Math.round(perf.lcp)}ms cls=${clsFromShifts(perf.shifts).toFixed(3)} bytes=${[...finished.values()].reduce((a, b) => a + b, 0)}${invalid ? " INVALID" : ""}`);
}

// One init script + one pair of network listeners per page; capture() clears the maps.
async function preparePage(page, cdp, kind) {
  await page.addInitScript(INIT, kind);
  const net = { finished: new Map(), failed: [] };
  cdp.on("Network.loadingFinished", (e) => net.finished.set(e.requestId, e.encodedDataLength));
  cdp.on("Network.loadingFailed", (e) => net.failed.push({ requestId: e.requestId, error: e.errorText, blocked: e.blockedReason ?? null }));
  return net;
}

async function freshContext(alias) {
  const ctx = await browser.newContext({ viewport: PROFILE.viewport, deviceScaleFactor: 3, storageState: states[alias] });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await applyProfile(cdp);
  return { ctx, page, cdp };
}

console.log("warm-up (not counted)");
for (const route of ROUTES) {
  const { ctx, page } = await freshContext(route.session);
  await page.goto(route.url, { waitUntil: "load" }).catch(() => {});
  console.log(`  warmed ${route.key}`);
  await ctx.close();
}

for (const route of ROUTES) {
  console.log(`${route.key}: fresh (${route.session})`);
  for (let rep = 1; rep <= SAMPLES; rep++) {
    const { ctx, page, cdp } = await freshContext(route.session);
    const net = await preparePage(page, cdp, route.kind);
    if (rep === 1) await ctx.tracing.start({ screenshots: true, snapshots: false });
    await capture(route, { ctx, page, cdp, visit: "fresh", rep, withArtifacts: { shot: rep === 1, trace: rep === 1 }, net });
    await ctx.close();
    await sleep(1500);
  }

  console.log(`${route.key}: returning (cache warm, same session)`);
  const { ctx, page, cdp } = await freshContext(route.session);
  const net = await preparePage(page, cdp, route.kind);
  await page.goto(route.url, { waitUntil: "load" }).catch(() => {});
  for (let rep = 1; rep <= SAMPLES; rep++) {
    if (rep === SAMPLES) await ctx.tracing.start({ screenshots: true, snapshots: false });
    await capture(route, { ctx, page, cdp, visit: "returning", rep, withArtifacts: { shot: rep === SAMPLES, trace: rep === SAMPLES }, net });
    await sleep(1500);
  }
  await ctx.close();
}

console.log("desktop visual captures");
for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: PROFILE.desktop_visual_viewport, deviceScaleFactor: 1, storageState: states[route.session] });
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
  access: "authenticated routes only; no guest substitution",
  sessions: sessionFacts,
  profile: PROFILE,
  base_url: BASE,
  server_build_id: readFileSync(".next/BUILD_ID", "utf8").trim(),
  captured_at: new Date().toISOString(),
  samples_expected: ROUTES.length * SAMPLES * 2,
  samples,
};
const outFile = OUT_JSON;
writeFileSync(outFile, JSON.stringify(out, null, 2));
const valid = samples.filter((s) => s.verification_status === "valid");
console.log(`\nwrote ${outFile}: ${valid.length}/${samples.length} valid`);
