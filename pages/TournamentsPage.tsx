
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tournament } from '../types';
import { getAllTournaments } from '../services/dataService';
import TournamentCard from '../components/TournamentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';

const TournamentsPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      try {
        const allTournaments = await getAllTournaments();
        setTournaments(allTournaments);
      } catch (error) {
        console.error("Failed to fetch tournaments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-50 mb-4 sm:mb-0">Tournaments</h1>
        <Link to="/tournaments/new">
          <Button variant="primary">Create New Tournament</Button>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map(tournament => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-8">No tournaments found. Why not <Link to="/tournaments/new" className="text-slate-400 hover:underline">create one</Link>?</p>
      )}
    </div>
  );
};

export default TournamentsPage;