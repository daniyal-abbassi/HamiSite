import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CategoryExplorer } from "@/components/home/CategoryExplorer";
import { Reveal } from "@/components/home/Reveal";
import { departmentShelves } from "@/lib/category-departments-db";

export async function CategoryHub() {
  const departments = await departmentShelves();

  return (
    <section id="categories" className="home-section-ground home-section-ground--paper category-catalogue band-paper wrap container" aria-labelledby="categories-title">
      <Reveal>
        <div className="category-catalogue__head">
          <div>
            <span className="category-kicker">دسته‌بندی محصولات</span>
            <h2 id="categories-title">برای هر سبک، <span>یک انتخاب.</span></h2>
            <p>دسته‌ای را باز کن و همین‌جا محصولاتش را ببین.</p>
          </div>
          <Link href="/shop" className="category-catalogue__all">
            مشاهده همه محصولات <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <CategoryExplorer departments={departments} />
      </Reveal>
    </section>
  );
}
