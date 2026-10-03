import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import fs from "node:fs";

const cases = JSON.parse(fs.readFileSync(new URL("./t067-cases.json", import.meta.url), "utf8"));
const BASE = "http://localhost:3000";

/*
 * Scoped to the two strings only the product page emits. A card's add-to-cart is
 * icon-only and the strike/percent live in card markup too, so an unscoped
 * document query reads a related-products card as the product's own state — which
 * is exactly what the first pass of this probe did.
 */
const PROBE = () => {
  const txt = (el) => (el ? el.textContent.trim().replace(/\s+/g, " ") : null);
  const buttons = [...document.querySelectorAll("button")];
  const cart = buttons.find((b) => /افزودن به سبد/.test(b.textContent ?? ""));
  const sticky = buttons.find((b) => /^(افزودن به سبد|ناموجود|تماس بگیرید)$/.test((b.textContent ?? "").trim()));
  const stockNote = [...document.querySelectorAll("p")].find((n) => /عدد در انبار موجود است|در انبار موجود نیست/.test(n.textContent ?? ""));
  const callCta = [...document.querySelectorAll("a")].find((a) => /تماس برای اطلاع از موجودی/.test(a.textContent ?? ""));
  const label = [...document.querySelectorAll("span")].find((n) => n.children.length === 0 && /موجود محدود|ناموجود|تماس بگیرید|موجود/.test(n.textContent ?? ""));
  return {
    price: txt(document.querySelector('strong[aria-live="polite"]')),
    pdpCart: cart ? { text: txt(cart), disabled: cart.disabled } : null,
    stickyBar: sticky ? { text: txt(sticky), disabled: sticky.disabled } : null,
    stockNote: txt(stockNote),
    callCta: !!callCta,
    availabilityLabel: txt(label),
    pressedChips: buttons
      .filter((b) => b.getAttribute("aria-pressed") === "true" && /^رنگ:/.test(b.getAttribute("aria-label") ?? ""))
      .map((b) => b.getAttribute("aria-label")),
  };
};

const browser = await chromium.launch({
  headless: true,
  executablePath: "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
});
const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
page.setDefaultNavigationTimeout(120000);

const open = async (slug) => {
  await page.goto(`${BASE}/shop/${encodeURIComponent(slug)}`, { waitUntil: "commit" });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);
};

const out = {};
for (const name of ["purchasable", "limited_not_sellable", "call_for_price", "no_image", "one_view"]) {
  await open(cases[name].slug);
  out[name] = { id: cases[name].id, ...(await page.evaluate(PROBE)) };
}

// T066: choose a second colour and a second option group, then read what changed.
await open(cases.many_views.slug);
const before = await page.evaluate(PROBE);
const chips = await page.$$eval("button[aria-pressed]", (els) =>
  els.map((e) => e.getAttribute("aria-label")).filter((l) => l && !/^نمای /.test(l)),
);
const secondColour = chips.find((c) => c.startsWith("رنگ:") && !before.pressedChips.includes(c));
if (secondColour) {
  await page.click(`button[aria-label="${secondColour}"]`);
  await page.waitForTimeout(500);
}
const after = await page.evaluate(PROBE);
out.t066 = {
  slug: cases.many_views.slug.slice(0, 28),
  optionControls: chips.length,
  chosen: secondColour ?? null,
  priceChanged: before.price !== after.price,
  stockNoteChanged: before.stockNote !== after.stockNote,
  labelChanged: before.availabilityLabel !== after.availabilityLabel,
  before: { price: before.price, stockNote: before.stockNote, label: before.availabilityLabel },
  after: { price: after.price, stockNote: after.stockNote, label: after.availabilityLabel },
};

fs.writeFileSync(new URL("./t066-result.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await browser.close();
