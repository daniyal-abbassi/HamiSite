export type WhyHamiProof = {
  key: "store" | "assurance" | "brands" | "b2b";
  eyebrow: string;
  title: string;
  description: string;
  media: "store-photo-pending" | "product-composition" | "brand-composition" | "b2b-route";
  mediaNote: string;
  href: "#contact" | "#products" | "#brands" | "#b2b";
  cta: string;
};

export const whyHamiProofs: WhyHamiProof[] = [
  {
    key: "store",
    eyebrow: "PHYSICAL STORE",
    title: "حضوری هم کنار شما هستیم.",
    description: "برای دیدن محصولات و دریافت راهنمایی، مسیر حضوری نیز در کنار تجربه آنلاین در دسترس است.",
    media: "store-photo-pending",
    mediaNote: "تصویر واقعی فروشگاه پس از دریافت، در همین قاب قرار می‌گیرد.",
    href: "#contact",
    cta: "اطلاعات فروشگاه",
  },
  {
    key: "assurance",
    eyebrow: "CURATED CHOICE",
    title: "انتخاب با اطمینان.",
    description: "تمرکز ما روی ارائه محصول معتبر و تجربه خریدی است که جزئیات آن روشن باشد.",
    media: "product-composition",
    mediaNote: "محصولات منتخب، با نگاه دقیق‌تر.",
    href: "#products",
    cta: "مشاهده محصولات",
  },
  {
    key: "brands",
    eyebrow: "MULTI-BRAND",
    title: "انتخاب محدود نیست.",
    description: "برندهای مختلف، در یک مقصد و در کنار نیازهای متفاوت شما قرار می‌گیرند.",
    media: "brand-composition",
    mediaNote: "چندبرندی، در یک تجربه منسجم.",
    href: "#brands",
    cta: "برندها را ببینید",
  },
  {
    key: "b2b",
    eyebrow: "FOR BUSINESS",
    title: "برای همکاران، فراتر از فروش.",
    description: "مسیر همکاری برای قیمت همکاری، تنوع محصول و ثبت سفارش کسب‌وکارها طراحی شده است.",
    media: "b2b-route",
    mediaNote: "یک مسیر روشن برای همکاری حرفه‌ای.",
    href: "#b2b",
    cta: "بخش همکاری",
  },
];

export const whyHamiQuote = "اعتماد، چیزی نیست که نوشته شود؛ تجربه‌ای است که ساخته می‌شود.";

export const whyHamiTrustStrip = ["فروش حضوری", "فروش آنلاین", "پخش عمده", "خدمات دیجیتال", "چندبرندی"] as const;

export const whyHamiCtas = [
  { kind: "primary", label: "حامی همراه را از نزدیک ببین", href: "#contact" as const },
  { kind: "secondary", label: "آشنایی بیشتر با ما", href: "#journey" as const },
] as const;
