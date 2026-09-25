# Category panel imagery — generation prompts

Nine panels, one per department in `lib/category-departments.ts`. Generate these yourself and drop
the files into `public/images/categories/` with the exact filenames below — the component reads them
by `kind`, so a mismatched name renders an empty panel.

## Two rules that are not negotiable

**1. Do NOT ask the model to draw the Hami logo or any Persian text.** Image models cannot render
Persian script — you will get plausible-looking gibberish glyphs, and the wordmark plus the tagline
«اطمینان در انتخاب» will be wrong in every single generation. The logo is composited in CSS as a
real `<Image>` overlay instead, which stays crisp at any size, sits in exactly the same place on all
nine panels, and can be repositioned without regenerating anything. Every prompt below therefore
asks for a *clean reserved area* for it.

**2. No real brand trade dress.** v1 of the probe produced an unmistakable iPhone (mute switch, two
volume keys, pill speaker slit) from the words "modern smartphone" alone. That asserts a product
Hami sells and implies an endorsement — Principle I, no exception path. Every prompt names the
object generically and forbids the specific tells.

## Palette anchor

- Ground `#0B0204` obsidian · accent `#E5D3B3` champagne (this is also `--aqua` and `--gold`)
- Deep `#640211` oxblood — use as a **near-black wine shadow**, never as a bright red
- Cream `#F0ECE9` for the logo treatment

The v2 probe overshot: mean saturation 0.914, a lava crimson that fights the page. v3's correction
is baked into every prompt below — if you change one thing, change it in the shared block, not
per-prompt.

## Shared block

Prepend this to each subject line, verbatim.

```
Ultra-premium commercial product photograph for a luxury electronics storefront category panel.
Vertical 3:4 portrait composition, 1086x1448.

LIGHTING: a bright warm champagne-gold key light (#E5D3B3) raking from the upper left, and a crisp
gold rim light tracing the object's edges so it reads clearly and brightly against the dark.
The object is luminous and jewel-like, occupying about 45 percent of the image height, centred
slightly above the middle, with generous dark margin on every side. It never touches the frame edges.

BACKGROUND: very dark, deep oxblood wine glow (#640211) which is almost black. NOT bright red,
NOT crimson, NOT scarlet, NOT orange. Heavily desaturated and darkened. Champagne gold is the only
bright accent in the image.

FOREGROUND: the bottom third is a plain, very dark, almost black polished surface with no veining
and no pattern — clean empty negative space reserved for overlaid text. Any stone veining appears
only in the narrow middle band around the base of the object, never in the bottom third.

The object stands on a dark polished stone plinth with a faint mirror reflection beneath it.
Cinematic, restrained, high-end jewellery-store lighting. Photorealistic studio product
photography, 85mm lens, shallow depth of field.

ABSOLUTELY NO: text, letters, numbers, typography, writing of any kind, logos, brand marks,
watermarks, hands, people, packaging with printing, screens showing a user interface.
```

## The nine subjects

### 1. `phone.png` — گوشی موبایل

```
SUBJECT: a single generic slab smartphone — a plain rectangular device with softly rounded corners
and a completely uniform, featureless edge. NO side buttons, NO mute switch, NO notch, NO pill-shaped
speaker cutout, NO camera bump, NO visible camera lenses, no brand of any kind. Standing upright in a
slight three-quarter view, mirror-black glass front catching a soft gradient reflection of the gold
and wine light.
```

### 2. `audio.png` — هدفون و ایرپاد

```
SUBJECT: a pair of over-ear wireless headphones in matte black with champagne-gold hinges and ear-cup
rings, standing upright on the plinth, ear cushions facing slightly toward camera. Beside them, low in
the frame and softly out of focus, a small closed charging case. No logos on the ear cups, no printed
text anywhere, no visible brand lettering.
```

### 3. `charger.png` — شارژر و کابل

```
SUBJECT: a compact square wall adapter with rounded corners and two plain metal pins, standing on end,
next to a neatly coiled braided cable tied with a thin gold-toned band. Matte black body, champagne
gold accents on the pins. Generic shapes only — no connector branding, no printed specification text,
no regulatory markings.
```

### 4. `smartwatch.png` — ساعت هوشمند

```
SUBJECT: a smartwatch with a rounded-rectangle case and a plain dark sport band, standing upright in a
three-quarter view so the band curves naturally. Polished champagne-toned case edge, mirror-black
screen reflecting the gold light — the screen is OFF and shows no interface, no icons, no digits, no
clock face. No side crown detailing that reads as a specific brand.
```

### 5. `powerbank.png` — پاوربانک

```
SUBJECT: a slim rectangular power bank standing upright on its long edge, matte black with a single
thin champagne-gold seam line and four small unlit indicator dots along the base. A short cable lies
loosely beside it. No printed capacity figures, no brand text, no icons on the body.
```

### 6. `computer-accessory.png` — لوازم کامپیوتر

```
SUBJECT: a low-profile wireless mouse in matte black with a champagne-gold scroll wheel, resting at a
three-quarter angle on the plinth, with a slim closed laptop standing vertically just behind it and
softly out of focus. The laptop lid is completely plain — no logo, no emblem, no text, no brand mark
of any kind.
```

### 7. `sim-card.png` — سیم‌کارت

```
SUBJECT: a nano SIM card resting at a slight angle on top of a larger SIM adapter frame, both in
matte dark grey with champagne-gold contact pads catching the light. The card surface is blank — no
carrier logo, no printed numbers, no text, no chip branding, no barcode.
```

### 8. `car-charger.png` — شارژر فندکی

```
SUBJECT: a cylindrical 12V car charger plug standing upright, matte black body with a champagne-gold
spring contact and a single USB port, beside a short coiled cable. Generic industrial form — no brand
text, no printed wattage, no logos.
```

### 9. `service.png` — خدمات آنلاین

```
SUBJECT: two plain rectangular gift-card shapes with rounded corners, matte black with a single
champagne-gold diagonal sheen, one leaning against the other, standing on the plinth. Completely
blank faces — no numbers, no text, no logos, no barcode, no magnetic stripe branding, no currency
symbols. This panel represents intangible services, so the objects are abstract tokens, not devices.
```

## Drop-in convention

```
public/images/categories/
├── phone.png
├── audio.png
├── charger.png
├── smartwatch.png
├── powerbank.png
├── computer-accessory.png
├── sim-card.png
├── car-charger.png
└── service.png
```

3:4 portrait, PNG, at least 1086×1448. Filenames are final — they become the `image` field keyed by
department `kind`.

## One thing you need to supply

The logo overlay needs a transparent mark that survives a dark ground. What exists today:

| File | Size | Alpha | Usable? |
|---|---|---|---|
| `hami-mark-alpha.png` | 131×240 | yes | oxblood → invisible on `#0B0204`; too small to render large |
| `hami-mark.png` | 1254×1254 | no | right size, but the wine-on-cream box will show |
| `HamiHamrah(حامی همراه)-Logo.png` | 1254×1254 | no | full lockup incl. Persian text; no alpha |

**Ask:** a **cream `#F0ECE9` version of the mark alone** (no wordmark, no tagline) as a transparent
PNG, at least **600×600**, saved as `public/brand/hami-mark-cream-alpha.png`. With that the overlay
is one line of CSS. Without it the mark either disappears into the dark or arrives as an opaque
rectangle.
