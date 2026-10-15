# Contract: Observable Persian Typography

**Feature**: [spec.md](../spec.md)

This is a rendered interface contract. It adds no public API or persistent data format.

## Shared roles

| Role | Observable result |
| --- | --- |
| Display and headings | Clear order of importance, complete Persian marks and joins, controlled wraps, and deliberate premium expression |
| Body and supporting text | Readable width, size, and line spacing on phone and desktop; secondary text remains legible |
| Labels and controls | Full text and associated input or action remain visible at normal and 200% zoom; long errors remain connected to the control |
| Prices and numeric data | Persian localized display where appropriate, clear unit association, and aligned values in comparable rows/columns |
| Latin runs in Persian context | Official spelling and intended reading order for brands, models, URLs, and codes without reversing the surrounding sentence |

## Surface matrix

| Surface | Required sample |
| --- | --- |
| Core storefront | Home, shop, one current product, cart, checkout; phone and desktop |
| Customer | Login/register and account state, including a long label or error |
| Partner | Representative partner form or bundle and dense value |
| Admin | Dashboard metric, table, and form control |
| Telegram mini-app | Product/order state with mixed script or numbers |

## Required edge behavior

- Persian words remain joined, with intentional half-spaces and natural punctuation.
- Long product names and prices retain critical meaning when space is limited.
- Technical identifiers and inherently LTR fields preserve predictable order and cursor behavior.
- During late font load or fallback, essential copy and actions remain legible and usable.
- At 200% zoom, no essential text overlaps, clips, or hides an action on the five core screens.
- The selected family has documented project-appropriate usage rights before release.

## Evidence and acceptance

For each sampled screen, record route, content state, viewport, rendered family, candidate, reading result, and any finding. A source declaration or successful HTTP response alone is insufficient. Compare the same five core screens before and after; the owner's assessment of at least four as clearer and more premium satisfies SC-005. Other success criteria are checked against the counts and conditions in [spec.md](../spec.md).
