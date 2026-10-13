"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DesignSystemKey,
  DesignSystemDefinition,
  DESIGN_SYSTEM_MAP,
  DESIGN_SYSTEM_STORAGE_KEY,
  DEFAULT_DESIGN_SYSTEM,
  buildDesignSystemCookie,
  resolveDesignSystem,
  ALL_DESIGN_SYSTEM_CLASSES,
} from "@/lib/design-system";

export interface UseDesignSystemReturn {
  activeStyle: DesignSystemKey;
  definition: DesignSystemDefinition;
  setStyle: (key: DesignSystemKey) => void;
  availableStyles: DesignSystemDefinition[];
  isLoaded: boolean;
}

/**
 * Client-side hook for reading, persisting, and switching active design systems.
 * Ensures localStorage, document.cookie, and body.classList stay in sync without FOUC,
 * and maintains orthogonal coexistence with html.dark / html.light.
 */
export function useDesignSystem(): UseDesignSystemReturn {
  const [activeStyle, setActiveStyle] = useState<DesignSystemKey>(DEFAULT_DESIGN_SYSTEM);
  const [isLoaded, setIsLoaded] = useState(false);

  // Synchronize from DOM/storage on mount
  useEffect(() => {
    try {
      let initialKey: DesignSystemKey = DEFAULT_DESIGN_SYSTEM;

      // 1. Check body class
      if (typeof document !== "undefined" && document.body) {
        for (const cls of ALL_DESIGN_SYSTEM_CLASSES) {
          if (document.body.classList.contains(cls)) {
            initialKey = resolveDesignSystem(cls);
            break;
          }
        }
      }

      // 2. Check localStorage
      const stored = localStorage.getItem(DESIGN_SYSTEM_STORAGE_KEY);
      if (stored) {
        initialKey = resolveDesignSystem(stored);
      }

      setActiveStyle(initialKey);
    } catch (_) {
      // LocalStorage access restricted or unavailable
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const setStyle = useCallback((key: DesignSystemKey) => {
    const validKey = resolveDesignSystem(key);
    setActiveStyle(validKey);

    try {
      // 1. Update localStorage
      localStorage.setItem(DESIGN_SYSTEM_STORAGE_KEY, validKey);

      // 2. Update cookie
      document.cookie = buildDesignSystemCookie(validKey);

      // 3. Update body classes synchronously
      if (typeof document !== "undefined" && document.body) {
        const targetClass = DESIGN_SYSTEM_MAP[validKey].className;
        ALL_DESIGN_SYSTEM_CLASSES.forEach((cls) => {
          document.body.classList.remove(cls);
        });
        document.body.classList.add(targetClass);

        // 4. Mode preservation logic (orthogonal html light/dark)
        // If switching to a theme with an explicit defaultMode and html does not have a class yet
        const html = document.documentElement;
        if (html && !html.classList.contains("dark") && !html.classList.contains("light")) {
          const prefMode = DESIGN_SYSTEM_MAP[validKey].defaultMode || "dark";
          html.classList.add(prefMode);
        }
      }
    } catch (_) {
      // Storage or DOM write error
    }
  }, []);

  return {
    activeStyle,
    definition: DESIGN_SYSTEM_MAP[activeStyle],
    setStyle,
    availableStyles: Object.values(DESIGN_SYSTEM_MAP),
    isLoaded,
  };
}

