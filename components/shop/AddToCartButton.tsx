"use client";

import type React from "react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Ban, Check, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/providers/CartProvider";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Props = {
  productId: number;
  /** When the product can't be purchased right now, render a disabled ghost. */
  disabled?: boolean;
  /**
   * Cart-glyph only, no label — for card layouts where the buy control is a
   * single filled square beside the price. The accessible name comes from
   * `aria-label`, which is set either way, so dropping the text costs nothing
   * to a screen reader.
   */
  iconOnly?: boolean;
  className?: string;
  /** Inline styles, for card variants that theme the control per ground. */
  style?: React.CSSProperties;
};

/** Quick add-to-cart island for the (server) ProductCard — adds one unit of the
 * product (no variant; the API resolves the product price) and opens the drawer.
 * A 401 redirects to login, preserving the current page as `next`. */
export function AddToCartButton({ productId, disabled = false, iconOnly = false, className, style }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { addItem } = useCart();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  if (disabled) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        aria-label="ناموجود"
        style={style}
        className={cn("pointer-events-none", className)}
      >
        {iconOnly ? <Ban className="size-5" aria-hidden="true" /> : "ناموجود"}
      </Button>
    );
  }

  async function handleClick() {
    setState("loading");
    try {
      await addItem(productId);
      setState("done");
      window.setTimeout(() => setState("idle"), 1600);
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.code === "AUTH_REQUIRED") {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      // Stock/availability errors surface in the drawer on the next open —
      // the card stays silent rather than growing an inline error zone.
      setState("idle");
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={state === "loading"}
      onClick={() => void handleClick()}
      aria-label="افزودن به سبد خرید"
      style={style}
      className={className}
    >
      {iconOnly ? (
        state === "done" ? <Check className="size-5" /> : <ShoppingCart className="size-5" />
      ) : (
        <>
          {state === "done" ? <Check className="size-4 text-emerald-400" /> : <Plus className="size-4 text-aqua" />}
          {state === "done" ? "افزوده شد" : "افزودن"}
        </>
      )}
    </Button>
  );
}
