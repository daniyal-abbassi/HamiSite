export const trustFeatures = [
  { key: "store", title: "فروش حضوری", description: "تجربه خرید حضوری از فروشگاه حامی همراه" },
  { key: "wholesale", title: "پخش عمده", description: "قیمت و تأمین ویژه برای همکاران" },
  { key: "assortment", title: "تنوع محصولات", description: "موبایل، لوازم جانبی و محصولات دیجیتال" },
  { key: "assurance", title: "خرید مطمئن", description: "اصالت کالا و تجربه خرید قابل اعتماد" },
] as const;

export type TrustFeatureKey = (typeof trustFeatures)[number]["key"];
