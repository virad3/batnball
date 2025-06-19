
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Team, UserProfile } from '../types';
import { getTeamsByUserId, deleteTeam, getTeamsInfoByIds } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import TeamCard from '../components/TeamCard';
import CreateTeamModal from '../components/CreateTeamModal';
import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const MyTeamsPage: React.FC = () => {
  const [ownedTeams, setOwnedTeams] = useState<Team[]>([]);
  const [affiliatedTeamInfos, setAffiliatedTeamInfos] = useState<Array<Pick<Team, 'id' | 'name'>>>([]);
  const [loadingOwned, setLoadingOwned] = useState(true);
  const [loadingAffiliated, setLoadingAffiliated] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const navigate = useNavigate();
  const { userProfile, loading: authLoading } = useAuth();

  const fetchOwnedTeams = useCallback(async () => {
    setLoadingOwned(true);
    setError(null);
    try {
      const userTeams = await getTeamsByUserId();
      setOwnedTeams(userTeams);
    } catch (err: any) {
      console.error("Failed to fetch owned teams:", err);
      setError(prevError => prevError ? `${prevError}\nCould not load your owned teams.` : "Could not load your owned teams.");
    } finally {
      setLoadingOwned(false);
    }
  }, []);

  const fetchAffiliatedTeams = useCallback(async () => {
    if (authLoading || !userProfile) {
      // Wait for auth context to load or if userProfile is null
      if (!authLoading) setLoadingAffiliated(false); // If auth is done and no profile, stop loading affiliated
      return;
    }

    setLoadingAffiliated(true);
    if (userProfile.teamIds && userProfile.teamIds.length > 0) {
      try {
        const teamInfos = await getTeamsInfoByIds(userProfile.teamIds);
        setAffiliatedTeamInfos(teamInfos);
      } catch (err: any) {
        console.error("Failed to fetch affiliated teams:", err);
        setError(prevError => prevError ? `${prevError}\nCould not load affiliated teams.` : "Could not load affiliated teams.");
      }
    } else {
      setAffiliatedTeamInfos([]); // No affiliated teams
    }
    setLoadingAffiliated(false);
  }, [userProfile, authLoading]);

  useEffect(() => {
    fetchOwnedTeams();
  }, [fetchOwnedTeams]);

  useEffect(() => {
    fetchAffiliatedTeams();
  }, [fetchAffiliatedTeams]);

  const handleDeleteTeam = async (teamId: string) => {
    if (window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      try {
        await deleteTeam(teamId);
        setOwnedTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
        // Also remove from affiliated if it was there (though typically it shouldn't be managed from both)
        setAffiliatedTeamInfos(prevInfos => prevInfos.filter(info => info.id !== teamId));
      } catch (err: any) {
        console.error("Failed to delete team:", err);
        setError(err.message || "Could not delete the team. Please try again.");
      }
    }
  };

  const handleViewTeam = (teamId: string) => {
    navigate(`/teams/${teamId}`);
  };

  const handleTeamCreated = () => {
    setIsCreateModalOpen(false);
    fetchOwnedTeams(); // Refresh owned teams
    // Potentially refresh affiliated teams too, if creating a team and adding self as member immediately updates profile.
    // For now, only refreshing owned teams.
  };

  const displayedAffiliatedTeams = affiliatedTeamInfos.filter(
    affTeam => !ownedTeams.some(ownedTeam => ownedTeam.id === affTeam.id)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-50 mb-4 sm:mb-0">My Teams</h1>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} leftIcon={<PlusIcon className="w-5 h-5 mr-2" />}>
          Create New Team
        </Button>
      </div>

      {error && (
        <div role="alert" className="bg-red-800 bg-opacity-50 border border-red-700 text-red-300 px-4 py-3 rounded-md text-sm whitespace-pre-line">
          {error}
        </div>
      )}

      {/* Teams I Own/Manage Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-100 mb-4 border-b border-gray-700 pb-2">Teams I Own/Manage</h2>
        {loadingOwned ? (
          <div className="flex justify-center items-center py-10"><LoadingSpinner size="md" /></div>
        ) : ownedTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ownedTeams.map(team => (
              <TeamCard 
                key={team.id} 
                team={team} 
                onDelete={handleDeleteTeam} 
                onViewPlayers={handleViewTeam} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-800 rounded-lg shadow-md border border-gray-700">
            <UserGroupIcon className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
            <p className="text-gray-300">You haven't created or taken ownership of any teams yet.</p>
            <p className="text-gray-400 mt-1 text-sm">Use the "Create New Team" button to get started.</p>
          </div>
        )}
      </section>

      {/* Teams I'm Part Of Section */}
      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-gray-100 mb-4 border-b border-gray-700 pb-2">Teams I'm Part Of</h2>
        {authLoading || loadingAffiliated ? (
          <div className="flex justify-center items-center py-10"><LoadingSpinner size="md" /></div>
        ) : displayedAffiliatedTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedAffiliatedTeams.map(teamInfo => {
              // Create a partial Team object for TeamCard compatibility
              const partialTeamForCard: Partial<Team> & Pick<Team, 'id' | 'name'> = {
                id: teamInfo.id,
                name: teamInfo.name,
                players: [], // Placeholder, TeamCard might show "0 Players" or adapt if it only needs count for display
                logoUrl: `https://picsum.photos/seed/${teamInfo.id}/200/150`, // Generic placeholder
              };
              return (
                <TeamCard 
                  key={teamInfo.id} 
                  team={partialTeamForCard as Team} // Cast as Team, ensure TeamCard handles potentially missing fields gracefully
                  onViewPlayers={handleViewTeam}
                  // No onDelete prop passed, so delete button won't show (if TeamCard is updated)
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-800 rounded-lg shadow-md border border-gray-700">
             <UserGroupIcon className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
            <p className="text-gray-300">You are not yet a member of any other teams.</p>
            <p className="text-gray-400 mt-1 text-sm">Teams you join will appear here.</p>
          </div>
        )}
      </section>

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
