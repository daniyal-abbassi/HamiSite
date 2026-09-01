import React from "react";
import { Truck, RefreshCcw, DollarSign, Users } from "lucide-react";

const BenefitsSection = ({ textCenter }: { textCenter: boolean }) => {
  return (
    <section className="py-16 bg-gray-100 dark:bg-gray-800">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {!textCenter ? (
          <div className="flex flex-wrap items-center justify-center md:justify-between mb-12">
            <h2 className="text-3xl md:text-5xl !text-center md:text-start font-bold  text-gray-900 dark:text-white border-l-4 p-2 border-l-rose-500 ">
              Discover Our Advantages
            </h2>
          </div>
        ) : (
          <h2 className="text-3xl md:text-5xl font-bold text-start md:text-center text-gray-900 dark:text-white mb-12 border-l-4  border-l-rose-500 w-fit mx-auto p-2">
            Discover Our Advantages
          </h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div className="flex flex-col items-center space-y-4 bg-white dark:bg-gray-700 rounded-lg p-6 shadow-md">
            <Truck size={48} className="text-blue-500" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Free Shipping
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-center">
              Enjoy free shipping on all orders with little minimum purchase
              required.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 bg-white dark:bg-gray-700 rounded-lg p-6 shadow-md">
            <RefreshCcw size={48} className="text-blue-500" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Easy Returns
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-center">
              Return any item within 30 days for a full refund, no questions
              asked.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 bg-white dark:bg-gray-700 rounded-lg p-6 shadow-md">
            <DollarSign size={48} className="text-blue-500" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Best Prices
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-center">
              Shop with confidence knowing you&apos;re getting the best prices
              guaranteed.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 bg-white dark:bg-gray-700 rounded-lg p-6 shadow-md">
            <Users size={48} className="text-blue-500" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              24/7 Support
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-center">
              Our customer support team is available round the clock to assist
              you.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
