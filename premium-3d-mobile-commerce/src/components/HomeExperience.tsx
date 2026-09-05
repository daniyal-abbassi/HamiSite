"use client";

import type { ProductView, BrandView, CategoryView, GalleryView } from "@/lib/catalog";
import { JourneyCanvas } from "@/components/three/dynamic";
import { Header, StickyCTA } from "@/components/ui/primitives";
import { Hero, Deals, NewProducts, Store, Gallery } from "@/components/sections/discover";
import { Partnership, Explorer, Creative, Footer } from "@/components/sections/commerce";

export type HomeData = {
  products: ProductView[];
  brands: BrandView[];
  categories: CategoryView[];
  gallery: GalleryView[];
  deals: ProductView[];
  newest: ProductView[];
};

export default function HomeExperience({ data }: { data: HomeData }) {
  return (
    <>
      <JourneyCanvas />
      <Header />
      <main className="relative z-[2]">
        <Hero />
        <Deals deals={data.deals} />
        <NewProducts newest={data.newest} />
        <Store products={data.products} brands={data.brands} categories={data.categories} />
        <Gallery images={data.gallery} />
        <Partnership />
        <Explorer products={data.products} brands={data.brands} categories={data.categories} />
        <Creative />
        <Footer />
      </main>
      <StickyCTA />
    </>
  );
}
