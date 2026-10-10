# Implementation Plan: استریمینگ و بارگذاری آنی Next.js 15

- **شاخه/ویژگی:** `023-streaming-and-instant-loading`
- **تاریخ:** ۲۰۲۶-۱۰-۱۰
- **مستند مبنا:** [spec.md](./spec.md)

---

## برش‌های عمودی پیاده‌سازی (Vertical Slices):

1. **برش ۱: اسکلتون‌ها و لودینگ‌های سیستمی Next.js (`loading.tsx`)**
   - ایجاد `app/(main)/loading.tsx` با اسکلتون‌های زیبا و شیشه‌ای منطبق با تم مشکی/شرابی و طلایی فروشگاه.
   - ایجاد `app/(admin)/loading.tsx` جهت نمایش اسکلتون فوری هنگام ناوبری بین تب‌های پنل ادمین.

2. **برش ۲: استریمینگ صفحه اصلی با مرزهای Suspense (`app/(main)/page.tsx`)**
   - انتقال کوئری‌های ریل محصولات (`homepageProductsRail`, `additionalProductsRail`, `discountedProductsRail`) به کامپوننت‌های مستقل Async Server Components.
   - رندر فوری Hero و المان‌های استاتیک بدون توقف برای دیتابیس.
   - کپسوله‌سازی ریل‌های محصولات در `<Suspense fallback={<ProductRailSkeleton />}>`.

3. **برش ۳: بهینه‌سازی تصاویر ریموت و شبکه (`next.config.mjs`)**
   - افزودن پترن‌های دامنه‌های CDN دیجی‌کالا جهت پشتیبانی از بهینه‌سازی فرمت مدرن تصاویر (WebP/AVIF).

4. **برش ۴: اعتبارسنجی کیفیت و تست‌ها**
   - اجرای `npm run typecheck` و `npm run test:unit`.
   - تست سرور و اطمینان از عملکرد روان در گوشی.

