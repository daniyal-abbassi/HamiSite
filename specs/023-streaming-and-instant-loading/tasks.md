# Task Breakdown: استریمینگ و بارگذاری آنی Next.js 15

- **شاخه/ویژگی:** `023-streaming-and-instant-loading`

---

## Task 1: ایجاد `loading.tsx` برای گروه روت‌های فروشگاه (`(main)`)
- [ ] ساخت فایل `app/(main)/loading.tsx`
- [ ] طراحی اسکلتون هماهنگ با تم تیره و خطوط ظریف

## Task 2: ایجاد `loading.tsx` برای پنل مدیریت (`(admin)`)
- [ ] ساخت فایل `app/(admin)/loading.tsx`
- [ ] نمایش اسکلتون جدول و کارت‌های آماری جهت پاسخ‌دهی آنی به کلیک‌ها در منوی ادمین

## Task 3: ریفکتور صفحه اصلی (`app/(main)/page.tsx`) با Suspense Boundaries
- [ ] ساخت کامپوننت‌های Async درونی برای ریل‌های محصولات (`FeaturedRailSection`, `DiscountedRailSection`, `AdditionalRailSection`)
- [ ] رندر فوری Hero و عدم بلاک شدن سرور روی `Promise.all`
- [ ] قراردادن اسکلتون فال‌بک برای هر ریل کالا

## Task 4: افزودن دامنه‌های CDN دیجی‌کالا به `next.config.mjs`
- [ ] ثبت `*.digikala.com` و `dkstatics-public.digikala.com` در `images.remotePatterns`

## Task 5: اعتبارسنجی کیفی و آزمون‌ها
- [ ] اجرای `npm run typecheck`
- [ ] اجرای `npm run test:unit`

