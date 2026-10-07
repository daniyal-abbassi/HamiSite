import imgWatch from "../assets/deal-watch.jpg";
import imgTab from "../assets/deal-tab.jpg";
import imgS23 from "../assets/deal-s23.jpg";
import imgFeature from "../assets/deal-feature.jpg";
import imgBuds from "../assets/product-buds3.jpg";

export interface Deal {
  id: number;
  name: string;
  subtitle: string;
  oldPrice: number;
  price: number;
  image: string;
  sold: number;
  total: number;
  tag?: string;
}

export const featuredDeal = {
  id: 100,
  name: "Galaxy Z Fold6",
  subtitle: "نسل جدید تاشوها با نمایشگر ۷.۶ اینچی Dynamic AMOLED 2X",
  oldPrice: 112000000,
  price: 78900000,
  image: imgFeature,
  sold: 37,
  total: 50,
  perks: ["ارسال رایگان و بیمه", "۱۸ ماه گارانتی رسمی", "هدیه: قاب و محافظ صفحه"],
};

export const deals: Deal[] = [
  {
    id: 101,
    name: "Galaxy Watch6 Classic",
    subtitle: "رزگلد ۴۷ میلی‌متری",
    oldPrice: 24500000,
    price: 15900000,
    image: imgWatch,
    sold: 82,
    total: 100,
    tag: "داغ‌ترین",
  },
  {
    id: 102,
    name: "Galaxy Tab S9 FE",
    subtitle: "همراه با قلم S-Pen",
    oldPrice: 38000000,
    price: 27400000,
    image: imgTab,
    sold: 41,
    total: 80,
  },
  {
    id: 103,
    name: "Galaxy S23",
    subtitle: "کرم طلایی ۲۵۶ گیگابایت",
    oldPrice: 46900000,
    price: 33200000,
    image: imgS23,
    sold: 64,
    total: 70,
    tag: "رو به اتمام",
  },
  {
    id: 104,
    name: "Galaxy Buds3 Pro",
    subtitle: "حذف نویز هوشمند",
    oldPrice: 14200000,
    price: 9800000,
    image: imgBuds,
    sold: 29,
    total: 90,
  },
];

export const offPercent = (oldP: number, p: number) =>
  Math.round(((oldP - p) / oldP) * 100);
