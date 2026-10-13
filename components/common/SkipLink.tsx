import React from "react";
import type { SkipLinkProps } from "@/types/accessibility";

/**
 * Accessible Skip Link component.
 * Allows keyboard and screen reader users to bypass top-level navigation
 * and jump directly to the main content area (#main).
 */
export function SkipLink({
  targetId = "main",
  label = "پرش به محتوای اصلی",
  className = "",
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={`sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[9999] focus:px-4 focus:py-2.5 focus:bg-amber-400 focus:text-neutral-950 focus:font-semibold focus:text-sm focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-4 focus:ring-amber-400/50 transition-all ${className}`}
    >
      {label}
    </a>
  );
}

export default SkipLink;

