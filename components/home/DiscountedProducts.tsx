"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgePercent, Check, Crown, ShoppingCart, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import type { DiscountRailProduct, RailProduct } from "@/lib/home-rails-db";
import { isPurchasable } from "@/lib/product-identity";
import { formatToman, toFaDigits } from "@/lib/utils";

const SPARKLES = [
  { left: "12%", top: "18%", delay: "0s" },
  { left: "68%", top: "8%", delay: "1.1s" },
  { left: "32%", top: "84%", delay: "2.2s" },
  { left: "88%", top: "62%", delay: "1.7s" },
  { left: "52%", top: "40%", delay: "2.9s" },
];

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

function discountCopy(rate: number | null) {
  if (rate == null) return "";
  const percent = Math.round(rate * 100);
  return percent < 1 ? "کمتر از ۱٪" : `٪${toFaDigits(percent)}`;
}

function purchaseStatus(product: RailProduct, variant: ReturnType<typeof selectedVariant>) {
  const stockType = variant?.stockType ?? product.stockType;
  const stock = variant?.stock;
  const canBuy = isPurchasable({ available: product.available, stockType })
    && !(variant && stockType === "limited" && (stock ?? 0) <= 0);
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

function DiscountMeter({ rate, scale, featured = false }: { rate: number | null; scale: number; featured?: boolean }) {
  if (rate == null) return null;
  const width = scale > 0 ? Math.min(100, (rate / scale) * 100) : 0;
  return (
    <div className={`deal-meter${featured ? " deal-meter--featured" : ""}`}>
      <div className="deal-meter__labels">
        <span>میزان تخفیف</span>
        <strong>{discountCopy(rate)}</strong>
      </div>
      <div className="deal-meter__track" aria-hidden="true">
        <span style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function VariantSwatches({
  product,
  activeId,
  compact = false,
  onSelect,
}: {
  product: RailProduct;
  activeId: number | undefined;
  compact?: boolean;
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
  if (!byColor.size) return null;

  const active = variants.find((variant) => variant.id === activeId);
  return (
    <div className={`deal-swatches${compact ? " deal-swatches--compact" : ""}`} role="group" aria-label="انتخاب رنگ محصول">
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
            <span className="deal-swatches__color" style={{ backgroundColor: swatchColor(color) }} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

function ProductDeal({
  product,
  featured,
  index,
  scale,
}: {
  product: DiscountRailProduct;
  featured: boolean;
  index: number;
  scale: number;
}) {
  const [variantId, setVariantId] = useState(product.initialVariantId);
  const variant = selectedVariant(product, variantId);
  const price = variant?.price ?? product.displayPrice;
  const compareAtPrice = variant ? variant.compareAtPrice : product.compareAtPrice;
  const rate = discountRate(price, compareAtPrice);
  const status = purchaseStatus(product, variant);
  const image = variant?.imageUrl
    ?? product.images?.find((item) => item.isDefault)?.url
    ?? product.images?.[0]?.url;
  const name = product.englishName?.trim() || product.name;
  const subline = product.brand?.name;
  const href = `/shop/${encodeURIComponent(product.slug)}`;
  const sizes = featured
    ? "(max-width: 1023px) 100vw, 42vw"
    : "(max-width: 639px) 40vw, (max-width: 1023px) 22vw, 18vw";

  if (featured) {
    return (
      <article className="deal-featured" style={{ animationDelay: `${0.12 + index * 0.08}s` }}>
        <Link href={href} className="deal-featured__media" aria-label={`مشاهده ${product.name}`}>
          {image ? <Image src={image} alt={product.name} fill sizes={sizes} className="deal-featured__image" /> : null}
          <span className="deal-featured__shade" aria-hidden="true" />
          <Badge
            tone="warning"
            size="md"
            icon={<Crown aria-hidden="true" fill="currentColor" />}
            className="deal-featured__badge"
          >
            پیشنهاد شگفت‌انگیز
          </Badge>
          <span className="deal-featured__caption">
            <strong dir="auto">{name}</strong>
            {subline && <span>{subline}</span>}
          </span>
        </Link>

        <div className="deal-featured__body">
          <ul className="deal-featured__facts">
            {product.brand?.name && <li><Check aria-hidden="true" />{product.brand.name}</li>}
            <li><Check aria-hidden="true" />{status.label}</li>
          </ul>
          <VariantSwatches product={product} activeId={variant?.id} onSelect={setVariantId} />
          <DiscountMeter rate={rate} scale={scale} featured />
          <div className="deal-featured__price-row">
            <div className="deal-featured__prices">
              {rate != null && compareAtPrice != null && <del>{formatToman(compareAtPrice)}</del>}
              <strong>{formatToman(price)}</strong>
            </div>
            {rate != null && (
              <Badge
                tone="danger"
                size="md"
                icon={<BadgePercent aria-hidden="true" />}
                className="deal-featured__percent"
              >
                {discountCopy(rate)}
              </Badge>
            )}
          </div>
          <AddToCartButton
            productId={product.id}
            variantId={variant?.id}
            disabled={!status.canBuy}
            label={rate != null ? "خرید با تخفیف ویژه" : "افزودن به سبد"}
            cartIcon
            className="deal-featured__cart"
          />
        </div>
      </article>
    );
  }

  return (
    <article className="deal-card" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
      <Link href={href} className="deal-card__media" aria-label={`مشاهده ${product.name}`}>
        {image ? <Image src={image} alt={product.name} fill sizes={sizes} className="deal-card__image" /> : null}
        <span className="deal-card__shade" aria-hidden="true" />
        {rate != null && (
          <Badge
            tone="danger"
            size="sm"
            icon={<BadgePercent aria-hidden="true" />}
            className="deal-card__percent"
          >
            {discountCopy(rate)}
          </Badge>
        )}
      </Link>
      <div className="deal-card__body">
        <div className="deal-card__intro">
          <div className="deal-card__title-row">
            <h3><Link href={href} dir="auto">{name}</Link></h3>
          </div>
          {subline && <p>{subline}</p>}
          <VariantSwatches product={product} activeId={variant?.id} compact onSelect={setVariantId} />
          <div className="deal-card__status"><span aria-hidden="true" />{status.label}</div>
          <DiscountMeter rate={rate} scale={scale} />
        </div>
        <div className="deal-card__bottom">
          <div className="deal-card__prices">
            {rate != null && compareAtPrice != null && <del>{formatToman(compareAtPrice)}</del>}
            <strong>{formatToman(price)}</strong>
          </div>
          <AddToCartButton
            productId={product.id}
            variantId={variant?.id}
            disabled={!status.canBuy}
            iconOnly
            label="افزودن به سبد"
            className="deal-card__cart"
          />
        </div>
      </div>
    </article>
  );
}

export function DiscountedProducts({ products }: { products: DiscountRailProduct[] }) {
  const featured = products[0];
  const supporting = products.slice(1, 5);
  if (!featured) return null;

  const scale = Math.max(0, ...products.map((product) => bestReduction(product) ?? 0));
  const bestPercent = Math.round((bestReduction(featured) ?? 0) * 100);

  return (
    <section id="discounted" className="discounted-products" aria-labelledby="discounted-title">
      <div className="discounted-products__panel">
        <div className="deal-panel__glow deal-panel__glow--top" aria-hidden="true" />
        <div className="deal-panel__glow deal-panel__glow--bottom" aria-hidden="true" />
        {SPARKLES.map((sparkle, index) => (
          <span
            key={index}
            className="deal-panel__sparkle"
            aria-hidden="true"
            style={{ left: sparkle.left, top: sparkle.top, animationDelay: sparkle.delay }}
          />
        ))}

        <div className="discounted-products__content">
          <header className="discounted-products__header">
            <div className="discounted-products__heading">
              <span className="discounted-products__eyebrow">
                <Sparkles aria-hidden="true" />
                پیشنهادهای منتخب
              </span>
              <h2 id="discounted-title"><span>محصولات تخفیف‌دار</span></h2>
              <p>قیمت ویژه برای انتخابی از محصولات متنوع حامی همراه.</p>
              <div className="discounted-products__rule" aria-hidden="true" />
            </div>

            <div className="discounted-products__summary" aria-label="خلاصه پیشنهادهای تخفیف‌دار">
              <p><Zap aria-hidden="true" /> وضعیت تخفیف‌ها</p>
              <div className="discounted-products__summary-items">
                <div><strong>{toFaDigits(bestPercent)}٪</strong><span>بیشترین تخفیف</span></div>
                <div><strong>{toFaDigits(products.length)}</strong><span>محصول قابل خرید</span></div>
              </div>
            </div>
          </header>

          <div className="discounted-products__grid">
            <div className="discounted-products__lead">
              <ProductDeal product={featured} featured index={0} scale={scale} />
            </div>
            {supporting.length > 0 && (
              <div className="discounted-products__supporting">
                {supporting.map((product, index) => (
                  <ProductDeal key={product.id} product={product} featured={false} index={index} scale={scale} />
                ))}
              </div>
            )}
          </div>

          <p className="discounted-products__note">
            <ShoppingCart aria-hidden="true" /> قیمت و درصد تخفیف از اطلاعات فعلی محصول محاسبه می‌شود.
          </p>
          <Link href="/shop" className="discounted-products__all">
            مشاهده فروشگاه <ArrowLeft aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
