# Quickstart: Homepage Hero Redesign

## Local visual review

1. From the repository root, check existing Next processes and the owner of port 3000 before starting a server, following the **Dev server — the stale-build trap** section in `CLAUDE.md`.
2. Run `npm run dev` and open `http://localhost:3000/` in a real browser.
3. Review the hero at CSS viewport widths **320, 390, 768, 1024, and 1440px**. Check:
   - mobile RAW art and image-first composition below 1024px;
   - desktop RAW art with left showroom and right-hand copy at 1024px and wider;
   - the current fixed header remains usable and does not hide hero copy;
   - no text, icon, or CTA clips, overlaps, or causes horizontal scrolling;
   - `/shop` and `/partners` links navigate correctly;
   - keyboard focus and reduced-motion preference keep all content visible/usable;
   - only the matching desktop/mobile background is requested.
4. Run `npm run typecheck`.
5. Run `npm run build` only after recording any running dev server. A build rewrites `.next`; restart the server before trusting a later local render.

## Completion evidence

Keep browser screenshots for the 390px and 1440px states with the feature review, and record the typecheck/build results. A successful page response alone is insufficient; verify the referenced `/_next/static/chunks/*.js` files return successfully as described in `CLAUDE.md`.
