"""Mirror the catalogue's product photography into public/images/catalog/.

The export points at hamihamrah-shop.com. Measured from here, that origin takes
5.8-7.5s per image — and next/image gives an upstream fetch 7 seconds before it
gives up, so the optimizer returned 500 about as often as not. Even when it
succeeded, a shopper would have waited six seconds for a product photo.

So the photographs are pulled once and served from public/. This also keeps the
promise the rest of the image layer already makes (see lib/product-images.ts):
builds and rendering stay fully offline-safe, with no third-party host in the
render path.

Re-runnable: an image already on disk is skipped, so this can be run again after
the export is refreshed without re-downloading everything.
"""
import json, pathlib, sys
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO

import requests
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "hami-products.json"
OUT = ROOT / "public" / "images" / "catalog"
MANIFEST = ROOT / "data" / "catalog-images.json"
MAX_EDGE = 900
TIMEOUT = 40

OUT.mkdir(parents=True, exist_ok=True)
catalog = json.loads(SRC.read_text())
products = catalog["products"]

session = requests.Session()
session.headers["User-Agent"] = "Mozilla/5.0 (catalog mirror)"

def fetch(p):
    url = p.get("primary_image")
    if not url:
        return p["id"], None
    name = f"{p['id']}.jpg"
    dest = OUT / name
    rel = f"/images/catalog/{name}"
    if dest.exists() and dest.stat().st_size > 1000:
        return p["id"], rel
    try:
        r = session.get(url, timeout=TIMEOUT)
        r.raise_for_status()
        im = Image.open(BytesIO(r.content))
        im = im.convert("RGB")
        if max(im.size) > MAX_EDGE:
            k = MAX_EDGE / max(im.size)
            im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        im.save(dest, "JPEG", quality=84, optimize=True, progressive=True)
        return p["id"], rel
    except Exception as e:
        print(f"  FAIL {p['id']}: {type(e).__name__}", flush=True)
        return p["id"], None

mapping = {}
done = 0
with ThreadPoolExecutor(max_workers=12) as pool:
    for pid, rel in pool.map(fetch, products):
        done += 1
        if rel:
            mapping[str(pid)] = rel
        if done % 25 == 0:
            print(f"  {done}/{len(products)} processed, {len(mapping)} mirrored", flush=True)

MANIFEST.write_text(json.dumps(mapping, ensure_ascii=False, indent=1))
total = sum(f.stat().st_size for f in OUT.glob("*.jpg"))
print(f"DONE: {len(mapping)}/{len(products)} mirrored, {total // 1024 // 1024} MB on disk")
