
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { Match } from '../types';
import { getRecentMatches } from '../services/dataService';
// import { getFunFactAboutCricket } from '../services/geminiService'; // Removed Gemini import
import { LightBulbIcon } from '@heroicons/react/24/outline'; 

const HomePage: React.FC = () => {
  const [loadingRecentMatches, setLoadingRecentMatches] = useState(true);
  // const [loadingFunFact, setLoadingFunFact] = useState(true); // State for fun fact loading removed
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  // const [funFact, setFunFact] = useState<string | null>(null); // State for fun fact removed
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHomepageData = async () => {
      setLoadingRecentMatches(true);
      // setLoadingFunFact(true); // Fun fact loading removed
      try {
        const matches = await getRecentMatches(3); 
        setRecentMatches(matches);
      } catch (error) {
        console.error("Failed to fetch recent matches:", error);
        setRecentMatches([]); 
      } finally {
        setLoadingRecentMatches(false);
      }

      // Fun fact logic removed, will use static placeholder
      // setLoadingFunFact(false); 
    };
    fetchHomepageData();
  }, []);

  const staticFunFact = "Did you know? The longest recorded cricket match was 9 days long, played between England and South Africa in Durban in 1939!";

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-50 mb-6">Home</h1>

      <section className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-100">My Recent Matches</h2>
            <Button variant="secondary" size="sm" onClick={() => navigate('/matches')}>View All</Button>
        </div>
        {loadingRecentMatches ? (
          <div className="flex justify-center items-center py-10"><LoadingSpinner size="md" /></div>
        ) : recentMatches.length > 0 ? (
          <div className="space-y-4">
            {recentMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No recent match activity found.</p>
        )}
      </section>

      <section className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <div className="flex items-center mb-3">
          <LightBulbIcon className="w-7 h-7 text-yellow-400 mr-3 flex-shrink-0" />
          <h2 className="text-2xl font-bold text-gray-100">Cricket Wisdom</h2>
        </div>
        <p className="text-gray-300 italic">"{staticFunFact}"</p>
      </section>

       <section className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 text-center">
            <h2 className="text-2xl font-bold text-gray-100 mb-3">Community Feed</h2>
            <p className="text-gray-300 mb-4">
              See what others are up to! Player achievements, match highlights, and more.
            </p>
            <div className="h-40 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600">
              <p className="text-gray-500 italic">Community Feed Coming Soon!</p>
            </div>
          </section>
    </div>
  );
};

export default HomePage;
