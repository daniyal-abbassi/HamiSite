import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { categoryVitrinePanels } from "@/lib/category-departments-db";
import { CategoryCarousel } from "@/components/home/CategoryCarousel";

/**
 * The categories surface — feature 006.
 *
 * A vitrine strip of nine department panels, laid out by the CSS track. The chapter is complete in the HTML
 * the server sends and a shopper with scripting unavailable still sees, reads and reaches all nine links.
 *
 * This stays a server component. The carousel receives its already-rendered list as children, so the links
 * remain useful if hydration never happens.
 *
 * The department set is derived, not authored — see `lib/category-departments.ts` for why the stored category
 * tree cannot be shown as it stands (11 of 32 categories hold no products, and the brand axis is fused into the
 * type axis).
 */
export async function CategoryHub() {
  const departments = await categoryVitrinePanels();

  return (
    <section id="categories" className="category-catalogue band-paper wrap container" aria-labelledby="categories-title">
      <div className="category-catalogue__head">
        <div>
          <span className="category-kicker">دسته‌بندی محصولات</span>
          <h2 id="categories-title">برای هر سبک، <span>یک انتخاب.</span></h2>
          <p>دسته‌ای را انتخاب کن و مستقیم وارد ویترین محصولات شو.</p>
        </div>
        <Link href="/shop" className="category-catalogue__all">
          مشاهده همه محصولات <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <CategoryCarousel>
        {/* `role="list"` is explicit because the stylesheet removes the markers, and WebKit drops list semantics
            from a markerless ul — the announcement would otherwise become a bare group of links. */}
        <ul className="cat-track" role="list">
          {departments.map((department) => (
            <li className="cat-slide" key={department.kind}>
              {/*
               * The whole tile is one link and the destination is the department's own listing, in the same
               * window (FR-007). There is no click handler: opening the department in a new window would strand a
               * shopper who meant to keep browsing and break the page's own history.
               */}
              <Link
                href={department.href}
                className="cat-card"
              >
                {/*
                 * `alt=""` because the department name is adjacent live text — the panel adds no information the
                 * label does not carry, and «تصویر یک شارژر» announced nine times is noise. If a panel ever gains
                 * content this rule flips and it loses `alt=""`.
                 */}
                <span className="cat-card__art">
                  <Image
                    src={department.image}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) min(20vw, 280px), (min-width: 768px) 29vw, 66vw"
                    className="cat-card__image"
                    unoptimized
                  />
                </span>
                {/* Permanently visible. Hover, focus and press must never be the route to a department's name —
                    the reference this layout was drawn from reveals its title on hover, which on a phone means it
                    is never revealed at all (FR-005). */}
                <span className="cat-card__label">{department.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CategoryCarousel>
    </section>
  );
}
