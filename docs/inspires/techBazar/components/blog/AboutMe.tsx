import Image from "next/image";
import React from "react";

const AboutMe = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          About Me
        </h2>
        <div>
          <p className="text-gray-700 dark:text-gray-300 mb-4 ">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa sapiente excepturi reiciendis exercitationem vitae facilis rerum, quasi sint fugiat odit, ad ducimus eum? Culpa incidunt sit ex facilis deleniti minus.
          </p>
          <div className="flex items-center mb-4">
            <Image
              src= '/images/people/person.jpg'
              alt="User"
              width={48}
              height={48}
              className="w-12 h-12 rounded-full mr-4 object-cover"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
               Shohag Miah
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                CEO, Company Inc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutMe;
