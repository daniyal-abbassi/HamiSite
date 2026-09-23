import Link from "next/link";
import Image from "next/image";
import { Phone } from "lucide-react";
import { categoryLinks } from "@/lib/content/home";
import { storeContact } from "@/lib/content/contact";
import { storeWarranty } from "@/lib/content/verified-facts";
import hamiMark from "@/public/brand/hami-mark.png";

const footerGroups = [
  {
    title: "فروشگاه",
    links: [
      { href: "/shop", label: "همه محصولات" },
      { href: categoryLinks.mobile, label: "موبایل" },
      { href: categoryLinks.audio, label: "ایرپاد و هدفون" },
      { href: categoryLinks.watch, label: "ساعت هوشمند" },
    ],
  },
  {
    title: "حامی همراه",
    links: [
      { href: "/partners", label: "همکاری عمده (B2B)" },
      /*
       * Both used to point at routes that were never built — `/about` and
       * `/contact` — so the footer, on every page, shipped two 404s. Neither is
       * an invented page now: «درباره ما» is the store-experience section that
       * already carries the twenty-years and Mashhad facts, and «تماس با ما» is
       * the one verified contact channel there is. (FR-007 forbids an address or
       * email until the merchant supplies one, so a /contact page would have
       * nothing honest to hold.)
       */
      { href: "/#store-experience", label: "درباره ما" },
      { href: storeContact.phoneHref, label: "تماس با ما" },
    ],
  },
  {
    title: "حساب کاربری",
    links: [
      { href: "/login", label: "ورود" },
      { href: "/register", label: "ثبت‌نام" },
      { href: "/orders", label: "سفارش‌های من" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      /* The bottom padding clears the fixed MobileDock. It used to live on
         <main>, which does not contain this element — so at full scroll the
         footer's last 58px sat under the dock regardless. 5.25rem is the
         dock's measured 58px plus 26px of breathing room, and the inset matches
         the one the dock itself adds on notched devices. */
      className="site-footer relative z-[2] mt-20 border-t border-line bg-ink-2/60 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-0"
    >
      <div className="brand-hairline" />
      {/* Mobile rhythm is tighter than desktop's: this block measured 804px on a
          390px screen — for ten links. py-16/gap-10 is a desktop cadence and it
          costs a full screen of scrolling on a phone. */}
      <div className="container grid gap-7 py-10 md:gap-10 md:py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-3">
            <Image src={hamiMark} alt="حامی همراه" sizes="40px" className="size-10 rounded-xl bg-gradient-to-br from-[#FFFDF9] to-[#E5D3B3] p-1 ring-1 ring-champagne/40 shadow-sm" />
            <span className="text-base font-black text-foreground">
              حامی همراه
              <span className="block font-mono text-xs font-medium text-champagne/80">
                فروشگاه و پخش تلفن همراه — مشهد
              </span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-[13px] leading-7 text-muted-foreground">
            فروش و پخش تلفن همراه، ساعت‌های هوشمند و اکسسوری در مشهد؛ با {storeWarranty.label}.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-champagne/20 bg-champagne/5 px-2.5 py-1 font-mono text-xs text-champagne">
              ۲۰ سال سابقه در بازار مشهد
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-champagne/20 bg-champagne/5 px-2.5 py-1 font-mono text-xs text-champagne">
              {storeWarranty.label}
            </span>
          </div>
          {/* The store's confirmed phone number (lib/content/contact.ts is the
              single source of truth). Dialable on mobile, visible on desktop —
              a real contact fact instead of a dead /contact route. */}
          <a
            href={storeContact.phoneHref}
            dir="ltr"
            className="mt-4 inline-flex items-center gap-2 font-mono text-sm font-bold text-foreground/85 transition-colors hover:text-champagne"
          >
            <Phone className="size-4 text-champagne" aria-hidden="true" />
            {storeContact.phoneDisplay}
          </a>
        </div>

        {/* Two columns on a phone, one per column from md.
            Accordions were the obvious move and are the wrong one here: there
            are ten links in total, and collapsing them puts a tap in front of
            every single one to save height that a second column saves for free.
            Accordions earn their keep on a footer with forty links, not ten. */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 md:contents">
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="m-0 font-mono text-xs font-medium tracking-[0.04em] text-aqua">
                {group.title}
              </h3>
              {/* No space-y on mobile: the rows carry their own 44px height, so
                  extra margin would only spread ten links back over a screen. */}
              <ul className="mt-1 list-none p-0 md:mt-4 md:space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="flex min-h-11 items-center text-[13.5px] text-muted-foreground/85 transition-colors hover:text-foreground md:block md:min-h-0"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Oversized outlined wordmark — presence without ink. Decorative only,
          so it is hidden from assistive tech and cannot be selected. */}
      <div className="flex select-none justify-center overflow-hidden py-3 md:py-6" aria-hidden="true">
        <span className="text-stroke whitespace-nowrap text-[15vw] font-black leading-none tracking-tighter">
          حامی همراه
        </span>
      </div>

      <div className="border-t border-line">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-[12.5px] text-muted-foreground/45 sm:flex-row">
          <p className="m-0">© ۱۴۰۵ حامی همراه — تمامی حقوق محفوظ است.</p>
          <p className="m-0">مشهد</p>
        </div>
      </div>
    </footer>
  );
}
