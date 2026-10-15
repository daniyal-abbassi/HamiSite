import type { CSSProperties } from "react";
import { cn, formatToman } from "@/lib/utils";

type TomanPriceProps = {
  amount: number | string | null | undefined;
  as?: "span" | "strong";
  className?: string;
  style?: CSSProperties;
  "aria-live"?: "off" | "polite" | "assertive";
};

/** Render the canonical Toman formatter with a quieter, separate currency unit. */
export function TomanPrice({ amount, as = "span", className, style, "aria-live": ariaLive }: TomanPriceProps) {
  const formatted = formatToman(amount);
  const unit = " تومان";
  const Tag = as;

  if (!formatted.endsWith(unit)) {
    return <Tag className={cn("toman-price", className)} style={style} aria-live={ariaLive} aria-label={formatted}>{formatted}</Tag>;
  }

  return (
    <Tag className={cn("toman-price", className)} dir="rtl" style={style} aria-live={ariaLive} aria-label={formatted}>
      <span className="toman-price__amount" dir="auto">{formatted.slice(0, -unit.length)}</span>
      <span className="toman-price__unit">{`\u00a0تومان`}</span>
    </Tag>
  );
}
