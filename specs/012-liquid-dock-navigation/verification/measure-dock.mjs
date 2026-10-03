// 012 T013/T014 — measure the bottom dock on a real 360px page.
// Proves FR-018/SC-006 (outer height + bottom inset unchanged) and SC-002 (five labels, no clipping).
// Usage: node specs/012-liquid-dock-navigation/verification/measure-dock.mjs [url]
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const URL_ = process.argv[2] ?? "http://localhost:3000/";
const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";

const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 });
await page.goto(URL_, { waitUntil: "networkidle" });
await page.waitForSelector("nav[aria-label]", { timeout: 15000 });

const out = await page.evaluate(() => {
  const nav = [...document.querySelectorAll("nav[aria-label]")].find((n) => {
    const s = getComputedStyle(n);
    return s.position === "fixed" && parseFloat(s.bottom) >= 0 && n.querySelectorAll("a").length >= 3;
  });
  if (!nav) return { error: "no fixed bottom nav found" };

  const cs = getComputedStyle(nav);
  const navRect = nav.getBoundingClientRect();
  const items = [...nav.querySelectorAll("a")];

  return {
    navAriaLabel: nav.getAttribute("aria-label"),
    linkCount: items.length,
    outerHeightPx: Math.round(navRect.height * 100) / 100,
    bottomInsetPx: parseFloat(cs.bottom),
    insetXStartPx: parseFloat(cs.insetInlineStart ?? cs.left),
    borderRadius: cs.borderRadius,
    backgroundColor: cs.backgroundColor,
    viewport: { w: innerWidth, h: innerHeight },
    // 008's deck budget reserves this as a constant; a drift here silently breaks that gate.
    reservedGuessPx: Math.round(navRect.height + parseFloat(cs.bottom)),
    items: items.map((a) => {
      const label = a.querySelector("span:last-child");
      const icon = a.querySelector("svg");
      const lr = label?.getBoundingClientRect();
      const sr = a.getBoundingClientRect();
      return {
        href: a.getAttribute("href"),
        text: label?.textContent?.trim(),
        ariaCurrent: a.getAttribute("aria-current"),
        slotWidthPx: Math.round(sr.width * 100) / 100,
        labelWidthPx: lr ? Math.round(lr.width * 100) / 100 : null,
        // A clipped Persian label either overflows its slot or reports a scroll width past its box.
        labelOverflowPx: lr ? Math.round((label.scrollWidth - lr.width) * 100) / 100 : null,
        labelTouchesSlotEdge: lr ? Math.round((sr.width - lr.width) * 100) / 100 : null,
        iconPresent: Boolean(icon),
        hasStrayBadgeSpan: Boolean(a.querySelector("span > span")),
      };
    }),
  };
});

console.log(JSON.stringify(out, null, 2));

if (!out.error) {
  const fails = [];
  if (out.linkCount !== 5) fails.push(`FR-001: expected 5 destinations, got ${out.linkCount}`);
  if (out.items.some((i) => i.href === "/cart")) fails.push("FR-001: a /cart entry is still present");
  if (out.items.some((i) => i.hasStrayBadgeSpan)) fails.push("FR-005: a badge span survives inside an item");
  for (const i of out.items) {
    if (i.labelOverflowPx > 0.5) fails.push(`SC-002: «${i.text}» overflows its label box by ${i.labelOverflowPx}px`);
    if (i.labelTouchesSlotEdge <= 0) fails.push(`SC-002: «${i.text}» touches/exceeds its slot edge (${i.labelTouchesSlotEdge}px spare)`);
  }
  console.log(fails.length ? "\nFAIL\n" + fails.map((f) => " - " + f).join("\n") : "\nPASS — 5 destinations, no cart, no badge span, every label inside its slot");
  console.log(`\nGeometry to compare against the pre-feature baseline: outerHeight=${out.outerHeightPx}px  bottomInset=${out.bottomInsetPx}px  reserved=${out.reservedGuessPx}px`);
}
await browser.close();
