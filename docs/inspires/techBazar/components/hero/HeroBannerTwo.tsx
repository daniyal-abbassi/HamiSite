import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function HeroBannerTwo() {


  // get banner data from the server and show here

  return (
    <section className="bg-gradient-to-r from-gray-500 to-gray-800 text-white lg:py-8">
      <div className="max-w-screen-xl mx-auto relative overflow-hidden py-16 grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 lg:p-8">
        {/* Big main banner */}
        <div className=" px-4 relative z-10 lg:col-span-2">
          <div className="flex flex-col-reverse md:flex-row items-center">
            <div className="lg:w-full  text-center md:text-start">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 mt-2 md:mt-0">
                Discover the Latest in Tech
              </h1>
              <p className="text-lg lg:text-xl mb-8">
                Explore our wide range of gadgets and electronics
              </p>
              <div className="flex items-center justify-center md:justify-start">
                <Link
                  href={`/shop`}
                  className="bg-blue-500 hover:bg-blue-600 text-lg text-white py-4 px-10 rounded-full flex items-center gap-2"
                >
                  <ArrowRight /> Shop Now
                </Link>
              </div>
            </div>
            <div className="relative h-[20rem] md:h-[30rem] w-full lg:mt-0">
              <Image
                src={"/images/products/apple-watch-9-removebg-preview.png"}
                alt="Tech Gadgets"
                fill
                className="w-full rounded-lg object-cover"
              />
            </div>
          </div>
        </div>
        {/* smaller banner */}
        <div
          className="lg:col-span-1 bg-white text-black dark:bg-slate-900 dark:text-white p-4 
        rounded-md shadow-md space-y-2 py-6 text-center"
        >
          <h2 className="text-3xl font-bold">Special Summer Sale</h2>
          <div className="relative w-full h-60">
            <Image
              src={"/images/products/senheiser-removebg-preview.png"}
              alt="product"
              fill
              className="object-contain"
            />
          </div>
          <p className="my-4 text-lg font-medium">
            Get up to <span className="text-rose-500 text-xl">( 50% off )</span>{" "}
            on Headphones !
          </p>
          <Link
            href={"/shop?category=Headphones"}
            className="py-3 px-8 block w-fit  whitespace-nowrap mx-auto rounded-full bg-blue-500 hover:bg-blue-600
             text-white text-lg"
          >
            Explore Now
          </Link>
        </div>
      </div>
    </section>
  );
}

export default HeroBannerTwo;
