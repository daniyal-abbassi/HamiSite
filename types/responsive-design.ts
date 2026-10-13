export type BreakpointName = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface ViewportDefinition {
  name: BreakpointName;
  minWidth: number;
  maxWidth?: number;
  targetDevice: string;
}

export const RESPONSIVE_BREAKPOINTS: Record<BreakpointName, ViewportDefinition> = {
  xs: { name: "xs", minWidth: 320, maxWidth: 639, targetDevice: "Compact/Standard Mobile Phone" },
  sm: { name: "sm", minWidth: 640, maxWidth: 767, targetDevice: "Phablet / Large Phone" },
  md: { name: "md", minWidth: 768, maxWidth: 1023, targetDevice: "Tablet" },
  lg: { name: "lg", minWidth: 1024, maxWidth: 1279, targetDevice: "Laptop / Desktop" },
  xl: { name: "xl", minWidth: 1280, maxWidth: 1535, targetDevice: "Standard Monitor" },
  "2xl": { name: "2xl", minWidth: 1536, targetDevice: "Ultra-wide Display" },
};

export const MIN_TOUCH_TARGET_SIZE_PX = 44;

