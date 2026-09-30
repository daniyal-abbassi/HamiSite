# Partners visual redesign

User direction: redesign the existing page as a luxury Hami Hamrah experience, informed by UseLayouts and Componentry. The existing 013 specification supplies the functional constraints; this pass preserves the API and database.

## Design

UseLayouts' Editorial Deck informs a layered photographic composition with generous whitespace. Componentry's Layered Stack informs restrained transform transitions on that composition. These are visual references, not copied source or new dependencies.

References: https://uselayouts.com/docs/components/editorial-deck and https://componentry.dev/docs/components/layered-stack (visually inspected in browser).

A burgundy editorial hero pairs Persian typography with existing store photography and an ivory invitation panel. A paper chapter carries the single three-step process and an application form alongside a concise document checklist and verified phone contact. Estedad, champagne, and existing store facts remain the brand foundation. No invented metrics, testimonials, response-time guarantees, or partnership claims.

## Implementation sequence

Implement page composition and isolated partners CSS first. Refine the existing form with native entity radios, grouped fields, clear uploads, companyName, input/error associations and visible submission states. Preserve the multipart endpoint and both document requirements. Use existing Reveal and CSS transforms with reduced-motion support. No shared navigation, homepage or API edits.

Execution tracking: Beads HamiSite-basic-structure-xn0, in accordance with the repository's task-tracking rule.

## Verification

Run TypeScript and the database-free unit suite. Inspect desktop and 360px/390px layouts in the browser, keyboard entity selection, validation and retained values. Exercise transport states with a local mock if available; never create real applications as visual-test data. Verify no horizontal overflow and readable form states. Record any unverified backend behavior explicitly.
