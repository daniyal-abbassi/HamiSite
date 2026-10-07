import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Flame, Heart, ShoppingCart, Star } from "lucide-react";
import { faNum, type Product } from "../data/products";

interface Props {
  product: Product;
  index: number;
  wished: boolean;
  onWish: (id: number) => void;
  onAdd: (p: Product) => void;
}

const badgeConfig = {
  special: {
    label: "پیشنهاد ویژه",
    icon: Star,
    cls: "bg-gradient-to-l from-wine-600 to-wine-800 text-cream-50 shadow-lg shadow-wine-900/30",
    filled: true,
  },
  new: {
    label: "جدید",
    icon: null,
    cls: "bg-cream-50 text-wine-900 shadow-md",
    filled: false,
  },
  hot: {
    label: "پرفروش",
    icon: Flame,
    cls: "bg-gradient-to-l from-wine-600 to-wine-800 text-cream-50 shadow-lg shadow-wine-900/30",
    filled: true,
  },
} as const;

export default function ProductCard({ product, index, wished, onWish, onAdd }: Props) {
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const dark = product.badge === "special" || product.badge === "hot";
  const badge = product.badge ? badgeConfig[product.badge] : null;
  const BadgeIcon = badge?.icon ?? null;

  const handleAdd = () => {
    if (!product.inStock || added) return;
    onAdd(product);
    setAdded(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article
      dir="ltr"
      className="card-in group relative flex w-[262px] shrink-0 snap-start flex-col overflow-hidden rounded-[26px] bg-gradient-to-b from-blush-100 to-blush-200 ring-1 ring-white/60 shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_34px_60px_-18px_rgba(30,3,12,0.65)] sm:w-[272px]"
      style={{ animationDelay: `${0.15 + index * 0.09}s` }}
    >
      {/* badge */}
      {badge && (
        <span
          className={`absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-bold ${badge.cls}`}
        >
          {BadgeIcon && (
            <BadgeIcon
              className="h-3.5 w-3.5"
              strokeWidth={2.4}
              fill={badge.filled ? "currentColor" : "none"}
            />
          )}
          {badge.label}
        </span>
      )}

      {/* wishlist */}
      <button
        aria-label="علاقه‌مندی"
        onClick={() => onWish(product.id)}
        className={`absolute top-3.5 right-3.5 z-10 grid h-9 w-9 place-items-center rounded-full transition-all duration-300 hover:scale-110 active:scale-90 ${
          wished
            ? "bg-wine-700 text-cream-50 shadow-lg shadow-wine-900/40"
            : "bg-white/55 text-wine-900/70 backdrop-blur-sm hover:bg-white/80 hover:text-wine-800"
        }`}
      >
        <Heart className="h-[17px] w-[17px]" strokeWidth={2.2} fill={wished ? "currentColor" : "none"} />
      </button>

      {/* image */}
      <div className="relative h-[208px] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.07]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-blush-200/80 to-transparent" />
        {!product.inStock && (
          <div className="absolute inset-0 grid place-items-center bg-wine-950/45 backdrop-blur-[2px]">
            <span className="rounded-full bg-cream-50 px-4 py-1.5 text-[12px] font-bold text-wine-800">
              ناموجود
            </span>
          </div>
        )}
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col px-5 pt-3.5 pb-5 text-left">
        <p className="text-[10px] font-bold tracking-[0.22em] text-wine-900/40">SAMSUNG</p>
        <h3 className="mt-1 text-[17px] font-extrabold text-[#2d2326]">{product.name}</h3>

        <div className="mt-2.5 flex items-center gap-1.5">
          {product.colors.map((c) => (
            <span
              key={c}
              title={c}
              className="h-4 w-4 rounded-full ring-1 ring-black/10 transition-transform duration-200 hover:scale-125"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <p className="mt-3.5 text-[15px] font-extrabold text-wine-700" dir="rtl">
          {faNum(product.price)}{" "}
          <span className="text-[12.5px] font-bold text-wine-700/80">تومان</span>
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-[13px] font-bold transition-all duration-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 ${
              added
                ? "bg-[#1f7a4d] text-cream-50"
                : dark
                  ? "bg-gradient-to-l from-wine-600 to-wine-800 text-cream-50 shadow-lg shadow-wine-900/30 hover:brightness-110"
                  : "bg-cream-50 text-wine-900 shadow-md ring-1 ring-wine-900/5 hover:bg-white"
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" strokeWidth={3} />
                اضافه شد
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" strokeWidth={2.2} />
                افزودن به سبد
              </>
            )}
          </button>
          <button
            aria-label="مشاهده محصول"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cream-50 text-wine-800 shadow-md ring-1 ring-wine-900/5 transition-all duration-300 hover:bg-wine-800 hover:text-cream-50 active:scale-90"
          >
            <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </article>
  );
}
