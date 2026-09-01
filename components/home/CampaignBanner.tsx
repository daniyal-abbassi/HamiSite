import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/home/Reveal";
import { toFaDigits } from "@/lib/utils";

export function CampaignBanner() {
  return (
    <section id="campaign" className="container py-6" aria-labelledby="campaign-title">
      <Reveal>
        <div className="hero-surface relative overflow-hidden rounded-sm border border-champagne/20">
          <div className="hero-glow" />
          <div className="relative grid items-center gap-8 p-10 md:grid-cols-[1.2fr_0.8fr] md:p-14">
            <div>
              <p className="m-0 flex items-center gap-2.5 text-[11px] font-bold text-foreground/70">
                <span className="font-mono text-champagne">{toFaDigits("05")}</span>
                <i className="h-px w-8 bg-champagne/60" aria-hidden="true" />
                THE NEW STANDARD
              </p>
              <h2 id="campaign-title" className="mt-4 text-3xl font-black leading-[1.4] tracking-tight md:text-4xl">
                انتخابی که
                <em className="block font-black not-italic text-champagne">بهترین می‌ماند.</em>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-8 text-foreground/65">
                موبایل، لوازم جانبی و خدمات دیجیتال؛ در یک تجربهٔ متفاوت و دقیق.
              </p>
              <Button className="mt-6" size="lg">
                مشاهده محصولات <ArrowLeft />
              </Button>
            </div>
            <div className="relative hidden aspect-square max-w-xs place-items-center justify-self-end md:grid" aria-hidden="true">
              <i className="absolute inset-0 rounded-full border border-champagne/25" />
              <i className="absolute inset-6 rounded-full border border-champagne/15" />
              <span className="font-mono text-6xl text-champagne/70">H</span>
              <span className="absolute -bottom-2 font-mono text-[9px] tracking-[0.14em] text-foreground/40">HAMI / CAMPAIGN 01</span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
