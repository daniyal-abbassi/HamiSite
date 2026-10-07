import { useEffect, useRef, useState } from "react";
import { BadgePercent, Check, Crown, Flame, ShoppingCart, Sparkles, Zap } from "lucide-react";
import Countdown from "./Countdown";
import { deals, featuredDeal, offPercent, type Deal } from "../data/deals";
import { faNum } from "../data/products";

/** Reveals children once they scroll into the viewport. */
function useInView<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          ob.disconnect();
        }
      },
      { threshold }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [threshold]);
  return { ref, seen };
}

interface Props {
  onAdd: (name: string) => void;
}

export default function DealsSection({ onAdd }: Props) {
  const { ref, seen } = useInView<HTMLElement>();

  return (
    <section
      ref={ref}
      id="deals"
      className="relative mx-auto mt-20 w-full max-w-[1280px] px-4 sm:px-6"
    >
      {/* luxury panel */}
      <div className="relative overflow-hidden rounded-[34px] border border-gold-400/25 bg-gradient-to-b from-wine-950/85 via-wine-900/70 to-wine-950/90 p-5 shadow-[0_40px_90px_-30px_rgba(16,2,7,0.9)] backdrop-blur-xl sm:p-8 lg:p-10">
        {/* ambient gold glows */}
        <div className="pointer-events-none absolute -top-28 right-[-60px] h-80 w-80 rounded-full bg-gold-400/12 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-32 left-[-40px] h-80 w-80 rounded-full bg-wine-500/25 blur-[120px]" />
        {[
          ["12%", "18%", "0s"],
          ["68%", "8%", "1.1s"],
          ["32%", "84%", "2.2s"],
          ["88%", "62%", "1.7s"],
          ["52%", "40%", "2.9s"],
        ].map(([l, t, d]) => (
          <span
            key={l + t}
            className="sparkle pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-gold-200"
            style={{ left: l, top: t, animationDelay: d }}
          />
        ))}

        {/* ---------- header ---------- */}
        <header
          className={`relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between ${
            seen ? "reveal" : "opacity-0"
          }`}
        >
          <div className="text-right">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/35 bg-gold-400/10 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.2em] text-gold-200">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
              LIMITED TIME
            </span>
            <h2 className="mt-3.5 text-[30px] font-black leading-tight sm:text-[40px]">
              <span className="gold-text">محصولات تخفیف‌دار</span>
            </h2>
            <p className="mt-2.5 max-w-xl text-[14px] leading-7 text-cream-100/65">
              منتخبی از لاکچری‌ترین محصولات سامسونگ با قیمت استثنایی — تعداد
              محدود، فقط تا پایان شمارش معکوس.
            </p>
            <div className="gold-rule mt-5 h-px w-56" />
          </div>

          <div className="shrink-0 text-right lg:text-left">
            <p className="mb-2.5 flex items-center justify-start gap-2 text-[12px] font-bold text-cream-100/60 lg:justify-end">
              <Zap className="h-4 w-4 text-gold-300" strokeWidth={2.4} />
              پایان پیشنهاد تا
            </p>
            <Countdown />
          </div>
        </header>

        {/* ---------- grid ---------- */}
        <div className="relative mt-9 grid gap-5 lg:grid-cols-12">
          {/* featured */}
          <article
            className={`group relative col-span-12 overflow-hidden rounded-[28px] border border-gold-400/25 bg-wine-950/50 lg:col-span-5 ${
              seen ? "card-in" : "opacity-0"
            }`}
            style={{ animationDelay: "0.12s" }}
          >
            <div className="relative h-[240px] overflow-hidden sm:h-[300px] lg:h-[332px]">
              <img
                src={featuredDeal.image}
                alt={featuredDeal.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-wine-950 via-wine-950/45 to-transparent" />

              <span className="ring-pulse absolute right-5 top-5 flex items-center gap-1.5 rounded-full bg-gradient-to-l from-gold-500 to-gold-300 px-3.5 py-1.5 text-[12px] font-black text-wine-950">
                <Crown className="h-3.5 w-3.5" strokeWidth={2.6} fill="currentColor" />
                پیشنهاد شگفت‌انگیز
              </span>

              <div className="absolute bottom-5 right-5 left-5">
                <h3 className="text-[24px] font-black text-cream-50 sm:text-[28px]">
                  {featuredDeal.name}
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-6 text-cream-100/70">
                  {featuredDeal.subtitle}
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <ul className="mb-5 grid gap-2">
                {featuredDeal.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-[12.5px] text-cream-100/70">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-400/15 text-gold-200">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>

              <StockBar sold={featuredDeal.sold} total={featuredDeal.total} animate={seen} />

              <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[12.5px] font-medium text-cream-100/40 line-through">
                    {faNum(featuredDeal.oldPrice)} تومان
                  </p>
                  <p className="mt-0.5 text-[24px] font-black text-cream-50">
                    {faNum(featuredDeal.price)}{" "}
                    <span className="text-[13px] font-bold text-cream-100/60">تومان</span>
                  </p>
                </div>
                <span className="flex items-center gap-1 rounded-2xl bg-gradient-to-b from-wine-500 to-wine-700 px-3 py-2 text-[16px] font-black text-cream-50 shadow-lg shadow-wine-900/50">
                  ٪{faNum(offPercent(featuredDeal.oldPrice, featuredDeal.price))}
                  <BadgePercent className="h-4 w-4" strokeWidth={2.4} />
                </span>
              </div>

              <button
                onClick={() => onAdd(featuredDeal.name)}
                className="shimmer relative mt-5 flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-l from-gold-500 via-gold-300 to-gold-500 py-3.5 text-[14px] font-black text-wine-950 shadow-[0_16px_34px_-12px_rgba(212,171,81,0.65)] transition-all duration-300 hover:brightness-110 active:scale-[0.98]"
              >
                <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={2.6} />
                خرید با تخفیف ویژه
              </button>
            </div>
          </article>

          {/* small deals */}
          <div className="col-span-12 grid gap-5 sm:grid-cols-2 lg:col-span-7">
            {deals.map((d, i) => (
              <DealCard key={d.id} deal={d} index={i} seen={seen} onAdd={onAdd} />
            ))}
          </div>
        </div>

        {/* footnote */}
        <p
          className={`mt-7 text-center text-[11.5px] text-cream-100/40 ${seen ? "reveal" : "opacity-0"}`}
          style={{ animationDelay: "0.6s" }}
        >
          قیمت‌های تخفیف‌دار تا پایان موجودی معتبر است • امکان پرداخت اقساطی برای
          خریدهای بالای ۳۰٬۰۰۰٬۰۰۰ تومان
        </p>
      </div>
    </section>
  );
}

/* ---------------- stock progress ---------------- */
function StockBar({ sold, total, animate }: { sold: number; total: number; animate: boolean }) {
  const pct = Math.min(100, Math.round((sold / total) * 100));
  const low = pct >= 80;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[11.5px] font-semibold">
        <span className={low ? "text-gold-200" : "text-cream-100/55"}>
          {low && "🔥 "}تنها {faNum(total - sold)} عدد باقی مانده
        </span>
        <span className="text-cream-100/40">فروخته‌شده {faNum(pct)}٪</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-cream-100/10">
        <div
          className={`h-full rounded-full bg-gradient-to-l from-gold-500 via-gold-300 to-gold-100 ${animate ? "bar-grow" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ---------------- compact deal card ---------------- */
function DealCard({
  deal,
  index,
  seen,
  onAdd,
}: {
  deal: Deal;
  index: number;
  seen: boolean;
  onAdd: (name: string) => void;
}) {
  const [added, setAdded] = useState(false);
  const t = useRef<number | null>(null);
  useEffect(() => () => {
    if (t.current) window.clearTimeout(t.current);
  }, []);

  const handle = () => {
    if (added) return;
    onAdd(deal.name);
    setAdded(true);
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article
      className={`group relative flex overflow-hidden rounded-[24px] border border-cream-100/10 bg-gradient-to-bl from-wine-900/55 to-wine-950/70 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-400/45 hover:shadow-[0_28px_55px_-22px_rgba(212,171,81,0.4)] ${
        seen ? "card-in" : "opacity-0"
      }`}
      style={{ animationDelay: `${0.2 + index * 0.1}s` }}
    >
      {/* image */}
      <div className="relative w-[38%] shrink-0 overflow-hidden">
        <img
          src={deal.image}
          alt={deal.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.12]"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-wine-950/70 to-transparent" />
        <span className="absolute left-2.5 top-2.5 rounded-xl bg-gradient-to-b from-wine-500 to-wine-700 px-2 py-1 text-[11.5px] font-black text-cream-50 shadow-lg shadow-wine-950/50">
          ٪{faNum(offPercent(deal.oldPrice, deal.price))}
        </span>
      </div>

      {/* body */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[15.5px] font-extrabold text-cream-50">
              {deal.name}
            </h3>
            {deal.tag && (
              <span className="flex shrink-0 items-center gap-1 rounded-full border border-gold-400/35 bg-gold-400/10 px-2 py-0.5 text-[10px] font-bold text-gold-200">
                <Flame className="h-2.5 w-2.5" strokeWidth={2.6} fill="currentColor" />
                {deal.tag}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11.5px] text-cream-100/45">{deal.subtitle}</p>

          <div className="mt-3">
            <StockBar sold={deal.sold} total={deal.total} animate={seen} />
          </div>
        </div>

        <div className="mt-3.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-cream-100/35 line-through">
              {faNum(deal.oldPrice)}
            </p>
            <p className="truncate text-[15px] font-black text-gold-200">
              {faNum(deal.price)}{" "}
              <span className="text-[11px] font-bold text-gold-200/70">تومان</span>
            </p>
          </div>
          <button
            onClick={handle}
            aria-label={`افزودن ${deal.name} به سبد`}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-all duration-300 active:scale-90 ${
              added
                ? "bg-[#1f7a4d] text-cream-50"
                : "bg-gradient-to-b from-gold-300 to-gold-500 text-wine-950 shadow-[0_10px_24px_-10px_rgba(212,171,81,0.8)] hover:brightness-110"
            }`}
          >
            {added ? (
              <Check className="h-4.5 w-4.5" strokeWidth={3} />
            ) : (
              <ShoppingCart className="h-[17px] w-[17px]" strokeWidth={2.4} />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
