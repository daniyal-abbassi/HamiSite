import { Store } from "lucide-react";

/**
 * The hero's shop window — a framed opening that holds a real photograph of
 * the Mashhad store once one exists.
 *
 * Until then it renders as an empty lit window rather than a grey box: frame,
 * mullions, sill and a warm spill of light from inside. It follows the
 * `.store-slot` convention already used in StoreExperience, where a pending
 * photograph is shown as deliberate architecture instead of a placeholder
 * rectangle — the section still reads as designed while the asset is missing.
 *
 * To use the real photo: drop it in and replace the inner grid with an
 * <Image fill className="object-cover" />; the frame, mullions and sill stay.
 */
export function ShopWindow() {
  return (
    <div className="relative">
      {/* Light thrown onto the wall around the opening. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-8 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 45%, rgba(142, 10, 30, 0.28), transparent 70%)",
        }}
      />

      <div className="relative overflow-hidden border border-aqua/25 bg-ink-2 shadow-deep">
        {/* The opening itself. */}
        <div className="relative aspect-[4/5] w-full">
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(165deg, rgba(142, 10, 30, 0.34) 0%, rgba(100, 2, 17, 0.26) 45%, rgba(26, 10, 14, 0.9) 100%)",
            }}
          />

          {/* Mullions — two vertical bars and one horizontal, so the opening
              reads as a shopfront window and not as a picture frame. */}
          <div aria-hidden="true" className="absolute inset-0">
            <i className="absolute inset-y-0 left-1/3 w-px bg-aqua/20" />
            <i className="absolute inset-y-0 left-2/3 w-px bg-aqua/20" />
            <i className="absolute inset-x-0 top-[38%] h-px bg-aqua/20" />
          </div>

          {/* Pending-photo marker, in the same language as the store slots. */}
          <div className="absolute inset-0 grid place-items-center text-center">
            <div className="flex flex-col items-center gap-3 px-6">
              <Store className="size-8 text-aqua/70" strokeWidth={1.4} aria-hidden="true" />
              <span className="font-mono text-[10px] tracking-[0.16em] text-aqua/70">
                HAMI HAMRAH / MASHHAD
              </span>
              <b className="text-sm font-bold text-foreground/80">
                تصویر واقعی فروشگاه در انتظار افزودن
              </b>
              <span className="max-w-[15rem] text-[11px] leading-6 text-muted-foreground/75">
                نمای ویترین و فضای فروشگاه، پس از عکاسی در همین قاب قرار می‌گیرد.
              </span>
            </div>
          </div>

          {/* Glass sheen across the opening. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(115deg, rgba(226, 222, 219, 0.10) 0%, transparent 38%, transparent 62%, rgba(226, 222, 219, 0.05) 100%)",
            }}
          />
        </div>

        {/* Sill. */}
        <div className="flex items-center justify-between border-t border-aqua/20 bg-ink-3/70 px-5 py-3">
          <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground/70">
            SHOWROOM
          </span>
          <span className="text-[11px] text-foreground/70">فروش حضوری در مشهد</span>
        </div>
      </div>
    </div>
  );
}
