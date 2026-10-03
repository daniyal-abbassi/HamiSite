import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * Viewport and phone-browser chrome.
 *
 * `viewportFit: "cover"` is the load-bearing one. Several places already pad
 * themselves with `env(safe-area-inset-bottom)` — the mobile dock and the
 * footer's clearance above it — and **without `viewport-fit=cover` those env
 * variables resolve to 0**, so that padding was doing nothing on exactly the
 * notched devices it was written for. Setting it here is what switches the
 * safe-area handling on.
 *
 * `themeColor` matches the top of the body gradient, so the browser's status
 * bar continues the page instead of framing it in white.
 *
 * There is deliberately no `maximumScale` or `userScalable: false`. Blocking
 * pinch-zoom is an accessibility failure, and it is not a price worth paying to
 * stop an occasional input from zooming — the fix for that is 16px fields,
 * which is handled directly.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#6A0F1E",
};

export const metadata: Metadata = {
  title: {
    default: "حامی همراه | فروشگاه موبایل و اکسسوری",
    template: "%s | حامی همراه",
  },
  description:
    "فروشگاه حامی همراه — عرضه موبایل، ساعت هوشمند و اکسسوری؛ پشتیبانی از خرید خرد و عمده (B2B).",
};

/**
 * DIRECTION CONTRACT — read this before touching visual code.
 *
 * **Rewritten 2026-09-24.** The previous version of this block was written before band 3 and described a
 * world that band 3 then deleted: an "oxblood-ramp glow" field (T073 removed it — five body glows, the
 * per-section lamps, the fixed scrim and a 20-point starfield), "frosted glass surfaces throughout" (T074
 * replaced the site-wide `backdrop-filter` treatment; 40 blurred elements on the homepage → 0), "aqua
 * gradient-shimmer text … this world wants them" (T072 deleted gradient text; 7 instances → 0), a "scrolling
 * ticker" and "floating glass stat cards over a rotated phone silhouette" (the ticker data was unreachable,
 * `CardSwap` and `TrustBar` are deleted), and accents from a "#C9A227 family — not the previous
 * champagne-yellow", which was never shipped: the token has always been `#E5D3B3`, champagne. Its thesis
 * also called this a **wholesale portal for reseller pricing, "not a retail storefront"**, and demanded every
 * number "read as alive and current" — the opposite of what the site is and the opposite of what the catalog
 * can prove (5 of 189 records are purchasable and none carries a live price).
 *
 * A file that `CLAUDE.md` points every new agent to first was describing a design that no longer exists.
 * That is the bug this rewrite fixes; the specifics below are the current truth, each one traceable to the
 * task that made it.
 *
 * THESIS: a 20-year phone shop and wholesaler in Mashhad, presented to the person who walks into it. Retail
 * first; B2B is one chapter of the page, not its purpose. The store cannot publish live stock or prices, so
 * the promise the design carries is that **a person quotes you** — which is what the hero, the phone number
 * and `lib/content/verified-facts.ts` exist to say. Nothing on screen may assert what the shop has not
 * confirmed (Constitution I, and it outranks everything below).
 *
 * OWN-WORLD: near-black obsidian canvas (`#0B0204`) with one champagne/gold accent scale (#E5D3B3, declared
 * once in `tailwind.config.ts` as `champagneScale`; `aqua` and `brass` are aliases kept for call sites, not
 * three colours) and burgundy RAL 3004 as the brand's other voice. Rounded geometry and pill CTAs stay.
 * Depth comes from **scale, whitespace, hairlines and the ground** — not from glow, blur or gradient text.
 *
 * GROUND: the page has a travelling ground and it is now the main source of atmosphere.
 *  - `/` — six stages, scroll-linked, in `lib/atmosphere/progression.ts`: warmth → goods → shelves → ink at
 *    the trade chapter → ember at the physical store → the deepest tone at the close. Travel is carried by
 *    hue and chroma at near-constant lightness, because lightness is the one axis a dark ground cannot
 *    spend without paying in contrast (worst point 5.59:1).
 *  - two **paper chapters** (`#categories`, `#online-services`) paint opaque ivory `#f4f1ea` with their own
 *    inverted foreground — the contrast the owner asked for on 2026-09-24.
 *  - interior shopper routes take one settled tone each, borrowed from the homepage chapter they belong to;
 *    `/admin` gets no ground layer at all.
 *
 * FIRST VIEWPORT at 360×800, measured: eyebrow 120, headline 167, lead 309, both CTAs 429, trust row
 * 501–540, the shop's own photograph beginning at 572. Merchandise is below the fold (1,640) and that is the
 * open item (T085), not the intent.
 *
 * FORM: pinned by the owner from a supplied reference, then corrected twice by the owner's own eye on the
 * built page — first "the same colour all along", then "wayyy too boring, use white somewhere". Both
 * produced requirements changes, recorded in `specs/002-scroll-atmosphere/spec.md`'s Amendment Record.
 *
 * FINISH: unreviewed and undocumented is unfinished — typecheck, the unit guards, a dev-server render check
 * **at the painted pixel, not in computed styles**, and `notes/findings.md` rewritten from what was
 * measured. A check that passes both with and without the fix is not a check (see
 * `notes/parallel-agent-plan.md` §5.1).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* Fonts are self-hosted (see globals.css @font-face) — the font variables
       live on :root there, so no next/font className is needed here. */
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}

