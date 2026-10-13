import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SkipLink } from "@/components/common/SkipLink";

export const metadata: Metadata = {
  title: "پنل مدیریت",
  description: "مدیریت فروشگاه حامی همراه — سفارش‌ها، محصولات، کاربران.",
  robots: { index: false, follow: false },
};

/** Route group /admin — its own shell (AuthProvider + role gate + sidebar),
 * separate from the storefront's (main) layout. The group sits outside any
 * root layout's own provider nesting because (main) covers only (main) routes.
 *
 * The frame is flat and solid on purpose: the storefront glows, this surface is
 * operated all day. `AdminSidebar` owns both nav placements — a sticky rail from
 * `lg` up, a top bar plus a thumb rail below it — so no admin page needs a
 * per-page edit to inherit the shell (FR-008). The bottom padding on `main` is
 * what keeps the last row clear of the fixed phone rail and its gesture bar, and
 * the skip link ahead of the sidebar is what keeps ten nav rows off the keyboard
 * path (WCAG 2.4.1). The mobile destination sheet uses a native modal dialog,
 * which makes the rest of the document inert while it is open. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <SkipLink />
        <AdminSidebar />
        <main
          id="main"
          className="min-w-0 flex-1 bg-white/[0.06] px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-6 lg:px-8 lg:pt-8 lg:pb-10"
        >
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
