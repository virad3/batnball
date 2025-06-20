
import React, { useState, useEffect, useMemo } from 'react';
import { Match } from '../types';
import { getAllMatches } from '../services/dataService'; 
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; 

const MatchesPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState<'my' | 'played' | 'network' | 'nearby'>('my');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) { 
        setLoading(false);
        setMatches([]);
        return;
      }
      setLoading(true);
      try {
        const allUserMatches = await getAllMatches(); 
        setMatches(allUserMatches);
      } catch (error) {
        console.error("Failed to fetch matches:", error);
        setMatches([]); 
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [user]);

  const handleStartNewMatchFlow = () => {
    navigate('/start-match/select-teams'); 
  };

  const filteredMatches = useMemo(() => {
    if (!user) return [];
    switch (activeFilterTab) {
      case 'my':
        return matches; 
      case 'played':
        return matches.filter(match => match.status === "Completed");
      case 'network':
        return []; 
      case 'nearby':
        return []; 
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
      <div className="bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center border border-gray-700">
        <p className="text-gray-100 text-sm sm:text-base">Want to start a match?</p>
        <Button 
          variant="primary" 
          className="bg-teal-600 hover:bg-teal-500 text-white font-semibold" 
          onClick={handleStartNewMatchFlow}
          size="sm"
        >
          START A MATCH
        </Button>
      </div>
      
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
