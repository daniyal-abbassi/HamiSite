/**
 * Codified UI Craft Rules for automated scanning.
 * Grounded in https://farsiui.ir/skills/ui-craft-rules.
 */

export const CRAFT_RULES = [
  {
    id: "CRAFT-001-NO-ARBITRARY-VALUES",
    name: "No Arbitrary Pixel Values in Tailwind",
    category: "Design System",
    severity: "error",
    description:
      "Do not add arbitrary Tailwind values (p-[*px], m-[*px], gap-[*px], text-[*px]) when existing design tokens or the 4px scale cover the need.",
    // Matches arbitrary pixel values in class names (e.g. p-[13px], text-[15px], gap-[17px])
    pattern: /\b(p[xytbrl]?|m[xytbrl]?|gap|text|rounded|w|h)-\[(\d+px)\]/g,
    suggestedFix: (match, prefix, val) =>
      `Replace '${prefix}-[${val}]' with standard token (e.g. p-3, p-4, text-sm, text-base)`
  },
  {
    id: "CRAFT-002-NO-HARDCODED-HEX",
    name: "No Hardcoded Hex Colors",
    category: "Color",
    severity: "error",
    description:
      "Colors must derive from semantic design tokens (bg-background, text-foreground, border-border, bg-card) rather than hardcoded hex codes.",
    // Matches hex color codes inside className strings or style properties (excluding comments/configs)
    pattern: /className=["'`](?:[^"'`]*?)(#(?:[0-9a-fA-F]{3}){1,2})\b(?:[^"'`]*?)["'`]/g,
    suggestedFix: (match, hex) =>
      `Replace '${hex}' with a semantic theme token (e.g. bg-muted, text-primary, border-border)`
  },
  {
    id: "CRAFT-003-TOUCH-TARGET-MIN-44",
    name: "Minimum 44×44px Touch Target",
    category: "Interaction",
    severity: "warning",
    description:
      "Interactive buttons and icon toggles must satisfy >= 44×44px hit area (using size >= 11, min-h-[44px], p-2.5, or extend-touch-target).",
    // Matches button/link elements with size-8 or h-8 w-8 without touch expansion
    pattern: /<(?:button|a)\s+[^>]*?className=["'`]([^"'`]*?\b(?:size-[678]|h-8\s+w-8|h-7\s+w-7)[^"'`]*?)["'`]/g,
    validator: (match, classList) => {
      const hasTouchExpansion =
        classList.includes("extend-touch-target") ||
        classList.includes("min-h-11") ||
        classList.includes("min-w-11") ||
        classList.includes("size-11") ||
        classList.includes("h-11") ||
        classList.includes("min-h-[44px]") ||
        classList.includes("min-w-[44px]") ||
        classList.includes("p-2.5") ||
        classList.includes("p-3") ||
        classList.includes("p-4") ||
        classList.includes("before:");
      return !hasTouchExpansion;
    },
    suggestedFix: () =>
      "Add 'extend-touch-target', 'min-h-11 min-w-11', or generous padding (p-2.5) to ensure a 44×44px tap area"
  },
  {
    id: "CRAFT-004-IMAGE-ASPECT-RATIO",
    name: "Reserve Space for Media Elements",
    category: "Layout",
    severity: "warning",
    description:
      "Images and media containers must reserve space with aspect-ratio or explicit dimensions to prevent layout shift (CLS <= 0.05).",
    // Checks Image components or image wrappers lacking aspect ratio
    pattern: /<Image\s+[^>]*?fill\b[^>]*?>/g,
    validator: (match, _, fullContent, matchIndex) => {
      // Look at the preceding 200 characters to check parent wrapper
      const preceding = fullContent.slice(Math.max(0, matchIndex - 250), matchIndex);
      return !preceding.includes("aspect-") && !preceding.includes("h-") && !preceding.includes("height");
    },
    suggestedFix: () =>
      "Wrap <Image fill /> in a parent container with 'aspect-square', 'aspect-[4/3]', or explicit dimensions"
  },
  {
    id: "CRAFT-005-PERSIAN-TYPOGRAPHY",
    name: "Persian Typography Constraints",
    category: "Typography",
    severity: "error",
    description:
      "Do not use tracking (letter-spacing) or uppercase transformations on Persian text.",
    pattern: /\b(tracking-(?:wider|widest|tight|tighter)|uppercase)\b/g,
    suggestedFix: (match, cls) =>
      `Remove '${cls}' on Persian text or replace with 'tracking-normal'`
  }
];
