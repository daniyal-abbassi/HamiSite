import Link from "next/link";
import { ShoppingBag, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MobileNav } from "@/components/layout/MobileNav";

const navLinks = [
  { href: "/", label: "خانه" },
  { href: "/shop", label: "فروشگاه" },
  { href: "/partners", label: "همکاری عمده" },
];

/** Text-based brand mark — the official `hami-mark` asset is still missing
 * (see docs/inspires/.../MISSING-ASSETS.md); swap in the <img> once restored. */
function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="حامی همراه — صفحه اصلی">
      <span className="grid size-9 place-items-center rounded-sm bg-wine font-mono text-sm font-medium text-champagne-light">
        H
      </span>
      <span className="text-base font-black leading-tight text-ink-dark">
        حامی همراه
        <span className="block font-mono text-[9px] font-normal tracking-[0.14em] text-ink-dark/50">
          HAMI HAMRAH
        </span>
      </span>
    </Link>
  );
}

export function Header() {
  return (
    <header>
      {/* brand ticker strip */}
      <div className="flex min-h-[38px] items-center bg-wine-ink text-[10px] font-semibold text-[#fffaf2]/80">
        <div className="container flex items-center gap-2.5">
          <span className="size-[5px] animate-pulse-dot rounded-full bg-champagne shadow-[0_0_0_4px_rgba(217,185,121,0.12)]" />
          <p className="m-0">عرضه تخصصی موبایل و اکسسوری</p>
          <span className="mx-1 h-3 w-px bg-[#fffaf2]/20" />
          <span className="font-mono tracking-[0.06em] text-champagne-light">B2C + B2B</span>
          <p className="m-0 hidden text-[#fffaf2]/50 sm:block">
            پشتیبانی خرید عمده برای همکاران
          </p>
        </div>
      </div>

      {/* cream sticky bar */}
      <div className="site-header border-b border-[rgba(40,28,29,0.08)]">
        <div className="container flex h-16 items-center gap-4">
          <MobileNav links={navLinks} />
          <BrandMark />

          <nav className="ms-6 hidden items-center gap-6 md:flex" aria-label="ناوبری اصلی">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-bold text-ink-dark/80 transition-colors hover:text-wine"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <form action="/shop" role="search" className="ms-auto hidden w-64 lg:block">
            <Input
              type="search"
              name="q"
              placeholder="جستجوی محصول…"
              aria-label="جستجوی محصول"
              className="h-9 border-[rgba(40,28,29,0.16)] bg-white/60 text-ink-dark placeholder:text-ink-dark/40"
            />
          </form>

          <div className="ms-auto flex items-center gap-1 lg:ms-3">
            <Link
              href="/login"
              aria-label="ورود به حساب"
              className="grid size-10 place-items-center rounded-sm text-ink-dark/80 transition-colors hover:bg-wine/10 hover:text-wine"
            >
              <UserRound className="size-[18px]" />
            </Link>
            <Link
              href="/cart"
              aria-label="سبد خرید"
              className="grid size-10 place-items-center rounded-sm text-ink-dark/80 transition-colors hover:bg-wine/10 hover:text-wine"
            >
              <ShoppingBag className="size-[18px]" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
