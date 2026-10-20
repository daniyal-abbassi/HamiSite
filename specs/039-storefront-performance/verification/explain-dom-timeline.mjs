// Throwaway T007 probe (not a repo artifact): what exactly is missing, second by
// second, when home's principal content is late? Node-side polling (an init
// script produced an empty timeline), with page errors surfaced.
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const VISIT = process.argv[2] === "returning" ? "returning" : "fresh";
const BASE = "http://127.0.0.1:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROBE = () => {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };
  const cards = [...document.querySelectorAll("article.product-card")];
  const vis = cards.filter(visible);
  const first = vis[0] ?? cards[0] ?? null;
  let style = null;
  if (first) {
    const s = getComputedStyle(first);
    const r = first.getBoundingClientRect();
    const parent = first.closest(".reveal");
    style = {
      rect: `${Math.round(r.width)}x${Math.round(r.height)}`,
      opacity: s.opacity,
      visibility: s.visibility,
      display: s.display,
      inReveal: !!parent,
      revealVisible: parent ? parent.className.includes("reveal--visible") : null,
      price: /تومان/.test(first.querySelector(".toman-price")?.textContent ?? ""),
      imgLoaded: (first.querySelector("img")?.naturalWidth ?? 0) > 0,
    };
  }
  return {
    ready: document.readyState,
    cards: cards.length,
    visibleCards: vis.length,
    reveals: document.querySelectorAll(".reveal").length,
    skeletonPulse: document.querySelectorAll(".animate-pulse").length,
    first: style,
  };
};

const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(http|https|ftp|all|no)_proxy$/i.test(k)));
const browser = await chromium.launch({ channel: "chrome", headless: true, env, args: ["--no-proxy-server", "--disable-dev-shm-usage"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 160)));
const cdp = await ctx.newCDPSession(page);
await cdp.send("Network.enable");
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1600 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });

if (VISIT === "returning") await page.goto(BASE, { waitUntil: "load" }).catch(() => {});

const t0 = Date.now();
await page.goto(BASE, { waitUntil: "domcontentloaded" });
const rows = [];
for (let i = 0; i < 34; i++) {
  const t = Date.now() - t0;
  try {
    rows.push({ t, ...(await page.evaluate(PROBE)) });
  } catch (e) {
    rows.push({ t, error: String(e).slice(0, 80) });
  }
  await sleep(280);
}

console.log(`VISIT=${VISIT}`);
console.log("   t   ready       cards vis reveals pulse | firstCard");
for (const r of rows) {
  const f = r.first;
  console.log(
    `${String(r.t).padStart(5)} ${String(r.ready ?? r.error).padEnd(11)} ${String(r.cards).padStart(5)} ${String(r.visibleCards).padStart(3)} ${String(r.reveals).padStart(7)} ${String(r.skeletonPulse).padStart(5)} | ` +
      (f
        ? `rect=${f.rect} opacity=${f.opacity} vis=${f.visibility} disp=${f.display} inReveal=${f.inReveal} revealVisible=${f.revealVisible} price=${f.price} img=${f.imgLoaded}`
        : "-"),
  );
}
if (errors.length) console.log("page errors:", errors);
await browser.close();
