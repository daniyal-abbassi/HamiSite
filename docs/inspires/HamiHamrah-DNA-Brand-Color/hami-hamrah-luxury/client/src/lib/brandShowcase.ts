export const brandStories = [
  {
    key: "apple",
    name: "APPLE",
    title: "مینیمال، دقیق، بی‌حاشیه.",
    text: "یک روایت آرام برای انتخاب‌هایی که جزئیات متریال، تجربهٔ نرم و طراحی خالص برایشان مهم است.",
    image: "/manus-storage/hami-brand-story-apple_35ab4c74.jpg",
    href: "/shop?brand=apple",
  },
  {
    key: "samsung",
    name: "SAMSUNG",
    title: "قدرتی که با جزئیات دیده می‌شود.",
    text: "برای کسانی که از یک محصول، قابلیت، حضور بصری و امکان انتخاب گسترده‌تری انتظار دارند.",
    image: "/manus-storage/hami-brand-story-samsung_5cb7304c.jpg",
    href: "/shop?brand=samsung",
  },
  {
    key: "xiaomi",
    name: "XIAOMI",
    title: "فناوری پویا، با انتخابی روشن.",
    text: "ترکیبی از نگاه معاصر، کارایی دقیق و ریتمی فعال‌تر در دسته‌های تکنولوژی روز.",
    image: "/manus-storage/hami-brand-story-xiaomi_5848193e.jpg",
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

export const getBrandStory = (key: BrandStoryKey) => brandStories.find((story) => story.key === key) ?? brandStories[0];
