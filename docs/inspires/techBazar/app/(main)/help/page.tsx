import ContactForm from '@/components/forms/ContactForm';
import React from 'react';

const HelpPage = () => {
  return (
    <div className="px-4 py-8 lg:px-16 lg:py-12 bg-gray-100 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-8">
          Help Center
        </h1>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {/* FAQ Item */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">How can I track my order?</h3>
              <p className="text-gray-700 dark:text-gray-300">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla at tincidunt justo. Duis in leo justo. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Sed vitae metus augue.</p>
            </div>
            {/* Repeat above structure for more FAQ items */}
          </div>
        </div>
        <ContactForm />
      </div>
    </div>
  );
};

export default HelpPage;
