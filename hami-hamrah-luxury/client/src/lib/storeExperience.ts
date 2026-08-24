export type StoreImageSlot = {
  key: "wide-store" | "product-interaction" | "store-detail";
  label: string;
  intendedUse: string;
  status: "pending-real-photo";
  src?: never;
};

export const storeExperienceImageSlots: StoreImageSlot[] = [
  { key: "wide-store", label: "نمای کلی فروشگاه", intendedUse: "نور، ویترین، قفسه‌ها و فضای واقعی مجموعه", status: "pending-real-photo" },
  { key: "product-interaction", label: "تعامل با محصول", intendedUse: "انتخاب محصول یا گفت‌وگوی طبیعی مشاوره", status: "pending-real-photo" },
  { key: "store-detail", label: "جزئیات فروشگاه", intendedUse: "بسته‌بندی، میز فروش یا نشانهٔ بصری مجموعه", status: "pending-real-photo" },
];

export const storeExperiencePoints = [
  { index: "01", title: "مشاهده و انتخاب", description: "محصول را ببینید، مقایسه کنید و انتخاب کنید." },
  { index: "02", title: "مشاوره تخصصی", description: "پیش از خرید، انتخاب مناسب خودتان را پیدا کنید." },
  { index: "03", title: "پشتیبانی پس از خرید", description: "همراه شما بعد از خرید." },
] as const;

export const storeExperienceStatement = "از صفحه نمایش تا فروشگاه، همراه شما هستیم.";

export const storeExperienceCtas = [
  { kind: "primary", label: "اطلاعات فروشگاه", href: "#contact" as const },
  { kind: "secondary", label: "تماس با ما", href: "tel:05138000000" as const },
] as const;
