"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { FilterSidebar } from "@/components/shop/FilterSidebar";
import { useModalDialog } from "@/components/ui/useModalDialog";
import type { ShopBrand } from "./types";
import type { CategoryFacet } from "@/lib/shop-query-db";

/** The query keys FilterSidebar writes. Kept in step with FILTER_KEYS there. */
const FILTER_KEYS = ["q", "category", "brand", "min", "max", "stock", "special"] as const;

/**
 * How the shop's filters are presented: a sidebar on desktop, a bottom sheet on
 * a phone.
 *
 * ## The problem this solves
 *
 * `FilterSidebar` is `w-full` and sat as the first child of a `flex-col` that
 * only became a row at `lg`. On a phone that put the **entire filter panel above
 * the results** — search box, every category, every brand, a price range and the
 * stock options — so reaching the first product meant scrolling past all of it,
 * on every visit. It is the single worst thing about the mobile shop.
 *
 * Results now come first and filtering is one tap away, which is the standard
 * mobile commerce arrangement for the good reason that browsing is the common
 * case and filtering is the occasional one.
 *
 * ## Seam
 *
 * The two presentations are genuinely different adapters — an always-open
 * sidebar and a dismissible overlay — but they wrap the *same* `FilterSidebar`.
 * That component already owns all the filter logic and talks to the URL itself,
 * so nothing here knows what a filter is; this module only decides where the
 * panel appears and how it is dismissed. Adding a filter means editing one file,
 * still.
 *
 * ## Dialog behaviour that is not optional
 *
 * A sheet that traps a phone user is worse than no sheet. This one closes on
 * Escape and on backdrop tap, restores focus to the trigger, moves focus into
 * the panel on open, and locks the background from scrolling while open — that
 * last one matters most on iOS, where an unlocked background scrolls *behind*
 * the overlay and leaves the user somewhere else when they close it.
 */
export function FilterSheet({
  categoryFacets,
  brands,
}: {
  categoryFacets: CategoryFacet[];
  brands: ShopBrand[];
}) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const { dialogRef, backdropProps } = useModalDialog(open, () => setOpen(false));

  const appliedCount = FILTER_KEYS.filter((k) => {
    const v = searchParams.get(k);
    return v != null && v !== "";
  }).length;

  return (
    <>
      {/* Desktop: unchanged — the sidebar sits in the row as before. */}
      <div className="shop-desktop-filters hidden lg:block lg:w-72 lg:shrink-0">
        <FilterSidebar categoryFacets={categoryFacets} brands={brands} />
      </div>

      {/* Keep the trigger in normal flow: a sticky control covered product
          imagery while shoppers scrolled through the two-column catalog. */}
      <div className="shop-mobile-filter-trigger -mx-1 mb-2 flex justify-start px-1 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 text-sm font-bold shadow-deep"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          فیلترها
          {appliedCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-aqua px-1.5 font-mono text-xs font-bold text-primary-foreground">
              {appliedCount.toLocaleString("fa-IR")}
            </span>
          )}
        </button>
      </div>

      {open && (
        <dialog
          ref={dialogRef}
          aria-label="فیلتر محصولات"
          {...backdropProps}
          className="fixed inset-0 m-0 h-dvh w-screen max-h-none max-w-none overflow-hidden border-0 bg-transparent p-0 backdrop:bg-ink/70 backdrop:backdrop-blur-sm lg:hidden"
        >
          {/* 88vh, not 100vh: leaving the top of the page visible is what makes
              this read as a sheet over the results rather than a new page, and
              it gives a second, larger dismiss target. */}
          <div
            className="shop-filter-panel absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl border-t border-line bg-ink-2 shadow-deep"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
              <b className="text-base font-black">فیلترها</b>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="بستن"
                autoFocus
                className="grid size-11 place-items-center rounded-full text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {/* The panel scrolls, not the page behind it. */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              <FilterSidebar categoryFacets={categoryFacets} brands={brands} />
            </div>

            <div className="shrink-0 border-t border-line p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-12 w-full rounded-full bg-aqua font-bold text-primary-foreground"
              >
                نمایش نتایج
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
