export type OnlineService = {
  key: "apple-id";
  index: "01";
  label: "APPLE ID";
  title: "Apple ID";
  description: string;
  status: "ONLINE SERVICE";
  trustCopy: string;
  href: "/shop?category=online-services";
};

export const featuredOnlineService: OnlineService = {
  key: "apple-id",
  index: "01",
  label: "APPLE ID",
  title: "Apple ID",
  description: "ساخت و آماده‌سازی Apple ID برای نیازهای دیجیتال شما.",
  status: "ONLINE SERVICE",
  trustCopy: "فرآیند ساده، شفاف و قابل پیگیری.",
  href: "/shop?category=online-services",
};

export const onlineServices = [featuredOnlineService] as const;

export const onlineServicesCta = {
  label: "مشاهده خدمات آنلاین",
  href: "/shop?category=online-services" as const,
};

export const onlineServiceFaqs = [
  {
    question: "Apple ID چیست؟",
    answer: "حسابی برای استفاده از برخی سرویس‌های Apple است؛ جزئیات موردنیاز پیش از ثبت درخواست شفاف می‌شود.",
  },
  {
    question: "برای دریافت خدمت چه اطلاعاتی لازم است؟",
    answer: "پیش از شروع، اطلاعات لازم متناسب با درخواست شما روشن و با شما هماهنگ می‌شود.",
  },
  {
    question: "خدمت چگونه پیگیری می‌شود؟",
    answer: "مسیر انجام خدمت و روش پیگیری، پیش از آغاز درخواست به‌صورت شفاف مشخص می‌شود.",
  },
] as const;
