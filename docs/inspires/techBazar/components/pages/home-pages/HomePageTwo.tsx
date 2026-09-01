import BannerTwo from "@/components/banners/BannerTwo";
import SpecialDeals from "@/components/banners/SpecialDeals";
import LatestBlogPosts from "@/components/blog/LatestBlogPosts";
import CategorySectionOne from "@/components/category/CategorySectionOne";
import HeroBannerTwo from "@/components/hero/HeroBannerTwo";
import NewsLetterTwo from "@/components/newsLetter/NewsLetterTwo";
import BenefitsSection from "@/components/others/BenefitSection";
import Loader from "@/components/others/Loader";
import TestimonialsSection from "@/components/others/Testimonials";
import ProductsCollectionTwo from "@/components/products/ProductsCollectionTwo";
import React, { Suspense } from "react";

const HomePageTwo = () => {
  return (
    <div className="overflow-hidden">
      <HeroBannerTwo />
      <SpecialDeals textCenter={true} />
      <Suspense fallback={<Loader />}>
        <CategorySectionOne />
      </Suspense>
      <ProductsCollectionTwo />
      <BenefitsSection textCenter={true} />
      <BannerTwo />
      <TestimonialsSection textCenter={true} />
      <LatestBlogPosts twoColunmHeader={false} />
      <NewsLetterTwo />
    </div>
  );
};

export default HomePageTwo;
