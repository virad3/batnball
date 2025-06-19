
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate for v7
import MatchCard from '../components/MatchCard';
import TournamentCard from '../components/TournamentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(false); // Set to false as data fetching is removed
  const navigate = useNavigate(); // v7 hook

  // useEffect(() => {
  //   const fetchData = async () => {
  //     setLoading(true);
  //     try {
  //       // Data fetching for matches and tournaments removed
  //     } catch (error) {
  //       console.error("Failed to fetch homepage data:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchData();
  // }, []); // Empty dependency array means this runs once on mount

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

      {loading ? (
        <div className="flex justify-center items-center py-10"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          {/* Upcoming Matches section removed */}
          {/* Ongoing Tournaments section removed */}
           <section className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Quick Links</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="secondary" onClick={() => navigate('/matches')}>View All Matches</Button>
              <Button variant="secondary" onClick={() => navigate('/tournaments')}>View All Tournaments</Button>
              <Button variant="secondary" onClick={() => navigate('/teams')}>Manage My Teams</Button>
              <Button variant="secondary" onClick={() => navigate('/stats')}>View Statistics</Button>
              <Button variant="secondary" onClick={() => navigate('/profile')}>My Profile</Button>
               <Button variant="secondary" onClick={() => navigate('/looking')}>Discover</Button>
            </div>
          </section>

          <section className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 text-center">
            <h2 className="text-2xl font-bold text-gray-100 mb-3">Get Involved!</h2>
            <p className="text-gray-300 mb-4">
              Join the community, participate in local cricket events, or organize your own!
            </p>
            <img src="https://picsum.photos/seed/cricket-action/600/300" alt="Cricket action" className="rounded-lg shadow-md mx-auto border border-gray-700"/>
          </section>
        </>
      )}
    </div>
  );
};

export default HomePage;
