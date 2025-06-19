
import React, { useState, useEffect, useMemo } from 'react';
import { Match } from '../types';
import { getAllMatches } from '../services/dataService'; 
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // To get current user for "My" filter

const MatchesPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState<'my' | 'played' | 'network' | 'nearby'>('my');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) { // Don't fetch if user isn't loaded, relevant for "my" and "played"
        setLoading(false);
        setMatches([]);
        return;
      }
      setLoading(true);
      try {
        // getAllMatches typically fetches for the logged-in user by default from dataService.
        const allUserMatches = await getAllMatches(); 
        setMatches(allUserMatches);
      } catch (error) {
        console.error("Failed to fetch matches:", error);
        setMatches([]); // Clear matches on error
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [user]);

  const handleStartNewMatch = () => {
    navigate('/matches/newmatch/score'); 
  };

  const filteredMatches = useMemo(() => {
    if (!user) return [];
    switch (activeFilterTab) {
      case 'my':
        return matches; // Assuming getAllMatches already filters by user_id
      case 'played':
        return matches.filter(match => match.status === "Completed");
      case 'network':
        return []; // Placeholder
      case 'nearby':
        return []; // Placeholder
      default:
        return matches;
    }
  }, [matches, activeFilterTab, user]);

  const TabButton: React.FC<{
    label: string;
    filterKey: 'my' | 'played' | 'network' | 'nearby';
  }> = ({ label, filterKey }) => {
    const isActive = activeFilterTab === filterKey;
    return (
      <button
        onClick={() => setActiveFilterTab(filterKey)}
        className={`px-4 py-3 sm:px-6 text-sm font-medium focus:outline-none transition-colors duration-150
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
      {/* "Want to start a match?" Banner */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center border border-gray-700">
        <p className="text-gray-100 text-sm sm:text-base">Want to start a match?</p>
        <Button 
          variant="primary" // This will be the red-ish button
          className="bg-teal-600 hover:bg-teal-500 text-white font-semibold" // Override for teal/green
          onClick={handleStartNewMatch}
          size="sm"
        >
          START A MATCH
        </Button>
      </div>
      
      {/* Tabbed Filters */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-1 sm:space-x-2" aria-label="Match Filters">
          <TabButton label="My" filterKey="my" />
          <TabButton label="Played" filterKey="played" />
          <TabButton label="Network" filterKey="network" />
          <TabButton label="Nearby" filterKey="nearby" />
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10"><LoadingSpinner size="lg" /></div>
      ) : filteredMatches.length > 0 ? (
        <div className="space-y-4">
          {filteredMatches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-8">
            {activeFilterTab === 'network' || activeFilterTab === 'nearby' 
              ? `No ${activeFilterTab} matches found (Feature coming soon).`
              : `No ${activeFilterTab === 'my' ? 'matches' : activeFilterTab} matches found.`
            }
        </p>
      )}
    </div>
  );
};

export default MatchesPage;
