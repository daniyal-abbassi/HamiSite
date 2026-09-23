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
 * THESIS: Hami Hamrah's wholesale portal proves itself as a live, transparent
 * command-center for reseller pricing — not a flat editorial brochure. Every
 * number (price, stock, discount tier) must read as alive and current.
 * OWN-WORLD: near-black ink canvas (#0D0406) with atmospheric oxblood-ramp
 * glows (a 4-step burgundy scale, not a flat maroon fill), muted antique aqua
 * accents (#C9A227 family — not the previous champagne-yellow), fully rounded
 * geometry (pills, 20-34px radii) and — until band 3's T074 — frosted glass surfaces (backdrop-blur +
 * gradient hairline border) throughout. Eyebrow pills and aqua gradient-
 * shimmer text (one word per heading) are back — this world wants them.
 * STORY: a reseller/shop-owner lands, immediately reads this as a serious
 * live wholesale price source (not a retail storefront), and the primary
 * action is checking today's price list or applying to become a partner.
 * FIRST VIEWPORT: sticky glass nav → scrolling ticker → hero: eyebrow pill,
 * display headline with one aqua gradient word, lead, two pill CTAs, trust
 * checklist, floating glass stat cards over a rotated phone silhouette.
 * FORM: user-pinned via a supplied reference file (aura-landingSample.html),
 * not derived from a discovery round — carries that catalog world's palette,
 * material, type, composition, and component grammar into the real product.
 * FINISH: unreviewed and undocumented is unfinished — this build ends with
 * typecheck, the design-hook detector, a dev-server render check, and
 * DESIGN.md rewritten from the built world, ground truth over intention.
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

