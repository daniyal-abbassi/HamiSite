/**
 * Local-first product imagery — the shop-phase decision.
 *
 * Every product renders a deterministic image from `/public/images/products/`
 * (assets ported from docs/inspires/techBazar/public/images/products). The
 * legacy-import `ProductImage.url` values point at the old shop's host and are
 * deliberately ignored for now: consistent visuals, fully offline-safe.
 *
 * Mapping is keyword-based (product name / category / brand, English + Persian)
 * with a stable hash for variety inside a family, so the same product always
 * renders the same image without any database changes.
 */

const PRODUCT_DIR = "/images/products";
const CATEGORY_DIR = "/images/categories";

export const PRODUCT_IMAGE_FAMILIES = {
  watch: [
    "apple-watch-9-removebg-preview.png",
    "apple-watch-9-3-removebg-preview.png",
    "apple-watch-se-removebg-preview.png",
    "apple-watch-se-2-removebg-preview.png",
    "galaxy-watch-4-removebg-preview.png",
    "galaxy-watch-4-2-removebg-preview.png",
    "firebolt-ninja-removebg-preview.png",
  ],
  audio: [
    "senheiser-removebg-preview.png",
    "song-wh-removebg-preview.png",
    "sony-dynamic-removebg-preview.png",
    "sony-dynamic-2-removebg-preview.png",
    "prothonics-removebg-preview.png",
  ],
  laptop: [
    "msi-modern-14-removebg-preview.png",
    "msi-modern-14-2-removebg-preview.png",
    "msi-modern-14-3-removebg-preview.png",
    "asus-vivobook-removebg-preview.png",
    "asus-vivobook-2-removebg-preview.png",
    "lenova-removebg-preview.png",
    "lenova-2-removebg-preview.png",
    "dell-gaming-removebg-preview.png",
  ],
  phone: [
    "galaxy-15-removebg-preview.png",
    "readme-13-c-removebg-preview.png",
    "readme-13c-2-removebg-preview.png",
    "peco-m6-removebg-preview.png",
    "peco-m6-2-removebg-preview.png",
    "lava_agni-removebg-preview.png",
  ],
} as const;

export type ProductImageFamily = keyof typeof PRODUCT_IMAGE_FAMILIES;

/** Ordered rules — the first family whose keyword appears wins. */
const NAME_RULES: Array<[ProductImageFamily, string[]]> = [
  ["watch", ["watch", "smartwatch", "ساعت"]],
  [
    "audio",
    ["headphone", "headset", "airpod", "earbud", "earphone", "speaker", "هندزفری", "هدست", "ایرپاد", "هدفون", "اسپیکر"],
  ],
  [
    "laptop",
    ["laptop", "notebook", "macbook", "vivobook", "thinkpad", "ideapad", "لپ تاپ"],
  ],
  ["phone", ["phone", "mobile", "iphone", "galaxy", "redmi", "readmi", "گوشی", "موبایل", "تلفن"]],
];

const BRAND_RULES: Array<[ProductImageFamily, string[]]> = [
  ["laptop", ["asus", "lenovo", "lenova", "dell", "msi", "acer", "hp"]],
  ["phone", ["samsung", "xiaomi", "apple", "nokia", "honor", "huawei", "oppo", "realme", "lava"]],
];

const CATEGORY_RULES: Array<[ProductImageFamily, string[]]> = [
  ["watch", ["smartwatch", "watch"]],
  ["audio", ["audio", "headphone", "speaker", "airpod"]],
  ["laptop", ["laptop", "computer", "notebook", "tablet"]],
  ["phone", ["mobile", "phone", "feature-phone"]],
];

const CATEGORY_TILE_IMAGES: Array<[string, string[]]> = [
  [`${CATEGORY_DIR}/phone.png`, ["mobile", "phone", "گوشی", "موبایل", "تلفن"]],
  [
    `${CATEGORY_DIR}/headphone.png`,
    ["audio", "headphone", "speaker", "airpod", "هندزفری", "هدفون", "اسپیکر", "ایرپاد"],
  ],
  [`${CATEGORY_DIR}/computer.png`, ["laptop", "computer", "notebook", "لپ", "کامپیوتر", "تبلت"]],
  [`${CATEGORY_DIR}/home.png`, ["home", "خانگی", "خانه"]],
  [`${CATEGORY_DIR}/tv.png`, ["tv", "television", "تلویزیون"]],
];

/** Lowercase + ZWNJ→space, so «لپ‌تاپ» and «لپ تاپ» both match. */
function normalize(input: string): string {
  return input.toLowerCase().replace(/\u200c/g, " ");
}

/** Small stable string hash → deterministic image pick per product. */
function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pick(family: ProductImageFamily, seed: string): string {
  const files = PRODUCT_IMAGE_FAMILIES[family];
  return `${PRODUCT_DIR}/${files[stableHash(seed) % files.length]}`;
}

export type ProductImageSource = {
  name: string;
  englishName?: string | null;
  /** Legacy image rows — accepted for call-site compatibility, intentionally unused. */
  images?: unknown;
  mainCategory?: { slug?: string | null; name?: string | null } | null;
  brand?: { slug?: string | null; name?: string | null } | null;
};

/** Resolve the local product image for a product (deterministic, offline-safe). */
export function resolveProductImage(product: ProductImageSource): string {
  const nameText = normalize([product.name, product.englishName].filter(Boolean).join(" "));
  for (const [family, keywords] of NAME_RULES) {
    if (keywords.some((keyword) => nameText.includes(keyword))) return pick(family, product.name);
  }

  const brandText = normalize([product.brand?.slug, product.brand?.name].filter(Boolean).join(" "));
  for (const [family, keywords] of BRAND_RULES) {
    if (keywords.some((keyword) => brandText.includes(keyword))) return pick(family, product.name);
  }

  const categoryText = normalize(
    [product.mainCategory?.slug, product.mainCategory?.name].filter(Boolean).join(" "),
  );
  for (const [family, keywords] of CATEGORY_RULES) {
    if (keywords.some((keyword) => categoryText.includes(keyword))) return pick(family, product.name);
  }

  return pick("phone", product.name);
}

/** Resolve the local tile image for a category (deterministic, offline-safe). */
export function categoryImageFor(slug?: string | null, name?: string | null): string {
  const text = normalize([slug, name].filter(Boolean).join(" "));
  for (const [image, keywords] of CATEGORY_TILE_IMAGES) {
    if (keywords.some((keyword) => text.includes(keyword))) return image;
  }
  return `${CATEGORY_DIR}/phone.png`;
}
