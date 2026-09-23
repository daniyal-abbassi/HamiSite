import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { categoryImageFor } from "@/lib/product-images";
import type { ShopTile } from "@/lib/shop-category-tiles";

/**
 * The department row at the top of the shop page.
 *
 * It takes finished tiles rather than a slug list to look up, because the two things a
 * tile is allowed to assert — the name a shopper recognises and whether a count may be
 * printed under it — are decided where the departments are (`lib/category-departments.ts`,
 * `lib/shop-category-tiles.ts`). Looking the labels up from the category tree here is how
 * an internal name like «آداپتور | کابل و شارژر» reached a storefront, and counting here is
 * how a door holding 8 could sit beside one holding 135 and both be called «موبایل».
 */
export function CategoryTiles({ activeSlug, tiles }: { activeSlug: string | null; tiles: ShopTile[] }) {
  if (tiles.length === 0) return null;

  return (
    <section aria-label="دسته‌بندی‌های فروشگاه" className="mt-10">
      <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:overflow-visible">
        {tiles.map((tile) => {
          const active = tile.slug === activeSlug;
          return (
            <Link
              key={tile.slug}
              href={active ? "/shop" : tile.href}
              aria-current={active || undefined}
              className={cn(
                "group flex min-w-28 flex-col items-center gap-2.5 rounded-xl glass border-line p-4 text-center transition-colors",
                active ? "border-aqua" : "border-line hover:border-aqua/50",
              )}
            >
              <span className="relative grid size-14 place-items-center overflow-hidden rounded-xl bg-ink/40">
                <Image
                  src={categoryImageFor(tile.slug, tile.label)}
                  alt=""
                  width={56}
                  height={56}
                  sizes="56px"
                  className="size-full object-contain p-1.5"
                />
              </span>
              <span className="text-xs font-bold leading-5">{tile.label}</span>
              {/* Absent rather than zero: a door that opens on part of its kind has no
                  honest number to print, so it prints nothing. */}
              {tile.countLabel && <span className="font-mono text-[10px] text-muted-foreground">{tile.countLabel}</span>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
