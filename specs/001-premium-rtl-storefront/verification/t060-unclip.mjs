import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const BASE = "http://localhost:3000";
const TARGETS = [
  [768, "/"], [360, "/"], [1440, "/"],
  [360, "/shop"], [768, "/shop"], [1440, "/shop"],
  [360, "/shop/" + encodeURIComponent("گوشی-موبایل-شیائومی-مدل-poco-x7-pro-دو-سیم-کارت-ظرفیت-512-گیگابایت-و-رم-12-گیگابایت-گلوبال")],
  [768, "/shop/" + encodeURIComponent("گوشی-موبایل-شیائومی-مدل-poco-x7-pro-دو-سیم-کارت-ظرفیت-512-گیگابایت-و-رم-12-گیگابایت-گلوبال")],
  [1440, "/shop/" + encodeURIComponent("گوشی-موبایل-شیائومی-مدل-poco-x7-pro-دو-سیم-کارت-ظرفیت-512-گیگابایت-و-رم-12-گیگابایت-گلوبال")],
  [360, "/shop/" + encodeURIComponent("اپل-آیدی")], [1440, "/shop/" + encodeURIComponent("اپل-آیدی")],
  [360, "/categories/" + encodeURIComponent("موبایل")], [768, "/categories/" + encodeURIComponent("موبایل")], [1440, "/categories/" + encodeURIComponent("موبایل")],
  [360, "/brands/" + encodeURIComponent("اپل")], [1440, "/brands/" + encodeURIComponent("اپل")],
  [360, "/cart"], [1440, "/cart"], [360, "/partners"], [1440, "/partners"],
];

/*
 * Unclip first. `body { overflow-x: hidden }` is the thing under test, so a
 * measurement taken with it in place cannot distinguish a composed page from a
 * clipped one; with it forced to `visible`, anything that really exceeds the
 * viewport also widens the document.
 */
const PROBE = () => {
  document.body.style.overflowX = "visible";
  document.documentElement.style.overflowX = "visible";
  const vw = window.innerWidth;
  const rows = [];
  for (const el of document.querySelectorAll("body *")) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.right <= vw + 1 && rect.left >= -1) continue;
    const path = [];
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const cls = typeof n.className === "string" ? n.className.split(" ").filter(Boolean)[0] : "";
      path.unshift(`${n.tagName.toLowerCase()}${cls ? "." + cls.slice(0, 22) : ""}`);
    }
    rows.push({ path: path.slice(-4).join(" > "), left: Math.round(rect.left), right: Math.round(rect.right) });
  }
  rows.sort((a, b) => b.right - a.right);
  return { vw, doc: document.documentElement.scrollWidth, rows: rows.slice(0, 10) };
};

const browser = await chromium.launch({
  headless: true,
  executablePath: "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
});
for (const [width, path] of TARGETS) {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  page.setDefaultNavigationTimeout(120000);
  await page.goto(BASE + path, { waitUntil: "commit" });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(900);
  const r = await page.evaluate(PROBE);
  console.log(`${String(width).padStart(4)} ${r.doc > r.vw + 1 ? "OVERFLOWS" : "fits    "} doc=${String(r.doc).padStart(4)} vw=${r.vw}  ${path.slice(0, 44)}`);
  if (r.doc > r.vw + 1) for (const row of r.rows.slice(0, 4)) console.log(`        ${String(row.left).padStart(6)} → ${String(row.right).padStart(6)}  ${row.path}`);
  await page.close();
}
await browser.close();
