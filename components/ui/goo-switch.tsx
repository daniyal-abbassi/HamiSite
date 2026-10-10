"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: {
    track: "h-6 w-11 p-0.5",
    knob: "size-5",
    dot: "size-1.5",
  },
  md: {
    track: "h-7 w-13 p-0.5",
    knob: "size-6",
    dot: "size-2",
  },
  lg: {
    track: "h-9 w-16 p-1",
    knob: "size-7",
    dot: "size-2.5",
  },
} as const;

export interface GooSwitchClassNames {
  root?: string;
  knob?: string;
}

export interface GooSwitchProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onChange" | "value" | "defaultValue" | "name"
  > {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: keyof typeof SIZES;
  inset?: number;
  stretch?: boolean;
  sling?: number | false;
  trail?: number;
  name?: string;
  value?: string;
  required?: boolean;
  classNames?: GooSwitchClassNames;
}

export function GooSwitch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  size = "md",
  name,
  value = "on",
  required = false,
  form,
  classNames,
  className,
  onClick,
  id,
  "aria-label": ariaLabel,
  ...rest
}: GooSwitchProps) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isOn = isControlled ? Boolean(checked) : internalChecked;

  const currentSize = SIZES[size] || SIZES.md;

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onClick?.(e);
    const next = !isOn;
    if (!isControlled) {
      setInternalChecked(next);
    }
    onCheckedChange?.(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!disabled) {
        const next = !isOn;
        if (!isControlled) {
          setInternalChecked(next);
        }
        onCheckedChange?.(next);
      }
    }
  };

  return (
    <>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={isOn}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        disabled={disabled}
        form={form}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer items-center rounded-full border transition-all duration-300 select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          currentSize.track,
          isOn
            ? "justify-end bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/25"
            : "justify-start bg-red-500 border-red-400 shadow-sm shadow-red-500/25",
          className,
          classNames?.root,
        )}
        {...rest}
      >
        <motion.span
          layout
          transition={{
            type: "spring",
            stiffness: 700,
            damping: 35,
          }}
          className={cn(
            "flex items-center justify-center rounded-full bg-white shadow-md pointer-events-none",
            currentSize.knob,
            classNames?.knob,
          )}
        >
          <span
            className={cn(
              "rounded-full transition-colors duration-200",
              currentSize.dot,
              isOn ? "bg-emerald-600" : "bg-red-600",
            )}
          />
        </motion.span>
      </button>

      {(name !== undefined || required) && (
        <input
          type="checkbox"
          aria-hidden
          tabIndex={-1}
          name={name}
          value={value}
          form={form}
          checked={isOn}
          required={required}
          disabled={disabled}
          readOnly
          className="pointer-events-none absolute m-0 size-px -translate-x-full opacity-0"
        />
      )}
    </>
  );
}
