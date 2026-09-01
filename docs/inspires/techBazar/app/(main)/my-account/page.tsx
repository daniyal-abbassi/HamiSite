
import Link from 'next/link';
import React from 'react';

const MyAccountPage = () => {
  return (
    <div className="px-4 py-8 lg:px-16 lg:py-12 bg-gray-100 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-8">
          My Account
        </h1>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <p className="text-gray-800 dark:text-white">John Doe</p>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
              <p className="text-gray-800 dark:text-white">john@example.com</p>
            </div>
          </div>
        </div>
        <div className="mt-8 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
          <div className='flex items-center justify-between'>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Address</h2>
          <Link href={'/my-account/edit'} className='p-2 rounded-md border'>Edit Address</Link>
          </div>
          
          <div>
            <p className="text-gray-800 dark:text-white">123 Main Street</p>
            <p className="text-gray-800 dark:text-white">City, State, ZIP</p>
            <p className="text-gray-800 dark:text-white">Country</p>
          </div>
        </div>
        <div className="mt-8 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Order History</h2>
          <div>
            {/* Display order history */}
            {/* You can map over user's orders and display them here */}
            <div className="border-t border-gray-200 dark:border-gray-700 py-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-800 dark:text-white">Order #12345</p>
                <p className="text-gray-800 dark:text-white">$XX.XX</p>
              </div>
              <p className="text-gray-500 dark:text-gray-400">Date: MM/DD/YYYY</p>
              <p className="text-gray-500 dark:text-gray-400">Status: Shipped</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAccountPage;
