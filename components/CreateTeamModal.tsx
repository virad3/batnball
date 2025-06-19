
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Team, UserProfile } from '../types';
import { createTeam, getAllUserProfilesForSuggestions, addUserToTeamAffiliation } from '../services/dataService';
import Button from './Button';
import { XMarkIcon, PlusIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: (newTeam: Team) => void;
}

type PlayerSuggestion = Pick<UserProfile, 'id' | 'username'>;
interface ModalPlayer {
  name: string;
  userId?: string; // UserProfile.id if selected from suggestions
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose, onTeamCreated }) => {
  const [teamName, setTeamName] = useState('');
  const [inputPlayerName, setInputPlayerName] = useState(''); // For the text input
  const [players, setPlayers] = useState<ModalPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false); // For initial profile fetch
  const [error, setError] = useState<string | null>(null);

  const [allUserProfiles, setAllUserProfiles] = useState<PlayerSuggestion[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPageLoading(true);
      const fetchProfiles = async () => {
        try {
          const profiles = await getAllUserProfilesForSuggestions();
          setAllUserProfiles(profiles);
        } catch (err) {
          console.error("Failed to fetch user profiles for suggestions:", err);
          setError("Could not load registered player list.");
        } finally {
          setPageLoading(false);
        }
      };
      fetchProfiles();
    } else {
      // Reset form state when modal closes
      setTeamName('');
      setInputPlayerName('');
      setPlayers([]);
      setError(null);
      setAllUserProfiles([]); // Clear profiles to ensure fresh fetch on reopen if needed
    }
  }, [isOpen]);

  const filteredAvailableProfiles = useMemo(() => {
    if (!inputPlayerName.trim()) {
      return allUserProfiles;
    }
    return allUserProfiles.filter(profile =>
      profile.username.toLowerCase().includes(inputPlayerName.toLowerCase())
    );
  }, [allUserProfiles, inputPlayerName]);

  const handleAddPlayerFromList = (profile: PlayerSuggestion) => {
    if (!players.some(p => p.userId === profile.id || p.name === profile.username)) {
      setPlayers(prevPlayers => [...prevPlayers, { name: profile.username, userId: profile.id }]);
      setError(null);
    } else {
      setError(`${profile.username} is already in the team or added.`);
    }
  };
  
  const handleAddPlayerFromInput = () => {
    const nameToAdd = inputPlayerName.trim();
    if (!nameToAdd) {
      setError("Player name cannot be empty.");
      return;
    }
    
    if (players.some(p => p.name.toLowerCase() === nameToAdd.toLowerCase())) {
      setError("This player is already in the list.");
      return;
    }

    const existingProfile = allUserProfiles.find(p => p.username.toLowerCase() === nameToAdd.toLowerCase());
    if (existingProfile) { // Matched a registered user
        if (!players.some(p => p.userId === existingProfile.id)) {
            setPlayers(prevPlayers => [...prevPlayers, { name: existingProfile.username, userId: existingProfile.id }]);
        } else {
             setError(`${existingProfile.username} (registered user) is already added.`);
             return;
        }
    } else { // Add as custom player
        setPlayers(prevPlayers => [...prevPlayers, { name: nameToAdd, userId: undefined }]);
    }
    
    setInputPlayerName('');
    setError(null);
  };


  const handleRemovePlayer = (playerToRemoveName: string) => {
    setPlayers(prevPlayers => prevPlayers.filter(player => player.name !== playerToRemoveName));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!teamName.trim()) {
      setError("Team name is required.");
      return;
    }
    if (players.length === 0) {
        setError("Please add at least one player to the team.");
        return;
    }

    setLoading(true);
    try {
      const playerNamesOnly = players.map(p => p.name);
      const newTeamData: Pick<Team, 'name' | 'players' | 'logoUrl'> = {
        name: teamName.trim(),
        players: playerNamesOnly,
        logoUrl: null, 
      };
      const createdTeam = await createTeam(newTeamData);
      
      const profileUpdatePromises = players
        .filter(player => player.userId) 
        .map(player => addUserToTeamAffiliation(player.userId!, createdTeam.id));
      
      await Promise.all(profileUpdatePromises);

      onTeamCreated(createdTeam);
      resetFormAndClose();
    } catch (err: any) {
      console.error("Failed to create team or update profiles:", err);
      setError(err.message || "Could not create team. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const resetFormAndClose = () => {
    setTeamName('');
    setInputPlayerName('');
    setPlayers([]);
    setError(null);
    setLoading(false);
    setPageLoading(false);
    onClose();
  };
  
  const handleClose = () => {
    resetFormAndClose();
  };


  if (!isOpen) return null;

  const inputBaseClass = "block w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm text-gray-100 placeholder-gray-400";
  const inputFocusClass = "focus:ring-red-500 focus:border-red-500";
  const inputClass = `${inputBaseClass} ${inputFocusClass}`;
  const labelClass = "block text-sm font-medium text-gray-200 mb-1";

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-team-modal-title"
    >
      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 id="create-team-modal-title" className="text-xl sm:text-2xl font-bold text-gray-50">
            Create New Team
          </h2>
          <button
            onClick={handleClose}
            aria-label="Close create team modal"
            className="p-1 text-gray-400 hover:text-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-4 bg-red-800 bg-opacity-40 border border-red-700 text-red-300 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 flex-grow overflow-y-auto pr-2 custom-scrollbar" id="create-team-form-modal">
          <div>
            <label htmlFor="teamNameModal" className={labelClass}>Team Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              id="teamNameModal"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              className={inputClass}
              placeholder="Enter team name"
              aria-required="true"
            />
          </div>

          {/* Player Input and List Section */}
          <div className="space-y-3">
            <div>
              <label htmlFor="inputPlayerNameModal" className={labelClass}>Add Player by Name (or filter list below)</label>
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  id="inputPlayerNameModal"
                  value={inputPlayerName}
                  onChange={(e) => setInputPlayerName(e.target.value)}
                  className={inputClass}
                  placeholder="Type name or pick from list"
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPlayerFromInput();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={handleAddPlayerFromInput} leftIcon={<PlusIcon className="w-5 h-5"/>} className="px-3" disabled={loading}>
                  Add
                </Button>
              </div>
            </div>

            <div className="mt-3 p-3 bg-gray-750 rounded-md border border-gray-650">
                <label className={`${labelClass} mb-2`}>Available Registered Players ({filteredAvailableProfiles.length})</label>
                {pageLoading ? <div className="py-4"><LoadingSpinner size="sm"/></div> :
                filteredAvailableProfiles.length > 0 ? (
                    <ul className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar-inner">
                        {filteredAvailableProfiles.map((profile) => {
                            const isAdded = players.some(p => p.userId === profile.id || p.name === profile.username);
                            return (
                                <li 
                                    key={profile.id} 
                                    className={`flex justify-between items-center p-2 rounded-md text-sm transition-colors ${
                                        isAdded ? 'bg-gray-600 text-gray-400' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                    }`}
                                >
                                    <span className="truncate">{profile.username}</span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={isAdded ? "outline" : "secondary"}
                                        onClick={() => handleAddPlayerFromList(profile)}
                                        disabled={isAdded || loading}
                                        leftIcon={!isAdded ? <UserPlusIcon className="w-4 h-4"/> : undefined}
                                        className="px-2 py-1 text-xs"
                                    >
                                        {isAdded ? 'Added' : 'Add to Team'}
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-400 italic py-2">
                        {inputPlayerName.trim() ? "No matching registered players found." : "No registered players available or all added."}
                    </p>
                )}
            </div>
          </div>
          
          {players.length > 0 && (
            <div className="space-y-2 p-3 bg-gray-700 rounded-md border border-gray-600">
              <h4 className="text-sm font-medium text-gray-300">Current Team Players ({players.length}):</h4>
              <ul className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar-inner">
                {players.map(player => (
                  <li key={player.name} className="flex justify-between items-center bg-gray-600 p-2 rounded-md text-sm text-gray-100">
                    <span className="truncate">{player.name}{player.userId && <span className="text-xs text-green-400 ml-1">(R)</span>}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(player.name)}
                      className="text-red-400 hover:text-red-300 p-0.5 rounded-full"
                      aria-label={`Remove ${player.name}`}
                      disabled={loading}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
           <style>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: #374151; /* gray-700 */
                border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #4b5563; /* gray-600 */
                border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #6b7280; /* gray-500 */
            }
            .custom-scrollbar-inner::-webkit-scrollbar {
                width: 4px;
            }
            .custom-scrollbar-inner::-webkit-scrollbar-track {
                background: #4b5563; /* gray-600 */
                 border-radius: 2px;
            }
            .custom-scrollbar-inner::-webkit-scrollbar-thumb {
                background: #9ca3af; /* gray-400 */
                 border-radius: 2px;
            }
            .custom-scrollbar-inner::-webkit-scrollbar-thumb:hover {
                background: #d1d5db; /* gray-300 */
            }
            `}</style>
        </form>
        
        <div className="mt-8 pt-5 border-t border-gray-700 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0">
          <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="create-team-form-modal" isLoading={loading} disabled={loading || !teamName.trim() || players.length === 0} className="w-full sm:w-auto" variant="primary">
            {loading ? 'Creating Team...' : 'Create Team'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateTeamModal;