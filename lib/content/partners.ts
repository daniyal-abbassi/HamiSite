/**
 * /partners page content — clean-room copy for the B2B application form,
 * matching the home page's editorial voice.
 */

export const partnerPageCopy = {
  eyebrow: "برای همکاران، با حامی همراه",
  titleLead: "همکارِ امروز،",
  titleTail: "همراهِ فردا.",
  intro:
    "شما کسب‌وکارتان را می‌شناسید، ما بازار موبایل را. اگر فروشگاه یا شرکتی در این حوزه دارید، اینجا نقطهٔ شروع همکاری ماست.",
  steps: [
    { index: "۰۱", title: "معرفی کسب‌وکار شما", description: "فرم را تکمیل کنید و مدارک فروشگاه یا شرکت خود را بفرستید." },
    { index: "۰۲", title: "بررسی و گفتگو", description: "کارشناسان مدارک را بررسی می‌کنند و برای تکمیل مراحل با شما تماس می‌گیرند." },
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
  { key: "companyName", label: "نام شرکت", placeholder: "نام ثبت‌شده شرکت", required: true, span: "full" as const },
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