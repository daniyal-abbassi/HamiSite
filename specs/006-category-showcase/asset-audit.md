# Feature 006 panel asset audit

Checked the nine files referenced by `DEPARTMENT_SEED` in `lib/category-departments.ts` on 2026-10-04. Pixel metrics use the 8-bit sRGB luma approximation `0.2126R + 0.7152G + 0.0722B` over rows 5%–60% of each source image. The two acceptance thresholds are mean luma ≥25 and ≥10% of pixels above luma 60.

| File | Source size | Mean luma | Pixels >60 | FR-080 / FR-081 |
|---|---:|---:|---:|---|
| `phone.png` | 1086×1448 PNG | 14.9 | 4.5% | dimensions pass; luma fails |
| `audio.png` | 1086×1448 PNG | 22.9 | 9.9% | dimensions pass; luma fails |
| `charger.jpg` | 896×1200 JPEG | 14.3 | 6.9% | dimensions/format and luma fail |
| `smartwatch.jpg` | 896×1200 JPEG | 21.4 | 9.7% | dimensions/format and luma fail |
| `powerbank.jpg` | 896×1200 JPEG | 38.3 | 21.9% | FR-080 fails; image floor passes |
| `computer-accessory.jpg` | 896×1200 JPEG | 36.7 | 17.0% | FR-080 fails; image floor passes |
| `sim-card.jpg` | 896×1200 JPEG | 45.5 | 27.6% | FR-080 fails; image floor passes |
| `car-charger.jpg` | 896×1200 JPEG | 39.5 | 23.6% | FR-080 fails; image floor passes |
| `service.jpg` | 896×1200 JPEG | 31.4 | 12.8% | FR-080 fails; image floor passes |

**Asset gate:** `public/brand/hami-mark-cream-alpha.png` is absent. The existing `hami-mark-alpha.png` is a small oxblood mark and cannot serve as the specified cream overlay without a reviewed asset decision. Do not mark SC-017/SC-018/SC-021 complete based on these sources. No image was silently upscaled or re-encoded to claim compliance; those operations would not add source detail.

Visual inspection confirmed that the files depict the named generic product classes and contain no obvious text or watermark. Final trade-dress review still needs an owner/reviewer pass, particularly for the phone, headphones, and watch silhouettes.

**Label contrast check:** Using the implemented lower-card gradient (paper ground at 92% opacity at the bottom, tapering to 58% at the midpoint) and the current foreground token, minimum measured contrast across each source's label region was: audio 10.29:1, car-charger 13.33:1, charger 16.74:1, computer-accessory 17.36:1, phone 17.32:1, powerbank 17.41:1, service 16.23:1, sim-card 17.34:1, smartwatch 17.29:1. All exceed 4.5:1 with this scrim. This measures the current implementation against these source pixels; it does not waive the asset size, format, or image-floor failures above.
