export type GuidelineCategory =
  | "accessibility"
  | "focus_states"
  | "forms"
  | "animation"
  | "typography"
  | "media"
  | "performance"
  | "touch_interaction";

export interface GuidelineRule {
  id: string;
  category: GuidelineCategory;
  name: string;
  description: string;
  severity: "error" | "warning";
}

export interface GuidelineViolation {
  filePath: string;
  lineNumber?: number;
  ruleId: string;
  message: string;
}

export const CORE_GUIDELINE_RULES: GuidelineRule[] = [
  {
    id: "a11y-no-bare-outline-none",
    category: "focus_states",
    name: "Focus Indicator Preservation",
    description: "Never use outline-none without a corresponding focus-visible ring replacement.",
    severity: "error",
  },
  {
    id: "forms-no-paste-blocking",
    category: "forms",
    name: "Unrestricted Clipboard Paste",
    description: "Never intercept or block onPaste events with preventDefault.",
    severity: "error",
  },
  {
    id: "motion-prefer-reduced",
    category: "animation",
    name: "Reduced Motion Support",
    description: "Animations must respect prefers-reduced-motion media queries.",
    severity: "error",
  },
  {
    id: "touch-manipulation",
    category: "touch_interaction",
    name: "Fast Touch Manipulation",
    description: "Interactive elements should support touch-action: manipulation to eliminate double-tap delay.",
    severity: "warning",
  },
  {
    id: "media-explicit-dimensions",
    category: "media",
    name: "Media Dimensions & Aspect Ratio",
    description: "Images must declare dimensions or aspect ratio containers to prevent CLS.",
    severity: "error",
  },
];

