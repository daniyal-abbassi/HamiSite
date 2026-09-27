# Data Model: Brand Card Identity

**Feature**: 011 | **Date**: 2026-09-26 | **Plan**: [plan.md](./plan.md) · **Decisions**: [research.md](./research.md)
**Evidence base**: [research/brand-identity-sources.md](./research/brand-identity-sources.md)

One new entity, the **brand identity record**, replacing the invented `brandStories` table in
`lib/content/home.ts`. It lives in a new pure module so that its claims are testable without a browser (D7).

---

## Entity: BrandIdentity

One record per maker, keyed by the same Latin display name the brand wall already uses.

| Field | Type | Rule |
|---|---|---|
| `name` | the six display names | Must match `brandWall` exactly. A seventh maker is one more row (FR-017). |
| `hueFamily` | `"blue" \| "orange" \| "yellow" \| "monochrome" \| "none"` | The maker's **documented** association. `"none"` means nothing was sourced — it is not a stylistic choice. |
| `hueSource` | `{ url, checkedAt, kind: "primary" \| "observed" \| "aggregator" \| "none" }` | Where the family came from. Only Xiaomi's is `observed` on the maker's own markup; the rest are `aggregator` or `none`, and **that is why the value is ours** (D2). |
| `hue` | number, OKLCH degrees | **Hami's value**, inside the family. Not the maker's registered colour and never labelled as one (FR-002a). |
| `chroma` | number | Bounded by the envelope. `0` for the two no-hue makers. |
| `lightness` | number | Inside the envelope, which is the same for all six. |
| `placement` | `"ground" \| "accent" \| "house"` | Where the hue goes. This is what separates the two blues without inventing a hue shift (D3), and what marks TCH as unsourced rather than quiet (D4). |
| `line` | Persian string, one line | **Required for all six** (FR-006). Our characterisation, not the maker's voice. |
| `lineSource` | `{ url, checkedAt }` | Required. An unsourced line does not ship (FR-007, SC-003). |
| `makerSlogan` | `{ text, url, checkedAt } \| null` | Recorded, **not rendered** — see the slogan rule below. |
| `forbiddenFramings` | Persian phrase list | Must never appear on this maker's card (FR-020). Asserted by test. |

### The six records

| Maker | `hueFamily` | Evidence | `placement` | The line (draft, Persian) | What it rests on |
|---|---|---|---|---|---|
| APPLE | `monochrome` | Apple publishes no brand colour; site metadata carries none | `accent` (neutral) | «از ۱۹۷۶، آمریکا؛ پنج خانواده محصول، به نام‌های خودش.» | founded 1976, American, five named product families |
| SAMSUNG | `blue` | corporate blue vs monochrome retail **contested**; hex aggregator-only | `accent` over near-neutral | «غول تولید کره جنوبی؛ پنجمین برند ارزشمند جهان (۲۰۲۴).» | Seoul conglomerate, 5th brand value 2024 |
| XIAOMI | `orange` | **#FF6900 observed on `mi.com/global`** — the only primary-ish value in the set | `ground` | «چینی، پکن؛ سومین فروشنده گوشی جهان (۲۰۲۵).» | Beijing, third in smartphones 2025 |
| NOKIA | `blue` | association in words; **no hex obtainable** | `ground` | «فنلاندی، متولد ۱۸۶۵؛ از آسیاب کاغذ تا شبکه‌های موبایل.» | founded 1865 as a pulp mill; networks today |
| REALME | `yellow` | yellow in words; no hex observed | `ground` | «شنژن، ۲۰۱۸؛ زیرمجموعه اوپو.» | Shenzhen, founded 2018, Oppo sub-brand since 2026 |
| TCH | `none` | **nothing sourced** — no saturated value in TCL's markup | `house` (no maker claim) | «چینی، ۱۹۸۱؛ دومین تولیدکننده بزرگ تلویزیون جهان.» | Chinese, founded 1981, 2nd-largest TV maker |

The Persian lines are drafts to be finalised against the cited sources during implementation, not settled copy.
Every one is a fact from the research file; none is a characterisation of the shop.

### Why the Nokia line is the best one here

Research found that **Nokia does not manufacture phones** — a licensed partner is the exclusive maker of
Nokia-branded handsets. That is a problem for a card in a phone-brand deck, and the 1865 pulp-mill fact dissolves
it: it is verifiable, it is unexpected, and it stops a shopper reading "Nokia" as only-a-phone-company without the
card having to assert or deny anything about who builds the handset today. Stating the true thing beats tiptoeing
around the false one (FR-021).

---

## The slogan rule

Two makers' slogans are genuinely documented — realme's "Make it real" (seen in the brand's own live page title)
and TCL's "The Creative Life" (adopted by the company in 2014). Two more are famous and **could not be verified** —
Apple's "Think different" and Nokia's "Connecting People".

**Decision: none of them render.** Reasons, in order of weight:

1. FR-006 and FR-012 ask for the *same form* on all six cards. Two slogans among four descriptions is not a family.
2. A slogan reads as the maker speaking on the shop's page, which FR-008 exists to prevent — and the two safe ones
   are safe only in the narrow sense that they exist.
3. The difference between "verified" and "famous" is exactly the line a later editor cannot see from the markup.
   Rendering two of them teaches the page to carry unverified ones.

So `makerSlogan` is recorded as metadata — useful if the owner later asks for it, and already sourced — and the
blocklist covers all four names regardless.

### Blocklists, both test-enforced

**Unverified slogans — must never appear on any card:** `Think different`, «تفکر را متفاوت کن»,
`Connecting People`, «ارتباطات انسانی»-as-slogan.

**False framings, per maker (FR-020):**

| Maker | Forbidden | Why |
|---|---|---|
| NOKIA | any phrasing presenting Nokia as the manufacturer of the handsets | HMD holds the exclusive licence |
| REALME | «مستقل» / any claim of independence | an Oppo sub-brand again since January 2026 |
| TCH | any implication of phone-making heritage | own-brand phones only from 2019; it is a television maker |
| SAMSUNG | «بزرگ‌ترین سازنده گوشی جهان» | sourced only indirectly, via Xiaomi's ranking — the researcher warned against sharpening it |
| APPLE | the logo itself, or any usage-rule claim | its guidelines returned a 404; the rules are unread, so nothing may be asserted about them |

---

## The palette envelope (D1)

Not per-maker — one rule, applied to all six.

| Quantity | Envelope | Why there |
|---|---|---|
| Card ground lightness `L` | **0.17 – 0.26** | matches the deck's existing `#1e0a10 → #120104` ground, so tinting never brightens a card |
| Card ground chroma `C` | **≤ 0.055** | the garishness ceiling. Above it, six hues become a banner; below it, they are six dark rooms with different lamps |
| Text `L` | cream `#f0ece9`, champagne `#e5d3b3` — unchanged | because ground lightness is pinned, one contrast figure covers all six cards |
| Accent chroma | ≤ 0.11 | accents are small, so they may be livelier than a ground without dominating |

**The consequence that makes FR-013 cheap**: contrast is a function of the lightness *difference*, and the lightness
never moves. So the cream-on-ground ratio is identical for all six, and it is **computable in the node test** —
OKLCH→sRGB→relative luminance→ratio, no browser. The browser then confirms six times what arithmetic proved once.

---

## Validation rules

1. **Six records, six lines, six sources.** Zero blanks, zero unsourced lines (SC-002, SC-003).
2. **`hueFamily: "none"` requires `placement: "house"`** — an unsourced maker cannot carry a hue, and must not
   quietly receive one because the row was left blank (FR-003, FR-018).
3. **Every `C` at or below the ceiling; every `L` inside the band** — asserted by test, not reviewed by eye (FR-011).
4. **Every computed text-on-ground contrast ≥ 4.5 : 1** (FR-013).
5. **No blocked string appears in any rendered field**, case- and script-insensitively (FR-008, FR-020).
6. **The two blues differ by `placement`, not by more than 25° of `hue`** — a guard against someone "fixing" the
   collision by inventing a teal (D3).
7. **The two no-hue makers differ from each other** — Apple's neutral must be measurably cooler than the house
   burgundy TCH sits on (D4's edge case).
8. **Nothing in 008's contract regresses** — the deck's sticky rules, fit budget and acceptance measurement must
   pass unchanged after this feature lands (FR-014, SC-005).

## What a card may not show

- No maker logo, product photograph, or generated maker imagery (FR-016).
- No colour presented as a maker's official colour (FR-002a).
- No partnership, endorsement, certification, price or stock claim (FR-009).
- No slogan in the maker's voice, ours or theirs (FR-008).
- No card without a line, and no line without a source (FR-006, FR-007).
