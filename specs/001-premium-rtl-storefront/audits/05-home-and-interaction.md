# Audit 5 — Home, brand impression, information surfaces, interaction quality (band: FR-014…019, 043…052, SC-001/012/013/014)

**Date**: 2026-09-23 | **Method — important**: no live measurement was possible. `curl localhost:3000` and
the browser tool both returned `ERR_CONNECTION_REFUSED`; nothing was listening on 3000 in that session and
the auditor did not start a server. Every visual claim is therefore from (a) source and (b) the checked-in
real renders at `specs/002-scroll-atmosphere/baseline/{360px,1280px}/pos-*.png` — Playwright captures of
this homepage at 360×900 and 1280×900 taken 2026-09-22, whose section order matches `app/(main)/page.tsx`
exactly and whose `Header.tsx` is unchanged since 2026-09-13. Heights at 800/844 are **computed from that
capture, not measured**. Re-run §4 of `../quickstart.md` against a live server before treating any of the
fold-position findings as final.

| FR | verdict | evidence |
|---|---|---|
| FR-014 | PARTIAL | Positioning plus one admissible trust claim are above the fold at 360: `app/(main)/page.tsx:80` «حامی همراه؛ بیست سال اعتماد در بازار مشهد» and the eyebrow at `:73`. Missing: the section's actual trust device — the three-item signal row at `:125-131` — paints at y≈845 in the 360×900 capture, so it is below the fold at 360×800 and 390×844 and partly covered by the fixed dock at 900. The Mashhad store proof (`components/home/ShopWindow.tsx`) is the *second* grid child and stacks below the copy on phone (`page.tsx:139`), so the physical store never appears above the fold on the owner's design target. The above-the-fold claim itself is set in `.eyebrow` (`app/globals.css:611`, `letter-spacing: 0.08em`, plus `tracking-[0.14em]` at `page.tsx:153`), which visibly splits Persian letter joining in the capture. |
| FR-015 | PARTIAL | `components/layout/Header.tsx:11,100-105` renders `public/brand/hami-mark.png` — a 1254×1254 wine-on-white derivative — at `size-9` (36px) on a white chip; legible, but **not** a supplied file. The four official assets (`HamiHamrah(حامی همراه)-Logo.png`, `طرح اصلی لوگو-انگلیسی.png`, `قسمت-فارسی-لوگو.png`, `قسمت-فارسی-لوگو-رنگ-برعکس.png`, all predating the repo's first commit) are imported by **nothing**. The brand *name* beside the mark is re-typeset in Estedad (`:106-108`), not the official lettered wordmark, and sits behind `hidden … sm:block` — so at 360/390 the header carries a 36px glyph and no readable identity. The hero renders no logo at all. The official wordmark file appears only at `ProductCard.tsx:237-246`, below the fold. |
| FR-016 | **DONE** | Five genuinely different entry types, all resolving: featured product → `/shop/[slug]` (`ProductCard.tsx:110`); nine category doors → `/shop?category=` (`lib/category-departments.ts:60-68`), each guarded against resolution failure or emptiness (`:113-126`); six brand rows → `/shop?brand=` (`lib/content/home.ts:165,168`) — verified non-empty against the export: اپل 49، سامسونگ 42، شیائومی 30، تی سی اچ 23، نوکیا 3، ریلمی 1; `/shop` from the hero, four «مشاهده همه» links, dock, footer, TrustBento, FinalConversion; four accessory doors (`lib/content/home.ts:189-194`) plus the services door (1 record). One gap noted: no offer door — `/shop?special=1` is never linked from the homepage. |
| FR-017 | CONTRADICTS SPEC | `app/(main)/page.tsx:103-106` «کالای اصل با گارانتی رسمی و **قیمتی بی‌رقیب**» — "unrivaled price" is exactly the unspecificable comparative FR-017 forbids; `:86` «**بهترین قیمت** برای …»; `:108-109` «چه یک دستگاه بخواهید و چه صد دستگاه، **همان قیمت منصفانه**» asserts one price at quantity 1 and 100 while the export carries no B2B tiers (`lib/catalog.ts:179`), so the retail-close-to-wholesale position is stated as a fact the data cannot support. `BrandShowcase.tsx:45` «انتخاب‌های بی‌نهایت». No competitor is named, so the second clause holds while the first (truthfully) does not. |
| FR-018 | CONTRADICTS SPEC | Of 12 mounted blocks, 4 draw on catalog data and 8 do not. Rendering authored filler: `B2bSection` (`lib/content/home.ts:172-185`; the workflow's step 03 «دسترسی همکاری برای سفارش آماده می‌شود» describes a panel that `B2bSection.tsx:51-55` states does not exist); `AccessoryUniverse` (right-hand panel is a CSS gradient plus three strings, `:66-76`); `OnlineServices` (`home.ts:198-213`, three FAQ answers that decide nothing); `TrustBento` + `WhyHamiProofs` (`:215-288`); `FinalConversion` (`:290-295`). Present-but-empty rather than omitted: `components/home/WhyHami.tsx:12` paints «تصویر واقعی فروشگاه در انتظار افزودن» inside a `.proof-media` gradient rectangle (`app/(main)/home.css:411-427`) and `:65` renders `mediaNote` «…پس از دریافت، در همین قاب قرار می‌گیرد» — an apology for missing content, live on the page. |
| FR-019 | PARTIAL | Record-level framing is honest: `SPECIAL OFFER` chips gated on the field (`ProductListRow.tsx:31`, `ProductDetail.tsx:222`) and the −٪ badge only where `compareAtPrice > displayPrice` (`ProductCard.tsx:182`, `lib/catalog.ts:114-120`). Missing: all 11 `special_offer` records are out-of-stock/not purchasable, so the homepage's only offer surface merchandises offers nobody can take; `FeaturedProducts.tsx:76-82` sends `specialOffer=true` on **both** tabs while `lib/catalog.ts:264-295` has no branch for `newest` or `special`, so «جدیدترین‌ها» and «پیشنهاد ویژه» return byte-identical lists; and `:115` claims «محبوب‌ترین» with no popularity data in the seam. |
| FR-043 | PARTIAL | States exist on the primitives (`components/ui/button.tsx:7-24`: hover translate, `active:translate-y-px`, `disabled:opacity-50`) and disabled is honoured where it matters (`ProductCard.tsx:223` → `AddToCartButton.tsx:37-49`, a `Ban` ghost). Controls enabled that cannot respond: `FeaturedProducts.tsx:177` «تلاش دوباره» calls `setTab(tab)` — same value, React bails, no refetch; `BrandRows.tsx:93-102` draws the chevron on all six rows while `:84-91` only fills the band when a story exists, so NOKIA/REALME/TCH flip the icon, darken the row and reveal a fixed-height empty band (`home.css:305-310`); `StoreExperience.tsx:140` «اطلاعات فروشگاه» is `href="#store-experience"` — the section you are standing in; `ShopResults.tsx:129-133` labels a `<Link href="/shop">` «تلاش دوباره» while on /shop. No pressed state on the hand-rolled pills outside the Button system (`FeaturedProducts.tsx:118`, `NewArrivals.tsx:67`, `AccessoryUniverse.tsx:72`). |
| FR-044 | PARTIAL | A site-wide ring exists and is not suppressed: `app/globals.css:165-168` `:where(a,button,input,select,textarea):focus-visible { outline: 2px solid var(--aqua) }`, and the four `focus-visible:outline-none` uses (`ui/input.tsx:9`, `select.tsx:11`, `switch.tsx:24`, `textarea.tsx:9`) each replace it with `ring-2 ring-ring`. Bespoke surfaces carry their own (`home.css:188,265,332`; `category-carousel.css:153,238`). Gaps: `summary` is in the tap-highlight list (`globals.css:1050`) but **not** in the focus-visible list at `:165`, so the three homepage FAQ controls (`OnlineServices.tsx:57-63`) fall back to the UA ring on a near-black ground. `FeaturedProducts.tsx:135-160` sets `role="tab"`/`tablist` with no `aria-controls`, no panel role and no arrow-key handling — two tab stops that behave as buttons. DOM order matches reading order in Header, MobileDock, BrandRows and CategoryCarousel (roving tabindex at `CategoryCarousel.tsx:258`); the one real inversion is `CheckoutClient.tsx:441` `order-first` on mobile, putting the summary visually above controls that come later in the DOM. |
| FR-045 | PARTIAL | Phone is covered by a blanket patch: `app/globals.css:1127-1166` inflates `size-8/9/10` hit areas to 44px via `::after` and forces `min-height:44px` on `button`, `[role=tab]`, `a[class*=inline-flex]`, `a[class*=rounded-full]`; `.brand-rows__expand` is 44px (`home.css:322`); `.cat-panel` and the rails are sized. Under 44px and untouched: everything at `md` and up — `Header.tsx:133` search `md:h-9` (36px), `button.tsx:28` `sm:h-9`, `ShopResults.tsx:74` sort select `md:h-9`, `FeaturedProducts.tsx:146` tabs (~32px), `AccessoryUniverse.tsx:72` (~34px), `MobileNav.tsx:39` `size-9`. The patch is class-substring matching, so any control sized by inline `style` escapes it. Separately, at 360px the header's «شروع همکاری» CTA (`Header.tsx:142-148`, `h-12 px-8`, not hidden) consumes ~174px of 336px, squeezing the search field to a ~58px sliver — visible in the capture as an empty pill. |
| FR-046 | PARTIAL | Best case: `ShopResults.tsx:108-153` gives four distinct labelled states (unknown filter / error / `aria-busy` skeleton / empty) plus a live count at `:65`, and reserves the grid box; `FeaturedProducts.tsx:164-195` and `NewArrivals.tsx:120-137` do the same. Where nothing is reserved: `FeaturedProducts.tsx:102` gates skeletons on `isLoading && products === null`, so switching tabs keeps stale cards with no busy affordance and then swaps — the section height jumps; `NewArrivals` skeletons are 4 items against a 6-item result; `CartButton.tsx:19` renders the badge only when `itemCount > 0`, so the header reflows on the first add (`UserMenu.tsx:14-16` is correct by contrast); `AddToCartButton.tsx:63-65` swallows every non-auth failure silently — the button returns to idle and the shopper is told nothing. |
| FR-047 | **DONE** | `app/globals.css:564-592` kills `.noir-stars` drift, `.shiny-edge`, `.word-swap`, the product-card entrance, clamps every `transition`/`animation` to 0.01ms with `iteration-count:1`, plus `scroll-behavior:auto`. Content is never gated on motion: `Reveal.tsx:31` returns before hiding anything under reduce, so the `.reveal{opacity:0}` floor (`home.css:16-23`) never applies; `ui/flip-words.tsx:52` settles on the first word and `:87` exposes the whole phrase as `sr-only` regardless; `PillNav.tsx:102,129-138` keeps the hover colour and drops the travel; `components/atmosphere/ScrollSmooth.tsx:85` opts out; `home.css:380-394` states emphasis as a colour change with identical content; `category-carousel.css:164` covers the arc. State stays visible (`BrandRows` keeps `aria-expanded`; `CategoryCarousel` keeps its `aria-live` status at `:296`). |
| FR-049 | PARTIAL | Same tokens, two page grammars. Homepage: `.eyebrow` pill + `text-3xl font-black tracking-tight` + one `.grad` gradient word + a hand-drawn swash (`page.tsx:68-101`, `FeaturedProducts.tsx:110-113`, `NewArrivals.tsx:58-61`, `B2bSection.tsx:23-31`, `TrustBento.tsx:36-39`). Every interior page: `.section-label` numeral + `<em class="text-aqua">` (`shop/page.tsx:19-27`, `cart/page.tsx:13-21`, `orders/page.tsx:14-21`, `partners/page.tsx:15-23`) — no pill, no gradient, no swash. The numerals are decorative and not a sequence: ۰۰۱ on both /shop and /cart, ۰۰۴ on /orders, ۰۱ on /partners. `/login` and `/register` have no page header at all (`login/page.tsx:11-18`, `register/page.tsx:11-18`) — a bare `container flex justify-center py-14` and one `glass` card. The atmosphere system is homepage-only by construction (`PageGround.tsx:47`), so every other surface sits on the raw body gradient with no scroll ground. The two heading systems, not the tokens, are what makes /cart read as a different project. |
| FR-050 | PARTIAL | Composition and type are genuinely ambitious and the catalog rails (`ProductCard.tsx`, `ProductRail.tsx`) read as merchandise rather than rows. What costs it: the AI re-lit store photograph captioned «نمای کلی فروشگاه / نور، ویترین، قفسه‌ها و فضای واقعی مجموعه» (`StoreExperience.tsx:41,60-62`) and badged `MASHHAD FLAGSHIP` (`ShopWindow.tsx:44`) — a fabricated storefront with invented `SAMSUNG`/`ACCESSORIES` signage is the largest image on the first screen at 1280px; the literal «photo pending» placeholder (`WhyHami.tsx:12`); the white-wave divider (`ModernWhiteWave.tsx`); the footer's 15vw outlined wordmark (`Footer.tsx:117-121`); the Persian brand name broken to «تی / س ا / چ» in a two-up card at 360px (capture pos-01); and a dev live-reload script committed into the shell (`app/layout.tsx:69`). |
| FR-051 | **DONE** | The spec pins no visual value: a scan for hex, `px`/`rem`, font names, `cubic-bezier`, radii and shadow recipes returns zero hits, and `spec.md:404-405` states the opposite explicitly. Only functional numerals appear (189 records, 5 purchasable, 32 categories). **Separate report**: the codebase has accumulated a full pin, and it is declared — `DESIGN.md` front-matter lists 12 hex colours, `clamp()` display sizes, −0.025em/0.08em tracking and a radius scale; `tailwind.config.ts:62-121` hard-codes `#640211`/`#E5D3B3`, six radii, five named shadows of which four are `glow-*`, and `:124-136` a duration scale whose comment says "Arbitrary durations outside this scale are not allowed" plus one pinned easing; `:137-187` ships `bob`, `shiny`, `slide` keyframes. The pin also locks in what FR-052 forbids, and `aqua`/`champagne`/`brass` are all `#E5D3B3` (`:68-82`) while `app/layout.tsx:46-48` still describes "muted antique aqua … not the previous champagne-yellow" — declared intent and shipped token disagree. |
| FR-052 | CONTRADICTS SPEC | The premium effect *is* the decoration. First screen: `.shiny-edge` — an 8s infinite conic-gradient gold rim with three glow shadows (`globals.css:481-516`) on the hero's secondary CTA (`page.tsx:118`) and in the header (`Header.tsx:144`); a radial oxblood "light thrown onto the wall" behind the shop window (`ShopWindow.tsx:25-35`), a glass-sheen gradient and a bright top line across it (`:72-83`); `.grad` gradient-shimmer text on one word per heading (`:623-629`, used at `page.tsx:88,112`); a pulsing `animate-ping` dot (`page.tsx:70`). Site-wide: a fixed 20-point drifting starfield (`:440-473`), five stacked body radial glows (`:137-142`) plus a `body::before` glow layer (`:145-154`), a per-section alternating radial glow and a darkening band on every third section (`:186-224`), a fixed blurred top scrim (`:426-436`), `backdrop-filter: blur(20-22px)` frosted glass with a gradient hairline on every card (`:342-379`). In-page: a `blur-3xl` champagne blob (`BrandShowcase.tsx:24`), a `blur-2xl` white wave with a `feGaussianBlur` glow filter and specular crests (`ModernWhiteWave.tsx:18-99`), a `.beam` plus blurred `.glow` ellipse on the final band (`home.css:503-522`), a hover-only radial red wash on the trust card (`TrustBento.tsx:70-74`). |
| SC-001 | UNVERIFIABLE | No evidence exists. Requires 10 new shoppers × five seconds, unprompted recall. `tests/` contains only `api/` and `unit/` files; no panel record, transcript or rating appears anywhere. Code cannot substitute — the closest artefact is a screenshot. |
| SC-012 | UNVERIFIABLE | No evidence exists. Requires a 10-participant side-by-side against a global technology brand plus a mean rating. Nothing records a comparison, a panel or a rating. |
| SC-013 | UNVERIFIABLE | No evidence exists. Requires the share of tested shoppers who abandon at a product for want of a next step. No instrumentation. The nearest code signal is negative: 184 of 189 records show a price and a stock label but only 5 are purchasable, and the buy control on the other 184 is a disabled `Ban` icon (`AddToCartButton.tsx:37-49`) with no call action beside it. |
| SC-014 | **MISSING** | Three footer links reach routes that do not exist and there is **no `app/not-found.tsx`**, so they land on Next's default unstyled English 404 — no RTL, no header, no footer, outside the brand world: `Footer.tsx:22` `/about`, `:23` `/contact`, `:31` `/my-orders`. Also dead-ended on every page except home: `StoreExperience.tsx:140` and `TrustBlocks.tsx:38` anchor to `#store-experience`. Everything else checked resolves: `/`, `/shop`, `/shop/[slug]`, `/cart`, `/checkout`, `/login`, `/register`, `/orders`, `/order/[id]`, `/partners`, and all 9 category + 6 brand + 4 accessory + 1 service query routes. |

## Above the fold at 360px (from the 360×900 capture; 360×800 loses the last item)

1. Fixed header island — «شروع همکاری» gold spinning-rim pill, a ~58px collapsed search field, cart button,
   and the 36px wine monogram on a white chip. **No brand name text** (`hidden … sm:block`).
2. Eyebrow pill with a pulsing red dot: «مشهد • حامی همراه • ۲۰ سال سابقه» — letter-spaced, joining visibly
   broken. *The only trust signal above the fold.*
3. H1, four lines, with «بهترین قیمت برای» + a rotating word caught mid-crossfade into an overlapped,
   unreadable stack of two-to-three words, and a champagne swash beneath.
4. Two lead paragraphs, including «کالای اصل با گارانتی رسمی و قیمتی بی‌رقیب».
5. Two stacked CTAs: oxblood «مشاهده محصولات», shiny-edge «شروع همکاری».
6. *(900px only, partly behind the dock)* the three-item trust row «اصالت کالا / گارانتی رسمی / سابقه بیست
   ساله».
7. Fixed bottom dock: خانه · فروشگاه · سبد · همکاری · حساب.

**Not above the fold at 360/390**: the shop-window photograph (the physical-store proof), the ۲۰ سال brand
band, the mobile quick-route chips, and every product — the first product appears at y≈1741.

## Homepage sections — mount order, data source, nature

| # | Section | Source | Real or filler |
|---|---|---|---|
| 1 | `Hero` | `page.tsx:56-161` | authored copy; no catalog read; photo is the AI re-lit store |
| 2 | `BrandTicker` (in Hero) | `components/brand/BrandMarks.tsx:71-94` | real: 6 vendored marks + the 20-year claim |
| 3 | `MobileQuickRoutes` | `lib/content/home.ts:36-41` | authored; 1 route + 3 in-page anchors |
| 4 | `FeaturedProducts` | `/api/products?specialOffer=true` | **real catalog** — 11 records; both tabs identical |
| 5 | `CategoryHub` → `CategoryCarousel` | `lib/category-departments.ts` → `lib/catalog.ts` | **real catalog** — 9 doors, counts through the seam |
| 6 | `BrandShowcase` → `BrandRows` | `lib/brand-counts.ts` + `home.ts:66-91` | counts **real**; three "brand stories" authored; 3 of 6 rows have none and reveal an empty band |
| 7 | `NewArrivals` | `/api/products?pageSize=6`, no sort | **real catalog**, but labelled «تازه‌ها / تازه رسیده‌اند» while `lib/catalog.ts:279-295` applies default buyable-first, not recency |
| 8 | `B2bSection` | `home.ts:172-185` | **authored filler** + a 3-step workflow whose end state does not exist |
| 9 | `AccessoryUniverse` | `home.ts:189-194` | hrefs real; the panel is a CSS gradient + 3 strings |
| 10 | `OnlineServices` | `home.ts:198-213` | **authored filler**; 1 catalog record behind the destination |
| 11 | `StoreExperience` | `lib/content/contact.ts` + `home.ts:262-273` | phone + hours **real**; photo is AI; «میز تست صدا و کاربری», «بسته‌بندی پلمپ کارخانه», «مشهد • مجتمع تجاری موبایل» unverified |
| 12 | `TrustBento` → `WhyHamiProofs` | `home.ts:27-32, 215-288` | **authored filler**, incl. the "photo pending" placeholder and a duplicated quote (`TrustBento.tsx:53` vs `WhyHami.tsx:77`) |
| 13 | `FinalConversion` | `home.ts:290-295` | **authored filler** |

Not mounted (dead code): `TrustBar`, `MobileNav`, `CardSwap`, `tickerItems`, `categoryMosaic`,
`customerContentNote`.

## Cheap tells, worst first

1. **The store on screen is not the store** — an AI re-lit frame with invented signage, `MASHHAD FLAGSHIP`
   and `SHOWROOM` badges, captioned «فضای واقعی مجموعه». A shopkeeper who knows that bazaar reads it as fake
   instantly, and Principle I forbids it outright.
2. **A live "content pending" placeholder** (`WhyHami.tsx:12`) with an apology underneath.
3. **`.shiny-edge` on the two most important CTAs** — a spinning conic gold rim with glow shadows, the most
   recognisable AI-luxury-template tell and the exact thing the brief names as not-luxury.
4. **`ModernWhiteWave`** — a stock page-builder divider with four gradients, a Gaussian-blur glow and dashed
   "specular crests", dropped between categories and brands. It belongs to no other part of the world.
5. **The rotating headline word is illegible ~460ms of every 2.8s**, and the baseline capture caught two to
   three words superimposed. The most expensive type on the page spends a third of its life unreadable.
6. **The header collapses at 360px** — the B2B CTA is not hidden on phone, the search field renders as an
   empty ~58px pill, and «شروع همکاری» appears twice in one screen.
7. **Persian set with tracking** — `.eyebrow` at 0.08–0.14em over the hero's trust pill and six section
   kickers: visible gaps inside joined letters, on a dark ground, at 12px.
8. **The ground outworks the content** — starfield + five body glows + per-section glows + a third-section
   darkening band + a blurred scrim, and the reason the page is 16,566px of wine at 360px (~46 screens) for
   11 sections.
9. **The footer's 15vw outlined wordmark** (`Footer.tsx:117-121`) — `-webkit-text-stroke` at 0.16 alpha,
   hidden from assistive tech, carrying no information.
10. **`aqua`, `champagne` and `brass` are the same hex**, so half the accent decisions were made against a
    colour that does not exist.
11. **A dev live-reload `<script>` in `app/layout.tsx:69`** pointing at `localhost:8400`, inside the shipped
    shell.

## Interaction states — controls that lie

`FeaturedProducts.tsx:177` retry is `setTab(tab)`, a no-op that refetches nothing; `BrandRows.tsx:93-102`
chevrons on rows with no story, revealing an empty band; `StoreExperience.tsx:140` anchors to its own
section; `ShopResults.tsx:129-133` labels a link to the current page «تلاش دوباره»;
`AddToCartButton.tsx:63-65` swallows every non-auth failure; `AccessoryUniverse.tsx:36-51` four
`aria-pressed` rows whose only effect swaps three strings into a gradient panel whose spotlight reads
`--lx`/`--ly`, which nothing ever sets; `ShopBanner.tsx:24-27` a banner titled «لپ‌تاپ برای کار و بازی»
linking to `/shop?sort=price-asc` — no laptop filter at all.

Missing treatment: `summary` absent from the focus-visible list (`globals.css:165` vs `:1050`);
`ui/button.tsx:7-24` declares no `focus-visible` of its own, so every `buttonVariants` link depends on the
zero-specificity `:where()` global and any future `outline-none` silently removes focus from the whole CTA
system; no `active:` state on the hand-rolled pills; `disabled:pointer-events-none` gives a dead control no
reason for being dead; `FeaturedProducts.tsx:102` refetches with no busy affordance and no reserved height;
`Reveal.tsx:26-37` SSR-paints below-fold content, hides it in an effect, then reveals it — a visible
flash-then-vanish on a slow connection, the inverse of a loading state. `ui/CardSwap.tsx` auto-advances with
reduced-motion handling deferred to `:151` and is not mounted, but still sits in the primitives directory as
a live option.

## Unresolved links

| href | label | where |
|---|---|---|
| `/about` | «درباره ما» | `components/layout/Footer.tsx:22` |
| `/contact` | «تماس با ما» | `components/layout/Footer.tsx:23` |
| `/my-orders` | «سفارش‌های من» | `components/layout/Footer.tsx:31` (real route is `/orders`) |
| `#store-experience` | «اطلاعات فروشگاه» | `StoreExperience.tsx:140` — self-referential even where it resolves |
| `#store-experience`, `#b2b`, `#brands`, `#featured`, `#categories` | trust signals, quick routes, proof CTAs | `lib/content/home.ts:37-40,223-253,283-287`, `TrustBlocks.tsx:38` — resolve on `/` only; dead ends on /shop, /cart, /partners, /login, /orders |

All three route misses land on Next's framework 404: no `app/not-found.tsx` and no `error.tsx` anywhere.
