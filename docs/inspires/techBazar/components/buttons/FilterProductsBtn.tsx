"use client";
import React, { Suspense } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import FilterProducts from "../products/FilterProducts";
import { Filter } from "lucide-react";
import Loader from "../others/Loader";

const FilterProductsBtn = () => {
  return (
    <Sheet>
      <SheetTrigger>
        <div className="text-lg flex items-center gap-2 bg-black rounded-md dark:bg-white py-2 px-6 dark:text-black text-white">
          <Filter /> Filter
        </div>
      </SheetTrigger>
      <SheetContent className="overflow-y-scroll">
        <Suspense fallback={<Loader />}>
          <FilterProducts />
        </Suspense>
      </SheetContent>
    </Sheet>
  );
};

export default FilterProductsBtn;
