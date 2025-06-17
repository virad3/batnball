
import React, { useState, useEffect } from 'react';
import { Match } from '../types';
import { getAllMatches } from '../services/dataService';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { Link } from 'react-router-dom';

const MatchesPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const allMatches = await getAllMatches();
        setMatches(allMatches);
      } catch (error) {
        console.error("Failed to fetch matches:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    return match.status.toLowerCase() === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-50 mb-4 sm:mb-0">Matches</h1>
        <Link to="/matches/newmatch/score"> 
            <Button variant="primary">Start New Match</Button>
        </Link>
      </div>
      
      <div className="flex space-x-2 mb-6 pb-2 border-b border-gray-700">
        {(['all', 'live', 'upcoming', 'completed'] as const).map(f => (
          <Button 
            key={f}
            variant={filter === f ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-8">No matches found for the selected filter.</p>
      )}
    </div>
  );
};

export default MatchesPage;