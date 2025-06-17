import React from 'react';
import { Link } from 'react-router-dom';
import { Tournament } from '../types';
import Button from './Button';

interface TournamentCardProps {
  tournament: Tournament;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {
  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-700">
      <div className="h-32 sm:h-40 overflow-hidden">
        <img 
            src={tournament.logoUrl || `https://picsum.photos/seed/${tournament.id}/400/200`} 
            alt={tournament.name} 
            className="w-full h-full object-cover" 
        />
      </div>
      <div className="p-5 text-gray-200">
        <h3 className="text-xl font-bold text-gray-100 mb-2 truncate">{tournament.name}</h3>
        <p className="text-sm text-gray-300 mb-1">Format: {tournament.format}</p>
        <p className="text-sm text-gray-300 mb-1">
          Dates: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
        </p>
        <p className="text-sm text-gray-300 mb-4">Teams: {tournament.teamNames?.length || 0}</p>
        <div className="flex justify-end">
          <Link to={`/tournaments/${tournament.id}`}>
            <Button variant="primary" size="sm"> 
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TournamentCard;