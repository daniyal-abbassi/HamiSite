import Image from "next/image";
import React from "react";

const HeroBannerThree = () => {

  // get banner data from the server and show here

  return (
    <section className="py-20 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900">
      <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row items-center">
        <div className="lg:w-1/2 lg:mr-8">
          <h1 className="text-4xl lg:text-6xl font-bold mb-4">
            Discover the Latest in Tech
          </h1>
          <p className="text-lg lg:text-xl mb-8">
            Explore our wide range of gadgets and electronics
          </p>
          <button className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-8 rounded-lg dark:bg-gray-800 dark:hover:bg-gray-700">
            Shop Now
          </button>
        </div>
        <div className="relative h-[20rem] lg:w-1/2 mt-8 lg:mt-0">
          <Image
            src={"/images/category/headphone.png"}
            alt="Tech Gadgets"
            fill
            className="w-full rounded-lg shadow-lg object-contain"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroBannerThree;
