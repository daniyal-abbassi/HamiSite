/** Hand-built for this repo — no upstream counterpart. The kit's `list-pagination.tsx` imports a
 * 130-line `pagination` primitive we do not have (notes/kit-inventory.md), and the prev/next-only
 * admin pagination this file replaced had no page numbers, so the numbers live here. The window maths
 * is in `pagination-range.ts` next door, where it can be tested in `node` — this project has no DOM
 * test harness.
 *
 * The props are the meta the routes already return (`lib/http.ts:98-109`), so the caller passes the
 * object straight through rather than unpacking it first.
 */

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, toFaDigits } from "@/lib/utils";
import { paginationRange, type PageWindowItem } from "./pagination-range";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  /** Pages always shown at each end. */
  boundaryCount?: number;
  /** Neighbours shown either side of the current page. */
  siblingCount?: number;
  className?: string;
};

const STEP =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md border border-line px-2 text-[13px] font-bold text-muted-foreground transition-colors duration-fast hover:bg-foreground/5 hover:text-foreground disabled:pointer-events-none disabled:opacity-50";

function PageButton({
  page,
  current,
  onPageChange,
}: {
  page: number;
  current: number;
  onPageChange: (page: number) => void;
}) {
  const active = page === current;

  return (
    <li>
      <button
        type="button"
        onClick={() => onPageChange(page)}
        aria-current={active ? "page" : undefined}
        aria-label={`صفحه ${toFaDigits(page)}`}
        className={cn(
          "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-2 text-[13px] transition-colors duration-fast",
          // Three channels, none of them colour: `aria-current` for assistive tech, black rather than
          // bold weight, and a filled surface against a bare border. The fill is champagne with the
          // `primary-foreground` ink, which measures 13.49:1 — `text-foreground` over that same fill
          // would be 1.25:1, which is how a "highlighted" current page ends up unreadable.
          active
            ? "border-champagne bg-champagne font-black text-primary-foreground"
            : "border-line font-bold text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
        )}
      >
        {toFaDigits(page)}
      </button>
    </li>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  hasNextPage,
  onPageChange,
  boundaryCount,
  siblingCount,
  className,
}: PaginationProps) {
  const range = paginationRange({ page, pageSize, total, hasNextPage }, { boundaryCount, siblingCount });

  // Nothing to step through and no next page to step to: rendering the row anyway would be two dead
  // buttons and a «۱» (FR-006 — a control that cannot be acted on is removed, not disabled).
  if (range.items.length <= 1 && !range.hasNext) return null;

  return (
    <nav aria-label="صفحه‌بندی" className={cn("mt-6 flex flex-wrap items-center justify-between gap-3", className)}>
      <p className="w-full text-center text-xs leading-5 text-muted-foreground sm:w-auto sm:text-start">
        {total > 0 ? (
          <>
            نمایش {toFaDigits(range.from)} تا {toFaDigits(range.to)} از {toFaDigits(total)} رکورد
          </>
        ) : (
          "هیچ رکوردی در این صفحه نیست"
        )}
      </p>

      <ul className="flex items-center gap-1">
        <li>
          <button type="button" onClick={() => onPageChange(range.current - 1)} disabled={!range.hasPrevious} className={STEP}>
            {/* «قبلی» points at the start edge, which under RTL is the right. The words are the
                part that carries the meaning; the chevron only saves a glance. */}
            <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
            قبلی
          </button>
        </li>

        {/* Numbers are the desktop affordance. At 360px ten of them would be a horizontally
            scrolling strip, which is the pattern this whole feature exists to stop using, so the
            phone gets the same information as a count instead. */}
        <li className="hidden sm:block">
          <ul className="flex items-center gap-1">
            {range.items.map((item, index) =>
              item === "gap" ? (
                <li key={`gap-${index}`}>
                  <span className="px-1 text-xs text-muted-foreground">
                    <span aria-hidden="true">…</span>
                    <span className="sr-only">صفحه‌های میانی پنهان</span>
                  </span>
                </li>
              ) : (
                <PageButton key={item} page={item} current={range.current} onPageChange={onPageChange} />
              ),
            )}
          </ul>
        </li>

        <li className="px-1 text-xs text-muted-foreground sm:hidden">
          صفحه {toFaDigits(range.current)} از {toFaDigits(range.lastPage)}
        </li>

        <li>
          <button type="button" onClick={() => onPageChange(range.current + 1)} disabled={!range.hasNext} className={STEP}>
            بعدی
            <ChevronLeft aria-hidden="true" className="size-4 shrink-0" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
