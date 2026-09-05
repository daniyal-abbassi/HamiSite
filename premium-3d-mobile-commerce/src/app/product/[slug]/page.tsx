import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getCatalog, discount } from "@/lib/data";
import { formatToman, stockLabel, toFa } from "@/lib/format";
import { Header, ProductCard, Countdown } from "@/components/ui/primitives";
import { Footer } from "@/components/sections/commerce";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  return { title: p ? `${p.name} | حامی همراه` : "محصول | حامی همراه", description: p?.description };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const catalog = await getCatalog();
  const related = catalog.products.filter((x) => x.id !== p.id && (x.brandSlug === p.brandSlug || x.categorySlug === p.categorySlug)).slice(0, 4);
  const pct = discount(p);
  const st = stockLabel(p.stock);
  const message = encodeURIComponent(`سلام، برای خرید «${p.name}» از حامی همراه راهنمایی می‌خواهم.`);

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-0" style={{ background: "radial-gradient(120% 70% at 50% 0%, #2a1a1e 0%, #111014 55%, #0e0d10 100%)" }} />
      <Header solid />
      <main className="relative z-[2] px-4 pb-32 pt-24 md:px-8 md:pt-32">
        <div className="mx-auto max-w-7xl">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-ivory-dim">
            <Link href="/">خانه</Link>
            <span>/</span>
            <Link href="/shop">فروشگاه</Link>
            <span>/</span>
            <Link href={`/shop?brand=${p.brandSlug}`} className="text-champagne">
              {p.brandName}
            </Link>
            <span>/</span>
            <Link href={`/shop?category=${p.categorySlug}`} className="text-champagne">
              {p.categoryName}
            </Link>
          </nav>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
            <div className="relative overflow-hidden rounded-[28px] border border-ivory/10">
              <div className="relative aspect-square lg:aspect-[4/4.4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-graphite/70 via-transparent to-transparent" />
                <div className="absolute right-4 top-4 flex flex-col gap-2">
                  {pct > 0 && <span className="rounded-full bg-oxblood px-3 py-1.5 text-sm font-black text-white shadow-lg shadow-oxblood/40">{toFa(pct)}٪ تخفیف</span>}
                  {p.isNew && <span className="rounded-full border border-champagne/40 bg-graphite/70 px-3 py-1.5 text-xs font-bold text-champagne backdrop-blur">جدید</span>}
                  {p.badge && <span className="rounded-full border border-ivory/20 bg-graphite/70 px-3 py-1.5 text-xs font-bold text-ivory backdrop-blur">{p.badge}</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <span className="eyebrow">{p.brandName} · {p.categoryName}</span>
                <h1 className="mt-2 text-3xl font-black leading-tight text-ivory md:text-4xl">{p.name}</h1>
                <p className="mt-2 text-sm text-ivory-dim">
                  رنگ {p.color}
                  {p.storage ? ` · حافظه ${p.storage}` : ""} · امتیاز {toFa((p.rating / 10).toFixed(1))} از ۵
                </p>
              </div>
              <p className="text-sm leading-8 text-ivory-dim md:text-base">{p.description}</p>

              <div className="glass-strong rounded-2xl p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    {p.dealPrice ? (
                      <>
                        <div className="text-sm text-ivory-dim line-through decoration-oxblood-glow/70">{formatToman(p.price)} تومان</div>
                        <div className="mt-1 text-3xl font-black text-ivory">
                          {formatToman(p.dealPrice)} <span className="text-sm font-medium text-ivory-dim">تومان</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-3xl font-black text-ivory">
                        {formatToman(p.price)} <span className="text-sm font-medium text-ivory-dim">تومان</span>
                      </div>
                    )}
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${st.tone === "ok" ? "bg-emerald-500/15 text-emerald-300" : st.tone === "low" ? "bg-oxblood/30 text-ivory" : "bg-white/5 text-ivory-dim"}`}>{st.text}</span>
                </div>
                {p.dealPrice && p.dealEndsAt && (
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-oxblood-glow/30 bg-oxblood-deep/40 px-3 py-2">
                    <span className="text-xs text-ivory-dim">پایان تخفیف</span>
                    <Countdown target={p.dealEndsAt} size="sm" />
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a href={`https://wa.me/989000000000?text=${message}`} target="_blank" rel="noreferrer" className={p.stock > 0 ? "btn-gold" : "btn-ghost pointer-events-none opacity-50"}>
                    {p.stock > 0 ? "ثبت سفارش" : "ناموجود"}
                  </a>
                  <a href="tel:02100000000" className="btn-ghost">
                    مشاوره تلفنی
                  </a>
                </div>
                <p className="mt-3 text-center text-[11px] text-ivory-dim">ضمانت اصالت · ۷ روز مهلت تست · فاکتور رسمی</p>
              </div>

              <div>
                <h2 className="text-lg font-black text-ivory">مشخصات کلیدی</h2>
                <dl className="mt-3 grid grid-cols-2 gap-2">
                  {Object.entries(p.specs).map(([k, v]) => (
                    <div key={k} className="glass rounded-xl p-3">
                      <dt className="text-[11px] text-ivory-dim">{k}</dt>
                      <dd className="mt-1 text-sm font-bold text-ivory">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <section className="mt-14">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-black text-ivory">برای مقایسه</h2>
                <Link href={`/shop?brand=${p.brandSlug}`} className="text-sm font-bold text-champagne">
                  همه {p.brandName} ←
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
                {related.map((r) => (
                  <ProductCard key={r.id} p={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
