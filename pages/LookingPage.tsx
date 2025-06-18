
import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'; // Example icon

const LookingPage: React.FC = () => {
  return (
    <div className="space-y-6 text-center py-10">
      <MagnifyingGlassIcon className="w-24 h-24 mx-auto text-red-700 opacity-50" />
      <h1 className="text-4xl font-bold text-gray-50 tracking-tight">Discover</h1>
      <p className="text-xl text-gray-300">
        Looking for something specific?
      </p>
      <div className="mt-8 bg-gray-800 shadow-lg rounded-lg p-8 max-w-2xl mx-auto border border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-100 mb-4">Coming Soon!</h2>
        <p className="text-gray-400">
          This section will soon allow you to discover and explore local matches, find players, or join tournaments happening near you.
          Stay tuned for exciting updates!
        </p>
      </div>
    </div>
  );
};

export default LookingPage;
