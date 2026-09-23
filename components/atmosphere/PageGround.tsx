"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { FALLBACK_TONE } from "@/lib/atmosphere/progression";
import { useAtmosphereGround, GROUND_PROPERTY } from "./useAtmosphereGround";
import "./page-ground.css";

/**
 * The scroll-driven page ground.
 *
 * One fixed, inert, aria-hidden layer whose only job is to carry the colour the hook resolved for the
 * shopper's current position. It is mounted in `app/(main)/layout.tsx` as the first child of
 * `.site-shell`, ahead of `<main>`, and that placement is load-bearing:
 *
 * **A transformed ancestor becomes the containing block for `position: fixed` descendants.** Every
 * homepage section is wrapped in `Reveal`, which animates `transform: translateY(26px)`, so a layer
 * placed inside `<main>` would stop being viewport-anchored the moment anything was mid-reveal. The
 * page has already been bitten by exactly this — `app/globals.css:290-294` records `background-attachment:
 * fixed` failing inside a `Reveal` wrapper. Layout level is the only place it is safe (research.md D3).
 *
 * It is a **tint, not a new light source.** Resolved Q2 = C left the existing five-glow field exactly as
 * it was. The claim originally recorded here — that a uniform alpha would "flatten the left-right-left
 * alternation of the per-section glows, achieving reconciliation by subtraction" — was measured and is
 * false: the glows live on `main > section::before/::after` at `z-10`, above this layer at `z-0`, so
 * nothing this layer does can damp them (`notes/busyness.md`). The owner kept Q2 = C anyway and waived
 * the clause that required it, so what this layer contributes is direction and nothing more.
 *
 * There is no transition on the colour, on purpose — see the hook. The value changes every frame, so a
 * transition would make the ground lag the content, which contract S4 forbids.
 *
 * The custom property is written **on this element**, not on `documentElement`. It has exactly one
 * consumer, and a root-level custom property invalidates style for the whole document on every frame.
 * See T047 in `notes/scroll-easing.md` for the measurement that found this.
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
  const surface = useRef<HTMLDivElement>(null);
  useAtmosphereGround(enabled, surface);

  if (!enabled) return null;

  return (
    <div
      ref={surface}
      className="hami-page-ground"
      aria-hidden="true"
      style={{ backgroundColor: `var(${GROUND_PROPERTY}, ${FALLBACK_TONE})` }}
    />
  );
}
