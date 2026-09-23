import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TrustGlyph } from "@/components/home/primitives";
import { Reveal } from "@/components/home/Reveal";
import { mobileQuickRoutes, trustFeatures } from "@/lib/content/home";

export function MobileQuickRoutes() {
  return (
    <nav className="container flex gap-3 overflow-x-hidden py-6 md:hidden" aria-label="مسیرهای سریع موبایل">
      {mobileQuickRoutes.map((route, index) => (
        <Link
          key={route.key}
          href={route.href}
          className="glass flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold"
        >
          <span className="font-mono text-xs text-aqua">{String(index + 1).padStart(2, "0")}</span>
          {route.label}
          <ArrowLeft className="size-3.5 text-aqua" />
        </Link>
      ))}
    </nav>
  );
}
