"use client";

import { useEffect, useState } from "react";
import { cn, toFaDigits } from "@/lib/utils";
import { brandLabel } from "@/lib/product-identity";
import { stockOptions } from "@/lib/content/shop";
import type { ShopBrand } from "./types";
import type { CategoryFacet } from "@/lib/shop-query-db";
import { useShopUrl } from "./use-shop-url";

/** Common budgets in Toman; each is one tap instead of two typed numbers. */
const PRICE_PRESETS = [
  { label: "تا ۵ میلیون", min: "", max: "5000000" },
  { label: "۵ تا ۲۰ میلیون", min: "5000000", max: "20000000" },
  { label: "۲۰ تا ۵۰ میلیون", min: "20000000", max: "50000000" },
  { label: "بالای ۵۰ میلیون", min: "50000000", max: "" },
] as const;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="shop-panel__group">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

/** Every filter the shop has, applied the moment it is chosen. It owns no layout: the drawer decides where it sits. */
export function FilterPanel({ categoryFacets, brands }: { categoryFacets: CategoryFacet[]; brands: ShopBrand[] }) {
  const { searchParams, update, isPending } = useShopUrl();

  const activeCategory = searchParams.get("category");
  const activeBrand = searchParams.get("brand");
  const activeStock = searchParams.get("stock") ?? "";
  const activeSpecial = searchParams.get("special") === "1";
  const appliedMin = searchParams.get("min") ?? "";
  const appliedMax = searchParams.get("max") ?? "";

  const [min, setMin] = useState(appliedMin);
  const [max, setMax] = useState(appliedMax);
  useEffect(() => {
    setMin(appliedMin);
    setMax(appliedMax);
  }, [appliedMin, appliedMax]);

  const applyPrice = (nextMin: string, nextMax: string) =>
    update((params) => {
      if (nextMin.trim()) params.set("min", nextMin.trim());
      else params.delete("min");
      if (nextMax.trim()) params.set("max", nextMax.trim());
      else params.delete("max");
    });

  return (
    <div className="shop-panel" aria-busy={isPending ? "true" : undefined}>
      {categoryFacets.length > 0 && (
        <Group title="دسته‌بندی">
          <div className="shop-panel__rows">
            {categoryFacets.map((category) => {
              const active = category.slug === activeCategory;
              return (
                <button
                  key={category.slug}
                  type="button"
                  aria-pressed={active}
                  className="shop-row"
                  onClick={() => update((params) => (active ? params.delete("category") : params.set("category", category.slug)))}
                >
                  <span>{category.label}</span>
                  {category.showsCount && <small>{toFaDigits(category.count)}</small>}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {brands.length > 0 && (
        <Group title="برند">
          {/* All of them: `listBrands()` already drops brands with no products, so a slice only hid real doors (FR-029). */}
          <div className="shop-panel__chips shop-panel__chips--scroll">
            {brands.map((brand) => {
              const active = brand.slug === activeBrand;
              return (
                <button
                  key={brand.id}
                  type="button"
                  aria-pressed={active}
                  className="shop-chip"
                  onClick={() => update((params) => (active ? params.delete("brand") : params.set("brand", brand.slug)))}
                >
                  {brandLabel(brand.name)}
                  {(brand.productCount ?? 0) > 0 && <small>{toFaDigits(brand.productCount!)}</small>}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      <Group title="محدوده قیمت (تومان)">
        <div className="shop-panel__chips">
          {PRICE_PRESETS.map((preset) => {
            const active = appliedMin === preset.min && appliedMax === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={active}
                className="shop-chip"
                onClick={() => (active ? applyPrice("", "") : applyPrice(preset.min, preset.max))}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <form
          className="shop-price"
          onSubmit={(event) => {
            event.preventDefault();
            applyPrice(min, max);
          }}
        >
          <input type="number" min={0} inputMode="numeric" dir="ltr" value={min} onChange={(event) => setMin(event.target.value)} placeholder="از" aria-label="کمترین قیمت" />
          <span aria-hidden="true">تا</span>
          <input type="number" min={0} inputMode="numeric" dir="ltr" value={max} onChange={(event) => setMax(event.target.value)} placeholder="تا" aria-label="بیشترین قیمت" />
          <button type="submit">اعمال</button>
        </form>
      </Group>

      <Group title="وضعیت موجودی">
        <div className="shop-panel__chips" role="group" aria-label="وضعیت موجودی">
          {stockOptions.map((option) => (
            <button
              key={option.key || "all"}
              type="button"
              aria-pressed={activeStock === option.key}
              className="shop-chip"
              onClick={() => update((params) => (option.key ? params.set("stock", option.key) : params.delete("stock")))}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Group>

      <button
        type="button"
        role="switch"
        aria-checked={activeSpecial}
        className={cn("shop-switch", activeSpecial && "is-on")}
        onClick={() => update((params) => (activeSpecial ? params.delete("special") : params.set("special", "1")))}
      >
        <span>فقط پیشنهادهای ویژه</span>
        <i aria-hidden="true" />
      </button>
    </div>
  );
}
