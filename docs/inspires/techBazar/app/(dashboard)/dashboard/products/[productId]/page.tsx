import React from "react";
import ProductGallery from "@/components/product/ProductGallery";
import ProductDetails from "@/components/product/ProductDetails";
import { productsData } from "@/data/products/productsData";
import BreadcrumbComponent from "@/components/others/Breadcrumb";

const ProductDetailsPage = () => {
  // get product data here based on params

  const product = productsData[0];

  return (
    <div className="max-w-screen-xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="py-2">
        <BreadcrumbComponent
          links={["/dashboard", "/products"]}
          pageText={product.name}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:gap-8">
        {/* Product Gallery */}
        <ProductGallery isInModal={false} images={product?.images!} />
        {/* product details */}
        <ProductDetails product={product!} />
      </div>
    </div>
  );
};

export default ProductDetailsPage;
