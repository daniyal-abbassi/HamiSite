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

/** How long a failed add stays on screen before the control returns to idle. Long
 * enough to read «موفق نشد» and hear the reason; short enough that a card grid of
 * them does not sit there looking broken. */
const ERROR_HOLD_MS = 4000;

/** Persian, keyed on the API's `error.code`. Each line says only what that response
 * actually establishes — `CONFLICT` is the only code the cart route raises for both
 * "out of stock" and "not enough left", so the copy covers the two with one sentence
 * rather than guessing which. */
const FAILURE_COPY: Record<string, string> = {
  CONFLICT: "موجودی این محصول کافی نیست. برای هماهنگی تماس بگیرید.",
  NOT_FOUND: "این محصول دیگر قابل خرید نیست.",
  BAD_REQUEST: "این محصول را نشد به سبد اضافه کرد.",
  VALIDATION_FAILED: "این محصول را نشد به سبد اضافه کرد.",
  FORBIDDEN: "حساب شما اجازه افزودن این محصول را ندارد.",
  INTERNAL_ERROR: "سبد خرید به‌روز نشد. دوباره امتحان کنید.",
  NETWORK: "سبد خرید به‌روز نشد. اتصال شبکه را ببینید و دوباره امتحان کنید.",
};

/** Quick add-to-cart island for the (server) ProductCard — adds one unit of the
 * product (no variant; the API resolves the product price) and opens the drawer.
 * A 401 redirects to login, preserving the current page as `next`.
 *
 * Every other failure is **said**. The comment this replaced claimed the drawer
 * would surface stock errors "on the next open", which asked a shopper who just
 * pressed «افزودن» and saw nothing happen to go and open a panel that never
 * announced itself. FR-046 counts a silent failure as a jump: the control moved,
 * the state did not, and the page gave no reason. So a failed add now says why in
 * Persian, in the button's own footprint, and returns to idle.
 */
export function AddToCartButton({ productId, disabled = false, iconOnly = false, className, style }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { addItem } = useCart();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [failure, setFailure] = useState<string | null>(null);

  if (disabled) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        aria-label="ناموجود"
        style={style}
        className={className}
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
        setState("idle");
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      // Keyed on the envelope's `code`, never on `cause.message`: the API's own
      // strings are English ("Insufficient stock"), and FR-011 puts Persian in the
      // interface. A code we do not recognise gets the honest general case rather
      // than a guess about what went wrong.
      const code = cause instanceof ApiClientError ? cause.code : "NETWORK";
      setFailure(FAILURE_COPY[code] ?? FAILURE_COPY.NETWORK);
      setState("error");
      window.setTimeout(() => {
        setState("idle");
        setFailure(null);
      }, ERROR_HOLD_MS);
    }
  }

  const failed = state === "error";

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        loading={state === "loading"}
        onClick={() => void handleClick()}
        aria-label={failed && iconOnly ? (failure ?? "افزودن به سبد خرید") : "افزودن به سبد خرید"}
        style={style}
        className={cn(failed && "text-destructive", className)}
      >
        {iconOnly ? (
          failed ? (
            <Ban className="size-5" />
          ) : state === "done" ? (
            <Check className="size-5" />
          ) : (
            <ShoppingCart className="size-5" />
          )
        ) : (
          <>
            {failed ? (
              <Ban className="size-4" />
            ) : state === "done" ? (
              <Check className="size-4 text-emerald-400" />
            ) : (
              <Plus className="size-4 text-aqua" />
            )}
            {failed ? "موفق نشد" : state === "done" ? "افزوده شد" : "افزودن"}
          </>
        )}
      </Button>
      {/* The reason, said out loud.
          ----------------------------------------------------------------
          Absolutely positioned, so it costs the card no height — FR-046's whole
          point is that a failed add must be legible without becoming a layout
          event, and the measurement agrees: the card holds 392.06px through the
          failure at 360 and 567.6px at 1280, and the button's box is unchanged
          once hover is taken out of it.
          Two deliberate departures from the house error idiom
          (`text-destructive` on `bg-destructive/10`): the only live caller renders
          this control inside a **white** product card, and #E4573F on #ffffff
          measures 3.66:1 — the idiom fails AA at this size on this ground. A solid
          #8E1B10 chip with white text measures 9.07:1 and survives both grounds.
          It is also `role="alert"` rather than `sr-only`: the iconOnly control has
          no room for words, so without this a sighted shopper gets an icon and a
          colour and no Persian sentence at all. */}
      {failed && failure && (
        <span
          role="alert"
          className="pointer-events-none absolute bottom-2.5 start-2.5 z-20 max-w-[calc(100%-1.25rem)] rounded-lg bg-[#8E1B10] px-2.5 py-1.5 text-[11px] font-bold leading-5 text-white"
        >
          {failure}
        </span>
      )}
    </>
  );
}
