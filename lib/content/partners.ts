/**
 * /partners page content — clean-room copy for the B2B application form,
 * matching the home page's editorial voice.
 */

export const partnerPageCopy = {
  eyebrow: "FOR BUSINESS / APPLICATION",
  titleLead: "همکاری",
  titleTail: "با حامی همراه.",
  intro:
    "اگر فروشگاه، همکار عمده یا مجموعه‌ای فعال در حوزه موبایل و لوازم جانبی دارید، فرم را تکمیل کنید؛ کارشناسان حامی همراه پس از بررسی مدارک با شما تماس می‌گیرند.",
  steps: [
    { index: "۰۱", title: "تکمیل فرم و بارگذاری مدارک", description: "مدارک هویتی و فروشگاهی را مطابق نوع شخصیت حقوقی یا حقیقی بارگذاری کنید." },
    { index: "۰۲", title: "بررسی مدارک", description: "کارشناسان اعتبارسنجی، مدارک را بررسی و در صورت نیاز تماس می‌گیرند." },
    { index: "۰۳", title: "فعال‌سازی حساب همکاری", description: "پس از تأیید، قیمت همکاری و مسیر ثبت سفارش فعال می‌شود." },
  ] as const,
} as const;

export type PartnerEntity = "INDIVIDUAL" | "LEGAL";

export const partnerEntityOptions: ReadonlyArray<{ key: PartnerEntity; label: string; hint: string }> = [
  { key: "INDIVIDUAL", label: "حقیقی", hint: "فروشگاه به نام شخص" },
  { key: "LEGAL", label: "حقوقی", hint: "فروشگاه به نام شرکت" },
];

export const partnerSharedFields = [
  { key: "fullName", label: "نام و نام خانوادگی", placeholder: "مثلاً علی محمدی", required: true },
  { key: "mobile", label: "شماره موبایل", placeholder: "۰۹۱۲۳۴۵۶۷۸۹", required: true, dir: "ltr" as const },
  { key: "nationalCode", label: "کد ملی", placeholder: "۱۰ رقم", required: true, dir: "ltr" as const },
  { key: "shopName", label: "نام فروشگاه", placeholder: "نام فروشگاه", required: true },
  { key: "shopAddress", label: "آدرس فروشگاه", placeholder: "شهر، خیابان، پلاک", required: true, span: "full" as const },
] as const;

export const partnerIndividualFields = [
  { key: "leaseDocument", label: "عکس اجاره‌نامه", kind: "file" as const, required: true },
  { key: "businessLicense", label: "عکس جواز کسب", kind: "file" as const, required: true },
  { key: "postalCode", label: "کد پستی", placeholder: "۱۰ رقم", required: true, dir: "ltr" as const },
  { key: "shopPhone", label: "تلفن فروشگاه", placeholder: "۰۲۱… یا ۰۹۱۲…", required: true, dir: "ltr" as const },
] as const;

export const partnerLegalFields = [
  { key: "legalNationalId", label: "شناسه ملی شرکت", placeholder: "۱۱ رقم", required: true, dir: "ltr" as const },
  { key: "companyAddress", label: "آدرس شرکت", placeholder: "آدرس ثبت‌شده شرکت", required: true, span: "full" as const },
  { key: "registrationNotice", label: "آگهی تغییرات (فایل)", kind: "file" as const, required: true },
  { key: "economicCode", label: "شماره اقتصادی", placeholder: "۱۲ رقم", required: true, dir: "ltr" as const },
  { key: "leaseDocument", label: "اجاره‌نامه (فایل)", kind: "file" as const, required: true },
] as const;

export const partnerFileTypesNote = "فایل می‌تواند JPG، PNG، WebP یا PDF باشد؛ حداکثر ۱۰ مگابایت برای هر مدرک.";

/** Text fields accepted by POST /api/partners (multipart). */
export const partnerRequestTextFields = [
  "entityType",
  "fullName",
  "mobile",
  "nationalCode",
  "shopName",
  "shopAddress",
  "postalCode",
  "shopPhone",
  "companyName",
  "companyAddress",
  "legalNationalId",
  "economicCode",
] as const;