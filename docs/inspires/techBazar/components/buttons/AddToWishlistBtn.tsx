'use client'
import React from "react";
import { Button } from "../ui/button";
import { Product,} from "@/types";
import useWishlistStore from "@/store/wishlistStore";
import { showToast } from "@/lib/showToast";

const AddToWishlistBtn = ({product}:{product:Product}) => {
  const {addToWishlist,isInWishlist} = useWishlistStore()

  const handleAddToWishList = () => {
    if(isInWishlist(product.id)){
      showToast('Item Already Exist In Wishlist',product.images[0] as string, product.name)
    }else{
      addToWishlist(product);
    showToast('Item Added To The Wishlist',product.images[0] as string, product.name)
    }
  }

  return (
    <Button onClick={(handleAddToWishList)} variant={"outline"} className="w-full p-8 text-xl rounded-full">
      {" "}
      Add To Wishlish
    </Button>
  );
};

export default AddToWishlistBtn;
