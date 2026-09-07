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
          <main className="flex-1 pb-14 pt-24 md:pb-0 md:pt-28">{children}</main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
