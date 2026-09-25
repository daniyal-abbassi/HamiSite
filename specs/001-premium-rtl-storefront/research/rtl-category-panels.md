# R1 — Full-bleed photographic category panels on a dark ground: does any real Persian/Arabic RTL retail do it?

**Question (qoder-ide, board 12:39 +0330):** Does any Persian or Arabic RTL retail storefront present
categories as full-bleed photographic panels on a dark ground — image-filled panel, category name
overlaid, RTL reading direction, real retail (not a template demo, not a portfolio piece)? If the honest
answer is "I could not find one", say that and say what was searched.

---

## Headline: I could not find one

**Finding:** No real Persian or Arabic RTL **retail storefront** doing image-filled, full-bleed category
panels with the name overlaid on a dark ground was found. This is the same wall Q1 hit from the other
side: the market is light, and its category presentation is icon rows and white-card grids, not
photographic panels.

**Evidence (what was actually searched, 2026-09-24, read-only public fetches):**
- Persian-language search: «فروشگاه اینترنتی ایرانی دسته‌بندی تصاویر تمام‌صفحه زمینه تیره مگامنو» —
  results were WordPress theme vendors (rtl-theme.com Techno Shop, Sepahan), Elementor megamenu plugin
  docs (JetMenu), and a course teaching a "Digikala-like megamenu". **Zero live Iranian storefronts**
  presenting category sections as dark photographic panels.
- English search: "Arabic RTL e-commerce category full bleed image tiles dark background" — results were
  design-portfolio case studies (UXnco's Al Thaqafiya media site, Shasha streaming platform — *media, not
  retail*), a Salla/Zid theme pitch ("Luxe", editorial luxury, Arabic-first), a CS-Cart theme ("Syrup",
  image-heavy catalog, RTL, full-width), and an Egyptian marketplace case study (sabat.io/elsallab) whose
  description gives no dark-ground category treatment.
- Source-read of a real GCC retailer's category presentation: **Jarir** (`jarir.com` / `jarir.com/ae-en`,
  fetched today) — "Shop by Category" is a grid of **52×52 icon images with text labels and an arrow**,
  brand rows below. Small product-cutout icons on the page ground; no photographic panels, no overlaid
  names.
- **Namshi** (`namshi.com/saudi-en/`, fetched today) — the extractable structure is text link columns
  (Women/Men/Beauty/Kids, Clothing/Shoes/Bags…). No evidence of photographic category panels in the
  served content. Caveat: heavy JS shell; I read the served document, not a rendered screenshot.
- Q1's prior ground (`research/competitor-grounds.md`, 2026-09-24) stands: Digikala `data-dds-mode="light"`,
  body `#fff`; Torob light; MeghdadIT `body{background-color:#fff}`; Technolife light with dark *campaign*
  bands; **no dark Iranian retail site found at all**. A category section of the type you describe would
  sit on a dark ground, and no default-dark ground exists in this market to sit it on.

**Confidence:** medium — as an existence claim about the whole market it is bounded by what this machine
can reach (Q1 documented connect-refusals for X-store, mobit.ir, and browser blocks for technolife/
meghdadit). What would change it: a single reachable storefront URL showing the treatment. As a claim
about *the sites I could reach and the searches listed*, confidence is high.

**Affects:** qoder-ide's categories redesign (specs/006) — the citation does not exist; the design
decision now rests on your and the owner's intent, not on precedent.

## What the market does instead (read from the same fetches)

**Finding:** The reachable RTL retail norm for category presentation is one of: (a) small icon/label
rows (Jarir), (b) text megamenu link columns (Namshi, Digikala's documented megamenu), (c) white-card
product grids. The *template/theme market* — where Iranian and Gulf shops actually get their designs —
does sell image-forward category blocks ("تصاویر القوائم" / interactive category cards in Salla themes,
CS-Cart Syrup's "image-heavy categories, full-width layout, Swiper sliders"), but every vendor page I
reached describes them on **light** grounds or generic grounds; none markets "dark photographic category
panels" as a regional style.

**Evidence:** Jarir served HTML (icon URLs `width=52,height=52` under "Shop by Category"); Namshi served
footer/nav link columns; rtl-theme.com / vishaweb.net / themehills.com vendor pages (fetched today);
Q1's per-site CSS reads.

**Confidence:** high for Jarir's structure (direct HTML); medium for the generalization about what
themes ship (vendor marketing pages, not a census of installed themes).

**Inference (labeled):** the closest live *device* precedent remains Technolife's saturated dark
campaign band (`--section-bg-color:#520408`, white title — from Q1) and the Al Thaqafiya *media* site's
dark "Trending" band breaking a white page. Both are dark bands carrying overlaid content inside an
otherwise light surface — the market's version of this idea is **the band inside a light page**, never
**the dark page with photographic category panels**. That is the same shape as Hami's paper-chapters-on-
dark inversion of the convention, seen from the other side.

**Confidence:** medium — the Thaqafiya description is the agency's own portfolio copy (self-report), not
my screenshot; and note it is media, not retail.

---

## Search log (so the absence is auditable)

1. `فروشگاه اینترنتی ایرانی بخش دسته‌بندی با تصاویر تمام‌صفحه زمینه تیره روی عکس طراحی مگامنو`
2. `Arabic RTL online store category section full bleed image tiles with overlaid category name dark background`
3. `Persian RTL ecommerce storefront category navigation full-bleed photographic image panels dark background design`
4. `Middle East e-commerce homepage category tiles full bleed lifestyle photo overlay text dark design noon namshi jarir extra`
5. Direct source reads: `jarir.com`, `jarir.com/ae-en/Home`, `namshi.com/saudi-en/`, plus Q1's corpus.

Not reachable / not rendered from this machine: noon.com (JS-heavy shell, no useful extract); X-store
and mobit.ir (Q1 already recorded connect-refusals); rendered screenshots of Namshi/Jarir (source reads
only today — no browser probe was launched against them; Q1's probe method sits in
`.scratch/research-q1-shots.mjs` if anyone wants the pictures).

**Bottom line for the redesign:** you are not late to a convention — there is no convention to be late
to. The panel treatment would be genuinely new in this market, which is an argument for the owner to
own it explicitly, not for you to cite precedent.
