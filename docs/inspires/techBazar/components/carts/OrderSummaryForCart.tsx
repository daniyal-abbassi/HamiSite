'use client'
import React, { useEffect, useState } from "react";
import CheckoutBtn from "../buttons/CheckoutBtn";
import useCartStore from "@/store/cartStore";
import Loader from "../others/Loader";
import { formatPrice } from "@/lib/formatPrice";

const OrderSummaryForCart = () => {

  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
     setIsMounted(true)
  },[])

  
  const {getTotalPrice,getTax,getShippingFee,getTotalAmount} = useCartStore()

  
  if(!isMounted){
    return <Loader />
  }


  return (
    <div className="w-full shadow-md  bg-gray-100 dark:bg-gray-700 p-4 md:p-6 rounded-lg" >
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        Order Summary
      </h2>
      <div className="flex justify-between mb-4">
        <span className="text-gray-700 dark:text-gray-300">Subtotal:</span>
        <span className="text-gray-900 dark:text-white">${formatPrice(getTotalPrice())}</span>
      </div>
      <div className="flex justify-between mb-4">
        <span className="text-gray-700 dark:text-gray-300">Shipping:</span>
        <span className="text-gray-900 dark:text-white">${formatPrice(getShippingFee())}</span>
      </div>
      <div className="flex justify-between mb-4">
        <span className="text-gray-700 dark:text-gray-300">Tax:</span>
        <span className="text-gray-900 dark:text-white">${formatPrice(getTax())}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-xl font-semibold text-gray-900 dark:text-white">
          Total:
        </span>
        <span className="text-xl font-semibold text-gray-900 dark:text-white">
          ${formatPrice(getTotalAmount())}
        </span>
      </div>
      <div className="w-fit mt-4">
      <CheckoutBtn />
      </div>
    </div>
  );
};

export default OrderSummaryForCart;
