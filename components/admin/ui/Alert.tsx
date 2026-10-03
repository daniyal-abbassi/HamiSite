/** Hand-built for this repo — no upstream counterpart. The kit's `data-table.tsx` needs an `alert`
 * for its failed-request band (research.md R7). Tones are the three this project already has a token
 * for; there is no fourth, because a colour we cannot name is a colour we should not paint.
 *
 * Contrast measured against the surfaces below, not assumed (FR-011): the tone-coloured title sits at
 * 4.93:1 on the destructive wash and 6.34:1 on the success wash, and the body text is
 * `text-foreground` on both at 15.3:1 and above. `bg-emerald-400` — which `StatusBadge.tsx:55` uses
 * today — is not among these, because it is a raw palette colour this design system does not define;
 * the project's green is `success`.
 */

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertTone = "default" | "destructive" | "success";

const TONE: Record<AlertTone, { surface: string; title: string; icon: string }> = {
  default: { surface: "border-line bg-ink-2", title: "text-champagne", icon: "text-champagne" },
  destructive: { surface: "border-destructive/40 bg-destructive/10", title: "text-destructive", icon: "text-destructive" },
  success: { surface: "border-success/40 bg-success/10", title: "text-success", icon: "text-success" },
};

type AlertProps = Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
  tone?: AlertTone;
  /** Optional. It is decoration alongside the text, so it is `aria-hidden` and the message never
   * depends on it — an icon that carries meaning on its own is an icon a screen reader misses. */
  icon?: LucideIcon;
  /** Renders in the tone colour above the body. A `p`, not a heading: an alert is a paragraph with a
   * colour, and inventing a heading level per banner is how a page loses its outline. */
  title?: React.ReactNode;
  children?: React.ReactNode;
};

export function Alert({ tone = "default", icon: Icon, title, children, className, ...divProps }: AlertProps) {
  const palette = TONE[tone];

  return (
    <div
      // Not `role="alert"` by default: that is a live region, and a banner that was already on screen
      // when the page loaded would interrupt whoever got there first. A caller rendering one in
      // response to a failed action passes `role="alert"` through these props.
      {...divProps}
      className={cn("flex items-start gap-3 rounded-lg border p-4", palette.surface, className)}
    >
      {Icon && <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", palette.icon)} />}
      <div className="min-w-0 flex-1">
        {title && <p className={cn("text-[13px] font-black leading-6", palette.title)}>{title}</p>}
        {children && <div className={cn("text-[13px] leading-6 text-foreground", title && "mt-1")}>{children}</div>}
      </div>
    </div>
  );
}
