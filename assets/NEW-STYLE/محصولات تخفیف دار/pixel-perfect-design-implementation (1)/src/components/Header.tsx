import { useState } from "react";
import {
  ArrowLeft,
  Handshake,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  X,
} from "lucide-react";

const navLinks: {
  label: string;
  active: boolean;
  truncate?: boolean;
  href?: string;
  gold?: boolean;
}[] = [
  { label: "خانه", active: true, href: "#" },
  { label: "فروشگاه", active: false, href: "#" },
  { label: "تخفیف‌ها", active: false, href: "#deals", gold: true },
  { label: "همکاری عمده‌فروشی", active: false, truncate: true, href: "#" },
  { label: "رسیدگی محصولات", active: false, href: "#" },
];

interface HeaderProps {
  cartCount: number;
  query: string;
  onQuery: (q: string) => void;
}

export default function Header({ cartCount, query, onQuery }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="reveal relative z-30 mx-auto w-full max-w-[1280px] px-4 sm:px-6">
      <div className="flex h-16 items-center gap-1.5 rounded-full bg-cream-100 px-2.5 shadow-pill sm:gap-2 sm:px-3">
        {/* logo */}
        <a
          href="#"
          className="group -my-4 flex shrink-0 items-center gap-2.5 rounded-full bg-gradient-to-b from-wine-600 to-wine-800 py-3 pe-5 ps-4 text-cream-50 shadow-pill ring-1 ring-wine-500/40 transition-transform duration-300 hover:scale-[1.03]"
        >
          <span className="text-right text-[15px] font-extrabold leading-[1.15]">
            حامی
            <br />
            همراه
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-2xl border border-cream-50/40 transition-colors group-hover:bg-cream-50/10">
            <Smartphone className="h-4.5 w-4.5" strokeWidth={2.2} />
          </span>
        </a>

        {/* desktop nav */}
        <nav className="ms-2 hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href ?? "#"}
              className={`max-w-[130px] whitespace-nowrap rounded-full px-4 py-2 text-[13.5px] font-semibold transition-all duration-300 ${
                l.active
                  ? "bg-wine-800 text-cream-50 shadow-md"
                  : l.gold
                    ? "bg-gradient-to-l from-gold-500/20 to-gold-300/25 text-gold-600 ring-1 ring-gold-400/45 hover:from-gold-500/35 hover:to-gold-300/40"
                    : "text-wine-900/75 hover:bg-wine-800/10 hover:text-wine-900"
              } ${l.truncate ? "truncate" : ""}`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <span className="ms-1 hidden select-none text-[13px] font-medium tracking-wide text-wine-900/55 xl:block">
          who
        </span>

        <div className="flex-1" />

        {/* actions */}
        <button
          aria-label="کیف خرید"
          className="hidden h-10 w-10 shrink-0 place-items-center rounded-full text-wine-900/70 transition-colors hover:bg-wine-800/10 hover:text-wine-900 sm:grid"
        >
          <ShoppingBag className="h-[19px] w-[19px]" strokeWidth={2} />
        </button>

        <button
          aria-label="سبد خرید"
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-wine-900/70 transition-colors hover:bg-wine-800/10 hover:text-wine-900"
        >
          <ShoppingCart className="h-[19px] w-[19px]" strokeWidth={2} />
          {cartCount > 0 && (
            <span
              key={cartCount}
              className="badge-pop absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-wine-700 px-1 text-[10px] font-bold text-cream-50 ring-2 ring-cream-100"
            >
              {cartCount.toLocaleString("fa-IR")}
            </span>
          )}
        </button>

        {/* search */}
        <label className="hidden h-10 items-center gap-2 rounded-full bg-wine-900/[0.06] px-4 text-wine-900/70 ring-1 ring-wine-900/10 transition-all focus-within:bg-white focus-within:ring-wine-600/40 md:flex md:w-44 lg:w-52">
          <Search className="h-4 w-4 shrink-0" strokeWidth={2.2} />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="جستجو در محصولات..."
            className="w-full bg-transparent text-[12.5px] font-medium text-wine-900 placeholder:text-wine-900/45 focus:outline-none"
          />
        </label>

        <a
          href="#"
          className="hidden h-10 shrink-0 items-center gap-2 rounded-full bg-cream-200/80 px-4 text-[13px] font-bold text-wine-900 ring-1 ring-wine-900/10 transition-all duration-300 hover:bg-wine-800 hover:text-cream-50 sm:flex"
        >
          <Handshake className="h-[18px] w-[18px]" strokeWidth={2} />
          شروع همکاری
        </a>

        <button
          aria-label="بازگشت"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-wine-900/70 transition-all hover:-translate-x-0.5 hover:bg-wine-800/10 hover:text-wine-900"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>

        {/* mobile menu toggle */}
        <button
          aria-label="منو"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-wine-900/80 transition-colors hover:bg-wine-800/10 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* mobile dropdown */}
      <div
        className={`overflow-hidden transition-all duration-500 lg:hidden ${
          open ? "mt-2 max-h-72 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-1 rounded-3xl bg-cream-100 p-3 shadow-pill">
          <label className="mb-1 flex h-10 items-center gap-2 rounded-full bg-wine-900/[0.06] px-4 text-wine-900/70 md:hidden">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="جستجو در محصولات..."
              className="w-full bg-transparent text-[13px] font-medium text-wine-900 placeholder:text-wine-900/45 focus:outline-none"
            />
          </label>
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href ?? "#"}
              onClick={() => setOpen(false)}
              className={`rounded-2xl px-4 py-2.5 text-[13.5px] font-semibold transition-colors ${
                l.active
                  ? "bg-wine-800 text-cream-50"
                  : l.gold
                    ? "bg-gradient-to-l from-gold-500/20 to-gold-300/25 text-gold-600 ring-1 ring-gold-400/45"
                    : "text-wine-900/75 hover:bg-wine-800/10"
              }`}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#"
            className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-cream-200 px-4 py-2.5 text-[13px] font-bold text-wine-900"
          >
            <Handshake className="h-4 w-4" />
            شروع همکاری
          </a>
        </nav>
      </div>
    </header>
  );
}
