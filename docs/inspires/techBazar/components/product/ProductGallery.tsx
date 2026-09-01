"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { useState } from "react";

interface ProductGalleryProps {
  images: string[];
  isInModal: boolean;
}

const ProductGallery = ({ images, isInModal }: ProductGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  const handleImageSelection = (image: string) => {
    setSelectedImage(image);
  };

  return (
    <div className="">
      <div
        className={cn(
          "relative w-full rounded-xl overflow-hidden bg-gray-200",
          isInModal
            ? "w-full lg:min-w-[30rem] h-[15rem] lg:h-[25rem]"
            : "w-full lg:min-w-[30rem] h-[20rem] lg:h-[30rem]"
        )}
      >
        <Image
          className="object-contain "
          src={selectedImage}
          alt="product"
          fill
        />
      </div>
      <div className="flex items-center gap-2 p-2 overflow-auto hide-scrollbar mt-2">
        {images.map((image) => (
          <Image
            onClick={() => handleImageSelection(image)}
            className={cn("rounded-md object-cover border", image === selectedImage && 'ring-2')}
            src={image}
            alt="product"
            key={image}
            width={100}
            height={100}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductGallery;
