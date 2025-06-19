
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate for v7
import { Team, UserProfile } from '../types';
import { getTeamsByUserId, getTeamById, getFullUserProfile } from '../services/dataService'; 
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import TeamCard from '../components/TeamCard';
import CreateTeamModal from '../components/CreateTeamModal';
import { PlusIcon, UserGroupIcon, QrCodeIcon as QrCodeIconOutline } from '@heroicons/react/24/outline'; 
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../services/firebaseClient';


interface ProcessedTeamForCard {
  id: string;
  logoUrl?: string | null;
  teamName: string;
  location?: string; 
  ownerName?: string;
  isOwnerByCurrentUser: boolean;
  rawTeamObject: Team; 
}

const MyTeamsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my' | 'opponents' | 'following'>('my');
  const [myTeamsList, setMyTeamsList] = useState<ProcessedTeamForCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const navigate = useNavigate(); // v7 hook
  const { user: authUser, userProfile, loading: authLoading } = useAuth();

  const fetchMyTeamsData = useCallback(async () => {
    if (authLoading || !authUser || !userProfile) {
      if (!authLoading) setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Fetch owned teams
      const ownedTeamsRaw = await getTeamsByUserId();
      
      // 2. Fetch affiliated teams (user is a member but not necessarily owner)
      let affiliatedTeamsRaw: Team[] = [];
      if (userProfile.teamIds && userProfile.teamIds.length > 0) {
        const affiliatedIdsToFetch = userProfile.teamIds.filter(id => !ownedTeamsRaw.some(ot => ot.id === id));
        
        if (affiliatedIdsToFetch.length > 0) {
            const teamsQuery = query(collection(db, 'teams'), where(documentId(), 'in', affiliatedIdsToFetch));
            const affiliatedSnapshot = await getDocs(teamsQuery);
            affiliatedTeamsRaw = affiliatedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
        }
      }

      // 3. Combine owned and affiliated teams, ensuring uniqueness
      const allUserRelatedTeamsMap = new Map<string, Team>();
      ownedTeamsRaw.forEach(team => allUserRelatedTeamsMap.set(team.id, team));
      affiliatedTeamsRaw.forEach(team => {
        if (!allUserRelatedTeamsMap.has(team.id)) { 
            allUserRelatedTeamsMap.set(team.id, team);
        }
      });
      const allUserRelatedTeams = Array.from(allUserRelatedTeamsMap.values());


      // 4. Fetch owner profiles for all these teams
      const ownerIds = new Set<string>(allUserRelatedTeams.map(team => team.user_id).filter(id => !!id));
      const ownerProfilesMap = new Map<string, UserProfile>();

      if (ownerIds.size > 0) {
        for (const ownerId of Array.from(ownerIds)) {
          if (!ownerProfilesMap.has(ownerId)) {
            const profile = await getFullUserProfile(ownerId);
            if (profile) {
              ownerProfilesMap.set(ownerId, profile);
            }
          }
        }
      }
      
      // 5. Process teams for card display
      const processedList: ProcessedTeamForCard[] = allUserRelatedTeams.map(team => {
        const isOwner = team.user_id === authUser.uid;
        const ownerProfile = ownerProfilesMap.get(team.user_id);
        
        return {
          id: team.id,
          logoUrl: team.logoUrl,
          teamName: team.name,
          location: "Location N/A", 
          ownerName: ownerProfile?.username || (isOwner ? userProfile.username : "Unknown Owner"),
          isOwnerByCurrentUser: isOwner,
          rawTeamObject: team,
        };
      });

      setMyTeamsList(processedList.sort((a,b) => a.teamName.localeCompare(b.teamName)));

    } catch (err: any) {
      console.error("Failed to fetch teams data:", err);
      setError("Could not load your teams. " + err.message);
    } finally {
      setLoading(false);
    }
  }, [authUser, userProfile, authLoading]);

  useEffect(() => {
    if (activeTab === 'my') {
      fetchMyTeamsData();
    } else {
      setLoading(false); 
    }
  }, [activeTab, fetchMyTeamsData]);

  const handleTeamCreated = () => {
    setIsCreateModalOpen(false);
    if (activeTab === 'my') {
      fetchMyTeamsData(); 
    }
  };

  const handleTeamCardClick = (team: ProcessedTeamForCard) => {
    navigate(`/teams/${team.id}`); 
  };

  const TabButton: React.FC<{tabKey: 'my' | 'opponents' | 'following', label: string}> = ({ tabKey, label }) => (
    <button
      onClick={() => setActiveTab(tabKey)}
      className={`py-3 px-4 sm:px-6 text-sm sm:text-base font-medium transition-colors duration-150 ease-in-out focus:outline-none
        ${activeTab === tabKey 
          ? 'border-b-2 border-red-600 text-red-500 bg-gray-800' 
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'
        }
      `}
      role="tab"
      aria-selected={activeTab === tabKey}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center border border-gray-700">
        <p className="text-gray-100 text-sm sm:text-base">Want to create a new team?</p>
        <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)} leftIcon={<PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />}>
          CREATE
        </Button>
      </div>

      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-2 sm:space-x-4" aria-label="Tabs" role="tablist">
          <TabButton tabKey="my" label="My" />
          <TabButton tabKey="opponents" label="Opponents" />
          <TabButton tabKey="following" label="Following" />
        </nav>
      </div>

      {error && (
        <div role="alert" className="bg-red-800 bg-opacity-50 border border-red-700 text-red-300 px-4 py-3 rounded-md text-sm whitespace-pre-line">
          {error}
        </div>
      )}

      {loading && activeTab === 'my' && (
        <div className="flex justify-center items-center py-10"><LoadingSpinner size="lg" /></div>
      )}

      {!loading && activeTab === 'my' && (
        myTeamsList.length > 0 ? (
          <div className="space-y-4">
            {myTeamsList.map(team => (
              <TeamCard 
                key={team.id} 
                teamName={team.teamName}
                logoUrl={team.logoUrl}
                location={team.location}
                ownerName={team.ownerName}
                isOwnerByCurrentUser={team.isOwnerByCurrentUser}
                onTeamClick={() => handleTeamCardClick(team)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-800 rounded-lg shadow-md border border-gray-700">
            <UserGroupIcon className="w-20 h-20 text-gray-500 mx-auto mb-4 opacity-50" />
            <p className="text-gray-300 text-lg">No teams to display.</p>
            <p className="text-gray-400 mt-1 text-sm">Create a team or join one, and it will appear here.</p>
          </div>
        )
      )}

      {activeTab === 'opponents' && (
        <div className="text-center py-10 bg-gray-800 rounded-lg shadow-md border border-gray-700">
          <UserGroupIcon className="w-20 h-20 text-gray-500 mx-auto mb-4 opacity-50" />
          <p className="text-gray-300 text-lg">Opponent Team Tracking</p>
          <p className="text-gray-400 mt-1 text-sm">This feature is coming soon!</p>
        </div>
      )}

      {activeTab === 'following' && (
        <div className="text-center py-10 bg-gray-800 rounded-lg shadow-md border border-gray-700">
          <UserGroupIcon className="w-20 h-20 text-gray-500 mx-auto mb-4 opacity-50" />
          <p className="text-gray-300 text-lg">Following Teams</p>
          <p className="text-gray-400 mt-1 text-sm">This feature is coming soon!</p>
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
