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

export const b2bCtas = [
  { label: "ورود به پنل همکاری", href: "/partners/login", kind: "primary" },
  { label: "ثبت‌نام همکار", href: "/partners", kind: "secondary" },
] as const;
