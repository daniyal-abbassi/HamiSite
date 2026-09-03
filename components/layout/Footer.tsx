import Link from "next/link";
import Image from "next/image";
import hamiMark from "@/public/brand/hami-mark.png";

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
    <footer className="relative z-[2] mt-20 border-t border-line bg-ink-2/60">
      <div className="brand-hairline" />
      <div className="container grid gap-10 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <Image src={hamiMark} alt="" className="size-9 rounded-xl bg-white ring-1 ring-gold/45" />
            <span className="text-base font-black">
              حامی همراه
              <span className="block font-mono text-[11px] font-normal text-muted-foreground/60">
                پخش تلفن همراه — مشهد
              </span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-[13px] leading-7 text-muted-foreground/70">
            عرضه‌کننده تخصصی موبایل، ساعت هوشمند و اکسسوری — با تکیه بر اصالت کالا،
            شفافیت قیمت و پشتیبانی حرفه‌ای از خرید خرد و عمده.
          </p>
        </div>

        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h3 className="m-0 font-mono text-[11px] font-medium tracking-[0.04em] text-gold">
              {group.title}
            </h3>
            <ul className="mt-4 list-none space-y-2.5 p-0">
              {group.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-[13.5px] text-muted-foreground/85 transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
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
