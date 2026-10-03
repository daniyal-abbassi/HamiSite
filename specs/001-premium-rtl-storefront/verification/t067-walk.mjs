import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import fs from "node:fs";

const cases = JSON.parse(fs.readFileSync(new URL("./t067-cases.json", import.meta.url), "utf8"));
const BASE = "http://localhost:3000";

const PROBE = () => {
  const txt = (el) => (el ? el.textContent.trim().replace(/\s+/g, " ") : null);
  // Scope to the buy box: a page carries up to nine other cards below it, and an
  // unscoped query reads their strikes and badges as the product's own.
  const priceEl = document.querySelector('strong[aria-live="polite"]');
  const box = priceEl?.closest("div")?.parentElement ?? null;
  const inBox = (sel) => (box ? box.querySelector(sel) : null);
  const callLine = [...document.querySelectorAll('a[href^="tel:"]')].map(txt);
  const cart = [...(box?.querySelectorAll("button") ?? [])].find((b) => /افزودن به سبد/.test(b.textContent ?? ""));
  const strip = document.querySelector('[role="group"][aria-label="نمای دیگر این محصول"]');
  const heads = [...document.querySelectorAll("h2")].map((h) => h.textContent.trim());
  const related = [...document.querySelectorAll("article")].length;
  return {
    title: txt(document.querySelector("h1")),
    price: txt(priceEl),
    strike: txt(inBox("del")),
    percentBadge: txt([...document.querySelectorAll("article span")].find((s) => /٪/.test(s.textContent ?? ""))),
    percentBadgeScope: "first card on the page",
    callPriceLine: txt([...document.querySelectorAll('a[href^="tel:"]')].find((a) => /استعلام/.test(a.textContent ?? ""))),
    telLinks: callLine,
    cartButton: cart ? { text: txt(cart), disabled: cart.disabled } : null,
    stockLine: txt([...(box?.querySelectorAll("p,span") ?? [])].find((n) => /موجود|ناموجود|تماس بگیرید/.test(n.textContent ?? "") && n.children.length === 0)),
    specsBlock: heads.includes("مشخصات"),
    specRows: document.querySelectorAll("dl > div").length,
    galleryStrip: !!strip,
    galleryCounter: strip ? txt(strip.querySelector("span:last-child")) : null,
    placeholderLabel: txt(document.body).includes("بدون تصویر محصول"),
    relatedHeading: heads.includes("محصولات مرتبط"),
    cardsOnPage: related,
    horizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth
        ? `${document.documentElement.scrollWidth}>${document.documentElement.clientWidth}`
        : null,
  };
};

const browser = await chromium.launch({
  headless: true,
  executablePath: "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
});
const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
// `next dev` compiles a route on first hit; the default 30s is not enough for that.
page.setDefaultNavigationTimeout(120000);
const out = {};
await page.goto(`${BASE}/`, { waitUntil: "commit" }).catch(() => {}); // warm the shared chunks

for (const [name, rec] of Object.entries(cases)) {
  if (!rec) {
    out[name] = "no record selected";
    continue;
  }
  const url = `${BASE}/shop/${encodeURIComponent(rec.slug)}`;
  const status = await page.goto(url, { waitUntil: "commit" }).then((r) => r.status());
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(600);
  out[name] = { id: rec.id, status, expect: rec.note ?? null, ...(await page.evaluate(PROBE)) };
}

// T066 — does choosing an option change something a shopper can read?
const variantCase = cases.many_views;
await page.goto(`${BASE}/shop/${encodeURIComponent(variantCase.slug)}`, { waitUntil: "commit" });
  await page.waitForLoadState("domcontentloaded");
await page.waitForTimeout(600);
const chips = await page.$$eval('[aria-pressed]', (els) => els.map((e) => e.getAttribute("aria-label")));
const before = await page.evaluate(PROBE);
const second = chips.filter((c) => c && !/نمای/.test(c)).slice(1)[0];
if (second) {
  await page.click(`[aria-label="${second}"]`);
  await page.waitForTimeout(400);
}
const after = await page.evaluate(PROBE);
out.t066_variant_feedback = {
  slug: variantCase.slug.slice(0, 30),
  controls: chips.length,
  pressed: second,
  priceChanged: before.price !== after.price,
  stockChanged: before.stockLine !== after.stockLine,
  before: { price: before.price, stock: before.stockLine },
  after: { price: after.price, stock: after.stockLine },
};

fs.writeFileSync(new URL("./t067-result.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await browser.close();
