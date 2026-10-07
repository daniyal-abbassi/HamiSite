import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Star } from "lucide-react";
import hamiWordmark from "@/public/brand/hami-wordmark-fa.png";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { PLACEHOLDER_ALT, PLACEHOLDER_LABEL, isPlaceholderImage, resolveProductImage } from "@/lib/product-images";
import {
  brandAccent,
  brandLabel,
  discountPercent,
  isPurchasable,
  priceState,
  splitProductName,
  unitPriceOf,
} from "@/lib/product-identity";
import { storeWarranty } from "@/lib/content/verified-facts";
import { cn, formatToman, toFaDigits } from "@/lib/utils";

/**
 * The product card.
 *
 * This replaced a white rounded rectangle with a head row, a square image, a
 * name, a chip and a price row — the shape every storefront ships. It was
 * competent and completely anonymous, which is the wrong note for a shop asking
 * fifty million toman for a phone.
 *
 * Two independent axes, so colour and presentation can be chosen separately:
 *
 * | `variant` | ground |
 * |---|---|
 * | `museum` | ivory, one oxblood hairline, maximum restraint |
 * | `obsidian` | near-black with a wine edge-light and a brass rule |
 * | `saffron` | warm ivory, brass accent, a fine double rule |
 * | `oxblood` | RAL 3004 itself, cream text, gold hairline |
 *
 * | `frame` | the product |
 * |---|---|
 * | `plinth` | on a lit plinth with a contact shadow — a jeweller's vitrine |
 * | `bleed` | edge to edge across the card's top |
 * | `mat` | inset in a generous mat, like a passepartout |
 *
 * ## What actually makes it read as expensive
 *
 * None of it is ornament. The head row is gone — brand and model now sit with
 * the copy instead of competing with the product for the top of the card. Rules
 * are 1px inset rings, so they never thicken at a corner or add to the box. The
 * price is set large enough to be the second thing seen, after the product.
 *
 * The shipping look is **obsidian + bleed**, rounded at 18px and lifted on a
 * three-layer shadow so the card reads as an object above the page. A 4px corner
 * was tried first — a hard corner reads as "made" where a soft one reads as
 * templated — and rejected in review; rounded-and-floating was the note.
 *
 * ## The one thing that is easy to get wrong here
 *
 * `obsidian` and `oxblood` invert the card's ground, so they must not use the
 * dark-ink brand accents — those measure 2.77:1 and 1.98:1 on them. Each variant
 * declares `--accent-ground`, and the component reads it to pick the matching
 * accent set. This is the same failure the project already hit once when the
 * card went from dark to white and the brand line fell to 2.03:1.
 */

export type CardVariant = "museum" | "obsidian" | "saffron" | "oxblood";
export type CardFrame = "plinth" | "bleed" | "mat";

/** Which variants sit on a dark ground and therefore need the light accents. */
const DARK_GROUND: Record<CardVariant, boolean> = {
  museum: false,
  saffron: false,
  obsidian: true,
  oxblood: true,
};

export type ProductCardData = {
  id: number;
  name: string;
  englishName?: string | null;
  slug: string;
  brand?: { name: string; slug?: string | null } | null;
  mainCategory?: { name: string; slug?: string | null } | null;
  displayPrice: number;
  compareAtPrice?: number | null;
  stockType?: string | null;
  images?: unknown;
  /**
   * The merchant's own sellability flag. Declared because the card's cart control
   * now reads it (`isPurchasable`) and an omitted value resolves to "not
   * purchasable" — a caller that left it out would silently disable every button
   * rather than fail loudly.
   */
  available?: boolean;
  specialOffer?: boolean;
  variantColors?: string[];
  variants?: Array<{
    id: number;
    color?: string | null;
    storage?: string | null;
    price: number | null;
    compareAtPrice?: number | null;
    stock?: number | null;
    stockType?: string | null;
    isDefault?: boolean;
    imageUrl?: string | null;
  }>;
};

const stockLabels: Record<string, string> = {
  unlimited: "موجود",
  limited: "موجود محدود",
  out_of_stock: "ناموجود",
  call: "تماس بگیرید",
};

export function ProductCard({
  product,
  index,
  variant = "obsidian",
  frame = "bleed",
  sourceStyle = false,
  wished = false,
  onWish,
  selectedVariantId,
  onVariantChange,
}: {
  product: ProductCardData;
  /** Position in its grid, used only to stagger the entrance. */
  index?: number;
  /** Defaults to the shipping look: obsidian, full-bleed. */
  variant?: CardVariant;
  frame?: CardFrame;
  /** Matches the owner-supplied SHOP SECTION product card art direction. */
  sourceStyle?: boolean;
  wished?: boolean;
  onWish?: (id: number) => void;
  selectedVariantId?: number;
  onVariantChange?: (variantId: number) => void;
}) {
  const onDark = DARK_GROUND[variant];
  const accent = brandAccent(product.brand?.name, onDark ? "dark" : "light");
  const { label, model, specs } = splitProductName(product.name);
  const activeVariant = product.variants?.find((variant) => variant.id === selectedVariantId)
    ?? product.variants?.find((variant) => variant.isDefault)
    ?? product.variants?.[0]
    ?? null;
  const displayPrice = activeVariant ? unitPriceOf(activeVariant.price, product.displayPrice) ?? 0 : product.displayPrice;
  const compareAtPrice = activeVariant ? activeVariant.compareAtPrice : product.compareAtPrice;
  const state = priceState(displayPrice, compareAtPrice);
  const off = discountPercent(displayPrice, compareAtPrice);
  /* The shelf label is not the merchant's answer. Sixteen records read
     «موجود محدود» while `purchasable` says they cannot be sold, and every one of
     them carried a live cart control. */
  const activeStockType = activeVariant?.stockType ?? product.stockType;
  const buyable = activeVariant
    ? isPurchasable({ available: product.available, stockType: activeStockType })
      && !(activeStockType === "limited" && (activeVariant.stock ?? 0) <= 0)
    : isPurchasable(product);
  // The dot and its colour track the *label*, which is a different question.
  const outOfStock = activeStockType === "out_of_stock"
    || (activeStockType === "limited" && activeVariant != null && (activeVariant.stock ?? 0) <= 0);
  const variantImage = activeVariant?.imageUrl;
  // Variant images can come from the merchant's HTTPS catalog as well as the
  // local mirror. next.config.mjs explicitly allows that catalog host.
  const productImage = variantImage ?? resolveProductImage(product);
  const noImage = isPlaceholderImage(productImage);
  const href = `/shop/${product.slug}`;
  const englishModel = (product.englishName || model || "")
    .replace(/\s+\d+\s*\/\s*\d+.*$/i, "")
    .replace(/\s+(?:vietnam|global|سامسونگ).*$/i, "")
    .trim();
  const title = sourceStyle
    ? (/^(?:A\d{2}|S\d{1,2}|Z\s?(?:flip|fold)|buds)/i.test(englishModel) && !/^galaxy/i.test(englishModel)
      ? `Galaxy ${englishModel}`
      : englishModel || label)
    : label;

  const colorValue = (name: string) => {
    const normalized = name.trim().toLowerCase();
    if (/^#[0-9a-f]{3,8}$/i.test(normalized)) return normalized;
    const colors: Record<string, string> = {
      "مشکی": "#292526", "سفید": "#f7f5f2", "نقره‌ای": "#b9bdc3", "نقره ای": "#b9bdc3",
      "خاکستری": "#8d9298", "طوسی": "#8d9298", "آبی": "#566b82", "سرمه‌ای": "#303c58",
      "سرمه ای": "#303c58", "صورتی": "#dfabb8", "بنفش": "#8376c8", "سبز": "#617660",
      "کرم": "#d7c6ae", "طلایی": "#b99a58", black: "#292526", white: "#f7f5f2",
      graphite: "#494c50", gray: "#8d9298", grey: "#8d9298", blue: "#566b82", pink: "#dfabb8",
      violet: "#8376c8", purple: "#8376c8", green: "#617660", cream: "#d7c6ae",
    };
    const direct = colors[name.trim()] ?? colors[normalized];
    if (direct) return direct;
    return Object.entries(colors).find(([label]) => normalized.includes(label))?.[1] ?? "#a9a4a4";
  };

  return (
    <article
      style={index != null ? ({ "--card-index": index } as React.CSSProperties) : undefined}
      className={cn(
        "lux-card product-card group/card",
        `card-${variant}`,
        `frame-${frame}`,
        sourceStyle && "featured-source-card",
        sourceStyle && product.specialOffer && "featured-source-card--special",
      )}
    >
      {sourceStyle && off != null ? (
        <span className="featured-source-card__badge featured-source-card__badge--discount">
          {toFaDigits(off)}٪ تخفیف
        </span>
      ) : sourceStyle && product.specialOffer ? (
        <span className="featured-source-card__badge">
          <Star aria-hidden="true" fill="currentColor" /> پیشنهاد ویژه
        </span>
      ) : null}
      {sourceStyle && onWish && (
        <button
          type="button"
          aria-label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
          aria-pressed={wished}
          onClick={() => onWish(product.id)}
          className={cn("featured-source-card__wish", wished && "is-wished")}
        >
          <Heart aria-hidden="true" fill={wished ? "currentColor" : "none"} />
        </button>
      )}
      <Link href={href} className="lux-stage block" aria-label={product.name}>
        <Image
          src={productImage}
          alt={isPlaceholderImage(productImage) ? PLACEHOLDER_ALT : product.name}
          width={720}
          height={720}
          /* Mirrors the grid this card sits in: 1 column, then 2, 3, 4. Without
             this the browser assumes 100vw and picks the largest candidate —
             measured 1920px served for a 684px need on a 390px phone. */
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 390px"
        />
        {sourceStyle && outOfStock && (
          <span className="featured-source-card__unavailable"><span>ناموجود</span></span>
        )}
      </Link>

      {/* FR-001: an absent product photograph is stated, not papered over by a
            brand tile in the same slot at the same size. */}
      {noImage && (
        <span className="absolute end-3 top-3 z-10 rounded-full border border-champagne/25 bg-ink/80 px-2.5 py-1 font-mono text-[10px] tracking-normal text-foreground/70">
          {PLACEHOLDER_LABEL}
        </span>
      )}

      <div className="lux-body">
        {/* Brand and model, together and quiet — they identify, they do not
            announce. */}
        <div className={cn("flex items-baseline justify-between gap-3", sourceStyle && "featured-source-card__brand")}>
          <span
            className="font-mono text-xs font-bold tracking-normal"
            style={{ color: accent }}
          >
            {sourceStyle && product.brand?.name === "سامسونگ" ? "SAMSUNG" : brandLabel(product.brand?.name)}
          </span>
          {model && (
            <span
              dir="ltr"
              className="truncate font-mono text-xs tracking-normal text-foreground/70"
            >
              {model}
            </span>
          )}
        </div>

        <h3 className="mt-2.5 text-base">
          <Link
            href={href}
            /* The painted text is 28px tall per line; the ::after inset grows
               the *hit area* to 44+ without repainting anything (WCAG 2.5.8).
               The overlap lands on the non-interactive spec line below. */
            className="relative line-clamp-2 font-bold leading-7 after:absolute after:inset-x-[-8px] after:inset-y-[-8px] after:content-['']"
            dir={sourceStyle ? "ltr" : undefined}
          >
            {title}
          </Link>
        </h3>

        {sourceStyle && onVariantChange && product.variants && product.variants.some((item) => item.color) && (
          <div className="featured-source-card__swatches" role="group" aria-label="انتخاب رنگ">
            {[...new Set(product.variants.flatMap((item) => item.color ? [item.color] : []))].map((color) => {
              const colorVariant = product.variants?.find((item) => item.color === color && item.storage === activeVariant?.storage)
                ?? product.variants?.find((item) => item.color === color);
              if (!colorVariant) return null;
              return (
                <button
                  key={color}
                  type="button"
                  title={color}
                  aria-label={`رنگ ${color}`}
                  aria-pressed={activeVariant?.color === color}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onVariantChange(colorVariant.id);
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onVariantChange(colorVariant.id);
                  }}
                  style={{ backgroundColor: colorValue(color) }}
                />
              );
            })}
          </div>
        )}

        {specs && (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{specs}</p>
        )}

        {/* Everything below is the transaction, held to the bottom so cards in a
            row align on their prices however long the names run. */}
        <div className="mt-auto pt-5">
          <div className={cn("lux-stock flex items-center justify-between gap-2 text-xs font-bold tracking-normal", sourceStyle && "featured-source-card__stock")}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5"
                style={{ color: outOfStock ? undefined : accent }}
              >
                <i
                  className="inline-block size-1.5 rounded-full"
                  style={{ background: "currentColor" }}
                  aria-hidden="true"
                />
                  {stockLabels[activeStockType ?? ""] ?? "—"}
              </span>
              {off != null && (
                <>
                  <i className="h-3 w-px" style={{ background: "var(--lux-rule)" }} aria-hidden="true" />
                  {/* FR-011: the number is Persian even inside an LTR run, because
                      the run exists to keep the minus sign on the left, not to
                      switch the digits back to Latin. */}
                  <span dir="ltr" className="font-mono text-champagne">
                    −{toFaDigits(off)}٪
                  </span>
                </>
              )}
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 font-sans text-xs text-foreground/50 border border-champagne/15 rounded-full px-2 py-0.5">
              {storeWarranty.label}
            </span>
          </div>

          {/* `lux-buy` is a styling hook, not decoration: on a narrow mobile
              card this row stacks (see the mobile block in globals.css), because
              a 44px button beside the price leaves too little room for a
              nine-figure toman figure and the price wraps to three lines. */}
          <div className={cn("lux-buy mt-2 flex items-end justify-between gap-3", sourceStyle && "featured-source-card__actions")}>
            <div className="min-w-0">
              {state === "sale" && product.compareAtPrice != null && (
                <del className="block text-xs leading-4 text-muted-foreground">
                  {formatToman(product.compareAtPrice)}
                </del>
              )}
              {state === "unavailable" ? (
                <strong className="block text-base font-bold leading-8 text-muted-foreground">
                  تماس بگیرید
                </strong>
              ) : (
                <strong
                  className="block text-[26px] font-black leading-9 tracking-normal tabular-nums"
                  style={{ color: "var(--lux-price)" }}
                >
                  {formatToman(displayPrice)}
                </strong>
              )}
            </div>

            <AddToCartButton
              productId={product.id}
              variantId={activeVariant?.id}
              disabled={!buyable || state === "unavailable"}
              iconOnly={!sourceStyle}
              label={sourceStyle ? "افزودن به سبد" : undefined}
              cartIcon={sourceStyle}
              className={cn(
                sourceStyle
                  ? "featured-source-card__cart"
                  : "size-11 shrink-0 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95",
              )}
              style={{
                background: onDark ? "rgba(229, 211, 179, 0.08)" : "rgb(var(--foreground) / 0.06)",
                color: onDark ? "#E5D3B3" : "#640211",
                boxShadow: "inset 0 0 0 1px var(--lux-rule)",
              }}
            />
            {sourceStyle && (
              <Link href={href} className="featured-source-card__detail" aria-label={`مشاهده ${product.name}`}>
                <ArrowRight aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* The house mark, once, small. */}
      <Image
        src={hamiWordmark}
        alt=""
        aria-hidden="true"
        sizes="80px"
        className={cn(
          "pointer-events-none absolute bottom-3 start-3 h-3 w-auto",
          onDark ? "opacity-45 invert" : "opacity-30",
        )}
      />
    </article>
  );
}
