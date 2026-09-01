import ContactForm from '@/components/forms/ContactForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React from 'react';

const ContactPageTwo = () => {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-slate-100 dark:bg-slate-900">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Form */}
          <ContactForm />
        {/* Contact Information */}
        <div className=" lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-8 md:px-10">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-6">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Address</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">123 Main Street, City, Country</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Phone</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">+123 456 7890</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Email</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">info@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPageTwo;
