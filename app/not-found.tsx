import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileDock } from "@/components/layout/MobileDock";
import { PageGround } from "@/components/atmosphere/PageGround";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import { Button } from "@/components/ui/button";

/**
 * The storefront 404.
 *
 * There was none, so a mistyped or retired address — including three links the
 * footer ships on every page — landed on Next's framework page: English text on
 * a Persian site. `dir="rtl"` came from the root layout, but nothing else did.
 *
 * It rebuilds the storefront shell here rather than inheriting it, because an
 * unmatched URL belongs to no route group: `app/(main)/not-found.tsx` is never
 * consulted for `/about`, so the chrome and its providers have to be composed
 * in. That is duplication of `app/(main)/layout.tsx` on one screen, and the
 * alternative was a brand-less error page.
 */
export default function NotFound() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="site-shell flex min-h-screen flex-col relative">
          <Header />
          <main className="container relative z-10 flex flex-1 flex-col items-center justify-center gap-5 py-24 text-center">
            <span className="font-mono text-xs tracking-normal text-champagne">۴۰۴</span>
            <h1 className="text-2xl font-black leading-snug text-foreground md:text-3xl">
              این صفحه در فروشگاه حامی همراه وجود ندارد.
            </h1>
            <p className="max-w-md text-sm leading-7 text-muted-foreground">
              ممکن است آدرس را اشتباه وارد کرده باشید، یا آن صفحه حذف یا جایگزین شده باشد. برای پیدا
              کردن محصول، از جست‌وجوی بالای صفحه یا فهرست فروشگاه استفاده کنید.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/shop">
                <Button variant="oxblood">بازگشت به فروشگاه</Button>
              </Link>
              <Link href="/">
                <Button variant="ghost">صفحه نخست</Button>
              </Link>
            </div>
          </main>
          <Footer />
          <MobileDock />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
