export const communityContentState = {
  status: "awaiting-verified-content" as const,
  items: [] as const,
  message: "محتوای تجربه مشتریان پس از دریافت اجازه و تأیید منبع منتشر می‌شود.",
  helper: "برای نمایش نظر، عکس یا محتوای اجتماعی، منبع و رضایت صاحب محتوا لازم است.",
};

export const customerTrustSignals = [
  { label: "فروش حضوری", href: "#store-experience" },
  { label: "فروش آنلاین", href: "/shop" },
  { label: "پشتیبانی", href: "#contact" },
  { label: "همکاری عمده", href: "#b2b" },
  { label: "تنوع برند", href: "#brands" },
] as const;

export const customerJourney = ["انتخاب", "مشاوره", "خرید", "همراهی"] as const;

export const customerTrustCtas = [{ label: "شروع خرید", href: "/shop" }] as const;
