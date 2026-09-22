"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { ProductCard, type ProductCardData } from "@/components/shop/ProductCard";
import { formatToman } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/home/Reveal";

type NewArrivalProduct = {
  id: number;
  name: string;
  slug: string;
  brand: { name: string } | null;
  displayPrice: number;
};

export function NewArrivals() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", direction: "rtl", containScroll: "trimSnaps" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [products, setProducts] = useState<NewArrivalProduct[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGet<NewArrivalProduct[]>("/api/products?pageSize=6&includeVariants=false")
      .then((data) => !cancelled && setProducts(data))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section id="new-arrivals" className="wrap container py-16 md:py-20" aria-labelledby="new-arrivals-title">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow"><i /> تازه‌ها</span>
            <h2 id="new-arrivals-title" className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              تازه <span className="grad">رسیده‌اند.</span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-foreground/60">
              جدیدترین محصولاتی که به مجموعه حامی همراه اضافه شده‌اند.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-bold text-aqua hover:underline">
              مشاهده همه <ArrowLeft className="size-4" />
            </Link>
            {/* Paired prev/next. The rail used to ship a next-only button:
                once scrolled (RTL), the only way back was a swipe, which
                keyboard and desktop-mouse users had no equivalent for. */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                aria-label="نمایش محصولات جدید قبلی"
                disabled={!emblaApi || !canPrev}
                className="grid size-11 place-items-center rounded-full border border-aqua/50 text-aqua transition-colors hover:bg-aqua/10 disabled:opacity-40"
              >
                <ArrowRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                aria-label="نمایش محصولات جدید بعدی"
                disabled={!emblaApi || !canNext}
                className="grid size-11 place-items-center rounded-full border border-aqua/50 text-aqua transition-colors hover:bg-aqua/10 disabled:opacity-40"
              >
                <ArrowLeft className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={80}>
        {error ? (
          <div className="mt-10 glass rounded-2xl p-8 text-center" role="status">
            <b className="block font-extrabold">دریافت تازه‌واردها موقتاً ممکن نیست.</b>
            <Link href="/shop" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-aqua hover:underline">
              مشاهده همه محصولات <ArrowLeft className="size-3.5" />
            </Link>
          </div>
        ) : (
          <NewArrivalsRail products={products} emblaRef={emblaRef} />
        )}
      </Reveal>
    </section>
  );
}

type RailProps = {
  products: NewArrivalProduct[] | null;
  emblaRef: (node: HTMLElement | null) => void;
};

function NewArrivalsRail({ products, emblaRef }: RailProps) {
  return (
    <div ref={emblaRef} className="mt-10 overflow-hidden" aria-busy={products === null} aria-label="ریل محصولات تازه‌وارد" aria-roledescription="carousel">
      <div className="flex touch-pan-y gap-5">
        {products === null &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-0 flex-[0_0_45%] sm:flex-[0_0_46%] lg:flex-[0_0_32%]">
              <div className="space-y-3">
                <Skeleton className="aspect-[4/5] w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        {products !== null && products.length === 0 && (
          <div className="w-full glass rounded-2xl p-8 text-center" role="status">
            <b className="block font-extrabold">چیز تازه‌ای برای نمایش نداریم.</b>
            <p className="mt-2 text-sm text-foreground/60">اما موجودی فروشگاه همچنان در حال به‌روزرسانی است.</p>
          </div>
        )}
        {products !== null && products.length > 0 && products.map((product) => <ArrivalCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}

/** The rail's slide is only a width; the card itself is the shared one, so a
 *  product looks identical here and in the shop grid. */
function ArrivalCard({ product }: { product: NewArrivalProduct }) {
  return (
    <div className="min-w-0 flex-[0_0_45%] sm:flex-[0_0_46%] lg:flex-[0_0_32%]">
      {/* Use a lighter card variant here to improve contrast against the dark background */}
      <ProductCard product={product satisfies ProductCardData} variant="museum" />
    </div>
  );
}
