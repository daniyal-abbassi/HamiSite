import { Skeleton } from "@/components/ui/skeleton";

export function ShopLoading() {
  return (
    <div className="shop-loading" role="status" aria-busy="true" aria-label="در حال بارگذاری محصولات فروشگاه">
      <div className="shop-currency-note h-5" />
      <section className="shop-departments" aria-hidden="true">
        <div className="shop-departments-heading">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="shop-loading-departments">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="shop-loading-department">
              <Skeleton className="size-11 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </section>
      <div className="shop-toolbar" aria-hidden="true">
        <div className="shop-toolbar__lead"><Skeleton className="h-11 w-28 rounded-full" /><Skeleton className="h-11 w-24 rounded-full" /></div>
        <div className="shop-toolbar__tail"><Skeleton className="h-4 w-20" /><Skeleton className="h-11 w-32" /></div>
      </div>
      <div className="shop-product-grid mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="shop-loading-card">
            <Skeleton className="shop-loading-card-image" />
            <div className="space-y-3 px-4 pb-5 pt-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="mt-8 h-4 w-16" />
              <div className="flex items-end justify-between gap-2"><Skeleton className="h-7 w-28" /><Skeleton className="size-11 shrink-0" /></div>
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">در حال بارگذاری محصولات فروشگاه</span>
    </div>
  );
}
