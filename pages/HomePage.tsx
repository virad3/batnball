
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { Match } from '../types';
import { getRecentMatches } from '../services/dataService';
import { getFunFactAboutCricket } from '../services/geminiService';
import { LightBulbIcon } from '@heroicons/react/24/outline'; 

const HomePage: React.FC = () => {
  const [loadingRecentMatches, setLoadingRecentMatches] = useState(true);
  const [loadingFunFact, setLoadingFunFact] = useState(true);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [funFact, setFunFact] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHomepageData = async () => {
      setLoadingRecentMatches(true);
      setLoadingFunFact(true);
      try {
        const matches = await getRecentMatches(3); 
        setRecentMatches(matches);
      } catch (error) {
        console.error("Failed to fetch recent matches:", error);
        setRecentMatches([]); 
      } finally {
        setLoadingRecentMatches(false);
      }

      try {
        const fact = await getFunFactAboutCricket();
        setFunFact(fact);
      } catch (error) {
        console.error("Failed to fetch fun fact:", error);
        setFunFact("Could not load a fun fact at the moment. But did you know cricket is awesome?");
      } finally {
        setLoadingFunFact(false);
      }
    };
    fetchHomepageData();
  }, []);

  return (
    <div className="space-y-8">
      <section className="text-center p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <h1 className="text-4xl font-graduate text-gray-50 mb-4">Welcome to Bat 'n' Ball!</h1>
        <p className="text-lg text-gray-300 mb-6">Track scores, manage tournaments, and follow your favorite local cricket action.</p>
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Button variant="primary" size="lg" onClick={() => navigate('/start-match/select-teams')}> 
            Start Scoring
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/tournaments/new')}> 
            Create Tournament
          </Button>
        </div>
      </section>

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
          <h2 className="text-2xl font-bold text-gray-100">Community Buzz</h2>
        </div>
        {loadingFunFact ? (
          <div className="flex justify-center items-center py-6"><LoadingSpinner size="sm" /></div>
        ) : funFact ? (
          <p className="text-gray-300 italic">"{funFact}"</p>
        ) : (
          <p className="text-gray-400">Loading cricket wisdom...</p>
        )}
      </section>

       <section className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 text-center">
            <h2 className="text-2xl font-bold text-gray-100 mb-3">Community Feed</h2>
            <p className="text-gray-300 mb-4">
              See what others are up to! Player achievements, match highlights, and more coming soon.
            </p>
            <div className="h-40 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600">
              <p className="text-gray-500 italic">Feed Content Placeholder</p>
            </div>
          </section>
    </div>
  );
};

export default HomePage;
