/*
 * SC-002, measured rather than argued. Two concrete finding tasks, counted in
 * deliberate inputs (a tap, or one search submission; scrolling to see what the page
 * already renders is free — that is the generous reading and it is stated so it can be
 * disputed). Criterion: three or fewer.
 *
 * Each step navigates for real. A step that could not be performed is reported as such
 * rather than skipped, because a count that quietly omits a tap is how this criterion
 * gets "met" by arithmetic instead of by design.
 *
 *   node specs/001-premium-rtl-storefront/verification/sc002-interactions.mjs
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const LIMIT = 3;
const decode = (u) => {
  try {
    return decodeURIComponent(u);
  } catch {
    return u;
  }
};
const here = (page) => decode(page.url().replace(BASE, "") || "/");

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME ?? "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
});

/**
 * Poll for the navigation instead of sleeping a fixed time. `next dev` compiles a route
 * on first hit and the phone department renders 60 cards, so a 2.5-second guess read as
 * "the panel did not navigate" — a false defect, and the kind that gets fixed in the
 * wrong file. The wait is now a bound, and the failure message says what it timed out on.
 */
const until = async (page, predicate, ms = 15000) => {
  const deadline = Date.now() + ms;
  for (;;) {
    if (predicate(here(page))) return true;
    if (Date.now() > deadline) return false;
    await page.waitForTimeout(250);
  }
};

const home = async (page) => {
  await page.goto(`${BASE}/`, { waitUntil: "commit" });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2200);
};

/** Press a carousel panel by its destination, or report why it could not be pressed. */
async function pressPanel(page, slug) {
  const panel = page.locator(`a.cat-panel[href="/categories/${encodeURIComponent(slug)}"]`).first();
  if (!(await panel.count())) return { ok: false, why: `no panel for «${slug}»` };
  try {
    await panel.click({ timeout: 5000 });
  } catch {
    return { ok: false, why: `panel «${slug}» is covered at its own centre` };
  }
  const moved = await until(page, (u) => u.startsWith("/categories/") || u === "/shop");
  const landed = here(page);
  if (!moved) return { ok: false, why: `pressed, but no category route opened (still ${landed})` };
  return { ok: true, here: landed };
}

/** Either by label or by the exact href a control points at, whichever the caller can name. */
async function pressLink(page, { text, href }) {
  const selector = href ? `a[href="${href}"]` : `a:has-text("${text}")`;
  const link = page.locator(selector).first();
  if (!(await link.count())) return { ok: false, why: `no control matching ${selector}` };
  const before = here(page);
  try {
    await link.scrollIntoViewIfNeeded();
    await link.click({ timeout: 5000 });
  } catch {
    return { ok: false, why: `${selector} not clickable` };
  }
  const moved = await until(page, (u) => u !== before);
  const landed = here(page);
  if (!moved) return { ok: false, why: `pressed, but the URL did not change (${landed})` };
  return { ok: true, here: landed };
}

/** Tap the first product card whose text contains `needle`, or the first card at all. */
async function pressProduct(page, needle = "") {
  const handle = await page.evaluateHandle((text) => {
    const links = [...document.querySelectorAll('a[href^="/shop/"]')];
    return links.find((a) => (a.textContent ?? "").includes(text)) ?? (text ? null : links[0]) ?? null;
  }, needle);
  const element = handle.asElement();
  if (!element) return { ok: false, why: `no card mentioning «${needle}» on screen` };
  try {
    await element.scrollIntoViewIfNeeded();
    await element.click({ timeout: 5000 });
  } catch {
    return { ok: false, why: "the card was not clickable" };
  }
  const moved = await until(page, (u) => u.startsWith("/shop/"));
  const landed = here(page);
  if (!moved) return { ok: false, why: `the card was pressed but no product page opened (still ${landed})` };
  return { ok: true, here: landed, heading: (await page.locator("h1").first().textContent().catch(() => null))?.trim().slice(0, 46) };
}

const run = async (label, steps) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 840 } });
  page.setDefaultNavigationTimeout(120000);
  await home(page);
  const log = [];
  for (const step of steps(page)) {
    const result = await step.run();
    log.push({ action: step.action, ...result, note: result.heading ?? null });
    if (!result.ok) break;
  }
  const inputs = log.filter((l) => l.ok).length;
  const broke = log.find((l) => !l.ok);
  const verdict = broke ? `INCOMPLETE (${broke.why})` : inputs <= LIMIT ? "MET" : `NOT MET (${inputs} > ${LIMIT})`;
  console.log(`\n${label}\n  ${verdict}${broke ? "" : ` — ${inputs} interaction${inputs === 1 ? "" : "s"}`}`);
  for (const l of log) console.log(`   ${l.ok ? "✓" : "✗"} ${l.action}${l.here ? ` → ${l.here.slice(0, 46)}${l.note ? ` «${l.note}»` : ""}` : ` — ${l.why}`}`);
  await page.close();
  return { label, verdict, inputs, broke: broke?.why ?? null };
};

const results = [];

results.push(
  await run("A — “a Xiaomi phone”, from the homepage", (page) => [
    { action: "press the «گوشی موبایل» panel", run: () => pressPanel(page, "موبایل-و-تبلت") },
    { action: "tap the first Xiaomi card", run: () => pressProduct(page, "شیائومی") },
  ]),
);

results.push(
  await run("B — “the cheapest power bank that is actually available”, from the homepage", (page) => [
    { action: "press the «پاوربانک» panel", run: () => pressPanel(page, "پاور-بانک") },
    { action: "tap «ارزان‌ترینِ قابل خرید»", run: () => pressLink(page, { text: "ارزان‌ترینِ قابل خرید" }) },
    { action: "tap the first card", run: () => pressProduct(page) },
  ]),
);

// The shelf band 2's fix 3 added: the same task answered from the homepage directly.
results.push(
  await run("B′ — the same task from the «همین حالا قابل خرید» shelf", (page) => [
    { action: "tap the shelf's «مشاهده همه»", run: () => pressLink(page, { href: "/shop?stock=purchasable" }) },
    { action: "tap the first card", run: () => pressProduct(page) },
  ]),
);

const failed = results.filter((r) => r.verdict !== "MET" && !r.verdict.startsWith("INCOMPLETE"));
const incomplete = results.filter((r) => r.verdict.startsWith("INCOMPLETE"));
console.log(
  `\n${results.map((r) => `${r.label.split(" —")[0]}: ${r.verdict}`).join(" | ")}\n` +
    (incomplete.length ? `  ${incomplete.length} task(s) could not be driven end to end — reported, not rounded down\n` : "") +
    `exit ${failed.length || incomplete.length ? 1 : 0}`,
);
await browser.close();
process.exit(failed.length || incomplete.length ? 1 : 0);
