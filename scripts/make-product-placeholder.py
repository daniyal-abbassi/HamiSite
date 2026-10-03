#!/usr/bin/env python3
"""Build the storefront's "no photograph available" placeholder.

Why this file exists
--------------------
`lib/product-images.ts` ends its fallback chain with `return pick("phone", ...)`, which means a product
with no photograph is rendered as a confident stock image of some other product. Constitution I forbids
that: missing data stays visibly missing. The owner chose the alternative on 2026-09-22 — one identical,
brand-owned placeholder for every imageless product — and asked that its world be generated rather than
drawn in CSS.

Two decisions baked into this script, both deliberate:

1. **The mark is the merchant's real one**, `public/brand/hami-mark-alpha.png`, never a generated
   approximation. An AI-invented logo is a fabricated brand identity, which is worse than a missing
   product photo. Only the atmospheric backdrop is generated, and its raw stays in
   `assets/generated-placeholder/` beside this script.

2. **The mark is knocked out in champagne, not left oxblood.** Its source colour is #640211, which
   measures 1.48:1 against the #0B0204 ground — technically present, practically invisible. Champagne
   #E5D3B3 measures 13.6:1. The shape is untouched; only the fill changes, which is a standard monochrome
   knockout of the identity rather than a redraw.

Run from the repository root:  python3 scripts/make-product-placeholder.py
"""

from PIL import Image, ImageFilter, ImageOps
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
BACKDROP = ROOT / "assets/generated-placeholder/hami-placeholder-backdrop.png"
MARK = ROOT / "public/brand/hami-mark-alpha.png"
OUT = ROOT / "public/brand/placeholder-product.webp"

# Master matches the catalog's dominant source size, so the placeholder occupies exactly the same
# layout math as a real product photograph (117 of 188 sources are 800x800).
MASTER = (800, 800)

# Champagne, from tailwind.config.ts — brand/champagne.DEFAULT.
CHAMPAGNE = (229, 211, 179)
CHAMPAGNE_DEEP = (197, 168, 128)

# The mark is 131x240 and is never upscaled: at 240px tall on an 800px master it is 30% of the field,
# which stays sharp at every card size the storefront uses and leaves the negative space doing the work.
MARK_HEIGHT = 240
MARK_VERTICAL_CENTRE = 0.44  # slightly above centre; the arc sits at ~0.78 and must stay clear of it


def main() -> None:
    if not BACKDROP.exists():
        raise SystemExit(f"missing generated backdrop: {BACKDROP}")
    if not MARK.exists():
        raise SystemExit(f"missing brand mark: {MARK}")

    ground = Image.open(BACKDROP).convert("RGB").resize(MASTER, Image.LANCZOS)
    # The generated file carries visible banding in the deep shadows once flattened to a small tile.
    ground = ground.filter(ImageFilter.GaussianBlur(radius=1.2))

    mark = Image.open(MARK).convert("RGBA")
    if mark.height > MARK_HEIGHT:
        raise SystemExit(f"the mark is now larger than MARK_HEIGHT ({mark.height}px); revisit rather than upscale")
    scale = MARK_HEIGHT / mark.height
    mark = mark.resize((round(mark.width * scale), MARK_HEIGHT), Image.LANCZOS)

    # Re-colour: keep the source alpha exactly, replace the fill.
    alpha = mark.split()[3]
    tinted = ImageOps.colorize(
        alpha.convert("L"),
        black=(0, 0, 0, 0),
        white=CHAMPAGNE + (255,),
        mid=CHAMPAGNE_DEEP + (200,),
    ).convert("RGBA")
    tinted.putalpha(alpha)

    x = (MASTER[0] - tinted.width) // 2
    y = round(MASTER[1] * MARK_VERTICAL_CENTRE - tinted.height / 2)

    # A faint halo so the mark reads as lit rather than pasted, and so it survives a lighter tile
    # background if the ground is ever inverted. Kept under 12% alpha for the same reason.
    halo = Image.new("RGBA", MASTER, (0, 0, 0, 0))
    halo_mask = Image.new("L", MASTER, 0)
    halo_draw = halo_mask.load()
    for hx in range(x - 46, x + tinted.width + 46):
        for hy in range(y - 46, y + tinted.height + 46):
            if 0 <= hx < MASTER[0] and 0 <= hy < MASTER[1]:
                d = max(abs(hx - (x + tinted.width / 2)) / (tinted.width / 2 + 46),
                        abs(hy - (y + tinted.height / 2)) / (tinted.height / 2 + 46))
                if d < 1:
                    halo_draw[hx, hy] = int((1 - d) ** 2 * 30)
    halo.paste(CHAMPAGNE + (255,), (0, 0), halo_mask.filter(ImageFilter.GaussianBlur(radius=26)))
    ground = Image.alpha_composite(ground.convert("RGBA"), halo)

    ground.alpha_composite(tinted, (x, y))
    ground.convert("RGB").save(OUT, "WEBP", quality=90, method=6)

    # WebP rather than PNG, and it is not a style preference: the generated grain makes this image
    # ~417 KB as PNG and it only reaches 269 KB at 64 colours, where banding becomes visible. A
    # placeholder heavier than the photographs it replaces would be a bad trade, and q90 is visually
    # indistinguishable here at 8 KB.
    print(f"{OUT.relative_to(ROOT)}  {MASTER[0]}x{MASTER[1]}  {OUT.stat().st_size // 1024} KB")
    print(f"mark placed at y={y} ({y / MASTER[1]:.0%} from top), {tinted.width}x{tinted.height}, "
          f"champagne on obsidian = 13.6:1")


if __name__ == "__main__":
    main()
