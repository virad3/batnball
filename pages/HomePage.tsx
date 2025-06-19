
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate for v7
import { Match, Tournament } from '../types';
import { getUpcomingMatches, getOngoingTournaments } from '../services/dataService'; 
import MatchCard from '../components/MatchCard';
import TournamentCard from '../components/TournamentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';

const HomePage: React.FC = () => {
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [ongoingTournaments, setOngoingTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // v7 hook

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
      <section className="text-center p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <p className="text-lg text-gray-300 mb-6">Track scores, manage tournaments, and follow your favorite local cricket action.</p>
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Button variant="primary" size="lg" onClick={() => navigate('/matches/newmatch/score')}> 
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
          <section>
            <h2 className="text-2xl font-bold text-gray-100 mb-4">My Upcoming Matches</h2>
            {upcomingMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {upcomingMatches.map(match => <MatchCard key={match.id} match={match} />)}
              </div>
            ) : (
              <p className="text-gray-400">No upcoming matches scheduled.</p>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-100 mb-4">My Ongoing Tournaments</h2>
            {ongoingTournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {ongoingTournaments.map(tournament => <TournamentCard key={tournament.id} tournament={tournament} />)}
              </div>
            ) : (
              <p className="text-gray-400">No ongoing tournaments at the moment.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default HomePage;
