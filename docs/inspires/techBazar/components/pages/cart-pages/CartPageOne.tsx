'use client'
import CartItemsDetails from "@/components/carts/CartItemsDetails";
import OrderSummaryForCart from "@/components/carts/OrderSummaryForCart";
import BreadcrumbComponent from "@/components/others/Breadcrumb";
import { Separator } from "@/components/ui/separator";
import React from "react";

const CartPageOne = () => {

  return (
    <section className="p-4 md:p-8  bg-white dark:bg-gray-800">
      <div className="max-w-screen-xl mx-auto">
        <div className="space-y-3">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
            Shopping Cart
          </h1>
          <BreadcrumbComponent links={["/cart"]} pageText="Shopping Cart" />
          <Separator className="dark:bg-white" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          {/* Cart Items */}
          <CartItemsDetails />

          {/* Order Summary */}
          <OrderSummaryForCart />
        </div>
      </div>
    </section>
  );
};

export default CartPageOne;