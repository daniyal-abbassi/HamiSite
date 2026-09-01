import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-14 md:pb-0">{children}</main>
      <Footer />
    </div>
  );
}
