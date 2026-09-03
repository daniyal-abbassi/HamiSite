"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { stockOptions } from "@/lib/content/shop";
import type { ShopBrand, ShopCategory } from "./types";

const FILTER_KEYS = ["q", "category", "brand", "min", "max", "stock", "special"] as const;

function SidebarHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="font-mono text-[10px] tracking-[0.08em] text-gold">{children}</h3>;
}

export function FilterSidebar({ categories, brands }: { categories: ShopCategory[]; brands: ShopBrand[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category");
  const activeBrand = searchParams.get("brand");
  const activeStock = searchParams.get("stock") ?? "";
  const activeSpecial = searchParams.get("special") === "1";

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [min, setMin] = useState(searchParams.get("min") ?? "");
  const [max, setMax] = useState(searchParams.get("max") ?? "");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setMin(searchParams.get("min") ?? "");
    setMax(searchParams.get("max") ?? "");
  }, [searchParams]);

  /** Push a mutated copy of the current query string; filters reset pagination. */
  function update(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  const rootCategories = categories.filter((category) => category.parentId === null).slice(0, 8);

  return (
    <aside
      className="w-full shrink-0 space-y-6 rounded-xl glass p-5 lg:sticky lg:top-24 lg:w-72"
      aria-label="فیلتر محصولات"
    >
      {/* Search */}
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          update((params) => {
            if (query.trim()) params.set("q", query.trim());
            else params.delete("q");
          });
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" aria-hidden="true" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جستجو در محصولات…"
          aria-label="جستجو در محصولات"
          className="bg-background/40 pe-10"
        />
      </form>

      {/* Categories */}
      {rootCategories.length > 0 && (
        <div className="space-y-2.5">
          <SidebarHeading>دسته‌بندی</SidebarHeading>
          <div className="flex flex-wrap gap-2">
            {rootCategories.map((category) => {
              const active = category.slug === activeCategory;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    update((params) => {
                      if (active) params.delete("category");
                      else params.set("category", category.slug);
                    })
                  }
                  className={cn(
                    "rounded-full border px-3.5 py-1 text-[11px] font-bold transition-colors",
                    active
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-line text-foreground/70 hover:border-gold/50 hover:text-foreground",
                  )}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <div className="space-y-2.5">
          <SidebarHeading>برند</SidebarHeading>
          <div className="flex flex-wrap gap-2">
            {brands.slice(0, 12).map((brand) => {
              const active = brand.slug === activeBrand;
              return (
                <button
                  key={brand.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    update((params) => {
                      if (active) params.delete("brand");
                      else params.set("brand", brand.slug);
                    })
                  }
                  className={cn(
                    "rounded-full border px-3.5 py-1 text-[11px] font-bold transition-colors",
                    active
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-line text-foreground/70 hover:border-gold/50 hover:text-foreground",
                  )}
                >
                  {brand.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* Price range */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          update((params) => {
            if (min.trim()) params.set("min", min.trim());
            else params.delete("min");
            if (max.trim()) params.set("max", max.trim());
            else params.delete("max");
          });
        }}
        className="space-y-2.5"
      >
        <SidebarHeading>محدوده قیمت (تومان)</SidebarHeading>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={min}
            onChange={(event) => setMin(event.target.value)}
            placeholder="از"
            aria-label="کمترین قیمت"
            className="bg-background/40"
          />
          <span className="text-foreground/40" aria-hidden="true">—</span>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={max}
            onChange={(event) => setMax(event.target.value)}
            placeholder="تا"
            aria-label="بیشترین قیمت"
            className="bg-background/40"
          />
        </div>
        <Button type="submit" variant="outline" className="w-full">
          اعمال قیمت
        </Button>
      </form>

      {/* Stock */}
      <div className="space-y-2.5">
        <SidebarHeading>وضعیت موجودی</SidebarHeading>
        <select
          value={activeStock}
          onChange={(event) =>
            update((params) => {
              if (event.target.value) params.set("stock", event.target.value);
              else params.delete("stock");
            })
          }
          aria-label="وضعیت موجودی"
          className="w-full rounded-xl border border-input bg-background/40 px-3 py-2 text-xs font-bold"
        >
          {stockOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Special offer */}
      <label className="flex cursor-pointer items-center gap-2.5 text-xs font-bold">
        <input
          type="checkbox"
          checked={activeSpecial}
          onChange={(event) =>
            update((params) => {
              if (event.target.checked) params.set("special", "1");
              else params.delete("special");
            })
          }
          className="size-4 accent-gold"
        />
        فقط پیشنهادهای ویژه
      </label>

      {/* Clear all */}
      <button
        type="button"
        onClick={() =>
          update((params) => {
            FILTER_KEYS.forEach((key) => params.delete(key));
          })
        }
        className="flex w-full items-center justify-center gap-1.5 border-t border-line pt-4 text-[11px] font-bold text-foreground/60 transition-colors hover:text-gold"
      >
        <X className="size-3.5" /> حذف همه فیلترها
      </button>
    </aside>
  );
}
