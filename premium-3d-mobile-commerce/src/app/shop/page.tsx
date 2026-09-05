import Link from "next/link";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/data";
import { toFa } from "@/lib/format";
import { Header, ProductCard } from "@/components/ui/primitives";
import { Footer } from "@/components/sections/commerce";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "فروشگاه | حامی همراه",
  description: "همه محصولات حامی همراه؛ آیفون، سامسونگ، شیائومی و لوازم جانبی با قیمت روز و موجودی واقعی.",
};

type SP = Promise<{ brand?: string; category?: string; sort?: string; q?: string }>;

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const data = await getCatalog();
  const brand = sp.brand ?? null;
  const cat = sp.category ?? null;
  const sort = sp.sort ?? "featured";
  const q = (sp.q ?? "").trim();

  let list = data.products.filter((p) => (!brand || p.brandSlug === brand) && (!cat || p.categorySlug === cat));
  if (q) list = list.filter((p) => p.name.includes(q) || p.brandName.includes(q) || p.categoryName.includes(q));
  const eff = (p: (typeof list)[number]) => p.dealPrice ?? p.price;
  if (sort === "cheap") list = [...list].sort((a, b) => eff(a) - eff(b));
  else if (sort === "expensive") list = [...list].sort((a, b) => eff(b) - eff(a));
  else if (sort === "new") list = [...list].sort((a, b) => Number(b.isNew) - Number(a.isNew));
  else if (sort === "deal") list = [...list].sort((a, b) => Number(!!b.dealPrice) - Number(!!a.dealPrice));

  const href = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const merged = { brand, category: cat, sort: sort === "featured" ? null : sort, q: q || null, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && params.set(k, v));
    const s = params.toString();
    return `/shop${s ? `?${s}` : ""}`;
  };

  const brandName = data.brands.find((b) => b.slug === brand)?.nameFa;
  const catName = data.categories.find((c) => c.slug === cat)?.nameFa;

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-0" style={{ background: "radial-gradient(120% 70% at 50% 0%, #221c1a 0%, #111014 55%, #0e0d10 100%)" }} />
      <Header solid />
      <main className="relative z-[2] px-4 pb-24 pt-28 md:px-8 md:pt-32">
        <div className="mx-auto max-w-7xl">
          <nav className="flex items-center gap-2 text-xs text-ivory-dim">
            <Link href="/">خانه</Link>
            <span>/</span>
            <span className="text-ivory">فروشگاه</span>
            {brandName && (
              <>
                <span>/</span>
                <span className="text-champagne">{brandName}</span>
              </>
            )}
            {catName && (
              <>
                <span>/</span>
                <span className="text-champagne">{catName}</span>
              </>
            )}
          </nav>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="eyebrow">فروشگاه حامی همراه</span>
              <h1 className="mt-2 text-3xl font-black text-ivory md:text-5xl">
                {brandName ?? catName ?? "همه محصولات"}
                {brandName && catName ? ` · ${catName}` : ""}
              </h1>
              <p className="mt-2 text-sm text-ivory-dim">
                <span className="font-bold text-ivory">{toFa(list.length)}</span> محصول با قیمت روز و موجودی واقعی
              </p>
            </div>
            <form action="/shop" className="flex gap-2">
              {brand && <input type="hidden" name="brand" value={brand} />}
              {cat && <input type="hidden" name="category" value={cat} />}
              <input name="q" defaultValue={q} placeholder="جستجوی محصول…" className="min-h-[48px] w-full rounded-xl border border-ivory/10 bg-white/[0.04] px-4 text-sm text-ivory placeholder:text-ivory-dim/60 focus:border-champagne/60 focus:outline-none md:w-72" />
              <button className="btn-ghost !min-h-[48px] px-4" type="submit">
                جستجو
              </button>
            </form>
          </div>

          {/* filters */}
          <div className="sticky top-[72px] z-20 -mx-4 mt-6 flex flex-col gap-2 bg-gradient-to-b from-graphite/90 to-transparent px-4 py-3 md:mx-0 md:px-0">
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              <Link href={href({ brand: null })} className="chip" data-active={!brand}>
                همه برندها
              </Link>
              {data.brands.map((b) => (
                <Link key={b.id} href={href({ brand: b.slug })} className="chip" data-active={brand === b.slug}>
                  {b.nameFa}
                </Link>
              ))}
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              <Link href={href({ category: null })} className="chip" data-active={!cat}>
                همه دسته‌ها
              </Link>
              {data.categories.map((c) => (
                <Link key={c.id} href={href({ category: c.slug })} className="chip" data-active={cat === c.slug}>
                  {c.nameFa}
                </Link>
              ))}
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto text-xs">
              {[
                ["featured", "پیشنهادی"],
                ["deal", "تخفیف‌دار"],
                ["new", "جدیدترین"],
                ["cheap", "ارزان‌ترین"],
                ["expensive", "گران‌ترین"],
              ].map(([k, l]) => (
                <Link key={k} href={href({ sort: k === "featured" ? null : k })} className={`rounded-full px-3 py-2 ${sort === k ? "bg-white/10 text-ivory" : "text-ivory-dim"}`}>
                  {l}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} p={p} variant={p.dealPrice ? "deal" : "default"} />
            ))}
          </div>
          {list.length === 0 && (
            <div className="glass mt-6 rounded-2xl p-10 text-center text-sm text-ivory-dim">
              محصولی با این فیلتر پیدا نشد.{" "}
              <Link href="/shop" className="text-champagne">
                حذف فیلترها
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
