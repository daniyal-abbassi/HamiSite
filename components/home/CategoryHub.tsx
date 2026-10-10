import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { CategoryArrival } from "@/components/home/CategoryArrival";
import { categoryDepartments } from "@/lib/category-departments-db";
import { imageSizesAttribute } from "@/lib/category-masonry";

/** Server-rendered category destinations; the client boundary only decorates their arrival. */
export async function CategoryHub() {
  const departments = await categoryDepartments();

  return (
    <section id="categories" className="home-section-ground home-section-ground--paper category-catalogue band-paper wrap container" aria-labelledby="categories-title">
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

      <CategoryArrival>
        <ul className="cat-masonry" role="list">
          {departments.map((department) => {
            const countId = `cat-card-count-${department.kind}`;
            return (
              <li
                className="cat-masonry__item"
                data-tier-base={department.rhythm.base}
                data-tier-md={department.rhythm.md}
                data-tier-xl={department.rhythm.xl}
                key={department.kind}
              >
                <Link
                  href={department.href}
                  className="cat-card"
                  aria-describedby={department.showsCount ? countId : undefined}
                >
                  <span className="cat-card__art">
                    <Image
                      src={department.image}
                      alt=""
                      fill
                      sizes={imageSizesAttribute()}
                      className="cat-card__image"
                    />
                  </span>
                  <span className="cat-card__label">{department.label}</span>
                  {department.showsCount && (
                    <span className="cat-card__count" id={countId}>
                      {department.reachableCount.toLocaleString("fa-IR")} محصول
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </CategoryArrival>
    </section>
  );
}
