import Image from "next/image";
import React from "react";

const AboutPageOne = () => {
  return (
    <section className="max-w-screen-xl mx-auto p-2 md:p-4">
      <h2 className="text-4xl font-bold mb-4 text-center">About Us</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="relative w-full h-[20rem] md:h-[30rem]">
          {/* replace with your actual image */}
          <Image
            className="rounded-xl object-contain"
            src={"/images/people/group-image.avif"}
            alt="about image"
            fill
          />
        </div>

        {/* add text about yourself */}
        <div className="text-lg">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            Welcome to our electronics paradise! We are passionate about
            providing the latest and greatest gadgets to tech enthusiasts all
            over the world. Our mission is to offer high-quality products at
            affordable prices, coupled with exceptional customer service.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            With years of experience in the industry, we`ve curated a collection
            of products that meet the demands of modern lifestyles. Whether
            you`re looking for cutting-edge smartphones, powerful laptops, or
            innovative smart home devices, we`ve got you covered.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            At our core, we believe in innovation, reliability, and customer
            satisfaction. We`re constantly updating our inventory to stay ahead
            of the curve and bring you the latest tech trends. Our dedicated
            team works tirelessly to ensure your shopping experience is seamless
            from start to finish.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            Thank you for choosing us as your go-to destination for all things
            electronics. Join us on this exciting journey as we continue to
            redefine the way you shop for technology.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutPageOne;
