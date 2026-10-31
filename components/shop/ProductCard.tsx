"use client";

import { useState } from "react";
import type React from "react";
import Image from "next/image";
import { AdaptiveProductImage } from "@/components/shop/AdaptiveProductImage";
import Link from "next/link";
import { TomanPrice } from "@/components/ui/TomanPrice";
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
import { swatchColor } from "@/lib/swatch-color";
import { cn, toFaDigits } from "@/lib/utils";

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
  limited: "موجود",
  out_of_stock: "ناموجود",
  call: "تماس بگیرید",
};

const MAX_SWATCHES = 5;

type CardVariantData = NonNullable<ProductCardData["variants"]>[number];

/** One choice per colour. Among a colour's variants the one that can be bought wins, then the storage the shopper is already on. */
function colorChoices(product: ProductCardData, active: CardVariantData | null) {
  const canBuy = (variant: CardVariantData) =>
    isPurchasable({ available: product.available, stockType: variant.stockType })
    && !(variant.stockType === "limited" && (variant.stock ?? 0) <= 0);
  const byColor = new Map<string, CardVariantData>();
  for (const variant of product.variants ?? []) {
    if (!variant.color) continue;
    const kept = byColor.get(variant.color);
    const better = !kept
      || (canBuy(variant) && !canBuy(kept))
      || (canBuy(variant) === canBuy(kept) && variant.storage === active?.storage && kept.storage !== active?.storage);
    if (better) byColor.set(variant.color, variant);
  }
  return [...byColor.entries()].map(([color, variant]) => ({
    color,
    variantId: variant.id,
    canBuy: canBuy(variant),
    active: active?.color === color,
  }));
}

export function ProductCard({
  product,
  index,
  variant = "obsidian",
  frame = "bleed",
  imageSizes,
  priorityImage = false,
}: {
  product: ProductCardData;
  /** Position in its grid, used only to stagger the entrance. */
  index?: number;
  /** Defaults to the shipping look: obsidian, full-bleed. */
  variant?: CardVariant;
  frame?: CardFrame;
  imageSizes?: string;
  priorityImage?: boolean;
}) {
  const onDark = DARK_GROUND[variant];
  const accent = brandAccent(product.brand?.name, onDark ? "dark" : "light");
  const { label, model, specs } = splitProductName(product.name);
  const defaultVariant = product.variants?.find((variant) => variant.isDefault) ?? product.variants?.[0] ?? null;
  /* The colour a shopper picked. Price, stock, the cart control and the photograph all follow it, so
     what is shown is always what «افزودن به سبد» adds. */
  const [pickedId, setPickedId] = useState<number | null>(null);
  const [swapped, setSwapped] = useState(false);
  const activeVariant = product.variants?.find((variant) => variant.id === pickedId) ?? defaultVariant;
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
  /* The model is the name: «Galaxy A07» is what a shopper looks for, while «گوشی موبایل سامسونگ» only
     says what kind of thing it is. Names with no model fall back to the whole name. */
  const title = model ?? label;
  const swatches = colorChoices(product, activeVariant);

  return (
    <article
      style={index != null ? ({ "--card-index": index } as React.CSSProperties) : undefined}
      className={cn(
        "lux-card product-card group/card",
        `card-${variant}`,
        `frame-${frame}`,
      )}
    >
      <Link
        href={href}
        className="lux-stage block aspect-square relative"
        data-photo-plate=""
        data-swapped={swapped ? "" : undefined}
        aria-label={product.name}
      >
        <AdaptiveProductImage
          key={productImage}
          src={productImage}
          alt={isPlaceholderImage(productImage) ? PLACEHOLDER_ALT : product.name}
          width={720}
          height={720}
          sizes={imageSizes ?? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 390px"}
          priority={priorityImage}
        />
      </Link>

      {/* FR-001: an absent product photograph is stated, not papered over by a
            brand tile in the same slot at the same size. */}
      {noImage && (
        <span className="absolute end-3 top-3 z-10 rounded-full border border-champagne/25 bg-ink/80 px-2.5 py-1 font-mono text-xs tracking-normal text-foreground/70">
          {PLACEHOLDER_LABEL}
        </span>
      )}

      <div className="lux-body">
        {/* The brand identifies, quietly. The name below it is what the shopper reads. */}
        <div className="flex items-baseline justify-between gap-3">
          <span
            className="type-label font-bold tracking-normal"
            style={{ color: accent }}
          >
            {brandLabel(product.brand?.name)}
          </span>
        </div>

        <h3 className="lux-name mt-1.5">
          <Link
            href={href}
            dir={model ? "ltr" : undefined}
            /* line-clamp sets overflow:hidden, which clips any ::after hit-area
               extension — so the 44px target is real height (min-h-11) instead. */
            className={cn("relative line-clamp-2 min-h-11 font-extrabold", model && "text-end")}
          >
            {title}
          </Link>
        </h3>

        {/* What kind of thing it is, then what distinguishes this configuration. */}
        {(model || specs) && (
          <div className="lux-meta type-support text-muted-foreground">
            {model && <span className="lux-kind">{label}</span>}
            {specs && <span className="lux-specs">{specs}</span>}
          </div>
        )}

        {swatches.length > 1 && (
          <div className="lux-swatches" role="group" aria-label="رنگ‌های موجود">
            {swatches.slice(0, MAX_SWATCHES).map((choice) => (
              <button
                key={choice.color}
                type="button"
                title={choice.color}
                aria-label={`رنگ ${choice.color}${choice.canBuy ? "" : "، ناموجود"}`}
                aria-pressed={choice.active}
                data-unavailable={choice.canBuy ? undefined : ""}
                onClick={() => {
                  setPickedId(choice.variantId);
                  setSwapped(true);
                }}
              >
                <span style={{ backgroundColor: swatchColor(choice.color) }} aria-hidden="true" />
              </button>
            ))}
            {swatches.length > MAX_SWATCHES && (
              <Link href={href} className="lux-swatches__more" aria-label={`${toFaDigits(swatches.length - MAX_SWATCHES)} رنگ دیگر`}>
                +{toFaDigits(swatches.length - MAX_SWATCHES)}
              </Link>
            )}
          </div>
        )}

        {/* Everything below is the transaction, held to the bottom so cards in a
            row align on their prices however long the names run. */}
        <div className="mt-auto pt-5">
          <div className="lux-stock flex items-center justify-between gap-2 type-label font-bold tracking-normal">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
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
              {/* «موجود» and «محدود» are two facts, so they are two marks: whether it can be bought,
                  and that few remain. Read as one phrase they ran together. */}
              {!outOfStock && activeStockType === "limited" && <span className="lux-scarce">محدود</span>}
              {off != null && (
                /* FR-011: the number is Persian even inside an LTR run, because
                   the run exists to keep the minus sign on the left, not to
                   switch the digits back to Latin. */
                <span dir="ltr" className="font-sans text-champagne tabular-nums">
                  −{toFaDigits(off)}٪
                </span>
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
          <div className="lux-buy mt-2 flex items-end justify-between gap-3">
            <div className="min-w-0">
              {state === "sale" && product.compareAtPrice != null && (
                <del className="type-caption block text-muted-foreground">
                  <TomanPrice amount={product.compareAtPrice} />
                </del>
              )}
              {state === "unavailable" ? (
                <strong className="block text-base font-bold leading-8 text-muted-foreground">
                  تماس بگیرید
                </strong>
              ) : (
                <TomanPrice
                  as="strong"
                  amount={displayPrice}
                  className="type-price tracking-normal"
                  style={{ color: "var(--lux-price)" }}
                />
              )}
            </div>

            <AddToCartButton
              productId={product.id}
              variantId={activeVariant?.id}
              disabled={!buyable || state === "unavailable"}
              iconOnly
              className="size-11 shrink-0 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: onDark ? "rgba(229, 211, 179, 0.08)" : "rgb(var(--foreground) / 0.06)",
                color: onDark ? "#E5D3B3" : "#640211",
                boxShadow: "inset 0 0 0 1px var(--lux-rule)",
              }}
            />
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
