
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, XMarkIcon, QrCodeIcon, UserIcon, UserGroupIcon, CalendarDaysIcon, TrophyIcon, DocumentTextIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { searchPlayersByName, searchMatchesByTerm, searchTournamentsByName } from '../services/dataService';
import { SearchResultItem, UserProfile, Match, Tournament } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { Timestamp } from '../services/firebaseClient'; // Use re-exported Timestamp

interface SearchOverlayProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClose: () => void;
}

const debounce = <F extends (...args: any[]) => any>(func: F, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const getIconForResultType = (type: string): JSX.Element => {
  const iconClass = "w-6 h-6 text-gray-500";
  switch (type.toLowerCase()) {
    case 'player':
      return <UserIcon className={iconClass} />;
    case 'team':
      return <UserGroupIcon className={iconClass} />;
    case 'match':
      return <CalendarDaysIcon className={iconClass} />;
    case 'tournament':
      return <TrophyIcon className={iconClass} />;
    default:
      return <DocumentTextIcon className={iconClass} />;
  }
};

const SearchOverlay: React.FC<SearchOverlayProps> = ({ searchQuery, setSearchQuery, onClose }) => {
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim() === '') {
        setSearchResults([]);
        setIsSearching(false);
        setApiError(null);
        return;
      }
      setIsSearching(true);
      setApiError(null);
      try {
        const [playerResultsRaw, matchResultsRaw, tournamentResultsRaw] = await Promise.all([
          searchPlayersByName(query, 5),
          searchMatchesByTerm(query, 5),
          searchTournamentsByName(query, 5)
        ]);

        const combinedResults: SearchResultItem[] = [];

        playerResultsRaw.forEach(player => {
          combinedResults.push({
            title: player.username,
            description: player.profileType || `View ${player.username}'s profile`,
            type: "Player",
            // id: player.id // Can be used for navigation
          });
        });

        matchResultsRaw.forEach(match => {
          const dateStr = match.date instanceof Timestamp 
            ? match.date.toDate().toLocaleDateString() 
            : (typeof match.date === 'string' ? new Date(match.date).toLocaleDateString() : 'N/A');
          combinedResults.push({
            title: `${match.teamAName} vs ${match.teamBName}`,
            description: `${match.venue} on ${dateStr}`,
            type: "Match",
            // id: match.id
          });
        });

        tournamentResultsRaw.forEach(tournament => {
          const startDateStr = tournament.startDate instanceof Timestamp 
            ? tournament.startDate.toDate().toLocaleDateString() 
            : (typeof tournament.startDate === 'string' ? new Date(tournament.startDate).toLocaleDateString() : 'N/A');
          combinedResults.push({
            title: tournament.name,
            description: `Format: ${tournament.format}, Starts: ${startDateStr}`,
            type: "Tournament",
            // id: tournament.id
          });
        });
        
        // Simple sort: Players, then Teams, Matches, Tournaments, then Other
        combinedResults.sort((a, b) => {
            const typeOrder = { "Player": 1, "Team": 2, "Match": 3, "Tournament": 4, "Other": 5 };
            const orderA = typeOrder[a.type as keyof typeof typeOrder] || 6;
            const orderB = typeOrder[b.type as keyof typeof typeOrder] || 6;
            if (orderA !== orderB) return orderA - orderB;
            return a.title.localeCompare(b.title); // Alphabetical within type
        });


        setSearchResults(combinedResults.slice(0, 15)); // Limit total results displayed

      } catch (e) {
        console.error("Internal search failed:", e);
        setApiError("Failed to fetch search results. Please try again.");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);
  
  const handleResultItemClick = (result: SearchResultItem) => {
    console.log("Search result clicked (internal search):", result);
    // TODO: Implement navigation based on result.type and result.id
    // Example: if (result.type === 'Player' && result.id) navigate(`/profile/${result.id}`);
    onClose(); // Close search overlay after clicking a result
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100 text-gray-800" role="dialog" aria-modal="true" aria-label="Search panel">
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
            placeholder="Search players, teams, matches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 px-3 pr-10 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-500 text-base"
            autoFocus
            aria-label="Search Bat 'n' Ball"
            aria-controls="search-results-list"
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

      {/* Search Results Area */}
      <div id="search-results-list" className="flex-grow overflow-y-auto">
        {isSearching && (
          <div className="flex justify-center items-center h-full p-4">
            <LoadingSpinner size="md" />
            <p className="ml-3 text-gray-600">Searching...</p>
          </div>
        )}
        {!isSearching && apiError && (
          <p className="p-4 text-center text-red-600 bg-red-50 rounded-md m-4 border border-red-200">{apiError}</p>
        )}
        {!isSearching && !apiError && searchResults.length > 0 && (
          <ul className="divide-y divide-gray-200">
            {searchResults.map((result, index) => (
              <li key={index}>
                <button
                  onClick={() => handleResultItemClick(result)}
                  className="w-full text-left p-4 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 transition-colors"
                  role="option"
                  aria-selected="false" // This would be dynamic if keyboard navigation was implemented
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 pt-0.5">
                      {getIconForResultType(result.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate" title={result.title}>{result.title}</p>
                      <p className="text-sm text-gray-600 line-clamp-2" title={result.description}>{result.description}</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 self-center flex-shrink-0" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {!isSearching && !apiError && searchQuery.trim() !== '' && searchResults.length === 0 && (
          <p className="p-6 text-center text-gray-500">No results found for "{searchQuery}".</p>
        )}
        {!isSearching && !apiError && searchQuery.trim() === '' && (
          <p className="p-6 text-center text-gray-500">Type to search across Bat 'n' Ball...</p>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
