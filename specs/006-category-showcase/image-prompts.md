# Category panel imagery — nine standalone prompts

Nine panels, one per department in `lib/category-departments.ts`. Each block below is **complete on its
own** — nothing to prepend, nothing to assemble. Paste one into ChatGPT or Gemini, generate, save it under
the filename in its heading.

Drop them in `public/images/categories/v3/` (not the directory root: `phone.png` and `computer.png` already
render from the old set, and a design decision is still owed on this section).

## The two rules that survive every regeneration

**1. Never ask the model to draw the Hami logo or any Persian text.** Image models cannot render Persian
script — you get plausible-looking gibberish glyphs, wrong in every generation. The wordmark and
«اطمینان در انتخاب» are composited in CSS as a real overlay instead: crisp at any size, identical on all
nine panels, repositionable without regenerating anything. Every prompt therefore asks for a *clean reserved
area* in the bottom third.

**2. No real brand trade dress.** An earlier probe produced an unmistakable iPhone (mute switch, two volume
keys, pill speaker slit) from the words "modern smartphone" alone. That asserts merchandise Hami sells and
implies an endorsement — Constitution Principle I, which has no exception path. Every prompt names the object
generically, forbids the specific tells, and still demands the shape read as its category at a glance.

## Palette, and why each panel gets exactly one hue

- Ground `#0B0204` obsidian · wine `#640211` oxblood used as a **near-black shadow, never a bright red**
- `#E5D3B3` champagne gold — the brand accent, and the brightest thing in every frame
- One **vivid category hue** per panel, pooled low in the background and picked up on one edge of the object

The hue is where "vibrant" comes from; the dark ground is what stops it wrecking the brand. An earlier set
that leaned on hue alone came out at mean saturation 0.914 — a lava crimson that fought the page — so each
prompt below pins the hue to the shadow and keeps gold dominant. Nine distinct hues also mean a shopper can
tell departments apart before reading a single label, which is the actual bar.

---

## 1 · `phone.png` — گوشی موبایل — sapphire blue

```
Ultra-premium commercial product photograph for a luxury electronics storefront category panel. Vertical 3:4 portrait composition, 1086x1448.

GROUND: very dark deep oxblood wine glow (#640211) fading to near-black obsidian (#0B0204) at the edges. This dark ground must dominate the frame and must NOT be replaced by bright colour — it is the storefront's brand identity.
ACCENT LIGHT: a warm champagne-gold (#E5D3B3) key light raking from the upper left, plus a crisp gold rim light tracing the object's edges so it reads brightly against the dark.
CATEGORY COLOUR: one vivid SAPPHIRE BLUE glow pooled low in the background behind the object, and a soft blue edge light on one side of the object only. Saturated and alive but held in the shadow — jewel light in a dark room, not a poster. Never neon, never pastel, never covering the whole frame. Champagne gold stays the brightest thing in the image.

SUBJECT: one modern smartphone standing upright in a three-quarter view, mirror-black glass, a small generic round camera lens visible on the upper back edge. It must be unmistakably a phone at a single glance from across the room. Generic industrial design only: no logo, no brand mark, no Apple-specific details, no notch, no pill speaker cutout, no printed text; the screen is off and shows no user interface, only a soft gradient reflection of gold and blue light.

The object occupies about 50 percent of the image height, centred slightly above the middle, with generous dark margin on every side, never touching the frame edges. It stands on a dark polished stone plinth with a faint mirror reflection beneath it. The bottom third is a plain very dark almost-black polished surface with no veining and no pattern — clean empty negative space reserved for overlaid text.
Cinematic, restrained, high-end jewellery-store lighting. Photorealistic studio product photography, 85mm lens, shallow depth of field.

ABSOLUTELY NO: text, letters, numbers, typography, writing of any kind, logos, brand marks, watermarks, hands, people, packaging with printing, screens showing a user interface.
```

## 2 · `audio.png` — هدفون و ایرپاد — cyan teal

```
Ultra-premium commercial product photograph for a luxury electronics storefront category panel. Vertical 3:4 portrait composition, 1086x1448.

GROUND: very dark deep oxblood wine glow (#640211) fading to near-black obsidian (#0B0204) at the edges. This dark ground must dominate the frame and must NOT be replaced by bright colour — it is the storefront's brand identity.
ACCENT LIGHT: a warm champagne-gold (#E5D3B3) key light raking from the upper left, plus a crisp gold rim light tracing the object's edges so it reads brightly against the dark.
CATEGORY COLOUR: one vivid CYAN-TEAL glow pooled low in the background behind the object, and a soft teal edge light on one side of the object only. Saturated and alive but held in the shadow — jewel light in a dark room, not a poster. Never neon, never pastel, never covering the whole frame. Champagne gold stays the brightest thing in the image.

SUBJECT: a pair of over-ear wireless headphones in matte black with champagne-gold hinges and ear-cup rings, standing upright on the plinth, ear cushions facing slightly toward camera. Beside them, low in the frame and softly out of focus, a small closed charging case. It must be unmistakably headphones at a single glance from across the room. No logos on the ear cups, no printed text anywhere, no brand lettering, generic industrial design only.

The object occupies about 50 percent of the image height, centred slightly above the middle, with generous dark margin on every side, never touching the frame edges. It stands on a dark polished stone plinth with a faint mirror reflection beneath it. The bottom third is a plain very dark almost-black polished surface with no veining and no pattern — clean empty negative space reserved for overlaid text.
Cinematic, restrained, high-end jewellery-store lighting. Photorealistic studio product photography, 85mm lens, shallow depth of field.

ABSOLUTELY NO: text, letters, numbers, typography, writing of any kind, logos, brand marks, watermarks, hands, people, packaging with printing, screens showing a user interface.
```

## 3 · `charger.png` — شارژر و کابل — warm amber

```
Ultra-premium commercial product photograph for a luxury electronics storefront category panel. Vertical 3:4 portrait composition, 1086x1448.

GROUND: very dark deep oxblood wine glow (#640211) fading to near-black obsidian (#0B0204) at the edges. This dark ground must dominate the frame and must NOT be replaced by bright colour — it is the storefront's brand identity.
ACCENT LIGHT: a warm champagne-gold (#E5D3B3) key light raking from the upper left, plus a crisp gold rim light tracing the object's edges so it reads brightly against the dark.
CATEGORY COLOUR: one vivid WARM AMBER glow pooled low in the background behind the objects, and a soft amber edge light on one side only. Saturated and alive but held in the shadow — jewel light in a dark room, not a poster. Never neon, never pastel, never covering the whole frame. Champagne gold stays the brightest thing in the image.

SUBJECT: a compact square fast-charging wall adapter with rounded corners and two plain metal pins, standing on end beside a neatly coiled braided charging cable tied with a thin gold band. Together they must read as charger-and-cable at a single glance from across the room. Matte black body with champagne-gold accents on the pins. Generic shapes only: no connector branding, no printed specification text, no regulatory markings, no logos.

The two objects occupy about 50 percent of the image height together, centred slightly above the middle, with generous dark margin on every side, never touching the frame edges. They stand on a dark polished stone plinth with a faint mirror reflection beneath them. The bottom third is a plain very dark almost-black polished surface with no veining and no pattern — clean empty negative space reserved for overlaid text.
Cinematic, restrained, high-end jewellery-store lighting. Photorealistic studio product photography, 85mm lens, shallow depth of field.

ABSOLUTELY NO: text, letters, numbers, typography, writing of any kind, logos, brand marks, watermarks, hands, people, packaging with printing, screens showing a user interface.
```

## 4 · `smartwatch.png` — ساعت هوشمند — violet

```
Ultra-premium commercial product photograph for a luxury electronics storefront category panel. Vertical 3:4 portrait composition, 1086x1448.

GROUND: very dark deep oxblood wine glow (#640211) fading to near-black obsidian (#0B0204) at the edges. This dark ground must dominate the frame and must NOT be replaced by bright colour — it is the storefront's brand identity.
ACCENT LIGHT: a warm champagne-gold (#E5D3B3) key light raking from the upper left, plus a crisp gold rim light tracing the object's edges so it reads brightly against the dark.
CATEGORY COLOUR: one vivid VIOLET glow pooled low in the background behind the object, and a soft violet edge light on one side of the object only. Saturated and alive but held in the shadow — jewel light in a dark room, not a poster. Never neon, never pastel, never covering the whole frame. Champagne gold stays the brightest thing in the image.

SUBJECT: a smartwatch with a rounded-rectangle case and a plain dark sport band, standing upright in a three-quarter view so the band curves naturally. It must be unmistakably a smartwatch at a single glance from across the room. Polished champagne-toned case edge; mirror-black screen reflecting the gold and violet light — the screen is OFF and shows no interface, no icons, no digits, no clock face. Generic industrial design only: no logo, no brand mark, no crown detailing that reads as a specific brand, no printed text.

The object occupies about 50 percent of the image height, centred slightly above the middle, with generous dark margin on every side, never touching the frame edges. It stands on a dark polished stone plinth with a faint mirror reflection beneath it. The bottom third is a plain very dark almost-black polished surface with no veining and no pattern — clean empty negative space reserved for overlaid text.
Cinematic, restrained, high-end jewellery-store lighting. Photorealistic studio product photography, 85mm lens, shallow depth of field.

ABSOLUTELY NO: text, letters, numbers, typography, writing of any kind, logos, brand marks, watermarks, hands, people, packaging with printing, screens showing a user interface.
```

## 5 · `powerbank.png` — پاوربانک — jade green

```
Ultra-premium commercial product photograph for a luxury electronics storefront category panel. Vertical 3:4 portrait composition, 1086x1448.

GROUND: very dark deep oxblood wine glow (#640211) fading to near-black obsidian (#0B0204) at the edges. This dark ground must dominate the frame and must NOT be replaced by bright colour — it is the storefront's brand identity.
ACCENT LIGHT: a warm champagne-gold (#E5D3B3) key light raking from the upper left, plus a crisp gold rim light tracing the object's edges so it reads brightly against the dark.
CATEGORY COLOUR: one vivid JADE GREEN glow pooled low in the background behind the object, and a soft green edge light on one side of the object only. Saturated and alive but held in the shadow — jewel light in a dark room, not a poster. Never neon, never pastel, never covering the whole frame. Champagne gold stays the brightest thing in the image.

SUBJECT: a slim rectangular power bank standing upright on its long edge, matte black with a single thin champagne-gold seam line and four small unlit indicator dots along the base, with a short cable lying loosely beside it. It must read as a portable battery at a single glance from across the room — chunky enough to be a brick, slim enough to be a pocket spare. No printed capacity figures, no brand text, no icons on the body, no logos.

The object occupies about 50 percent of the image height, centred slightly above the middle, with generous dark margin on every side, never touching the frame edges. It stands on a dark polished stone plinth with a faint mirror reflection beneath it. The bottom third is a plain very dark almost-black polished surface with no veining and no pattern — clean empty negative space reserved for overlaid text.
Cinematic, restrained, high-end jewellery-store lighting. Photorealistic studio product photography, 85mm lens, shallow depth of field.

ABSOLUTELY NO: text, letters, numbers, typography, writing of any kind, logos, brand marks, watermarks, hands, people, packaging with printing, screens showing a user interface.
```

## 6 · `computer-accessory.png` — لوازم کامپیوتر — magenta rose

```
Ultra-premium commercial product photograph for a luxury electronics storefront category panel. Vertical 3:4 portrait composition, 1086x1448.

GROUND: very dark deep oxblood wine glow (#640211) fading to near-black obsidian (#0B0204) at the edges. This dark ground must dominate the frame and must NOT be replaced by bright colour — it is the storefront's brand identity.
ACCENT LIGHT: a warm champagne-gold (#E5D3B3) key light raking from the upper left, plus a crisp gold rim light tracing the object's edges so it reads brightly against the dark.
CATEGORY COLOUR: one vivid MAGENTA-ROSE glow pooled low in the background behind the object, and a soft rose edge light on one side of the object only. Saturated and alive but held in the shadow — jewel light in a dark room, not a poster. Never neon, never pastel, never covering the whole frame. Champagne gold stays the brightest thing in the image.

SUBJECT: a low-profile wireless computer mouse in matte black with a champagne-gold scroll wheel, resting at a three-quarter angle on the plinth, with a slim closed laptop standing vertically just behind it and softly out of focus. The mouse must be the clear read at a single glance from across the room. The laptop lid is completely plain — no logo, no emblem, no text, no brand mark of any kind.

The objects occupy about 50 percent of the image height together, centred slightly above the middle, with generous dark margin on every side, never touching the frame edges. They stand on a dark polished stone plinth with a faint mirror reflection beneath them. The bottom third is a plain very dark almost-black polished surface with no veining and no pattern — clean empty negative space reserved for overlaid text.
Cinematic, restrained, high-end jewellery-store lighting. Photorealistic studio product photography, 85mm lens, shallow depth of field.

ABSOLUTELY NO: text, letters, numbers, typography, writing of any kind, logos, brand marks, watermarks, hands, people, packaging with printing, screens showing a user interface.
```

## 7 · `sim-card.png` — سیم‌کارت — emerald green

```
Ultra-premium commercial product photograph for a luxury electronics storefront category panel. Vertical 3:4 portrait composition, 1086x1448.

GROUND: very dark deep oxblood wine glow (#640211) fading to near-black obsidian (#0B0204) at the edges. This dark ground must dominate the frame and must NOT be replaced by bright colour — it is the storefront's brand identity.
ACCENT LIGHT: a warm champagne-gold (#E5D3B3) key light raking from the upper left, plus a crisp gold rim light tracing the object's edges so it reads brightly against the dark.
CATEGORY COLOUR: one vivid EMERALD GREEN glow pooled low in the background behind the object, and a soft green edge light on one side of the object only. Saturated and alive but held in the shadow — jewel light in a dark room, not a poster. Never neon, never pastel, never covering the whole frame. Champagne gold stays the brightest thing in the image.

SUBJECT: a nano SIM card resting at a slight angle on top of a larger SIM adapter frame, both in matte dark grey with champagne-gold contact pads catching the light, the notched corner clearly visible. The cut-corner silhouette must make it read as a SIM card at a single glance from across the room. The card surface is blank — no carrier logo, no printed numbers, no text, no chip branding, no barcode.

Because the object is small, shoot it as a tight macro: it still occupies about 50 percent of the image height, centred slightly above the middle, with generous dark margin on every side, never touching the frame edges. It sits on a dark polished stone plinth with a faint mirror reflection beneath it. The bottom third is a plain very dark almost-black polished surface with no veining and no pattern — clean empty negative space reserved for overlaid text.
Cinematic, restrained, high-end jewellery-store lighting. Photorealistic studio product photography, 85mm lens, shallow depth of field.

ABSOLUTELY NO: text, letters, numbers, typography, writing of any kind, logos, brand marks, watermarks, hands, people, packaging with printing, screens showing a user interface.
```

## 8 · `car-charger.png` — شارژر فندکی — ember orange

```
Ultra-premium commercial product photograph for a luxury electronics storefront category panel. Vertical 3:4 portrait composition, 1086x1448.

GROUND: very dark deep oxblood wine glow (#640211) fading to near-black obsidian (#0B0204) at the edges. This dark ground must dominate the frame and must NOT be replaced by bright colour — it is the storefront's brand identity.
ACCENT LIGHT: a warm champagne-gold (#E5D3B3) key light raking from the upper left, plus a crisp gold rim light tracing the object's edges so it reads brightly against the dark.
CATEGORY COLOUR: one vivid EMBER ORANGE glow pooled low in the background behind the object, and a soft orange edge light on one side of the object only. Saturated and alive but held in the shadow — jewel light in a dark room, not a poster. Never neon, never pastel, never covering the whole frame. Champagne gold stays the brightest thing in the image.

SUBJECT: a cylindrical 12V car cigarette-lighter charger plug standing upright, matte black body with a champagne-gold spring side contact and a single USB port on its face, a short coiled cable resting loosely beside it. The metal spring contact and the plug silhouette must make it read as a car charger at a single glance from across the room, distinct from the wall adapter. Generic industrial form: no brand text, no printed wattage, no logos.

The object occupies about 50 percent of the image height, centred slightly above the middle, with generous dark margin on every side, never touching the frame edges. It stands on a dark polished stone plinth with a faint mirror reflection beneath it. The bottom third is a plain very dark almost-black polished surface with no veining and no pattern — clean empty negative space reserved for overlaid text.
Cinematic, restrained, high-end jewellery-store lighting. Photorealistic studio product photography, 85mm lens, shallow depth of field.

ABSOLUTELY NO: text, letters, numbers, typography, writing of any kind, logos, brand marks, watermarks, hands, people, packaging with printing, screens showing a user interface.
```

## 9 · `service.png` — خدمات آنلاین — champagne gold only

```
Ultra-premium commercial product photograph for a luxury electronics storefront category panel. Vertical 3:4 portrait composition, 1086x1448.

GROUND: very dark deep oxblood wine glow (#640211) fading to near-black obsidian (#0B0204) at the edges. This dark ground must dominate the frame and must NOT be replaced by bright colour — it is the storefront's brand identity.
ACCENT LIGHT: a warm champagne-gold (#E5D3B3) key light raking from the upper left, plus a crisp gold rim light tracing the object's edges so it reads brightly against the dark.
CATEGORY COLOUR: none. This panel carries champagne gold alone — no second hue, no coloured glow. It is the brand's own signature colour used at full strength, and it is what makes the set feel composed rather than nine separate accidents.

SUBJECT: two plain rectangular gift-card tokens with rounded corners, matte black with a single champagne-gold diagonal sheen across each face, one leaning against the other, standing on the plinth. Completely blank faces — no numbers, no text, no logos, no barcode, no magnetic stripe branding, no currency symbols. This department sells intangible services, so the objects are abstract tokens rather than devices; they should read as "a code, a top-up, a service" at a glance.

The objects occupy about 50 percent of the image height together, centred slightly above the middle, with generous dark margin on every side, never touching the frame edges. They stand on a dark polished stone plinth with a faint mirror reflection beneath them. The bottom third is a plain very dark almost-black polished surface with no veining and no pattern — clean empty negative space reserved for overlaid text.
Cinematic, restrained, high-end jewellery-store lighting. Photorealistic studio product photography, 85mm lens, shallow depth of field.

ABSOLUTELY NO: text, letters, numbers, typography, writing of any kind, logos, brand marks, watermarks, hands, people, packaging with printing, screens showing a user interface.
```

---

## Drop-in convention

```
public/images/categories/v3/
├── phone.png                گوشی موبایل        sapphire blue
├── audio.png                هدفون و ایرپاد      cyan teal
├── charger.png              شارژر و کابل        warm amber
├── smartwatch.png           ساعت هوشمند         violet
├── powerbank.png            پاوربانک            jade green
├── computer-accessory.png   لوازم کامپیوتر      magenta rose
├── sim-card.png             سیم‌کارت             emerald green
├── car-charger.png          شارژر فندکی         ember orange
└── service.png              خدمات آنلاین         champagne gold
```

3:4 portrait, PNG, at least 1086×1448. The filename becomes the `image` field keyed by department `kind`, so
a mismatched name renders an empty panel.

## Still owed, and a model cannot supply it

The logo overlay needs a transparent mark that survives a dark ground. What exists today:

| File | Size | Alpha | Usable? |
|---|---|---|---|
| `hami-mark-alpha.png` | 131×240 | yes | oxblood → invisible on `#0B0204`; too small to render large |
| `hami-mark.png` | 1254×1254 | no | right size, but the wine-on-cream box will show |
| `HamiHamrah(حامی همراه)-Logo.png` | 1254×1254 | no | full lockup incl. Persian text; no alpha |

**Needed:** a **cream `#F0ECE9` version of the mark alone** (no wordmark, no tagline) as a transparent PNG, at
least **600×600**, saved as `public/brand/hami-mark-cream-alpha.png`. With it the overlay is one line of CSS.
Without it the mark either disappears into the dark or arrives as an opaque rectangle.
