# Missing media — 22 files

Every path below is referenced by live code and **none of the files exist**. The
originals lived in the Manus project's persistent media store and were not
included in the export; they are gone. Until they are restored, every reference
below 404s at runtime.

Drop the real files into this directory using the exact filenames — the hashes
are part of the name and the code matches on them literally. **Do not rename.**

## Real brand assets — must be the genuine Hami Hamrah marks, not regenerated

| File | Referenced from |
|---|---|
| `hami-mark_6bd83e68.png` | `client/index.html` (favicon), `pages/Home.tsx:79` |
| `hami-logo-lockup-official_dc321fc1.png` | `pages/Home.tsx:368` |

## Hero media

| File | Referenced from |
|---|---|
| `hami-hero_3727dde5.webm` | `config/heroMedia.ts` |
| `hami-hero_f55bb5ef.mp4` | `config/heroMedia.ts` |
| `hami-hero-poster_5573451b.webp` | `config/heroMedia.ts` |

## Brand stories

| File | Referenced from |
|---|---|
| `hami-brand-story-apple_35ab4c74.jpg` | `lib/brandShowcase.ts:7` |
| `hami-brand-story-samsung_5cb7304c.jpg` | `lib/brandShowcase.ts:15` |
| `hami-brand-story-xiaomi_5848193e.jpg` | `lib/brandShowcase.ts:23` |

## Category mosaic — `lib/categoryMosaic.ts`, one per row

| File | Category |
|---|---|
| `hami-category-mobile_9a89a6d6.jpg` | موبایل |
| `hami-category-headphones_bd9ac15c.jpg` | ایرپاد و هدفون |
| `hami-category-charger_35619ca4.jpg` | شارژر و آداپتور |
| `hami-category-powerbank_caa01be3.jpg` | پاوربانک |
| `hami-category-smartwatch_50598498.jpg` | ساعت هوشمند |
| `hami-category-featurephone_90a16b45.jpg` | فیچرفون |
| `hami-category-speaker_34b4009d.jpg` | اسپیکر و Party Box |

## Home page sections

| File | Referenced from | Subject (from its `alt` text) |
|---|---|---|
| `hami-campaign-product-loop_fdea815b.mp4` | `pages/Home.tsx:60` | campaign product loop video |
| `hami-campaign-product-fallback_bcae374d.jpg` | `pages/Home.tsx:61` | poster for the above |
| `hami-b2b-digital-supply-room_3e627a73.jpg` | `pages/Home.tsx:713` | abstract visual for the B2B supply/partnership path |
| `hami-accessories-universe-main_e718a969.jpg` | `pages/Home.tsx:741` | arrangement of earbuds, power bank, adapter, smartwatch, cable, speaker |
| `hami-online-services-digital-object_3eed676e.jpg` | `pages/Home.tsx:781` | a generic phone in an abstract digital space |

## Demo filler — disposable, replace with real catalog imagery

These back hard-coded placeholder products in `Shop.tsx` / `ProductDetail.tsx`
("مدل نمایشی Onyx", "DEMO 01"). Once those pages read the real backend catalog,
both files and their placeholder products should disappear together.

| File | Referenced from |
|---|---|
| `hami-demo-phone-onyx_7f7d5315.jpg` | `pages/Shop.tsx:19`, `pages/ProductDetail.tsx:13` |
| `hami-demo-accessory-case_87c1dfb1.jpg` | `pages/Shop.tsx:26`, `pages/ProductDetail.tsx:21` |

---

Fonts are **not** affected: Vazirmatn and DM Mono load from the Google Fonts CDN
via `client/index.html`, and `index.css` contains zero `url()` references.
