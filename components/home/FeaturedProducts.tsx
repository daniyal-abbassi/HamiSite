"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, PackageCheck, ShieldCheck, Sparkles, Store } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { AdaptiveProductImage } from "@/components/shop/AdaptiveProductImage";
import { TomanPrice } from "@/components/ui/TomanPrice";
import type { RailProduct } from "@/lib/home-rails-db";
import { storeWarranty } from "@/lib/content/verified-facts";
import { isPlaceholderImage, resolveProductImage } from "@/lib/product-images";
import {
  brandLabel,
  discountPercent,
  isPurchasable,
  priceState,
  splitProductName,
  unitPriceOf,
} from "@/lib/product-identity";
import { cn, toFaDigits } from "@/lib/utils";

/** Card width + gap, in px, for one swipe step on a phone. */
const CARD_STEP = 204;

function FeaturedCard({ product, index }: { product: RailProduct; index: number }) {
  const variants = product.variants ?? [];
  const canBuy = (variant: (typeof variants)[number]) =>
    isPurchasable({ available: product.available, stockType: variant.stockType })
    && !(variant.stockType === "limited" && variant.stock <= 0);
  // Prefer the default variant, but never present a sold-out one while another can be bought.
  const active = variants.find((variant) => variant.isDefault && canBuy(variant))
    ?? variants.find(canBuy)
    ?? variants.find((variant) => variant.isDefault)
    ?? variants[0]
    ?? null;
  const price = active ? unitPriceOf(active.price, product.displayPrice) ?? 0 : product.displayPrice;
  const compareAt = active ? active.compareAtPrice : product.compareAtPrice;
  const state = priceState(price, compareAt);
  const off = discountPercent(price, compareAt);
  const stockType = active?.stockType ?? product.stockType;
  const buyable = active
    ? isPurchasable({ available: product.available, stockType }) && !(stockType === "limited" && active.stock <= 0)
    : isPurchasable(product);
  const image = active?.imageUrl ?? resolveProductImage(product);
  const { label, model } = splitProductName(product.name);
  const modelText = (product.englishName || model || "").replace(/\s+\d+\s*\/\s*\d+.*$/i, "").trim();
  const href = `/shop/${product.slug}`;
  const brand = product.brand?.name ? brandLabel(product.brand.name) : null;

  return (
    <article className="fp-card" style={{ "--fp-i": index } as React.CSSProperties}>
      <Link href={href} className="fp-card__plate" data-photo-plate="" aria-label={product.name} tabIndex={-1}>
        {!isPlaceholderImage(image) && (
          <AdaptiveProductImage
            src={image}
            alt=""
            fill
            sizes="(max-width: 767px) 196px, 240px"
            className="fp-card__image"
            priority={index < 2}
            unoptimized={!image.startsWith("/")}
          />
        )}
        {off != null && <span className="fp-card__off">٪{toFaDigits(off)} تخفیف</span>}
        {product.specialOffer && off == null && (
          <span className="fp-card__off fp-card__off--gold"><Sparkles aria-hidden="true" /> ویژه</span>
        )}
      </Link>

      <div className="fp-card__body">
        {brand && <span className="fp-card__brand">{brand}</span>}
        <h3 className="fp-card__name">
          <Link href={href}>{label}</Link>
        </h3>
        {modelText && <span className="fp-card__model" dir="ltr">{modelText}</span>}

        <div className="fp-card__buy">
          <div className="fp-card__price">
            {state === "sale" && compareAt != null && (
              <del><TomanPrice amount={compareAt} /></del>
            )}
            {state === "unavailable" ? (
              <strong className="fp-card__call">تماس بگیرید</strong>
            ) : (
              <TomanPrice as="strong" amount={price} />
            )}
          </div>
          <AddToCartButton
            productId={product.id}
            variantId={active?.id}
            disabled={!buyable || state === "unavailable"}
            iconOnly
            className="fp-card__cart"
          />
        </div>
      </div>
    </article>
  );
}

export function FeaturedProducts({ products }: { products: RailProduct[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const measure = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    const max = element.scrollWidth - element.clientWidth;
    const count = max > 10 ? Math.ceil(max / CARD_STEP) + 1 : 1;
    setPages(Math.min(count, 8));
    setPage(max > 10 ? Math.min(count - 1, Math.round(Math.abs(element.scrollLeft) / CARD_STEP)) : 0);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, products]);

  const go = (direction: 1 | -1) => {
    const element = scroller.current;
    if (!element) return;
    // In an RTL scroller "forward" is toward negative scrollLeft.
    const axis = getComputedStyle(element).direction === "rtl" ? -1 : 1;
    element.scrollBy({ left: direction * axis * CARD_STEP * 2, behavior: "smooth" });
  };

  return (
    <section id="featured" className="featured-products fp" aria-labelledby="featured-title">
      <div className="fp__inner">
        <Reveal>
          <header className="fp__head">
            <span className="eyebrow"><i /> تازه‌ترین‌ها، آماده سفارش</span>
            <h2 id="featured-title" className="fp__title">
              محصولات <span className="emphasis">حامی همراه</span>
            </h2>
            <p className="fp__sub">
              هر چیزی که این‌جا می‌بینید همین امروز قابل خرید است؛ با {storeWarranty.label}.
            </p>
            <ul className="fp__proof" role="list">
              <li><PackageCheck aria-hidden="true" /> موجود و قابل خرید</li>
              <li><ShieldCheck aria-hidden="true" /> گارانتی ۱۸ ماهه شرکتی</li>
              <li><Store aria-hidden="true" /> فروشگاه حضوری در مشهد</li>
            </ul>
          </header>
        </Reveal>

        <Reveal delay={80}>
          <div className="fp__rail-wrap">
            <div
              ref={scroller}
              onScroll={measure}
              className="fp__rail"
              role="region"
              aria-label="فهرست محصولات حامی همراه"
              tabIndex={0}
            >
              {products.map((product, index) => (
                <FeaturedCard key={product.id} product={product} index={index} />
              ))}
              {products.length === 0 && (
                <p className="fp__empty" role="status">در حال حاضر محصولی برای نمایش نیست.</p>
              )}
            </div>

            {products.length > 1 && (
              <>
                <button type="button" className="fp__nav fp__nav--prev extend-touch-target" onClick={() => go(-1)} aria-label="محصولات قبلی">
                  <ArrowRight aria-hidden="true" />
                </button>
                <button type="button" className="fp__nav fp__nav--next extend-touch-target" onClick={() => go(1)} aria-label="محصولات بعدی">
                  <ArrowLeft aria-hidden="true" />
                </button>
              </>
            )}
          </div>

          {pages > 1 && (
            <div className="fp__dots" aria-hidden="true">
              {Array.from({ length: pages }).map((_, i) => (
                <span key={i} className={cn(page === i && "is-active")} />
              ))}
            </div>
          )}
        </Reveal>

        <div className="fp__cta">
          <Link href="/shop" className="cta-lux cta-lux--gold lightbeam-cta">
            <span>مشاهده همه‌ی محصولات</span>
            <ArrowLeft aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
