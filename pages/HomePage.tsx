
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Match, Tournament } from '../types';
import { getUpcomingMatches, getOngoingTournaments } from '../services/dataService';
import MatchCard from '../components/MatchCard';
import TournamentCard from '../components/TournamentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
// APP_NAME import removed as the welcome message using it is removed.

const HomePage: React.FC = () => {
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [ongoingTournaments, setOngoingTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const matches = await getUpcomingMatches(3);
        const tournaments = await getOngoingTournaments(2);
        setUpcomingMatches(matches);
        setOngoingTournaments(tournaments);
      } catch (error) {
        console.error("Failed to fetch homepage data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome section removed */}
      <section className="text-center p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <p className="text-lg text-gray-300 mb-6">Track scores, manage tournaments, and follow your favorite local cricket action.</p>
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Button variant="primary" size="lg" onClick={() => navigate('/matches')}>
            View Matches
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/tournaments/new')}>
            Create Tournament
          </Button>
        </div>
      </section>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <section>
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Upcoming Matches</h2>
            {upcomingMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingMatches.map(match => <MatchCard key={match.id} match={match} />)}
              </div>
            ) : (
              <p className="text-gray-400">No upcoming matches scheduled.</p>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Ongoing Tournaments</h2>
            {ongoingTournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ongoingTournaments.map(tournament => <TournamentCard key={tournament.id} tournament={tournament} />)}
              </div>
            ) : (
              <p className="text-gray-400">No ongoing tournaments at the moment.</p>
            )}
          </section>
        </>
      )}
       <section className="mt-8 p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/matches/newmatch/score" className="block p-4 bg-red-800 text-white rounded-lg text-center hover:bg-red-700 transition-colors shadow-md"> {/* Changed from slate to red */}
                <span className="text-lg font-semibold">Start Scoring</span>
                <p className="text-xs opacity-80">New Match</p>
            </Link>
             <Link to="/stats" className="block p-4 bg-red-700 text-white rounded-lg text-center hover:bg-red-600 transition-colors shadow-md">
                <span className="text-lg font-semibold">View Stats</span>
                <p className="text-xs opacity-80">Performance Insights</p>
            </Link>
             <Link to="/profile" className="block p-4 bg-gray-700 text-gray-100 rounded-lg text-center hover:bg-gray-600 transition-colors shadow-md">
                <span className="text-lg font-semibold">My Profile</span>
                <p className="text-xs opacity-80">Achievements & Settings</p>
            </Link>
             <Link to="/tournaments" className="block p-4 bg-yellow-600 text-white rounded-lg text-center hover:bg-yellow-500 transition-colors shadow-md">
                <span className="text-lg font-semibold">All Tournaments</span>
                <p className="text-xs opacity-80">Explore Competitions</p>
            </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;