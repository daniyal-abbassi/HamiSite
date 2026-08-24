import { CartDrawer } from "@/components/CartDrawer";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { ArrowRight, ChevronLeft, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";

const legacyProducts = {
  "onyx-phone": {
    id: "legacy-onyx-phone",
    title: "مدل نمایشی Onyx",
    category: "گوشی هوشمند / DEMO 01",
    image: "/manus-storage/hami-demo-phone-onyx_7f7d5315.jpg",
    description: "این مسیر قدیمی فقط برای مرور نمونهٔ طراحی حفظ شده است و به دادهٔ زندهٔ فروشگاه متصل نیست.",
    options: ["مشکی اُبسیدین", "بورگوندی عمیق", "نقره‌ای مات"],
  },
  "burgundy-accessory": {
    id: "legacy-burgundy-accessory",
    title: "ست نمایشی Burgundy",
    category: "لوازم جانبی / DEMO 02",
    image: "/manus-storage/hami-demo-accessory-case_87c1dfb1.jpg",
    description: "این مسیر قدیمی فقط برای مرور نمونهٔ طراحی حفظ شده است و به دادهٔ زندهٔ فروشگاه متصل نیست.",
    options: ["بورگوندی امضا", "گرافیت", "کرم استخوانی"],
  },
} as const;

const formatProductPrice = (amount: string, currencyCode: string) => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "قیمت فروشگاه";
  if (currencyCode === "IRR") return `${Math.round(value / 10).toLocaleString("fa-IR")} تومان`;
  return new Intl.NumberFormat("fa-IR", { style: "currency", currency: currencyCode, maximumFractionDigits: 0 }).format(value);
};

export default function ProductDetail() {
  const [, params] = useRoute("/shop/:productId");
  const handle = params?.productId ?? "";
  const legacyProduct = legacyProducts[handle as keyof typeof legacyProducts];
  const productQuery = trpc.commerce.products.byHandle.useQuery({ handle }, { enabled: Boolean(handle) });
  const product = productQuery.data;
  const [selectedOption, setSelectedOption] = useState("");
  const { addItem, itemCount, openCart } = useCart();
  const firstVariant = product?.variants[0];
  const available = product?.variants.some((variant) => variant.availableForSale) ?? true;
  const primaryOption = product?.options[0];

  useEffect(() => {
    setSelectedOption(primaryOption?.values[0] ?? legacyProduct?.options[0] ?? "");
  }, [handle, legacyProduct?.options, primaryOption?.values]);

  const liveSpecifications = useMemo(() => product ? [
    ["دسته‌بندی", product.productType || "تعریف نشده"],
    ["برند", product.vendor || "حامی همراه"],
    ["تنوع قابل انتخاب", product.variants.length ? `${product.variants.length.toLocaleString("fa-IR")} گزینه` : "تعریف نشده"],
    ["وضعیت فروش", available ? "موجود برای فروش" : "ناموجود"],
  ] : [], [available, product]);

  if (productQuery.isLoading && !legacyProduct) {
    return <div className="product-page"><main className="product-main"><div className="product-breadcrumb"><Link href="/shop"><ArrowRight size={14} /> بازگشت به کاتالوگ</Link></div><section className="product-top"><div className="product-gallery"><div className="product-image-frame product-loading-frame" /></div><div className="product-copy"><span className="product-category">PRODUCT / LOADING</span><h1>در حال دریافت محصول</h1><p>جزئیات محصول منتخب در حال بارگذاری است.</p></div></section></main></div>;
  }

  if (!product && !legacyProduct) {
    return <div className="product-page"><main className="product-main"><div className="product-breadcrumb"><Link href="/shop"><ArrowRight size={14} /> بازگشت به کاتالوگ</Link></div><section className="product-top"><div className="product-copy"><span className="product-category">PRODUCT / UNAVAILABLE</span><h1>این محصول در دسترس نیست.</h1><p>{productQuery.isError ? "دریافت اطلاعات محصول موقتاً ممکن نیست." : "ممکن است محصول از کاتالوگ حذف یا جابه‌جا شده باشد."}</p><Link className="button button-wine" href="/shop">بازگشت به کاتالوگ</Link></div></section></main></div>;
  }

  const title = product?.title ?? legacyProduct!.title;
  const image = product?.images[0]?.url ?? legacyProduct!.image;
  const category = product?.productType || legacyProduct?.category || "محصول منتخب";
  const selectionValues = primaryOption?.name === "Title" || primaryOption?.values.length === 1 && primaryOption.values[0] === "Default Title" ? [] : primaryOption?.values ?? legacyProduct?.options ?? [];
  const currentPrice = product ? formatProductPrice(product.priceRange.min.amount, product.priceRange.min.currencyCode) : null;
  const compareAtPrice = product?.variants[0]?.compareAtPrice ? formatProductPrice(product.variants[0].compareAtPrice.amount, product.variants[0].compareAtPrice.currencyCode) : null;
  const specifications = product ? liveSpecifications : [["دسته‌بندی", category], ["وضعیت مسیر", "نمونهٔ نمایشی قدیمی"], ["اطلاعات فروش", "برای اتصال دادهٔ زنده آماده"], ["سبد", "صرفاً نمایشی"]];

  return (
    <div className="product-page">
      <header className="shop-header product-header">
        <Link href="/" className="shop-wordmark"><span>ح</span><b>حامی همراه</b><i>HAMI / PRODUCT</i></Link>
        <nav><Link href="/shop">کاتالوگ</Link><Link href="/partners">همکاری عمده</Link><Link href="/">خانه</Link></nav>
        <button className="shop-cart-button" onClick={openCart}><ShoppingCart size={17} /> سبد انتخاب <b>{itemCount}</b></button>
      </header>

      <main className="product-main">
        <div className="product-breadcrumb"><Link href="/shop"><ArrowRight size={14} /> بازگشت به کاتالوگ</Link><span>{product ? "PRODUCT / LIVE DATA" : "PRODUCT / LEGACY DEMO"}</span></div>
        <section className="product-top" data-reveal="scale">
          <div className="product-gallery">
            <div className="product-image-frame"><img src={image} alt={product?.images[0]?.altText || title} /><span>{product ? "تصویر محصول" : "نمایش محصول"}</span><i>01 / ARCHIVE</i></div>
            <p>{product ? "تصویر و مشخصات از کاتالوگ متصل فروشگاه دریافت می‌شوند." : "این صفحهٔ قدیمی تنها برای مرور نمونهٔ طراحی نگه داشته شده است."}</p>
          </div>
          <div className="product-copy">
            <span className="product-category">{category}</span>
            <h1>{title}</h1>
            <p>{product?.description || legacyProduct!.description}</p>
            {product ? <div className="product-demo-notice"><Sparkles size={16} /><span>{available ? "وضعیت فروش از کاتالوگ فروشگاه خوانده می‌شود؛ تعداد موجودی نمایش داده نمی‌شود." : "این محصول در حال حاضر برای فروش در دسترس نیست."}</span></div> : <div className="product-demo-notice"><Sparkles size={16} /><span>این مسیر یک نمونهٔ قدیمی است و دادهٔ زنده ندارد.</span></div>}
            {currentPrice && <div className="product-live-price">{compareAtPrice && <del>{compareAtPrice}</del>}<strong>{currentPrice}</strong></div>}
            {selectionValues.length > 0 && <div className="product-color-block"><b>{primaryOption?.name || "انتخاب تنوع"}</b><div>{selectionValues.map((value) => <button className={value === selectedOption ? "active" : ""} key={value} onClick={() => setSelectedOption(value)}>{value}</button>)}</div>{selectedOption && <small>انتخاب فعلی: {selectedOption}</small>}</div>}
            <button className="button button-wine product-add" disabled={Boolean(product && !available)} onClick={() => addItem({ productId: product?.handle ?? legacyProduct!.id, productTitle: selectedOption ? `${title} — ${selectedOption}` : title, image })}><ShoppingBag size={18} />{product && !available ? "ناموجود" : "افزودن به سبد نمایشی"}</button>
          </div>
        </section>

        <section className="product-specs" data-reveal>
          <div><span>۰۱ / PRODUCT DATA</span><h2>{product ? "داده‌های روشن، از کاتالوگ فروشگاه." : "جای‌گذاریِ روشن برای اطلاعات واقعی."}</h2><p>{product ? "تنها اطلاعاتی که adapter فروشگاه برمی‌گرداند در این بخش نمایش داده می‌شود." : "این ساختار برای نمایش مشخصات، گارانتی و تنوع‌ها آماده است."}</p></div>
          <dl>{specifications.map(([term, value], index) => <div key={term}><dt><i>0{index + 1}</i>{term}</dt><dd>{value}</dd></div>)}</dl>
        </section>
        <section className="product-trust" data-reveal="scale"><div><ShieldCheck size={21} /><b>اطمینان در هر انتخاب</b><p>تعداد موجودی و شرایط نهایی فروش در این صفحه ساخته یا حدس زده نمی‌شود.</p></div><Link href="/partners">برای خرید عمده <ChevronLeft size={17} /></Link></section>
      </main>
      <CartDrawer />
    </div>
  );
}
