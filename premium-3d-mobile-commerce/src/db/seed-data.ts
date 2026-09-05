const IMG = {
  iphone: "/images/products/iphone.jpg",
  galaxy: "/images/products/galaxy.jpg",
  xiaomi: "/images/products/xiaomi.jpg",
  earbuds: "/images/products/earbuds.jpg",
  watch: "/images/products/watch.jpg",
  charger: "/images/products/charger.jpg",
};

const M = 1_000_000;

export const BRAND_SEED = [
  { slug: "apple", nameFa: "اپل", nameEn: "Apple", tagline: "دقت، دوربین و نمایشگر بی‌رقیب", world: "apple", sort: 1 },
  { slug: "samsung", nameFa: "سامسونگ", nameEn: "Samsung", tagline: "پرچمداران نمایشگر و فناوری", world: "samsung", sort: 2 },
  { slug: "xiaomi", nameFa: "شیائومی", nameEn: "Xiaomi", tagline: "اکوسیستم هوشمند با ارزش خرید بالا", world: "xiaomi", sort: 3 },
  { slug: "accessories", nameFa: "لوازم جانبی", nameEn: "Accessories", tagline: "شارژ، صدا، پوشیدنی و اتصال", world: "accessory", sort: 4 },
];

export const CATEGORY_SEED = [
  { slug: "flagship", nameFa: "گوشی پرچمدار", world: "flagship", sort: 1 },
  { slug: "midrange", nameFa: "گوشی میان‌رده", world: "midrange", sort: 2 },
  { slug: "earbuds", nameFa: "هندزفری بی‌سیم", world: "earbuds", sort: 3 },
  { slug: "wearable", nameFa: "ساعت هوشمند", world: "wearable", sort: 4 },
  { slug: "charging", nameFa: "شارژر و پاوربانک", world: "charging", sort: 5 },
];

export type ProductSeed = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  dealPrice?: number;
  dealHours?: number;
  image: string;
  color: string;
  storage?: string;
  badge?: string;
  isNew?: boolean;
  isFlagship?: boolean;
  stock: number;
  rating: number;
  specs: Record<string, string>;
  description: string;
};

export const PRODUCT_SEED: ProductSeed[] = [
  { slug: "iphone-16-pro-max", name: "آیفون ۱۶ پرو مکس", brand: "apple", category: "flagship", price: 118 * M, dealPrice: 109.5 * M, dealHours: 31, image: IMG.iphone, color: "تیتانیوم صحرایی", storage: "۲۵۶ گیگابایت", badge: "پرفروش", isNew: true, isFlagship: true, stock: 7, rating: 49, specs: { نمایشگر: "۶.۹ اینچ ProMotion", تراشه: "A18 Pro", دوربین: "۴۸ مگاپیکسل سه‌گانه", باتری: "۴۶۸۵ میلی‌آمپر" }, description: "پرچمدار تیتانیومی اپل با دوربین پریسکوپی ۵ برابری، نمایشگر ۱۲۰ هرتزی و دکمه کنترل دوربین." },
  { slug: "iphone-16-pro", name: "آیفون ۱۶ پرو", brand: "apple", category: "flagship", price: 102 * M, image: IMG.iphone, color: "تیتانیوم مشکی", storage: "۲۵۶ گیگابایت", isNew: true, isFlagship: true, stock: 12, rating: 49, specs: { نمایشگر: "۶.۳ اینچ ProMotion", تراشه: "A18 Pro", دوربین: "۴۸ مگاپیکسل سه‌گانه", باتری: "۳۵۸۲ میلی‌آمپر" }, description: "قدرت پرو در ابعاد جمع‌وجور؛ همان دوربین و تراشه پرومکس در قابی سبک‌تر." },
  { slug: "iphone-16", name: "آیفون ۱۶", brand: "apple", category: "flagship", price: 78 * M, dealPrice: 72.9 * M, dealHours: 19, image: IMG.iphone, color: "اولترامارین", storage: "۱۲۸ گیگابایت", badge: "پیشنهاد ویژه", isFlagship: true, stock: 4, rating: 47, specs: { نمایشگر: "۶.۱ اینچ Super Retina", تراشه: "A18", دوربین: "۴۸ مگاپیکسل دوگانه", باتری: "۳۵۶۱ میلی‌آمپر" }, description: "آیفون استاندارد با دکمه اکشن، تراشه A18 و پشتیبانی کامل از هوش مصنوعی اپل." },
  { slug: "iphone-15", name: "آیفون ۱۵", brand: "apple", category: "midrange", price: 64 * M, image: IMG.iphone, color: "مشکی", storage: "۱۲۸ گیگابایت", stock: 15, rating: 46, specs: { نمایشگر: "۶.۱ اینچ OLED", تراشه: "A16 Bionic", دوربین: "۴۸ مگاپیکسل", باتری: "۳۳۴۹ میلی‌آمپر" }, description: "انتخاب اقتصادی برای ورود به اکوسیستم اپل با درگاه USB-C و Dynamic Island." },
  { slug: "galaxy-s25-ultra", name: "گلکسی S25 اولترا", brand: "samsung", category: "flagship", price: 96 * M, dealPrice: 89 * M, dealHours: 27, image: IMG.galaxy, color: "تیتانیوم نقره‌ای", storage: "۲۵۶ گیگابایت", badge: "تخفیف داغ", isNew: true, isFlagship: true, stock: 6, rating: 48, specs: { نمایشگر: "۶.۹ اینچ Dynamic AMOLED 2X", تراشه: "Snapdragon 8 Elite", دوربین: "۲۰۰ مگاپیکسل چهارگانه", باتری: "۵۰۰۰ میلی‌آمپر" }, description: "اولترا با قلم S Pen، دوربین ۲۰۰ مگاپیکسلی و بدنه تیتانیومی؛ پادشاه اندرویدها." },
  { slug: "galaxy-s25-plus", name: "گلکسی S25 پلاس", brand: "samsung", category: "flagship", price: 71 * M, image: IMG.galaxy, color: "آبی یخی", storage: "۲۵۶ گیگابایت", isNew: true, isFlagship: true, stock: 9, rating: 47, specs: { نمایشگر: "۶.۷ اینچ QHD+", تراشه: "Snapdragon 8 Elite", دوربین: "۵۰ مگاپیکسل سه‌گانه", باتری: "۴۹۰۰ میلی‌آمپر" }, description: "نمایشگر بزرگ و روشن با شارژ سریع ۴۵ وات و هوش مصنوعی گلکسی." },
  { slug: "galaxy-z-flip6", name: "گلکسی Z فلیپ ۶", brand: "samsung", category: "flagship", price: 74 * M, image: IMG.galaxy, color: "نعنایی", storage: "۲۵۶ گیگابایت", badge: "تاشو", isNew: true, isFlagship: true, stock: 5, rating: 46, specs: { نمایشگر: "۶.۷ اینچ تاشو + ۳.۴ اینچ بیرونی", تراشه: "Snapdragon 8 Gen 3", دوربین: "۵۰ مگاپیکسل دوگانه", باتری: "۴۰۰۰ میلی‌آمپر" }, description: "تاشوی جیبی با نمایشگر بیرونی بزرگ‌تر و دوربین ارتقایافته." },
  { slug: "galaxy-a56", name: "گلکسی A56", brand: "samsung", category: "midrange", price: 27.5 * M, dealPrice: 24.9 * M, dealHours: 12, image: IMG.galaxy, color: "خاکستری گرافیتی", storage: "۲۵۶ گیگابایت", stock: 22, rating: 45, specs: { نمایشگر: "۶.۷ اینچ Super AMOLED", تراشه: "Exynos 1580", دوربین: "۵۰ مگاپیکسل سه‌گانه", باتری: "۵۰۰۰ میلی‌آمپر" }, description: "میان‌رده محبوب سامسونگ با ۶ سال به‌روزرسانی و بدنه فلزی." },
  { slug: "xiaomi-15-ultra", name: "شیائومی ۱۵ اولترا", brand: "xiaomi", category: "flagship", price: 82 * M, image: IMG.xiaomi, color: "مشکی چرمی", storage: "۵۱۲ گیگابایت", badge: "لایکا", isNew: true, isFlagship: true, stock: 3, rating: 48, specs: { نمایشگر: "۶.۷۳ اینچ LTPO AMOLED", تراشه: "Snapdragon 8 Elite", دوربین: "۵۰ مگاپیکسل لایکا یک‌اینچی", باتری: "۵۴۱۰ میلی‌آمپر" }, description: "دوربین یک‌اینچی لایکا با لنز پریسکوپی ۲۰۰ مگاپیکسلی؛ ساخته‌شده برای عکاسی حرفه‌ای." },
  { slug: "xiaomi-15", name: "شیائومی ۱۵", brand: "xiaomi", category: "flagship", price: 58 * M, dealPrice: 53.5 * M, dealHours: 40, image: IMG.xiaomi, color: "سفید", storage: "۲۵۶ گیگابایت", isNew: true, isFlagship: true, stock: 8, rating: 47, specs: { نمایشگر: "۶.۳۶ اینچ AMOLED", تراشه: "Snapdragon 8 Elite", دوربین: "۵۰ مگاپیکسل سه‌گانه لایکا", باتری: "۵۴۰۰ میلی‌آمپر" }, description: "پرچمدار جمع‌وجور با شارژ ۹۰ وات و دوربین لایکا." },
  { slug: "redmi-note-14-pro-plus", name: "ردمی نوت ۱۴ پرو پلاس", brand: "xiaomi", category: "midrange", price: 24 * M, image: IMG.xiaomi, color: "بنفش", storage: "۵۱۲ گیگابایت", badge: "ارزش خرید", isNew: true, stock: 18, rating: 45, specs: { نمایشگر: "۶.۶۷ اینچ AMOLED خمیده", تراشه: "Snapdragon 7s Gen 3", دوربین: "۲۰۰ مگاپیکسل", باتری: "۶۲۰۰ میلی‌آمپر" }, description: "باتری ۶۲۰۰ میلی‌آمپری، شارژ ۹۰ وات و مقاومت IP68 در یک میان‌رده." },
  { slug: "poco-x7-pro", name: "پوکو X7 پرو", brand: "xiaomi", category: "midrange", price: 19.8 * M, dealPrice: 17.9 * M, dealHours: 8, image: IMG.xiaomi, color: "زرد", storage: "۲۵۶ گیگابایت", stock: 11, rating: 44, specs: { نمایشگر: "۶.۶۷ اینچ AMOLED 120Hz", تراشه: "Dimensity 8400 Ultra", دوربین: "۵۰ مگاپیکسل", باتری: "۶۰۰۰ میلی‌آمپر" }, description: "قدرت گیمینگ در قیمت میان‌رده؛ پرفروش‌ترین پوکو سال." },
  { slug: "airpods-pro-2", name: "ایرپادز پرو ۲ (USB-C)", brand: "apple", category: "earbuds", price: 13.9 * M, image: IMG.earbuds, color: "سفید", isFlagship: true, stock: 25, rating: 49, specs: { "حذف نویز": "فعال با حالت تطبیقی", باتری: "۶ ساعت + ۳۰ ساعت با کیس", اتصال: "بلوتوث ۵.۳", مقاومت: "IP54" }, description: "بهترین حذف نویز اکوسیستم اپل با صدای فضایی و کیس USB-C." },
  { slug: "galaxy-buds3-pro", name: "گلکسی بادز ۳ پرو", brand: "samsung", category: "earbuds", price: 9.2 * M, dealPrice: 8.1 * M, dealHours: 22, image: IMG.earbuds, color: "نقره‌ای", isNew: true, stock: 14, rating: 46, specs: { "حذف نویز": "فعال هوشمند", باتری: "۷ ساعت + ۳۰ ساعت", اتصال: "بلوتوث ۵.۴", صدا: "دو درایور ۲۴ بیت" }, description: "طراحی جدید ساقه‌دار با نوار نوری و ترجمه زنده." },
  { slug: "redmi-buds-6-pro", name: "ردمی بادز ۶ پرو", brand: "xiaomi", category: "earbuds", price: 3.4 * M, image: IMG.earbuds, color: "مشکی", stock: 30, rating: 43, specs: { "حذف نویز": "۵۵ دسی‌بل", باتری: "۹ ساعت + ۳۶ ساعت", اتصال: "بلوتوث ۵.۳", صدا: "سه درایور" }, description: "هندزفری اقتصادی با حذف نویز قدرتمند و صدای هایرز." },
  { slug: "apple-watch-series-10", name: "اپل واچ سری ۱۰", brand: "apple", category: "wearable", price: 29.5 * M, image: IMG.watch, color: "مشکی جت", isNew: true, isFlagship: true, stock: 9, rating: 48, specs: { نمایشگر: "۴۶ میلی‌متر LTPO3 OLED", ضخامت: "۹.۷ میلی‌متر", سلامت: "ECG، اکسیژن خون، آپنه خواب", باتری: "۱۸ ساعت" }, description: "باریک‌ترین اپل واچ با بزرگ‌ترین نمایشگر و شارژ سریع." },
  { slug: "galaxy-watch7", name: "گلکسی واچ ۷", brand: "samsung", category: "wearable", price: 14.8 * M, dealPrice: 12.9 * M, dealHours: 16, image: IMG.watch, color: "سبز", stock: 13, rating: 45, specs: { نمایشگر: "۴۴ میلی‌متر Super AMOLED", تراشه: "Exynos W1000", سلامت: "پایش خواب، ضربان، AGEs", باتری: "۴۲۵ میلی‌آمپر" }, description: "ساعت هوشمند با Wear OS، تراشه ۳ نانومتری و سنسورهای سلامت پیشرفته." },
  { slug: "xiaomi-watch-s4", name: "شیائومی واچ S4", brand: "xiaomi", category: "wearable", price: 7.6 * M, image: IMG.watch, color: "نقره‌ای", isNew: true, stock: 17, rating: 44, specs: { نمایشگر: "۱.۴۳ اینچ AMOLED", بدنه: "آلومینیوم با بزل قابل‌تعویض", سلامت: "ضربان، SpO2، خواب", باتری: "۱۵ روز" }, description: "ساعت شیک با بزل قابل تعویض و باتری ۱۵ روزه." },
  { slug: "apple-20w-usb-c", name: "شارژر ۲۰ وات اپل USB-C", brand: "apple", category: "charging", price: 1.75 * M, image: IMG.charger, color: "سفید", stock: 60, rating: 47, specs: { توان: "۲۰ وات", درگاه: "USB-C", سازگاری: "آیفون ۸ به بعد", ضمانت: "اصالت کالا" }, description: "شارژر اورجینال اپل با شارژ سریع ۵۰ درصد در ۳۰ دقیقه." },
  { slug: "samsung-45w-travel", name: "شارژر ۴۵ وات سامسونگ", brand: "samsung", category: "charging", price: 2.1 * M, dealPrice: 1.79 * M, dealHours: 10, image: IMG.charger, color: "مشکی", stock: 40, rating: 46, specs: { توان: "۴۵ وات PPS", درگاه: "USB-C", کابل: "۵ آمپر همراه", سازگاری: "گلکسی S و Note" }, description: "شارژر فوق سریع سامسونگ همراه با کابل ۵ آمپری." },
  { slug: "xiaomi-powerbank-20000", name: "پاوربانک ۲۰۰۰۰ شیائومی ۳۳ وات", brand: "xiaomi", category: "charging", price: 2.6 * M, image: IMG.charger, color: "مشکی", isNew: true, stock: 35, rating: 45, specs: { ظرفیت: "۲۰۰۰۰ میلی‌آمپر", توان: "۳۳ وات", درگاه: "USB-C + دو USB-A", وزن: "۴۴۰ گرم" }, description: "پاوربانک پرظرفیت با شارژ سریع دوطرفه." },
  { slug: "anker-magsafe-3in1", name: "پایه شارژ سه‌کاره مگ‌سیف انکر", brand: "accessories", category: "charging", price: 6.9 * M, dealPrice: 5.9 * M, dealHours: 36, image: IMG.charger, color: "مشکی", badge: "پیشنهاد ویژه", isNew: true, stock: 12, rating: 47, specs: { توان: "۱۵ وات مگ‌سیف", قابلیت: "شارژ هم‌زمان آیفون، واچ و ایرپادز", جنس: "آلومینیوم", گارانتی: "۱۸ ماه" }, description: "یک پایه برای شارژ کل اکوسیستم؛ تاشو و مناسب سفر." },
  { slug: "sony-wf-1000xm5", name: "سونی WF-1000XM5", brand: "accessories", category: "earbuds", price: 15.4 * M, image: IMG.earbuds, color: "مشکی", isFlagship: true, stock: 8, rating: 49, specs: { "حذف نویز": "بهترین کلاس با دو پردازنده", باتری: "۸ ساعت + ۲۴ ساعت", اتصال: "بلوتوث ۵.۳ LDAC", وزن: "۵.۹ گرم" }, description: "معیار طلایی حذف نویز؛ کوچک‌تر، سبک‌تر و قدرتمندتر." },
  { slug: "spigen-ultra-hybrid-16pro", name: "قاب اسپیگن اولترا هیبرید آیفون ۱۶ پرو", brand: "accessories", category: "charging", price: 0.98 * M, image: IMG.iphone, color: "شفاف", stock: 50, rating: 46, specs: { جنس: "پلی‌کربنات + TPU", محافظت: "ضدضربه نظامی", "مگ‌سیف": "سازگار", رنگ: "کریستال شفاف" }, description: "قاب شفاف ضدزردی با محافظت کامل و سازگاری با مگ‌سیف." },
];

export const GALLERY_SEED = [
  { src: "/images/gallery/store-exterior.jpg", title: "ورودی فروشگاه حامی همراه", caption: "نمای بیرونی شعبه مرکزی؛ جایی که تجربه دیجیتال به دنیای واقعی می‌رسد.", aspect: "landscape", sort: 1 },
  { src: "https://images.pexels.com/photos/28919443/pexels-photo-28919443.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1400", title: "سالن نمایش پرچمداران", caption: "همه پرچمدارها را قبل از خرید لمس کنید، مقایسه کنید و انتخاب کنید.", aspect: "landscape", sort: 2 },
  { src: "/images/gallery/store-counter.jpg", title: "میز مشاوره تخصصی", caption: "کارشناسان ما بر اساس نیاز و بودجه شما بهترین گزینه را پیشنهاد می‌دهند.", aspect: "landscape", sort: 3 },
  { src: "/images/gallery/store-wall.jpg", title: "دیوار لوازم جانبی", caption: "از شارژر اورجینال تا ساعت هوشمند؛ همه چیز زیر یک سقف.", aspect: "landscape", sort: 4 },
  { src: "https://images.pexels.com/photos/12968298/pexels-photo-12968298.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1400", title: "لحظه انتخاب", caption: "تحویل حضوری، تست کامل دستگاه و فعال‌سازی گارانتی در محل.", aspect: "landscape", sort: 5 },
];
