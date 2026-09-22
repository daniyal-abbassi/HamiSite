import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { categoryMosaic } from "@/lib/content/home";

const categoryArtwork: Record<string, string> = {
  smartphone: "/brand/categories/mobile.svg",
  headphones: "/brand/categories/audio.svg",
  plug: "/brand/categories/charger.svg",
  battery: "/brand/categories/power-bank.svg",
  watch: "/brand/categories/smartwatch.svg",
  globe: "/brand/categories/online-services.svg",
};

export function CategoryHub() {
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

      <ul className="cat-grid" role="list">
        {categoryMosaic.map((category) => (
          <li key={category.key}>
            <Link href={category.href} className="cat-cell" aria-labelledby={`category-${category.key}`}>
              <span className="cat-panel" aria-hidden="true">
                <img
                  src={categoryArtwork[category.icon] ?? "/brand/categories/mobile.svg"}
                  alt=""
                  width={800}
                  height={960}
                  loading="lazy"
                  className="cat-panel-image"
                />
              </span>
              <div className="cat-copy">
                <h3 id={`category-${category.key}`}>{category.title}</h3>
                <span className="cat-detail" dir="auto">{category.detail}</span>
              </div>
              <ArrowLeft className="cat-arrow" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
