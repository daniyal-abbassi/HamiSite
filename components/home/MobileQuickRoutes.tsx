import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { mobileQuickRoutes } from "@/lib/content/home";

export function MobileQuickRoutes() {
  return (
    <nav className="container flex gap-3 overflow-x-hidden py-6 md:hidden" aria-label="مسیرهای سریع موبایل">
      {mobileQuickRoutes.map((route) => (
        <Link
          key={route.key}
          href={route.href}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-champagne-lite px-4 py-2.5 text-xs font-bold text-oxblood-deep shadow-sm extend-touch-target"
        >
          {route.label}
          <ArrowLeft className="size-3.5 text-oxblood" />
        </Link>
      ))}
    </nav>
  );
}
