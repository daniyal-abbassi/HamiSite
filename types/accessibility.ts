import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/**
 * Standard accessible icon-only button props
 */
export interface AccessibleIconButtonProps extends ComponentPropsWithoutRef<"button"> {
  /** Required unambiguous Persian accessible name for assistive technology */
  "aria-label": string;
  /** Optional visual tooltip text */
  tooltip?: string;
}

/**
 * Props for the high-contrast SkipLink landmark
 */
export interface SkipLinkProps {
  /** Target element ID without the hash, defaults to "main" */
  targetId?: string;
  /** Persian label text, defaults to "پرش به محتوای اصلی" */
  label?: string;
  className?: string;
}

/**
 * Dialog focus trap options
 */
export interface FocusTrapOptions {
  /** Whether the focus trap is actively engaged */
  enabled?: boolean;
  /** Element or ref to receive focus when opened */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Element or ref to restore focus to when closed */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  /** Callback triggered when Escape key is pressed */
  onEscape?: () => void;
}

/**
 * Audit violation structure for automated accessibility reporting
 */
export interface AccessibilityAuditViolation {
  id: string;
  criterion: string;
  severity: "CRITICAL" | "SERIOUS" | "MODERATE";
  selector: string;
  description: string;
  remediation: string;
  verified: boolean;
}

