// Shared helpers for the 012-VERIFY-B gate measurements.
//
// Two things this project has that a naive script gets wrong:
//
// 1. **lenis.** `components/atmosphere/ScrollSmooth.tsx` dynamically imports lenis, which in dev is
//    compiled on first request and becomes live ~5.4s after navigation. It eases wheel/trackpad
//    scrolling on desktop. After ANY scroll, poll `window.scrollY` until it stops — a fixed wait
//    samples a page that is still gliding. Detect the scroller with /(^|\s)lenis\b/ (the class is
//    bare; requiring a trailing space reports "native" on an eased page).
// 2. **The dev server's stale-build trap** (CLAUDE.md). A 200 is not a working page: wait for a React
//    fiber, and reload if it never comes.
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

export const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
export const BASE = process.env.HAMI_BASE ?? "http://localhost:3000";

export const PRODUCT_GAL = `${BASE}/shop/` + encodeURIComponent("گوشی-موبایل-سامسونگ-مدل-galaxy-a36-دو-سیم-کارت-ظرفیت-128-گیگابایت-و-رم-8-گیگابایت-ویتنام");
export const PRODUCT_3 = `${BASE}/shop/` + encodeURIComponent("اپل-آیدی");
export const SHOP = `${BASE}/shop`;
export const SHOP_CAT = `${BASE}/shop?category=` + encodeURIComponent("موبایل-و-تبلت");

export function launch() {
  return chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
}

// Load a page and wait until React has actually hydrated (a fiber on the h1), reloading if the
// dev server served a stale chunk set mid-recompile.
export async function hydratedGoto(page, url, selector, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    try {
      await page.waitForSelector(selector, { timeout: 20000, state: "attached" });
      await page.waitForFunction(() => {
        const el = document.querySelector("h1") ?? document.body.firstElementChild;
        return el && Object.keys(el).some((k) => k.startsWith("__reactFiber") || k.startsWith("__reactContainer"));
      }, { timeout: 15000 });
      await page.waitForTimeout(300);
      return;
    } catch {
      console.log(`  (hydration not ready on attempt ${i + 1}, reloading)`);
    }
  }
  throw new Error(`page never hydrated: ${url}`);
}

// Poll window.scrollY until it stops changing — lenis may still be gliding.
export async function waitForScrollSettle(page, timeout = 8000) {
  await page.waitForFunction(() => {
    const y = window.scrollY;
    return new Promise((resolve) => {
      setTimeout(() => resolve(window.scrollY === y), 120);
    });
  }, { timeout, polling: 100 }).catch(() => {});
}

// Which scroller is live: lenis eases the document on desktop; the class is bare on <html>.
export async function scrollerKind(page) {
  return page.evaluate(() => {
    const cls = document.documentElement.className;
    return /(^|\s)lenis\b/.test(cls) ? "lenis" : "native";
  });
}

// Trusted pointer click at an element's centre, after an instant scroll into view. The position is
// re-measured until stable (images loading shift the page; a button that moves between mousedown and
// mouseup is not clicked at all). `byText` matches on textContent instead of a CSS selector.
export async function trustedClick(page, selector, byText = null) {
  const measure = () =>
    page.evaluate(
      ({ sel, byText }) => {
        const el = byText != null
          ? [...document.querySelectorAll(sel)].find((n) => n.textContent.trim() === byText)
          : document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        // Only scroll when the element is not already fully in view. Scrolling a fixed-header
        // element (the pills) scrolls the page, which trips the header's auto-hide and takes the
        // element off-screen — the click then misses. In-view elements are clicked where they are.
        const inView = r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth;
        if (!inView) el.scrollIntoView({ behavior: "instant", block: "center" });
        const r2 = el.getBoundingClientRect();
        return { x: r2.x + r2.width / 2, y: r2.y + r2.height / 2 };
      },
      { sel: selector, byText },
    );

  let point = await measure();
  if (!point) return false;
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(200);
    const again = await measure();
    if (!again) return false;
    if (Math.abs(again.x - point.x) < 1 && Math.abs(again.y - point.y) < 1) {
      point = again;
      break;
    }
    point = again;
  }
  // No mouse.move away first: on the fixed header that hover lands on the logo and opens an
  // overlay that swallows the click. A clean move-and-click at the centre is what navigates.
  await page.mouse.click(point.x, point.y);
  return true;
}

// In-page rAF sampler on the marker inside a group. Returns the samples array.
export async function installSampler(page, groupSelector, ms = 2500) {
  await page.evaluate(
    ({ sel, ms }) => {
      const group = document.querySelector(sel);
      const marker = group.querySelector('span[class*="liquid-selection_marker"]');
      window.__lsSamples = [];
      const t0 = performance.now();
      const tick = () => {
        const r = marker.getBoundingClientRect();
        window.__lsSamples.push({
          t: Math.round(performance.now() - t0),
          x: Math.round(r.x * 100) / 100,
          y: Math.round(r.y * 100) / 100,
          w: Math.round(r.width * 100) / 100,
          h: Math.round(r.height * 100) / 100,
          opacity: Number(getComputedStyle(marker).opacity),
        });
        if (performance.now() - t0 < ms) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    { sel: groupSelector, ms },
  );
}

export async function readSamples(page) {
  return page.evaluate(() => window.__lsSamples ?? []);
}

export async function markerState(page, groupSelector) {
  return page.evaluate((sel) => {
    const group = document.querySelector(sel);
    const marker = group.querySelector('span[class*="liquid-selection_marker"]');
    const gr = group.getBoundingClientRect();
    const mr = marker.getBoundingClientRect();
    return {
      groupRect: { x: gr.x, y: gr.y, w: gr.width, h: gr.height },
      markerRect: { x: mr.x, y: mr.y, w: mr.width, h: mr.height },
      markerOpacity: Number(getComputedStyle(marker).opacity),
    };
  }, groupSelector);
}

// Count markers on the page that are currently animating (their rect changed between two rAF
// samples taken `gap` ms apart). Used by G3.
export async function countAnimatingMarkers(page, gap = 90) {
  return page.evaluate(async (gap) => {
    const markers = [...document.querySelectorAll('span[class*="liquid-selection_marker"]')];
    const snap = () => markers.map((m) => {
      const r = m.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, opacity: Number(getComputedStyle(m).opacity) };
    });
    const a = snap();
    await new Promise((resolve) => setTimeout(resolve, gap));
    const b = snap();
    let animating = 0;
    for (let i = 0; i < markers.length; i++) {
      const moved = Math.abs(a[i].x - b[i].x) > 0.5 || Math.abs(a[i].y - b[i].y) > 0.5 ||
        Math.abs(a[i].w - b[i].w) > 0.5 || Math.abs(a[i].h - b[i].h) > 0.5;
      const visible = b[i].opacity > 0 && b[i].w > 0;
      if (moved && visible) animating++;
    }
    return { animating, total: markers.length };
  }, gap);
}
