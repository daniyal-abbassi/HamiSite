import type { Metadata } from "next";
import { DM_Mono, Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-vazirmatn",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "حامی همراه | فروشگاه موبایل و اکسسوری",
    template: "%s | حامی همراه",
  },
  description:
    "فروشگاه حامی همراه — عرضه موبایل، ساعت هوشمند و اکسسوری؛ پشتیبانی از خرید خرد و عمده (B2B).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

