/**
 * Feature 011 — brand card identity, as data.
 *
 * The six deck cards keep ONE envelope and change only hue (research D1): `L` inside
 * 0.17–0.26, ground `C` ≤ 0.055, accent `C` ≤ 0.11. Because lightness never moves, the
 * cream/champagne text contrast is a single computed figure that covers all six cards
 * (`tests/unit/brand-identity.test.ts` computes it), and the deck's premium register is
 * arithmetic rather than taste.
 *
 * **The hue families come from the evidence; the exact values are Hami's.** No maker here
 * has a citable primary-source brand colour — see
 * `specs/011-brand-card-identity/research/brand-identity-sources.md`, the source of truth
 * this file is written against, and `notes/evidence-map.md` for the per-maker kind of each
 * claim. Only Xiaomi's orange was `observed` on the maker's own markup (`#FF6900` in
 * mi.com/global, 2026-09-26) — and even that is recorded as *observed*, never as official.
 * Samsung's `#1428A0` is aggregator-only and is deliberately absent from this file: the
 * hue below is ours at the family level (266° is where that blue lives), the value is the
 * envelope's, and no string here may ever be labelled the maker's registered colour.
 *
 * **Nothing here renders, and nothing here is a picture — except `artwork`, which is a path.**
 * `BrandRows.tsx` reads this module and emits both the CSS custom properties and the one
 * approved card artwork per maker (FR-016 as amended 2026-09-27, notes/artwork-amendment.md).
 * The stylesheet stays maker-agnostic (R8) and carries no hex (D7): the maker's name is never
 * written in a `.css` file, only in this table.
 */

export type HueFamily = "blue" | "orange" | "yellow" | "monochrome" | "none";
export type HuePlacement = "ground" | "accent" | "house";
export type HueSourceKind = "primary" | "observed" | "aggregator" | "none";

export type CardArtwork = { src: string; width: number; height: number };

export type BrandIdentity = {
  /** Matches `brandWall` exactly — the sixth is a row away, not a rewrite (FR-017). */
  name: string;
  hueFamily: HueFamily;
  hueSource: { url: string; checkedAt: string; kind: HueSourceKind };
  /** Hami's hue in OKLCH degrees, inside the documented family. Never the maker's value. */
  hue: number;
  chroma: number;
  lightness: number;
  placement: HuePlacement;
  /** Our one-line characterisation — not the maker's voice (FR-008). Required, sourced. */
  line: string;
  lineSource: { url: string; checkedAt: string };
  /**
   * Recorded, NEVER rendered (research D6): realme's "Make it real" and TCL's "The
   * Creative Life" are genuinely sourced, but two slogans among four descriptions is not
   * a family (FR-006/FR-012), and a slogan on the shop's page reads as the maker speaking
   * (FR-008). Rendering the two verified ones would train every later editor to render
   * the unverified ones too. The four blocked slogans are in UNVERIFIED_SLOGANS.
   */
  makerSlogan: { text: string; url: string; checkedAt: string } | null;
  /** Persian phrases this maker's card may never carry (FR-020). Asserted by test. */
  forbiddenFramings: readonly string[];
  /**
   * The approved card artwork, rendered as the band at the head of the card (FR-016 as
   * amended 2026-09-27 — see notes/artwork-amendment.md). Its hue is Hami's art direction,
   * NOT evidence: `hueFamily` and `hueSource` still answer for every colour the page states
   * in words, and a green picture buys no colour claim for the maker it shows.
   */
  artwork: CardArtwork;
};

export type IdentityEnvelope = {
  groundLMin: number;
  groundLMax: number;
  groundCMax: number;
  accentCMax: number;
};

/** The one rule, applied to all six (D1; data-model.md "The palette envelope"). */
export const IDENTITY_ENVELOPE: IdentityEnvelope = {
  groundLMin: 0.17,
  groundLMax: 0.26,
  groundCMax: 0.055,
  accentCMax: 0.11,
};

const CHECKED = "2026-09-26";
/** The shop's own catalogue export — a source, but a local one. See the TCH record. */
const CATALOGUE_SOURCE = "data/hami-products.json";
const ART_CHECKED = "2026-09-27";

export const BRAND_IDENTITIES: readonly BrandIdentity[] = [
  {
    // Apple publishes no brand colour; its documented identity IS the absence of a hue
    // (monochrome black/white/grey). C = 0 is the honest rendering of that, and the
    // accent is a neutral silver-grey — "monochrome register" is the one per-maker
    // *material* exception research D1 retained for exactly this card.
    name: "APPLE",
    hueFamily: "monochrome",
    hueSource: { url: "https://www.apple.com/", checkedAt: CHECKED, kind: "none" },
    hue: 0,
    chroma: 0,
    lightness: 0.205,
    placement: "accent",
    line: "از ۱۹۷۶، آمریکا؛ پنج خانواده محصول، به نام‌های خودش.",
    lineSource: { url: "https://en.wikipedia.org/api/rest_v1/page/summary/Apple_Inc.", checkedAt: CHECKED },
    makerSlogan: null,
    forbiddenFramings: ["رنگ رسمی اپل", "اپل رنگ برند دارد"],
    artwork: { src: "/images/brands/appleC.webp", width: 1855, height: 637 },
  },
  {
    // Corporate blue vs monochrome retail is CONTESTED and the hex is aggregator-only, so
    // the ground stays near-neutral and the hue lives in the accent (D3) — the placement
    // is what separates this card from Nokia's, not an invented teal.
    name: "SAMSUNG",
    hueFamily: "blue",
    hueSource: { url: "https://chromacreator.com/brands/samsung", checkedAt: CHECKED, kind: "aggregator" },
    hue: 266,
    chroma: 0.012,
    lightness: 0.2,
    placement: "accent",
    line: "غول تولید کره جنوبی؛ پنجمین برند ارزشمند جهان (۲۰۲۴).",
    lineSource: { url: "https://en.wikipedia.org/api/rest_v1/page/summary/Samsung", checkedAt: CHECKED },
    makerSlogan: null,
    // "biggest phone company" rests only on Xiaomi's own ranking (indirect) — the
    // researcher warned against sharpening it; the sharpened phrase is blocked outright.
    forbiddenFramings: ["بزرگ‌ترین سازنده گوشی جهان"],
    artwork: { src: "/images/brands/samsungC.webp", width: 1855, height: 661 },
  },
  {
    // The only observed evidence in the set: orange in Xiaomi's own served markup. Still
    // phrased as observed, not official — and the value here is the envelope's, not #FF6900.
    name: "XIAOMI",
    hueFamily: "orange",
    hueSource: { url: "https://www.mi.com/global/", checkedAt: CHECKED, kind: "observed" },
    hue: 52,
    chroma: 0.05,
    lightness: 0.215,
    placement: "ground",
    line: "چینی، پکن؛ سومین فروشنده گوشی جهان (۲۰۲۵).",
    lineSource: { url: "https://en.wikipedia.org/api/rest_v1/page/summary/Xiaomi", checkedAt: CHECKED },
    makerSlogan: null,
    forbiddenFramings: ["اپل چین"],
    artwork: { src: "/images/brands/xiaomiC.webp", width: 1789, height: 645 },
  },
  {
    // Blue in words only — no hex obtainable, the design system needs login and #005AFF was
    // refused as a generic link blue. Same family as Samsung on purpose; separated by
    // PLACEMENT: Nokia's hue goes into the ground. The 1865 pulp-mill line is the honest
    // answer to "Nokia makes phones" being false (HMD holds the exclusive licence).
    name: "NOKIA",
    hueFamily: "blue",
    hueSource: { url: "https://www.nokia.com/", checkedAt: CHECKED, kind: "none" },
    hue: 266,
    chroma: 0.045,
    lightness: 0.205,
    placement: "ground",
    line: "فنلاندی، متولد ۱۸۶۵؛ از آسیاب کاغذ تا شبکه‌های موبایل.",
    lineSource: { url: "https://en.wikipedia.org/api/rest_v1/page/summary/Nokia", checkedAt: CHECKED },
    makerSlogan: null,
    forbiddenFramings: ["سازنده گوشی", "Connecting People", "اتصال افراد"],
    artwork: { src: "/images/brands/nokiaC.webp", width: 1871, height: 674 },
  },
  {
    // Yellow in words; no hex was ever observed — the family is documented, the value is
    // ours. "Independent" is false as of 7 Jan 2026: sub-brand of Oppo again.
    name: "REALME",
    hueFamily: "yellow",
    hueSource: { url: "https://www.realme.com/", checkedAt: CHECKED, kind: "none" },
    hue: 95,
    chroma: 0.048,
    lightness: 0.215,
    placement: "ground",
    line: "شنژن، ۲۰۱۸؛ زیرمجموعه اوپو.",
    lineSource: { url: "https://en.wikipedia.org/wiki/Realme", checkedAt: CHECKED },
    // Sourced (realme.com <title>, UK site) — recorded, not rendered. See D6 above.
    makerSlogan: { text: "Make it real", url: "https://www.realme.com/", checkedAt: CHECKED },
    forbiddenFramings: ["مستقل", "برند مستقل"],
    artwork: { src: "/images/brands/RealmeC.webp", width: 1875, height: 700 },
  },
  {
    // **This is not TCL Technology.** The three letters were read as the TV manufacturer on
    // 2026-09-26 and the whole record was built from that: a Chinese 1981 origin, a
    // “second-largest TV maker” claim, and “The Creative Life”. The owner corrected it on
    // 2026-09-27. What the catalogue holds under «تی سی اچ» is 23 SKUs of smartwatches, bluetooth
    // headphones, powerbanks and feature phones. So the unsupportable claims are removed
    // rather than swapped for a new story about a company nobody here has researched
    // (FR-018: show less rather than guess). The only honest source for this row is the
    // shop's own shelf, and the line says exactly that.
    //
    // The artwork is GREEN. That buys the card no colour claim: hueFamily stays "none" and
    // the ground stays the shop's burgundy, because nothing about this maker's colour was
    // ever evidenced. Green is Hami's art direction — notes/artwork-amendment.md.
    name: "TCH",
    hueFamily: "none",
    hueSource: { url: CATALOGUE_SOURCE, checkedAt: ART_CHECKED, kind: "none" },
    hue: 2,
    chroma: 0,
    lightness: 0.179,
    placement: "house",
    line: "در این فروشگاه: ساعت، هدفون، پاوربانک و گوشی.",
    lineSource: { url: CATALOGUE_SOURCE, checkedAt: ART_CHECKED },
    // “The Creative Life” is TCL Technology's — a different company's voice, so it is not even
    // kept as metadata here. Nothing about this maker's own slogan has been verified.
    makerSlogan: null,
    forbiddenFramings: ["TCL", "تلویزیون ساز", "دومین تولیدکننده تلویزیون"],
    artwork: { src: "/images/brands/tchC.webp", width: 1828, height: 683 },
  },
];

/**
 * The famous-but-unverified slogans, blocked as data (T007). Apple's and Nokia's were
 * asserted everywhere and verified nowhere this session — the exact class of sentence
 * that gets written from memory. Persian renderings are included because the page is
 * Persian: a blocklist that only catches Latin is half a blocklist.
 */
export const UNVERIFIED_SLOGANS: readonly string[] = [
  "Think different",
  "تفکر را متفاوت کن",
  "Different think",
  "Connecting People",
  "ارتباطات انسانی",
  "اتصال افراد",
];

/**
 * Per-maker false framings, keyed as data-model.md's table (FR-020).
 *
 * TCH's row is NOT the old one. It used to block «سازنده گوشی» and «تلفن ساز» — carried over from
 * the mistaken belief that the brand was TCL Technology, which is not a phone maker. The real TCH
 * sells phones, so that blocklist forbade the true thing and permitted the false one. What is
 * blocked now is the confusion itself, including the exact sentence that shipped in error, so a
 * revert cannot put it back.
 */
export const FORBIDDEN_FRAMINGS: Readonly<Record<string, readonly string[]>> = {
  NOKIA: ["سازنده انحصاری گوشی", "تولیدکننده گوشی‌های نوکیا", "کارخانه نوکیا"],
  REALME: ["مستقل", "برند مستقل", "شرکت مستقل"],
  TCH: ["TCL", "تلویزیون ساز", "دومین تولیدکننده بزرگ تلویزیون جهان", "چینی، ۱۹۸۱"],
  SAMSUNG: ["بزرگ‌ترین سازنده گوشی جهان"],
  APPLE: ["رنگ رسمی اپل", "اپل رنگ برند دارد"],
};

const ground = (r: BrandIdentity) =>
  r.placement === "house"
    // The shop's own burgundy as OKLCH (converted from the deck's current #1e0a10 ground,
    // which stays byte-identical in appearance: house = no maker claim, not a new colour).
    ? `oklch(${r.lightness.toFixed(3)} 0.036 ${r.hue.toFixed(0)})`
    : `oklch(${r.lightness.toFixed(3)} ${r.chroma.toFixed(3)} ${r.hue.toFixed(0)})`;

/** The card ground CSS consumes. Ground-placed cards carry the hue; accent cards sit near-neutral. */
export function cardGroundOkLCH(name: string): string {
  const r = BRAND_IDENTITIES.find((x) => x.name === name);
  if (!r) throw new Error(`brand-identity: no record for "${name}"`);
  return ground(r);
}

/**
 * The accent CSS consumes — ordinal, rule, mark plate. Monochrome gets a cool silver
 * (its documented register), the accent-placed blue gets the family at full accent
 * chroma, and the house card keeps the deck's champagne so nothing is claimed.
 */
export function cardAccentOkLCH(name: string): string {
  const r = BRAND_IDENTITIES.find((x) => x.name === name);
  if (!r) throw new Error(`brand-identity: no record for "${name}"`);
  switch (r.placement) {
    case "accent":
      return r.hueFamily === "monochrome"
        ? `oklch(0.78 ${IDENTITY_ENVELOPE.accentCMax.toFixed(3)} 255)`
        : `oklch(0.62 ${IDENTITY_ENVELOPE.accentCMax.toFixed(3)} ${r.hue.toFixed(0)})`;
    case "house":
      return "oklch(0.88 0.045 88)";
    case "ground":
      return `oklch(0.72 ${(IDENTITY_ENVELOPE.accentCMax - 0.02).toFixed(3)} ${r.hue.toFixed(0)})`;
  }
}
