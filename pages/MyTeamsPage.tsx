
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Team } from '../types';
import { getTeamsByUserId, deleteTeam } from '../services/dataService';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import TeamCard from '../components/TeamCard';
import CreateTeamModal from '../components/CreateTeamModal';
import { PlusIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

const MyTeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userTeams = await getTeamsByUserId();
      setTeams(userTeams);
    } catch (err: any) {
      console.error("Failed to fetch teams:", err);
      setError(err.message || "Could not load your teams. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleDeleteTeam = async (teamId: string) => {
    if (window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      try {
        await deleteTeam(teamId);
        setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
      } catch (err: any) {
        console.error("Failed to delete team:", err);
        setError(err.message || "Could not delete the team. Please try again.");
      }
    }
  };

  const handleViewPlayers = (teamId: string) => {
    navigate(`/teams/${teamId}`);
  };

  const handleTeamCreated = () => {
    setIsCreateModalOpen(false);
    fetchTeams(); // Refresh the list of teams
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-50 mb-4 sm:mb-0">My Teams</h1>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} leftIcon={<PlusIcon className="w-5 h-5 mr-2" />}>
          Create New Team
        </Button>
      </div>

      {error && (
        <div role="alert" className="bg-red-800 bg-opacity-50 border border-red-700 text-red-300 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-10"><LoadingSpinner size="lg" /></div>
      ) : teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <TeamCard 
              key={team.id} 
              team={team} 
              onDelete={handleDeleteTeam} 
              onViewPlayers={handleViewPlayers} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-800 rounded-lg shadow-md border border-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-gray-500 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-3.741-1.54M18 18.72v-3.77a9.094 9.094 0 013.741-.479 3 3 0 013.741 1.54M18 18.72L18.75 21m-4.75-2.28a9.094 9.094 0 003.741-.479 3 3 0 00-3.741-1.54M13.25 18.72v-3.77a9.094 9.094 0 013.741-.479 3 3 0 013.741 1.54M13.25 18.72L13.25 21M6.75 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-3.741-1.54M6.75 18.72v-3.77a9.094 9.094 0 013.741-.479 3 3 0 013.741 1.54M6.75 18.72L6.75 21m-3.75-2.28a9.094 9.094 0 003.741-.479 3 3 0 00-3.741-1.54M3 18.72v-3.77a9.094 9.094 0 013.741-.479 3 3 0 013.741 1.54M3 18.72L3.75 21m-3.75 0h.008v.015h-.008V21z" />
          </svg>
          <p className="text-xl font-semibold text-gray-300 mb-2">No teams created yet.</p>
          <p className="text-gray-400 mb-6">Get started by creating your first team!</p>
          <Button variant="secondary" onClick={() => setIsCreateModalOpen(true)} leftIcon={<PlusIcon className="w-5 h-5 mr-2" />}>
            Create a Team
          </Button>
        </div>
      )}

      {isCreateModalOpen && (
        <CreateTeamModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onTeamCreated={handleTeamCreated}
        />
      )}
    </div>
  );
};

export default MyTeamsPage;
