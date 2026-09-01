"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { testinomials } from "@/data/testimonials/testimonialData";
import Autoplay from "embla-carousel-autoplay";

const TestimonialsSection = ({ textCenter }: { textCenter: boolean }) => {
  return (
    <div className="py-16 bg-gray-200 dark:bg-gray-800">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <h2
          className={cn(
            "text-3xl md:text-5xl  font-bold text-gray-900 dark:text-white mb-12 p-2 w-fit ",
            textCenter
              ? "text-center border-l-4 border-l-rose-500 mx-auto "
              : "text-start border-l-4 border-l-rose-500"
          )}
        >
          What Our Customers Say
        </h2>
        <Carousel
          plugins={[
            Autoplay({
              delay: 2000,
            }),
          ]}
        >
          <CarouselContent className="space-x-4 px-2 lg:px-6">
            {testinomials.map((testi) => (
              <CarouselItem
                key={testi.id}
                className="md:basis-1/3 pl-2 md:pl-4"
              >
                <div className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                  <div key={testi.id} className="p-6">
                    <p className="text-gray-700 dark:text-gray-300 mb-4 ">
                      {testi.content}
                    </p>
                    <div className="flex items-center mb-4">
                      <Image
                        src={testi.image}
                        alt="User"
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full mr-4 object-cover"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {testi.name}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          {testi.designation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Repeat for more testimonials */}
      </div>
    </div>
  );
};

export default TestimonialsSection;
