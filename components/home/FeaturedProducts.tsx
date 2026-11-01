"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { AdaptiveProductImage } from "@/components/shop/AdaptiveProductImage";
import { TomanPrice } from "@/components/ui/TomanPrice";
import type { RailProduct } from "@/lib/home-rails-db";
import { storeWarranty, trustFacts } from "@/lib/content/verified-facts";
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

const STORE_FACT = trustFacts.find((fact) => fact.key === "store")?.label;

function smoothOrInstant(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

/** Storage, RAM and colour count, read only from the catalogue record. */
function specFacts(specs: string | null, colorCount: number) {
  const ram = specs?.match(/رم\s*([\d.]+)\s*گیگابایت/);
  const storage = specs?.replace(ram?.[0] ?? "", "").match(/([\d.]+)\s*(گیگابایت|ترابایت)/);
  return [
    storage && `${toFaDigits(storage[1])} ${storage[2]}`,
    ram && `رم ${toFaDigits(ram[1])} گیگابایت`,
    colorCount > 1 && `${toFaDigits(colorCount)} رنگ`,
  ].filter((fact): fact is string => Boolean(fact));
}

function presentProduct(product: RailProduct) {
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
  const stockType = active?.stockType ?? product.stockType;
  const { label, model, specs } = splitProductName(product.name);

  return {
    variantId: active?.id,
    price,
    compareAt,
    state: priceState(price, compareAt),
    off: discountPercent(price, compareAt),
    buyable: active
      ? isPurchasable({ available: product.available, stockType }) && !(stockType === "limited" && active.stock <= 0)
      : isPurchasable(product),
    image: active?.imageUrl ?? resolveProductImage(product),
    title: model || product.englishName || label,
    // The catalogue label already names the brand: «گوشی موبایل سامسونگ».
    descriptor: model ? label : product.brand?.name ? brandLabel(product.brand.name) : null,
    facts: specFacts(specs, product.variantColors?.length ?? 0),
    href: `/shop/${product.slug}`,
  };
}

function ShowcaseSlide({
  product,
  index,
  total,
  isActive,
  isNear,
}: {
  product: RailProduct;
  index: number;
  total: number;
  isActive: boolean;
  isNear: boolean;
}) {
  const item = presentProduct(product);

  return (
    <article className={cn("fp-slide", isActive && "is-active")} aria-label={product.name}>
      <Link
        href={item.href}
        className="fp-slide__plate"
        data-photo-plate=""
        data-kind={item.image.startsWith("/images/products/") ? "studio" : undefined}
        aria-label={product.name}
        tabIndex={-1}
      >
        {!isPlaceholderImage(item.image) && (
          <AdaptiveProductImage
            src={item.image}
            alt=""
            fill
            sizes="(max-width: 1023px) 100vw, 500px"
            className="fp-slide__image"
            priority={index === 0}
            loading={index > 0 && isNear ? "eager" : undefined}
            unoptimized={!item.image.startsWith("/")}
          />
        )}
      </Link>

      <div className="fp-slide__info">
        <div className="fp-slide__meta">
          {item.descriptor && <span>{item.descriptor}</span>}
          <span className="fp-slide__count" aria-hidden="true">
            {toFaDigits(index + 1)} / {toFaDigits(total)}
          </span>
        </div>

        <h3 className="fp-slide__title">
          <Link href={item.href}><bdi>{item.title}</bdi></Link>
        </h3>

        {item.facts.length > 0 && (
          <ul className="fp-slide__facts" role="list">
            {item.facts.map((fact) => <li key={fact}>{fact}</li>)}
          </ul>
        )}

        <div className="fp-slide__price">
          {item.state === "unavailable" ? (
            <strong>تماس بگیرید</strong>
          ) : (
            <TomanPrice as="strong" amount={item.price} />
          )}
          {item.state === "sale" && item.compareAt != null && (
            <span className="fp-slide__was">
              <del><TomanPrice amount={item.compareAt} /></del>
              {item.off != null && <b>٪{toFaDigits(item.off)} تخفیف</b>}
            </span>
          )}
          {product.specialOffer && item.off == null && (
            <span className="fp-slide__was"><b><Sparkles aria-hidden="true" /> ویژه</b></span>
          )}
        </div>

        <div className="fp-slide__actions">
          <AddToCartButton
            productId={product.id}
            variantId={item.variantId}
            disabled={!item.buyable || item.state === "unavailable"}
            label="افزودن به سبد"
            cartIcon
            className="fp-slide__cart"
          />
          <Link href={item.href} className="fp-slide__details">جزئیات</Link>
        </div>
      </div>
    </article>
  );
}

export function FeaturedProducts({ products }: { products: RailProduct[] }) {
  const stage = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [active, setActive] = useState(0);

  const handleScroll = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const element = stage.current;
      if (!element) return;
      // Slides are narrower than the stage so the next one peeks in; measure the real step.
      const [first, second] = element.children;
      const step = first && second
        ? Math.abs((first as HTMLElement).offsetLeft - (second as HTMLElement).offsetLeft)
        : element.clientWidth;
      // scrollLeft is negative in an RTL scroller.
      setActive(Math.round(Math.abs(element.scrollLeft) / step));
    });
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  useEffect(() => {
    const container = strip.current;
    const thumb = container?.children[active];
    if (!container || !thumb) return;
    const box = container.getBoundingClientRect();
    const rect = thumb.getBoundingClientRect();
    const offset = rect.left + rect.width / 2 - (box.left + box.width / 2);
    container.scrollBy({ left: offset, behavior: smoothOrInstant() });
  }, [active]);

  const goTo = (index: number) => {
    const element = stage.current;
    const slide = element?.children[index];
    if (!element || !slide) return;
    // Slides snap to the stage's inline start, which in RTL is its right edge inside the padding.
    const inset = parseFloat(getComputedStyle(element).paddingInlineStart) || 0;
    const offset = slide.getBoundingClientRect().right - (element.getBoundingClientRect().right - inset);
    // A long jump would otherwise sweep the shopper through every product in between.
    const behavior = Math.abs(index - active) === 1 ? smoothOrInstant() : "auto";
    element.scrollBy({ left: offset, behavior });
  };

  return (
    <section id="featured" className="featured-products fp" aria-labelledby="featured-title">
      <div className="fp__inner">
        <Reveal>
          <header className="fp__head">
            <span className="eyebrow"><i /> آماده سفارش</span>
            <h2 id="featured-title" className="fp__title">
              ویترین <span className="emphasis">حامی همراه</span>
            </h2>
          </header>
        </Reveal>

        {products.length === 0 ? (
          <p className="fp__empty" role="status">در حال حاضر محصولی برای نمایش نیست.</p>
        ) : (
          <Reveal delay={80}>
            <div
              ref={stage}
              onScroll={handleScroll}
              className="fp__stage"
              role="region"
              aria-label="ویترین محصولات حامی همراه"
              tabIndex={0}
            >
              {products.map((product, index) => (
                <ShowcaseSlide
                  key={product.id}
                  product={product}
                  index={index}
                  total={products.length}
                  isActive={index === active}
                  isNear={Math.abs(index - active) === 1}
                />
              ))}
            </div>

            {products.length > 1 && (
              <div className="fp__picker">
                <button
                  type="button"
                  className="fp__nav"
                  onClick={() => goTo(active - 1)}
                  disabled={active === 0}
                  aria-label="محصولات قبلی"
                >
                  <ArrowRight aria-hidden="true" />
                </button>

                <div ref={strip} className="fp__thumbs">
                  {products.map((product, index) => {
                    const item = presentProduct(product);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        className={cn("fp__thumb", index === active && "is-active")}
                        onClick={() => goTo(index)}
                        aria-label={`نمایش ${item.title}`}
                        aria-current={index === active ? "true" : undefined}
                      >
                        {!isPlaceholderImage(item.image) && (
                          <Image
                            src={item.image}
                            alt=""
                            fill
                            sizes="80px"
                            unoptimized={!item.image.startsWith("/")}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="fp__nav"
                  onClick={() => goTo(active + 1)}
                  disabled={active === products.length - 1}
                  aria-label="محصولات بعدی"
                >
                  <ArrowLeft aria-hidden="true" />
                </button>
              </div>
            )}
          </Reveal>
        )}

        <footer className="fp__foot">
          <p className="fp__trust">
            <span>{storeWarranty.label}</span>
            {STORE_FACT && <span>{STORE_FACT}</span>}
          </p>
          <Link href="/shop" className="fp__all">
            <span>مشاهده همه‌ی محصولات</span>
            <ArrowLeft aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </section>
  );
}
