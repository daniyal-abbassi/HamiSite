import { trustFacts, storeWarranty } from "@/lib/content/verified-facts";

/**
 * The hero's shop window.
 *
 * It used to hold a photograph of the Mashhad store — specifically an AI re-lit
 * derivative of the owner's own shot (the chain is documented in `public/store/`:
 * shop-original → shop-upright → shop-ai-relight → shop-hero-master → shop.jpg),
 * badged "MASHHAD FLAGSHIP" and "SHOWROOM" and captioned with the brands it was
 * given lightboxes for. FR-006 forbids store imagery as proof and the owner
 * confirmed no store photography is coming, so an altered image presented as the
 * real premises was the most expensive kind of claim on the page. Owner's
 * decision, 2026-09-23: removed everywhere.
 *
 * What fills the frame now is what the business can actually stand behind: the
 * four trust facts FR-006 admits and the confirmed warranty, with no implied
 * certificate, no invented interior and no photograph. T075 in band 3 owns
 * recomposing this column; until then the panel is deliberately quiet.
 */
export function ShopWindow() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-3xl border border-champagne/30 bg-ink-2/90 p-8 shadow-monolith ring-1 ring-champagne/15">
        <span className="font-mono text-xs font-bold tracking-[0.16em] text-champagne">
          HAMI HAMRAH / MASHHAD
        </span>
        <ul className="m-0 mt-6 flex list-none flex-col gap-4 p-0">
          {trustFacts.map((fact) => (
            <li key={fact.key} className="flex items-start gap-3 text-sm leading-7 text-foreground/85">
              <i className="mt-3 inline-block size-1.5 shrink-0 rounded-full bg-champagne" aria-hidden="true" />
              {fact.label}
            </li>
          ))}
        </ul>
        <div className="mt-8 border-t border-champagne/20 pt-5">
          <span className="block font-mono text-xs tracking-[0.16em] text-champagne/80">WARRANTY</span>
          <span className="mt-1.5 block text-[15px] font-bold text-foreground">{storeWarranty.label}</span>
        </div>
      </div>
    </div>
  );
}
