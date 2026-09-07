import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { MobileNav } from "@/components/layout/MobileNav";
import { CartButton } from "@/components/layout/CartButton";
import { UserMenu } from "@/components/layout/UserMenu";
import { PillNav, type PillNavItem } from "@/components/layout/PillNav";
import hamiMark from "@/public/brand/hami-mark.png";

const navItems: PillNavItem[] = [
  { href: "/", label: "خانه" },
  { href: "/shop", label: "فروشگاه" },
  { href: "/partners", label: "همکاری عمده" },
];

/**
 * A floating navigation island, not a full-width bar.
 *
 * The header is fixed and its only child is one centred glass pill, matching
 * the reference layout. The credentials marquee that used to sit under it was
 * removed outright; the clearance it provided now lives on <main> in the
 * storefront layout.
 *
 * PillNav keeps its rising-circle hover but drops its own logo circle and
 * container fill here — the island already provides both, and nesting a pill
 * inside a pill reads as a mistake.
 */
export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:pt-6">
      <nav className="mx-auto flex max-w-6xl items-center gap-3 rounded-full border border-line bg-card/70 px-3 py-2 shadow-deep backdrop-blur-xl">
        <MobileNav links={[...navItems, { href: "/cart", label: "سبد خرید" }]} />

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 ps-1"
          aria-label="حامی همراه — صفحه اصلی"
        >
          <Image src={hamiMark} alt="" priority className="size-9 rounded-xl bg-white ring-1 ring-aqua/45" />
          <span className="hidden text-[15px] font-black leading-tight text-card-foreground sm:block">
            حامی همراه
          </span>
        </Link>

        <PillNav
          className="hidden md:block"
          showLogo={false}
          logo=""
          items={navItems}
          baseColor="transparent"
          circleColor="rgb(var(--primary))"
          pillColor="rgb(var(--foreground) / 0.05)"
          pillTextColor="rgb(var(--foreground) / 0.85)"
          hoveredPillTextColor="rgb(var(--primary-foreground))"
        />

        <div className="ms-auto flex items-center gap-2">
          <form action="/shop" role="search" className="hidden lg:block">
            <Input
              type="search"
              name="q"
              placeholder="جستجوی محصول…"
              aria-label="جستجوی محصول"
              className="h-9 w-48 rounded-full border-line bg-foreground/[0.04]"
            />
          </form>

          <div className="flex items-center gap-1">
            <UserMenu />
            <CartButton />
          </div>

          {/* The one place signal red appears in the chrome. */}
          <Link
            href="/partners"
            className="shiny-edge hidden h-10 items-center gap-2 px-5 text-sm font-bold transition-transform hover:-translate-y-0.5 active:scale-95 sm:inline-flex"
          >
            ثبت‌نام همکار
            <span className="size-1.5 rounded-full bg-signal" aria-hidden="true" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
