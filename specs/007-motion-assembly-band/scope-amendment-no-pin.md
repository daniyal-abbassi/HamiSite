# Scope amendment: composed band without pinning

**Status:** Accepted direction recorded 2026-10-04  
**Supersedes:** pinned-scroll requirements and choreography in `spec.md` and `blueprint.md` where they conflict with this amendment.  
**Evidence:** [`notes/band-geometry-measured.md`](./notes/band-geometry-measured.md).

## Decision

Keep the three closing homepage sections as one composed, normal-flow band with the word-level heading arrival. Do not use a sticky shell, spacer/track, scroll-driven timeline, or JavaScript scroll choreography. The pin experiment was measured at 360px: only 54.6px of real sticky travel was available, the scroll animation did not advance across 111 samples, and the phone and shop actions were below the viewport. The static composition already measures 2,345px at 360px against the former 2,961px three-section footprint.

The measured note records this as the chosen direction. The prior spec/blueprint predate that direction; this amendment controls wherever they disagree. Existing copy, real links, RTL reading order, server-rendered content, heading arrival, reduced-motion support, phone access, contrast, and page-ground alignment remain in scope.

## Revised requirements

- **FR-016 (revised):** The three closing sections render as one composed section in normal document flow. There is no pin, scroll track, spacer, or scroll-progress animation. Preserve the three headings and verified content in the settled composition.
- **FR-007 / FR-018 (revised):** The phone and primary shop action remain ordinary reachable links in the composition's flow. Reserve measured clearance for the mobile dock at 360px; the dock's own contact link remains available. Do not claim frame-by-frame positional fixity.
- **FR-006 (revised):** With no scroll-linked animation state, reload/back/forward must preserve normal browser scroll restoration and never replay a band sequence. There is no animation frame to restore.
- **FR-009:** The composed band remains at or below 2,400px at 360px. Re-measure at 390px and 1280px; do not extrapolate the 360px result.
- **FR-010:** The rendered-section manifest, page-ground anchors, and drift guard remain aligned. Keep the guard's negative control requirement.
- **FR-011–FR-015:** Keyboard and assistive-technology access, reduced motion, static contrast, print/forced-colours output, verified copy, and evidence discipline remain requirements. Evaluate the single settled state where the old spec required sampling animation frames.

## Revised success criteria

- **SC-001:** Measure the normal-flow band's rendered height at 360px and confirm ≤2,400px. The recorded 2,345px is an existing measurement to recheck against the current page, not a substitute for current verification.
- **SC-002:** Confirm Persian words remain intact and headings use word-level wrappers. The historical before screenshots were never captured; do not claim pixel-identical comparison or recreate an alleged original screenshot.
- **SC-003–SC-005:** Verify first paint/reduced motion, no-JS content and links, and contrast in the static rendered state.
- **SC-006:** Confirm phone and shop actions are reachable, visible when in view, and clear the mobile dock at 360px.
- **SC-007:** Verify browser scroll restoration at representative positions; no animation replay criterion applies.
- **SC-008:** Compare current band text and links with the source content retained in repository history. Mark any comparison that cannot be reproduced as unavailable evidence, not a pass.
- **SC-009:** Run the existing section/ground drift guard and its negative control; sample the authored ground through the band.
- **SC-010:** Remains a human judgement and is not agent-closable.

## Known evidence gap

The pre-change screenshots and `content-before.json` were not captured before the section replacement. This is a documented historical gap. Do not fabricate those files or claim the screenshot comparison passed. Where historical source remains available, use read-only source history for copy/link comparison and cite its revision; otherwise keep the criterion explicitly unavailable.

## Execution order

1. Reconcile the feature spec, blueprint, task index, and Beads dependencies to this amendment.
2. Verify the current composed band, heading arrival, phone/shop access, no-JS and reduced-motion output, ground anchors, and measured lengths.
3. Run the drift guard negative control and remaining cross-cutting checks (print, forced colours, contrast, content parity).
4. Close only issues with named evidence. Keep the missing historical screenshot comparison and human visual judgement disclosed.
