import Image from "next/image";
import { LiquidSelection } from "@/components/liquid/LiquidSelection";
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
 *
 * The active tile is shown by the shared travelling marker (FR-040), not by a border: the
 * marker is one implementation across the storefront, and a per-tile active border beside it
 * would be a second local answer to "which department am I browsing". `aria-current` still
 * rides on the active link itself, so nothing a screen reader is told changes (FR-047).
 *
 * The `!`-prefixed utilities are not decoration. The shared component's CSS module is
 * unlayered and sets `gap: 4px`, `min-width: 0`, `justify-content: center`,
 * `white-space: nowrap` and `border-radius: 999px` on its items; in this project Tailwind
 * utilities are layered, so a plain utility always loses to the module and the important
 * form is the only way to keep this surface's own geometry — measured 112px tiles, 12px
 * gaps, 22px corners, top-aligned content — intact (FR-065 cuts the other way: the module
 * must not be in the way of a surface's shape).
 */
export function CategoryTiles({ activeSlug, tiles }: { activeSlug: string | null; tiles: ShopTile[] }) {
  if (tiles.length === 0) return null;

  return (
    <section aria-label="دسته‌بندی‌های فروشگاه" className="mt-10">
      <LiquidSelection
        className="!gap-3 overflow-x-auto pb-2 !flex-nowrap lg:!grid lg:grid-cols-6 lg:!overflow-visible"
        itemClassName="!min-w-28 flex-col items-center gap-2.5 !justify-start !whitespace-normal !rounded-xl glass border-line p-4 text-center transition-colors hover:border-aqua/50"
        markerInset={6}
        value={activeSlug}
        // The surface announced `aria-current={active || undefined}` before the marker —
        // which React renders as "true", not "page". SC-010 allows zero changes to
        // what a surface announces, so the value is matched, not improved.
        announce="true"
        items={tiles.map((tile) => ({
          id: tile.slug,
          to: tile.slug === activeSlug ? "/shop" : tile.href,
          label: (
            <>
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
            </>
          ),
        }))}
      />
    </section>
  );
}
