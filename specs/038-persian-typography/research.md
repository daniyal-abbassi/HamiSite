# Research: Persian Typography Refresh

**Feature**: [spec.md](spec.md) | **Guide**: [FarsiUI Persian Typography](https://farsiui.ir/skills/persian-typography)

## Current baseline

`app/globals.css` loads self-hosted variable Estedad and Vazirmatn Arabic/Latin subsets plus Latin-only DM Mono. `--font-vazirmatn` currently resolves to Estedad first, then Vazirmatn, despite the token name. The code comment records that the owner previously requested Estedad in place of Vazirmatn. `body` sets zero letter spacing and 1.8 line height, but component styles often set 9–13px labels, very heavy headings, and independent scales. `components/shop/shop-luxury.css` and `app/(main)/home.css` have many small, locally chosen treatments. `app/globals.css` already includes an intentional mobile floor that hides decorative 8–9px text and raises 10px content to 12px; implementation must preserve the owner's reason for that rule while replacing underlying small styles where needed. The current draft may therefore feel unsatisfactory for reasons beyond the family choice.

The existing `docs/persian-typography.md` is a general reference and contains example paths from another project; it is not an implementation contract for this repository. The newly installed `.cursor/rules/persian-typography.mdc` is the selected FarsiUI source, with a local agent copy under `.agents/skills/persian-typography/SKILL.md`.

## Decision 1: Compare complete typography treatments before selecting a face

**Decision**: Use the existing Estedad and Vazirmatn assets to create side-by-side treatments of the same five core screens. Both treatments must vary scale, weight, line height, density, and headline/body relationship as a coherent system. Select using legibility, mixed-script quality, premium character, and the owner's side-by-side assessment; retain the current screen as baseline.

**Rationale**: The owner dislikes the present result, yet previously replaced Vazirmatn with Estedad. The current problem cannot be diagnosed from the font name alone. A controlled comparison makes the design choice reviewable and avoids pretending the earlier decision never happened.

**Alternatives considered**: Immediate switch back to Vazirmatn (ignores the owner's prior rejection); keep Estedad and change only tiny labels (may not produce a perceptible redesign); introduce a third family now (adds a licensing and loading decision before visual evidence). A third family can be considered if both existing candidates fail the spec's review.

## Decision 2: Keep font delivery local and prove usage rights

**Decision**: Reuse the existing WOFF2 files and `font-display: swap` strategy for comparison. Before release, record each selected asset's upstream source and license in implementation evidence. Do not treat a font file present in `public/fonts/` as proof of permission; local files contain no license document in this checkout.

**Rationale**: Current builds and rendering do not depend on Google Fonts, and the self-hosted assets already contain Arabic and Latin subsets. The FarsiUI guide requires actual license verification and checking fallback behavior. The available font metadata identifies family and weight range, but did not supply a license field.

**Alternatives considered**: Fetching a remote font at runtime (unnecessary dependency); adding another local family without source/license review (unjustified); assuming possession grants redistribution rights (not acceptable).

## Decision 3: Centralize roles, keep contextual variation

**Decision**: Define a compact shared type-role scale for display, page and section headings, body, supporting text, labels, controls, captions, and numeric emphasis. Start from the guide's Persian ranges (body around 15–17px, captions around 12–13px, controls around 14–16px, appropriate line height), then verify on actual screens. Keep Persian letter spacing at zero and avoid synthesizing weights. Allow purposeful editorial display and denser admin data as long as legibility criteria pass.

**Rationale**: The global body rule is already reasonable; most inconsistency lies in component overrides and small custom labels. Shared roles reduce drift without forcing identical layouts.

**Alternatives considered**: A blanket minimum font-size override (can break layout and hierarchy); rewriting every component with a new typography framework (unnecessary scope); leaving each component to choose ad hoc sizes (preserves inconsistency).

## Decision 4: Preserve numeric and bidirectional meaning

**Decision**: Keep `lib/utils.ts` as the current authority for visible `formatToman` and `toFaDigits` behavior. Compare it with the untracked RTL helper before changing any formatting path. Use Persian digits and separators for user-facing localized quantities and prices; retain canonical values for inputs and data. Isolate inherently Latin codes and values only where their visual ordering is ambiguous. Preserve ZWNJ and long-string meaning.

**Rationale**: The typography refresh is primarily visual and should not fork price formatting, fabricate unavailable prices, or interfere with existing RTL work.

**Alternatives considered**: A second formatter for this feature (creates divergent output); global digit replacement in all strings (would damage identifiers and URLs); forcing a whole Persian sentence to LTR to fix one code (changes reading order).

## Decision 5: Verify rendering and fallback, not only source classes

**Decision**: Inspect actual rendered font, line boxes, wraps, and font requests at phone/desktop widths and 200% zoom. Check a late or blocked preferred font. Re-run application gates and inspect hydration after build, accounting for the documented stale Next server trap.

**Rationale**: A CSS declaration does not prove the intended glyphs rendered, and component-level overrides may defeat a shared scale. User-visible readability and action stability are the outcomes.

**Alternatives considered**: Source-only search for tiny classes (useful inventory but not proof); screenshot-only review after fonts have loaded (misses fallback and layout shift); database-backed test run (unnecessary and hazardous for presentation-only changes).
