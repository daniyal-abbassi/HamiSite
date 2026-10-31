"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { FilterPanel } from "./FilterPanel";
import { ShopResultControls } from "./ShopResultControls";
import { SHOP_FILTER_KEYS, useShopUrl } from "./use-shop-url";
import { useModalDialog } from "@/components/ui/useModalDialog";
import { toFaDigits } from "@/lib/utils";
import type { ShopBrand } from "./types";
import type { CategoryFacet } from "@/lib/shop-query-db";

/**
 * Everything that narrows or orders the list, in one bar: the filter drawer, the two
 * filters people reach for most, the count, the sort and the view.
 *
 * The filters used to be a sidebar that took a third of the page on a desktop and sat above
 * the results on a phone. Now results come first at every width and filtering is one tap
 * away: a drawer from the side on a desktop, a sheet from the bottom on a phone. Both wrap
 * the same `FilterPanel`, which writes to the URL itself, so nothing here knows what a
 * filter is. The dialog keeps the behaviour a sheet owes its user: Escape and backdrop close
 * it, focus goes in and comes back, and the page behind does not scroll.
 */
export function ShopToolbar({
  categoryFacets,
  brands,
  total,
  activeSort,
  listView,
}: {
  categoryFacets: CategoryFacet[];
  brands: ShopBrand[];
  /** `null` while the view cannot say, such as an unknown filter. */
  total: number | null;
  activeSort: string;
  listView: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { searchParams, update, appliedCount, isPending } = useShopUrl();
  const { dialogRef, backdropProps } = useModalDialog(open, () => setOpen(false));

  const purchasable = searchParams.get("stock") === "purchasable";
  const special = searchParams.get("special") === "1";
  const countLabel = total === null ? "—" : `${toFaDigits(total)} محصول`;

  return (
    <>
      <div className="shop-toolbar" aria-busy={isPending ? "true" : undefined}>
        <div className="shop-toolbar__lead">
          <button type="button" className="shop-filter-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            فیلترها
            {appliedCount > 0 && <b>{toFaDigits(appliedCount)}</b>}
          </button>
          <div className="shop-quick" role="group" aria-label="فیلتر سریع">
            <button type="button" aria-pressed={purchasable} onClick={() => update((params) => (purchasable ? params.delete("stock") : params.set("stock", "purchasable")))}>
              قابل خرید
            </button>
            <button type="button" aria-pressed={special} onClick={() => update((params) => (special ? params.delete("special") : params.set("special", "1")))}>
              پیشنهاد ویژه
            </button>
          </div>
        </div>
        <div className="shop-toolbar__tail">
          <p className="shop-count" aria-live="polite">{countLabel}</p>
          <ShopResultControls activeSort={activeSort} listView={listView} />
        </div>
      </div>

      {open && (
        <dialog ref={dialogRef} aria-label="فیلتر محصولات" {...backdropProps} className="shop-drawer-dialog">
          <div className="shop-drawer">
            <header className="shop-drawer__head">
              <div>
                <h2>فیلتر محصولات</h2>
                <p>انتخاب شما همان لحظه اعمال می‌شود.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="بستن" autoFocus>
                <X className="size-5" aria-hidden="true" />
              </button>
            </header>
            <div className="shop-drawer__body">
              <FilterPanel categoryFacets={categoryFacets} brands={brands} />
            </div>
            <footer className="shop-drawer__foot">
              <button
                type="button"
                className="shop-drawer__clear"
                disabled={appliedCount === 0}
                onClick={() => update((params) => SHOP_FILTER_KEYS.forEach((key) => params.delete(key)))}
              >
                حذف همه
              </button>
              <button type="button" className="shop-drawer__done" onClick={() => setOpen(false)}>
                {total === null ? "نمایش نتایج" : `نمایش ${toFaDigits(total)} محصول`}
              </button>
            </footer>
          </div>
        </dialog>
      )}
    </>
  );
}
