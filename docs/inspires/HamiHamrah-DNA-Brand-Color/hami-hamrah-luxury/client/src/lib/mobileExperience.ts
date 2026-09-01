export const mobileQuickRoutes = [
  { key: "shop", label: "فروشگاه", href: "/shop" },
  { key: "categories", label: "دسته‌بندی‌ها", href: "#categories" },
  { key: "partners", label: "همکاری", href: "#b2b" },
  { key: "contact", label: "تماس", href: "#contact" },
] as const;

export function resolveMobileRailWidth(viewportWidth: number) {
  return Math.ceil(Math.min(336, Math.max(292, viewportWidth * 0.81)));
}
