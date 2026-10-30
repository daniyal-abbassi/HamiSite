"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { AdaptiveProductImage } from "@/components/shop/AdaptiveProductImage";
import { TomanPrice } from "@/components/ui/TomanPrice";
import type { DiscountRailProduct, RailProduct } from "@/lib/home-rails-db";
import { isPlaceholderImage, resolveProductImage } from "@/lib/product-images";
import { isPurchasable, splitProductName } from "@/lib/product-identity";
import { cn, toFaDigits } from "@/lib/utils";

function selectedVariant(product: RailProduct, variantId?: number) {
  return product.variants?.find((variant) => variant.id === variantId)
    ?? product.variants?.find((variant) => variant.isDefault)
    ?? product.variants?.[0]
    ?? null;
}

function discountRate(price: number, compareAtPrice?: number | null) {
  if (!compareAtPrice || price <= 0 || compareAtPrice <= price) return null;
  return (compareAtPrice - price) / compareAtPrice;
}

function discountCopy(rate: number) {
  const percent = Math.round(rate * 100);
  return percent < 1 ? "کمتر از ۱٪" : `٪${toFaDigits(percent)}`;
}

function purchaseStatus(product: RailProduct, variant: ReturnType<typeof selectedVariant>) {
  const stockType = variant?.stockType ?? product.stockType;
  const canBuy = isPurchasable({ available: product.available, stockType })
    && !(variant && stockType === "limited" && (variant.stock ?? 0) <= 0);
  if (!canBuy) return { canBuy: false, label: "ناموجود" };
  return { canBuy: true, label: stockType === "limited" ? "موجود محدود" : "موجود" };
}

function swatchColor(value: string) {
  const normalized = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3,8}$/i.test(normalized)) return normalized;
  const colors: Record<string, string> = {
    "مشکی": "#292526", black: "#292526", "سفید": "#f7f5f2", white: "#f7f5f2",
    "نقره‌ای": "#b9bdc3", "نقره ای": "#b9bdc3", silver: "#b9bdc3",
    "خاکستری": "#8d9298", gray: "#8d9298", grey: "#8d9298",
    "آبی": "#566b82", blue: "#566b82", "سبز": "#617660", green: "#617660",
    "قرمز": "#a83242", red: "#a83242", "طلایی": "#b99a58", gold: "#b99a58",
    "زرد": "#d1ac3d", yellow: "#d1ac3d", "صورتی": "#dfabb8", pink: "#dfabb8",
  };
  return colors[normalized] ?? "#a9a4a4";
}

function bestReduction(product: DiscountRailProduct) {
  if (product.initialVariantId != null) {
    const variant = product.variants?.find((item) => item.id === product.initialVariantId);
    return discountRate(variant?.price ?? 0, variant?.compareAtPrice);
  }
  return discountRate(product.displayPrice, product.compareAtPrice);
}

function VariantSwatches({
  product,
  activeId,
  onSelect,
}: {
  product: RailProduct;
  activeId: number | undefined;
  onSelect: (variantId: number) => void;
}) {
  const variants = product.variants ?? [];
  const byColor = new Map<string, NonNullable<RailProduct["variants"]>[number]>();
  for (const variant of variants) {
    if (!variant.color) continue;
    const current = byColor.get(variant.color);
    const candidate = purchaseStatus(product, variant).canBuy;
    const currentCanBuy = current ? purchaseStatus(product, current).canBuy : false;
    if (!current || (candidate && !currentCanBuy)) byColor.set(variant.color, variant);
  }
  if (byColor.size < 2) return null;

  const active = variants.find((variant) => variant.id === activeId);
  return (
    <div className="offer__swatches" role="group" aria-label="انتخاب رنگ محصول">
      {[...byColor.entries()].map(([color, variant]) => {
        const canBuy = purchaseStatus(product, variant).canBuy;
        return (
          <button
            key={color}
            type="button"
            title={color}
            aria-label={`رنگ ${color}${canBuy ? "" : "، ناموجود"}`}
            aria-pressed={active?.color === color}
            disabled={!canBuy}
            onClick={() => onSelect(variant.id)}
          >
            <span style={{ backgroundColor: swatchColor(color) }} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

function Offer({ product, lead = false }: { product: DiscountRailProduct; lead?: boolean }) {
  const [variantId, setVariantId] = useState(product.initialVariantId);
  const variant = selectedVariant(product, variantId);
  const price = variant?.price ?? product.displayPrice;
  const compareAtPrice = variant ? variant.compareAtPrice : product.compareAtPrice;
  const rate = discountRate(price, compareAtPrice);
  const status = purchaseStatus(product, variant);
  const image = variant?.imageUrl ?? resolveProductImage(product);
  const { label, model } = splitProductName(product.name);
  const title = model || product.englishName?.trim() || label;
  const href = `/shop/${encodeURIComponent(product.slug)}`;

  return (
    <article className={cn("offer", lead && "offer--lead")}>
      <div className="offer__niche">
        <Link
          href={href}
          className="offer__plate"
          data-photo-plate=""
          data-kind={image.startsWith("/images/products/") ? "studio" : undefined}
          aria-label={product.name}
          tabIndex={-1}
        >
          {!isPlaceholderImage(image) && (
            <AdaptiveProductImage
              src={image}
              alt=""
              fill
              sizes={lead ? "(max-width: 1023px) 86vw, 460px" : "(max-width: 639px) 46vw, 300px"}
              className="offer__image"
            />
          )}
        </Link>
        {rate != null && (
          <span className="offer__seal">
            <b>{discountCopy(rate)}</b>
            {lead && <small>تخفیف</small>}
          </span>
        )}
      </div>

      <div className="offer__body">
        {lead && <p className="offer__label">{label}</p>}
        <h3 className="offer__title">
          <Link href={href}><bdi>{title}</bdi></Link>
        </h3>

        {lead && <VariantSwatches product={product} activeId={variant?.id} onSelect={setVariantId} />}

        <div className="offer__price">
          {rate != null && compareAtPrice != null && <del><TomanPrice amount={compareAtPrice} /></del>}
          <TomanPrice as="strong" amount={price} />
        </div>

        {lead && rate != null && compareAtPrice != null && (
          <p className="offer__saving">
            <span>صرفه‌جویی شما</span>
            <TomanPrice amount={compareAtPrice - price} />
          </p>
        )}

        <AddToCartButton
          productId={product.id}
          variantId={variant?.id}
          disabled={!status.canBuy}
          label={lead ? "افزودن به سبد" : "افزودن"}
          cartIcon
          className="offer__cart"
        />

        {lead && <p className="offer__status">{status.label}</p>}
      </div>
    </article>
  );
}

export function DiscountedProducts({ products }: { products: DiscountRailProduct[] }) {
  const [lead, ...supporting] = products;
  if (!lead) return null;

  const deepest = Math.max(0, ...products.map((product) => bestReduction(product) ?? 0));

  return (
    <section id="discounted" className="offers" aria-labelledby="discounted-title">
      <div className="offers__inner">
        <Reveal>
          <header className="offers__head">
            <span className="eyebrow"><i /> پیشنهادهای منتخب</span>
            <h2 id="discounted-title" className="offers__title">
              فرصت‌های <span className="emphasis">ویژه</span>
            </h2>
            {deepest > 0 && (
              <p>
                تا {discountCopy(deepest)} تخفیف روی {toFaDigits(products.length)} انتخاب حامی همراه
              </p>
            )}
          </header>
        </Reveal>

        <div className="offers__portal">
          <Reveal className="offers__lead">
            <Offer product={lead} lead />
          </Reveal>
          {supporting.slice(0, 4).map((product, index) => (
            <Reveal key={product.id} delay={60 + index * 60} className="offers__minor">
              <Offer product={product} />
            </Reveal>
          ))}
        </div>

        <Link href="/shop" className="offers__all">
          <span>مشاهده فروشگاه</span>
          <ArrowLeft aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
