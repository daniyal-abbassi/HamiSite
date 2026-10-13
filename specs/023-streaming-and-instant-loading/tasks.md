# Task Breakdown: استریمینگ و بارگذاری آنی Next.js 15

- **شاخه/ویژگی:** `023-streaming-and-instant-loading`

---

## Task 1: ایجاد `loading.tsx` برای گروه روت‌های فروشگاه (`(main)`)
- [X] ساخت فایل `app/(main)/loading.tsx`
- [X] طراحی اسکلتون هماهنگ با تم تیره و خطوط ظریف

## Task 2: ایجاد `loading.tsx` برای پنل مدیریت (`(admin)`)
- [X] ساخت فایل `app/(admin)/loading.tsx`
- [X] نمایش اسکلتون جدول و کارت‌های آماری جهت پاسخ‌دهی آنی به کلیک‌ها در منوی ادمین

## Task 3: ریفکتور صفحه اصلی (`app/(main)/page.tsx`) با Suspense Boundaries
- [X] ساخت کامپوننت‌های Async درونی برای ریل‌های محصولات (`FeaturedRailSection`, `DiscountedRailSection`, `AdditionalRailSection`)
- [X] رندر فوری Hero و عدم بلاک شدن سرور روی `Promise.all`
- [X] قراردادن اسکلتون فال‌بک برای هر ریل کالا

## Task 4: افزودن دامنه‌های CDN دیجی‌کالا به `next.config.mjs`
- [X] ثبت `*.digikala.com` و `dkstatics-public.digikala.com` در `images.remotePatterns`

## Task 5: اعتبارسنجی کیفی و آزمون‌ها
- [X] اجرای `npm run typecheck`
- [X] اجرای `npm run test:unit`

