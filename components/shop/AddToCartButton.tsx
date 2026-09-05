"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/providers/CartProvider";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Props = {
  productId: number;
  /** When the product can't be purchased right now, render a disabled ghost. */
  disabled?: boolean;
  className?: string;
};

/** Quick add-to-cart island for the (server) ProductCard — adds one unit of the
 * product (no variant; the API resolves the product price) and opens the drawer.
 * A 401 redirects to login, preserving the current page as `next`. */
export function AddToCartButton({ productId, disabled = false, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { addItem } = useCart();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  if (disabled) {
    return (
      <Button variant="ghost" size="sm" disabled className={cn("pointer-events-none", className)}>
        ناموجود
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
      className={className}
    >
      {state === "done" ? <Check className="size-4 text-emerald-400" /> : <Plus className="size-4 text-gold" />}
      {state === "done" ? "افزوده شد" : "افزودن"}
    </Button>
  );
}
