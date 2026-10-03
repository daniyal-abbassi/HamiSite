---
name: Hami Hamrah
description: Persian (RTL) Luxury B2C + B2B Mobile Phone & Digital Accessories Storefront — "Imperial Luxury" World: Deep Obsidian velvet canvas (#0B0204), atmospheric Imperial Oxblood (RAL 3004 / #640211) glows, Champagne Gold (#E5D3B3) accents, Smoked Glass geometry with specular metallic hairlines.
colors:
  obsidian-canvas: "#0B0204"
  obsidian-card: "#14060A"
  obsidian-elevated: "#1E0A10"
  oxblood-imperial: "#640211"
  oxblood-deep: "#3D020B"
  oxblood-glow: "#8E0A1E"
  champagne-gold: "#E5D3B3"
  champagne-bright: "#F4EADB"
  champagne-muted: "#C5A880"
  foreground: "#F0ECE9"
  muted-foreground: "#A99E9C"
  signal-ember: "#E4573F"
  success-emerald: "#4EAA86"
typography:
  display:
    fontFamily: "Estedad Variable, Vazirmatn Variable, Tahoma, sans-serif"
    fontSize: "clamp(2.5rem, 5.5vw, 4.25rem)"
    fontWeight: 900
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Estedad Variable, Vazirmatn Variable, Tahoma, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 1.3
  body:
    fontFamily: "Estedad Variable, Vazirmatn Variable, Tahoma, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.85
  label:
    fontFamily: "DM Mono, monospace"
    fontSize: "10px-13px"
    fontWeight: 500
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "22px"
  "2xl": "28px"
  full: "9999px"
---

# Master Design Specification: Imperial Luxury ("حامی همراه")

## ۱. بیانیه طراحی و هویت حسی (Vision & Aesthetic North Star)

«حامی همراه» با بیش از ۲۰ سال سابقه در بازار موبایل مشهد، اکنون نه یک فروشگاه آنلاین معمولی، بلکه **نمایشگاه دیجیتال پرچمداران و اکسسوری‌های فاخر** است. هر المان و هر پیکسل از واسط کاربری باید حس اصالت، اطمینان، و کیفیت برتر را القا کند — تجربه‌ای هم‌سطح با وب‌سایت‌های معرفی محصولات لوکس جهانی نظیر ساعت‌سازان برجسته، اپل پرو و استودیوهای برتر دیزاین.

### اصول محوری جهان بصری (The 4 Pillars of Imperial Luxury):

1. **عمق آبنوسی و اتمسفر زرشکی (Obsidian Velvet Ground + Oxblood Halo):**
   * زمینه اصلی هرگز یک رنگ خاکستری بی‌روح یا سیاه مطلق (OLED Black بدون عمق) نیست؛ بلکه رنگ آبنوس شبانه (`#0B0204`) با هاله‌های نوری مخملین زرشکی شاهانه (Imperial Oxblood RAL 3004: `#640211` تا `#3D020B`) است که در عمق اسکرول جریان دارد.
   * نور از پشت المان‌ها تابیده می‌شود نه از جلو، تا حس رازآلودگی و لوکس بودن جواهرآلات و دیوایس‌های مدرن بازسازی شود.

2. **متریال شیشه‌ای دودی و بردرهای شامپاینی (Smoked Obsidian Glass + Champagne Hairline):**
   * کارت‌ها و پنل‌های محتوا از شیشه دودی مات (`backdrop-filter: blur(20px)` بر روی زمینه نیمه‌شفاف `#14060A`) ساخته می‌شوند.
   * حاشیه کارت‌ها بسیار نازک (۱ پیکسل) با گرادیان طلای شامپاینی مات (`#E5D3B3` با شفافیت ۱۰ تا ۲۵ درصد) بوده و حس لبه‌های فلزی جلاخورده تیتانیومی را تداعی می‌کند.

3. **اکسنت طلای شامپاینی و پلاتین (Champagne Gold Accents):**
   * رنگ طلای مات و شامپاینی برای پررنگ‌ترین تصمیمات بصری استفاده می‌شود: قیمت کالاها، کلمات شاخص در تیترها، برچسب‌های اصالت ۲۰ ساله و دکمه اصلی خرید.
   * متن‌های اصلی به رنگ پلاتین گرم (`#F0ECE9`) و متون ثانویه به رنگ نقره‌ای مات (`#A99E9C`) هستند تا کنتراست چشم‌نواز و بدون خستگی بصری ایجاد کنند.

4. **فیزیک حرکتی ابریشمی (Fluid Luxury Physics):**
   * تمام تعاملات با منحنی اختصاصی `cubic-bezier(0.16, 1, 0.3, 1)` حرکت می‌کنند.
   * در هاور موس روی کارت‌ها، کالا با سایه نرم فیزیکی به آرامی بلند می‌شود (`transform: translateY(-4px)`).
   * دکمه‌های کپسولی دارای لبه درخشان متحرک (`.liquid-gold-edge`) هستند.

---

## ۲. پالت رنگی رسمی (Color Tokens)

| نام توکن | کد هگز | کاربرد در سیستم |
| :--- | :--- | :--- |
| **`obsidian-canvas`** | `#0B0204` | رنگ پایه اصلی تمامی صفحات (سیاه آبنوسی با ته‌رنگ شرابی) |
| **`obsidian-card`** | `#14060A` | زمینه سطوح معلق و کارت‌های شیشه‌ای دودی |
| **`obsidian-elevated`** | `#1E0A10` | سطوح فرعی‌تر مانند پاپ‌اورها و فیلترهای کشویی |
| **`oxblood-imperial`** | `#640211` | رنگ رسمی برند RAL 3004 — برای هاله‌ها، دکمه‌های ثانویه و نور پس‌زمینه |
| **`oxblood-deep`** | `#3D020B` | لایه تیره‌تر گرادیان‌های نوری |
| **`oxblood-glow`** | `#8E0A1E` | تابش نوری ملایم در کانون‌های نوری هیرو و استیج |
| **`champagne-gold`** | `#E5D3B3` | اکسنت اصلی: قیمت‌ها، کلمات گرادیانی، بوردرهای فاخر و دکمه خرید |
| **`champagne-bright`** | `#F4EADB` | هایلایت‌های درخشان و نقطه‌های بازتاب |
| **`champagne-muted`** | `#C5A880` | برچسب‌های متالیک و آیکون‌های کمکی |
| **`foreground`** | `#F0ECE9` | تایپوگرافی اصلی (پلاتین گرم با کنتراست ۱۶:۱) |
| **`muted-foreground`**| `#A99E9C` | تایپوگرافی ثانویه، توضیحات محصول و مشخصات فنی |
| **`signal-ember`** | `#E4573F` | رینگ نورانی چرخان اکشن نهایی و نشان وضعیت زنده موجودی |

---

## ۳. هندسه و ارگونومی (Geometry & Hierarchy)

* **انحناها (Radii):**
  * دکمه‌ها، چیپ‌های انتخاب رنگ و فیلترها: کپسولی کامل (`rounded-full` / `9999px`).
  * کارت‌های کالا و پنل‌ها: انحنای مدرن ۲۴ تا ۲۸ پیکسل (`rounded-2xl` یا `rounded-3xl`).
  * اینپوت‌ها و فیلدهای جستجو: کپسولی با حاشیه شامپاینی مات.
* **ناوبری موبایل (Mobile Island):**
  * داک معلق شیشه‌ای در پایین صفحه با ارتفاع مناسب انگشت شست و کلیرنس امن نوچ (`safe-area-inset-bottom`).
* **تایپوگرافی:**
  * **فونت اصلی (نمایش و متن):** `Estedad Variable` با وزن‌های ۹۰۰ برای تیترهای شکوهمند و ۴۰۰ برای متون روان.
  * **فونت اعداد و لیبل‌های فنی:** `DM Mono` برای قیمت، کدها، بارکد و درصد تخفیف.
