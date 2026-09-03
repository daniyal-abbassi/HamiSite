import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { categoryImageFor } from "@/lib/product-images";
import type { ShopCategory } from "./types";

export function CategoryTiles({
  categories,
  activeSlug,
}: {
  categories: ShopCategory[];
  activeSlug: string | null;
}) {
  const roots = categories.filter((category) => category.parentId === null).slice(0, 6);
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
                active ? "border-gold" : "border-line hover:border-gold/50",
              )}
            >
              <span className="relative grid size-14 place-items-center overflow-hidden rounded-xl bg-ink/40">
                <Image
                  src={categoryImageFor(category.slug, category.name)}
                  alt=""
                  width={56}
                  height={56}
                  className="size-full object-contain p-1.5"
                />
              </span>
              <span className="text-[11px] font-bold leading-5">{category.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
