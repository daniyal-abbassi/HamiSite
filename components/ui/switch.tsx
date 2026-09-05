import * as React from "react";
import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
};

/** Branded boolean toggle — a pill that slides a gold knob. Uses flex
 * justify-start/end (logical under RTL) instead of physical translate-x. */
function Switch({ checked, onCheckedChange, disabled, id, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-line px-0.5 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "justify-end border-gold bg-gold/25" : "justify-start bg-ink/60",
      )}
      {...rest}
    >
      <span
        className={cn(
          "size-4 rounded-full shadow transition-colors duration-fast",
          checked ? "bg-gold-lite" : "bg-foreground/50",
        )}
      />
    </button>
  );
}

export { Switch };