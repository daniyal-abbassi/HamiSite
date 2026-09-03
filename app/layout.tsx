import type { Metadata } from "next";
import { DM_Mono, Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-vazirmatn",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

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
 * glows (a 4-step burgundy scale, not a flat maroon fill), muted antique gold
 * accents (#C9A227 family — not the previous champagne-yellow), fully rounded
 * geometry (pills, 20-34px radii) and frosted glass surfaces (backdrop-blur +
 * gradient hairline border) throughout. Eyebrow pills and gold gradient-
 * shimmer text (one word per heading) are back — this world wants them.
 * STORY: a reseller/shop-owner lands, immediately reads this as a serious
 * live wholesale price source (not a retail storefront), and the primary
 * action is checking today's price list or applying to become a partner.
 * FIRST VIEWPORT: sticky glass nav → scrolling ticker → hero: eyebrow pill,
 * display headline with one gold gradient word, lead, two pill CTAs, trust
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
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

