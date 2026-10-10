"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { type ProductCardData } from "@/components/shop/ProductCard";
import { ProductCard } from "@/components/shop/ProductCard";
import type { RailProduct } from "@/lib/home-rails-db";
import { toFaDigits } from "@/lib/utils";

const CARD_STEP = 292;

function pageStep(element: HTMLDivElement) {
  return element.clientWidth < 768 ? CARD_STEP : Math.max(CARD_STEP, element.clientWidth - CARD_STEP);
}

export function FeaturedProducts({ products }: { products: RailProduct[] }) {
  const [wishlist, setWishlist] = useState<Set<number>>(() => new Set());
  const [selectedVariantIds, setSelectedVariantIds] = useState<Record<number, number>>({});
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const scroller = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    const max = element.scrollWidth - element.clientWidth;
    const step = pageStep(element);
    const count = max > 10 ? Math.ceil(max / step) + 1 : 1;
    setPages(count);
    setPage(max > 10 ? Math.min(count - 1, Math.round(element.scrollLeft / step)) : 0);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, products]);

  const toggleWish = (id: number) => {
    setWishlist((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectVariant = (productId: number, variantId: number) => {
    setSelectedVariantIds((current) => ({ ...current, [productId]: variantId }));
  };

  const scrollToPage = (index: number) => {
    if (!scroller.current) return;
    scroller.current.scrollTo({ left: index * pageStep(scroller.current), behavior: "smooth" });
  };

  const nextPage = () => scrollToPage(page >= pages - 1 ? 0 : page + 1);

  return (
    <section id="featured" className="featured-products" aria-labelledby="featured-title">
      <div className="featured-products__inner">
        <div className="featured-products__flourish" aria-hidden="true">
          <p>کیفیت، اعتبار، همراهی همیشگی</p>
          <svg viewBox="0 0 320 64" fill="none">
            <path d="M8 30 C 80 50 240 50 312 22" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M52 40 C 120 52 200 52 268 38" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".45" />
            <path d="M160 20c-3.2-6.4-13-5.2-13 2.2 0 6 13 13 13 13s13-7 13-13c0-7.4-9.8-8.6-13-2.2z" fill="currentColor" />
            <circle cx="26" cy="33" r="2.2" fill="currentColor" opacity=".8" />
            <circle cx="296" cy="27" r="2.2" fill="currentColor" opacity=".8" />
          </svg>
        </div>

        <Reveal>
          <header className="featured-products__header">
            <div className="featured-products__heading">
              <h2 id="featured-title" className="featured-products__title">محصولات حامی همراه</h2>
            </div>
          </header>
        </Reveal>

        <Reveal delay={80} className="featured-products__catalogue">
          <div className="featured-products__carousel-wrap">
            <div
              ref={scroller}
              onScroll={(event) => setPage(Math.round(event.currentTarget.scrollLeft / pageStep(event.currentTarget)))}
              dir="ltr"
              className="featured-products__carousel"
              aria-label="فهرست محصولات حامی همراه"
            >
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product as ProductCardData}
                  index={index}
                  variant="museum"
                  frame="bleed"
                  sourceStyle
                  wished={wishlist.has(product.id)}
                  onWish={toggleWish}
                  selectedVariantId={selectedVariantIds[product.id]}
                  onVariantChange={(variantId) => selectVariant(product.id, variantId)}
                  imageSizes="292px"
                />
              ))}
              {products.length === 0 && (
                <div className="featured-products__empty" dir="rtl" role="status">
                  <Heart aria-hidden="true" />
                  <p>در حال حاضر محصولی برای نمایش نیست.</p>
                </div>
              )}
            </div>

            {products.length > 0 && (
              <button type="button" className="featured-products__next" onClick={nextPage} aria-label="محصولات بعدی">
                <ArrowRight aria-hidden="true" />
              </button>
            )}
          </div>

          {pages > 1 && (
            <div className="featured-products__pagination" aria-label="صفحه‌های محصولات">
              {Array.from({ length: pages }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`صفحه ${toFaDigits(index + 1)}`}
                  aria-current={page === index ? "page" : undefined}
                  className={page === index ? "is-active" : undefined}
                  onClick={() => scrollToPage(index)}
                />
              ))}
            </div>
          )}
        </Reveal>

        <div className="featured-products__footer-cta">
          <Link href="/shop" className="featured-products__all">مشاهده فروشگاه <ArrowLeft aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}
