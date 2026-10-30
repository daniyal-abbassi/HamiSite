import { Skeleton } from "@/components/ui/skeleton";

/** Matches the featured showcase's layout so the page does not jump when it streams in. */
export function HomeRailSkeleton() {
  return (
    <section className="fp" aria-busy="true" aria-label="در حال بارگذاری بخش محصولات">
      <div className="fp__inner">
        <div className="fp__head">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="mt-4 h-10 w-56 rounded-lg" />
        </div>
        <div className="fp-slide is-active">
          <Skeleton className="fp-slide__plate rounded-none" />
          <div className="fp-slide__info">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="mt-3 h-10 w-3/4 rounded-lg" />
            <Skeleton className="mt-3 h-4 w-1/2 rounded" />
            <Skeleton className="mt-6 h-8 w-40 rounded-lg" />
            <Skeleton className="mt-4 h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
