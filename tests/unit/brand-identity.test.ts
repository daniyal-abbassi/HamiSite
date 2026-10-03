import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Feature 011 — brand card identity, asserted from data alone (contracts R3-R8 are "provable"
 * clauses: no DOM, no browser). Written failing first, per tasks.md T004: this file was red because
 * `@/lib/brand-identity` did not exist, and every assertion in it names a rule from
 * `specs/011-brand-card-identity/data-model.md` or `contracts/brand-identity.md`.
 *
 * The evidence limits live in `specs/011-brand-card-identity/research/brand-identity-sources.md`;
 * that file is the source of truth for every colour claim and every line — if a number here wants
 * to be something the evidence does not say, the evidence wins.
 */

const ROOT = path.resolve(__dirname, "../..");
const MODULE = path.join(ROOT, "lib/brand-identity.ts");

type Identity = import("@/lib/brand-identity").BrandIdentity;
type Envelope = import("@/lib/brand-identity").IdentityEnvelope;
const identity: Promise<{
  BRAND_IDENTITIES: readonly Identity[];
  IDENTITY_ENVELOPE: Envelope;
  UNVERIFIED_SLOGANS: readonly string[];
  FORBIDDEN_FRAMINGS: Readonly<Record<string, readonly string[]>>;
  cardGroundOkLCH: (name: string) => string;
  cardAccentOkLCH: (name: string) => string;
}> = import("@/lib/brand-identity");

/* ---------------------------------------------------------------- oklch → WCAG contrast (T005)
   OKLCH → Oklab (polar→Cartesian) → LMS → linear sRGB → gamma-encoded sRGB → relative luminance →
   contrast ratio. The whole chain is Björn Ottosson's Oklab; nothing in it is fitted to taste. */

const s2l = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

/** oklch(L C H) → linear sRGB triple, may be out of gamut (caller clamps). */
function oklchToLinear(L: number, C: number, Hdeg: number): [number, number, number] {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    4.0767416688 * l - 3.3077115913 * m + 0.2315030823 * s,
    -1.2684380053 * l + 2.6097574011 * m - 0.3413537970 * s,
    -0.0041960866 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

function hexToLinear(hex: string): [number, number, number] {
  return [
    s2l(parseInt(hex.slice(1, 3), 16)),
    s2l(parseInt(hex.slice(3, 5), 16)),
    s2l(parseInt(hex.slice(5, 7), 16)),
  ];
}

const relLum = ([r, g, b]: [number, number, number]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function contrast(l1: number, l2: number): number {
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Parse the module's `oklch(L C H)` string into a linear triple (clamped for out-of-gamut). */
function parseOkLCH(s: string): [number, number, number] {
  const m = /^oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\)$/.exec(s.trim());
  if (!m) throw new Error(`not an oklch(L C H) string: ${s}`);
  return oklchToLinear(+m[1], +m[2], +m[3]).map((v) => Math.max(0, Math.min(1, v))) as [number, number, number];
}

/** Parse an `oklch(L C H)` string into its numbers. */
function oklchParts(s: string): { L: number; C: number; H: number } {
  const m = /^oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\)$/.exec(s.trim());
  if (!m) throw new Error(`not an oklch(L C H) string: ${s}`);
  return { L: +m[1], C: +m[2], H: +m[3] };
}

const CREAM = "#f0ece9";
const CHAMPAGNE = "#e5d3b3";

describe("011 brand identity — the module exists (T004 precondition)", () => {
  it("lib/brand-identity.ts is on disk", () => {
    expect(existsSync(MODULE)).toBe(true);
  });
});

describe("011 identity records (T004)", () => {
  it("has exactly six records, keyed by the same six names brandWall uses", async () => {
    const { BRAND_IDENTITIES } = await identity;
    const wallNames = ["APPLE", "SAMSUNG", "XIAOMI", "NOKIA", "REALME", "TCH"];
    expect(BRAND_IDENTITIES.map((r) => r.name)).toEqual(wallNames);
  });

  it("data-model.md rule 1, verbatim — “Six records, six lines, six sources. Zero blanks, zero unsourced lines.”", async () => {
    const { BRAND_IDENTITIES } = await identity;
    expect(BRAND_IDENTITIES).toHaveLength(6);
    for (const r of BRAND_IDENTITIES) {
      expect(r.line, `line for ${r.name}`).toBeTruthy();
      // A line may rest on a public URL or on the shop's own catalogue export. The TCH row is
      // the second kind, and that is the honest answer, not a loophole: nothing outside this
      // repository has been evidenced about that maker since 2026-09-27 established it is not
      // the company the research had assumed. Anything else is not a source.
      expect(r.lineSource.url, `lineSource.url for ${r.name}`).toMatch(/^(https?:\/\/|data\/[\w. -]+\.json$)/);
      expect(r.lineSource.checkedAt, `lineSource.checkedAt for ${r.name}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("data-model.md rule 2, verbatim — “`hueFamily: \"none\"` requires `placement: \"house\"` — an unsourced maker cannot carry a hue, and must not quietly receive one because the row was left blank”", async () => {
    const { BRAND_IDENTITIES } = await identity;
    for (const r of BRAND_IDENTITIES) {
      if (r.hueFamily === "none") {
        expect(r.placement, `${r.name}: hueless must sit in the house, not a hue`).toBe("house");
        expect(r.chroma, `${r.name}: hueless ground carries no chroma`).toBe(0);
      }
    }
    // …and the converse guard: nothing with a hue may hide in the house.
    for (const r of BRAND_IDENTITIES) {
      if (r.placement === "house") expect(r.hueFamily).toBe("none");
    }
  });

  it("the two blues are within 25° of hue of each other and differ by placement, not value (rule 6)", async () => {
    const { BRAND_IDENTITIES, cardGroundOkLCH } = await identity;
    const blues = BRAND_IDENTITIES.filter((r) => r.hueFamily === "blue");
    expect(blues.map((r) => r.name).sort()).toEqual(["NOKIA", "SAMSUNG"]);
    const [a, b] = blues;
    const hueDiff = Math.abs(oklchParts(cardGroundOkLCH(a.name)).H - oklchParts(cardGroundOkLCH(b.name)).H);
    expect(Math.min(hueDiff, 360 - hueDiff)).toBeLessThanOrEqual(25);
    expect(a.placement).not.toBe(b.placement);
  });

  it("the two hueless records are measurably different from each other (rule 7)", async () => {
    const { BRAND_IDENTITIES, cardGroundOkLCH } = await identity;
    const hueless = BRAND_IDENTITIES.filter((r) => r.hueFamily === "none" || r.hueFamily === "monochrome");
    expect(hueless).toHaveLength(2);
    const [apple, tch] = hueless;
    // Distance is measured in Oklab — the space the envelope itself is written in, and
    // where "visibly different" has a number. sRGB triples are the wrong ruler here:
    // the first cut of this assertion compared RGB and scored the difference as ~0.
    const pa = oklchParts(cardGroundOkLCH(apple.name));
    const pb = oklchParts(cardGroundOkLCH(tch.name));
    const rad = (d: number) => (d * Math.PI) / 180;
    const da = pa.C * Math.cos(rad(pa.H)) - pb.C * Math.cos(rad(pb.H));
    const db = pa.C * Math.sin(rad(pa.H)) - pb.C * Math.sin(rad(pb.H));
    const delta = Math.hypot(pa.L - pb.L, da, db);
    expect(delta, "Apple's neutral vs TCH's house must be visibly different in Oklab space").toBeGreaterThan(0.02);
  });
});

describe("011 blocklists as data, not prose (T007)", () => {
  /** Case- and script-insensitive: blocked strings must not survive a Latin/Persian shuffle. */
  const norm = (s: string) => s.toLowerCase().normalize("NFKC").replace(/\u200c/g, "");

  it("UNVERIFIED_SLOGANS holds the two famous, unverifiable slogans and their Persian renderings", async () => {
    const { UNVERIFIED_SLOGANS } = await identity;
    expect(UNVERIFIED_SLOGANS.map(norm)).toEqual(
      expect.arrayContaining(["think different", "connecting people", "تفکر را متفاوت کن", "ارتباطات انسانی", "اتصال افراد"]),
    );
  });

  it("no blocked string appears in any rendered field of any record (rules 1 and 5, together)", async () => {
    const { BRAND_IDENTITIES, UNVERIFIED_SLOGANS, FORBIDDEN_FRAMINGS } = await identity;
    const blocked = [...UNVERIFIED_SLOGANS, ...Object.values(FORBIDDEN_FRAMINGS).flat()];
    for (const r of BRAND_IDENTITIES) {
      // The *rendered* fields only — name and line. `makerSlogan` is metadata by D6 and
      // may legitimately contain a real slogan; asserting against it would test the wrong thing.
      for (const text of [r.name, r.line]) {
        for (const b of blocked) {
          if (norm(b) === norm(r.name)) continue;
          expect(norm(text), `${r.name}: rendered field "${text}" contains blocked "${b}"`).not.toContain(norm(b));
        }
      }
      // The line must not carry the maker's own blocked framings either.
      for (const b of FORBIDDEN_FRAMINGS[r.name] ?? []) {
        expect(norm(r.line), `${r.name}: line contains its own blocked framing "${b}"`).not.toContain(norm(b));
      }
    }
  });

  it("FORBIDDEN_FRAMINGS is keyed by maker exactly as data-model.md tabulates", async () => {
    const { FORBIDDEN_FRAMINGS } = await identity;
    expect(Object.keys(FORBIDDEN_FRAMINGS).sort()).toEqual(["APPLE", "NOKIA", "REALME", "SAMSUNG", "TCH"]);
    expect(FORBIDDEN_FRAMINGS.REALME.join(" ")).toContain("مستقل");
    expect(FORBIDDEN_FRAMINGS.SAMSUNG.join(" ")).toContain("بزرگ‌ترین سازنده گوشی جهان");
  });

  it("the one safe slogan is stored as metadata and not rendered anywhere (D6)", async () => {
    const { BRAND_IDENTITIES } = await identity;
    const slogans = BRAND_IDENTITIES.filter((r) => r.makerSlogan);
    expect(slogans.map((r) => r.name).sort()).toEqual(["REALME"]);
    for (const r of slogans) {
      expect(r.line, `${r.name}: line must not smuggle the maker's slogan onto the card`).not.toContain(r.makerSlogan!.text);
    }
  });

  it("TCH carries no slogan: \u201cThe Creative Life\u201d belongs to a different company (2026-09-27)", async () => {
    // It was recorded as sourced on 2026-09-26 — adopted 2014, via TCL's own About page — and
    // every word of that is true of TCL Technology, which is not the «تی سی اچ» sitting in the
    // catalogue. A correct citation for the wrong subject is the worst kind of evidence, so the
    // field is emptied rather than re-attributed: nothing about this maker's own voice has been
    // verified, and the card must not sound like it has.
    const { BRAND_IDENTITIES } = await identity;
    const tch = BRAND_IDENTITIES.find((r) => r.name === "TCH")!;
    expect(tch.makerSlogan).toBeNull();
    expect(tch.line).not.toMatch(/creative|خلاق/i);
  });
});

describe("011 the palette envelope (T004/T005)", () => {
  it("data-model.md rule 3, verbatim — “Every `C` at or below the ceiling; every `L` inside the band”", async () => {
    const { BRAND_IDENTITIES, IDENTITY_ENVELOPE, cardGroundOkLCH } = await identity;
    for (const r of BRAND_IDENTITIES) {
      const { L, C } = oklchParts(cardGroundOkLCH(r.name));
      expect(L, `${r.name} ground L`).toBeGreaterThanOrEqual(IDENTITY_ENVELOPE.groundLMin);
      expect(L, `${r.name} ground L`).toBeLessThanOrEqual(IDENTITY_ENVELOPE.groundLMax);
      expect(C, `${r.name} ground C`).toBeLessThanOrEqual(IDENTITY_ENVELOPE.groundCMax);
    }
  });

  it("the envelope is the one the research set, not a re-tuned one", async () => {
    const { IDENTITY_ENVELOPE } = await identity;
    expect(IDENTITY_ENVELOPE.groundLMin).toBe(0.17);
    expect(IDENTITY_ENVELOPE.groundLMax).toBe(0.26);
    expect(IDENTITY_ENVELOPE.groundCMax).toBe(0.055);
    expect(IDENTITY_ENVELOPE.accentCMax).toBe(0.11);
  });

  it("the contrast helper answers known pairs before it is trusted on unknown ones (T005 sanity pins)", () => {
    expect(contrast(relLum(hexToLinear("#000000")), relLum(hexToLinear("#ffffff")))).toBeCloseTo(21.0, 1);
    // 008's measured cream-on-deck-ground, from the T008-era run of this same maths.
    const pin = contrast(relLum(hexToLinear(CREAM)), relLum(hexToLinear("#1e0a10")));
    expect(pin).toBeCloseTo(16.16, 1);
  });

  it("data-model.md rule 4, verbatim — “Every computed text-on-ground contrast ≥ 4.5 : 1”", async () => {
    const { BRAND_IDENTITIES, cardGroundOkLCH } = await identity;
    const cream = relLum(hexToLinear(CREAM));
    const champ = relLum(hexToLinear(CHAMPAGNE));
    for (const r of BRAND_IDENTITIES) {
      const g = relLum(parseOkLCH(cardGroundOkLCH(r.name)));
      expect(contrast(cream, g), `${r.name}: cream on ground`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(champ, g), `${r.name}: champagne on ground`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("011 the family is one rule, and 008's mechanism survives (T021: R2, R7-static)", () => {
  it("R2 arithmetic — the spread of ground lightness across the six is ≤ 0.09 and no ground breaks the C ceiling", async () => {
    const { BRAND_IDENTITIES, IDENTITY_ENVELOPE, cardGroundOkLCH } = await identity;
    const parts = BRAND_IDENTITIES.map((r) => oklchParts(cardGroundOkLCH(r.name)));
    const ls = parts.map((p) => p.L);
    expect(Math.max(...ls) - Math.min(...ls), "six grounds must sit in one lightness family").toBeLessThanOrEqual(0.09);
    for (const p of parts) expect(p.C).toBeLessThanOrEqual(IDENTITY_ENVELOPE.groundCMax);
  });

  it("R7 static half — the stylesheet still declares 008's sticky mechanism", () => {
    const css = readFileSync(path.join(ROOT, "app/(main)/home.css"), "utf8");
    const deckBlock = css.slice(css.indexOf("008 brands deck"), css.indexOf("010 categories masonry"));
    expect(deckBlock).toContain("position: sticky");
    expect(deckBlock).toContain("inset-block-start: calc(var(--stack-i");
    const itemRule = /\.brand-deck__item\s*\{[^}]*\}/.exec(deckBlock);
    expect(itemRule, "the .brand-deck__item rule is missing").toBeTruthy();
    expect(itemRule![0], "R7: the item must not become absolutely positioned").not.toContain("position: absolute");
  });
});

describe("011 no invented colour claims (T008, contracts R3/R4)", () => {
  it("each hue-bearing maker sits in its documented family, by hue range", async () => {
    const { BRAND_IDENTITIES } = await identity;
    const ranges: Record<string, [number, number]> = { blue: [250, 290], orange: [40, 80], yellow: [85, 110] };
    for (const r of BRAND_IDENTITIES) {
      if (r.hueFamily in ranges) {
        const [lo, hi] = ranges[r.hueFamily];
        expect(r.hue, `${r.name} hue ${r.hue} outside ${r.hueFamily} [${lo},${hi}]`).toBeGreaterThanOrEqual(lo);
        expect(r.hue, `${r.name} hue ${r.hue} outside ${r.hueFamily} [${lo},${hi}]`).toBeLessThanOrEqual(hi);
      } else {
        expect(["monochrome", "none"]).toContain(r.hueFamily);
      }
    }
  });

  it("no hueSource is `primary` without a URL, and only Xiaomi's is `observed`", async () => {
    const { BRAND_IDENTITIES } = await identity;
    for (const r of BRAND_IDENTITIES) {
      if (r.hueSource.kind === "primary") expect(r.hueSource.url).toMatch(/^https?:\/\//);
    }
    // The evidence found NO primary colour source for any of the six; if someone later
    // upgrades one, they must edit this assertion with the URL in hand — not silently.
    expect(BRAND_IDENTITIES.filter((r) => r.hueSource.kind === "observed").map((r) => r.name)).toEqual(["XIAOMI"]);
    expect(BRAND_IDENTITIES.some((r) => r.hueSource.kind === "primary")).toBe(false);
  });

  it("contract R3, verbatim — “no rendered string, `title`, `aria-label` or comment on the page asserts an official colour”", async () => {
    const { BRAND_IDENTITIES } = await identity;
    const patterns = /official|registered|brand[ -]?colour|brand[ -]?color|رنگ رسمی|رنگ ثبت/;
    const names = BRAND_IDENTITIES.map((r) => r.name);
    // 1. the six records' *rendered* fields. `forbiddenFramings` is deliberately excluded:
    //    those strings are the blocklist itself — asserted absent, never displayed — and a
    //    scan over them would fail on every honest entry ("رنگ رسمی اپل" is blocked
    //    precisely because saying it would break this rule).
    for (const r of BRAND_IDENTITIES) {
      for (const text of [r.line]) {
        if (patterns.test(text)) {
          throw new Error(`R3: "${text}" on ${r.name} asserts or names an official colour`);
        }
      }
    }
    // 2. the component source: no colour literal, no maker+official adjacency, no hex at all
    const src = readFileSync(path.join(ROOT, "components/home/BrandRows.tsx"), "utf8");
    expect(src, "R3/envelope: a hex literal in the component bypasses the envelope").not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(src, "R3: no oklch() literal in the component — values come from lib/brand-identity").not.toMatch(/oklch\(/);
    for (const name of names) {
      const line = src.split("\n").find((l) => l.includes(name) && patterns.test(l));
      expect(line, `R3: "${name}" appears beside an official-colour phrase`).toBeUndefined();
    }
  });

  it("R8 — the stylesheet names no maker", () => {
    const css = readFileSync(path.join(ROOT, "app/(main)/home.css"), "utf8");
    for (const name of ["APPLE", "SAMSUNG", "XIAOMI", "NOKIA", "REALME", "TCH"]) {
      expect(css, `R8: stylesheet names ${name}`).not.toContain(name);
    }
  });
});

describe("011 R8 — the system extends to a seventh maker (T014)", () => {
  const parse = (s: string) => {
    const m = /^oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\)$/.exec(s.trim());
    if (!m) throw new Error(`not an oklch(L C H) string: ${s}`);
    return { L: +m[1], C: +m[2], H: +m[3] };
  };

  it("a seventh record built the same way is inside the envelope — one more row, not a rewrite (FR-017)", async () => {
    const { IDENTITY_ENVELOPE, cardGroundOkLCH } = await identity;
    // Throwaway fixture from `brandWall`'s seventh name (VOCAL), held to the same three
    // ingredients every shipped record was built from: a hue family, a source, a line.
    const fixture = { name: "VOCAL", hue: 150, chroma: 0.05, lightness: 0.21 };
    const { L, C } = parse(`oklch(${fixture.lightness.toFixed(3)} ${fixture.chroma.toFixed(3)} ${fixture.hue.toFixed(0)})`);
    expect(L).toBeGreaterThanOrEqual(IDENTITY_ENVELOPE.groundLMin);
    expect(L).toBeLessThanOrEqual(IDENTITY_ENVELOPE.groundLMax);
    expect(C).toBeLessThanOrEqual(IDENTITY_ENVELOPE.groundCMax);
    expect(cardGroundOkLCH("APPLE"), "the six still resolve").toMatch(/^oklch\(/);
  });

  it("R8 — the deck block of the stylesheet names no maker", () => {
    const css = readFileSync(path.join(ROOT, "app/(main)/home.css"), "utf8");
    const deckBlock = css.slice(css.indexOf("008 brands deck"), css.indexOf("010 categories masonry"));
    expect(deckBlock).not.toBe(""); // the slice found the block at all
    for (const name of ["APPLE", "SAMSUNG", "XIAOMI", "NOKIA", "REALME", "TCH", "VOCAL"]) {
      expect(deckBlock, `R8: the deck block names ${name}`).not.toContain(name);
    }
  });
});

describe("011 six sourced lines, no invented copy (T016)", () => {
  const INVENTED_LINES = [
    "مینیمال، دقیق، بی‌حاشیه.",
    "قدرتی که با جزئیات دیده می‌شود.",
    "فناوری پویا، با انتخابی روشن.",
  ];
  const norm = (s: string) => s.toLowerCase().normalize("NFKC").replace(/\u200c/g, "");

  it("every line is present and Persian (FR-006: required for all six)", async () => {
    const { BRAND_IDENTITIES } = await identity;
    for (const r of BRAND_IDENTITIES) {
      expect(r.line, `${r.name}: line empty`).toBeTruthy();
      expect(/[\u0600-\u06FF]/.test(r.line), `${r.name}: line is not Persian`).toBe(true);
      expect(r.line.length, `${r.name}: line too long for one line at 360`).toBeLessThan(70);
    }
  });

  it("the three invented lines are absent from the identity table and the component", async () => {
    const { BRAND_IDENTITIES } = await identity;
    const src = readFileSync(path.join(ROOT, "components/home/BrandRows.tsx"), "utf8");
    for (const inv of INVENTED_LINES) {
      for (const r of BRAND_IDENTITIES) {
        expect(norm(r.line), `${r.name} reuses invented copy "${inv}"`).not.toContain(norm(inv));
      }
      expect(src, `BrandRows still carries "${inv}"`).not.toContain(inv);
    }
  });

  it("the deck reads its identity from lib/brand-identity and never from the 008 story field", async () => {
    const src = readFileSync(path.join(ROOT, "components/home/BrandRows.tsx"), "utf8");
    // T019: the component must read from lib/brand-identity, and must not render card.story
    expect(src).toContain("BRAND_IDENTITIES");
    expect(src, "card.story is the 008 three-of-six field; 011 lines are six-of-six").not.toMatch(/card\.story/);
  });

  it("blocked framings are absent from every rendered string, not just the data (FR-020, T016)", async () => {
    const { FORBIDDEN_FRAMINGS, UNVERIFIED_SLOGANS } = await identity;
    const src = readFileSync(path.join(ROOT, "components/home/BrandRows.tsx"), "utf8");
    const blocked = [...UNVERIFIED_SLOGANS, ...Object.values(FORBIDDEN_FRAMINGS).flat()];
    for (const b of blocked) {
      expect(norm(src), `BrandRows renders blocked string "${b}"`).not.toContain(norm(b));
    }
  });
});

describe("011 the approved artwork is the whole of the maker imagery (FR-016 as amended 2026-09-27)", () => {
  const ART_DIR = path.join(ROOT, "public/images/brands");

  it("every record carries one distinct artwork under /images/brands/, and the file is on disk", async () => {
    const { BRAND_IDENTITIES } = await identity;
    const srcs = BRAND_IDENTITIES.map((r) => r.artwork.src);
    expect(srcs, "six cards, six artworks — none shares another's picture").toHaveLength(new Set(srcs).size);
    for (const r of BRAND_IDENTITIES) {
      expect(r.artwork.src, `${r.name}: no artwork path`).toMatch(/^\/images\/brands\/[\w-]+\.webp$/);
      expect(
        existsSync(path.join(ROOT, "public", r.artwork.src)),
        `${r.name}: artwork points at ${r.artwork.src}, which is not on disk`,
      ).toBe(true);
      // The intrinsic size is what the browser reserves before the picture arrives. Get it wrong
      // and every card jumps as it loads — a layout shift on the section that stacks.
      expect(Number.isInteger(r.artwork.width) && r.artwork.width > 0, `${r.name}: bad artwork width`).toBe(true);
      expect(Number.isInteger(r.artwork.height) && r.artwork.height > 0, `${r.name}: bad artwork height`).toBe(true);
    }
  });

  it("every artwork the deck serves has its untouched source beside it", async () => {
    // The served files are the owner's PNGs cropped to their own drawn frame — nothing was drawn,
    // stretched or recoloured. The crop is reproducible from the source, so the source stays in
    // the tree and this asserts the pair rather than letting a derivative stand alone.
    const { BRAND_IDENTITIES } = await identity;
    for (const r of BRAND_IDENTITIES) {
      const base = r.artwork.src.split("/").pop()!.replace(/\.webp$/, "");
      expect(existsSync(path.join(ART_DIR, `${base}.png`)), `${r.name}: ${base}.png source is missing`).toBe(true);
    }
  });

  it("nothing sits in public/images/brands that no card uses, beyond its own source", async () => {
    // The inverse check is the one that matters. A folder of approved pictures is the easiest
    // thing on the page to quietly extend — someone generates a seventh, drops it in, and no
    // diff in a source file shows a new asset was added. So the only files allowed here are the
    // six served crops and the six sources they were cut from: twelve, paired.
    const { BRAND_IDENTITIES } = await identity;
    const served = new Set(BRAND_IDENTITIES.map((r) => r.artwork.src.split("/").pop() ?? ""));
    const sources = new Set([...served].filter(Boolean).map((f) => f.replace(/\.webp$/, ".png")));
    const unexpected = readdirSync(ART_DIR).filter((f) => !served.has(f) && !sources.has(f));
    expect(unexpected, `unreferenced files in ${ART_DIR}: ${unexpected.join(", ")}`).toEqual([]);
    expect(readdirSync(ART_DIR)).toHaveLength(12);
  });

  it("the deck paints the artwork and no longer paints the live mark", async () => {
    const src = readFileSync(path.join(ROOT, "components/home/BrandRows.tsx"), "utf8");
    expect(src, "the component must read the artwork off the identity record").toMatch(/ident\.artwork\.src/);
    expect(src, "FR-016 amended: the wordmark is drawn once, by the artwork").not.toMatch(/card\.mark\s+as\s+ReactNode/);
    expect(src, "brand-deck__mark is no longer rendered").not.toContain("brand-deck__mark");
  });

  it("the artwork is the card: no panel around it, no description on it (owner, 2026-09-27)", () => {
    const css = readFileSync(path.join(ROOT, "app/(main)/home.css"), "utf8");
    const deckBlock = css.slice(css.indexOf("008 brands deck"), css.indexOf("010 categories masonry"));
    const cardRule = /\.brand-deck__card\s*\{[^}]*\}/.exec(deckBlock);
    expect(cardRule, "the .brand-deck__card rule is missing").toBeTruthy();
    for (const chrome of ["padding:", "border:", "background:", "box-shadow:", "min-block-size:"]) {
      expect(cardRule![0], `the card still draws its own panel (${chrome})`).not.toContain(chrome);
    }
    expect(deckBlock, "the name must sit on the artwork").toMatch(/\.brand-deck__label\s*\{[^}]*position: absolute/);
    expect(deckBlock, "text over a photograph needs the scrim").toMatch(/\.brand-deck__art::after\s*\{[^}]*background: linear-gradient/);
  });

  it("the sourced description is not rendered, but is still required in the data (FR-006, held back)", async () => {
    // Deleted from the card on the owner's order the same day it shipped. The field stays required
    // and sourced because the rule that produced it — a card may not say about a maker what it
    // cannot support — still binds whoever puts text back on one.
    const src = readFileSync(path.join(ROOT, "components/home/BrandRows.tsx"), "utf8");
    expect(src, "the line was removed by order; nothing may reintroduce it quietly").not.toMatch(/ident\.line|brand-deck__line/);
    const { BRAND_IDENTITIES } = await identity;
    for (const r of BRAND_IDENTITIES) expect(r.line, `${r.name}: line must stay sourced`).toBeTruthy();
  });

  it("the stylesheet stays maker-agnostic with the artwork as the card (R8)", () => {
    const css = readFileSync(path.join(ROOT, "app/(main)/home.css"), "utf8");
    const deckBlock = css.slice(css.indexOf("008 brands deck"), css.indexOf("010 categories masonry"));
    expect(deckBlock).toContain(".brand-deck__art");
    // D8: logical properties only. A physical inset here breaks the RTL deck at review time,
    // not at build time, which is why it is a test and not a note.
    const physical = /(^|[;{[:space:]])(left|right|padding-left|padding-right|margin-left|margin-right|top|bottom)[[:space:]]*:/;
    const artRules = deckBlock.slice(deckBlock.indexOf(".brand-deck__art"), deckBlock.indexOf(".brand-deck__label"));
    expect(artRules, "the art band must use logical properties only").not.toMatch(physical);
  });
});

describe("011 TCH is not TCL Technology (corrected 2026-09-27)", () => {
  it("the record states only what the shop's own shelf shows", async () => {
    const { BRAND_IDENTITIES } = await identity;
    const tch = BRAND_IDENTITIES.find((r) => r.name === "TCH")!;
    expect(tch.line).toContain("این فروشگاه");
    // The sentence that shipped in error, asserted absent by its own words rather than by the
    // blocklist — FORBIDDEN_FRAMINGS already covers those and could be edited along with the
    // line. This cannot be talked out of by re-wording the table.
    expect(tch.line).not.toMatch(/تلویزیون|۱۹۸۱|چینی/);
    expect(tch.hueFamily, "a green picture is not a sourced colour").toBe("none");
    expect(tch.placement).toBe("house");
  });
});
