#!/usr/bin/env node
/**
 * 011 T015 / R1 — the recognition instrument, and the palette measurement (T011).
 *
 * Renders the six card grounds with ALL text hidden (names, wordmarks, counts, stories —
 * `.brand-deck__label`/`.brand-deck__mark` visibility hidden and every text-bearing box
 * emptied visually), as one A–F image at 360 per card, and prints the A–F → maker mapping
 * ONLY when called with `--key`, so the tester's image never contains the answer.
 *
 *   node specs/011-brand-card-identity/verification/recognition-test.mjs            # writes the images
 *   node …/recognition-test.mjs --json                                             # also dumps computed styles
 *
 * The bar (contract R1): four of six named correctly by a person who has never seen the
 * site; the two blues and the two hueless are allowed to be confused with each other.
 * One Chromium, closed at the end.
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";
import path from "node:path";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const KEY = process.argv.includes("--key");
const WANT_JSON = process.argv.includes("--json");

const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 360, height: 640 } });
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(600);

// Isolate one card at a time into a 360×300 ground plate, text hidden.
const perCard = [];
for (let i = 0; i < 6; i++) {
  const shot = await page.evaluate(async (idx) => {
    const sec = document.getElementById("brands");
    const cards = [...sec.querySelectorAll("[data-deck-card]")];
    if (cards.length !== 6) return { error: `expected 6 cards, saw ${cards.length}` };
    // hide every piece of text in the deck: the test is on colour alone (R1)
    for (const c of cards) {
      for (const sel of [".brand-deck__label", ".brand-deck__mark", ".brand-deck__story", ".brand-deck__count"]) {
        const el = c.querySelector(sel);
        if (el) el.style.visibility = "hidden";
      }
    }
    const c = cards[idx];
    c.scrollIntoView({ behavior: "instant", block: "start" });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const cs = getComputedStyle(c.querySelector(".brand-deck__card") ?? c);
    return {
      ground: c.style.getPropertyValue("--card-ground").trim(),
      accent: c.style.getPropertyValue("--card-accent").trim(),
      placement: c.getAttribute("data-hue-placement"),
      bg: cs.backgroundImage.slice(0, 90),
      rect: (() => { const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })(),
    };
  }, i);
  if (shot.error) throw new Error(shot.error);
  const buf = await page.screenshot({
    viewport: { width: 360, height: 640 },
    clip: { x: shot.rect.x, y: Math.max(0, shot.rect.y), width: shot.rect.w, height: Math.min(300, shot.rect.h) },
  });
  writeFileSync(path.join(HERE, `recognition-card-${String.fromCharCode(65 + i)}.png`), buf);
  perCard.push(shot);
}

// One composite strip: HTML grid of the six plates, labelled A–F, no maker names.
const letters = perCard.map((p, i) => `<figure><img src="file://${path.join(HERE, `recognition-card-${String.fromCharCode(65 + i)}.png`)}"><figcaption>${String.fromCharCode(65 + i)}</figcaption></figure>`).join("");
await page.setContent(`<!DOCTYPE html><html><head><style>
  body{margin:0;background:#0b0204;font-family:monospace}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px}
  figure{margin:0;position:relative}img{width:100%;display:block;border-radius:12px}
  figcaption{position:absolute;inset-block-end:6px;inset-inline-start:8px;color:#fff;background:rgba(0,0,0,.55);padding:2px 8px;border-radius:8px;font-size:16px}
</style></head><body><div class="grid">${letters}</div></body></html>`);
await page.waitForTimeout(300);
const composite = await page.screenshot({ fullPage: true });
writeFileSync(path.join(HERE, "recognition-grounds-AF.png"), composite);

// T011 palette@360: same six plates WITH text, for the family record.
const page2 = await browser.newPage({ viewport: { width: 360, height: 640 } });
await page2.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page2.waitForTimeout(400);
const plates = [];
for (let i = 0; i < 6; i++) {
  const rect = await page2.evaluate((idx) => {
    const sec = document.getElementById("brands");
    const cards = [...sec.querySelectorAll("[data-deck-card]")];
    for (const c of cards) {
      for (const sel of [".brand-deck__label", ".brand-deck__mark", ".brand-deck__story", ".brand-deck__count"]) {
        const el = c.querySelector(sel);
        if (el) el.style.visibility = "visible";
      }
    }
    const c = cards[idx];
    c.scrollIntoView({ behavior: "instant", block: "start" });
    const r = c.getBoundingClientRect();
    return { x: r.x, y: Math.max(0, r.y), width: r.width, height: Math.min(300, r.height) };
  }, i);
  const buf = await page2.screenshot({ clip: rect });
  writeFileSync(path.join(HERE, `palette-card-${i}.png`), buf);
  plates.push(buf);
}
const palLetters = plates.map((_, i) => `<figure><img src="file://${path.join(HERE, `palette-card-${i}.png`)}"></figure>`).join("");
await page2.setContent(`<!DOCTYPE html><html><head><style>body{margin:0;background:#0b0204}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px}figure{margin:0}img{width:100%;display:block;border-radius:12px}</style></head><body><div class="grid">${palLetters}</div></body></html>`);
await page2.waitForTimeout(200);
writeFileSync(path.join(HERE, "palette@360.png"), await page2.screenshot({ fullPage: true }));

const names = ["APPLE", "SAMSUNG", "XIAOMI", "NOKIA", "REALME", "TCH"];
const rows = perCard.map((p, i) => `${String.fromCharCode(65 + i)} = ${KEY ? names[i] : "(hidden)"}, ground ${p.ground}, accent ${p.accent}, placement ${p.placement}`);
console.log(rows.join("\n"));
if (WANT_JSON) console.log(JSON.stringify(perCard, null, 2));
await browser.close();
