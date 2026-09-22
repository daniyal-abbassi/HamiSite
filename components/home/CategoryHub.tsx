import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { categoryDepartments } from "@/lib/category-departments";
import { CategoryCarousel } from "@/components/home/CategoryCarousel";

/**
 * The categories surface.
 *
 * The department set is derived, not authored — see `lib/category-departments.ts` for why the stored
 * category tree cannot be shown as it stands (11 of 32 categories hold no products, and the brand axis
 * is fused into the type axis). The list was previously six hand-written tiles in `categoryMosaic`;
 * those six are a subset of the nine departments now derived here, and `categoryMosaic` remains in
 * `lib/content/home.ts` for whatever still reads it.
 */
export function CategoryHub() {
  const departments = categoryDepartments();

  return (
    <section id="categories" className="category-catalogue wrap container" aria-labelledby="categories-title">
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

      <CategoryCarousel departments={departments} />
    </section>
  );
}
