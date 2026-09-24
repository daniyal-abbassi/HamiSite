import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { storeWarranty } from "@/lib/content/verified-facts";
import { buttonVariants } from "@/components/ui/button";
import { TrustGlyph } from "@/components/home/primitives";
import { trustFeatures } from "@/lib/content/home";

/**
 * The trust section, cut down to the four things the business can name.
 *
 * This used to be **3,603px at 360 — 22% of the whole homepage** — three merged sections arguing one point
 * in four voices. What was in it:
 *
 *  - a `<blockquote>` holding `whyHamiQuote`, which is the shop's own slogan. A quote with no speaker is a
 *    testimonial shape, under a heading that reads «اعتماد، با واقعیت ساخته می‌شود» — trust is built with
 *    reality. The shape was claiming a customer voice the shop does not have.
 *  - `customerContentNote`, telling shoppers in prose that customer content "will be published after
 *    permission and source verification". An internal to-do rendered as UI — and the second place on this
 *    page where the site apologised for something it lacks (see `WhyHami`'s deleted «تصویر واقعی فروشگاه در
 *    انتظار افزودن»).
 *  - `WhyHamiProofs`: four cards of typographic composition standing in for photography, laid out in mono
 *    as "CURATED PRODUCTS / SELECTED WITH CARE", "MULTI / BRAND", "PARTNER ROUTE". Not a false claim about
 *    the business, but a section named *proofs* whose evidence is decorative text, and it took most of the
 *    section's height.
 *  - `customerJourney` (انتخاب → مشاوره → خرید → همراهی) and `customerTrustSignals`: five chips linking to
 *    `#store-experience`, `#b2b`, `#brands`, `#featured` — a table of contents placed *after* the chapters it
 *    points at, on a page the shopper has already scrolled end to end.
 *
 * Kept: the four capabilities — in-person, wholesale, range, the 18-month company warranty — the warranty
 * itself, and one way into the shop. `id="trust"` stays because `lib/atmosphere/progression.ts` anchors a
 * ground stage to it and a drift guard compares the section order against the rendered page.
 *
 * FR-008 is the rule doing the work: a place with nothing true to say stays empty. This section has four
 * true things to say, so now it is four things long.
 */
export function TrustBento() {
  return (
    <section id="trust" className="wrap py-16 md:py-20" aria-labelledby="trust-title">
      <div className="px-4">
        <Reveal>
          <div className="container mx-auto max-w-2xl text-center">
            <span className="eyebrow"><i /> چرا حامی همراه</span>
            <h2 id="trust-title" className="mt-4 text-3xl font-black tracking-normal md:text-5xl">
              اعتماد، با <span className="emphasis">واقعیت</span> ساخته می‌شود.
            </h2>
            <p className="mt-4 text-sm leading-8 text-foreground/60">
              چهار چیزی که درباره حامی همراه دقیق است؛ بقیه را در فروشگاه بپرسید.
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <ul className="mx-auto mt-10 grid max-w-3xl list-none gap-x-6 gap-y-7 p-0 sm:grid-cols-2" role="list">
            {trustFeatures.map((feature) => (
              <li key={feature.key} className="flex items-start gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-champagne/35 bg-champagne/5 text-champagne">
                  <TrustGlyph name={feature.key} />
                </span>
                <div>
                  <h3 className="m-0 text-base font-black">{feature.title}</h3>
                  <p className="mt-1 text-[13px] leading-7 text-foreground/65">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={140}>
          <div className="mx-auto mt-10 flex max-w-3xl flex-col items-start gap-4 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0 flex items-center gap-2 text-sm text-foreground/75">
              <BadgeCheck className="size-4 shrink-0 text-champagne" aria-hidden="true" />
              {storeWarranty.label}
            </p>
            {/* The champagne fill is the money CTA, so it goes through the Button system rather than a
                hand-rolled pill. Its label is the same string the hero's primary action uses — one verb
                for one destination. */}
            <Link href="/shop" className={buttonVariants({ variant: "default" })}>
              مشاهده محصولات
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
