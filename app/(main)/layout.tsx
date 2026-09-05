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
