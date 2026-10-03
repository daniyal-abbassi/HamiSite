// Vendored from marmelab/shadcn-admin-kit (MIT) — src/components/admin/spinner.tsx, 2026-10-01.
// Modified: imports repointed to this repo; ra-core coupling removed.
// Upstream had no coupling to remove — this file is the only admin component in the kit that
// already imported nothing but `cn`, `cva` and `lucide-react`. Restyling is deliberately NOT
// done here (task 015-C); the token classes below are still the kit's shadcn defaults.
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";

const spinnerVariants = cva("flex-col items-center justify-center", {
  variants: {
    show: {
      true: "flex",
      false: "hidden",
    },
  },
  defaultVariants: {
    show: true,
  },
});

const loaderVariants = cva("animate-spin text-primary", {
  variants: {
    size: {
      small: "size-6",
      medium: "size-8",
      large: "size-12",
    },
  },
  defaultVariants: {
    size: "medium",
  },
});

interface SpinnerContentProps
  extends
    VariantProps<typeof spinnerVariants>,
    VariantProps<typeof loaderVariants> {
  className?: string;
}

/** Animated spinner component for loading states. */
export function Spinner({ size, show, className }: SpinnerContentProps) {
  return (
    <span className={spinnerVariants({ show })}>
      <Loader2 className={cn(loaderVariants({ size }), className)} />
    </span>
  );
}