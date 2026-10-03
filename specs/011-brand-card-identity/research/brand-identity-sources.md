# 011 — Brand identity sources for the six cards

**Owner: opencode. Research only.** Nothing in `components/`, `app/`, `lib/`, `tests/` or any other
`specs/` directory was read for content or edited. Every claim below carries a URL and the date I checked
it: **2026-09-26** throughout unless stated otherwise.

The six, as the deck defines them: `APPLE`, `SAMSUNG`, `XIAOMI`, `NOKIA`, `REALME`, `TCH`.

---

## Read this first — the headline finding is a negative one

**Not one of the six has a brand-guideline hex that I can cite from a primary source.** I looked for each
brand's own published visual-identity guidelines, then its live site, then aggregators. Every hex I found
for Samsung, realme, Nokia and TCL came from a third-party brand-colour aggregator, never from the brand.
That is not good enough to print on a commercial page, so this file marks those hexes **AGGREGATOR-ONLY**
and marks the rest **UNSOURCED**, per the brief's instruction not to fill a gap with a plausible guess.

**Why discovery was this thin, stated plainly so nobody reads the gaps as carelessness.** The `websearch`
tool returned `Web search cancelled` on every attempt. DuckDuckGo's HTML endpoint worked twice and then
served a bot challenge on every request after that; Marginalia asked me to wait; Mojeek returned a consent
page; `curl` was bot-blocked with an HTTP 202 challenge. So I had **direct URL fetching and the Wikipedia
API only** — no open search. A researcher with working search would very likely find primary guideline PDFs
that I could not reach. **These gaps are a tooling limit, not a finding that the documents do not exist.**

**A second limit worth knowing:** every brand's site is **geo-localised**, and this machine was served the
German or UK version. `samsung.com` returned "Samsung Deutschland", `tcl.com` returned "TCL Deutschland",
`realme.com` returned the United Kingdom site. So anything scraped from a brand's own homepage is
**region-scoped**, and I have marked it that way rather than treating it as the global truth.

---

## APPLE

### A. Signature colour
**UNSOURCED — Apple publishes no brand colour.** Apple's own homepage metadata carries no brand colour and
no colour token of any kind. I could not find a published Apple visual-identity document.

- In words: **monochrome — black, white, grey.** Apple's identity is the absence of a brand hue.
- **Any hex used on an Apple card is ours, not Apple's.** If the deck needs a value, it must be labelled as
  a project choice in the token name, not as "Apple's colour".
- For completeness: I sampled the served HTML of `https://www.apple.com` for saturated hex values. Every
  one occurred exactly once and none read as a brand colour. That is reported as a negative, not dressed up
  as a measurement. — `https://www.apple.com/`, checked 2026-09-26.

### B. One-line characterisation
An American technology company headquartered in Cupertino, founded in 1976 as Apple Computer Company by
Steve Jobs, Steve Wozniak and Ronald Wayne, renamed Apple Inc. in 2007; it names its own product families
as iPhone, iPad, Apple Watch, Mac and Apple TV.
- `https://en.wikipedia.org/api/rest_v1/page/summary/Apple_Inc.` — checked 2026-09-26.
- Product families are Apple's own words, from its own meta description:
  "Discover the innovative world of Apple and shop everything iPhone, iPad, Apple Watch, Mac, and Apple TV…"
  — `https://www.apple.com/`, checked 2026-09-26.
- Restatable in Persian honestly: founded 1976, American, five named product families. Every one of those
  is in the sources.

### C. Official tagline
**UNSOURCED.** No official tagline appears in Apple's own site metadata. "Think different" is widely
asserted but I did **not** verify it this session, and it is a 1997 advertising campaign line rather than a
current registered slogan. **Do not print it.** Reproducing an unverified campaign line as a brand slogan
is precisely the "reads as the brand speaking" failure the brief warns about.

### D. What would be wrong to say
1. **Do not state or imply an Apple brand colour.** None is published (see A).
2. **The Apple logo is a registered trademark, and reproducing it on a commercial page is a trademark
   question, not a design decision.** I tried Apple's trademark guidance at
   `https://www.apple.com/legal/intellectual-property/trademark/apple-mark/` and it returned **HTTP 404** on
   2026-09-26, so I cannot quote the actual usage rules — treat this as **UNSOURCED and needing legal
   review**. Given feature 008 established (FR-016) that the six authentic marks *are* the brand imagery,
   this is a live question for the deck, not a hypothetical one.

---

## SAMSUNG

### A. Signature colour
**CONTESTED, and the hex is AGGREGATOR-ONLY — do not print it as official.**

- The colour most associated with Samsung is a deep blue commonly called **"Samsung Blue"**, value
  **#1428A0**. **Every source I reached for that value is a third-party aggregator**, and each one asserts
  it derives from "Samsung brand guidelines" while linking no primary document:
  `https://chromacreator.com/brands/samsung`, `https://colorcodehub.com/brand/samsung`,
  `https://colorcodeguide.com/official/samsung`, `https://www.stateofcolors.com/brand-colors/samsung`,
  `https://bemyhex.com/colors/blue/samsung-blue-1428a0/`, `https://ilovehue.co/colors/blue/samsung-blue-1428a0/`
  — all checked 2026-09-26. **Label any use of this value as an aggregator's claim, not as Samsung's.**
- **The contest, stated rather than resolved silently:** the blue is attributed at the **Samsung Group /
  corporate** level, while Samsung Electronics' consumer **retail** identity is widely black-and-white.
  "Samsung's colour" is therefore two different things depending on which Samsung you mean, and I could not
  reach a primary document that settles it.
- **Regional caveat:** `https://www.samsung.com/` served **"Samsung Deutschland"** with a German meta
  description on 2026-09-26. Any palette or wording taken from it is German-market, not global.

### B. One-line characterisation
A South Korean manufacturing conglomerate headquartered in Seoul; the largest of the Korean *chaebol*; as of
2024 it had the world's fifth-highest brand value. Separately, Apple and Samsung are the two vendors ahead
of Xiaomi, which Xiaomi's own encyclopaedia entry records as the third-largest smartphone seller in 2025.
- `https://en.wikipedia.org/api/rest_v1/page/summary/Samsung` — checked 2026-09-26.
- `https://en.wikipedia.org/api/rest_v1/page/summary/Xiaomi` — checked 2026-09-26.
- **Honest limit:** I did not retrieve a Samsung Electronics entry this session, so the "largest smartphone
  vendor" claim is sourced **indirectly**, from Xiaomi's ranking. The group's own summary covers the
  conglomerate, not handset shipments. Do not sharpen this into "Samsung is the world's biggest phone
  company" on the strength of these two sources.

### C. Official tagline
**UNSOURCED.** Samsung's own (German) homepage carries only a functional description, no slogan. A long-
running Samsung Electronics line is widely reported but I did **not** verify it this session; **do not print
it**.

### D. What would be wrong to say
1. **"Samsung Blue #1428A0 is Samsung's official colour"** — the most repeated unsourced claim I found, and
   the one most likely to be pasted into a token name by someone in a hurry. It rests entirely on
   aggregators. (See A.)
2. **Anything quoted from samsung.com is regional.** We were served the German site; "Samsung says X" is
   currently "Samsung Deutschland says X". (See A.)
3. **Do not resolve the blue-vs-black contest silently** in either direction. If the deck needs a colour,
   the honest move is a project-owned token with a comment saying which of the two identities it follows.

---

## XIAOMI

### A. Signature colour
**Orange — the best-evidenced of the six, and still not a cited guideline.**

- **`#FF6900` appears in the served HTML of Xiaomi's own global site**, `https://www.mi.com/global/`,
  fetched 2026-09-26.
- **Honest limit on that observation:** it occurred **once**, in served HTML only. I did not trace it to a
  published guideline document, and I did not resolve the site's external stylesheets. So the defensible
  statement is *"orange; #FF6900 as observed on the brand's own global site on 2026-09-26"* — not *"Xiaomi's
  official brand colour is #FF6900"*.
- This value is also the one most widely reported as Xiaomi's orange, but the widely-reported part is
  aggregator testimony and is not what this file is relying on.

### B. One-line characterisation
A Chinese multinational technology company headquartered in Beijing, working in consumer electronics,
software and electric vehicles; the **third-largest smartphone seller in the world as of 2025**, behind
Apple and Samsung; 754.1 million global monthly active users as of December 2025; ranked 232nd on the
Fortune Global 500 and the youngest company on that list.
- `https://en.wikipedia.org/api/rest_v1/page/summary/Xiaomi` — checked 2026-09-26.
- Restatable in Persian honestly: Chinese, Beijing, third in smartphones (2025), also makes electric
  vehicles. Every attribute is in the source.

### C. Official tagline
**UNSOURCED.** `https://www.mi.com/global/`'s own meta description is functional — "Welcome to Xiaomi global
official website to discover the latest smartphones, tablets, wearables, smart EVs, smart home devices and
more." — with no slogan. Do not print an unverified one.

### D. What would be wrong to say
1. **"Apple of China" is a press epithet, not Xiaomi's own statement.** It appears in the encyclopaedia entry
   as a nickname. Printing it as if Xiaomi called itself that is a false attribution.
2. **The market-share and MAU figures are point-in-time.** "Third-largest" is as of 2025 and 754.1M MAU is
   December 2025. Both age, and a card that hard-codes them will be stale. Prefer the durable attributes
   (Chinese, Beijing, EVs as well as phones) over the ranked ones.
3. **Do not present `#FF6900` as a guideline value** (see A).

---

## NOKIA

### A. Signature colour
**UNSOURCED.** The association is blue, in words. **I could not obtain a hex.**

- Nokia *does* operate an official design system at `https://designsystem.nokia.com/`, which is the right
  place for a primary answer. It is a JavaScript application: the root returned only a title and a login
  affordance, and `/colors` returned no readable content without login. Checked 2026-09-26.
- **A value I am deliberately refusing to report.** `https://www.nokia.com/`'s served HTML contains
  `#005AFF` six times and `#124191` twice. **I am not offering `#005AFF` as Nokia's colour.** It is a
  generic bright blue, it is also the value Apple's system UI uses for its own blue, and a single
  brand's homepage containing a common link/accent blue is not evidence of a brand palette. Quoting it
  would be a guess wearing a citation's clothes.
- Nokia's own media library entry for the logo exists at
  `https://www.nokia.com/about-us/newsroom/media-resources/media-library/nokia-logo/` (found via search,
  2026-09-26) but I did not read it for a colour specification.

### B. One-line characterisation
A Finnish multinational technology corporation headquartered in Espoo, **established in 1865 as a pulp
mill**; around 92,000 employees across more than 100 countries and roughly €23 billion revenue (2020
figures). Nokia describes itself as "a technology leader across mobile, fixed and cloud networks".
- `https://en.wikipedia.org/api/rest_v1/page/summary/Nokia` — checked 2026-09-26.
- Nokia's own positioning sentence, from its meta description: "As a technology leader across mobile, fixed
  and cloud networks, our solutions enable a more productive, sustainable and inclusive world." —
  `https://www.nokia.com/`, checked 2026-09-26.
- The 1865 pulp-mill origin is the single most useful honest attribute here: it is verifiable, unexpected,
  and it is the fact that stops anyone reading "Nokia" as only-a-phone-company.

### C. Official tagline
**No short slogan — and the sentence Nokia does publish is not one.** Its own site states the positioning
line quoted in B. That is a corporate positioning statement, not a registered slogan. **Do not set it as a
tagline**, because on a card it would read as a slogan Nokia never registered. "Connecting People" is widely
asserted for Nokia and is **UNSOURCED this session** — do not print it.

### D. What would be wrong to say
1. **"Nokia makes phones" is wrong today, and it is the most important correction in this file.** Nokia
   entered a **long-term licensing deal making HMD the exclusive manufacturer of Nokia-branded phones and
   tablets** — `https://en.wikipedia.org/wiki/Nokia` (Mobile subsidiary section), checked 2026-09-26.
   Setting Nokia beside Apple and Samsung as a phone manufacturer states something untrue about the current
   relationship. If a card implies a factory, it is false.
2. **Do not attach a hex to Nokia.** (See A.)
3. **Do not present the 92,000-employee and €23B figures as current.** They are 2020 figures; the entry is
   explicit about the year.

---

## REALME

### A. Signature colour
**Yellow, in words. UNSOURCED for a hex.**

- The colour most associated with realme is **yellow** (the brand's logo block). I reached no guideline
  document, and **no yellow appeared in the served HTML** of `https://www.realme.com/`, checked
  2026-09-26. I am not going to quote a yellow hex from memory, which is exactly the plausible-guess
  failure the brief prohibits.
- Consequence: if the deck needs a realme value, it is a project token and must be labelled as ours.

### B. One-line characterisation
A Chinese consumer-electronics manufacturer based in Shenzhen, founded **4 May 2018** by Sky Li; it passed
200 million cumulative smartphone shipments in November 2023 and was reported to have passed 300 million
global users in August 2025. **In 2026 it was reintegrated into Oppo as a sub-brand**, and in July 2026 it
announced it would stop launching new products in China and concentrate on overseas markets.
- `https://en.wikipedia.org/wiki/Realme` — checked 2026-09-26.
- Restatable in Persian honestly: Chinese, Shenzhen, founded 2018, an Oppo sub-brand again as of 2026.
  The last one is a fact a shopper can be told without embarrassment.

### C. Official tagline
**SOURCED — and it is realme's own words.** realme's homepage title reads:

> `realme (United Kingdom) - Make it real`

- `https://www.realme.com/` — `<title>` element, checked 2026-09-26.
- This is a **primary source**: the string is on realme's own domain. It is the one genuine registered
  brand line among the six.
- **Two caveats, kept deliberately.** (1) It was read from the **United Kingdom** regional site, so it is
  region-scoped, though a brand tagline is far likelier to be global than a palette. (2) realme's own meta
  description on that same page is *not* a slogan — "realme is an  brand which is committed to offering
  powerful performance, stylish design and sincere services." — note it also contains a **grammatical error
  in realme's own markup** ("an  brand"), so do not quote that description as a polished line.

### D. What would be wrong to say
1. **"realme is an independent company" is false as of 2026.** It was spun out of Oppo in 2018 and
   **reintegrated as an Oppo sub-brand, announced 7 January 2026**
   (`https://www.wikipedia.org/wiki/Realme`, checked 2026-09-26). Any copy implying independence is out of
   date — and this is the kind of sentence that gets written from memory and never re-checked.
2. **"realme left China" needs its actual shape.** From July 2026 it stopped launching *new products* in
   China; Oppo handles continuing sales and warranty for existing devices there, and Realme UI is being
   replaced by ColorOS on supported devices. "Withdrew from China" is a compression that loses the part a
   shopper would act on.
3. **"Sixth-largest smartphone vendor" is a 2021 figure** and should not be presented as current rank.
4. **Do not attach a hex to realme.** (See A.)

---

## TCH (TCL)

> **A naming note before anything else.** `TCH` is this repository's key and the Persian rendering
> `تی-سی-اچ`; the company's own name is **TCL**. A card labelled "TCH" may simply read as a typo to a
> shopper. That is a naming decision for whoever owns the card, not a research finding, but it should be a
> deliberate one.

### A. Signature colour
**UNSOURCED.** No saturated colour value appeared in the served HTML of `https://www.tcl.com/`, and I
reached no TCL brand guideline. **Do not assert a TCL hex.** I am aware of a TCL blue being commonly cited;
like Samsung's, it is aggregator testimony I could not corroborate, and it is not recorded here as a fact.

### B. One-line characterisation
TCL Technology Group Corp., a Chinese, **partly state-owned** electronics company headquartered in Huizhou,
Guangdong; founded **1981 as TTK** and renamed **TCL in 1985**, taking its initials from **T**elephone
**C**ommunication**s** **L**imited after being sued by TDK over the TTK name; the **second-largest television
manufacturer by market share in 2022 and 2023**; 35,379 employees (2019) and about US$20.9 billion revenue
(2024).
- `https://en.wikipedia.org/wiki/TCL_Technology` — checked 2026-09-26.
- Restatable in Persian honestly: Chinese, partly state-owned, founded 1981, second-largest TV maker
  globally. **The TV fact is the honest headline for this brand** — see D.

### C. Official tagline
**SOURCED as the brand's own — with a distinction that matters.**

- **"The Creative Life"** is TCL's own **branding slogan**, adopted in **2014**, when TCL changed the
  meaning of its identifying initials from "Telephone Communication Limited" to that slogan, explicitly "for
  commercial purposes" — `https://en.wikipedia.org/wiki/TCL_Technology` (History), which cites TCL's own
  About page, checked 2026-09-26.
- **The distinction the brief asks for, stated precisely.** The *slogan* is TCL's own and is safe to
  attribute. The claim that **TCL is an acronym for it is a claim the source itself hedges** — the same
  entry says TCL is "**claimed to be** an abbreviation for The Creative Life", having actually stood for
  Telecom Communications Limited since 1985. So: quoting the slogan is fine; asserting the acronym reading
  is not.
- **Regional caveat:** `https://www.tcl.com/` served **"TCL Deutschland"** on 2026-09-26.

### D. What would be wrong to say
1. **Presenting TCH beside Apple and Samsung as a phone brand overstates it.** TCL's mobile phones were
   sold under **Alcatel** and **Thomson** globally, and TCL announced in 2007 that it would move to its own
   brand; its **first own-branded Android phone was the TCL Plex, in late 2019** —
   `https://en.wikipedia.org/wiki/TCL_Technology`, checked 2026-09-26. On a brands *phone* deck, TCL is the
   brand whose reputation is overwhelmingly **televisions** (2nd largest globally). A shopper seeing "TCL"
   will think TV.
2. **Do not assert the acronym reading of "The Creative Life."** (See C.)
3. **Do not attach a hex.** (See A.)
4. Context worth knowing, not for the card: TCL is a former BlackBerry and Palm brand owner, and in January
   2026 entered a joint venture with Sony in which TCL holds 51%.

---

## Summary — what is and is not established

| Brand | A. Colour | Hex status | B. Characterisation | C. Tagline | D. Key correction |
|---|---|---|---|---|---|
| APPLE | monochrome black/white/grey | **UNSOURCED** — Apple publishes none | SOURCED | **UNSOURCED** | Logo use is a trademark question, rules UNSOURCED (404) — needs legal review |
| SAMSUNG | deep blue, corporate vs retail contested | **AGGREGATOR-ONLY** #1428A0 — do not print as official | SOURCED (phone rank indirectly) | **UNSOURCED** | Site is geo-localised (we got Samsung Deutschland) |
| XIAOMI | orange | **#FF6900 observed on mi.com/global** — best of the six, not a guideline | SOURCED | **UNSOURCED** | "Apple of China" is a press epithet, not Xiaomi's words |
| NOKIA | blue | **UNSOURCED** — design system unreadable; refused to quote a generic link blue | SOURCED | Positioning sentence, **not a slogan** | **"Nokia makes phones" is false — HMD is the exclusive licensed manufacturer** |
| REALME | yellow | **UNSOURCED** — no hex observed | SOURCED | **SOURCED: "Make it real"** (realme.com `<title>`, UK site) | **"Independent company" is false — Oppo sub-brand again since Jan 2026** |
| TCH | UNSOURCED | **UNSOURCED** | SOURCED | **SOURCED: "The Creative Life"**, adopted 2014 | A TV company first; own-brand phones only from 2019 |

**Only two of the six have a tagline I can stand behind**, and only one (realme) has it from the brand's own
live markup rather than a secondary source. **No brand has a citable guideline hex.** Two
misattributions are worth more than any colour choice here: **Nokia does not manufacture phones (HMD does)**,
and **realme is an Oppo sub-brand again**. Both are the kind of sentence that gets written from memory.

**If someone with working search picks this up**, the highest-value next step is a primary guideline PDF for
Samsung, realme, Nokia and TCL, in that order — those four are the ones where a real hex would change a
token. Xiaomi's `#FF6900` is close enough to act on, provided it is labelled as observed rather than
official.
