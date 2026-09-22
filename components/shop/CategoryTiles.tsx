import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { categoryImageFor } from "@/lib/product-images";
import type { ShopCategory } from "./types";

export function CategoryTiles({
  categories,
  activeSlug,
  tileSlugs,
}: {
  categories: ShopCategory[];
  activeSlug: string | null;
  /** Root categories with at least one product, resolved server-side. See
   *  `lib/shop-category-tiles.ts` — a tile that leads to an empty listing is worse
   *  than one fewer tile. */
  tileSlugs: string[];
}) {
  const bySlug = new Map(categories.filter((c) => c.parentId === null).map((c) => [c.slug, c]));
  const roots = tileSlugs.map((slug) => bySlug.get(slug)).filter((c): c is ShopCategory => !!c);
  if (roots.length === 0) return null;

  return (
    <section aria-label="دسته‌بندی‌های فروشگاه" className="mt-10">
      <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:overflow-visible">
        {roots.map((category) => {
          const active = category.slug === activeSlug;
          return (
            <Link
              key={category.id}
              href={active ? "/shop" : `/shop?category=${encodeURIComponent(category.slug)}`}
              aria-current={active || undefined}
              className={cn(
                "group flex min-w-28 flex-col items-center gap-2.5 rounded-xl glass border-line p-4 text-center transition-colors",
                active ? "border-aqua" : "border-line hover:border-aqua/50",
              )}
            >
              <span className="relative grid size-14 place-items-center overflow-hidden rounded-xl bg-ink/40">
                <Image
                  src={categoryImageFor(category.slug, category.name)}
                  alt=""
                  width={56}
                  height={56}
                  sizes="56px"
                  className="size-full object-contain p-1.5"
                />
              </span>
              <span className="text-xs font-bold leading-5">{category.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
