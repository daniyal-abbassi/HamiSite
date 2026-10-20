"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { sortOptions } from "@/lib/content/shop";

export function ShopResultControls({
  activeSort,
  listView,
}: {
  activeSort: string;
  listView: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function update(key: string, value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === "sort") params.delete("page");
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return (
    <div className="flex items-center gap-2" aria-busy={isPending ? "true" : undefined}>
      <label className="sr-only" htmlFor="shop-sort">مرتب‌سازی</label>
      <select
        id="shop-sort"
        value={activeSort}
        aria-busy={isPending ? "true" : undefined}
        onChange={(event) => {
          event.currentTarget.setAttribute("aria-busy", "true");
          update("sort", event.target.value || undefined);
        }}
        className="h-11 rounded-xl border border-input bg-background/40 px-3 py-0 text-xs font-bold md:h-9"
      >
        <option value="">مرتب‌سازی: پیش‌فرض</option>
        {sortOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
      </select>
      <div className="flex overflow-hidden rounded-xl border border-line" role="group" aria-label="نوع نمایش">
        <button
          type="button"
          aria-pressed={!listView}
          aria-label="نمایش شبکه‌ای"
          aria-busy={isPending ? "true" : undefined}
          onClick={(e) => {
            e.currentTarget.setAttribute("aria-busy", "true");
            update("view");
          }}
          className={cn("grid size-11 place-items-center", !listView ? "bg-aqua/15 text-aqua" : "text-foreground/50 hover:text-foreground")}
        >
          <LayoutGrid className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-pressed={listView}
          aria-label="نمایش فهرستی"
          aria-busy={isPending ? "true" : undefined}
          onClick={(e) => {
            e.currentTarget.setAttribute("aria-busy", "true");
            update("view", "list");
          }}
          className={cn("grid size-11 place-items-center border-s border-line", listView ? "bg-aqua/15 text-aqua" : "text-foreground/50 hover:text-foreground")}
        >
          <List className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
