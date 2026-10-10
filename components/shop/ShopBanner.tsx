import Link from "next/link";

/** Compact page location; the catalog title is the page's primary heading. */
export function ShopBanner() {
  return (
    <nav className="shop-breadcrumb shop-wrap" aria-label="مسیر صفحه">
      <Link href="/">حامی همراه</Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page">فروشگاه</span>
    </nav>
  );
}
