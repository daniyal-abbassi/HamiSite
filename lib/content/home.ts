/**
 * Home page content — ported from the luxury reference
 * (docs/inspires/HamiHamrah-DNA-Brand-Color/.../client/src/lib/*).
 * Media-dependent fields are intentionally absent: every 22 reference assets
 * are missing (MISSING-ASSETS.md), so visuals are CSS compositions until the
 * real brand media is supplied.
 */

export const featuredTabs = [
  { key: "newest", label: "جدیدترین‌ها", badge: "NEW" },
  { key: "special", label: "پیشنهاد ویژه", badge: "SPECIAL OFFER" },
] as const;

export type FeaturedTabKey = (typeof featuredTabs)[number]["key"];

export const trustFeatures = [
  { key: "store", title: "فروش حضوری", description: "تجربه خرید حضوری از فروشگاه حامی همراه" },
  { key: "wholesale", title: "پخش عمده", description: "قیمت و تأمین ویژه برای همکاران" },
  { key: "assortment", title: "تنوع محصولات", description: "موبایل، لوازم جانبی و محصولات دیجیتال" },
  { key: "assurance", title: "خرید مطمئن", description: "اصالت کالا و تجربه خرید قابل اعتماد" },
] as const;

export type TrustFeatureKey = (typeof trustFeatures)[number]["key"];

export const mobileQuickRoutes = [
  { key: "shop", label: "فروشگاه", href: "/shop" },
  { key: "categories", label: "دسته‌بندی‌ها", href: "#categories" },
  { key: "partners", label: "همکاری", href: "#b2b" },
  { key: "contact", label: "تماس", href: "#contact" },
] as const;

export const categoryMosaic = [
  { key: "mobile", number: "۰۱", title: "موبایل", eyebrow: "MOBILE / CORE", detail: "Samsung · Apple · Xiaomi · Nokia", href: "/shop?category=mobile", icon: "smartphone", layout: "mobile" },
  { key: "audio", number: "۰۲", title: "ایرپاد و هدفون", eyebrow: "AUDIO / PERSONAL", detail: "AirPods · Headphones", href: "/shop?category=audio", icon: "headphones", layout: "audio" },
  { key: "charging", number: "۰۳", title: "شارژر و آداپتور", eyebrow: "POWER / ESSENTIAL", detail: "Adapters · Cables · Power", href: "/shop?category=charger", icon: "plug", layout: "charging" },
  { key: "power", number: "۰۴", title: "پاوربانک", eyebrow: "POWER / READY", detail: "همیشه آماده", href: "/shop?category=power-bank", icon: "battery", layout: "power" },
  { key: "watch", number: "۰۵", title: "ساعت هوشمند", eyebrow: "WATCH / CONNECTED", detail: "روزمره، دقیق، نزدیک", href: "/shop?category=smartwatch", icon: "watch", layout: "watch" },
  { key: "feature", number: "۰۶", title: "فیچرفون", eyebrow: "FEATURE / SIMPLE", detail: "ساده، ماندگار، آماده", href: "/shop?category=feature-phone", icon: "phone", layout: "feature" },
  { key: "party", number: "۰۷", title: "اسپیکر و Party Box", eyebrow: "ENTERTAINMENT / SOUND", detail: "Sound for larger moments", href: "/shop?category=speaker", icon: "speaker", layout: "party" },
  { key: "services", number: "۰۸", title: "خدمات آنلاین", eyebrow: "DIGITAL / ONLINE", detail: "Apple ID · Digital Services", href: "/shop?category=online-services", icon: "globe", layout: "services" },
] as const;

export const brandStories = [
  {
    key: "apple",
    name: "APPLE",
    title: "مینیمال، دقیق، بی‌حاشیه.",
    text: "یک روایت آرام برای انتخاب‌هایی که جزئیات متریال، تجربهٔ نرم و طراحی خالص برایشان مهم است.",
    href: "/shop?brand=apple",
  },
  {
    key: "samsung",
    name: "SAMSUNG",
    title: "قدرتی که با جزئیات دیده می‌شود.",
    text: "برای کسانی که از یک محصول، قابلیت، حضور بصری و امکان انتخاب گسترده‌تری انتظار دارند.",
    href: "/shop?brand=samsung",
  },
  {
    key: "xiaomi",
    name: "XIAOMI",
    title: "فناوری پویا، با انتخابی روشن.",
    text: "ترکیبی از نگاه معاصر، کارایی دقیق و ریتمی فعال‌تر در دسته‌های تکنولوژی روز.",
    href: "/shop?brand=xiaomi",
  },
] as const;

export type BrandStoryKey = (typeof brandStories)[number]["key"];

export const brandWall: ReadonlyArray<{ name: string; story?: BrandStoryKey }> = [
  { name: "APPLE", story: "apple" },
  { name: "SAMSUNG", story: "samsung" },
  { name: "XIAOMI", story: "xiaomi" },
  { name: "NOKIA" },
  { name: "REALME" },
  { name: "TCH" },
  { name: "VOCAL" },
  { name: "NEXA" },
  { name: "OAK" },
];

export const b2bFeatures = [
  { title: "قیمت همکاری", description: "Pricing مخصوص همکاران" },
  { title: "موجودی به‌روز", description: "اطلاع از موجودی پیش از سفارش" },
  { title: "تنوع کالا", description: "موبایل و لوازم جانبی در یک مجموعه" },
  { title: "سفارش آسان", description: "فرآیند ساده و سریع سفارش" },
] as const;

export const b2bWorkflow = [
  { index: "01", title: "ثبت‌نام", description: "اطلاعات همکاری را ثبت می‌کنید." },
  { index: "02", title: "تأیید", description: "حساب همکاری بررسی و فعال می‌شود." },
  { index: "03", title: "سفارش", description: "دسترسی همکاری برای سفارش آماده می‌شود." },
] as const;

export const b2bSupplyAreas = ["موبایل", "لوازم جانبی", "چندبرندی", "همکاری مستمر"] as const;

export const accessoryCategories = [
  { key: "audio", index: "01", label: "AUDIO", title: "صدا", detail: "ایرباد و هدفون", href: "/shop?category=audio" },
  { key: "power", index: "02", label: "POWER", title: "توان", detail: "پاوربانک", href: "/shop?category=power-bank" },
  { key: "charging", index: "03", label: "CHARGING", title: "شارژ", detail: "آداپتور و کابل", href: "/shop?category=charger" },
  { key: "wearables", index: "04", label: "WEARABLES", title: "پوشیدنی", detail: "ساعت هوشمند", href: "/shop?category=smartwatch" },
  { key: "entertainment", index: "05", label: "ENTERTAINMENT", title: "سرگرمی", detail: "اسپیکر و Party Box", href: "/shop?category=speaker" },
] as const;

export type AccessoryCategoryKey = (typeof accessoryCategories)[number]["key"];

export const featuredOnlineService = {
  key: "apple-id",
  index: "01",
  label: "APPLE ID",
  title: "Apple ID",
  description: "ساخت و آماده‌سازی Apple ID برای نیازهای دیجیتال شما.",
  status: "ONLINE SERVICE",
  trustCopy: "فرآیند ساده، شفاف و قابل پیگیری.",
  href: "/shop?category=online-services",
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
    mediaNote: "تصویر واقعی فروشگاه پس از دریافت، در همین قاب قرار می‌گیرد.",
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
  { index: "01", title: "مشاهده و انتخاب", description: "محصول را ببینید، مقایسه کنید و انتخاب کنید." },
  { index: "02", title: "مشاوره تخصصی", description: "پیش از خرید، انتخاب مناسب خودتان را پیدا کنید." },
  { index: "03", title: "پشتیبانی پس از خرید", description: "همراه شما بعد از خرید." },
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
  { label: "پشتیبانی", href: "#contact" },
  { label: "همکاری عمده", href: "#b2b" },
  { label: "تنوع برند", href: "#brands" },
] as const;

export const finalConversionCopy = {
  eyebrow: "HAMI HAMRAH / FINAL NOTE",
  titleLead: "همراه شما",
  titleTail: "از انتخاب تا تجربه.",
  subtitle: "خرید آنلاین، فروش حضوری و همکاری حرفه‌ای؛ همه در یک مجموعه.",
} as const;
