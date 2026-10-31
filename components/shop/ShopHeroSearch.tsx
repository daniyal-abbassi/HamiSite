"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useShopUrl } from "./use-shop-url";

/** The shop's search, at the top of the page where a shopper starts, not buried in a filter list. */
export function ShopHeroSearch() {
  const { searchParams, update, isPending } = useShopUrl();
  const applied = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(applied);

  useEffect(() => setQuery(applied), [applied]);

  return (
    <form
      role="search"
      className="shop-search"
      aria-busy={isPending ? "true" : undefined}
      onSubmit={(event) => {
        event.preventDefault();
        update((params) => {
          if (query.trim()) params.set("q", query.trim());
          else params.delete("q");
        });
      }}
    >
      <Search className="shop-search__icon" aria-hidden="true" />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="جست‌وجو؛ مثلاً آیفون یا پاوربانک"
        aria-label="جست‌وجو در محصولات"
        enterKeyHint="search"
        autoComplete="off"
      />
      {applied && (
        <button
          type="button"
          className="shop-search__clear"
          aria-label="پاک کردن جست‌وجو"
          onClick={() => update((params) => params.delete("q"))}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
      <button type="submit" className="shop-search__submit">جست‌وجو</button>
    </form>
  );
}

/** What the search shows until the URL is readable, so the hero does not change height. */
export function ShopHeroSearchFallback() {
  return (
    <div className="shop-search" aria-hidden="true">
      <Search className="shop-search__icon" />
      <input tabIndex={-1} disabled placeholder="جست‌وجو؛ مثلاً آیفون یا پاوربانک" />
      <span className="shop-search__submit">جست‌وجو</span>
    </div>
  );
}
