"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** The query keys the shop's filters write; clearing the filters removes exactly these. */
export const SHOP_FILTER_KEYS = ["q", "category", "brand", "min", "max", "stock", "special"] as const;

/**
 * The one way a shop control changes the view: push a mutated copy of the current query
 * string. Every control (search, quick filters, the filter panel) reads and writes the URL
 * through this, so the URL still describes the whole view and a filter change resets paging.
 */
export function useShopUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function update(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    const queryString = params.toString();
    startTransition(() => {
      router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  }

  const appliedCount = SHOP_FILTER_KEYS.filter((key) => {
    const value = searchParams.get(key);
    return value != null && value !== "";
  }).length;

  return { searchParams, update, isPending, appliedCount };
}
