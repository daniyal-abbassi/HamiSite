"use client";

import { useEffect, useRef } from "react";
import type { FocusTrapOptions } from "@/types/accessibility";

export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Custom hook to trap keyboard focus within a container element,
 * handle Escape dismissal, and return focus upon unmount.
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  options: FocusTrapOptions = {}
) {
  const { enabled = true, initialFocusRef, returnFocusRef, onEscape } = options;
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Remember currently focused element to return focus later
    if (typeof document !== "undefined") {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    }

    const container = containerRef.current;
    if (!container) return;

    // Initial focus placement
    const timeoutId = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          // If no focusable children exist, ensure container is tabbable and focus it
          if (!container.hasAttribute("tabindex")) {
            container.setAttribute("tabindex", "-1");
          }
          container.focus();
        }
      }
    }, 10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        return;
      }

      if (e.key === "Tab") {
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: if on first element, wrap to last
          if (document.activeElement === firstElement || !container.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === lastElement || !container.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener("keydown", handleKeyDown);

      // Return focus upon cleanup
      const elementToFocus = returnFocusRef?.current || previousActiveElementRef.current;
      if (elementToFocus && typeof elementToFocus.focus === "function") {
        setTimeout(() => {
          elementToFocus.focus();
        }, 10);
      }
    };
  }, [containerRef, enabled, initialFocusRef, returnFocusRef, onEscape]);
}

