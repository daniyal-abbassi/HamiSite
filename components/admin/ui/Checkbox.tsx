/** Hand-built for this repo — no upstream counterpart. The kit's `data-table.tsx` imports a
 * `checkbox` primitive that ships on `@radix-ui/react-checkbox`; this repo has no Radix and
 * `components/ui/` is another agent's territory (research.md R7), so the admin's checkbox is a real
 * `<input type="checkbox">` wearing tokens.
 *
 * A native input rather than a styled `div` is the whole point: it is focusable, it toggles on Space,
 * it submits with a form, and `indeterminate` is a real DOM state the accessibility tree already
 * knows how to announce — none of which has to be re-implemented here.
 */

"use client";

import { useEffect, useId, useRef } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<React.ComponentPropsWithoutRef<"input">, "type"> & {
  /** Visible label, associated by `htmlFor`. Omit it only for a checkbox whose column header or
   * surrounding cell already names it — and pass `aria-label` in that case. */
  label?: React.ReactNode;
  /** Mixed state («انتخاب بعضی»). A DOM property, not an attribute, so it is set imperatively below.
   * Meant for controlled use: pass it with `checked`. */
  indeterminate?: boolean;
  /** Kit-shaped callback — the vendored files call this name. `onChange` still works too, because
   * the rest of these props land on the `<input>`. */
  onCheckedChange?: (checked: boolean) => void;
  /** On the outer element, because callers position the whole control, not its input. */
  className?: string;
};

/** The painted box. `appearance-none` strips the UA checkbox so the tokens below are what shows;
 * 24px satisfies WCAG 2.5.8's target minimum, and the real target is larger — when there is no label
 * the box sits inside a 44px pad, and when there is one the label text is the rest of the target,
 * because a thumb aims at the words, not at a 24px square.
 *
 * No hover restyle: `hover:border-*` and `checked:border-*` are the same specificity, so which one
 * wins depends on Tailwind's variant ordering rather than on anything readable here, and the losing
 * case is a checked box whose border dims under the cursor. The pointer cursor and the fill change
 * carry the interaction.
 *
 * Focus is deliberately not styled here. `app/globals.css` already paints a 2px champagne
 * `:focus-visible` outline on every `input`, and a second definition in a component is how a site
 * ends up with three different rings. */
const BOX = cn(
  "peer size-full cursor-pointer appearance-none rounded-md border border-line bg-transparent",
  "transition-colors duration-fast",
  "checked:border-champagne checked:bg-champagne",
  "indeterminate:border-champagne indeterminate:bg-champagne",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export function Checkbox({
  label,
  indeterminate = false,
  onCheckedChange,
  className,
  id,
  disabled,
  onChange,
  ...inputProps
}: CheckboxProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const mark = (
    <span className="relative inline-flex size-6 shrink-0 items-center justify-center">
      <input
        {...inputProps}
        ref={inputRef}
        id={inputId}
        type="checkbox"
        disabled={disabled}
        className={BOX}
        onChange={(event) => {
          onChange?.(event);
          onCheckedChange?.(event.target.checked);
        }}
      />
      {/* Both marks sit over the box and are revealed by the input's own pseudo-class, so the fill
          and the glyph can never disagree — there is no React state that could drift. The tick is
          opacity-toggled and the dash display-toggled: different properties, so a controlled
          checkbox that is checked *and* indeterminate shows the dash (it is later in the cascade)
          rather than two glyphs stacked. */}
      <Check
        aria-hidden="true"
        className="pointer-events-none absolute size-4 opacity-0 text-ink transition-opacity duration-fast peer-checked:opacity-100"
      />
      <Minus aria-hidden="true" className="pointer-events-none absolute hidden size-4 text-ink peer-indeterminate:block" />
    </span>
  );

  if (!label) {
    // No text to tap: the label element still wraps the box so the hit pad is 44px wide and tall,
    // with the 24px box centred in it.
    return (
      <label
        htmlFor={inputId}
        className={cn("inline-grid size-11 shrink-0 place-items-center", disabled && "cursor-not-allowed", className)}
      >
        {mark}
      </label>
    );
  }

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "inline-flex select-none items-center gap-2.5 text-[13px] leading-5 text-foreground",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      {mark}
      <span className="min-w-0">{label}</span>
    </label>
  );
}
