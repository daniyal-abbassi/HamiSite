/* Ground truth on the tab marker's deformation, immune to page scroll.
 *
 * Two earlier attempts to answer "does it stretch at 1280?" were themselves the
 * problem: sampling getBoundingClientRect() while `scroll-behavior: smooth` was
 * still gliding the page made the marker look like it was travelling vertically,
 * and one probe's click landed on nothing at all because the coordinates were
 * measured before the scroll finished (its inline transform never changed — the
 * tell that nothing had happened).
 *
 * So: turn smooth scrolling off, wait for scrollY to settle, click, and read the
 * transform string GSAP actually wrote. That is viewport-independent and it is
 * what the deformation IS.
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const TABLIST = '[role="tablist"]';

const browser = await chromium.launch({ executablePath: EXE });

for (const width of [1280, 360]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction((s) => { const g = document.querySelector(s); return !!g && g.dataset.lsPlaced === "1"; }, TABLIST, { timeout: 60000 }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(900);

  // Kill the smooth glide, then jump and let the layout quiesce.
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    document.getElementById("featured").scrollIntoView({ block: "center" });
  });
  await page.waitForFunction(() => {
    const y = window.scrollY;
    if (window.__lastY === undefined) { window.__lastY = y; return false; }
    const same = Math.abs(y - window.__lastY) < 0.5;
    window.__lastY = y;
    return same;
  }, null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);

  const before = await page.evaluate((sel) => {
    const g = document.querySelector(sel);
    const m = g.querySelector('span[aria-hidden="true"]');
    const sel1 = g.querySelector('[aria-selected="true"]');
    const other = [...g.querySelectorAll('[role="tab"]')].find((t) => t !== sel1);
    const r = other.getBoundingClientRect();
    return { selected: sel1.innerText.trim(), inline: m.style.transform, target: other.innerText.trim(), cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
  }, TABLIST);

  await page.evaluate((sel) => {
    const marker = document.querySelector(`${sel} span[aria-hidden="true"]`);
    window.__f = [];
    const t0 = performance.now();
    const tick = () => {
      window.__f.push({ ms: +(performance.now() - t0).toFixed(0), tf: marker.style.transform });
      if (performance.now() - t0 < 1500) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, TABLIST);

  await page.mouse.click(before.cx, before.cy);
  await page.waitForTimeout(1700);
  const f = await page.evaluate(() => window.__f);
  const after = await page.evaluate((sel) => {
    const g = document.querySelector(sel);
    return { selected: g.querySelector('[aria-selected="true"]')?.innerText.trim(), inline: g.querySelector('span[aria-hidden="true"]').style.transform };
  }, TABLIST);

  /* GSAP writes `translate(x, y) scale(sx, sy) skewX(deg)` — pull the numbers out
     of the string it actually produced. */
  const parse = (s) => {
    const sc = s.match(/scale\(\s*([-\d.]+)(?:[,\s]+([-\d.]+))?/);
    const sk = s.match(/skewX?\(\s*([-\d.]+)/);
    const tr = s.match(/translate3?D?\(\s*([-\d.]+)px[,\s]+([-\d.]+)/);
    return { sx: sc ? parseFloat(sc[1]) : 1, sy: sc && sc[2] ? parseFloat(sc[2]) : null, skew: sk ? parseFloat(sk[1]) : 0, tx: tr ? parseFloat(tr[1]) : null };
  };
  const rows = f.map((r) => ({ ms: r.ms, ...parse(r.tf) }));
  const changed = rows.filter((r) => r.tf !== undefined);
  const peakSx = Math.max(...changed.map((r) => r.sx));
  const peakSkew = Math.max(...changed.map((r) => Math.abs(r.skew)));
  const txs = [...new Set(changed.map((r) => r.tx).filter((v) => v !== null))];

  console.log(`\n=== ${width}px  «${before.selected}» → «${after.selected}»  (clicked «${before.target}»)`);
  console.log(`  inline before: ${before.inline}`);
  console.log(`  inline after : ${after.inline}`);
  console.log(`  frames ${rows.length} · distinct translate-x ${txs.length} · peak scaleX ${peakSx} · peak |skewX| ${peakSkew}°`);
  console.log(`  selection actually changed: ${before.selected !== after.selected}`);
  const interesting = rows.filter((r, i) => i % 6 === 0).slice(0, 12);
  for (const r of interesting) console.log(`    ${String(r.ms).padStart(4)}ms tx=${r.tx} scale=${r.sx}${r.sy !== null ? "," + r.sy : ""} skew=${r.skew}`);
  await page.close();
}
await browser.close();
