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