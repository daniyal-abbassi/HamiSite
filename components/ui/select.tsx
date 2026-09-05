import * as React from "react";
import { cn } from "@/lib/utils";

/** Native <select> wrapped in the brand's input chrome — keeps keyboard
 * accessibility and mobile pickers without a headless-ui dependency. */
const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full cursor-pointer appearance-none rounded-xl border border-input bg-ink/60 px-3.5 py-1 text-sm shadow-none transition-colors duration-fast hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20fill%3D%22none%22%20stroke%3D%22%23F2F4ED%22%20stroke-opacity%3D%220.6%22%20stroke-width%3D%222%22%20d%3D%22M3%206l5%205%205-5%22%2F%3E%3C%2Fsvg%3E')]",
        "bg-[position:left_0.75rem_center] bg-no-repeat pe-9",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export { Select };