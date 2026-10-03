import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { categoryDepartments } from "@/lib/category-departments-db";
import { imageSizesAttribute } from "@/lib/category-masonry";
import { CategoryArrival } from "@/components/home/CategoryArrival";
import { toFaDigits } from "@/lib/utils";

/**
 * The categories surface — feature 010.
 *
 * A masonry gallery: nine department tiles whose heights follow the authored rhythm in
 * `lib/category-masonry.ts`, laid out entirely by CSS Grid row-spans. That split is the design. The stylesheet
 * owns where every tile sits, so the chapter is complete in the HTML the server sends and a shopper with
 * scripting unavailable still sees, reads and reaches all nine departments (FR-008). Script owns one thing
 * only — the one-time arrival — and it starts from the *rendered* state rather than from a hidden one, so a
 * stalled script leaves the composition intact instead of empty (FR-011).
 *
 * This stays a server component. `CategoryArrival` wraps the grid as a client boundary and receives this
 * markup as `children`, which is what keeps the guarantee above true after the motion exists.
 *
 * The department set is derived, not authored — see `lib/category-departments.ts` for why the stored category
 * tree cannot be shown as it stands (11 of 32 categories hold no products, and the brand axis is fused into the
 * type axis).
 */
export async function CategoryHub() {
  const departments = await categoryDepartments();
  const sizes = imageSizesAttribute();

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

      {/* The grid is server-rendered and this wrapper only ever animates it. Children cross the client
          boundary already composed, which is what keeps contract Q3 true after the arrival exists. */}
      <CategoryArrival>
        {/* `role="list"` is explicit because the stylesheet removes the markers, and WebKit drops list semantics
            from a markerless ul — the announcement would otherwise become a bare group of links. */}
        <ul className="cat-masonry" role="list">
          {departments.map((department) => (
            <li
              className="cat-masonry__item"
              key={department.kind}
              data-tier-base={department.rhythm.base}
              data-tier-md={department.rhythm.md}
              data-tier-xl={department.rhythm.xl}
            >
              {/*
               * The whole tile is one link and the destination is the department's own listing, in the same
               * window (FR-007). There is no click handler: opening the department in a new window would strand a
               * shopper who meant to keep browsing and break the page's own history.
               */}
              <Link
                href={department.href}
                className="cat-card"
                aria-describedby={department.showsCount ? `cat-count-${department.kind}` : undefined}
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
                    sizes={sizes}
                    className="cat-card__image"
                    unoptimized
                  />
                </span>
                {/* Permanently visible. Hover, focus and press must never be the route to a department's name —
                    the reference this layout was drawn from reveals its title on hover, which on a phone means it
                    is never revealed at all (FR-005). */}
                <span className="cat-card__label">{department.label}</span>
                {/* FR-014: a count appears only where the destination genuinely holds that many. Phones, chargers
                    and power banks are silent by rule, not by omission — their route and their kind disagree, so
                    any figure here would either overstate or understate. */}
                {department.showsCount ? (
                  <span className="cat-card__count" id={`cat-count-${department.kind}`}>
                    {toFaDigits(department.reachableCount)} محصول
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </CategoryArrival>
    </section>
  );
}
