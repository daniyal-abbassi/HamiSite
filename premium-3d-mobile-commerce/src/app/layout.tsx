import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "حامی همراه | فروشگاه تخصصی موبایل، آیفون، سامسونگ و شیائومی",
  description:
    "حامی همراه؛ فروشگاه پریمیوم موبایل. خرید آیفون، سامسونگ، شیائومی، گوشی‌های پرچمدار و لوازم جانبی با قیمت رقابتی، ضمانت اصالت و امکان همکاری عمده.",
  keywords: ["حامی همراه", "خرید موبایل", "آیفون", "سامسونگ", "شیائومی", "لوازم جانبی", "همکاری عمده"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e0d10",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-graphite text-ivory antialiased">{children}</body>
    </html>
  );
}
