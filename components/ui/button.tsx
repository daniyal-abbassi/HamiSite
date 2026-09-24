import * as React from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[15px] font-semibold",
    "transition-[transform,box-shadow,background,color]",
    "active:translate-y-px",
    /*
     * The ring is declared here rather than inherited.
     *
     * It used to come only from `:where(a, button, …):focus-visible` in `app/globals.css`. `:where()` has
     * zero specificity, so any `outline-*` utility on a single button — or any component rule like
     * `.cat-panel:focus-visible` — silently took the focus indicator away, and the control looked
     * untargetable to the one user who needs to see it. Declaring it on the primitive makes the ring the
     * default rather than the leftover.
     *
     * `var(--aqua)` is a literal hex at `:root`, and `.band-paper` re-points it at oxblood, so a button
     * inside one of the light chapters gets a ring that is actually visible on ivory. Champagne on paper
     * is 1.30:1.
     */
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--aqua)]",
    /*
     * `disabled:pointer-events-none` stays, and §9's request to give a disabled control a
     * reason is answered somewhere else — measured, not assumed.
     *
     * Taking it out does make a `title` reachable, which is what the brief wanted. It also
     * lets `:hover` match a control that cannot be pressed, and every variant here carries
     * a hover treatment: `hover:-translate-y-0.5`, `hover:bg-aqua/10`, `hover:bg-accent`.
     * A disabled pill that lifts and lights up on approach claims it is pressable, which is
     * a worse lie than silence. `disabled:cursor-not-allowed` is equally dead, since the
     * element takes no pointer events at all.
     *
     * The reason is not actually missing either. On the only disabled control in the
     * shopper-facing path — the sold-out add button on a product card — the card's own
     * stock row renders «ناموجود» in words, and the button carries `aria-label="ناموجود"`.
     * So the requirement is met by the card, where it is visible to sighted and screen
     * reader alike, rather than by a tooltip that cannot fire.
     */
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // Gold pill — the "money" CTA (signup, submit, place order). Maps to
        // --primary, which resolves to aqua in this world.
        default:
          "bg-gradient-to-b from-aqua-lite to-aqua text-primary-foreground shadow-glow-cta hover:-translate-y-0.5 hover:shadow-glow-brass",
        // Oxblood pill — the general primary action, used more often than
        // aqua in the reference world (e.g. the hero's main CTA).
        oxblood:
          "bg-gradient-to-b from-oxblood-lite to-oxblood text-white shadow-glow-oxblood hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(100,2,17,0.65)]",
        outline: "border border-aqua/60 bg-transparent text-aqua hover:bg-aqua/10",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "border border-line bg-foreground/5 text-foreground hover:bg-foreground/10",
        link: "rounded-none text-aqua underline-offset-4 hover:underline",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-[52px] px-8 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Loading state: disables the button, shows a spinner, sets aria-busy. */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", loading = false, disabled, children, ...props }, ref) => (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, className }), loading && "pointer-events-none opacity-70")}
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
