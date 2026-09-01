import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, PackageCheck } from "lucide-react";
import { SectionLabel } from "@/components/home/primitives";
import { Reveal } from "@/components/home/Reveal";
import { b2bFeatures, b2bSupplyAreas, b2bWorkflow } from "@/lib/content/home";

export function B2bSection() {
  return (
    <section id="b2b" className="container py-20" aria-labelledby="b2b-title">
      <Reveal>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionLabel index="۰۰۸">WHOLESALE / B2B</SectionLabel>
            <h2 id="b2b-title" className="mt-4 text-3xl font-black leading-[1.45] tracking-tight md:text-4xl md:leading-[1.45]">
              برای همکاران،
              <em className="block font-black not-italic text-champagne">فراتر از فروش.</em>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-8 text-foreground/65">
              مسیر همکاری برای قیمت همکاری، تنوع محصول و ثبت سفارش کسب‌وکارها طراحی شده است؛
              از ثبت‌نام تا سفارش، در سه گام روشن.
            </p>
            <div className="mt-6 flex flex-wrap gap-2" aria-label="حوزه‌های تأمین">
              {b2bSupplyAreas.map((area) => (
                <span key={area} className="rounded-sm border border-champagne/35 bg-champagne/5 px-3 py-1.5 text-[11px] font-bold text-champagne">
                  {area}
                </span>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/partners/login"
                className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-champagne-light"
              >
                ورود به پنل همکاری <ArrowUpLeft className="size-4" />
              </Link>
              <Link
                href="/partners"
                className="inline-flex items-center gap-1.5 rounded-sm border border-champagne/50 px-5 py-2.5 text-sm font-bold text-champagne transition-colors hover:bg-champagne/10"
              >
                ثبت‌نام همکار <ArrowLeft className="size-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {b2bFeatures.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 70}>
                <article className="h-full rounded-sm border border-border bg-card p-5 shadow-card">
                  <PackageCheck className="size-5 text-champagne" strokeWidth={1.5} aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-extrabold">{feature.title}</h3>
                  <p className="mt-1 text-xs leading-6 text-foreground/55">{feature.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <ol className="mt-12 grid list-none gap-6 border-t border-border p-0 pt-10 sm:grid-cols-3" aria-label="فرآیند همکاری">
          {b2bWorkflow.map((step) => (
            <li key={step.index} className="flex items-start gap-4">
              <span className="font-mono text-2xl font-medium text-champagne/80">{step.index}</span>
              <div>
                <h3 className="m-0 text-sm font-extrabold">{step.title}</h3>
                <p className="mt-1 text-xs leading-6 text-foreground/55">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
