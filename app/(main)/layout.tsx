import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileDock } from "@/components/layout/MobileDock";
import { PageGround } from "@/components/atmosphere/PageGround";
import { ScrollSmooth } from "@/components/atmosphere/ScrollSmooth";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CartProvider } from "@/components/providers/CartProvider";
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* CartProvider depends on AuthProvider: the server cart API is withAuth */}
      <CartProvider>
        <div className="site-shell flex min-h-screen flex-col relative">
          {/* Desktop wheel/trackpad easing. Renders nothing and wraps nothing: Lenis animates the
              real document scroll, so unlike ScrollSmoother it creates no containing block and the
              fixed layers below need no special placement — see components/atmosphere/ScrollSmooth.tsx */}
          <ScrollSmooth />
          {/* The scroll-driven ground, first so `.noir-stars` and the content still sit above it.
              It is here rather than in the page because a transformed ancestor captures
              `position: fixed`, and every homepage section is wrapped in `Reveal` — see
              components/atmosphere/PageGround.tsx. It renders nothing off the homepage. */}
          <PageGround />
          {/* Red-noir depth layers. Both are fixed, inert and sit beneath every
              .wrap section; they add atmosphere without touching content. */}
          <div className="noir-stars" aria-hidden="true">
            <i />
            <i />
          </div>
          <div className="gradient-blur" aria-hidden="true" />
          <Header />
          {/* The credentials marquee used to sit here and carried the padding
              that cleared the fixed header island. With it gone that clearance
              moves onto <main>, or the first section slides under the nav. */}
          <main className="flex-1 pt-24 md:pt-28 relative z-10">{children}</main>
          <Footer />
          {/* Mobile primary navigation. Lives here, not in a page, so the whole
              buying path has it — it previously rendered only on the home page. */}
          <MobileDock />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
