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
              <Skeleton className="size-14 rounded-md" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </section>
      <div className="shop-catalog-heading" aria-hidden="true">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-9 w-56" />
      </div>
      <div className="shop-browse-layout mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8" aria-hidden="true">
        <div className="hidden w-[248px] shrink-0 space-y-5 border border-line p-5 lg:block">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-7 w-full" />)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 lg:hidden"><Skeleton className="h-11 w-28 rounded-full" /></div>
          <div className="shop-results-toolbar flex items-center justify-between rounded-xl border border-line px-4 py-3">
            <Skeleton className="h-4 w-20" />
            <div className="flex items-center gap-2"><Skeleton className="h-10 w-28" /><Skeleton className="size-11" /><Skeleton className="size-11" /></div>
          </div>
          <div className="shop-product-grid mt-5 grid grid-cols-2 gap-3 xl:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
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
        </div>
      </div>
      <span className="sr-only">در حال بارگذاری محصولات فروشگاه</span>
    </div>
  );
}
