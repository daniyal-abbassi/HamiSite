"use client";

import { usePathname } from "next/navigation";
import { House, Store, UserRound, Handshake, Phone } from "lucide-react";
import { LiquidSelection } from "@/components/liquid/LiquidSelection";
import { useAuth } from "@/components/providers/AuthProvider";
import { storeContact } from "@/lib/content/contact";

/**
 * The bottom navigation dock — the primary navigation on mobile.
 *
 * ## Why it moved here
 *
 * This used to live in `components/home/TrustBlocks.tsx` and was rendered from
 * `app/(main)/page.tsx`. That put sitewide navigation chrome inside a home-page
 * content module, with two consequences that were invisible from the home page:
 *
 * 1. **Every other page had no bottom navigation at all.** Shop, product, cart
 *    and checkout — the entire buying path — shipped without it.
 * 2. **`active` was hardcoded `true` on «خانه»**, so even where it did render it
 *    claimed the home tab was current no matter where you were.
 *
 * Mounting it in the layout fixes both, and route state now comes from
 * `usePathname()` rather than a literal.
 *
 * The «تماس» entry came back, but not as it was. The old tab pointed at
 * `#contact`, an in-page anchor that resolves to nothing on any route except the
 * home page — a dead tab on four of the five pages it appeared on. This one is a
 * `tel:` request, so it works wherever it is rendered, which is what FR-039 asks
 * for: reach a human in one interaction from any product, including from a grid
 * of cards, where no single card should carry a phone button.
 *
 * Account shares the bar with it, which is also where the header's account
 * control went when search claimed that space.
 *
 * ## Interface
 *
 * There is none: mount it once in the layout. Everything it needs — the current
 * route and whether anyone is signed in — it reads itself. Callers cannot get it
 * wrong and there is nothing to keep in sync at the call site.
 */

type DockItem = {
  href: string;
  label: string;
  Icon: typeof House;
  /** Matches nested routes too — /shop is active on /shop/some-phone. */
  prefix?: boolean;
  /**
   * A dial request rather than a route: rendered as a plain anchor, because no
   * `active` state can apply and the router has nothing to do with it. This is
   * what makes FR-039's "one interaction from any product" true on a phone
   * without a call button on every one of 189 cards.
   */
  dial?: boolean;
};

export function MobileDock() {
  const pathname = usePathname();
  const { status } = useAuth();

  const items: DockItem[] = [
    { href: "/", label: "خانه", Icon: House },
    { href: "/shop", label: "فروشگاه", Icon: Store, prefix: true },
    { href: "/partners", label: "همکاری", Icon: Handshake, prefix: true },
    { href: storeContact.phoneHref, label: "تماس", Icon: Phone, dial: true },
    // Signed-out users get the login screen; signed-in users get their orders.
    // `status` is "loading" on first paint, and sending someone to /login by
    // mistake is the more annoying of the two errors, so loading follows the
    // signed-in target and the route itself redirects if that was wrong.
    {
      href: status === "guest" ? "/login" : "/orders",
      label: "حساب",
      Icon: UserRound,
      prefix: true,
    },
  ];

  const isActive = (item: DockItem) =>
    item.href === "/" ? pathname === "/" : item.prefix ? pathname.startsWith(item.href) : pathname === item.href;

  /* The one destination the marker rests under. `null` when nothing matches —
     /cart and /checkout are reachable pages with no tab of their own, and a
     marker that defaulted to «خانه» there would be the exact bug this component
     was moved into the layout to fix. */
  const current = items.find((item) => !item.dial && isActive(item))?.label ?? null;

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md items-center rounded-full border border-champagne/25 bg-ink-2 py-1.5 shadow-monolith md:hidden"
      aria-label="ناوبری سریع فروشگاه"
    >
      <LiquidSelection
        className="w-full"
        itemClassName="flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-xs font-bold active:scale-95"
        equalWidth
        markerInset={6}
        value={current}
        items={items.map((item) => ({
          id: item.label,
          label: (
            <>
              <span className="relative">
                <item.Icon className="size-[18px]" aria-hidden="true" />
              </span>
              <span>{item.label}</span>
            </>
          ),
          // A dial request is not a route, so it bypasses the router — and it is
          // never marked, because no page became current when you tap it.
          ...(item.dial ? { href: item.href, marked: false } : { to: item.href }),
        }))}
      />
    </nav>
  );
}
