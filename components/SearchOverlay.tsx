import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, XMarkIcon, QrCodeIcon as QrCodeIconOutline, UserIcon, UserGroupIcon, CalendarDaysIcon, TrophyIcon, DocumentTextIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { MapPinIcon } from '@heroicons/react/24/solid';
import { searchPlayersByName, searchMatchesByTerm, searchTournamentsByName, searchTeamsByName } from '../services/dataService';
import { SearchResultItem, UserProfile, Team, Match, Tournament, MatchFormat, TournamentStatus } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { FirebaseTimestamp, Timestamp } from '../services/firebaseClient';

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

// Helper function to format date for display
const formatDate = (dateInput: string | FirebaseTimestamp | undefined | null): string => {
  if (!dateInput) return 'N/A';
  let d: Date;
  if (dateInput instanceof Timestamp) {
    d = dateInput.toDate();
  } else if (typeof dateInput === 'string') {
    d = new Date(dateInput);
    if (isNaN(d.getTime())) { // Check if the date string was valid
        // Try to parse if it's already in a simple "YYYY-MM-DD" or similar format without time
        const parts = dateInput.split(/[-/]/);
        if (parts.length === 3) {
            // Assuming YYYY-MM-DD or MM-DD-YYYY etc. Adjust if needed.
            // This is a basic attempt, for more robust parsing use a library or more specific checks.
            d = new Date(parseInt(parts[0]), parseInt(parts[1]) -1, parseInt(parts[2]));
        } else {
            return 'Invalid Date';
        }
    }
  } else {
    return 'Invalid Date Format';
  }
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Helper to determine tournament status
const getDynamicTournamentStatus = (
  startDateInput: string | FirebaseTimestamp,
  endDateInput: string | FirebaseTimestamp
): TournamentStatus => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (startDateInput instanceof Timestamp) {
    startDate = startDateInput.toDate();
  } else {
    startDate = new Date(startDateInput as string);
  }

  if (endDateInput instanceof Timestamp) {
    endDate = endDateInput.toDate();
  } else {
    endDate = new Date(endDateInput as string);
  }

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return "Past"; 
  }

  if (now < startDate) return "Upcoming";
  if (now > endDate) return "Past";
  return "Ongoing";
};

const statusBadgeStyles: Record<TournamentStatus, string> = {
  Upcoming: "bg-blue-500 text-white",
  Ongoing: "bg-red-500 text-white",
  Past: "bg-gray-600 text-white",
};


// Simple card components for search results
const PlayerResultCard: React.FC<{ player: UserProfile; onClick: () => void }> = ({ player, onClick }) => (
  <button onClick={onClick} className="w-full text-left p-3 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 transition-colors block border-b border-gray-200">
    <div className="flex items-center space-x-3">
      <img src={player.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.username)}&background=random&color=fff`} alt={player.username} className="w-12 h-12 rounded-full object-cover" />
      <div>
        <p className="text-sm font-semibold text-gray-900 truncate">{player.username}</p>
        <p className="text-xs text-gray-600 truncate">{player.player_role || player.profileType || 'Player'}{player.location ? `, ${player.location}` : ''}</p>
      </div>
    </div>
  </button>
);

const TeamResultCard: React.FC<{ team: Team; onClick: () => void }> = ({ team, onClick }) => (
  <button onClick={onClick} className="w-full text-left p-3 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 transition-colors block border-b border-gray-200">
    <div className="flex items-center space-x-3">
      {team.logoUrl ? <img src={team.logoUrl} alt={team.name} className="w-12 h-12 rounded-lg object-cover" /> : <UserGroupIcon className="w-12 h-12 text-gray-400 p-2 bg-gray-200 rounded-lg"/>}
      <div>
        <p className="text-sm font-semibold text-gray-900 truncate flex items-center">{team.name} <CheckBadgeIcon className="w-4 h-4 text-blue-500 ml-1 flex-shrink-0"/></p>
        <p className="text-xs text-gray-600 truncate">Contains {team.players.length} players</p>
      </div>
    </div>
  </button>
);

const TournamentResultCard: React.FC<{ tournament: Tournament; onClick: () => void }> = ({ tournament, onClick }) => {
  const status = getDynamicTournamentStatus(tournament.startDate, tournament.endDate);
  return (
    <button onClick={onClick} className="w-full text-left p-3 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 transition-colors block border-b border-gray-200">
      <div className="flex items-start space-x-3">
          {tournament.logoUrl ? <img src={tournament.logoUrl} alt={tournament.name} className="w-16 h-12 rounded-md object-cover flex-shrink-0" /> : <TrophyIcon className="w-12 h-12 text-gray-400 p-2 bg-gray-200 rounded-lg flex-shrink-0"/>}
          <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{tournament.name}</p>
              <p className="text-xs text-gray-600 truncate">
                  {tournament.location || 'Location N/A'} | {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
              </p>
               <span className={`mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${statusBadgeStyles[status]}`}>
                  {status.toUpperCase()}
              </span>
          </div>
      </div>
    </button>
  );
};


const MatchResultCard: React.FC<{ match: Match; onClick: () => void }> = ({ match, onClick }) => (
    <button onClick={onClick} className="w-full text-left p-3 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 transition-colors block border-b border-gray-200">
        <div className="space-y-1">
            <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 truncate">{match.tournament_id ? 'Tournament Match' : `${match.format} Match`}</p>
                 <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${match.status === "Completed" ? "bg-green-600 text-white" : (match.status === "Live" ? "bg-red-600 text-white animate-pulse" : "bg-yellow-600 text-white")}`}>
                    {match.status.toUpperCase()}
                </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{match.teamAName} vs {match.teamBName}</p>
            <p className="text-xs text-gray-600 truncate">{match.venue} | {formatDate(match.date)} {match.overs_per_innings ? `| ${match.overs_per_innings} Overs` : (match.format === MatchFormat.TEST ? "| Test" : "")}</p>
            {match.result_summary && <p className="text-xs text-teal-600 font-medium mt-0.5 truncate">{match.result_summary}</p>}
        </div>
    </button>
);


const SearchOverlay: React.FC<SearchOverlayProps> = ({ searchQuery, setSearchQuery, onClose }) => {
  const [allFetchedResults, setAllFetchedResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'players' | 'teams' | 'tournaments' | 'matches'>('all');
  const navigate = useNavigate();

  const categories = [
    { key: 'players', name: 'Players', icon: UserIcon },
    { key: 'teams', name: 'Teams', icon: UserGroupIcon },
    { key: 'tournaments', name: 'Tournaments', icon: TrophyIcon },
    { key: 'matches', name: 'Matches', icon: CalendarDaysIcon },
  ] as const;


  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim() === '') {
        setAllFetchedResults([]);
        setIsSearching(false);
        setApiError(null);
        return;
      }
      setIsSearching(true);
      setApiError(null);
      try {
        const [playerResultsRaw, teamResultsRaw, tournamentResultsRaw, matchResultsRaw] = await Promise.all([
          searchPlayersByName(query, 5),
          searchTeamsByName(query, 5),
          searchTournamentsByName(query, 5),
          searchMatchesByTerm(query, 5),
        ]);

        const combinedResults: SearchResultItem[] = [];
        playerResultsRaw.forEach(player => combinedResults.push({ id: player.id, title: player.username, description: player.profileType || 'Profile', type: "Player", rawData: player }));
        teamResultsRaw.forEach(team => combinedResults.push({ id: team.id, title: team.name, description: `Team`, type: "Team", rawData: team }));
        tournamentResultsRaw.forEach(tournament => combinedResults.push({ id: tournament.id, title: tournament.name, description: 'Tournament', type: "Tournament", rawData: tournament }));
        matchResultsRaw.forEach(match => combinedResults.push({ id: match.id, title: `${match.teamAName} vs ${match.teamBName}`, description: 'Match', type: "Match", rawData: match }));
        
        setAllFetchedResults(combinedResults);
      } catch (e) {
        console.error("Internal search failed:", e);
        setApiError("Failed to fetch search results. Please try again.");
        setAllFetchedResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const displayedResults = useMemo(() => {
    if (activeCategoryFilter === 'all') return allFetchedResults;
    return allFetchedResults.filter(result => result.type.toLowerCase() === activeCategoryFilter);
  }, [allFetchedResults, activeCategoryFilter]);

  const handleResultItemClick = (result: SearchResultItem) => {
    if (!result.id) {
      onClose(); return;
    }
    let path = '';
    switch (result.type) {
      case 'Player': path = `/profile/${result.id}`; break;
      case 'Team': path = `/teams/${result.id}`; break;
      case 'Match': path = `/matches/${result.id}/score`; break;
      case 'Tournament': path = `/tournaments/${result.id}`; break;
      default: onClose(); return;
    }
    navigate(path);
    onClose();
  };
  
  const handleCategoryClick = (categoryKey: typeof categories[number]['key']) => {
    setActiveCategoryFilter(categoryKey);
    // Optional: auto-focus input or setSearchQuery(`in:${categoryKey} `)
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100 text-gray-800" role="dialog" aria-modal="true" aria-label="Search panel">
      <div className="flex items-center h-[57px] sm:h-[61px] px-3 py-2 bg-white border-b border-gray-300 shadow-sm">
        <button onClick={onClose} aria-label="Close search" className="p-2 text-gray-600 hover:text-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <div className="flex-grow mx-2 relative">
          <input
            type="search"
            placeholder="Search Bat 'n' Ball..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 px-3 pr-10 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-gray-500 text-base"
            autoFocus
            aria-label="Search input"
            aria-controls="search-results-list"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} aria-label="Clear search query" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 rounded-full">
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        <button aria-label="Scan QR code" className="p-2 text-gray-600 hover:text-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500">
          <QrCodeIconOutline className="w-6 h-6" />
        </button>
      </div>

      <div id="search-results-list" className="flex-grow overflow-y-auto bg-white">
        {searchQuery.trim() === '' ? (
          <div className="p-4 space-y-4">
            <button className="w-full text-left p-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-semibold">
              Pro Privileges
            </button>
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => handleCategoryClick(cat.key)}
                  className="w-full flex items-center p-3 text-sm text-gray-700 hover:bg-gray-200 rounded-md focus:outline-none focus:bg-gray-200 transition-colors"
                >
                  <cat.icon className="w-5 h-5 text-gray-500 mr-3" />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Quick Filters */}
            <div className="p-3 border-b border-gray-200 space-y-1.5">
                {categories.map(cat => (
                    <button 
                        key={`quick-${cat.key}`}
                        onClick={() => setActiveCategoryFilter(cat.key)}
                        className={`inline-flex items-center px-2.5 py-1 mr-1.5 mb-1.5 rounded-full text-xs font-medium transition-colors border
                            ${activeCategoryFilter === cat.key ? 'bg-red-600 text-white border-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'}`}
                    >
                        <cat.icon className={`w-3.5 h-3.5 mr-1.5 ${activeCategoryFilter === cat.key ? 'text-white' : 'text-gray-500'}`} />
                        Search '{searchQuery}' in: {cat.name}
                    </button>
                ))}
            </div>
            
            {/* Category Tabs */}
            <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
              {([ {key: 'all', name: 'All', icon: DocumentTextIcon}, ...categories]).map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategoryFilter(cat.key as any)}
                  className={`flex-1 py-2.5 px-1 text-center text-xs sm:text-sm font-medium focus:outline-none transition-colors
                    ${activeCategoryFilter === cat.key ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {isSearching && (
              <div className="flex justify-center items-center py-10"><LoadingSpinner size="md" /><p className="ml-3 text-gray-600">Searching...</p></div>
            )}
            {!isSearching && apiError && (
              <p className="p-4 text-center text-red-600 bg-red-50 m-4 border border-red-200 rounded-md">{apiError}</p>
            )}
            {!isSearching && !apiError && displayedResults.length > 0 && (
              <div className="bg-gray-50">
                {displayedResults.map((result) => (
                    result.rawData && (
                        result.type === 'Player' ? <PlayerResultCard key={result.id || result.title} player={result.rawData as UserProfile} onClick={() => handleResultItemClick(result)} /> :
                        result.type === 'Team' ? <TeamResultCard key={result.id || result.title} team={result.rawData as Team} onClick={() => handleResultItemClick(result)} /> :
                        result.type === 'Tournament' ? <TournamentResultCard key={result.id || result.title} tournament={result.rawData as Tournament} onClick={() => handleResultItemClick(result)} /> :
                        result.type === 'Match' ? <MatchResultCard key={result.id || result.title} match={result.rawData as Match} onClick={() => handleResultItemClick(result)} /> :
                        null 
                    )
                ))}
              </div>
            )}
            {!isSearching && !apiError && searchQuery.trim() !== '' && displayedResults.length === 0 && (
              <p className="p-6 text-center text-gray-500">No {activeCategoryFilter !== 'all' ? activeCategoryFilter : ''} results found for "{searchQuery}".</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;