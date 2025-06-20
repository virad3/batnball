
import React from 'react';
import { ChevronLeftIcon, XMarkIcon, QrCodeIcon } from '@heroicons/react/24/outline';

interface SearchOverlayProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClose: () => void;
}

const searchCategories = [
  "Players", "Teams", "Tournaments", "Matches", "Grounds", 
  "Scorers", "Umpires", "Commentators", "Organisers", "Academies"
];

const SearchOverlay: React.FC<SearchOverlayProps> = ({ searchQuery, setSearchQuery, onClose }) => {
  const handleSuggestionClick = (category: string) => {
    // For now, just log. Could append to query or trigger specific search.
    console.log(`Search suggestion clicked: ${searchQuery} in: ${category}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100 text-gray-800" role="dialog" aria-modal="true" aria-label="Search anel">
      {/* Search Header */}
      <div className="flex items-center h-[57px] sm:h-[61px] px-3 py-2 bg-white border-b border-gray-300 shadow-sm">
        <button
          onClick={onClose}
          aria-label="Close search"
          className="p-2 text-gray-600 hover:text-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <div className="flex-grow mx-2 relative">
          <input
            type="search"
            placeholder="Search Bat 'n' Ball"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 px-3 pr-10 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-500 text-base"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 rounded-full"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        <button
          aria-label="Scan QR code"
          className="p-2 text-gray-600 hover:text-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <QrCodeIcon className="w-6 h-6" />
        </button>
      </div>

      {/* "Pro Privileges" Chip */}
      <div className="px-4 pt-3 pb-2">
        <span className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-full">
          Pro Privileges
        </span>
      </div>

      {/* Search Suggestions List */}
      <div className="flex-grow overflow-y-auto">
        {searchCategories.map((category) => (
          <button
            key={category}
            onClick={() => handleSuggestionClick(category)}
            className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-200 transition-colors duration-150 focus:outline-none focus:bg-gray-200"
            role="option"
            aria-selected="false"
          >
            <span className="text-gray-800 text-base mr-2">{searchQuery || 'Search'}</span>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-md">
              in: {category}
            </span>
          </button>
        ))}
      </div>
       {/* Placeholder for keyboard area - purely visual representation of potential space */}
       <div className="h-56 bg-gray-300 border-t border-gray-400 flex items-center justify-center text-gray-500 text-sm sm:hidden">
            (Keyboard Area)
       </div>
    </div>
  );
};

export default SearchOverlay;
