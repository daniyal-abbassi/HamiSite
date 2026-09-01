"use client";
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

import AddToCartBtn from "@/components/buttons/AddToCartBtn";
import useWishlistStore from "@/store/wishlistStore";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/formatPrice";

const WishlistPage = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { wishlistItems, removeFromWishlist } = useWishlistStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="px-4 py-8 lg:px-16 lg:py-12 bg-gray-100 dark:bg-gray-800">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-4">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white">
            Wishlist
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your Saved Items Here
          </p>
        </div>
        {/* Wishlist Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistItems.map((cart) => (
            <div
              key={cart.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden"
            >
              <div className="relative w-full h-48 mt-2">
                <Image
                  src={cart.images && cart.images[0]}
                  alt="Product"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="p-4">
                <Link
                  href={`shop/${cart.id}`}
                  className="text-xl font-semibold text-gray-800 dark:text-white hover:opacity-60"
                >
                  {cart.name.slice(0, 50)}
                </Link>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {cart.description.slice(0, 100)}
                </p>
                <div className="flex justify-between items-center">
                  <p className="text-green-500 font-semibold text-lg">${formatPrice(cart.price)}</p>
                  <button
                    className="text-red-500 hover:text-red-600 focus:outline-none"
                    onClick={() => removeFromWishlist(cart.id)}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <AddToCartBtn
                  product={{ ...cart, quantity: 1, selectedColor: "" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
