import imgA56 from "../assets/product-a56.jpg";
import imgS24 from "../assets/product-s24ultra.jpg";
import imgFlip from "../assets/product-zflip6.jpg";
import imgBuds from "../assets/product-buds3.jpg";

export type Badge = "special" | "new" | "hot" | null;

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  badge: Badge;
  colors: string[];
  inStock: boolean;
  isNew: boolean;
  addedAt: number; // for "newest" sorting
}

export const products: Product[] = [
  {
    id: 1,
    name: "Galaxy A56 5G",
    price: 22800000,
    image: imgA56,
    badge: "special",
    colors: ["#9aa0a6", "#20242a", "#f2c7d3", "#cdd3d8"],
    inStock: true,
    isNew: false,
    addedAt: 5,
  },
  {
    id: 2,
    name: "Galaxy S24 Ultra",
    price: 59900000,
    image: imgS24,
    badge: "new",
    colors: ["#3b4046", "#5d6b7a", "#b8bfc7"],
    inStock: true,
    isNew: true,
    addedAt: 8,
  },
  {
    id: 3,
    name: "Galaxy Z Flip6",
    price: 33500000,
    image: imgFlip,
    badge: "hot",
    colors: ["#7c6fd0", "#9b8fe0", "#aeb4bd"],
    inStock: true,
    isNew: false,
    addedAt: 4,
  },
  {
    id: 4,
    name: "Galaxy Buds3 Pro",
    price: 9800000,
    image: imgBuds,
    badge: "new",
    colors: ["#f4f4f5", "#9aa0a6", "#3f4448"],
    inStock: true,
    isNew: true,
    addedAt: 7,
  },
  {
    id: 5,
    name: "Galaxy S24 FE",
    price: 28400000,
    image: imgS24,
    badge: null,
    colors: ["#2c3e57", "#8fa3b8", "#d7dde3"],
    inStock: true,
    isNew: true,
    addedAt: 6,
  },
  {
    id: 6,
    name: "Galaxy Z Fold6",
    price: 78900000,
    image: imgFlip,
    badge: "hot",
    colors: ["#8a7fd6", "#c9c2ec", "#b9bfc8"],
    inStock: false,
    isNew: false,
    addedAt: 3,
  },
  {
    id: 7,
    name: "Galaxy A16",
    price: 12500000,
    image: imgA56,
    badge: null,
    colors: ["#20242a", "#7d8894", "#cfd4d8"],
    inStock: true,
    isNew: false,
    addedAt: 2,
  },
  {
    id: 8,
    name: "Galaxy Buds FE",
    price: 6900000,
    image: imgBuds,
    badge: "special",
    colors: ["#f4f4f5", "#41464b"],
    inStock: true,
    isNew: false,
    addedAt: 1,
  },
];

export const faNum = (n: number) => n.toLocaleString("fa-IR");
