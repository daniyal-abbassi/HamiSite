"use client";

import { useDesignSystem } from "@/hooks/useDesignSystem";
import { DesignSystemKey } from "@/lib/design-system";

export function DesignSystemPicker() {
  const { activeStyle, setStyle, availableStyles, isLoaded } = useDesignSystem();

  if (!isLoaded) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label="انتخاب دیزاین سیستم"
      className="inline-flex items-center gap-1 rounded-full border border-border/20 bg-background/80 p-1 backdrop-blur-md text-xs font-medium text-foreground shadow-sm"
    >
      {availableStyles.map((item) => {
        const isActive = activeStyle === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setStyle(item.id)}
            aria-pressed={isActive}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
            title={item.description}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

