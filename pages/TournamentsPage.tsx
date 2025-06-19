import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tournament } from '../types';
import { getAllTournaments } from '../services/dataService'; 
import TournamentCard from '../components/TournamentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

type TournamentFilterTabs = 'my' | 'participate' | 'network' | 'nearby';

const TournamentsPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState<TournamentFilterTabs>('my');
  const navigate = useNavigate();
  const { user } = useAuth(); // To potentially filter based on user for "My"

  useEffect(() => {
    const fetchTournaments = async () => {
      if (!user && activeFilterTab === 'my') { // Only fetch "my" tournaments if user is logged in
        setLoading(false);
        setTournaments([]);
        return;
      }
      setLoading(true);
      try {
        // For "My" tab, fetch tournaments created by the user.
        // For other tabs, this might fetch from a different endpoint or apply different filters.
        if (activeFilterTab === 'my') {
            const allUserTournaments = await getAllTournaments(); 
            setTournaments(allUserTournaments);
        } else {
            // Placeholder: For "Participate", "Network", "Nearby", we'll show empty or sample data for now.
            setTournaments([]);
        }
        
      } catch (error) {
        console.error("Failed to fetch tournaments:", error);
        setTournaments([]); 
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, [user, activeFilterTab]);

  const handleCreateTournament = () => {
    navigate('/tournaments/new');
  };

  const filteredTournaments = useMemo(() => {
    // This logic can be expanded for other tabs if data is fetched for them
    return tournaments; 
  }, [tournaments]);

  const TabButton: React.FC<{
    label: string;
    filterKey: TournamentFilterTabs;
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
      {/* "Want to host a tournament?" Banner */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center border border-gray-700">
        <p className="text-gray-100 text-sm sm:text-base">Want to host a tournament?</p>
        <Button 
          variant="primary" 
          className="bg-teal-600 hover:bg-teal-500 text-white font-semibold" // Teal/Green style
          onClick={handleCreateTournament}
          size="sm"
        >
          REGISTER
        </Button>
      </div>
      
      {/* Tabbed Filters */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-1 sm:space-x-2" aria-label="Tournament Filters">
          <TabButton label="My" filterKey="my" />
          <TabButton label="Participate" filterKey="participate" />
          <TabButton label="Network" filterKey="network" />
          <TabButton label="Nearby" filterKey="nearby" />
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10"><LoadingSpinner size="lg" /></div>
      ) : filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTournaments.map(tournament => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-8">
            {activeFilterTab === 'my' 
              ? 'No tournaments found. Why not create one?'
              : `No tournaments found for "${activeFilterTab}". This feature is coming soon.`
            }
        </p>
      )}
    </div>
  );
};

export default TournamentsPage;