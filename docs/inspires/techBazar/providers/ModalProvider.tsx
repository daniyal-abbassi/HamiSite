"use client";
import MobileSearch from "@/components/modals/MobileSearch";
import ProductQuickViewModal from "@/components/modals/ProductQuickView";
import Loader from "@/components/others/Loader";
import { useProductQuickViewStore } from "@/store/productQuickViewStore";
import React, { Suspense } from "react";

const ModalProvider = () => {
  return (
    <div>
      <Suspense fallback={<p>Loading...</p>}>
        <ProductQuickViewModal />
        <MobileSearch />
      </Suspense>
    </div>
  );
};

export default ModalProvider;
