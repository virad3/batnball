
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Match, Tournament } from '../types';
import { getUpcomingMatches, getOngoingTournaments } from '../services/dataService';
import MatchCard from '../components/MatchCard';
import TournamentCard from '../components/TournamentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { APP_NAME } from '../constants';

const HomePage: React.FC = () => {
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [ongoingTournaments, setOngoingTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

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
      <section className="text-center p-6 bg-white rounded-xl shadow-lg">
        <h1 className="text-4xl font-bold text-[#004d40] mb-2">Welcome to {APP_NAME}!</h1>
        <p className="text-lg text-gray-700 mb-6">Where Local Legends Rise. Track scores, manage tournaments, and follow your favorite local cricket action.</p>
        <div className="flex justify-center space-x-4">
          <Button variant="primary" size="lg" onClick={() => window.location.hash = '/matches'}>
            View Matches
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.location.hash = '/tournaments/new'}>
            Create Tournament
          </Button>
        </div>
      </section>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <section>
            <h2 className="text-2xl font-bold text-[#004d40] mb-4">Upcoming Matches</h2>
            {upcomingMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingMatches.map(match => <MatchCard key={match.id} match={match} />)}
              </div>
            ) : (
              <p className="text-gray-600">No upcoming matches scheduled.</p>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#004d40] mb-4">Ongoing Tournaments</h2>
            {ongoingTournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ongoingTournaments.map(tournament => <TournamentCard key={tournament.id} tournament={tournament} />)}
              </div>
            ) : (
              <p className="text-gray-600">No ongoing tournaments at the moment.</p>
            )}
          </section>
        </>
      )}
       <section className="mt-8 p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-[#004d40] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link to="/matches/new/score" className="block p-4 bg-[#004d40] text-white rounded-lg text-center hover:bg-[#00382e] transition-colors">
                <span className="text-lg font-semibold">Start Scoring</span>
                <p className="text-xs">New Match</p>
            </Link>
             <Link to="/stats" className="block p-4 bg-[#d32f2f] text-white rounded-lg text-center hover:bg-[#b71c1c] transition-colors">
                <span className="text-lg font-semibold">View Stats</span>
                <p className="text-xs">Player & Team Performance</p>
            </Link>
             <Link to="/profile" className="block p-4 bg-gray-200 text-[#004d40] rounded-lg text-center hover:bg-gray-300 transition-colors">
                <span className="text-lg font-semibold">My Profile</span>
                <p className="text-xs">Achievements & Settings</p>
            </Link>
             <Link to="/tournaments" className="block p-4 bg-yellow-500 text-white rounded-lg text-center hover:bg-yellow-600 transition-colors">
                <span className="text-lg font-semibold">All Tournaments</span>
                <p className="text-xs">Explore Competitions</p>
            </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
