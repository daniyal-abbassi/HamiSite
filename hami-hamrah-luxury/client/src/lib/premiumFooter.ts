export const footerGroups = [
  {
    label: "فروشگاه",
    links: [
      { label: "مشاهده محصولات", href: "/shop" },
      { label: "موبایل", href: "/shop?category=mobile" },
      { label: "لوازم جانبی", href: "/shop?category=audio" },
      { label: "محصولات جدید", href: "#new-arrivals" },
      { label: "برندها", href: "#brands" },
    ],
  },
  {
    label: "خدمات",
    links: [
      { label: "Apple ID", href: "/shop?category=online-services" },
      { label: "خدمات آنلاین", href: "#online-services" },
      { label: "راهنمای انتخاب", href: "#journey" },
      { label: "اعتماد مشتری", href: "#customer-trust" },
    ],
  },
  {
    label: "همکاری",
    links: [
      { label: "همکاری با ما", href: "/partners" },
      { label: "پنل همکاران", href: "/partners/login" },
      { label: "مسیر همکاری", href: "#b2b" },
    ],
  },
  {
    label: "حامی همراه",
    links: [
      { label: "چرا حامی همراه", href: "#why-hami" },
      { label: "فروشگاه حضوری", href: "#store-experience" },
      { label: "تماس با ما", href: "#contact" },
    ],
  },
] as const;

export const footerContact = {
  phoneHref: "tel:05138000000",
  phoneLabel: "۰۵۱ ۳۸۰۰ ۰۰۰۰",
} as const;

export const footerMeta = {
  tagline: "اطمینان در هر انتخاب.",
  line: "Mobile • Accessories • Digital Services • Wholesale",
  copyright: "© 2026 Hami Hamrah. All rights reserved.",
  socialState: "awaiting-official-links",
} as const;
