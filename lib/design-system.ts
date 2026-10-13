/**
 * Design System Registry and Helpers for Next.js Multi Design System.
 * Single source of truth for design systems, scoping classes, and cookies.
 */

export type DesignSystemKey = "default" | "comfort" | "glass";

export type DesignSystemClass = "style-nova" | "style-vega" | "style-glass";

export interface DesignSystemDefinition {
  id: DesignSystemKey;
  label: string;
  className: DesignSystemClass;
  description: string;
  defaultMode?: "dark" | "light";
  primaryAccent: string;
}

export const DESIGN_SYSTEM_STORAGE_KEY = "design-system-preview";
export const DESIGN_SYSTEM_COOKIE_NAME = "design-system-preview";
export const DEFAULT_DESIGN_SYSTEM: DesignSystemKey = "default";

export const DESIGN_SYSTEM_MAP: Record<DesignSystemKey, DesignSystemDefinition> = {
  default: {
    id: "default",
    label: "لوکس (نوا)",
    className: "style-nova",
    description: "استایل امضای حامی همراه — ابسیدین عمیق و طلای شامپاینی",
    defaultMode: "dark",
    primaryAccent: "#E5D3B3",
  },
  comfort: {
    id: "comfort",
    label: "راحت (وگا)",
    className: "style-vega",
    description: "استایل مدرن و سبک — پس‌زمینه گرم، کنتراست ملایم و خوانایی بالا",
    defaultMode: "light",
    primaryAccent: "#D97706",
  },
  glass: {
    id: "glass",
    label: "شیشه‌ای (گلس)",
    className: "style-glass",
    description: "استایل فلوئید با افکت‌های بلور و های‌لایت‌های ظریف کریستالی",
    defaultMode: "dark",
    primaryAccent: "#38BDF8",
  },
};

export const ALL_DESIGN_SYSTEM_CLASSES: DesignSystemClass[] = [
  "style-nova",
  "style-vega",
  "style-glass",
];

/**
 * Validates if an unknown value is a supported DesignSystemKey.
 */
export function isDesignSystemKey(value: unknown): value is DesignSystemKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(DESIGN_SYSTEM_MAP, value);
}

/**
 * Resolves an unknown key or class safely to a valid DesignSystemKey, falling back to 'default'.
 */
export function resolveDesignSystem(value: unknown): DesignSystemKey {
  if (isDesignSystemKey(value)) {
    return value;
  }
  // Also handle if className was passed directly
  for (const entry of Object.values(DESIGN_SYSTEM_MAP)) {
    if (entry.className === value) {
      return entry.id;
    }
  }
  return DEFAULT_DESIGN_SYSTEM;
}

/**
 * Returns the DesignSystemClass for a given key or unknown value.
 */
export function getDesignSystemClass(value: unknown): DesignSystemClass {
  const key = resolveDesignSystem(value);
  return DESIGN_SYSTEM_MAP[key].className;
}

/**
 * Extracts and resolves the design system key from a raw cookie string (e.g. from SSR or document.cookie).
 */
export function parseDesignSystemFromCookie(cookieHeader: string | null | undefined): DesignSystemKey {
  if (!cookieHeader) return DEFAULT_DESIGN_SYSTEM;
  const match = cookieHeader.match(new RegExp(`(?:^|; )${DESIGN_SYSTEM_COOKIE_NAME}=([^;]*)`));
  if (!match || !match[1]) return DEFAULT_DESIGN_SYSTEM;
  const rawValue = decodeURIComponent(match[1]);
  return resolveDesignSystem(rawValue);
}

/**
 * Builds the cookie string for setting the design system preference.
 */
export function buildDesignSystemCookie(key: DesignSystemKey): string {
  return `${DESIGN_SYSTEM_COOKIE_NAME}=${key};path=/;max-age=31536000;samesite=lax`;
}

