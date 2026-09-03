import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/home/Reveal";
import hamiMark from "@/public/brand/hami-mark.png";

export function CampaignBanner() {
  return (
    <section id="campaign" className="wrap container py-6" aria-labelledby="campaign-title">
      <Reveal>
        <div
          className="relative overflow-hidden rounded-2xl border border-gold/20"
          style={{ background: "linear-gradient(160deg, #7D0417 0%, #640211 52%, #3A010A 100%)" }}
        >
          <div className="pointer-events-none absolute inset-x-[12%] bottom-[10%] h-[34%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.22),transparent_70%)] blur-2xl" />
          <div className="relative grid items-center gap-8 p-10 md:grid-cols-[1.2fr_0.8fr] md:p-14">
            <div>
              <h2 id="campaign-title" className="text-3xl font-black leading-[1.4] tracking-tight md:text-4xl">
                انتخابی که
                <span className="grad block">بهترین می‌ماند.</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-8 text-foreground/65">
                موبایل، لوازم جانبی و خدمات دیجیتال؛ در یک تجربهٔ متفاوت و دقیق.
              </p>
              <Button className="mt-6" size="lg" variant="oxblood">
                مشاهده محصولات <ArrowLeft />
              </Button>
            </div>
            <div className="relative hidden aspect-square max-w-xs place-items-center justify-self-end md:grid" aria-hidden="true">
              <i className="absolute inset-0 rounded-full border border-gold/25" />
              <i className="absolute inset-6 rounded-full border border-gold/15" />
              <Image src={hamiMark} alt="" className="relative size-24 rounded-2xl bg-white ring-1 ring-gold/45" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}