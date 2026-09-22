"use client";

import { usePathname } from "next/navigation";
import { FALLBACK_TONE } from "@/lib/atmosphere/progression";
import { useAtmosphereGround, GROUND_PROPERTY } from "./useAtmosphereGround";
import "./page-ground.css";

/**
 * The scroll-driven page ground.
 *
 * One fixed, inert, aria-hidden layer whose only job is to carry the colour the hook resolved for the
 * shopper's current position. It is mounted in `app/(main)/layout.tsx` as the first child of
 * `.site-shell`, ahead of `.noir-stars` and `<main>`, and that placement is load-bearing:
 *
 * **A transformed ancestor becomes the containing block for `position: fixed` descendants.** Every
 * homepage section is wrapped in `Reveal`, which animates `transform: translateY(26px)`, so a layer
 * placed inside `<main>` would stop being viewport-anchored the moment anything was mid-reveal. The
 * page has already been bitten by exactly this — `app/globals.css:290-294` records `background-attachment:
 * fixed` failing inside a `Reveal` wrapper. Layout level is the only place it is safe (research.md D3).
 *
 * It is a **tint, not a new light source.** Resolved Q2 = C left the existing five-glow field on `body`
 * exactly as it was, and FR-005 requires the combination to read *calmer* than the field alone. So this
 * layer is the stage colour at partial opacity over what is already there: it pulls the whole ground
 * toward one direction and, in doing so, flattens the left-right-left alternation of the per-section
 * glows rather than adding to it. That is the reconciliation FR-018 asks for, achieved by subtraction.
 *
 * There is no transition on the colour, on purpose — see the hook. The value changes every frame, so a
 * transition would make the ground lag the content, which contract S4 forbids.
 *
 * Contract A3 and G1: nothing here is in the accessibility tree, nothing here carries meaning, and
 * deleting the component entirely leaves the page complete.
 *
 * **Homepage only.** The spec scopes this feature to the first page — "the listing, product,
 * partnership, and administrative pages … inherit the page's existing single ground unchanged". The
 * layer is mounted in the layout because that is the only place it escapes the `Reveal` transforms, so
 * it gates itself on the pathname instead. The hook stays registered either way (hooks cannot be
 * conditional); it exits before adding any listener.
 */
export function PageGround() {
  const pathname = usePathname();
  const enabled = pathname === "/";
  useAtmosphereGround(enabled);

  if (!enabled) return null;

  return (
    <div
      className="hami-page-ground"
      aria-hidden="true"
      data-hami-ground={GROUND_PROPERTY}
      style={{ backgroundColor: `var(${GROUND_PROPERTY}, ${FALLBACK_TONE})` }}
    />
  );
}
