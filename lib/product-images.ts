/**
 * Product and category imagery.
 *
 * A product renders the shop's own photograph. `lib/catalog.ts` mirrors each
 * product's primary image from the export into `/public/images/catalog/` and
 * promotes it to `images[0]`, because the origin host measured 5.8-7.5s per
 * image and had `next/image` returning 500 about as often as it succeeded.
 * 188 of 189 products have one; the mapping is `data/catalog-images.json`.
 *
 * A product with no photograph renders `/brand/placeholder-product.webp` — one
 * identical, brand-owned tile, never a stand-in object. This replaced a
 * keyword-and-hash lookup into a 31-file template pack that used to guess a
 * plausible picture from the product's name, which meant an imageless phone was
 * confidently displayed as an Apple Watch. Constitution I has no exception path
 * and a guess is exactly what it forbids: «Missing data MUST stay visibly
 * missing. It MUST NOT be filled with a plausible placeholder, a stock
 * photograph, or an assumed value.» The placeholder is not a claim about the
 * product; it is a claim about the shop, and it is true.
 *
 * The pack itself is still on disk under `/public/images/products/` and is now
 * unreferenced by any code path. Deleting it is the owner's call, not this
 * file's.
 */

const CATEGORY_DIR = "/images/categories";

/** Built by `scripts/make-product-placeholder.py` from the merchant's real mark. */
const PRODUCT_PLACEHOLDER = "/brand/placeholder-product.webp";

const CATEGORY_TILE_IMAGES: Array<[string, string[]]> = [
  [`${CATEGORY_DIR}/phone.png`, ["mobile", "phone", "گوشی", "موبایل", "تلفن"]],
  [
    `${CATEGORY_DIR}/headphone.png`,
    ["audio", "headphone", "speaker", "airpod", "هندزفری", "هدفون", "اسپیکر", "ایرپاد"],
  ],
  [`${CATEGORY_DIR}/computer.png`, ["laptop", "computer", "notebook", "لپ", "کامپیوتر", "تبلت"]],
  // No home or tv entry, deliberately. Checked against the real catalogue: of its 32
  // categories, ZERO matched either keyword set — the shop sells phones and accessories,
  // not televisions or home appliances (tests/unit/product-images.test.ts re-runs that
  // check so it gets revisited if the stock ever changes). `public/images/categories/
  // home.png` and `tv.png` are therefore unreferenced by any code path but still on disk;
  // deleting them is the owner's call, not this file's.
];

/** Lowercase + ZWNJ→space, so «لپ‌تاپ» and «لپ تاپ» both match. */
function normalize(input: string): string {
  return input.toLowerCase().replace(/\u200c/g, " ");
}

/** Small stable string hash → deterministic image pick per product. */
export type ProductImageSource = {
  name: string;
  /** The shop's own photography, from the catalogue export. Preferred when present. */
  images?: Array<{ url?: string | null; isDefault?: boolean }> | unknown;
};

/** The brand-owned tile every imageless product shares. */
export const PRODUCT_PLACEHOLDER_IMAGE = PRODUCT_PLACEHOLDER;

/**
 * Whether a resolved source is the brand placeholder rather than the product's own photograph.
 *
 * FR-001 in the constitution says missing data stays *visibly* missing, and the
 * placeholder as first shipped broke that: it filled the exact slot the product's own
 * picture occupies, at the same size, with `alt={product.name}` — so record 347 read
 * on screen as a phone with a photo it does not have. The owner directed this one
 * shared brand image on 2026-09-22, which is legitimate (it is brand material, never
 * a guess about the merchandise), but it has to announce itself. These two constants
 * are how a surface says so without each one inventing its own wording.
 */
export function isPlaceholderImage(src: string): boolean {
  return src === PRODUCT_PLACEHOLDER;
}

/** The alt text and the visible label for a placeholder. One phrasing, site-wide. */
export const PLACEHOLDER_ALT = "نشان حامی همراه — این کالا تصویری در فهرست فروشگاه ندارد";
export const PLACEHOLDER_LABEL = "بدون تصویر محصول";

/**
 * Resolve a product's image: its own photograph, or the brand placeholder.
 *
 * There is no third option. The previous fallback guessed a plausible picture
 * from the product's name, brand and category, which meant a product with no
 * photograph was displayed as some other company's device — a false statement
 * about merchandise, and the exact thing Constitution I has no exception path
 * for. Guessing is now removed rather than refined.
 */
export function resolveProductImage(product: ProductImageSource): string {
  const own = Array.isArray(product.images) ? (product.images as Array<{ url?: string | null; isDefault?: boolean }>) : null;
  if (own && own.length > 0) {
    // Local only. `lib/catalog.ts` mirrors every product's primary image into `public/`
    // and keeps the origin URL for the rest of the gallery, so a bare `img.url` here is
    // usually the live shop's host — which measured 5.8-7.5s per image and made
    // next/image 500 about as often as it succeeded. That is the failure the mirror was
    // built to escape, so an unmirrored product takes the placeholder rather than going
    // back onto the network.
    const isLocal = (url: string | null | undefined): url is string => !!url && url.startsWith("/");
    const preferred = own.find((img) => img?.isDefault && isLocal(img.url)) ?? own.find((img) => isLocal(img.url));
    if (preferred?.url) return preferred.url;
  }
  return PRODUCT_PLACEHOLDER;
}

/** Resolve the local tile image for a category (deterministic, offline-safe). */
export function categoryImageFor(slug?: string | null, name?: string | null): string {
  const text = normalize([slug, name].filter(Boolean).join(" "));
  for (const [image, keywords] of CATEGORY_TILE_IMAGES) {
    if (keywords.some((keyword) => text.includes(keyword))) return image;
  }
  return `${CATEGORY_DIR}/phone.png`;
}
