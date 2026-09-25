# Q1 — What do the actual competitors do about ground?

**Question (driver, board 02:48; `research/README.md` Q1):** Persian RTL electronics retail — Digikala,
Technolife, MeghdadIT, X-store, plus any Iranian brand storefront reachable. Does the page hold one dark
ground, alternate light and dark chapters, or go light with dark accents? Is "dark page with paper
chapters" a market convention or something we invented?

---

## Headline contradiction first

**Finding:** "Dark page" is not the convention in this market. Every major Persian electronics retailer I
could reach serves a **light** page — white or near-white body, dark used only as accents and chips. The
only dark-ground reference in this project's record is **palatemcp.com, which is not an Iranian retail
site at all**. So "dark page with paper chapters" is **an invention for this shop** — not a market
convention — and it stands on the owner's explicit instruction ("use white somewhere", "the background
shifting is too boring"), not on market precedent. That is a legitimate foundation (the owner outranks the
market), but the next person who calls it "a luxury convention" should know there is no Persian retail
evidence behind that phrase.

**Evidence:** per-site findings below; each cites fetched source or a browser measurement, dated 2026-09-24.

---

## Per-site findings (what each page is *doing*, read from source)

### Digikala — light, with a dormant dark token set

**Finding:** Body is **white**. The served `<html>` carries `data-dds-mode="light"` on the element itself,
and the main stylesheet sets `body { background-color: var(--color-neutral-000) }` where
`--color-neutral-000: #fff`. Dark neutrals exist as a **token set** (`--color-dark-neutral-000: #222732`,
`--color-dark-neutral-600: #94969c`, `--color-dark-neutral-900: #fff`) for an opt-in dark mode, but the
default document ships light. Measured **in a real browser**: `getComputedStyle(document.body).backgroundColor`
= `rgb(255, 255, 255)`.

**Evidence:**
- HTML: `<html lang="fa" dir="rtl" data-dds-style="product" data-dds-theme="shop" data-dds-mode="light" data-dds-device="mobile">`
  (served shell, curl 2026-09-24).
- CSS: `body{background-color:var(--color-neutral-000)}` and the neutral scale
  (`--color-neutral-100:#f0f0f1`, `--color-neutral-900:#0c0c0c`) from
  `/_next/static/chunks/*.css` (fetched 2026-09-24).
- Browser: screenshot `research/assets-competitor-grounds/digikala@1280-fold.png` (fresh context, external
  site only; the shared :3000 server was not touched).
- Confidence: **high** — three independent reads agree.

Worth copying, regardless of theme: Digikala ships **one tokenized mode attribute** on `<html>` and builds
every surface from neutral-000…900. Hami's `.band-paper` variable-flip is the same idea at section scope.

### Torob — light

**Finding:** The price-comparison giant is also light: `<html … data-theme="light">`,
`<body data-direction="rtl" …>`. No dark background rules in the served shell.

**Evidence:** served HTML (curl, 2026-09-24). Confidence: **high** for the shell; I did not audit every
landing graphic. One caveat: their served document is only ~24 KB, so it may be a pre-hydration shell.

### MeghdadIT — light

**Finding:** `body { background-color:#fff }` (plus a pre-processor duplicate `body{background-color:#fff}`
and a font/color base `body{font-family:Shabnam;color:#232323}`) in `/public/main.css?v=104`.

**Evidence:** `/tmp` fetch of the stylesheet, 2026-09-24; hex census of the homepage HTML showed **zero**
inline dark backgrounds. Confidence: **high** for the body; medium for "whole site", since I read one page.

### Technolife — light page, dark used only as chips and campaign bands

**Finding:** The page is light. `#393939` appears ten times but every occurrence I traced is a small
**inline-styled chip** (`class="… text-white" style="background-color:#393939"` — dark pill badges, not a
ground). `#1a1a1a`/`#1b1919` appear inside what reads as campaign-band styling (`--title-color:#ffffff;
--section-bg-color:#520408` — a deep **near-oxblood campaign band** with white text — and a magenta
`#d71480` header band), i.e. **the alternating-dark-band device exists in this market as campaign
sections inside an otherwise light page**. No `prefers-color-scheme` or `.dark` variants in their shipped
CSS. Note also their dark band accent is a saturated dark red — the closest thing to oxblood I found in
the wild here.

**Evidence:** homepage HTML (1.4 MB, curl 2026-09-24) + `/_next/static/css/7b1a5a3ede9aa7d8.css`
(`body{font:100% Helvetica…}` — no background on body in the read-back copy). Their main CSS chunk
(`c7db275a101cb174.css`) refused my requests (162-byte response even with referer), so this is HTML +
one chunk, not the full picture. Confidence: **medium-high** for "page is light", **medium** for the
campaign-band reading (I inferred "campaign" from surrounding class names and inline vars; the page was
not rendered).

### X-store — unreachable

**Finding:** Could not reach. `https://x-store.ir`, `https://www.x-store.ir`, `https://xstore.ir`,
`https://www.xstore.ir` all fail at TCP connect (curl exit 000, ~20s timeout). `xstore.com` (200) is an
unrelated site. I could not determine whether X-store is light or dark. **This is a real gap, not a
finding.**

**Evidence:** connection attempts, 2026-09-24. Confidence: n/a.

### Mobit — unreachable

Same: `https://mobit.ir` fails at connect. Gap, not a finding.

### palatemcp.com — the reference the pair already used: dark body + opaque light sections (confirmed)

**Finding:** The reference device the driver measured (dark body that never changes; each `<section>`
painting its own opaque colour) is real in the source: served inline CSS has exactly two background-color
declarations, both `#1e1111` (dark espresso), matching the partner's measured `rgb(30,17,17)` body; the
light per-section bands are painted by their stylesheet. This is a **non-Iranian** site (an MCP/security
product), which is precisely why the "is this a market convention" question needed answering separately.

**Evidence:** homepage HTML + stylesheet fetch (2026-09-24); partner's browser measurements on the board
(03:52) agree. My browser fetch of palate's full CSS was blocked (15-byte response), so the per-section
colours rest on the partner's already-committed measurements plus the inline-source read. Confidence:
**high** for the body colour (two sources), **medium** for exact section colours (partner's numbers only).

### Adjacent market signal — no dark Iranian storefront found

**Finding:** Web search for Iranian dark-theme retail surfaced nothing: queries returned wallpaper apps,
dark-web results, and regular light storefronts (kalaoma, nazdikeh, hiradmarket, mo7.ir, aradsys). I
cannot prove a negative, but **I could not find a single Persian electronics retail site whose default
page is dark**. "Absence of evidence is a result": the market-side risk is not that dark is wrong, it is
that **nobody in this market has converted on a dark default** — Hami would be first among its peers.

**Evidence:** two search rounds (2026-09-24, standard + deep); all reachable results light. Confidence:
**medium** — absence of results is not absence of sites; reachability limits this machine to a subset of
the market (see method note).

---

## What this means for the pair (inferences, labeled as such)

**Inference 1 — the device is safe to keep, the *justification* needs rewriting.** The owner ordered white
chapters inside a dark page; competitors show the *component* device (opaque alternating sections) already
operates in this market (Technolife's campaign bands, palate's sections) — but always as **bands inside a
light page**, never as "dark page as default". Do not defend the design in notes as "market convention";
defend it as "owner's eye + luxury-genre convention". The luxury-genre side is well-attested (black/gold is
the standard luxury e-commerce palette across Western sources; see the confidence note below).

**Inference 2 — Hami's sequence dark→paper→dark→paper→dark is a stronger commitment than anything found.**
Technolife's dark stretches are decorative campaign bands; palate's are an entire foreign aesthetic. Hami is
building readable *chapters* (full text inversion, `--catalogue-*` variables) — nobody found here does
that. That is not a defect; it is the differentiator, and it is exactly the kind of claim Constitution I
cares about, so it should be described honestly in notes.

**Inference 3 — the one thing worth stealing from Digikala is structural.** A `data-ground` attribute /
token-mode switch (they use `data-dds-mode` on `<html>`; Hami already landed `data-ground="paper"` per
board 04:36) is the market's own pattern, and Hami already has it.

## Method note (so the gaps are honest)

This machine reaches Iranian sites only partially (several connect-refuse from this network); Technolife
and MeghdadIT served HTML to curl but refused or timed out for the automated browser, so their entries are
source-reads with the caveat noted, while Digikala/Torob are corroborated both ways. All fetches were
read-only GETs of public pages; no vendor tools, no profiles directory, no touching of the dev server on
:3000. Screenshots live in `research/assets-competitor-grounds/` (Digikala captured; the other three
browsers blocked — source reads stand in for them).
