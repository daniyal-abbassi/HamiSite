import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { obtainableNowRail } from "@/lib/home-rails-db";
import { catalogGeneratedAt } from "@/lib/catalog-db";
import { ProductRail } from "@/components/shop/ProductRail";
import { DataCurrencyNote } from "@/components/shop/DataCurrencyNote";
import { type ProductCardData } from "@/components/shop/ProductCard";

/** Show this shelf only for products the merchant marks orderable with a usable price. */
export async function ObtainableNow() {
  const [{ products, total }, generatedAt] = await Promise.all([obtainableNowRail(), catalogGeneratedAt()]);
  if (total === 0) return null;

  return (
    <section id="obtainable-now" className="home-section-ground home-section-ground--dark wrap container py-14 md:py-16" aria-labelledby="obtainable-now-title">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="eyebrow">
            <i /> حامی همراه
          </span>
          <h2 id="obtainable-now-title" className="mt-4 text-2xl font-black tracking-normal md:text-4xl">
            محصولات قابل سفارش
          </h2>
          <DataCurrencyNote generatedAt={generatedAt} dateOnly className="mt-2 text-xs" />
        </div>
        <Link href="/shop?stock=purchasable" className="inline-flex items-center gap-1.5 text-sm font-bold text-aqua hover:underline">
          مشاهده همه <ArrowLeft className="size-4" />
        </Link>
      </div>

      <div className="mt-8">
        <ProductRail products={products as unknown as ProductCardData[]} label="محصولات قابل سفارش" />
      </div>
    </section>
  );
}
