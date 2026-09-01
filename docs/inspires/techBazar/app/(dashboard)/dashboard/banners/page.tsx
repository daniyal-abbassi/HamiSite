import BannerActions from '@/components/dashboard/banner/BannerActions';
import { bannerData } from '@/data/banner/bannerData';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const BannerPage = () => {
  

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen w-full my-4 rounded-md">
      <div className="max-w-screen-xl w-full mx-auto px-4 py-6">
        <div className='flex items-center justify-between mb-6'>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white ">Manage Banners</h1>
        <div className="flex justify-end">
          <Link href={'/dashboard/banners/add-banner'} className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg">Add Banner</Link>
        </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {bannerData.map((banner) => (
            <div key={banner.link} className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md">
              <div className='relative w-full h-[16rem]'>
              <Image src={banner.images[0]} fill alt={banner.title} className="w-full h-64 object-contain" />
              </div>
              <div className="p-6">
               <div className='flex items-center justify-between gap-2'>
               <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{banner.title}</h2>
               <BannerActions />
               </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{banner.description}</p>
                <a href={`/${banner.link}`} className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">{banner.button}</a>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
};

export default BannerPage;
