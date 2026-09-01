import FilterProducts from "@/components/products/FilterProducts";
import ShopPageContainer from "@/components/products/ShopPageContainer";
import React, { Suspense } from "react";
import Loader from "@/components/others/Loader";

interface ShopPageOneProps {
  searchParams: {
    page: string;
    category: string;
    brand: string;
    search: string;
    min: string;
    max: string;
    color: string;
  };
}

const ShopPageOne = ({ searchParams }: ShopPageOneProps) => {
  return (
    <section className="max-w-screen-xl flex gap-2 mx-auto p-2 md:p-8">
      <div className="hidden xl:block w-72">
        <Suspense fallback={<Loader />}>
          <FilterProducts />
        </Suspense>
      </div>
      <ShopPageContainer gridColumn={3} searchParams={searchParams} />
    </section>
  );
};

export default ShopPageOne;
