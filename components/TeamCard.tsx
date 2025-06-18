import React from 'react';
import { Team } from '../types';
import Button from './Button';
import { UsersIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';

interface TeamCardProps {
  team: Team;
  onDelete: (teamId: string) => void;
  onViewPlayers: (teamId: string) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, onDelete, onViewPlayers }) => {
  const defaultLogo = `https://picsum.photos/seed/${team.id}/200/150`; // Placeholder logo

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-700 flex flex-col">
      <div className="h-32 sm:h-36 overflow-hidden bg-gray-700 flex items-center justify-center">
        {team.logoUrl ? (
          <img 
            src={team.logoUrl} 
            alt={`${team.name} logo`} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <UsersIcon className="w-16 h-16 text-gray-500" /> // Placeholder icon
        )}
      </div>
      <div className="p-5 text-gray-200 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-100 mb-1 truncate" title={team.name}>{team.name}</h3>
          <p className="text-sm text-gray-400 mb-3">
            {team.players.length} Player{team.players.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewPlayers(team.id)}
            leftIcon={<EyeIcon className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            View Players
          </Button>
          <Button 
            variant="danger" 
            size="sm" 
            onClick={() => onDelete(team.id)}
            leftIcon={<TrashIcon className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeamCard;