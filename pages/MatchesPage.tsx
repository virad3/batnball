

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Match } from '../types';
import { getAllMatches, getUpcomingMatches } from '../services/dataService'; 
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; 

type MatchFilterTabs = 'my' | 'upcoming' | 'played' | 'network' | 'nearby';

const MatchesPage: React.FC = () => {
  const [allMyMatches, setAllMyMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState<MatchFilterTabs>('my');
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchMatchesData = useCallback(async () => {
    if (!user) { 
      setLoading(false);
      setAllMyMatches([]);
      setUpcomingMatches([]);
      return;
    }
    setLoading(true);
    try {
      // Fetch all matches for 'My' and 'Played' tabs
      const allUserMatches = await getAllMatches(); 
      setAllMyMatches(allUserMatches);

      // Fetch upcoming matches specifically for the 'Upcoming' tab or pre-fetch for 'My'
      const upcomingMatchesLimit = 25; // Increased limit
      // Always fetch upcoming matches to keep the 'Upcoming' tab populated correctly
      // if it's the active tab or if its data is stale/empty.
      // This also helps if we switch to it.
      const futureMatches = await getUpcomingMatches(upcomingMatchesLimit);
      setUpcomingMatches(futureMatches);
      
    } catch (error) {
      console.error("Failed to fetch matches:", error);
      setAllMyMatches([]); 
      setUpcomingMatches([]);
    } finally {
      setLoading(false);
    }
  }, [user]); 


  useEffect(() => {
    fetchMatchesData();
  }, [fetchMatchesData]); 

  const handleStartNewMatchFlow = () => {
    navigate('/start-match/select-teams', { state: { mode: 'schedule' } }); 
  };

  const handleMatchModifiedOrDeleted = () => {
    fetchMatchesData(); 
  };

  const displayedMatches = useMemo(() => {
    if (!user) return [];
    switch (activeFilterTab) {
      case 'my':
        return allMyMatches; 
      case 'upcoming':
        return upcomingMatches;
      case 'played':
        return allMyMatches.filter(match => match.status === "Completed" || match.status === "Abandoned");
      case 'network': // Placeholder
        return []; 
      case 'nearby':  // Placeholder
        return []; 
      default:
        return allMyMatches;
    }
  }, [allMyMatches, upcomingMatches, activeFilterTab, user]);

  const TabButton: React.FC<{
    label: string;
    filterKey: MatchFilterTabs;
  }> = ({ label, filterKey }) => {
    const isActive = activeFilterTab === filterKey;
    return (
      <button
        onClick={() => setActiveFilterTab(filterKey)}
        className={`px-3 py-3 sm:px-4 text-xs sm:text-sm font-medium focus:outline-none transition-colors duration-150 whitespace-nowrap
          ${isActive 
            ? 'bg-gray-100 text-gray-900 rounded-t-lg shadow' 
            : 'text-gray-400 hover:text-gray-200'
          }
        `}
        role="tab"
        aria-selected={isActive}
      >
        {label}
      </button>
    );
  };


  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center border border-gray-700">
        <p className="text-gray-100 text-sm sm:text-base">Want to schedule a match?</p>
        <Button 
          variant="primary" 
          className="bg-teal-600 hover:bg-teal-500 text-white font-semibold" 
          onClick={handleStartNewMatchFlow}
          size="sm"
        >
          SCHEDULE MATCH
        </Button>
      </div>
      
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-1 sm:space-x-2 overflow-x-auto" aria-label="Match Filters">
          <TabButton label="My Matches" filterKey="my" />
          <TabButton label="Upcoming" filterKey="upcoming" />
          <TabButton label="Played" filterKey="played" />
          <TabButton label="Network" filterKey="network" />
          <TabButton label="Nearby" filterKey="nearby" />
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10"><LoadingSpinner size="lg" /></div>
      ) : displayedMatches.length > 0 ? (
        <div className="space-y-4">
          {displayedMatches.map(match => (
            <MatchCard 
              key={match.id} 
              match={match} 
              onMatchModifiedOrDeleted={handleMatchModifiedOrDeleted}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-8">
            {activeFilterTab === 'network' || activeFilterTab === 'nearby' 
              ? `No ${activeFilterTab} matches found (Feature coming soon).`
              : `No ${activeFilterTab} matches found.`
            }
        </p>
      )}
    </div>
  );
};

export default MatchesPage;