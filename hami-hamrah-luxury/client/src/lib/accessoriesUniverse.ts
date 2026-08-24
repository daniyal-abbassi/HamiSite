export const accessoryCategories = [
  { key: "audio", index: "01", label: "AUDIO", title: "صدا", detail: "ایرباد و هدفون", href: "/shop?category=audio" },
  { key: "power", index: "02", label: "POWER", title: "توان", detail: "پاوربانک", href: "/shop?category=power-bank" },
  { key: "charging", index: "03", label: "CHARGING", title: "شارژ", detail: "آداپتور و کابل", href: "/shop?category=charger" },
  { key: "wearables", index: "04", label: "WEARABLES", title: "پوشیدنی", detail: "ساعت هوشمند", href: "/shop?category=smartwatch" },
  { key: "entertainment", index: "05", label: "ENTERTAINMENT", title: "سرگرمی", detail: "اسپیکر و Party Box", href: "/shop?category=speaker" },
] as const;

export type AccessoryCategoryKey = (typeof accessoryCategories)[number]["key"];

export function getAccessoryCategory(key: AccessoryCategoryKey) {
  return accessoryCategories.find((category) => category.key === key) ?? accessoryCategories[0];
}
