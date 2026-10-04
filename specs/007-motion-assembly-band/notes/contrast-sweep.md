# Settled-band contrast check

**Date:** 2026-10-04  
**Scope:** Accepted no-pin composition at 360px, settled state. The old 20-position animation sweep and “soft phase” do not apply because the band has no scroll-linked sequence.

A browser check sampled the first 20 non-empty headings, paragraphs, and links in the rendered band and composited each computed foreground (including alpha) against its ancestor backgrounds and the authored `#111114` band ground. The worst sampled ratio was **8.61:1** (muted body copy), above the 4.5:1 text floor. Headings and standard copy measured 16.05:1 and 8.61:1; champagne accents measured 12.84:1. This does not claim historical or transient-state contrast.

Print emulation at 360px showed all three headings, all copy and three links visible, with no hidden text; the band is `position: static`. Forced-colours emulation showed headings black, links blue, and no hidden text. Detailed print/forced-colours visibility was also checked at 1280px in the P4 browser pass.

The authored band background remains `rgb(17, 17, 20)`. The no-pin foundation/drift checks and their required negative control are recorded in the `.2` issue evidence and `verification/no-pin-foundation.mjs`.
