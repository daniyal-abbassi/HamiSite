import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionLabel, TrustGlyph } from "@/components/home/primitives";
import { Reveal } from "@/components/home/Reveal";
import { mobileQuickRoutes, trustFeatures } from "@/lib/content/home";

export function TrustBar() {
  return (
    <section id="trust" className="border-b border-border bg-wine-dark/30" aria-labelledby="trust-bar-title">
      <div className="container py-12">
        <h2 id="trust-bar-title" className="sr-only">چهار دلیل برای اعتماد به حامی همراه</h2>
        <div className="flex items-center gap-3" aria-label="رکورد تصمیم‌گیری حامی همراه">
          <span className="font-mono text-[9px] tracking-[0.12em] text-champagne">HAMI / DECISION ARCHIVE</span>
          <i className="h-px w-8 bg-champagne/50" aria-hidden="true" />
          <p className="m-0 text-[11px] text-foreground/55">فروش حضوری، پخش عمده و اکوسیستم موبایل</p>
        </div>
        <ul className="mt-8 grid list-none gap-8 p-0 sm:grid-cols-2 lg:grid-cols-4" role="list">
          {trustFeatures.map((feature, index) => (
            <li key={feature.key} className="flex items-start gap-4">
              <Reveal delay={index * 70} className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-sm border border-champagne/35 text-champagne">
                  <TrustGlyph name={feature.key} />
                </span>
                <div>
                  <h3 className="m-0 text-sm font-extrabold">{feature.title}</h3>
                  <p className="mt-1 text-xs leading-6 text-foreground/55">{feature.description}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function MobileQuickRoutes() {
  return (
    <nav className="container flex gap-3 overflow-x-auto py-6 md:hidden" aria-label="مسیرهای سریع موبایل">
      {mobileQuickRoutes.map((route, index) => (
        <Link
          key={route.key}
          href={route.href}
          className="flex shrink-0 items-center gap-2 rounded-sm border border-border bg-card px-4 py-2.5 text-xs font-bold"
        >
          <span className="font-mono text-[9px] text-champagne">{String(index + 1).padStart(2, "0")}</span>
          {route.label}
          <ArrowLeft className="size-3.5 text-champagne" />
        </Link>
      ))}
    </nav>
  );
}
