import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productsData } from "@/data/products/productsData";

import React from "react";
import SingleProductCartView from "../product/SingleProductCartView";

const ProductsCollectionTwo = () => {
  //get products data from server here based on the category or tab value
  const data = productsData;

  return (
    <section className="max-w-screen-xl mx-auto py-16 px-4 md:px-8 w-full">
      <Tabs defaultValue="new-arrivals" className="w-full space-y-8 mx-0">
        <TabsList className="font-semibold bg-transparent w-full text-center">
          <TabsTrigger value="new-arrivals" className="md:text-xl">
            New Arrivals
          </TabsTrigger>
          <TabsTrigger value="best-sellers" className="md:text-xl">
            Best Sellers
          </TabsTrigger>
          <TabsTrigger value="feauted" className="md:text-xl">
            Featured
          </TabsTrigger>
        </TabsList>
        <TabsContent value="new-arrivals" className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
            {data?.slice(0, 8)?.map((product) => {
              return (
                <SingleProductCartView key={product.id} product={product} />
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="best-sellers">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data?.slice(0, 8)?.map((product) => {
              return (
                <SingleProductCartView key={product.id} product={product} />
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="feauted">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data?.slice(0, 8)?.map((product) => {
              return (
                <SingleProductCartView key={product.id} product={product} />
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default ProductsCollectionTwo;
