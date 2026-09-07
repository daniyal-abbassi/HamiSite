# Shared Layout Components

Root shell, the storefront `(main)` shell, the `(admin)` shell, and every
chrome component that appears across pages.

### `app/layout.tsx`

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "حامی همراه | فروشگاه موبایل و اکسسوری",
    template: "%s | حامی همراه",
  },
  description:
    "فروشگاه حامی همراه — عرضه موبایل، ساعت هوشمند و اکسسوری؛ پشتیبانی از خرید خرد و عمده (B2B).",
};

/**
 * DIRECTION CONTRACT — read this before touching visual code.
 *
 * THESIS: Hami Hamrah's wholesale portal proves itself as a live, transparent
 * command-center for reseller pricing — not a flat editorial brochure. Every
 * number (price, stock, discount tier) must read as alive and current.
 * OWN-WORLD: near-black ink canvas (#0D0406) with atmospheric oxblood-ramp
 * glows (a 4-step burgundy scale, not a flat maroon fill), muted antique gold
 * accents (#C9A227 family — not the previous champagne-yellow), fully rounded
 * geometry (pills, 20-34px radii) and frosted glass surfaces (backdrop-blur +
 * gradient hairline border) throughout. Eyebrow pills and gold gradient-
 * shimmer text (one word per heading) are back — this world wants them.
 * STORY: a reseller/shop-owner lands, immediately reads this as a serious
 * live wholesale price source (not a retail storefront), and the primary
 * action is checking today's price list or applying to become a partner.
 * FIRST VIEWPORT: sticky glass nav → scrolling ticker → hero: eyebrow pill,
 * display headline with one gold gradient word, lead, two pill CTAs, trust
 * checklist, floating glass stat cards over a rotated phone silhouette.
 * FORM: user-pinned via a supplied reference file (aura-landingSample.html),
 * not derived from a discovery round — carries that catalog world's palette,
 * material, type, composition, and component grammar into the real product.
 * FINISH: unreviewed and undocumented is unfinished — this build ends with
 * typecheck, the design-hook detector, a dev-server render check, and
 * DESIGN.md rewritten from the built world, ground truth over intention.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* Fonts are self-hosted (see globals.css @font-face) — the font variables
       live on :root there, so no next/font className is needed here. */
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
```

### `app/(main)/layout.tsx`

```tsx
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CartProvider } from "@/components/providers/CartProvider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* CartProvider depends on AuthProvider: the server cart API is withAuth */}
      <CartProvider>
        <div className="site-shell flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 pb-14 md:pb-0">{children}</main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
```

### `app/(admin)/layout.tsx`

```tsx
import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "پنل مدیریت",
  description: "مدیریت فروشگاه حامی همراه — سفارش‌ها، محصولات، کاربران.",
};

/** Route group /admin — its own shell (AuthProvider + role gate + sidebar),
 * separate from the storefront's (main) layout. The group sits outside any
 * root layout's own provider nesting because (main) covers only (main) routes. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminGate>
        <div className="flex min-h-screen flex-col lg:flex-row">
          <AdminSidebar />
          <main className="min-w-0 flex-1 px-5 py-8 md:px-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </AdminGate>
    </AuthProvider>
  );
}
```

### `components/layout/Header.tsx`

```tsx
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
```

### `components/layout/MobileNav.tsx`

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

type NavLink = { href: string; label: string };

/** Minimal RTL slide-over nav — no radix dependency needed yet. */
export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="باز کردن منو"
        aria-expanded={open}
        className="grid size-10 place-items-center rounded-full border border-line bg-foreground/5 text-foreground/80 transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 animate-fade-in bg-ink/80 duration-slow backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="glass absolute inset-y-3 start-3 flex w-72 max-w-[85vw] animate-slide-in-end flex-col rounded-2xl p-6 text-foreground">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-base font-black">حامی همراه</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="بستن منو"
                className="grid size-9 place-items-center rounded-full transition-colors duration-fast hover:bg-foreground/10"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3.5 py-3 text-sm font-bold transition-colors duration-fast hover:bg-foreground/10"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="brand-hairline my-6" />
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-full bg-gradient-to-b from-gold-lite to-gold px-3 py-3 text-center text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              ورود / ثبت‌نام
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
```

### `components/layout/Footer.tsx`

```tsx
import Link from "next/link";
import Image from "next/image";
import hamiMark from "@/public/brand/hami-mark.png";

const footerGroups = [
  {
    title: "فروشگاه",
    links: [
      { href: "/shop", label: "همه محصولات" },
      { href: "/shop?category=mobile", label: "موبایل" },
      { href: "/shop?category=headphones", label: "ایرپاد و هدفون" },
      { href: "/shop?category=smartwatch", label: "ساعت هوشمند" },
    ],
  },
  {
    title: "حامی همراه",
    links: [
      { href: "/partners", label: "همکاری عمده (B2B)" },
      { href: "/about", label: "درباره ما" },
      { href: "/contact", label: "تماس با ما" },
    ],
  },
  {
    title: "حساب کاربری",
    links: [
      { href: "/login", label: "ورود" },
      { href: "/register", label: "ثبت‌نام" },
      { href: "/my-orders", label: "سفارش‌های من" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative z-[2] mt-20 border-t border-line bg-ink-2/60">
      <div className="brand-hairline" />
      <div className="container grid gap-10 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <Image src={hamiMark} alt="" className="size-9 rounded-xl bg-white ring-1 ring-gold/45" />
            <span className="text-base font-black">
              حامی همراه
              <span className="block font-mono text-[11px] font-normal text-muted-foreground/60">
                پخش تلفن همراه — مشهد
              </span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-[13px] leading-7 text-muted-foreground/70">
            عرضه‌کننده تخصصی موبایل، ساعت هوشمند و اکسسوری — با تکیه بر اصالت کالا،
            شفافیت قیمت و پشتیبانی حرفه‌ای از خرید خرد و عمده.
          </p>
        </div>

        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h3 className="m-0 font-mono text-[11px] font-medium tracking-[0.04em] text-gold">
              {group.title}
            </h3>
            <ul className="mt-4 list-none space-y-2.5 p-0">
              {group.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-[13.5px] text-muted-foreground/85 transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-[12.5px] text-muted-foreground/45 sm:flex-row">
          <p className="m-0">© ۱۴۰۵ حامی همراه — تمامی حقوق محفوظ است.</p>
          <p className="m-0">مشهد</p>
        </div>
      </div>
    </footer>
  );
}
```

### `components/layout/CartButton.tsx`

```tsx
"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";

/** Header cart trigger — opens the glass drawer. The badge shows the live
 * server-cart count (0/hidden for guests until they add something). */
export function CartButton() {
  const { itemCount, openDrawer } = useCart();

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={itemCount > 0 ? `سبد خرید، ${itemCount.toLocaleString("fa-IR")} کالا` : "سبد خرید"}
      className="relative grid size-10 place-items-center rounded-full text-foreground/75 transition-colors hover:bg-foreground/10 hover:text-foreground"
    >
      <ShoppingBag className="size-[18px]" />
      {itemCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -end-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 font-mono text-[10px] font-bold text-primary-foreground"
        >
          {itemCount.toLocaleString("fa-IR")}
        </span>
      )}
    </button>
  );
}
```

### `components/layout/UserMenu.tsx`

```tsx
"use client";

import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";

/** Header auth island: login link for guests, name chip + logout for users.
 * Cart clearing on logout happens automatically — CartProvider watches the
 * auth status and drops the server cart state. */
export function UserMenu() {
  const { user, status, logout } = useAuth();

  if (status === "loading") {
    return <Skeleton className="size-10 rounded-full" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        aria-label="ورود به حساب"
        className="grid size-10 place-items-center rounded-full text-foreground/75 transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <UserRound className="size-[18px]" />
      </Link>
    );
  }

  const displayName = user.firstName ?? user.username;

  return (
    <div className="flex items-center gap-0.5">
      <Link
        href="/orders"
        title={`حساب کاربری: ${displayName}`}
        className="hidden max-w-36 truncate rounded-full border border-line bg-foreground/5 px-3 py-1.5 text-xs font-bold text-foreground/90 transition-colors hover:bg-foreground/10 sm:block"
      >
        {displayName}
      </Link>
      <Link
        href="/orders"
        aria-label="حساب کاربری"
        className="grid size-10 place-items-center rounded-full text-foreground/75 transition-colors hover:bg-foreground/10 hover:text-foreground sm:hidden"
      >
        <UserRound className="size-[18px]" />
      </Link>
      <button
        type="button"
        onClick={() => void logout()}
        aria-label="خروج از حساب"
        className="grid size-10 place-items-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
```

### `components/admin/AdminSidebar.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  Boxes,
  Building2,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  Store,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/orders", label: "سفارش‌ها", icon: Package },
  { href: "/admin/products", label: "محصولات", icon: Boxes },
  { href: "/admin/users", label: "کاربران", icon: Users },
  { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: FolderTree },
  { href: "/admin/brands", label: "برندها", icon: Building2 },
  { href: "/admin/coupons", label: "کوپن‌ها", icon: BadgePercent },
];

function NavLink({ item }: { item: (typeof NAV_ITEMS)[number] }) {
  const pathname = usePathname();
  const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px] font-bold transition-colors duration-fast",
        active
          ? "bg-gold/15 text-gold"
          : "text-muted-foreground/85 hover:bg-foreground/5 hover:text-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <item.icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <>
      {/* Desktop: fixed rail on the logical start (physical right under RTL) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-e border-line bg-ink-2/60 p-4 backdrop-blur-md lg:flex">
        <Link href="/admin" className="flex items-center gap-2 px-2 py-2" aria-label="حامی همراه — پنل مدیریت">
          <span className="grid size-9 place-items-center rounded-xl bg-gold/15 font-mono text-[10px] font-bold tracking-[0.1em] text-gold">
            ADMIN
          </span>
          <span className="text-sm font-black">حامی همراه</span>
        </Link>

        <nav className="mt-6 flex flex-1 flex-col gap-1" aria-label="مدیریت">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="brand-hairline my-4" />
        <div className="flex flex-col gap-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px] font-bold text-muted-foreground/85 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <Store className="size-4 shrink-0" />
            مشاهده فروشگاه
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-start text-[13px] font-bold text-destructive/90 transition-colors hover:bg-destructive/10"
          >
            <LogOut className="size-4 shrink-0" />
            خروج
          </button>
        </div>
      </aside>

      {/* Mobile: horizontal tab strip */}
      <div className="sticky top-0 z-30 border-b border-line bg-ink-2/90 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-1 overflow-x-auto p-2">
          <Link href="/" className="me-auto shrink-0" aria-label="فروشگاه">
            <span className="grid size-9 place-items-center rounded-xl bg-gold/15 font-mono text-[9px] font-bold text-gold">
              ADMIN
            </span>
          </Link>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors",
                  active ? "bg-gold/15 text-gold" : "text-muted-foreground/85 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="خروج"
            className="grid size-9 shrink-0 place-items-center rounded-full text-destructive/90 hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </>
  );
}
```

### `components/admin/AdminGate.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";

/** Role gate for every /admin route. Guests → /login?next=/admin; any
 * non-ADMIN authenticated role → home. Renders a skeleton while /me resolves
 * so there's no flash of dashboard to a non-admin. */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login?next=/admin");
    } else if (status === "authenticated" && user?.role !== "ADMIN") {
      router.replace("/");
    }
  }, [status, user?.role, router]);

  if (status === "loading") {
    return (
      <div className="grid gap-4 p-8 md:grid-cols-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl md:col-span-2" />
        <Skeleton className="h-64 rounded-2xl md:col-span-3" />
      </div>
    );
  }

  if (status === "guest" || user?.role !== "ADMIN") return null;

  return <>{children}</>;
}
```

### `components/providers/AuthProvider.tsx`

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api-client";
import type { PublicUser } from "@/types/auth";

type AuthStatus = "loading" | "authenticated" | "guest";

type AuthContextValue = {
  user: PublicUser | null;
  status: AuthStatus;
  /** Re-fetch /api/auth/me — call after login/register or to re-sync state. */
  refresh: () => Promise<PublicUser | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      const me = await apiGet<PublicUser>("/api/auth/me");
      setUser(me);
      setStatus("authenticated");
      return me;
    } catch {
      // 401 (no/expired session) or a transient failure — both render as guest;
      // the storefront is fully browsable without an account.
      setUser(null);
      setStatus("guest");
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await apiPost("/api/auth/logout");
    } catch {
      // Session was already gone server-side — clearing locally is still correct.
    }
    setUser(null);
    setStatus("guest");
  }, []);

  const value = useMemo(() => ({ user, status, refresh, logout }), [user, status, refresh, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
```

### `components/providers/CartProvider.tsx`

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Cart } from "@/types/store";

type CartContextValue = {
  cart: Cart | null;
  loading: boolean;
  /** The cart API is withAuth — guests have no server cart. */
  hasCart: boolean;
  itemCount: number;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  refresh: () => Promise<void>;
  addItem: (productId: number, variantId?: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setCart(await apiGet<Cart>("/api/cart"));
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync the server cart with the session state: fetch on login, drop on logout.
  useEffect(() => {
    if (status === "authenticated") {
      void refresh();
    } else if (status === "guest") {
      setCart(null);
      setLoading(false);
    }
  }, [status, refresh]);

  const addItem = useCallback(async (productId: number, variantId?: number, quantity = 1) => {
    // `variantId: undefined` is dropped by JSON.stringify — matches the API's
    // optional-variant contract for products without variants.
    const updated = await apiPost<Cart>("/api/cart/items", { productId, variantId, quantity });
    setCart(updated);
    setDrawerOpen(true);
  }, []);

  const updateItem = useCallback(async (itemId: number, quantity: number) => {
    setCart(await apiPatch<Cart>(`/api/cart/items/${itemId}`, { quantity }));
  }, []);

  const removeItem = useCallback(async (itemId: number) => {
    setCart(await apiDelete<Cart>(`/api/cart/items/${itemId}`));
  }, []);

  const clear = useCallback(async () => {
    setCart(await apiDelete<Cart>("/api/cart"));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading: loading || status === "loading",
      hasCart: status === "authenticated",
      itemCount: cart?.itemCount ?? 0,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      refresh,
      addItem,
      updateItem,
      removeItem,
      clear,
    }),
    [cart, loading, status, drawerOpen, refresh, addItem, updateItem, removeItem, clear],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider> (inside <AuthProvider>)");
  return ctx;
}
```

