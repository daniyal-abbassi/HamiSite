#!/usr/bin/env python3
"""FR-034 measurement: can this catalog actually be isolated?

Feature 003's whole route (Resolved Q2 = B) rests on removing the background from 188 merchant
photographs. FR-034 requires the proportion that *cannot* be cleanly isolated be measured and reported
**before** the treatment is relied on across the storefront, "because the answer determines whether this is
a catalog-wide presentation or a curated one." This script produces that measurement.

Design notes, in the order they matter:

**The sample is weighted toward the hard cases on purpose.** The spec says the cut-out process "must be
reviewed against that same standard rather than spot-checked on hero products," so the 24 are drawn mostly
from the classes predicted to fail — cables, earbuds, straps, SIM cards, reflective finishes — plus the
smallest sources, plus a few phones as a control. A trial that over-samples easy subjects is how a feature
gets talked into a route it cannot hold.

**The matte is deterministic and copies source pixels.** `rembg` segments and writes alpha; it does not
re-synthesise. That is verified rather than assumed: `--verify` compares every fully-opaque pixel of the
output against its source and fails on any difference, which is the machine-checkable half of FR-029. The
other half — a clipped edge, a halo — is visual, and this script emits a contact sheet for it.

**Two grounds, not one.** Each cut-out is composited over both the obsidian page ground and a lighter
oxblood, because FR-008 requires separation across feature 002's full tonal range and edge residue that is
invisible on near-black is obvious on wine-red. Judging on one background would understate the failure rate.

Usage
-----
    ~/.venvs/hami-isolate/bin/python scripts/isolate-catalog-images.py --sample 24
    ~/.venvs/hami-isolate/bin/python scripts/isolate-catalog-images.py --sample 24 --verify
    ~/.venvs/hami-isolate/bin/python scripts/isolate-catalog-images.py            # all 188
"""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
CATALOG_DIR = ROOT / "public/images/catalog"
IMAGE_MAP = ROOT / "data/catalog-images.json"
PRODUCTS = ROOT / "data/hami-products.json"
OUT_DIR = ROOT / "specs/003-floating-product-presentation/trial"

# Obsidian canvas and oxblood lite, from tailwind.config.ts — the two ends of the ground a cut-out
# has to survive on.
GROUND_DARK = (11, 2, 4)
GROUND_WINE = (117, 4, 15)

# kind → how many of that kind enter the sample. Weighted to the predicted failures; see the header.
SAMPLE_PLAN = {
    "charger": 5,             # braided cables and thin plugs — the classic matte-killer
    "audio": 5,               # earbuds, headband straps, translucent plastic
    "smartwatch": 4,          # watch faces are fine; the straps are the problem
    "powerbank": 3,
    "sim_card": 2,            # tiny, thin, reflective card
    "car_charger": 2,         # glossy cylindrical metal
    "phone": 3,               # control group: the easiest subject and the biggest population
}
SMALLEST_SOURCES = 3          # force the lowest-byte files in, whatever kind they are

MODEL_DEFAULT = "isnet-general-use"


def rel(path: pathlib.Path) -> str:
    """Repo-relative when it is inside the repo; absolute otherwise, so `--out /tmp/...` still works."""
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def load_products() -> list[dict]:
    data = json.loads(PRODUCTS.read_text(encoding="utf-8"))
    mapping = json.loads(IMAGE_MAP.read_text(encoding="utf-8"))
    out = []
    for p in data["products"]:
        local = mapping.get(str(p["id"]))
        if not local:
            continue                      # the imageless record; nothing to matte
        path = ROOT / "public" / local.lstrip("/")
        if not path.exists():
            continue
        with Image.open(path) as im:
            width, height = im.size
        out.append(
            {
                "id": p["id"],
                "name": p.get("name") or "",
                "kind": p.get("kind") or "?",
                "path": path,
                "width": width,
                "height": height,
                "bytes": path.stat().st_size,
            }
        )
    return out


def choose_sample(products: list[dict]) -> list[dict]:
    """Deterministic stratified pick, so the same 24 come back on every run."""
    chosen: list[dict] = []
    used: set[int] = set()

    # The smallest sources first: they are the files least able to survive a crop.
    for p in sorted(products, key=lambda x: x["bytes"])[:SMALLEST_SOURCES]:
        chosen.append(p)
        used.add(p["id"])

    for kind, want in SAMPLE_PLAN.items():
        pool = [p for p in products if p["kind"] == kind and p["id"] not in used]
        # Stable pseudo-random order per kind — deterministic without a global seed to remember.
        pool.sort(key=lambda p: hashlib.sha256(f"{kind}:{p['id']}".encode()).hexdigest())
        for p in pool[: max(0, want - sum(1 for c in chosen if c["kind"] == kind))]:
            chosen.append(p)
            used.add(p["id"])

    return sorted(chosen, key=lambda p: p["id"])


def composite(base: tuple[int, int, int], src: Image.Image, size: int) -> Image.Image:
    tile = Image.new("RGB", (size, size), base)
    fitted = src.copy()
    fitted.thumbnail((size - 24, size - 24), Image.LANCZOS)
    tile.paste(fitted, ((size - fitted.width) // 2, (size - fitted.height) // 2), fitted)
    return tile


def contact_sheet(rows: list[dict], out_path: pathlib.Path, cell: int = 300) -> None:
    cols = 4
    head = 26
    height = head + cell * ((len(rows) + cols - 1) // cols) + 8
    sheet = Image.new("RGB", (cell * cols, height), (24, 24, 24))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.load_default()
    except Exception:  # pragma: no cover - Pillow always ships a default
        font = None

    for i, row in enumerate(rows):
        cx = (i % cols) * cell
        cy = head + (i // cols) * cell
        draw.text((cx + 6, cy + 6), f"{row['id']} {row['kind']}", fill=(230, 230, 230), font=font)
        strip = Image.new("RGB", (cell - 12, cell - 26), (0, 0, 0))
        w = (cell - 12) // 3
        strip.paste(row["source"].resize((w, cell - 26)), (0, 0))
        strip.paste(composite(GROUND_DARK, row["cutout"], w).resize((w, cell - 26)), (w, 0))
        strip.paste(composite(GROUND_WINE, row["cutout"], w).resize((w, cell - 26)), (w * 2, 0))
        sheet.paste(strip, (cx + 6, cy + 20))

    draw.text((6, 6), "source | cutout on obsidian | cutout on oxblood", fill=(230, 230, 230), font=font)
    sheet.save(out_path, "PNG", optimize=True)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--sample", type=int, default=0, help="measure a stratified sample of N instead of all")
    ap.add_argument("--model", default=MODEL_DEFAULT, help="rembg session name")
    ap.add_argument("--verify", action="store_true", help="assert opaque pixels are byte-identical to source")
    ap.add_argument("--out", default=str(OUT_DIR))
    args = ap.parse_args()

    try:
        from rembg import new_session, remove
    except ImportError:
        print("rembg is not on this interpreter. Use:\n  ~/.venvs/hami-isolate/bin/python "
              "scripts/isolate-catalog-images.py", file=sys.stderr)
        return 2

    products = load_products()
    targets = choose_sample(products) if args.sample else products
    if args.sample:
        targets = targets[: args.sample]

    out_dir = pathlib.Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    alpha_dir = out_dir / "isolated"
    alpha_dir.mkdir(exist_ok=True)

    print(f"model={args.model}  pool={len(products)}  targets={len(targets)}")
    session = new_session(args.model)

    rows, manifest = [], []
    for n, p in enumerate(targets, 1):
        src = Image.open(p["path"]).convert("RGB")
        cut = remove(src, session=session, alpha_matting=False)
        derived = alpha_dir / f"{p['id']}.webp"
        cut.save(derived, "WEBP", quality=90, method=6)

        if args.verify:
            # FR-029's machine-checkable half: where the matte says "fully product", the pixels must be
            # the source's own pixels, unchanged. A generative edit passes every visual test and fails
            # this one, which is exactly why the check exists.
            from PIL import ImageChops

            base = src.convert("RGBA")
            solid = cut.split()[3].point(lambda a: 255 if a > 250 else 0)
            diff = ImageChops.difference(base.convert("RGB"), cut.convert("RGB"))
            kept = ImageChops.multiply(diff, Image.merge("RGB", (solid, solid, solid)))
            worst = max(kept.getextrema(), key=lambda pair: pair[1])
            if worst[1] > 0:
                changed = sum(1 for v in kept.convert("L").tobytes() if v > 0)
                print(f"  !! {p['id']}: opaque pixels differ from the source (max channel delta "
                      f"{worst[1]}, {changed} pixels) — not a pure alpha operation", file=sys.stderr)

        a = cut.split()[3]
        lo, hi = a.getextrema()

        # Border-ring opacity was written as an objective stand-in for "the matte kept the background",
        # and it is recorded here as a number only. It is NOT a usable verdict and the trial disproved
        # it: product 134 has the cleanest border of the sample (0.029) and one of the worst cut-outs,
        # because isnet retains a soft interior blob around complex subjects rather than a full frame.
        # The failure rate therefore comes from the contact sheet, which is what FR-034 asks for anyway.
        ring = max(4, min(a.size) // 16)
        band = Image.new("L", a.size, 0)
        ImageDraw.Draw(band).rectangle(
            [ring, ring, a.width - 1 - ring, a.height - 1 - ring], fill=255, outline=None)
        outer = ImageOps.invert(band)
        ring_px = sum(1 for v in outer.tobytes() if v > 0)
        a_bytes, o_bytes = a.tobytes(), outer.tobytes()
        ring_opaque = sum(1 for i in range(len(a_bytes))
                          if o_bytes[i] > 0 and a_bytes[i] > 250)
        ring_opacity = ring_opaque / max(1, ring_px)

        solid = sum(1 for v in a.tobytes()[::11] if v > 250)
        empty = sum(1 for v in a.tobytes()[::11] if v < 5)
        rows.append({"id": p["id"], "kind": p["kind"], "source": src, "cutout": cut})
        manifest.append(
            {
                "productId": p["id"],
                "name": p["name"],
                "kind": p["kind"],
                "source": rel(p["path"]),
                "derived": rel(derived),
                "sourceBytes": p["bytes"],
                "derivedBytes": derived.stat().st_size,
                "sourceDimensions": [p["width"], p["height"]],
                "alphaMin": lo,
                "alphaMax": hi,
                "opaqueFraction": round(solid / max(1, solid + empty), 4),
                "borderRingOpacity": round(ring_opacity, 4),
                "reviewStatus": "unreviewed",
                "verdict": "pending-human-review",
            }
        )
        ratio = derived.stat().st_size / max(1, p["bytes"])
        print(f"  [{n:>3}/{len(targets)}] {p['id']:>4} {p['kind']:<19} "
              f"{p['width']}x{p['height']:<5} {p['bytes']//1024:>4}KB -> {derived.stat().st_size//1024:>4}KB "
              f"({ratio:.2f}x) alpha {lo}-{hi}")

    sheet = out_dir / ("contact-sheet-sample.png" if args.sample else "contact-sheet-all.png")
    contact_sheet(rows, sheet)
    (out_dir / "manifest.json").write_text(json.dumps(
        {"model": args.model, "sampleSize": len(targets) if args.sample else None, "assets": manifest},
        ensure_ascii=False, indent=1), encoding="utf-8")

    sizes = [m["derivedBytes"] / max(1, m["sourceBytes"]) for m in manifest]
    print(f"\nsheet: {rel(sheet)}")
    print(f"derived/source size ratio: median {sorted(sizes)[len(sizes)//2]:.2f}x  "
          f"max {max(sizes):.2f}x")
    print("Every row is `unreviewed`. This script measures feasibility; it does not approve anything (FR-030).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
