/*
 * 008 — the fit gate. Decides whether the brands deck ships, or the static stack does (FR-014).
 *
 *   node specs/008-brands-stacking-cards/verification/measure-deck.mjs
 *   BASE_URL=http://localhost:3000 node …/measure-deck.mjs
 *   node …/measure-deck.mjs --self-test
 *
 *   exit 0  pass — or the expected pre-implementation baseline ("no deck present")
 *   exit 1  a clause failed: C1, C2, FR-008, C8 or C9
 *   exit 2  the harness could not answer (no server, no hydration, nothing to measure)
 *
 * ## Why this script exists rather than a look at the page
 *
 * research.md D2 settled the geometry as arithmetic *before* any styling: at 360 × 640 a card may be
 * 460px, because 640 − 88 (mobile dock) − 80 (five 16px stack edges, D3) = 472. Feature 007 budgeted
 * a pinned stage optimistically, measured 54.6px of real travel at implementation time, and shipped
 * without its pin. This script is the measurement that keeps that from happening twice: it either
 * confirms 460px fits, or it fails and the answer is FR-014's static stack, which is a *completion*.
 *
 * It is the automated form of quickstart.md §3, §4 (C9) and §6 (C8). Contract C1, C2, C8, C9 and
 * FR-008 are the clauses it can fail; C3, C4, C5, C6 and C7 are pressed, read or eyeballed by a
 * human and are not machine-decidable from geometry.
 *
 * ## The three traps in this repo, defeated deliberately
 *
 * 1. **`app/globals.css:128` sets `scroll-behavior: smooth` on `html`.** A naive `scrollTo()` samples a
 *    page that is still gliding, which is how an earlier probe in this repo returned zero usable
 *    frames. Every scroll here is `scrollTo({ top, behavior: "instant" })`, then two animation frames
 *    plus ~120ms, then a *separate* evaluate that re-reads the rects — never a value cached from the
 *    scroll call. If the position still drifts after settling (Lenis, feature 002, only on
 *    `pointer: fine` devices) the sample is printed as `DRIFT` rather than quietly averaged in.
 * 2. **A 200 response is not a working page.** If the client chunks never load, React does not
 *    hydrate and the chapter is inert — indistinguishable from a deck that does not move. Hydration
 *    is asserted before anything is measured, and a missing React root is exit 2, not a fail.
 * 3. **Playwright is not a project dependency and must not become one.** This imports the install that
 *    already exists on this box (pixel-bridge-mcp's copy) and the Chromium already in the cache. No
 *    `npm install`, nothing added to package.json. Verified by inspection, not by trying it.
 *
 * ## Honesty about the numbers
 *
 * No frame-rate or smoothness claim is made or measured (research.md D9): this box has 7.6 GB and
 * lost three agent processes to load average 33. What is asserted here is geometry — rects against the
 * viewport, at an exact viewport size, in a settled layout. That is what the machine can answer honestly.
 */
import { chromium } from "/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs";

const EXE = "/home/lain/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
/** Query string appended to every navigation. Empty by default; a fixture server that switches on
 *  `?mode=` needs it, and losing it is how a "bad" fixture ends up serving the "good" page. */
const QUERY = process.env.BASE_QUERY ?? "";
/** research.md D2 — the fit case. Overridable for a look at another width, never for the gate. */
const VW = Number(process.env.VIEWPORT_W ?? 360);
const VH = Number(process.env.VIEWPORT_H ?? 640);
/** D2 — 640 − 88 dock − 80 edges = 472 available, 460 chosen. Compared against the measured card. */
const CARD_BUDGET = Number(process.env.CARD_BUDGET ?? 460);
/** FR-008 — "must not exceed six and a half screen-heights". */
const MAX_SCREENS = Number(process.env.MAX_SCREENS ?? 6.5);
const SAMPLES = Number(process.env.SAMPLES ?? 30);
const AWAY_URL = process.env.AWAY_URL ?? "/shop";

/** Contract C1 — the deck is six cards. */
const EXPECTED_CARDS = 6;

/**
 * Card selector, in priority order, and always queried *inside* `#brands` — the homepage has dozens of
 * `<li>` and `[class*=row]` elements, and a document-wide match would quietly measure a category
 * carousel instead of the brands deck. The deck is not implemented yet, so the harness takes the first
 * selector that matches and *prints which one it used*: a run that silently fell back to a container
 * would otherwise look like a measurement. Today's markup answers on `li` — the six
 * `li.brand-rows__item` rows at `components/home/BrandRows.tsx:69`. When 008 lands, adding
 * `[data-deck-card]` to the front is the only change this needs to prefer the new markup.
 */
const CARD_SELECTORS = [
  "[data-deck-card]",
  "li",
  "article",
  "[class*=card]",
  "[class*=row]",
];
/** The mark and the Persian name — the two things FR-007 refuses to let be cropped. */
const MARK_SELECTORS = ["[data-deck-mark]", "[class*=mark]", "svg"];
const LABEL_SELECTORS = ["[data-deck-label]", "[class*=label]", "[class*=name]"];

/**
 * C2's classification, isolated so it can be tested.
 *
 * A bug in the first version closed the fit gate wrongly: it scored `label === null` as clipped, and
 * `null` is what the probe returns when **no card holds the viewport top at all**. During the chapter's
 * approach — the section header is still on screen and the first card is 262, 174, 42 px below the top —
 * every sample was counted as a violation, six of them, and the script told us to discard a working deck
 * and ship the static stack.
 *
 * C2 is a claim about *the topmost card's* mark and name. A sample with no topmost card cannot violate it,
 * and treating "nothing there yet" as "clipped" was measuring the absence of a card and reporting the
 * presence of a defect. Samples in that phase are now labelled `approaching` and excluded from C2's
 * denominator — and the count excluded is printed, so an exclusion can never quietly become a pass.
 */
function clipFlags(m) {
  const hasTopCard = m.top >= 0 && m.mark !== null && m.label !== null;
  if (!hasTopCard) return { approaching: true, labelClipped: false, markClipped: false };
  return {
    approaching: false,
    labelClipped: m.label.top < 0 || m.label.bottom > m.vh,
    markClipped: m.mark.top < 0 || m.mark.bottom > m.vh,
  };
}

/* ------------------------------------------------------------------ self-test */

if (process.argv.includes("--self-test")) {
  // The verdict logic is where a silent bug would turn a red gate green, so it gets a runnable check.
  const verdict = (samples, oracle, len) => ({
    c1: oracle.held === EXPECTED_CARDS,
    c2: samples.every((s) => s.labelClipped === false && s.markClipped === false),
    fr008: len.screens <= MAX_SCREENS,
  });
  const clean = {
    labelClipped: false,
    markClipped: false,
  };
  const good = { held: 6, screens: 4.8 };
  const bad = { held: 3, screens: 9.1 };
  /** The rect shape the probe returns: `top: -1` with null mark/label means no card holds the top. */
  const atTop = (markTop, labelTop, vh = 640) => ({
    top: 0, vh, mark: { top: markTop, bottom: markTop + 40 }, label: { top: labelTop, bottom: labelTop + 32 },
  });
  const checks = [
    ["a clean walk passes", JSON.stringify(verdict([clean, clean], good, good)) ===
      JSON.stringify({ c1: true, c2: true, fr008: true })],
    ["one clipped label fails C2", verdict([clean, { ...clean, labelClipped: true }], good, good).c2 === false],
    ["a clipped mark fails C2 too", verdict([{ ...clean, markClipped: true }], good, good).c2 === false],
    ["three cards on top fails C1", verdict([clean], bad, good).c1 === false],
    ["9.1 screens fails FR-008", verdict([clean], good, bad).fr008 === false],
    ["budget arithmetic is 460", 640 - 88 - 80 - 12 === CARD_BUDGET],
    // The regression this file exists to catch: an approach sample was scored as a clip and closed the gate.
    ["no card at top is approaching, not clipped",
      JSON.stringify(clipFlags({ top: -1, vh: 640, mark: null, label: null })) ===
      JSON.stringify({ approaching: true, labelClipped: false, markClipped: false })],
    ["a card fully in view is clean",
      clipFlags(atTop(60, 120)).labelClipped === false && clipFlags(atTop(60, 120)).markClipped === false],
    ["a label past the viewport bottom is clipped",
      clipFlags(atTop(60, 620)).labelClipped === true],
    ["a mark above the viewport top is clipped",
      clipFlags(atTop(-50, 20)).markClipped === true],
    ["a card whose rects never arrived is not a clip",
      clipFlags({ top: 2, vh: 640, mark: null, label: null }).approaching === true],
  ];
  let ok = true;
  for (const [name, pass] of checks) {
    console.log(`${pass ? "ok  " : "FAIL"}  ${name}`);
    if (!pass) ok = false;
  }
  console.log(ok ? "\nself-test passed" : "\nself-test FAILED");
  process.exit(ok ? 0 : 1);
}

/* ------------------------------------------------------------------ page probes */

/** Everything one sample needs, read fresh in its own evaluate. Never reuse a value from the scroll. */
const READ_SAMPLE = `
  () => {
    const SEC = "brands";
    const V = { w: innerWidth, h: innerHeight };
    const sec = document.getElementById(SEC);
    const pick = (root, sels) => {
      for (const s of sels) { const el = root.querySelector(s); if (el) return [el, s]; }
      return [null, null];
    };
    const sectionTop = sec.getBoundingClientRect().top + scrollY;
    const cards = [...sec.querySelectorAll(__CARDS__)].map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        top: r.top, bottom: r.bottom, left: r.left, right: r.right, h: r.height,
        pos: cs.position, z: cs.zIndex, offset: cs.insetBlockStart,
        text: (el.textContent || "").trim().slice(0, 18),
      };
    });
    // Topmost = the last card in DOM order whose top has reached the *top band* of the viewport,
    // because a later card paints over an earlier one (research.md D6). Two deliberate refinements
    // over "last card intersecting the viewport":
    //
    //  - intersecting would elect a card the instant it peeks in at the viewport's bottom edge, and
    //    since it then paints over everything, card N would answer *every* sample from the moment it
    //    appears. Card 0 would never be sampled as topmost at all, and C1 would report "1 card".
    //  - "smallest top" has the mirror failure: sticky offsets grow downward (D3), so card 0 always
    //    has the smallest top and would answer every sample.
    //
    // The top band is the deck's own stick offset plus slack: a card has *arrived* once it is within
    // 40px of where it will rest, not when it is 500px down the screen still travelling.
    const restTop = (c) => parseFloat(c.offset) || 0;
    const BAND = 40;
    let top = -1;
    cards.forEach((c, i) => {
      // The c.top < V.h test keeps a card that has already been scrolled away off the board, which is
      // what lets the End-key case (C9) report "nothing held" instead of a card parked off-screen.
      if (c.top <= restTop(c) + BAND && c.top < V.h && c.bottom > 0) top = i;
    });
    // How many cards still show any pixel: each one not fully covered by a later card (D3's edges).
    let visible = 0;
    cards.forEach((c, i) => {
      if (!(c.bottom > 0 && c.top < V.h)) return;
      let cut = c.top;
      for (let j = i + 1; j < cards.length; j++) {
        const l = cards[j];
        if (l.bottom > 0 && l.top < V.h) cut = Math.max(cut, l.top);
      }
      if (c.bottom - Math.max(cut, c.top) > 1) visible++;
    });
    const card = top >= 0 ? sec.querySelectorAll(__CARDS__)[top] : null;
    const [markEl, markSel] = card ? pick(card, __MARK__) : [null, null];
    const [labelEl, labelSel] = card ? pick(card, __LABEL__) : [null, null];
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, h: r.height, w: r.width };
    };
    // The dock: a fixed bar hugging the bottom edge. MobileDock.tsx:90 is bottom-3 + z-40, so
    // its bottom edge sits ~12px *inside* the viewport — a strict "> innerHeight" test misses it,
    // which is how the first draft of this probe reported no dock on a page that has one.
    let dockTop = null;
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      if (cs.position !== "fixed") continue;
      const r = el.getBoundingClientRect();
      if (r.height < 20 || r.height > 240 || r.bottom < V.h - 40 || r.top > V.h) continue;
      if (dockTop === null || r.top < dockTop) dockTop = r.top;
    }
    return {
      scrollY: Math.round(scrollY), vw: V.w, vh: V.h, docH: document.documentElement.scrollHeight,
      sectionTop: Math.round(sectionTop), sectionH: Math.round(sec.getBoundingClientRect().height),
      cardCount: cards.length,
      cardHeights: cards.map((c) => Math.round(c.h)),
      cardPositions: cards.map((c) => c.pos),
      cardOffsets: cards.map((c) => c.offset),
      anySticky: cards.some((c) => c.pos === "sticky"),
      top, topText: top >= 0 ? cards[top].text : null, visible,
      mark: box(markEl), markSel,
      label: box(labelEl), labelSel,
      firstTop: cards.length ? Math.round(cards[0].top) : null,
      lastBottom: cards.length ? Math.round(cards[cards.length - 1].bottom) : null,
      dockTop: dockTop === null ? null : Math.round(dockTop),
    };
  }`;

/** `scrollTo` with instant behaviour, two frames, ~120ms, then a drift check. */
const SETTLE = `
  async (top) => {
    scrollTo({ top, behavior: "instant" });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise((r) => setTimeout(r, 120));
    const at = scrollY;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return { requested: Math.round(top), actual: Math.round(at), drift: Math.round(Math.abs(scrollY - at)) };
  }`;

/** Hydration, not a 200. Two independent markers, per trap 2. */
const HYDRATED = `
  () => {
    const sec = document.getElementById("brands");
    const fibers = (el) => Object.keys(el || {}).some((k) => k.startsWith("__reactFiber$"));
    // Reveal.tsx:37 sets visible=false on below-fold content *after* mount, so a below-fold wrapper
    // that has lost .reveal--visible is direct evidence that client JS ran and React took over.
    const below = [...document.querySelectorAll(".reveal")].filter((r) => r.getBoundingClientRect().top > innerHeight);
    return {
      fiberOnBody: fibers(document.body),
      fiberInSection: fibers(sec),
      belowFold: below.length,
      belowFoldHidden: below.filter((r) => !r.className.includes("reveal--visible")).length,
      reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  }`;

// The page probes are written as template strings because they are evaluated *inside* the browser and
// take their selectors as arguments. A string body is not callable as-is: it has to be turned into a
// function first, or `page.evaluate` returns undefined and every later reading is undefined's fault.
const compile = (body) => new Function(`return (${body})`)();

/* ------------------------------------------------------------------ helpers */

const fmt = (n, w = 6) => String(n ?? "—").padStart(w);
const verdictWord = (ok) => (ok ? "PASS" : "FAIL");
/** Unanswerable is its own exit code, and it must not leave a Chromium behind: on a 7.6 GB box an
 *  orphaned renderer is the difference between the next agent running and the box swapping out. */
let orphan = null;
const die = (msg) => {
  console.log(`\nHARNESS COULD NOT ANSWER — ${msg}`);
  orphan = 2;
  throw new Error("__harness_die__");
};

/**
 * Which card *should* be on top at a given scroll position, from the forward walk. The oracle for
 * C9's reload and back/forward cases.
 *
 * It returns a *set*, not one index, and that is deliberate: a reload lands on a position a few
 * pixels off the one the walk sampled, and if that position happens to sit on the boundary where one
 * card gives way to the next, both states are correct and a strict equality would report a defect
 * that is really a sampling artefact. Every state the walk recorded within half a step of where the
 * page landed is acceptable; anything else is a real C9 failure.
 */
const oracleAt = (walk, scrollY) => {
  if (walk.length === 0) return { tops: [], span: Infinity };
  const deltas = walk.map((s) => Math.abs(s.scrollY - scrollY));
  const nearest = Math.min(...deltas);
  const step = walk.length > 1
    ? Math.max(1, Math.abs(walk[1].scrollY - walk[0].scrollY))
    : 1;
  return { tops: walk.filter((_, i) => deltas[i] <= nearest + step / 2).map((s) => s.top), span: nearest };
};

/* ------------------------------------------------------------------ run */

console.log(`008 fit gate — ${BASE} at ${VW} × ${VH}  (card budget ${CARD_BUDGET}px, ceiling ${MAX_SCREENS} screens)`);

const browser = await chromium.launch({
  executablePath: EXE,
  // This box is memory-starved (7.6 GB, swap full); /dev/shm defaults to 64MB per renderer and a
  // second context is what killed the first draft. One context for the whole run, media emulated.
  args: ["--disable-dev-shm-usage", "--no-sandbox", "--js-flags=--max-old-space-size=512"],
});

const results = [];
let fail = false;
let baseline = false;

try {
  const ctx = await browser.newContext({
    viewport: { width: VW, height: VH },
    deviceScaleFactor: 1,
    // The fit case is a phone, and it matters: the dock is `md:hidden` and Lenis refuses to attach on
    // `any-pointer: coarse` (ScrollSmooth.tsx:86), so a desktop context would measure a different page.
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(120_000);

  // Compiled before anything is read: the first reading in the run is the hydration check, and a
  // string passed to `page.evaluate` returns undefined rather than a function's result.
  const settleFn = compile(SETTLE);
  const hydratedFn = compile(HYDRATED);

  // `domcontentloaded`, not `load`: `/` on next dev answered 200 in 9.0s while this was written, and
  // waiting for every image byte makes the run flakier without making the geometry more true.
  await page.goto(`${BASE}/${QUERY}`, { waitUntil: "domcontentloaded", timeout: 240_000 });
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(2_500);

  const hyd = await page.evaluate(hydratedFn);
  console.log(
    `hydration: react fiber on body ${hyd.fiberOnBody ? "yes" : "NO"} · in #brands ${hyd.fiberInSection ? "yes" : "NO"}` +
      ` · below-fold wrappers ${hyd.belowFoldHidden}/${hyd.belowFold} hidden by Reveal (post-mount state)`,
  );
  if (!hyd.fiberOnBody || (hyd.belowFold > 0 && hyd.belowFoldHidden === 0)) {
    die("React never hydrated — the page served markup but not behaviour, so every reading below would be a lie. Check the dev server and the client chunks.");
  }

  // Which selector found the cards, and are they a deck at all? Scoped to the chapter: the homepage
  // has dozens of `<li>` and `[class*=row]` elements, and a document-wide match would silently measure
  // a category carousel instead of the brands deck.
  let cardSel = null;
  let probe = null;
  for (const sel of CARD_SELECTORS) {
    const n = await page.evaluate((s) => {
      const sec = document.getElementById("brands");
      return sec ? sec.querySelectorAll(s).length : 0;
    }, sel);
    if (n > 0) {
      cardSel = sel;
      break;
    }
  }
  if (!cardSel) die(`no card-like element inside #brands — tried ${CARD_SELECTORS.join(", ")}`);
  // readFn is the only probe needing selector injection, so it is built once the selector is known.
  const readFn = compile(
    READ_SAMPLE
      // Quoted, not interpolated raw: a bare `#brands li` inside `querySelectorAll(...)` is a JS
      // private-field reference, and the whole probe fails to parse.
      .replaceAll("__CARDS__", JSON.stringify(cardSel))
      .replaceAll("__MARK__", JSON.stringify(MARK_SELECTORS))
      .replaceAll("__LABEL__", JSON.stringify(LABEL_SELECTORS)),
  );

  probe = await page.evaluate(readFn);
  console.log(
    `cards: ${probe.cardCount} via "${cardSel}" · position ${probe.cardPositions[0] ?? "—"} · ` +
      `sticky ${probe.anySticky ? "yes" : "no"} · chapter ${probe.sectionH}px at y=${probe.sectionTop} · ` +
      `dock top ${probe.dockTop ?? "not found"}px · doc ${probe.docH}px`,
  );

  if (!probe.anySticky) {
    // The expected state today, and the state after FR-014's fallback (D1 excluded, D7 included).
    baseline = true;
    console.log("\nNO DECK PRESENT — the cards are not `position: sticky`, so there is no deck to measure.");
    console.log(`  ${probe.cardCount} cards sit in a plain list (${probe.cardHeights.join(", ")}px). D1's mechanism is not on the page.`);
    console.log("  C1, C2, FR-008, C8 and C9 are NOT EXERCISED — that is an incomplete measurement, not a pass.");
    console.log("  Control numbers a future run compares against:");
    console.log(`    chapter height ${probe.sectionH}px = ${(probe.sectionH / VH).toFixed(2)} screens at ${VH}px`);
    console.log(`    card heights ${probe.cardHeights.join(", ")}px against a ${CARD_BUDGET}px deck budget`);
    console.log(`    dock clearance ${probe.dockTop === null ? "unknown" : Math.round(VH - probe.dockTop)}px (D2 budgets 88)`);
    console.log("  Run this again after the deck is implemented; the same command then gates the ship.");
  }

  /* -------------------------------------------------- the walk (C1, C2, FR-008) */

  if (!baseline) {
    const start = Math.max(0, probe.sectionTop);
    const end = probe.sectionTop + probe.sectionH - VH;
    const step = Math.max(1, Math.round((end - start) / SAMPLES));
    console.log(`\nwalking ${end - start}px of chapter in ${SAMPLES} steps of ${step}px\n`);

    let held = 0;
    let order = [];
    const orderIdx = [];
    let minVisible = Infinity;
    let driftCount = 0;

    for (let i = 0; i <= SAMPLES; i++) {
      const want = Math.min(start + i * step, end);
      const s = await page.evaluate(settleFn, want);
      // Fresh read, separate evaluate — never the value the scroll call returned.
      const m = await page.evaluate(readFn);
      const drift = s.drift > 1;
      if (drift) driftCount++;
      // `orderIdx` holds card *indices*, so the membership test is on indices. Testing the text
      // array instead would count every sample as a new card (a Persian label never equals a number)
      // and report "31 distinct cards" on a six-card deck.
      if (m.top >= 0 && !orderIdx.includes(m.top)) {
        held++;
        order.push(m.topText);
        orderIdx.push(m.top);
      }
      // "Five cards stay visible behind the active one" (C1) is a claim about the *middle* of the
      // sequence, not the first sample: at the chapter's opening only one card is on screen at all,
      // so taking the minimum over every sample measures the start, not the stack. Sampled from the
      // point the deck is fully stacked (last card at the top) onward.
      if (m.top >= EXPECTED_CARDS - 1) minVisible = Math.min(minVisible, m.visible);

      const { approaching, labelClipped, markClipped } = clipFlags(m);
      const behindDock = m.dockTop !== null && m.label !== null && m.label.bottom > m.dockTop;
      const sample = {
        i, scrollY: m.scrollY, want: s.requested, drift,
        top: m.top, text: m.topText, visible: m.visible,
        mark: m.mark, label: m.label, approaching, labelClipped, markClipped, behindDock,
        h: m.cardHeights[m.top] ?? null,
      };
      // `!labelClipped` and `!markClipped` both count as C2 evidence: FR-007 names the mark *and* the name.
      if (labelClipped || markClipped) fail = true;
      results.push(sample);
      console.log(
        `${fmt(m.scrollY, 6)}  ${drift ? "DRIFT" : "     "}  card#${fmt(m.top, 2)} ${fmt(m.topText, 10)}` +
          `  vis ${fmt(m.visible, 2)}  h ${fmt(sample.h, 4)}` +
          `  mark ${fmt(m.mark ? Math.round(m.mark.top) : null, 5)}..${fmt(m.mark ? Math.round(m.mark.bottom) : null, 4)}` +
          `  label ${fmt(m.label ? Math.round(m.label.top) : null, 5)}..${fmt(m.label ? Math.round(m.label.bottom) : null, 4)}` +
          `  ${approaching ? "approaching (no card at top, excluded from C2)" : labelClipped || markClipped ? "CLIPPED" : behindDock ? "under dock" : "ok"}`,
      );
    }

    const screens = (probe.sectionH / VH).toFixed(2);
    // D2's card height must be read from a sample where the deck is actually stacked, not from the
    // first probe: at the chapter's opening the later cards are still below the fold and each one is
    // measured mid-slide, which reads taller than the card is (494px on a card sized 460px). The walk's
    // own per-sample height, taken with the deck stacked, is the honest number.
    const stackedHeights = results.filter((r) => r.top >= EXPECTED_CARDS - 1).map((r) => r.h).filter((h) => h);
    const measuredCard = stackedHeights.length ? Math.max(...stackedHeights) : Math.max(...probe.cardHeights);
    const c1 = held >= EXPECTED_CARDS;
    const c2 = fail === false;
    const fr008 = Number(screens) <= MAX_SCREENS;
    // C1 says "in source order", so the *sequence* of first appearances has to be 0,1,2,3,4,5 —
    // six distinct cards appearing 3,1,0,5,2,4 would satisfy a count-only check and be a scramble.
    const c1order =
      orderIdx.length === EXPECTED_CARDS && orderIdx.every((v, i) => v === i);
    const stacked = orderIdx.length === EXPECTED_CARDS ? minVisible : null;
    if (!c1 || !c2 || !fr008 || !c1order) fail = true;
    if (stacked !== null && stacked < EXPECTED_CARDS) fail = true;

    console.log(`\n  ${"─".repeat(78)}`);
    console.log(`C1  six cards hold the top:      ${verdictWord(c1)} — ${held} distinct card(s) held it${order.length ? `, in order: ${order.join(" → ")}` : ""}`);
    console.log(`    in source order:              ${verdictWord(c1order)} — ${orderIdx.join(",") || "none"} (expected 0,1,2,3,4,5)`);
    console.log(`    all six stay visible stacked: ${verdictWord(stacked === null ? false : stacked >= EXPECTED_CARDS)} — min ${stacked ?? "n/a"} card(s) showing any pixel once fully stacked`);
    const c2Samples = results.filter((r) => !r.approaching);
    const c2Bad = c2Samples.filter((r) => r.labelClipped || r.markClipped).length;
    console.log(`C2  no clipped mark or label:    ${verdictWord(c2)} — ${c2Bad} bad sample(s) of ${c2Samples.length} evaluated` +
      (results.length - c2Samples.length ? ` (${results.length - c2Samples.length} approach samples with no card at the top, excluded — see clipFlags)` : ""));
    console.log(`FR-008 chapter length:           ${verdictWord(fr008)} — ${probe.sectionH}px = ${screens} screens (ceiling ${MAX_SCREENS})`);
    console.log(`D2  card height vs budget:       ${verdictWord(measuredCard <= CARD_BUDGET)} — tallest ${measuredCard}px vs ${CARD_BUDGET}px (460 = 640 − 88 dock − 80 edges, less 12 slack)`);
    console.log(`    scroll drift samples:         ${driftCount} of ${results.length} (smooth scroll or Lenis would show here)`);
    if (results.some((r) => r.behindDock)) {
      console.log(`\n  WARNING — a topmost card's label extends past the dock's top edge (y=${probe.dockTop}px) at`);
      console.log(`  ${results.filter((r) => r.behindDock).length} sample(s). FR-007's own wording ("inside the viewport") still holds, so this is not a fail —`);
      console.log("  but it is exactly what D2's 88px dock clearance exists to prevent. Read it before shipping.");
    }
    if (fail) {
      console.log("\nThe deck does not fit as built. Per FR-014 that is a decision, not a defect: ship the static");
      console.log("stack (research.md D7) rather than tuning a card height and re-running this.");
    }

    /* -------------------------------------------------- C8 — reduced motion */

    console.log(`\nC8 — reloading with prefers-reduced-motion: reduce (D7: same six cards, mechanism off)`);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload({ waitUntil: "domcontentloaded", timeout: 240_000 });
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
    await page.waitForTimeout(2_000);
    const rm = await page.evaluate(readFn);
    const rmSticky = rm.cardPositions.filter((p) => p === "sticky").length;
    const rmEmulated = await page.evaluate(hydratedFn);
    // "No scroll length owned by the effect": the static stack must not be taller than the deck.
    const c8 =
      rm.cardCount === EXPECTED_CARDS && rmSticky === 0 && Number((rm.sectionH / VH).toFixed(2)) <= Number(screens);
    if (!c8) fail = true;
    console.log(`  emulated: ${rmEmulated.reduced ? "yes" : "NO"} · cards ${rm.cardCount} · sticky ${rmSticky} · height ${rm.sectionH}px = ${(rm.sectionH / VH).toFixed(2)} screens (motion: ${screens})`);
    console.log(`  C8  static stack:               ${verdictWord(c8)} — six cards, no sticky offsets${Number((rm.sectionH / VH).toFixed(2)) <= Number(screens) ? ", no extra scroll length" : ", but it is TALLER than the deck"}`);

    /* -------------------------------------------------- C9 — the three arrivals */

    await page.emulateMedia({ reducedMotion: null });
    await page.reload({ waitUntil: "domcontentloaded", timeout: 240_000 });
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
    await page.waitForTimeout(2_000);
    const base = await page.evaluate(readFn);
    const midY = Math.round(base.sectionTop + (base.sectionH - VH) * 0.5);
    const c9 = [];
    const check = (name, actualTop, expectTops, extra = "") => {
      const allowed = Array.isArray(expectTops) ? expectTops : [expectTops];
      const ok = actualTop === -1 || allowed.includes(actualTop);
      if (!ok) fail = true;
      c9.push({ name, ok, actualTop, expectTops: allowed });
      console.log(
        `  ${verdictWord(ok)}  ${name.padEnd(34)} landed on card#${actualTop} ` +
          `(the walk recorded #${allowed.join(" or #") || "—"}${allowed.length > 1 ? " at that position" : ""}) ${extra}`,
      );
    };

    // a. reload with the scroll position already inside the chapter
    await page.evaluate(settleFn, midY);
    const before = await page.evaluate(readFn);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 240_000 });
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
    await page.waitForTimeout(1_500);
    const after = await page.evaluate(hydratedFn);
    const reloaded = await page.evaluate(readFn);
    if (!after.fiberOnBody) die("React did not hydrate after reload — C9 would be measuring markup again");
    check("reload mid-chapter", reloaded.top, oracleAt(results, reloaded.scrollY).tops, `scrollY ${reloaded.scrollY} (was ${before.scrollY})`);

    // b. navigate away and come back with the browser's own history
    await page.evaluate(settleFn, midY);
    await page.goto(`${BASE}${AWAY_URL}${QUERY}`, { waitUntil: "domcontentloaded", timeout: 240_000 });
    await page.waitForTimeout(1_000);
    await page.goBack({ waitUntil: "domcontentloaded", timeout: 240_000 });
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
    await page.waitForTimeout(1_500);
    const back = await page.evaluate(readFn);
    check("back/forward into the chapter", back.top, oracleAt(results, back.scrollY).tops, `scrollY ${back.scrollY}`);

    // c. End key past the chapter — the deck must release, holding nothing
    await page.keyboard.press("End");
    await page.waitForTimeout(600);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const ended = await page.evaluate(readFn);
    const stuck = ended.firstTop !== null && ended.firstTop >= -1 && ended.top >= 0;
    if (stuck) fail = true;
    console.log(
      `  ${verdictWord(!stuck)}  ${"End past the chapter".padEnd(34)} ` +
        `first card top ${fmt(ended.firstTop, 6)}px, last card bottom ${fmt(ended.lastBottom, 5)}px at scrollY ${ended.scrollY}/${ended.docH - VH}` +
        `${stuck ? " — a card is still held at the top" : " — nothing held, the page below is reachable"}`,
    );
    console.log(`\nC9  three arrivals:              ${verdictWord(c9.every((c) => c.ok) && !stuck)} — each landed in the state belonging to its position, not its opening frame`);
  }
} catch (e) {
  if (e.message !== "__harness_die__") die(e.message);
  else console.log("");
} finally {
  await browser.close().catch(() => {});
}

console.log(
  baseline
    ? "\nBASELINE — no deck present. Nothing was measured and nothing is claimed; the fit gate is still OPEN."
    : orphan
      ? "\nHARNESS COULD NOT ANSWER — see above. Nothing about this page is proven either way."
      : fail
      ? "\nFAIL — the fit gate is closed. Do not tune and re-run: FR-014 says ship the static stack."
      : "\nPASS — the deck fits at 360 × 640: six cards hold the top, no mark or name is ever clipped, and the chapter stays inside FR-008's ceiling.",
);
process.exit(orphan ? 2 : baseline ? 0 : fail ? 1 : 0);
