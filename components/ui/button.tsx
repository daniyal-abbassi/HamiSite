import * as React from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[15px] font-semibold transition-[transform,box-shadow,background,color] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Gold pill — the "money" CTA (signup, submit, place order). Maps to
        // --primary, which resolves to gold in this world.
        default:
          "bg-gradient-to-b from-gold-lite to-gold text-primary-foreground shadow-glow-gold hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(201,162,39,0.45)]",
        // Oxblood pill — the general primary action, used more often than
        // gold in the reference world (e.g. the hero's main CTA).
        oxblood:
          "bg-gradient-to-b from-oxblood-lite to-oxblood text-white shadow-glow-oxblood hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(100,2,17,0.65)]",
        outline: "border border-gold/60 bg-transparent text-gold hover:bg-gold/10",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "border border-line bg-foreground/5 text-foreground hover:bg-foreground/10",
        link: "rounded-none text-gold underline-offset-4 hover:underline",
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
