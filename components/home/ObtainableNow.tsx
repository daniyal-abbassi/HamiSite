import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { obtainableNowRail } from "@/lib/home-rails";
import { ProductRail } from "@/components/shop/ProductRail";
import { DataCurrencyNote } from "@/components/shop/DataCurrencyNote";
import { type ProductCardData } from "@/components/shop/ProductCard";
import { toFaDigits } from "@/lib/utils";

/**
 * The one shelf on the site whose heading is an availability claim, so it lists only
 * what the merchant's own `purchasable` flag and a real price agree on — see
 * `obtainableNowRail()`. Every other rail on this page says «منتخب» or «تازه‌ها» over
 * stock the shop cannot sell; that is the difference between decoration and a shop.
 *
 * Renders nothing when the answer is nothing. A heading over an empty frame would be
 * the loudest possible way of claiming stock that is not there (FR-005).
 */
export function ObtainableNow() {
  const { products, total } = obtainableNowRail();
  if (total === 0) return null;

  return (
    <section id="obtainable-now" className="wrap container py-14 md:py-16" aria-labelledby="obtainable-now-title">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="eyebrow">
            <i /> موجودی همین حالا
          </span>
          <h2 id="obtainable-now-title" className="mt-4 text-2xl font-black tracking-normal md:text-4xl">
            همین حالا <span className="emphasis">قابل خرید.</span>
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-foreground/60">
            {toFaDigits(total)} محصول از فروشگاه که همین امروز می‌توانید به سبد اضافه کنید — ارزان‌ترین‌ها اول.
          </p>
          <DataCurrencyNote className="mt-2 text-xs" />
        </div>
        <Link href="/shop?stock=purchasable" className="inline-flex items-center gap-1.5 text-sm font-bold text-aqua hover:underline">
          مشاهده همه <ArrowLeft className="size-4" />
        </Link>
      </div>

      <div className="mt-8">
        <ProductRail products={products as unknown as ProductCardData[]} label="محصولاتی که همین حالا قابل خرید هستند" />
      </div>
    </section>
  );
}
