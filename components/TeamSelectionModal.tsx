
import React, { useState, useEffect, useCallback } from 'react';
import { Team } from '../types';
import { getTeamsByUserId } from '../services/dataService'; // To get user's teams
import Button from './Button';
import CreateTeamModal from './CreateTeamModal'; // To create a new team
import LoadingSpinner from './LoadingSpinner';
import { MagnifyingGlassIcon, XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface TeamSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamSelected: (team: Team) => void;
  currentSelectionTarget: 'A' | 'B';
  existingTeamAId?: string | null;
  existingTeamBId?: string | null;
}

const TeamSelectionModal: React.FC<TeamSelectionModalProps> = ({
  isOpen,
  onClose,
  onTeamSelected,
  currentSelectionTarget,
  existingTeamAId,
  existingTeamBId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);

  const fetchUserTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const teams = await getTeamsByUserId();
      setUserTeams(teams);
      setFilteredTeams(teams); // Initially show all user teams
    } catch (err: any) {
      console.error("Failed to fetch user teams:", err);
      setError(err.message || "Could not load your teams.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUserTeams();
    }
  }, [isOpen, fetchUserTeams]);

  useEffect(() => {
    if (!isOpen) {
        setSearchTerm(''); // Reset search term when modal closes
    }
    const teamsToShow = userTeams.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTeams(teamsToShow);
  }, [searchTerm, userTeams, isOpen]);

  const handleSelectTeam = (team: Team) => {
    if (currentSelectionTarget === 'A' && team.id === existingTeamBId) {
        alert("This team is already selected as Team B. Please choose a different team.");
        return;
    }
    if (currentSelectionTarget === 'B' && team.id === existingTeamAId) {
        alert("This team is already selected as Team A. Please choose a different team.");
        return;
    }
    onTeamSelected(team);
    onClose(); 
  };

  const handleTeamCreated = (newTeam: Team) => {
    setIsCreateTeamModalOpen(false); 
    handleSelectTeam(newTeam); 
  };
  
  const inputClass = "w-full p-2.5 pl-10 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-100 placeholder-gray-400"; // Updated focus

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-selection-modal-title"
      >
        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-700 max-h-[80vh] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 id="team-selection-modal-title" className="text-xl font-semibold text-gray-50">
              Select Team {currentSelectionTarget}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close team selection modal"
              className="p-1 text-gray-400 hover:text-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-800" // Updated focus
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={inputClass}
            />
          </div>

          {loading ? (
            <div className="flex-grow flex items-center justify-center"><LoadingSpinner size="md" /></div>
          ) : (
            <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar-modal">
              {filteredTeams.length > 0 ? (
                filteredTeams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => handleSelectTeam(team)}
                    className="w-full text-left p-3 bg-gray-700 hover:bg-teal-700 rounded-md transition-colors text-gray-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" // Updated hover and focus
                    disabled={(currentSelectionTarget === 'A' && team.id === existingTeamBId) || (currentSelectionTarget === 'B' && team.id === existingTeamAId)}
                  >
                    <div className="flex items-center space-x-3">
                        {team.logoUrl ? 
                            <img src={team.logoUrl} alt={team.name} className="w-8 h-8 rounded-full object-cover"/> : 
                            <UserGroupIcon className="w-8 h-8 text-gray-500 p-1 bg-gray-600 rounded-full"/>
                        }
                        <span>{team.name}</span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">
                  {userTeams.length === 0 ? "You haven't created any teams yet." : "No teams match your search."}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-700">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setIsCreateTeamModalOpen(true)}
            >
              Create New Team
            </Button>
          </div>
           <style>{`
            .custom-scrollbar-modal::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar-modal::-webkit-scrollbar-track { background: #374151; border-radius:3px; }
            .custom-scrollbar-modal::-webkit-scrollbar-thumb { background: #4b5563; border-radius:3px; }
            .custom-scrollbar-modal::-webkit-scrollbar-thumb:hover { background: #6b7280; }
            `}</style>
        </div>
      </div>

      {isCreateTeamModalOpen && (
        <CreateTeamModal
          isOpen={isCreateTeamModalOpen}
          onClose={() => setIsCreateTeamModalOpen(false)}
          onTeamCreated={handleTeamCreated}
        />
      )}
    </>
  );
};

export default TeamSelectionModal;