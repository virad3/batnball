
import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

const HighlightsPage: React.FC = () => {
  return (
    <div className="space-y-6 text-center py-10">
      <SparklesIcon className="w-24 h-24 mx-auto text-yellow-500 opacity-60" />
      <h1 className="text-4xl font-bold text-gray-50 tracking-tight">My Highlights</h1>
      <p className="text-xl text-gray-300">
        Your collection of memorable moments and achievements.
      </p>
      <div className="mt-8 bg-gray-800 shadow-lg rounded-lg p-8 max-w-2xl mx-auto border border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-100 mb-4">Feature Under Construction</h2>
        <p className="text-gray-400">
          This is where you'll be able to curate and showcase your best performances, key wickets, match-winning innings, and tournament victories.
        </p>
        <p className="text-gray-400 mt-2">
            Check back soon to relive your glory!
        </p>
      </div>
    </div>
  );
};

export default HighlightsPage;
