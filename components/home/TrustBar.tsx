import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TrustGlyph } from "@/components/home/primitives";
import { Reveal } from "@/components/home/Reveal";
import { mobileQuickRoutes, trustFeatures } from "@/lib/content/home";

export function TrustBar() {
  return (
    <section id="trust-bar" className="wrap border-b border-line" aria-labelledby="trust-bar-title">
      <div className="container py-12">
        <h2 id="trust-bar-title" className="text-2xl font-black tracking-tight md:text-3xl">چهار دلیل برای اعتماد به حامی همراه</h2>
        <p className="mt-2 text-sm text-foreground/55">فروش حضوری، پخش عمده و اکوسیستم موبایل</p>
        <ul className="mt-8 grid list-none gap-8 p-0 sm:grid-cols-2 lg:grid-cols-4" role="list">
          {trustFeatures.map((feature, index) => (
            <li key={feature.key} className="flex items-start gap-4">
              <Reveal delay={index * 70} className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-aqua/35 text-aqua">
                  <TrustGlyph name={feature.key} />
                </span>
                <div>
                  <h3 className="m-0 text-base font-black">{feature.title}</h3>
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
