export const categoryMosaic = [
  { key: "mobile", number: "۰۱", title: "موبایل", eyebrow: "MOBILE / CORE", detail: "Samsung · Apple · Xiaomi · Nokia", href: "/shop?category=mobile", image: "/manus-storage/hami-category-mobile_9a89a6d6.jpg", layout: "mobile" },
  { key: "audio", number: "۰۲", title: "ایرپاد و هدفون", eyebrow: "AUDIO / PERSONAL", detail: "AirPods · Headphones", href: "/shop?category=audio", image: "/manus-storage/hami-category-headphones_bd9ac15c.jpg", layout: "audio" },
  { key: "charging", number: "۰۳", title: "شارژر و آداپتور", eyebrow: "POWER / ESSENTIAL", detail: "Adapters · Cables · Power", href: "/shop?category=charger", image: "/manus-storage/hami-category-charger_35619ca4.jpg", layout: "charging" },
  { key: "power", number: "۰۴", title: "پاوربانک", eyebrow: "POWER / READY", detail: "همیشه آماده", href: "/shop?category=power-bank", image: "/manus-storage/hami-category-powerbank_caa01be3.jpg", layout: "power" },
  { key: "watch", number: "۰۵", title: "ساعت هوشمند", eyebrow: "WATCH / CONNECTED", detail: "روزمره، دقیق، نزدیک", href: "/shop?category=smartwatch", image: "/manus-storage/hami-category-smartwatch_50598498.jpg", layout: "watch" },
  { key: "feature", number: "۰۶", title: "فیچرفون", eyebrow: "FEATURE / SIMPLE", detail: "ساده، ماندگار، آماده", href: "/shop?category=feature-phone", image: "/manus-storage/hami-category-featurephone_90a16b45.jpg", layout: "feature" },
  { key: "party", number: "۰۷", title: "اسپیکر و Party Box", eyebrow: "ENTERTAINMENT / SOUND", detail: "Sound for larger moments", href: "/shop?category=speaker", image: "/manus-storage/hami-category-speaker_34b4009d.jpg", layout: "party" },
  { key: "services", number: "۰۸", title: "خدمات آنلاین", eyebrow: "DIGITAL / ONLINE", detail: "Apple ID · Digital Services", href: "/shop?category=online-services", image: undefined, layout: "services" },
] as const;

export type CategoryMosaicItem = (typeof categoryMosaic)[number];
