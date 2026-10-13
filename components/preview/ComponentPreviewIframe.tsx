"use client";

import { useDesignSystem } from "@/hooks/useDesignSystem";
import { DesignSystemKey } from "@/lib/design-system";

interface ComponentPreviewIframeProps {
  customStyle?: DesignSystemKey;
  className?: string;
  title?: string;
}

/**
 * Isolated component preview container that mounts an iframe pointing to `/preview`.
 * Uses `key={activeStyle}` to guarantee a clean remount and destroy stale CSS states
 * when the parent design system changes.
 */
export function ComponentPreviewIframe({
  customStyle,
  className = "",
  title = "پیش‌نمایش ایزوله کامپوننت",
}: ComponentPreviewIframeProps) {
  const { activeStyle } = useDesignSystem();
  const targetStyle = customStyle || activeStyle;
  const iframeSrc = `/preview?style=${encodeURIComponent(targetStyle)}&embed=1`;

  return (
    <div className={`overflow-hidden rounded-2xl border border-border/20 bg-background/50 shadow-md ${className}`}>
      <div className="flex items-center justify-between border-b border-border/10 bg-background/80 px-4 py-2 text-xs text-muted-foreground">
        <span>{title}</span>
        <span className="font-mono text-[11px] text-primary">دیزاین سیستم: {targetStyle}</span>
      </div>
      <iframe
        key={targetStyle}
        src={iframeSrc}
        title={title}
        className="h-80 w-full border-0 bg-transparent"
        loading="lazy"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

