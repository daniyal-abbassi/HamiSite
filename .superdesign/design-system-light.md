# Hami Hamrah — Light Premium context

**This file replaces `design-system.md` for this exploration.** That one opens
with "Dark-only; there is no light theme" and describes a near-black ink canvas.
It is the wrong instrument here and was actively producing the wrong result:
across four generated variants, every dark one collapsed into a sparse void
(1–2% of pixels carrying content) while every light one came back dense and
complete (89–99%). The ground is not a matter of taste in this project — it is
the difference between a page with goods on it and a page with nothing on it.

Persian (RTL) storefront for a Mashhad phone and accessory retailer, twenty
years in the bazaar. B2C plus wholesale.

## North star

**Premium and luxurious, on light.** The feeling to hit is a boutique on a
bright street: calm, expensive, generous with space, quietly confident. Not a
nightclub, not a tech showcase, not a discount bazaar.

Luxury here comes from four things, in this order:

1. **Space.** Wide margins, real silence around elements. The single most
   premium signal available and the cheapest to get right.
2. **Type.** A confident scale with big jumps between levels. Restraint in
   weight, generosity in size.
3. **Material.** Surfaces that read as substances — paper, stone, brushed
   metal, warm glass — not as coloured rectangles.
4. **Restraint in colour.** One brand colour, one companion, and a great deal
   of near-neutral. Colour earns its place by meaning something.

## The one fixed rule

**RAL 3004 oxblood `#640211` is the brand's DNA and must survive in every
direction.** Everything else is open — the companion colour, the neutrals, the
ground — but this red is the thread. It is also the actual ink of the client's
logo files (measured `#660316` and `#6B1426`), so it is not a preference, it is
the identity.

Free to mix any companion colour with it.

## Ground

Light. Warm rather than clinical — ivory, bone, alabaster, warm greige. Pure
`#FFFFFF` only as a raised surface (a card, a plinth), not as the page.

Depth on a light page comes from **layered near-neutrals and shadow**, not from
darkening. A premium light page still has a top and a bottom that differ.

## Type

Persian is the primary script and must be set as well as the Latin.

- Persian: Vazirmatn. Never split Persian words into per-letter spans — the
  script joins contextually and per-letter wrapping renders «موبایل» as
  «م و ب ا ی ل». This has already broken once in this project.
- Latin model codes (`Redmi Note 14 Pro`, `Galaxy S24 Ultra`) stay LTR inline,
  set in mono, small. They are disambiguators, not headlines.
- **The Persian product name is the product's name.** It leads. The Latin code
  is secondary.

## Product cards

The goods are the point of the page. Every card carries, without exception:

| | |
|---|---|
| Persian name | large, the card's headline |
| Latin model code | small, mono, LTR |
| price | the largest number on the card |
| struck old price + discount % | when the product is reduced |
| stock status | in **Persian** — موجود / موجود محدود / ناموجود |
| add-to-cart | a real, visible control |

Stock and add-to-cart have been silently dropped by generation before, and
"In Stock" has leaked in English. Both are defects.

## Real content only

Brands in this catalogue: **تی سی اچ، سامسونگ، شیائومی، نکسا، نوکیا، ریلمی،
اپل**. Products are phones, earbuds, power banks, chargers and cables. Do not
invent products the shop does not sell.

The twenty-year claim — «۲۰ سال سابقه در بازار مشهد» — is the shop's strongest
trust signal and should be given real presence, not a line of faint text.

## Logo

Render the supplied wordmark **image**. Never re-typeset «حامی همراه» as live
text — Persian is cursive and re-typesetting mangles it. This has already
happened once in this project's generated output.

## Contrast

Every text colour is chosen against the surface it actually sits on, and clears
4.5:1. A palette is only legible against the ground it was picked for — a set
tuned for a dark card measured 2.03:1 the moment the card turned white.

## What "boring" means here, measured

The live site's ground returned the *same three RGB values* at nine different
scroll depths — ten thousand pixels of scrolling with no change. Whatever the
direction, the page must **arrive somewhere** as it is scrolled: the ground at
the bottom should not equal the ground at the top, and every screen should give
the eye something worth looking at.

Airy is not empty. Generous margins around substance — never margins around
nothing.
