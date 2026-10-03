import type { LucideIcon } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/admin/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * The three non-data renderings every dashboard section shares (C1.1: one of four shapes
 * and nothing else). Skeletons are shaped like the content that will arrive so nothing
 * shifts on arrival (C1.4, FR-010).
 */

/** Loading — pass the height/shape of the loaded layout. */
export function SectionSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-2xl", className)} />;
}

/** Empty — data arrived and legitimately contains nothing (C1.2). */
export function SectionEmpty({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return <EmptyState icon={Icon} title={title} description={description} />;
}

/** Unreadable — the request failed or is not authorised; retries only this section (C1.2). */
export function SectionUnreadable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-6 py-14 text-center">
      <p className="text-sm font-bold text-destructive">در خواندن اطلاعات خطایی رخ داد.</p>
      <p className="text-[13px] leading-6 text-muted-foreground">
        دسترسی ممکن است لغو شده باشد یا اتصال به سرور برقرار نشده باشد.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-foreground/5 px-4 text-[13px] font-bold text-foreground transition-colors hover:bg-foreground/10"
      >
        <RefreshCw className="size-4" />
        تلاش دوباره
      </button>
    </div>
  );
}
