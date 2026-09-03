"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { resolveProductImage } from "@/lib/product-images";
import { formatToman } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/home/Reveal";

type ProductCard = {
  id: number;
  name: string;
  slug: string;
  brand: { name: string } | null;
  displayPrice: number;
};

export function NewArrivals() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", direction: "rtl", containScroll: "trimSnaps" });
  const [canNext, setCanNext] = useState(false);
  const [products, setProducts] = useState<ProductCard[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGet<ProductCard[]>("/api/products?pageSize=6&includeVariants=false")
      .then((data) => !cancelled && setProducts(data))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const onSelect = useCallback(() => {
    if (emblaApi) setCanNext(emblaApi.canScrollNext());
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
    <section id="new-arrivals" className="wrap container py-20" aria-labelledby="new-arrivals-title">
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
            <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-bold text-gold hover:underline">
              مشاهده همه <ArrowLeft className="size-4" />
            </Link>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              aria-label="نمایش محصولات جدید بعدی"
              disabled={!emblaApi || !canNext}
              className="grid size-10 place-items-center rounded-full border border-gold/50 text-gold transition-colors hover:bg-gold/10 disabled:opacity-40"
            >
              <ArrowLeft className="size-4" />
            </button>
          </div>
        </div>
      </Reveal>

      <Reveal delay={80}>
        {error ? (
          <div className="mt-10 glass rounded-2xl p-8 text-center" role="status">
            <b className="block font-extrabold">دریافت تازه‌واردها موقتاً ممکن نیست.</b>
            <Link href="/shop" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-gold hover:underline">
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
  products: ProductCard[] | null;
  emblaRef: (node: HTMLElement | null) => void;
};

function NewArrivalsRail({ products, emblaRef }: RailProps) {
  return (
    <div ref={emblaRef} className="mt-10 overflow-hidden" aria-busy={products === null} aria-label="ریل محصولات تازه‌وارد" aria-roledescription="carousel">
      <div className="flex touch-pan-y gap-5">
        {products === null &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-0 flex-[0_0_78%] sm:flex-[0_0_42%] lg:flex-[0_0_28%]">
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

function ArrivalCard({ product }: { product: ProductCard }) {
  return (
    <article className="min-w-0 flex-[0_0_78%] sm:flex-[0_0_42%] lg:flex-[0_0_28%]">
      <div className="glass group overflow-hidden rounded-2xl transition-transform duration-slow hover:-translate-y-1.5">
        <div className="relative aspect-[4/5] overflow-hidden bg-ink/40">
          <span className="absolute start-3 top-3 z-10 rounded-full bg-gold px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.08em] text-primary-foreground">
            NEW
          </span>
          <Link href={`/shop/${product.slug}`} className="grid h-full place-items-center" aria-label={product.name}>
            <Image
              src={resolveProductImage(product)}
              alt={product.name}
              width={600}
              height={750}
              className="size-full object-contain p-6 transition-transform duration-slow group-hover:scale-105"
            />
          </Link>
        </div>
        <div className="p-4">
          <span className="font-mono text-[9px] tracking-[0.1em] text-foreground/50">{product.brand?.name ?? "—"}</span>
          <h3 className="mt-1 text-sm font-extrabold leading-6">
            <Link href={`/shop/${product.slug}`} className="hover:text-gold">{product.name}</Link>
          </h3>
          <strong className="mt-2 block text-sm font-black text-gold">{formatToman(product.displayPrice)}</strong>
        </div>
      </div>
    </article>
  );
}

