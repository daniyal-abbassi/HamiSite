/**
 * Product identity — the brand and model signals a card renders as colour and
 * type rather than as more prose.
 *
 * The brief: a shopper should read brand, model and price at a glance, and that
 * has to keep working for products nobody has entered yet. So nothing here is a
 * per-product decision — both signals are derived from the product row.
 */

/* ------------------------------------------------------------------------- *
 * Brand colour
 * ------------------------------------------------------------------------- */

/**
 * Brand accents are deliberately **not** the brands' real colours.
 *
 * Samsung blue, Xiaomi orange and Apple silver dropped onto a wine-noir page
 * would be four foreign palettes fighting the one this site has. What a shopper
 * actually needs from colour here is *distinguishability* — "these two cards are
 * different brands" — not brand-accurate reproduction.
 *
 * So the set below is one family: fourteen hues held at a similar muted chroma
 * and a matched lightness, chosen so no one of them shouts louder than the
 * others. They read as considered colour-coding, which is the effect a good
 * storefront gets from real brand colours anyway.
 *
 * **They are tuned for a white card.** An earlier set was tuned for the dark
 * card the world used to have; when the card turned white those same hues
 * measured 2.03:1 and the brand line all but vanished. If the card ever changes
 * ground again, these have to be re-measured — a palette is only legible
 * against the surface it was chosen for.
 */
const BRAND_ACCENTS = [
  // Slots 0-6 are handed out by name below.
  "#A8542F", // 0 clay
  "#4F6B4A", // 1 sage
  "#7D4E76", // 2 mauve
  "#3D5C73", // 3 slate blue
  "#856526", // 4 sand
  "#5B4E96", // 5 iris
  "#2C6E60", // 6 verdigris
  // Slots 7+ are the pool unknown brands hash into. Kept strictly separate, so
  // a brand added tomorrow can never collide with a curated one — which is how
  // «داریا» and «اپل» first came out the same colour on the same grid.
  "#A34A4A", // 7 dusty rose
  "#5E6B2E", // 8 olive
  "#8E4A66", // 9 blush
  "#2F6076", // 10 aqua grey
  "#7A5A42", // 11 taupe
  "#46528C", // 12 periwinkle
  "#6B4E93", // 13 lilac
] as const;

/**
 * The same fourteen hues, lightened for a dark card.
 *
 * **Index-locked to `BRAND_ACCENTS` above.** Slot 3 is Samsung's slate blue in
 * both sets, so a brand keeps its identity whether the card is ivory or
 * obsidian — only its lightness changes. Reorder one array and you must reorder
 * the other.
 *
 * This set exists because the dark-ink accents measured 2.77:1 on the obsidian
 * card and 1.98:1 on the oxblood one. That is the same failure this project
 * already hit once, when the card went from dark to white and the brand line
 * dropped to 2.03:1 — a palette is only legible against the surface it was
 * chosen for. These clear 9.80:1 on obsidian and 7.01:1 on oxblood.
 */
const BRAND_ACCENTS_ON_DARK = [
  "#E8B08C", // 0 clay
  "#AECBA6", // 1 sage
  "#D5AECE", // 2 mauve
  "#A8C4DA", // 3 slate blue
  "#E0C48A", // 4 sand
  "#BCB2E8", // 5 iris
  "#96D2C2", // 6 verdigris
  "#E5A9A9", // 7 dusty rose
  "#C6D293", // 8 olive
  "#E0A8BF", // 9 blush
  "#9EC8DE", // 10 aqua grey
  "#DCBBA2", // 11 taupe
  "#B0BCE8", // 12 periwinkle
  "#C9B4E8", // 13 lilac
] as const;

/** Where the curated block ends and the hashed pool begins. */
const CURATED_SLOTS = 7;

/**
 * Brands that carry enough of the catalogue to deserve a stable, hand-placed
 * slot rather than whatever the hash lands on. Keys are normalised, and both the
 * Persian and Latin spellings map to the same slot so «سامسونگ» and "SAMSUNG"
 * never come out as two different colours on two different cards.
 */
const BRAND_SLOTS: Record<string, number> = {
  سامسونگ: 3, // slate blue — nearest this palette gets to Samsung
  samsung: 3,
  شیائومی: 0, // clay — nearest to Xiaomi's orange
  xiaomi: 0,
  اپل: 4, // sand
  apple: 4,
  "تی سی اچ": 6, // verdigris
  tch: 6,
  نکسا: 5, // iris
  nexa: 5,
  نوکیا: 1, // sage
  nokia: 1,
  ریلمی: 2, // mauve
  realme: 2,
};

/** Lowercase, strip ZWNJ and collapse whitespace, so «تی‌سی‌اچ» == «تی سی اچ». */
function normalizeBrand(input: string): string {
  return input
    .toLowerCase()
    .replace(/‌/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Small stable string hash — same brand, same colour, on every render and box. */
function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  return hash;
}

/**
 * The accent for a brand. Unknown brands are hashed into the uncurated end of
 * the same family, so a brand added to the database tomorrow gets a stable
 * colour with no code change — the part of the brief that matters most.
 */
/** Which set to draw from — the card decides, not the page. */
export type AccentGround = "light" | "dark";

/** The slot a brand owns, stable across both accent sets. */
function brandSlot(brandName?: string | null): number {
  if (!brandName) return CURATED_SLOTS;
  // Some rows carry both spellings in one field, e.g. "نکسا | NEXA".
  const primary = normalizeBrand(brandName.split("|")[0] ?? brandName);
  const curated = BRAND_SLOTS[primary];
  if (curated != null) return curated;
  // Unknown brands hash into the pool *after* the curated block. Two unknown
  // brands can still land together — a finite palette guarantees that — but an
  // unknown brand can never be handed a curated brand's colour.
  const pool = BRAND_ACCENTS.length - CURATED_SLOTS;
  return CURATED_SLOTS + (stableHash(primary) % pool);
}

export function brandAccent(brandName?: string | null, ground: AccentGround = "light"): string {
  const slot = brandSlot(brandName);
  return ground === "dark" ? BRAND_ACCENTS_ON_DARK[slot] : BRAND_ACCENTS[slot];
}

/** The brand label, without the "«فارسی» | LATIN" doubling some rows carry. */
export function brandLabel(brandName?: string | null): string {
  if (!brandName) return "—";
  return (brandName.split("|")[0] ?? brandName).trim();
}

/* ------------------------------------------------------------------------- *
 * Model code
 * ------------------------------------------------------------------------- */

export type ProductNameParts = {
  /** What the thing is, in Persian: «پاوربانک ۲۲.۵ وات تی سی اچ». */
  label: string;
  /** The Latin model designation: "Compact 2020". Null when the name has none. */
  model: string | null;
  /** The Persian specs trailing the model: «ظرفیت ۲۰۰۰۰ میلی‌آمپرساعت». */
  specs: string | null;
};

/**
 * Every product name in this catalogue is built the same way:
 *
 *   «گوشی موبایل شیائومی مدل Redmi Note 14 Pro Plus 5G دو سیم کارت ظرفیت ۵۱۲…»
 *    └─────── what it is ───────┘ مدل └── model code ──┘ └─── more specs ───┘
 *
 * The model code is the one part a shopper compares between two cards, and it is
 * also the one part that is Latin — which is what makes it findable. Everything
 * from «مدل» up to the next Persian letter is the code.
 *
 * Two real shapes in the data this has to survive:
 *
 * - **No space after «مدل».** «…مدلTCH  Boom Trap L30» is a single token in the
 *   source, so the separator is optional rather than required.
 * - **Non-breaking spaces inside the code.** «TCH Boom Trap L30» would keep
 *   its NBSP and render with a visible gap, so whitespace is collapsed.
 *
 * Names with no «مدل» simply return `model: null` and the card falls back to
 * showing the name alone — no guessing, because a wrong model code on a product
 * card is worse than none.
 */
export function splitProductName(name: string): ProductNameParts {
  const clean = name.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  const marker = clean.indexOf("مدل");
  if (marker === -1) return { label: clean, model: null, specs: null };

  const label = clean.slice(0, marker).trim();
  const after = clean.slice(marker + "مدل".length);

  // Latin letters, digits and punctuation up to the first Persian letter.
  const match = after.match(/^[^\u0600-\u06ff]+/);
  const model = match?.[0].replace(/\s+/g, " ").trim() ?? "";
  if (!model) return { label: clean, model: null, specs: null };

  // Whatever Persian trails the model is the spec tail: «ظرفیت ۵۱۲ گیگابایت و
  // رم ۱۲ گیگابایت». It is what a shopper checks *after* deciding they are
  // looking at the right product, so it earns its own quiet line rather than
  // being buried in the headline or thrown away.
  const specs = after.slice(match?.[0].length ?? 0).replace(/\s+/g, " ").trim();

  return { label: label || clean, model, specs: specs || null };
}

/* ------------------------------------------------------------------------- *
 * Price emphasis
 * ------------------------------------------------------------------------- */

export type PriceState = "sale" | "plain" | "unavailable";

/**
 * Price is the third glanceable signal, and colour carries its meaning: a
 * reduced price renders in the ember signal, a normal one in the plain
 * foreground. That is a real distinction a shopper can use from across the grid,
 * which is the only reason it earns colour at all — a price coloured for
 * decoration would just be noise.
 *
 * `displayPrice: 0` occurs in the catalogue for call-for-price rows, so zero is
 * "unavailable", never "free".
 */
export function priceState(displayPrice: number, compareAtPrice?: number | null): PriceState {
  if (!displayPrice || displayPrice <= 0) return "unavailable";
  if (compareAtPrice != null && compareAtPrice > displayPrice) return "sale";
  return "plain";
}

/** Whole-percent saving, or null when there isn't one. */
export function discountPercent(displayPrice: number, compareAtPrice?: number | null): number | null {
  if (!displayPrice || displayPrice <= 0) return null;
  if (compareAtPrice == null || compareAtPrice <= displayPrice) return null;
  const off = Math.round(((compareAtPrice - displayPrice) / compareAtPrice) * 100);
  return off > 0 ? off : null;
}
