import { Skeleton } from "@/components/ui/skeleton";

export function HomeRailSkeleton({ title }: { title?: string }) {
  return (
    <section className="wrap container py-10 space-y-4" aria-busy="true" aria-label="در حال بارگذاری بخش محصولات">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-5 w-24 rounded-md" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-72 rounded-2xl border border-line/40 bg-surface/30 p-4 flex flex-col justify-between space-y-3"
          >
            <Skeleton className="h-36 rounded-xl w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="size-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

