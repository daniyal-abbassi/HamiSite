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
          {/*
            Everything above this comment is fixed, and it is fixed *outside* the scroll smoother on
            purpose. ScrollSmoother animates by transforming `#smooth-content`, and a transformed
            ancestor becomes the containing block for `position: fixed` descendants — so any fixed
            element placed inside the wrapped subtree stops sticking to the viewport and starts
            travelling with the page. That is the same mechanism behind `PageGround` being mounted here
            rather than in the page (research D3) and behind the note on `.tray-field` about
            `background-attachment: fixed` failing inside a `Reveal` wrapper.

            Rule for anyone editing this file: document flow goes inside `<ScrollSmooth>`, fixed
            overlays do not. It will look correct in a static screenshot either way.
          */}
          {/* The scroll-driven ground, first so `.noir-stars` and the content still sit above it.
              It renders nothing off the homepage. */}
          <PageGround />
          {/* Red-noir depth layers. Both are fixed, inert and sit beneath every
              .wrap section; they add atmosphere without touching content. */}
          <div className="noir-stars" aria-hidden="true">
            <i />
            <i />
          </div>
          <div className="gradient-blur" aria-hidden="true" />
          <Header />

          <ScrollSmooth>
            {/* The credentials marquee used to sit here and carried the padding
                that cleared the fixed header island. With it gone that clearance
                moves onto <main>, or the first section slides under the nav. */}
            <main className="flex-1 pt-24 md:pt-28 relative z-10">{children}</main>
            <Footer />
          </ScrollSmooth>

          {/* Mobile primary navigation. Lives here, not a page, so the whole
              buying path has it — it previously rendered only on the home page. */}
          <MobileDock />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
