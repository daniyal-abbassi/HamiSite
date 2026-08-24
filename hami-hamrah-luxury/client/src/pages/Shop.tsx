import { CartDrawer } from "@/components/CartDrawer";
import { useCart } from "@/contexts/CartContext";
import { ArrowUpLeft, ChevronRight, ShoppingBag, ShoppingCart, Sparkles } from "lucide-react";
import { Link } from "wouter";

type DemoProduct = {
  id: string;
  title: string;
  category: string;
  image: string;
  reference: string;
};

const demoProducts: DemoProduct[] = [
  {
    id: "onyx-phone",
    title: "مدل نمایشی Onyx",
    category: "گوشی هوشمند",
    image: "/manus-storage/hami-demo-phone-onyx_7f7d5315.jpg",
    reference: "MOBILE / 01",
  },
  {
    id: "burgundy-accessory",
    title: "ست نمایشی Burgundy",
    category: "لوازم جانبی",
    image: "/manus-storage/hami-demo-accessory-case_87c1dfb1.jpg",
    reference: "ACCESSORY / 02",
  },
];

function ProductCard({ product, index }: { product: DemoProduct; index: number }) {
  const { addItem } = useCart();

  return (
    <article className="catalog-card" data-reveal="scale" style={{ "--reveal-delay": `${index * 85}ms` } as React.CSSProperties}>
      <div className="catalog-image">
        <Link href={`/shop/${product.id}`} className="catalog-image-link"><img src={product.image} alt={`تصویر نمایشی ${product.title}`} /></Link>
        <span className="catalog-stock in-stock">نمونهٔ رابط</span>
        <span className="catalog-index">{product.reference}</span>
      </div>
      <div className="catalog-card-body">
        <span>{product.category}</span>
        <h3><Link href={`/shop/${product.id}`}>{product.title}</Link></h3>
        <div className="catalog-price-row"><b>قیمت نمایشی</b><small>برای بررسی رفتار کارت محصول</small></div>
        <button className="catalog-add" onClick={() => addItem({ productId: product.id, productTitle: product.title, image: product.image })}>
          <ShoppingBag size={16} /> افزودن به سبد نمایشی
        </button>
      </div>
    </article>
  );
}

export default function Shop() {
  const { itemCount, openCart } = useCart();

  return (
    <div className="shop-page">
      <header className="shop-header">
        <Link href="/" className="shop-wordmark"><span>ح</span><b>حامی همراه</b><i>HAMI / STORE</i></Link>
        <nav><Link href="/">خانه</Link><Link href="/partners">همکاری عمده</Link><a href="/#contact">تماس</a></nav>
        <button className="shop-cart-button" onClick={openCart}><ShoppingCart size={17} /> سبد انتخاب <b>{itemCount}</b></button>
      </header>

      <main>
        <section className="shop-hero" data-reveal="scale">
          <div>
            <p className="shop-kicker"><Sparkles size={14} /> فروشگاه آنلاین حامی همراه</p>
            <h1>انتخابی روشن،<br /><em>از یک کاتالوگ دقیق.</em></h1>
            <p>این کاتالوگ برای نمایش تجربهٔ محصول، فیلترپذیری آینده و جریان سبد خرید طراحی شده است. برای قیمت همکاری و تامین عمده، مسیر ویژهٔ همکاران را دنبال کنید.</p>
            <Link className="button button-wine" href="/partners">ورود به همکاری عمده <ArrowUpLeft size={17} /></Link>
          </div>
          <aside><span>HAMI / STORE NOTE</span><b>این نسخه، کاتالوگ نمایشی و قابل توسعهٔ حامی همراه است.</b><i /><p>قیمت، موجودی و پرداخت واقعی در این مرحله فعال نیستند؛ این طراحی برای اتصال امن در مرحلهٔ بعد آماده است.</p></aside>
        </section>

        <section className="catalog-section">
          <div className="catalog-heading" data-reveal><div><span>۰۱ / فروش آنلاین</span><h2>کاتالوگ منتخب</h2></div><p>داده‌های این بخش صرفاً برای نمایش کیفیت تجربهٔ فروشگاه و رفتار کارت‌های محصول استفاده می‌شوند.</p></div>
          <div className="catalog-grid">{demoProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>
        </section>

        <section className="shop-assurance" data-reveal>
          <div><span>۰۲</span><b>رفتار واقعیِ رابط</b><p>انتخاب محصول و مدیریت سبد خرید در همین نسخه قابل مشاهده است.</p></div>
          <div><span>۰۳</span><b>آماده برای اتصال داده</b><p>فضای نمایش قیمت، وضعیت کالا و مراحل سفارش برای دادهٔ واقعی طراحی شده‌اند.</p></div>
          <div><span>۰۴</span><b>مسیر همکاری جداگانه</b><p>خرید عمده با شرایط و اطلاعات متناسب با همکاران دنبال می‌شود.</p></div>
        </section>

        <section className="shop-cta" data-reveal="scale"><div><span>برای فروشگاه‌ها و همکاران صنفی</span><h2>مسیر عمده، از کاتالوگ عمومی جداست.</h2></div><Link className="button button-dark" href="/partners">شرایط همکاری <ChevronRight size={17} /></Link></section>
      </main>
      <CartDrawer />
    </div>
  );
}
