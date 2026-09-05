import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { CartButton } from "@/components/layout/CartButton";
import { UserMenu } from "@/components/layout/UserMenu";
import { tickerItems } from "@/lib/content/home";
import hamiMark from "@/public/brand/hami-mark.png";

const navLinks = [
  { href: "/", label: "خانه" },
  { href: "/shop", label: "فروشگاه" },
];

function BrandMark() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="حامی همراه — صفحه اصلی">
      <Image src={hamiMark} alt="" priority className="size-9 rounded-xl bg-white ring-1 ring-gold/45" />
      <span className="hidden text-base font-black leading-tight text-foreground sm:block">
        حامی همراه
        <span className="block font-mono text-[11px] font-normal text-muted-foreground/70">
          پخش تلفن همراه — مشهد
        </span>
      </span>
    </Link>
  );
}

/** Infinite marquee — content rendered twice, animated by exactly half its
 * own (doubled) width so the loop is seamless with no JS measurement. */
function Ticker() {
  return (
    <div className="overflow-hidden border-b border-line bg-gradient-to-l from-oxblood/35 to-oxblood-deep/15">
      <div className="flex w-max animate-slide gap-12 py-2.5 hover:[animation-play-state:paused]">
        {[...tickerItems, ...tickerItems].map((item, i) => (
          <i key={i} className="flex shrink-0 items-center gap-2 text-[13px] not-italic text-muted-foreground/85">
            <span className="size-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
            {item}
          </i>
        ))}
      </div>
    </div>
  );
}

export function Header() {
  return (
    <header>
      <Ticker />

      <div className="site-header">
        <div className="container flex h-[72px] items-center gap-5">
          <MobileNav links={[...navLinks, { href: "/cart", label: "سبد خرید" }, { href: "/partners", label: "همکاری عمده" }]} />
          <BrandMark />

          <nav className="ms-2 hidden items-center gap-1 md:flex" aria-label="ناوبری اصلی">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3.5 py-2 text-sm text-muted-foreground/90 transition-colors hover:bg-foreground/5 hover:text-foreground"
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
              className="h-9"
            />
          </form>

          <div className="ms-auto flex items-center gap-1 lg:ms-3">
            <UserMenu />
            <CartButton />
          </div>

          <Link href="/partners">
            <Button size="sm">ثبت‌نام همکار</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
