import Image from "next/image";
import React from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const BannerOne = () => {


  // get banner data from backend and show here

  return (
    <section className="relative w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 flex flex-col-reverse lg:flex-row items-center justify-between">
        <div className="flex flex-col justify-center items-center text-center lg:text-left lg:w-1/2">
          <h2 className="text-3xl lg:text-5xl text-center font-bold text-white mt-4 leading-tight">
            Discover the Latest Gadgets
            <br className="hidden lg:block" /> with Exciting Deals!
          </h2>
          <p className="text-white text-lg mt-4">
            Explore a wide range of electronics at unbeatable prices.
          </p>
          <Link href="/shop" className="flex items-center justify-center gap-2 mt-8 px-10 py-4 hover:ring-2 hover:ring-white hover:ring-opacity-50 text-lg font-semibold rounded-full bg-white text-purple-500 hover:bg-purple-500 hover:text-white transition duration-300 ease-in-out">
            <ArrowRight className="mr-2" size={24} /> Shop Now
          </Link>
        </div>
        <div className="relative lg:w-1/2  lg:mt-0">
          <div className="rounded-xl overflow-hidden relative w-[20rem] lg:w-[30rem] h-[15rem] lg:h-[25rem] ">
            <Image src="/images/banner/headphone.png" className="object-contain" fill alt="Electronics Banner"/>
          </div>
          <div className="absolute top-0 right-0 w-full h-full flex items-center justify-center animate-blob1">
            <div className="w-24 h-24 bg-white rounded-full opacity-50"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BannerOne;
