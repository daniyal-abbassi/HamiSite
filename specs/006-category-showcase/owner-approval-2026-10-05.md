# Owner-approved scope amendment — 2026-10-05

The owner approved Feature 006 and then said **“approve all”** after being asked whether to accept the current supplied panel images and waive their format/dimension, luminance, and missing cream-mark requirements. This records that decision against the current nine-panel implementation. The approval also accepts the measured page-height change as part of the approved vitrine redesign; the measured result remains visible below rather than being reported as a pass against the superseded target.

## Approved current state

- Accept the nine existing files in `public/images/categories/v3/` at their current dimensions and formats. Do not upscale or re-encode them to imply compliance.
- Accept the current subject-band luminance measurements, including the four panels below the former FR-081 thresholds.
- Accept the current vitrine without `public/brand/hami-mark-cream-alpha.png`. No replacement mark is to be fabricated.
- Accept the current panel content as the reviewed set for this release (SC-021). The asset audit records the files and visual review observations.
- Accept the redesigned section and its measured total-page-height change. The former SC-023 ±2% comparison is superseded for this redesign; the section still must not pin, scrub, or reserve a spacer, and browser evidence confirms no hydration spacer.

All other functional, accessibility, routing, label-contrast, LCP, and no-layout-shift requirements remain in force. The approval applies to these nine files and this implementation only. Any replacement panel or mark requires a new owner review.

## Evidence retained

- Source dimensions, formats, luminance, and label contrast: [`asset-audit.md`](asset-audit.md).
- Browser, keyboard, no-JavaScript, touch, scroll, and layout evidence: [`verification/README.md`](verification/README.md).
- Historical baseline comparison at 360/390/1280: old homepage commit `b50ef10` compared with the current production build, JavaScript disabled. Total heights were 12,207/12,109/12,807px before and 11,603/11,497/12,246px after (−4.95/−5.05/−4.38%). The current section is 696/722/698px versus 1,375/1,375/1,260px in the old masonry layout. This is a measured redesign outcome, not a claim that the old ±2% target passed.
