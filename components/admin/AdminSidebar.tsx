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