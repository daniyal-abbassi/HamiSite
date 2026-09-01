import Link from "next/link";

const footerGroups = [
  {
    title: "فروشگاه",
    links: [
      { href: "/shop", label: "همه محصولات" },
      { href: "/shop?category=mobile", label: "موبایل" },
      { href: "/shop?category=headphones", label: "ایرپاد و هدفون" },
      { href: "/shop?category=smartwatch", label: "ساعت هوشمند" },
    ],
  },
  {
    title: "حامی همراه",
    links: [
      { href: "/partners", label: "همکاری عمده (B2B)" },
      { href: "/about", label: "درباره ما" },
      { href: "/contact", label: "تماس با ما" },
    ],
  },
  {
    title: "حساب کاربری",
    links: [
      { href: "/login", label: "ورود" },
      { href: "/register", label: "ثبت‌نام" },
      { href: "/my-orders", label: "سفارش‌های من" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-wine-ink text-[#fffaf2]">
      <div className="brand-hairline" />
      <div className="container grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-sm border border-champagne/40 font-mono text-sm text-champagne">
              H
            </span>
            <span className="text-base font-black">
              حامی همراه
              <span className="block font-mono text-[9px] font-normal tracking-[0.14em] text-[#fffaf2]/40">
                HAMI HAMRAH
              </span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-[13px] leading-7 text-[#fffaf2]/60">
            عرضه‌کننده تخصصی موبایل، ساعت هوشمند و اکسسوری — با تکیه بر اصالت کالا،
            شفافیت قیمت و پشتیبانی حرفه‌ای از خرید خرد و عمده.
          </p>
        </div>

        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h3 className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-champagne">
              {group.title}
            </h3>
            <ul className="mt-4 list-none space-y-2.5 p-0">
              {group.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-[#fffaf2]/70 transition-colors hover:text-champagne"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-[#fffaf2]/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-[11px] text-[#fffaf2]/45 sm:flex-row">
          <p className="m-0">© ۱۴۰۵ حامی همراه — تمامی حقوق محفوظ است.</p>
          <p className="m-0 font-mono tracking-[0.06em]">EST. TEHRAN — MOBILE &amp; ACCESSORIES</p>
        </div>
      </div>
    </footer>
  );
}
