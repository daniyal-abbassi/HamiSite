/**
 * Home page content — ported from the luxury reference
 * (docs/inspires/HamiHamrah-DNA-Brand-Color/.../client/src/lib/*).
 * Media-dependent fields are intentionally absent: every 22 reference assets
 * are missing (MISSING-ASSETS.md), so visuals are CSS compositions until the
 * real brand media is supplied.
 */

import { toFaDigits } from "@/lib/utils";

/** Header marquee — real, confirmed facts only (no fabricated stats). */
/* T090: `tickerItems` is deleted. The credential band renders the brand marks from
   `partnerMarks`, and these five strings — a restatement of the trust claims with no
   source of their own — were asserted by nothing and rendered by nothing. */

export const featuredTabs = [
  { key: "newest", label: "جدیدترین‌ها", badge: "NEW" },
  { key: "special", label: "پیشنهاد ویژه", badge: "SPECIAL OFFER" },
] as const;

export type FeaturedTabKey = (typeof featuredTabs)[number]["key"];

export const trustFeatures = [
  { key: "store", title: "فروش حضوری", description: "تجربه خرید حضوری از فروشگاه حامی همراه" },
  { key: "wholesale", title: "پخش عمده", description: "تأمین عمده برای همکاران" },
  { key: "assortment", title: "تنوع محصولات", description: "موبایل، لوازم جانبی و محصولات دیجیتال" },
  { key: "assurance", title: "خرید مطمئن", description: "گارانتی ۱۸ ماهه شرکتی و تجربه خریدی روشن" },
] as const;

export type TrustFeatureKey = (typeof trustFeatures)[number]["key"];

export const mobileQuickRoutes = [
  { key: "shop", label: "فروشگاه", href: "/shop" },
  { key: "categories", label: "دسته‌بندی‌ها", href: "#categories" },
  { key: "partners", label: "همکاری", href: "#b2b" },
  { key: "store", label: "فروشگاه حضوری", href: "#store-experience" },
] as const;

/**
 * The only six catalogue category slugs the homepage is allowed to link to. Each
 * resolves through lib/shop-filters to a real id with products behind it; the drift
 * guard in tests/unit/brand-resolution.test.ts fails the build if that stops being true.
 */
export const categoryLinks = {
  mobile: `/categories/${encodeURIComponent("موبایل-و-تبلت")}`,
  audio: `/categories/${encodeURIComponent("هدفون-ایرپاد-و-هندزفری")}`,
  charging: `/categories/${encodeURIComponent("آداپتور-کابل-و-شارژر")}`,
  power: `/categories/${encodeURIComponent("پاور-بانک")}`,
  watch: `/categories/${encodeURIComponent("ساعت-و-مچ-بند-هوشمند")}`,
  services: `/categories/${encodeURIComponent("خدمات-آنلاین")}`,
} as const;

export const categoryMosaic = [
  { key: "mobile", number: "۰۱", title: "موبایل", eyebrow: "MOBILE / CORE", detail: "Apple · Samsung · Xiaomi · TCH", href: categoryLinks.mobile, icon: "smartphone", layout: "mobile" },
  { key: "audio", number: "۰۲", title: "ایرپاد و هدفون", eyebrow: "AUDIO / PERSONAL", detail: "AirPods · Headphones", href: categoryLinks.audio, icon: "headphones", layout: "audio" },
  { key: "charging", number: "۰۳", title: "شارژر و آداپتور", eyebrow: "POWER / ESSENTIAL", detail: "Adapters · Cables", href: categoryLinks.charging, icon: "plug", layout: "charging" },
  { key: "power", number: "۰۴", title: "پاوربانک", eyebrow: "POWER / READY", detail: "همیشه آماده", href: categoryLinks.power, icon: "battery", layout: "power" },
  { key: "watch", number: "۰۵", title: "ساعت هوشمند", eyebrow: "WATCH / CONNECTED", detail: "روزمره، دقیق، نزدیک", href: categoryLinks.watch, icon: "watch", layout: "watch" },
  { key: "services", number: "۰۶", title: "خدمات آنلاین", eyebrow: "DIGITAL / ONLINE", detail: "Apple ID", href: categoryLinks.services, icon: "globe", layout: "services" },
] as const;

export const brandStories = [
  {
    key: "apple",
    name: "APPLE",
    slug: "اپل",
    title: "مینیمال، دقیق، بی‌حاشیه.",
    text: "روایتی آرام از متریال و طراحی خالص.",
    href: `/brands/${encodeURIComponent("اپل")}`,
  },
  {
    key: "samsung",
    name: "SAMSUNG",
    slug: "سامسونگ",
    title: "قدرتی که با جزئیات دیده می‌شود.",
    text: "قابلیت، حضور بصری و انتخابی گسترده‌تر.",
    href: `/brands/${encodeURIComponent("سامسونگ")}`,
  },
  {
    key: "xiaomi",
    name: "XIAOMI",
    slug: "شیائومی",
    title: "فناوری پویا، با انتخابی روشن.",
    text: "نگاه معاصر، کارایی دقیق، ریتمی فعال‌تر.",
    href: `/brands/${encodeURIComponent("شیائومی")}`,
  },
] as const;

export type BrandStoryKey = (typeof brandStories)[number]["key"];
export type BrandStory = (typeof brandStories)[number];

/** Keyed by the same Latin display name `partnerMarks` uses, so a row can find its story. */
export const brandStoriesByName: Readonly<Record<string, BrandStory>> = Object.fromEntries(
  brandStories.map((story) => [story.name, story]),
);

export type BrandRow = {
  name: string;
  label: string;
  ordinal: string;
  slug: string;
  href: string;
  detailId: string;
  hasStory: boolean;
  countLabel: string | null;
  linkLabel: string;
  expandLabel: string;
  collapseLabel: string;
};

/**
 * Everything a brand row needs, computed once and away from the DOM.
 *
 * The row's destination and its assistive names are decided here rather than inlined in
 * JSX, so "can every shopper reach this brand in one action" is a question a unit test can
 * answer — see `tests/unit/brand-reachability.test.ts`. A row whose brand does not resolve
 * gets no `href`, and the component renders it as a name rather than as a link that would
 * silently list the whole catalogue.
 */
export function buildBrandRows(
  marks: ReadonlyArray<{ name: string; label: string }>,
  counts: Record<string, number>,
): BrandRow[] {
  return marks.map((mark, position) => {
    const slug = brandSlugByName[mark.name] ?? "";
    const count = counts[mark.name] ?? 0;
    return {
      name: mark.name,
      label: mark.label,
      ordinal: toFaDigits(String(position + 1).padStart(2, "0")),
      slug,
      href: slug ? brandHref(slug) : "",
      detailId: `brand-detail-${mark.name.toLowerCase()}`,
      hasStory: Boolean(brandStoriesByName[mark.name]),
      countLabel: count ? `${toFaDigits(count)} محصول` : null,
      linkLabel: `محصولات ${mark.label}`,
      expandLabel: `دیدن جزئیات ${mark.label}`,
      collapseLabel: `بستن جزئیات ${mark.label}`,
    };
  });
}

export const brandWall: ReadonlyArray<{ name: string; slug: string; story?: BrandStoryKey }> = [
  // `slug` is the brand's own slug in the catalogue export, not a transliteration of
  // `name`. Most catalogue brands are Persian-only (`اپل`, `تی-سی-اچ`), so a Latin
  // display name gives no usable hint — the earlier hand-written `?brand=apple` links
  // matched nothing and silently returned the whole catalogue. `tests/unit/brand-resolution.test.ts`
  // fails if any slug here stops existing in the catalogue.
  { name: "APPLE", slug: "اپل", story: "apple" },
  { name: "SAMSUNG", slug: "سامسونگ", story: "samsung" },
  { name: "XIAOMI", slug: "شیائومی", story: "xiaomi" },
  { name: "NOKIA", slug: "نوکیا" },
  { name: "REALME", slug: "ریلمی" },
  { name: "TCH", slug: "تی-سی-اچ" },
  { name: "VOCAL", slug: "وکال" },
  { name: "NEXA", slug: "نکسا-nexa" },
  { name: "OAK", slug: "اوآک-oak" },
];

/** The single way a brand destination is built, so no link is ever hand-spelled again. */
/**
 * A brand's dedicated destination (FR-029). Used to be a `/shop?brand=` filter link,
 * which is why a brand had no place to say what it contains — and why three
 * category vocabularies could each claim to be the phones.
 */
export const brandHref = (slug: string) => `/brands/${encodeURIComponent(slug)}`;

/** Display name → catalogue slug. Rows and wall draw from here, never from a literal. */
export const brandSlugByName: Readonly<Record<string, string>> = Object.fromEntries(
  brandWall.map((brand) => [brand.name, brand.slug]),
);

export const b2bFeatures = [
  { title: "قیمت همکاری", description: "Pricing مخصوص همکاران" },
  { title: "موجودی به‌روز", description: "اطلاع از موجودی پیش از سفارش" },
  { title: "تنوع کالا", description: "موبایل و لوازم جانبی در یک مجموعه" },
  { title: "سفارش آسان", description: "فرآیند ساده و سریع سفارش" },
] as const;

export const b2bWorkflow = [
  { index: "۰۱", title: "ثبت‌نام", description: "اطلاعات همکاری را ثبت می‌کنید." },
  { index: "۰۲", title: "تأیید", description: "حساب همکاری بررسی و فعال می‌شود." },
  { index: "۰۳", title: "سفارش", description: "دسترسی همکاری برای سفارش آماده می‌شود." },
] as const;

export const b2bSupplyAreas = ["موبایل", "لوازم جانبی", "چندبرندی", "همکاری مستمر"] as const;

// `اسپیکر و Party Box` was removed here too: its category (`اسپیکر-پارتی-باکس`) has zero
// products, so the row would only ever lead to an empty listing.
export const accessoryCategories = [
  { key: "audio", index: "۰۱", label: "AUDIO", title: "صدا", detail: "ایرباد و هدفون", href: categoryLinks.audio },
  { key: "power", index: "۰۲", label: "POWER", title: "توان", detail: "پاوربانک", href: categoryLinks.power },
  { key: "charging", index: "۰۳", label: "CHARGING", title: "شارژ", detail: "آداپتور و کابل", href: categoryLinks.charging },
  { key: "wearables", index: "۰۴", label: "WEARABLES", title: "پوشیدنی", detail: "ساعت هوشمند", href: categoryLinks.watch },
] as const;

export type AccessoryCategoryKey = (typeof accessoryCategories)[number]["key"];

export const featuredOnlineService = {
  key: "apple-id",
  index: "۰۱",
  label: "APPLE ID",
  title: "Apple ID",
  description: "ساخت و آماده‌سازی Apple ID برای نیازهای دیجیتال شما.",
  status: "ONLINE SERVICE",
  trustCopy: "فرآیند ساده، شفاف و قابل پیگیری.",
  href: categoryLinks.services,
} as const;

export const onlineServiceFaqs = [
  { question: "Apple ID چیست؟", answer: "حسابی برای استفاده از برخی سرویس‌های Apple است؛ جزئیات موردنیاز پیش از ثبت درخواست شفاف می‌شود." },
  { question: "برای دریافت خدمت چه اطلاعاتی لازم است؟", answer: "پیش از شروع، اطلاعات لازم متناسب با درخواست شما روشن و با شما هماهنگ می‌شود." },
  { question: "خدمت چگونه پیگیری می‌شود؟", answer: "مسیر انجام خدمت و روش پیگیری، پیش از آغاز درخواست به‌صورت شفاف مشخص می‌شود." },
] as const;

export const whyHamiProofs = [
  {
    key: "store",
    eyebrow: "PHYSICAL STORE",
    title: "حضوری هم کنار شما هستیم.",
    description: "برای دیدن محصولات و دریافت راهنمایی، مسیر حضوری نیز در کنار تجربه آنلاین در دسترس است.",
    media: "store-photo-pending",
    mediaNote: "",
    href: "#store-experience",
    cta: "اطلاعات فروشگاه",
  },
  {
    key: "assurance",
    eyebrow: "CURATED CHOICE",
    title: "انتخاب با اطمینان.",
    description: "تمرکز ما روی ارائه محصول معتبر و تجربه خریدی است که جزئیات آن روشن باشد.",
    media: "product-composition",
    mediaNote: "محصولات منتخب، با نگاه دقیق‌تر.",
    href: "#featured",
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
] as const;

export const whyHamiQuote = "اعتماد، چیزی نیست که نوشته شود؛ تجربه‌ای است که ساخته می‌شود.";

export const whyHamiTrustStrip = ["فروش حضوری", "فروش آنلاین", "پخش عمده", "خدمات دیجیتال", "چندبرندی"] as const;

export const storeExperiencePoints = [
  { index: "۰۱", title: "مشاهده و انتخاب", description: "محصول را ببینید، مقایسه کنید و انتخاب کنید." },
  { index: "۰۲", title: "مشاوره تخصصی", description: "پیش از خرید، انتخاب مناسب خودتان را پیدا کنید." },
  { index: "۰۳", title: "پشتیبانی پس از خرید", description: "همراه شما بعد از خرید." },
] as const;

export const storeExperienceSlots = [
  { key: "product-interaction", label: "تعامل با محصول", intendedUse: "انتخاب محصول یا گفت‌وگوی طبیعی مشاوره" },
  { key: "store-detail", label: "جزئیات فروشگاه", intendedUse: "بسته‌بندی، میز فروش یا نشانهٔ بصری مجموعه" },
] as const;

export const storeExperienceStatement = "از صفحه نمایش تا فروشگاه، همراه شما هستیم.";

export const customerContentNote = {
  message: "محتوای تجربه مشتریان پس از دریافت اجازه و تأیید منبع منتشر می‌شود.",
  helper: "برای نمایش نظر، عکس یا محتوای اجتماعی، منبع و رضایت صاحب محتوا لازم است.",
} as const;

export const customerJourney = ["انتخاب", "مشاوره", "خرید", "همراهی"] as const;

export const customerTrustSignals = [
  { label: "فروش حضوری", href: "#store-experience" },
  { label: "فروش آنلاین", href: "/shop" },
  { label: "پشتیبانی", href: "#store-experience" },
  { label: "همکاری عمده", href: "#b2b" },
  { label: "تنوع برند", href: "#brands" },
] as const;

export const finalConversionCopy = {
  eyebrow: "HAMI HAMRAH / FINAL NOTE",
  titleLead: "همراه شما",
  titleTail: "از انتخاب تا تجربه.",
  subtitle: "خرید آنلاین، فروش حضوری و همکاری حرفه‌ای؛ همه در یک مجموعه.",
} as const;
